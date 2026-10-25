# /// script
# requires-python = ">=3.10"
# dependencies = ["google-genai", "python-dotenv"]
# ///
"""Minimal Gemini 4 Argon client. Loads GEMINI_API_KEY from .env and never prints it.

Usage:
  uv run scripts/argon.py "Say hi"
  uv run scripts/argon.py "Describe this street scene" --image data/images/<seg>/<ts>_FRONT.jpg --res low
"""
import argparse
import os
from pathlib import Path

from dotenv import load_dotenv
from google import genai
from google.genai import types

ROOT = Path(__file__).resolve().parent.parent
RES = {
    "low": types.MediaResolution.MEDIA_RESOLUTION_LOW,
    "medium": types.MediaResolution.MEDIA_RESOLUTION_MEDIUM,
    "high": types.MediaResolution.MEDIA_RESOLUTION_HIGH,
}


def client():
    load_dotenv(ROOT / ".env")
    if not os.environ.get("GEMINI_API_KEY"):
        raise SystemExit("GEMINI_API_KEY not set; create .env from env.example")
    return genai.Client()  # reads GEMINI_API_KEY from the environment


def main():
    p = argparse.ArgumentParser()
    p.add_argument("prompt")
    p.add_argument("--image", type=Path, action="append", default=[])
    p.add_argument("--res", choices=RES, default="low")
    a = p.parse_args()

    c = client()
    model = os.environ.get("GEMINI_MODEL", "gemini-4-argon")
    contents = [types.Part.from_bytes(data=img.read_bytes(), mime_type="image/jpeg") for img in a.image]
    contents.append(a.prompt)
    config = types.GenerateContentConfig(media_resolution=RES[a.res])
    if a.image:
        print("input tokens:", c.models.count_tokens(model=model, contents=contents).total_tokens)
    print(c.models.generate_content(model=model, contents=contents, config=config).text)


if __name__ == "__main__":
    main()
