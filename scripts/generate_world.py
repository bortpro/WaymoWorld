# /// script
# requires-python = ">=3.10"
# dependencies = ["google-genai", "python-dotenv"]
# ///
"""Single-pass baseline: ask Argon for a self-contained Waymo World HTML game.

Usage:
  uv run scripts/generate_world.py --out out/baseline_v0
"""
import argparse
import json
import os
import re
import time
from pathlib import Path

from google.genai import types

from argon import client

PROMPT = (
    "I want to build a 3D world that's visually appealing. I want to build \"Waymo World\", "
    "a realistic street world of SF where you control a Waymo, in a world full of other Waymo's, "
    "and they all play laser tag with each other. This should be a fun realistic 3D game. Build it"
)

FORMAT = (
    "Deliver the game as ONE self-contained index.html file in a single ```html code block. "
    "Load three.js only from a pinned CDN URL (e.g. https://cdn.jsdelivr.net/npm/three@0.160.0/...) "
    "via an import map. No other external assets; generate all geometry and textures procedurally. "
    "It must run by simply opening the file in a browser."
)


def main():
    p = argparse.ArgumentParser()
    p.add_argument("--out", type=Path, default=Path("out/baseline_v0"))
    p.add_argument("--max-output-tokens", type=int, default=200_000)
    a = p.parse_args()
    a.out.mkdir(parents=True, exist_ok=True)

    c = client()
    model = os.environ.get("GEMINI_MODEL", "gemini-4-argon")
    t0 = time.time()
    resp = c.models.generate_content(
        model=model,
        contents=PROMPT,
        config=types.GenerateContentConfig(
            system_instruction=FORMAT, max_output_tokens=a.max_output_tokens
        ),
    )
    text = resp.text or ""
    (a.out / "response.md").write_text(text)

    m = re.search(r"```html\s*\n(.*?)```", text, re.S)
    html = m.group(1) if m else text
    (a.out / "index.html").write_text(html)

    u = resp.usage_metadata
    meta = {
        "model": model,
        "prompt": PROMPT,
        "system_instruction": FORMAT,
        "seconds": round(time.time() - t0, 1),
        "finish_reason": str(resp.candidates[0].finish_reason) if resp.candidates else None,
        "input_tokens": u.prompt_token_count,
        "output_tokens": u.candidates_token_count,
        "thinking_tokens": getattr(u, "thoughts_token_count", None),
        "html_extracted": bool(m),
        "html_bytes": len(html),
    }
    (a.out / "meta.json").write_text(json.dumps(meta, indent=2))
    print(json.dumps(meta, indent=2))


if __name__ == "__main__":
    main()
