---
name: fetch-waymo-images
description: Pull real Waymo Open Dataset v2 camera frames (JPEG + poses) into workspace/data/images to use as visual references for the SF look
---

# Fetch Waymo reference frames

The original project's downloader is `workspace/scripts/fetch_waymo_images.py`. It shells out to
the `gcloud` CLI, which isn't in this sandbox. Use the adapter
`workspace/tools/fetch_waymo_https.py` instead. It reuses the original script's `COLUMNS`,
`CAMERAS` and `extract()`, but lists and range-reads the bucket over plain HTTPS. Requests to
`storage.googleapis.com` go through the egress proxy, which adds the credential of an account that
has accepted the Waymo Open Dataset license. You never handle a token.

## Steps

```bash
cd workspace
pip install pyarrow requests
# List a few validation segments (sanity check that auth works)
python tools/fetch_waymo_https.py --list --segments 5
# Stream ONE row group (~100 MB, ~5 s of driving) per segment, front camera only, every 10th frame (1 Hz)
python tools/fetch_waymo_https.py --segments 2 --row-group 1 --cameras FRONT --every 10
```

Output: `data/images/<segment>/<timestamp>_FRONT.jpg` plus `poses.json`. This is the same layout
the original script writes, so `scripts/loop.py --images data/images` works unchanged.

## Checks

- At least 10 frames total. `scripts/loop.py` needs `--k` builder refs plus `--holdout` critic refs (defaults 3 + 5).
- Look at 2–3 frames yourself. Note the palette, sky, street width, building types, and hills,
  and write those notes into `out/reference_notes.md`. These notes (not the images) may appear in
  the final report.

## Failure modes

- **HTTP 401/403:** the proxy credential is missing, expired, or belongs to an account that
  hasn't accepted the license. Stop and report it. Don't retry in a loop, and don't try other buckets.
- **Slow or interrupted transfer:** lower `--segments` to 1, or switch `--row-group`.
- **Licensing:** frames stay in `workspace/data/`. Never copy them into `build/`, embed them in
  the game, or print their bytes.
