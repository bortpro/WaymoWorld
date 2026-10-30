# /// script
# dependencies = ["playwright"]
# ///
"""Headless check of the Babylon.js frontend on the real GPU: load, run JS steps, screenshot each.

    python3 -m http.server 8000                   # in the repo root
    (cd backend && npm run dev)                   # optional: local server with 5 bots
    uv run scripts/babylon_probe.py "http://localhost:8000/?q=ultra" out/probe scripts/probe_steps/play.json

Each step is ["name", "js expression"]; the expression may return a Promise. Its result is printed
and a screenshot is saved as OUT_DIR/<name>.png. Page errors and console warnings are printed as they
happen (WebSocket noise is filtered). The game exposes its state as window.__sflt = { G, scene,
engine, pipelines, downgrade }.

Chromium is launched with ANGLE on Metal so it renders on the Mac's GPU; SwiftShader (the default
headless renderer) is far too slow for this scene. On Linux/Windows drop --use-angle=metal.
"""
import json
import sys
from pathlib import Path

from playwright.sync_api import sync_playwright

url, out, steps_file = sys.argv[1], Path(sys.argv[2]), sys.argv[3]
out.mkdir(parents=True, exist_ok=True)
steps = json.loads(Path(steps_file).read_text())

with sync_playwright() as p:
    browser = p.chromium.launch(args=["--use-gl=angle", "--use-angle=metal", "--ignore-gpu-blocklist"])
    page = browser.new_page(viewport={"width": 960, "height": 540})
    page.on("pageerror", lambda e: print("[pageerror]", e))
    page.on("console", lambda m: print(f"[{m.type}]", m.text)
            if m.type in ("error", "warning") and "WebSocket" not in m.text else None)
    page.goto(url)
    page.wait_for_function("document.body.classList.contains('ready')", timeout=240_000)
    print("renderer:", page.evaluate("""(() => { const gl = document.createElement('canvas').getContext('webgl2');
        const d = gl.getExtension('WEBGL_debug_renderer_info'); return d ? gl.getParameter(d.UNMASKED_RENDERER_WEBGL) : 'n/a'; })()"""))
    page.wait_for_timeout(1500)
    for name, js in steps:
        result = page.evaluate(js)
        if result is not None:
            print(f"{name} -> {result}")
        page.wait_for_timeout(1200)
        page.screenshot(path=str(out / f"{name}.png"))
    browser.close()
