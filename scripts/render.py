# /// script
# requires-python = ">=3.10"
# dependencies = ["playwright", "imageio[ffmpeg]", "numpy", "pillow"]
# ///
"""Render a generated game headlessly with a fixed scripted drive.

Saves shot_*.png, play.mp4 (frames captured during the drive) and console.json into the game's dir.

Usage:
  uv run scripts/render.py out/baseline_v0
"""
import argparse
import base64
import io
import json
from pathlib import Path

import imageio.v2 as imageio
import numpy as np
from PIL import Image
from playwright.sync_api import Error as PlaywrightError, sync_playwright

# Same inputs for every version so scores are comparable: (keys held, seconds, screenshot after?)
DRIVE = [
    ([], 1.0, True),
    (["w"], 3.0, True),
    (["w", "a"], 1.5, False),
    (["w", " "], 2.0, True),
    (["w", "d"], 1.5, False),
    (["w", "Shift", " "], 2.0, True),
    ([" "], 2.0, True),
]
VIEWPORT = {"width": 1280, "height": 720}
# Never join the live multiplayer server from test renders: point it at a dead local port.
QUERY = "?server=ws://127.0.0.1:9/ws"
# Seeded Math.random so the same code gives the same world/bots/spawns on every render.
SEED_RANDOM = """
(() => {
  let a = 0x9E3779B9;
  Math.random = function () {
    a |= 0; a = (a + 0x6D2B79F5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
})();
"""
CDN_CACHE = Path(__file__).resolve().parent.parent / ".cache" / "cdn"


def serve_cdn_from_cache(route):
    """Serve CDN files (three.js etc.) from a local cache so slow networks don't stall renders."""
    url = route.request.url
    path = CDN_CACHE / url.split("://", 1)[1]
    if not path.is_file():
        resp = route.fetch(timeout=120_000)
        if not resp.ok:
            return route.fulfill(response=resp)
        path.parent.mkdir(parents=True, exist_ok=True)
        path.write_bytes(resp.body())
    ctype = "application/javascript" if path.suffix in (".js", ".mjs") else None
    route.fulfill(body=path.read_bytes(), content_type=ctype, headers={"Access-Control-Allow-Origin": "*"})
VIDEO_FPS = 10


def start_screencast(page, frames):
    """Stream rendered frames via CDP; much faster than repeated screenshots."""
    cdp = page.context.new_cdp_session(page)

    def on_frame(ev):
        frames.append((ev["metadata"]["timestamp"], ev["data"]))
        cdp.send("Page.screencastFrameAck", {"sessionId": ev["sessionId"]})

    cdp.on("Page.screencastFrame", on_frame)
    cdp.send("Page.startScreencast", {"format": "jpeg", "quality": 70, "maxWidth": 640, "maxHeight": 360})
    return cdp


def write_video(frames, path):
    """Resample variable-rate screencast frames to a constant-fps mp4."""
    if not frames:
        return 0
    t0, t1 = frames[0][0], frames[-1][0]
    decoded = [np.asarray(Image.open(io.BytesIO(base64.b64decode(d))).convert("RGB").resize((640, 360))) for _, d in frames]
    out, j = [], 0
    for i in range(int((t1 - t0) * VIDEO_FPS) + 1):
        t = t0 + i / VIDEO_FPS
        while j + 1 < len(frames) and frames[j + 1][0] <= t:
            j += 1
        out.append(decoded[j])
    imageio.mimwrite(path, out, fps=VIDEO_FPS, codec="libx264", quality=6, macro_block_size=8)
    return len(frames)


def render(game_dir: Path) -> dict:
    game_dir = Path(game_dir)
    page_path = (game_dir / "index.html").resolve()
    logs, shots, frames, telemetry = [], [], [], []
    failed = None
    stage = "launch"

    with sync_playwright() as pw:
        browser = pw.chromium.launch(
            channel="chrome", headless=True,
            args=["--use-angle=swiftshader", "--enable-unsafe-swiftshader"],
        )
        page = browser.new_page(viewport=VIEWPORT)
        page.set_default_timeout(15000)
        page.add_init_script(SEED_RANDOM)
        page.route("https://cdn.jsdelivr.net/**", serve_cdn_from_cache)
        page.route("https://unpkg.com/**", serve_cdn_from_cache)
        try:
            page.on("console", lambda m: logs.append({"type": m.type, "text": m.text}))
            page.on("pageerror", lambda e: logs.append({"type": "pageerror", "text": str(e)}))
            stage = "load"
            page.goto(page_path.as_uri() + QUERY, wait_until="commit")
            page.wait_for_load_state("load", timeout=90_000)  # first fetch of new CDN addons can be slow
            page.wait_for_timeout(3000)
            stage = "start screenshot"
            page.screenshot(path=str(game_dir / "shot_start.png"))
            shots.append("shot_start.png")

            stage = "start button"
            # Dismiss start screens.
            buttons = page.locator("button:visible")
            if buttons.count():
                buttons.first.click()
            else:
                page.mouse.click(640, 360)
            page.wait_for_timeout(1000)
            page.keyboard.press("Enter")
            cdp = start_screencast(page, frames)

            for step, (keys, seconds, snap) in enumerate(DRIVE):
                stage = f"drive step {step}"
                for k in keys:
                    page.keyboard.down(k)
                page.wait_for_timeout(seconds * 1000)
                for k in keys:
                    page.keyboard.up(k)
                state = page.evaluate("() => { try { return JSON.parse(JSON.stringify(window.__waymo ?? null)); } catch (e) { return null; } }")
                telemetry.append({"keys": keys, "state": state})
                if snap:
                    name = f"shot_{len(shots)}.png"
                    page.screenshot(path=str(game_dir / name))
                    shots.append(name)
            cdp.send("Page.stopScreencast")
        except PlaywrightError as e:
            # Hung or crashed page (e.g. infinite loop on load): report instead of raising.
            failed = f"{stage}: " + str(e).splitlines()[0][:300]
        finally:
            browser.close()

    n_frames = write_video(frames, game_dir / "play.mp4")
    (game_dir / "console.json").write_text(json.dumps(logs, indent=1))
    (game_dir / "telemetry.json").write_text(json.dumps(telemetry, indent=1))
    errors = [l["text"] for l in logs if l["type"] in ("error", "pageerror") and "ws://127.0.0.1:9" not in l["text"]]
    return {"shots": shots, "video": "play.mp4", "frames": n_frames, "errors": errors, "n_console": len(logs), "telemetry": telemetry, "failed": failed}


def main():
    p = argparse.ArgumentParser()
    p.add_argument("dir", type=Path)
    a = p.parse_args()
    r = render(a.dir)
    if r["failed"]:
        print("RENDER FAILED:", r["failed"])
    print(f"{len(r['shots'])} shots, {r['frames']} video frames, {r['n_console']} console messages, {len(r['errors'])} errors")
    for e in r["errors"][:10]:
        print(" ", e[:300])


if __name__ == "__main__":
    main()
