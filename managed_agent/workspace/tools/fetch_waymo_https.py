# /// script
# requires-python = ">=3.10"
# dependencies = ["pyarrow", "requests"]
# ///
"""Sandbox adapter for scripts/fetch_waymo_images.py: same output, no gcloud CLI.

The original script shells out to `gcloud storage` and `gcloud auth print-access-token`. In the
managed-agent sandbox, requests to storage.googleapis.com go through an egress proxy that injects
the credential of a license-accepted account, so plain HTTPS is enough. This file lists the bucket
over the JSON API, range-reads one Parquet row group over the XML endpoint, and hands the table to
the original `extract()` so the on-disk layout matches exactly.

Usage (from workspace/):
  python tools/fetch_waymo_https.py --list --segments 5
  python tools/fetch_waymo_https.py --segments 2 --row-group 1 --cameras FRONT --every 10
"""
import argparse
import io
import sys
from pathlib import Path

import pyarrow.parquet as pq
import requests

sys.path.insert(0, str(Path(__file__).resolve().parent.parent / "scripts"))
import fetch_waymo_images as original  # noqa: E402  (reuse COLUMNS, CAMERAS, extract)

BUCKET = original.BUCKET.removeprefix("gs://")
API = "https://storage.googleapis.com"


class HttpRangeFile(io.RawIOBase):
    """Seekable read-only file over HTTP Range requests, enough for pyarrow's Parquet reader."""

    def __init__(self, session: requests.Session, url: str):
        self.session, self.url, self.pos = session, url, 0
        head = session.head(url, timeout=60)
        head.raise_for_status()
        self.size = int(head.headers["Content-Length"])

    def readable(self):
        return True

    def seekable(self):
        return True

    def tell(self):
        return self.pos

    def seek(self, offset, whence=io.SEEK_SET):
        base = {io.SEEK_SET: 0, io.SEEK_CUR: self.pos, io.SEEK_END: self.size}[whence]
        self.pos = max(0, min(self.size, base + offset))
        return self.pos

    def readinto(self, buf):
        if self.pos >= self.size:
            return 0
        end = min(self.size, self.pos + len(buf)) - 1
        r = self.session.get(self.url, headers={"Range": f"bytes={self.pos}-{end}"}, timeout=300)
        r.raise_for_status()
        n = len(r.content)
        buf[:n] = r.content
        self.pos += n
        return n


def list_segments(session, split, limit):
    names, token = [], None
    prefix = f"{split}/camera_image/"
    while len(names) < limit:
        params = {"prefix": prefix, "fields": "items(name),nextPageToken", "maxResults": 1000}
        if token:
            params["pageToken"] = token
        r = session.get(f"{API}/storage/v1/b/{BUCKET}/o", params=params, timeout=60)
        r.raise_for_status()
        body = r.json()
        names += [Path(i["name"]).stem for i in body.get("items", []) if i["name"].endswith(".parquet")]
        token = body.get("nextPageToken")
        if not token:
            break
    return names[:limit]


def read_row_group(session, split, segment, row_group):
    url = f"{API}/{BUCKET}/{split}/camera_image/{segment}.parquet"
    f = pq.ParquetFile(io.BufferedReader(HttpRangeFile(session, url), buffer_size=8 << 20))
    row_group = min(row_group, f.metadata.num_row_groups - 1)
    mb = f.metadata.row_group(row_group).total_byte_size / 1e6
    print(f"streaming {segment} row group {row_group}/{f.metadata.num_row_groups} (~{mb:.0f}MB)...")
    return f.read_row_group(row_group, columns=original.COLUMNS)


def main():
    p = argparse.ArgumentParser()
    p.add_argument("--split", default="validation", choices=["training", "validation", "testing"])
    p.add_argument("--segment", action="append", help="segment name(s); default: first N in split")
    p.add_argument("--segments", type=int, default=1)
    p.add_argument("--every", type=int, default=10, help="keep every Nth frame (10Hz source)")
    p.add_argument("--cameras", default="FRONT")
    p.add_argument("--row-group", type=int, default=1, help="which row group to read (0-3, ~5s each)")
    p.add_argument("--data-dir", type=Path, default=Path("data"))
    p.add_argument("--list", action="store_true", help="only list segment names")
    a = p.parse_args()

    session = requests.Session()
    segments = a.segment or list_segments(session, a.split, a.segments)
    if a.list:
        print("\n".join(segments))
        return
    cameras = set(a.cameras.split(","))
    for seg in segments:
        table = read_row_group(session, a.split, seg, a.row_group)
        original.extract(table, seg, a.data_dir / "images", a.every, cameras)


if __name__ == "__main__":
    main()
