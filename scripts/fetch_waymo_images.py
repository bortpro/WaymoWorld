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
"""
import argparse
import json
import subprocess
from pathlib import Path

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


def extract(parquet_path, out_dir, every, cameras):
    table = pq.read_table(parquet_path, columns=["key.frame_timestamp_micros", "key.camera_name", IMG, POSE])
    timestamps = sorted(set(table.column("key.frame_timestamp_micros").to_pylist()))
    keep = set(timestamps[::every])
    seg_dir = out_dir / parquet_path.stem
    seg_dir.mkdir(parents=True, exist_ok=True)
    poses = {}
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
    a = p.parse_args()

    raw_dir, out_dir = a.data_dir / "raw", a.data_dir / "images"
    raw_dir.mkdir(parents=True, exist_ok=True)
    segments = a.segment or list_segments(a.split, a.account)[: a.segments]
    for seg in segments:
        extract(download(a.split, seg, raw_dir, a.account), out_dir, a.every, set(a.cameras.split(",")))


if __name__ == "__main__":
    main()
