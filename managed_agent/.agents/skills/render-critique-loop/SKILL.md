---
name: render-critique-loop
description: Render a game version headlessly with a fixed scripted drive, score it against the rubric using Waymo reference frames, and iteratively fix it (keep a candidate only if it scores higher)
---

# Render → critique → fix

## Setup (once)

```bash
cd workspace
pip install playwright "imageio[ffmpeg]" numpy pillow google-genai python-dotenv
python -m playwright install --with-deps chromium
# render.py asks for the Chrome channel; the sandbox has Playwright's Chromium instead
sed -i 's/channel="chrome", //' scripts/render.py
```

## Render one version

```bash
python scripts/render.py out/baseline_v0
```

This writes `shot_start.png`, `shot_1..5.png`, `play.mp4`, `console.json` and `telemetry.json`
next to the `index.html`. The page is loaded with `?server=ws://127.0.0.1:9/ws`, so it never
joins a live server, and `Math.random` is seeded so renders are comparable. Look at the
screenshots yourself every time.

## Score it

```bash
GEMINI_API_KEY=proxy python scripts/loop.py --eval-only out/baseline_v0 --images data/images
```

An Argon critic that never sees code scores six criteria from 1 to 10: `waymo_look`,
`sf_realism`, `laser_tag_fun`, `driving_feel`, `visual_polish`, `sf_landmarks`. It compares the
render against held-out Waymo frames and reports ranked issues with evidence and fix hints.

## Improve

You have two options; pick one per iteration.

- **Automatic:** let the original loop run Argon as the builder:
  `GEMINI_API_KEY=proxy python scripts/loop.py --start out/baseline_v0 --run out/loop_run --iters 2 --k 3`
- **Manual:** read the critique's `top_issues`, make targeted edits yourself into
  `out/loop_<n>/index.html`, then render and score it again.

Either way, accept a candidate only if its total score beats the current best by at least 2
points **and** it has no more console errors. Otherwise revert. Record each iteration's scores in
`out/scores.md`.

## Pitfalls already found in the original project

- **Sky:** a sky mesh larger than the camera's far plane gets clipped and the frame goes white.
  Pin a gradient dome to the far plane instead (`gl_Position.z = gl_Position.w`).
- **Bloom:** with `OutputPass` in daylight, `UnrealBloomPass` hazes the whole frame. Don't use it in daytime.
- **Water:** a water plane that overlaps the street grid floods the streets. Start it at the
  shoreline or city edge.
- **Asphalt:** metallic asphalt mirrors the sky. Use metalness 0, roughness about 0.7.
- **Props:** props in the roadway or intersections block driving and look wrong. Check each one
  against the street bounds.
- **Edit ordering:** the builder sometimes breaks the multiplayer contract while editing visuals.
  `loop.py` includes `MP_CONTRACT` in its prompt; manual edits must respect it too.
