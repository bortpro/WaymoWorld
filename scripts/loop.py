# /// script
# requires-python = ">=3.10"
# dependencies = ["google-genai", "python-dotenv", "playwright", "imageio[ffmpeg]", "numpy", "pillow"]
# ///
"""Render -> critique -> fix loop for Waymo World, with Gemini 4 Argon as critic and builder.

Each iteration:
  1. RENDER  the current best game with a fixed scripted drive (video, shots, console, telemetry)
  2. CRITIC  a fresh Argon call that never sees code scores it against a fixed rubric,
             comparing to held-out real SF Waymo camera frames
  3. BUILDER Argon gets code + critique + K SF reference frames, returns SEARCH/REPLACE edits
  4. JUDGE   the candidate is rendered + critiqued; kept only if the score improves and
             console errors don't increase, otherwise reverted

Usage:
  uv run scripts/loop.py --start out/baseline_v0 --run out/run_k3 --iters 3 --k 3
"""
import argparse
import json
import os
import re
import shutil
import time
from pathlib import Path

from google.genai import types

from argon import client
from render import DRIVE, render

GOAL = (
    'Waymo World: a realistic street world of San Francisco where you control a Waymo, in a world '
    "full of other Waymos, and they all play laser tag with each other. A fun, realistic 3D game."
)

WAYMO_CAR = (
    "A Waymo robotaxi is a white Jaguar I-PACE (compact electric SUV with a sloped coupe roofline), "
    "with a tall cylindrical spinning lidar dome on the roof centre, smaller sensor pods on the four "
    "corners/front fenders and mirrors, and the small 'Waymo' logo on the doors."
)

RUBRIC = {
    "waymo_look": "Player and opponent cars clearly read as Waymo robotaxis (see description).",
    "sf_realism": "Streets look like San Francisco, matching the real reference photos: steep hills, "
                  "Victorian/Edwardian row houses, bay windows, street trees, overhead wires, lighting.",
    "laser_tag_fun": "Laser tag is visible and satisfying: beams, hits register, opponents move and fight back.",
    "driving_feel": "Driving responds to inputs, the car moves through the city and doesn't get stuck.",
    "visual_polish": "Overall visual quality: lighting, materials, composition, HUD clarity, no glitches.",
}

CRITIC_SYSTEM = f"""You are a demanding game critic and QA tester. You never see source code.
You judge a browser game against this goal:
{GOAL}

Waymo car reference: {WAYMO_CAR}

Score each rubric criterion 1-10 (10 = indistinguishable from a polished AAA game / real SF):
{json.dumps(RUBRIC, indent=1)}

You receive: a video of a fixed scripted test drive (inputs listed), screenshots, console errors,
in-game telemetry if the game exposes it, and REAL photos from Waymo cameras driving in SF.
Be concrete: cite timestamps or screenshot numbers as evidence. Rank issues by impact on the goal."""

CRITIC_SCHEMA = {
    "type": "object",
    "properties": {
        "scores": {"type": "object", "properties": {k: {"type": "integer"} for k in RUBRIC}, "required": list(RUBRIC)},
        "summary": {"type": "string"},
        "top_issues": {
            "type": "array",
            "items": {
                "type": "object",
                "properties": {
                    "criterion": {"type": "string"},
                    "issue": {"type": "string"},
                    "evidence": {"type": "string"},
                    "fix_hint": {"type": "string"},
                },
                "required": ["criterion", "issue", "evidence", "fix_hint"],
            },
        },
    },
    "required": ["scores", "summary", "top_issues"],
}

BUILDER_SYSTEM = f"""You are an expert three.js game developer improving a single-file browser game.
Goal: {GOAL}
Waymo car reference: {WAYMO_CAR}

Rules:
- Fix the critic's top issues, most impactful first. Keep everything that already works.
- The game must stay ONE self-contained index.html; three.js only from the pinned jsdelivr import map.
  No external assets: build geometry and textures procedurally. Use the reference photos for shapes,
  colours, proportions and lighting.
- Maintain a live global `window.__waymo` object, updated every frame, with at least:
  {{player: {{x, y, z, speed}}, enemiesVisible, enemiesTotal, tags, lasersFired, fps, stuck}}.
- Respond with edits ONLY, in this exact format (SEARCH must match the current file exactly,
  include enough lines to be unique, no line numbers):

<<<<<<< SEARCH
exact existing lines
=======
replacement lines
>>>>>>> REPLACE

- Prefer several focused edits. Only if a near-total rewrite is unavoidable, instead return the whole
  file in a single ```html block."""

EDIT_RE = re.compile(r"<<<<<<< SEARCH\n(.*?)\n?=======\n(.*?)\n?>>>>>>> REPLACE", re.S)
SF_SEGMENTS = Path("data/sf_segments.txt")


def img_part(path: Path) -> types.Part:
    mime = "image/png" if path.suffix == ".png" else "image/jpeg"
    return types.Part.from_bytes(data=path.read_bytes(), mime_type=mime)


def sf_frames(images_dir: Path, camera: str = "FRONT") -> dict[str, list[Path]]:
    """SF segment -> its frames for one camera, from extracted Waymo images."""
    sf = {l.split("\t")[0] for l in SF_SEGMENTS.read_text().splitlines()} if SF_SEGMENTS.exists() else set()
    out = {}
    for seg_dir in sorted(images_dir.glob("*")):
        if seg_dir.name in sf:
            frames = sorted(seg_dir.glob(f"*_{camera}.jpg"))
            if frames:
                out[seg_dir.name] = frames
    return out


def pick_refs(by_seg: dict[str, list[Path]], k: int) -> list[Path]:
    """Round-robin across segments, evenly spaced within each, for diverse references."""
    if k <= 0 or not by_seg:
        return []
    segs = list(by_seg)
    per = [k // len(segs) + (1 if i < k % len(segs) else 0) for i in range(len(segs))]
    picks = []
    for seg, n in zip(segs, per):
        frames = by_seg[seg]
        picks += [frames[int((j + 0.5) * len(frames) / n)] for j in range(n)] if n else []
    return picks[:k]


def split_refs(images_dir: Path, k: int, n_holdout: int):
    """Builder refs and held-out critic refs come from different segments
    (or, with a single segment, from its first 60% vs last 40% of the drive)."""
    by_seg = sf_frames(images_dir)
    if not by_seg:
        return [], []
    if len(by_seg) == 1:
        (seg, frames), = by_seg.items()
        cut = int(len(frames) * 0.6)
        return pick_refs({seg: frames[:cut]}, k), pick_refs({seg: frames[cut:]}, n_holdout)
    holdout_segs = list(by_seg)[:1] if len(by_seg) > 1 else []
    critic = pick_refs({s: by_seg[s] for s in holdout_segs}, n_holdout)
    builder = pick_refs({s: f for s, f in by_seg.items() if s not in holdout_segs}, k)
    return builder, critic


def critique(c, model, game_dir: Path, rendered: dict, critic_refs: list[Path]) -> dict:
    drive = "Scripted inputs (in order): " + "; ".join(
        f"{'+'.join(k) or 'none'} for {s}s" for k, s, _ in DRIVE
    )
    parts = [types.Part.from_text(text=f"{drive}\nGameplay video:"),
             types.Part.from_bytes(data=(game_dir / "play.mp4").read_bytes(), mime_type="video/mp4")]
    for i, name in enumerate(rendered["shots"]):
        parts += [types.Part.from_text(text=f"Screenshot {i} ({name}):"), img_part(game_dir / name)]
    if critic_refs:
        parts.append(types.Part.from_text(text="REAL San Francisco photos from Waymo cameras (realism target):"))
        parts += [img_part(p) for p in critic_refs]
    parts.append(types.Part.from_text(text=(
        f"Console errors: {json.dumps(rendered['errors'][:20])}\n"
        f"Telemetry per input step: {json.dumps(rendered['telemetry'])[:4000]}\n"
        "Score the game and list the top 5 issues."
    )))
    resp = c.models.generate_content(
        model=model,
        contents=parts,
        config=types.GenerateContentConfig(
            system_instruction=CRITIC_SYSTEM,
            media_resolution=types.MediaResolution.MEDIA_RESOLUTION_LOW,
            response_mime_type="application/json",
            response_schema=CRITIC_SCHEMA,
            temperature=0.2,
        ),
    )
    result = json.loads(resp.text)
    result["total"] = sum(result["scores"].values())
    result["usage"] = {"in": resp.usage_metadata.prompt_token_count, "out": resp.usage_metadata.candidates_token_count}
    return result


def apply_edits(html: str, response: str) -> tuple[str, int, int]:
    full = re.search(r"```html\s*\n(.*?)```", response, re.S)
    edits = EDIT_RE.findall(response)
    if not edits and full:
        return full.group(1), 1, 1
    applied = 0
    for old, new in edits:
        if old and html.count(old) == 1:
            html = html.replace(old, new)
            applied += 1
    return html, applied, len(edits)


def build(c, model, html: str, crit: dict, builder_refs: list[Path], notes: list[str]) -> tuple[str, str, dict]:
    parts = []
    if builder_refs:
        parts.append(types.Part.from_text(text="Reference photos of real San Francisco streets from Waymo cameras:"))
        parts += [img_part(p) for p in builder_refs]
    parts.append(types.Part.from_text(text=(
        f"Critic report:\n{json.dumps({k: crit[k] for k in ('scores', 'summary', 'top_issues')}, indent=1)}\n\n"
        + (f"Notes from previous attempts:\n- " + "\n- ".join(notes[-5:]) + "\n\n" if notes else "")
        + f"Current index.html:\n```html\n{html}\n```"
    )))
    resp = c.models.generate_content(
        model=model,
        contents=parts,
        config=types.GenerateContentConfig(
            system_instruction=BUILDER_SYSTEM,
            media_resolution=types.MediaResolution.MEDIA_RESOLUTION_MEDIUM,
            max_output_tokens=200_000,
        ),
    )
    text = resp.text or ""
    new_html, applied, total = apply_edits(html, text)
    usage = {"in": resp.usage_metadata.prompt_token_count, "out": resp.usage_metadata.candidates_token_count,
             "edits_applied": applied, "edits_total": total}
    return new_html, text, usage


def evaluate(c, model, game_dir: Path, critic_refs) -> tuple[dict, dict]:
    rendered = render(game_dir)
    if rendered["failed"]:
        crit = {"scores": {k: 0 for k in RUBRIC}, "total": 0, "failed": rendered["failed"],
                "summary": f"Game failed to render: {rendered['failed']}", "top_issues": []}
        crit["errors"] = len(rendered["errors"])
        (game_dir / "critique.json").write_text(json.dumps(crit, indent=2))
        return rendered, crit
    crit = critique(c, model, game_dir, rendered, critic_refs)
    crit["errors"] = len(rendered["errors"])
    (game_dir / "critique.json").write_text(json.dumps(crit, indent=2))
    return rendered, crit


def main():
    p = argparse.ArgumentParser()
    p.add_argument("--start", type=Path, default=Path("out/baseline_v0"))
    p.add_argument("--run", type=Path)
    p.add_argument("--eval-only", type=Path, help="just render + critique this game dir")
    p.add_argument("--iters", type=int, default=3)
    p.add_argument("--k", type=int, default=3, help="SF reference frames for the builder")
    p.add_argument("--holdout", type=int, default=5, help="held-out SF frames for the critic")
    p.add_argument("--images", type=Path, default=Path("data/images"))
    a = p.parse_args()

    c = client()
    model = os.environ.get("GEMINI_MODEL", "gemini-4-argon")
    builder_refs, critic_refs = split_refs(a.images, a.k, a.holdout)
    if a.eval_only:
        _, crit = evaluate(c, model, a.eval_only, critic_refs)
        print(json.dumps({k: crit[k] for k in ("scores", "total", "errors", "summary")}, indent=1))
        return
    a.run.mkdir(parents=True, exist_ok=True)
    (a.run / "refs.json").write_text(json.dumps(
        {"builder": [str(p) for p in builder_refs], "critic": [str(p) for p in critic_refs]}, indent=1))
    print(f"builder refs: {len(builder_refs)}, critic refs: {len(critic_refs)}")

    best_dir = a.run / "iter_0"
    best_dir.mkdir(exist_ok=True)
    shutil.copy(a.start / "index.html", best_dir / "index.html")
    _, best = evaluate(c, model, best_dir, critic_refs)
    if best.get("failed"):
        raise SystemExit(f"starting game failed to render: {best['failed']}")
    history = [{"iter": 0, "accepted": True, "total": best["total"], "scores": best["scores"], "errors": best["errors"]}]
    print(f"iter 0: total {best['total']} {best['scores']} errors {best['errors']}")
    notes = []

    for i in range(1, a.iters + 1):
        t0 = time.time()
        cand_dir = a.run / f"iter_{i}"
        cand_dir.mkdir(exist_ok=True)
        html, raw, usage = build(c, model, (best_dir / "index.html").read_text(), best, builder_refs, notes)
        (cand_dir / "builder_response.md").write_text(raw)
        (cand_dir / "index.html").write_text(html)
        if usage["edits_applied"] == 0:
            notes.append(f"iter {i}: none of your {usage['edits_total']} edits matched the file exactly; copy SEARCH text verbatim.")
            history.append({"iter": i, "accepted": False, "reason": "no edits applied", **usage})
            print(f"iter {i}: rejected, no edits applied ({usage})")
            continue

        _, crit = evaluate(c, model, cand_dir, critic_refs)
        improved = crit["total"] > best["total"] and crit["errors"] <= best["errors"]
        entry = {"iter": i, "accepted": improved, "total": crit["total"], "scores": crit["scores"],
                 "errors": crit["errors"], "seconds": round(time.time() - t0), **usage}
        history.append(entry)
        if improved:
            best_dir, best = cand_dir, crit
            notes.append(f"iter {i}: accepted (score {crit['total']}).")
        elif crit.get("failed"):
            notes.append(f"iter {i}: REVERTED, the page failed to load/run in the browser ({crit['failed']}). "
                         "Avoid heavy synchronous work at startup and infinite loops.")
        else:
            worse = [k for k in RUBRIC if crit["scores"][k] < best["scores"][k]]
            notes.append(f"iter {i}: REVERTED (score {crit['total']} vs best {best['total']}, errors "
                         f"{crit['errors']}). Got worse on: {', '.join(worse) or 'nothing specific'}. Try a different fix.")
        print(f"iter {i}: {'ACCEPT' if improved else 'revert'} total {crit['total']} {crit['scores']} "
              f"errors {crit['errors']} edits {usage['edits_applied']}/{usage['edits_total']} {entry['seconds']}s")
        (a.run / "history.json").write_text(json.dumps(history, indent=2))

    (a.run / "history.json").write_text(json.dumps(history, indent=2))
    (a.run / "best.txt").write_text(best_dir.name)
    print(f"best: {best_dir} total {best['total']}")


if __name__ == "__main__":
    main()
