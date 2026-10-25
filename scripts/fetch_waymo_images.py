# /// script
# requires-python = ">=3.10"
# dependencies = ["pyarrow"]
# ///
"""Download Waymo Open Dataset v2 camera images and extract them as JPEGs.

Requires a Google account that has accepted the Waymo Open Dataset license
(https://waymo.com/open/terms) and is logged into gcloud.

Usage:
  uv run scripts/fetch_waymo_images.py --segments 2 --every 10
  uv run scripts/fetch_waymo_images.py --segment 10203656353524179475_7625_000_7645_000
  # slow network: stream one ~100MB row group (~5s of driving) instead of the ~350MB file
  uv run scripts/fetch_waymo_images.py --segment <name> --stream --row-group 1 --cameras FRONT
"""
import argparse
import json
import subprocess
from datetime import datetime, timedelta
from pathlib import Path

import pyarrow.fs as pafs

import pyarrow.parquet as pq

BUCKET = "gs://waymo_open_dataset_v_2_0_1"
CAMERAS = {1: "FRONT", 2: "FRONT_LEFT", 3: "FRONT_RIGHT", 4: "SIDE_LEFT", 5: "SIDE_RIGHT"}
IMG = "[CameraImageComponent].image"
POSE = "[CameraImageComponent].pose.transform"


def gcloud(*args, account=None):
    cmd = ["gcloud", "storage", *args]
    if account:
        cmd.append(f"--account={account}")
    return subprocess.run(cmd, check=True, capture_output=True, text=True).stdout


def list_segments(split, account):
    out = gcloud("ls", f"{BUCKET}/{split}/camera_image/", account=account)
    return [Path(l).stem for l in out.split() if l.endswith(".parquet")]


def download(split, segment, raw_dir, account):
    dest = raw_dir / f"{segment}.parquet"
    if not dest.exists():
        print(f"downloading {segment} (~350MB)...")
        gcloud("cp", f"{BUCKET}/{split}/camera_image/{segment}.parquet", str(dest), account=account)
    return dest


COLUMNS = ["key.frame_timestamp_micros", "key.camera_name", IMG, POSE]


def stream_row_group(split, segment, row_group, account):
    """Range-read one row group's columns straight from GCS (no full-file download)."""
    cmd = ["gcloud", "auth", "print-access-token"] + ([f"--account={account}"] if account else [])
    token = subprocess.run(cmd, check=True, capture_output=True, text=True).stdout.strip()
    fs = pafs.GcsFileSystem(access_token=token, credential_token_expiration=datetime.now() + timedelta(minutes=50))
    path = f"{BUCKET.removeprefix('gs://')}/{split}/camera_image/{segment}.parquet"
    f = pq.ParquetFile(fs.open_input_file(path))
    row_group = min(row_group, f.metadata.num_row_groups - 1)
    mb = f.metadata.row_group(row_group).total_byte_size / 1e6
    print(f"streaming {segment} row group {row_group}/{f.metadata.num_row_groups} (~{mb:.0f}MB)...")
    return f.read_row_group(row_group, columns=COLUMNS)


def extract(table, seg_name, out_dir, every, cameras):
    timestamps = sorted(set(table.column("key.frame_timestamp_micros").to_pylist()))
    keep = set(timestamps[::every])
    seg_dir = out_dir / seg_name
    seg_dir.mkdir(parents=True, exist_ok=True)
    poses = json.loads((seg_dir / "poses.json").read_text()) if (seg_dir / "poses.json").exists() else {}
    for row in table.to_pylist():
        ts, cam = row["key.frame_timestamp_micros"], CAMERAS[row["key.camera_name"]]
        if ts not in keep or cam not in cameras:
            continue
        name = f"{ts}_{cam}.jpg"
        (seg_dir / name).write_bytes(row[IMG])
        poses[name] = row[POSE]  # 4x4 row-major vehicle-to-world transform
    (seg_dir / "poses.json").write_text(json.dumps(poses, indent=1))
    print(f"wrote {len(poses)} images to {seg_dir}")


def main():
    p = argparse.ArgumentParser()
    p.add_argument("--split", default="validation", choices=["training", "validation", "testing"])
    p.add_argument("--segment", action="append", help="segment name(s); default: first N in split")
    p.add_argument("--segments", type=int, default=1, help="how many segments if --segment not given")
    p.add_argument("--every", type=int, default=10, help="keep every Nth frame (10Hz source)")
    p.add_argument("--cameras", default=",".join(CAMERAS.values()))
    p.add_argument("--account", help="gcloud account registered with Waymo")
    p.add_argument("--data-dir", type=Path, default=Path("data"))
    p.add_argument("--stream", action="store_true", help="range-read one row group instead of downloading")
    p.add_argument("--row-group", type=int, default=1, help="which row group to stream (0-3, ~5s each)")
    a = p.parse_args()

    raw_dir, out_dir = a.data_dir / "raw", a.data_dir / "images"
    raw_dir.mkdir(parents=True, exist_ok=True)
    segments = a.segment or list_segments(a.split, a.account)[: a.segments]
    cameras = set(a.cameras.split(","))
    for seg in segments:
        if a.stream and not (raw_dir / f"{seg}.parquet").exists():
            table = stream_row_group(a.split, seg, a.row_group, a.account)
        else:
            table = pq.read_table(download(a.split, seg, raw_dir, a.account), columns=COLUMNS)
        extract(table, seg, out_dir, a.every, cameras)


if __name__ == "__main__":
    main()
