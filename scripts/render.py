# /// script
# requires-python = ">=3.10"
# dependencies = ["playwright"]
# ///
"""Render a generated game headlessly: screenshots over time + console errors.

Usage:
  uv run scripts/render.py out/baseline_v0
"""
import argparse
import json
from pathlib import Path

from playwright.sync_api import sync_playwright


def main():
    p = argparse.ArgumentParser()
    p.add_argument("dir", type=Path)
    p.add_argument("--shots", type=int, default=3)
    p.add_argument("--interval", type=float, default=2.0)
    a = p.parse_args()
    page_path = (a.dir / "index.html").resolve()
    logs = []

    with sync_playwright() as pw:
        browser = pw.chromium.launch(channel="chrome", headless=True, args=["--use-angle=swiftshader", "--enable-unsafe-swiftshader"])
        page = browser.new_page(viewport={"width": 1280, "height": 720})
        page.on("console", lambda m: logs.append({"type": m.type, "text": m.text}))
        page.on("pageerror", lambda e: logs.append({"type": "pageerror", "text": str(e)}))
        page.goto(page_path.as_uri())
        page.wait_for_timeout(3000)
        # Dismiss start screens and hold forward so the scene moves.
        buttons = page.locator("button:visible")
        if buttons.count():
            buttons.first.click()
        else:
            page.mouse.click(640, 360)
        page.wait_for_timeout(1000)
        page.keyboard.press("Enter")
        page.keyboard.press("Space")
        page.keyboard.down("w")
        for i in range(a.shots):
            page.wait_for_timeout(a.interval * 1000)
            page.screenshot(path=str(a.dir / f"shot_{i}.png"))
        page.keyboard.up("w")
        browser.close()

    (a.dir / "console.json").write_text(json.dumps(logs, indent=1))
    errors = [l for l in logs if l["type"] in ("error", "pageerror")]
    print(f"{len(logs)} console messages, {len(errors)} errors")
    for e in errors[:10]:
        print(" ", e["text"][:300])


if __name__ == "__main__":
    main()
