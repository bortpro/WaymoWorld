# /// script
# requires-python = ">=3.10"
# ///
"""Download the CC0 Poly Haven assets SF Laser Taxi uses into assets/.

    uv run scripts/fetch_assets.py           # download anything missing or not matching Poly Haven
    uv run scripts/fetch_assets.py --check   # only verify assets/ against Poly Haven's md5s

assets/ is committed, so the deployed static site needs no build step. This script is how those files
are produced: to add or swap an asset, edit the lists below, re-run it, and commit the result. Files
whose md5 already matches Poly Haven's are skipped, so re-running it only touches what changed.

Everything comes from https://polyhaven.com (CC0, no attribution required, redistribution allowed).
"""
import hashlib
import json
import sys
import urllib.request
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent / "assets"
API = "https://api.polyhaven.com/files/"

# name -> resolution. Maps: diffuse (albedo), nor_gl (OpenGL normal), arm (AO / roughness / metal)
TEXTURES = {
    "asphalt_02": "2k",            # streets
    "concrete_pavement": "2k",     # sidewalks
    "white_planks_clean": "1k",    # Victorian clapboard siding (tinted per house)
    "painted_plaster_wall": "1k",  # Edwardian stucco + downtown precast
    "grey_roof_01": "1k",          # Victorian shingle roofs
    "red_brick_03": "1k",          # SoMa brick warehouses
    "white_sandstone_blocks_02": "1k",  # downtown stone bases, Ferry Building, Coit Tower
    "leafy_grass": "1k",           # Golden Gate Park, Alamo Square
    "coast_sand_01": "1k",         # Ocean Beach
}
MODELS = {
    "street_lamp_01": "1k",        # historic black SF street lamp
    "utility_box_01": "1k",        # sidewalk utility cabinets
}
HDRIS = {
    "kloofendal_48d_partly_cloudy_puresky": "2k",  # daytime sky + image-based lighting
}

USER_AGENT = {"User-Agent": "sf-laser-taxi-asset-fetch/1.0"}
TIMEOUT = 60  # seconds per request


def get(url):
    with urllib.request.urlopen(urllib.request.Request(url, headers=USER_AGENT), timeout=TIMEOUT) as r:
        return r.read()


def md5(path: Path):
    return hashlib.md5(path.read_bytes()).hexdigest()


def wanted():
    """Map each file under assets/ to its Poly Haven file entry ({url, md5, size})."""
    files = {}
    for name, res in TEXTURES.items():
        info = json.loads(get(API + name))
        for key, suffix in (("Diffuse", "diff"), ("nor_gl", "nor"), ("arm", "arm")):
            files[f"textures/{name}_{suffix}.jpg"] = info[key][res]["jpg"]
    for name, res in MODELS.items():
        gltf = json.loads(get(API + name))["gltf"][res]["gltf"]
        files[f"models/{name}/{name}.gltf"] = gltf
        for rel, info in gltf.get("include", {}).items():
            files[f"models/{name}/{rel}"] = info
    for name, res in HDRIS.items():
        files[f"hdri/{name}.hdr"] = json.loads(get(API + name))["hdri"][res]["hdr"]
    return files


def download(info, dest: Path):
    # Write to a temporary file and rename, so an interrupted run never leaves a truncated asset
    tmp = dest.with_name(dest.name + ".part")
    dest.parent.mkdir(parents=True, exist_ok=True)
    try:
        tmp.write_bytes(get(info["url"]))
        if md5(tmp) != info["md5"]:
            raise RuntimeError(f"md5 mismatch downloading {info['url']}")
        tmp.replace(dest)
    finally:
        tmp.unlink(missing_ok=True)
    print(f"  {dest.relative_to(ROOT)}  ({dest.stat().st_size / 1e6:.1f} MB)")


def main():
    check = "--check" in sys.argv[1:]
    files = wanted()
    bad = []
    for rel, info in files.items():
        dest = ROOT / rel
        if dest.exists() and md5(dest) == info["md5"]:
            continue
        if check:
            print(f"  {'differs from Poly Haven' if dest.exists() else 'missing'}: {rel}")
            bad.append(rel)
        else:
            download(info, dest)

    on_disk = {str(p.relative_to(ROOT)) for p in ROOT.rglob("*") if p.is_file() and p.name != ".DS_Store"}
    for rel in sorted(on_disk - set(files)):
        print(f"  not in this script's lists: {rel}")

    total = sum((ROOT / rel).stat().st_size for rel in files if (ROOT / rel).exists())
    if check:
        print(f"{len(files) - len(bad)}/{len(files)} files match Poly Haven ({total / 1e6:.1f} MB)")
        return 1 if bad else 0
    print(f"done: {len(files)} files, {total / 1e6:.1f} MB in {ROOT}")
    return 0


if __name__ == "__main__":
    sys.exit(main())
