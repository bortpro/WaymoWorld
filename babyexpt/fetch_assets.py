# /// script
# requires-python = ">=3.10"
# ///
"""Download the CC0 Poly Haven assets SF Laser Taxi (Babylon edition) uses into babyexpt/assets/.

    uv run babyexpt/fetch_assets.py

Everything comes from https://polyhaven.com (CC0, no attribution required, redistribution allowed).
Re-running skips files that are already present.
"""
import json
import sys
import urllib.request
from pathlib import Path

ROOT = Path(__file__).resolve().parent / "assets"
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


def get_json(url):
    with urllib.request.urlopen(urllib.request.Request(url, headers=USER_AGENT)) as r:
        return json.load(r)


def download(url, dest: Path):
    if dest.exists() and dest.stat().st_size > 0:
        return
    dest.parent.mkdir(parents=True, exist_ok=True)
    with urllib.request.urlopen(urllib.request.Request(url, headers=USER_AGENT)) as r:
        dest.write_bytes(r.read())
    print(f"  {dest.relative_to(ROOT)}  ({dest.stat().st_size / 1e6:.1f} MB)")


def main():
    for name, res in TEXTURES.items():
        print(f"texture {name} @ {res}")
        files = get_json(API + name)
        for key, suffix in (("Diffuse", "diff"), ("nor_gl", "nor"), ("arm", "arm")):
            download(files[key][res]["jpg"]["url"], ROOT / "textures" / f"{name}_{suffix}.jpg")

    for name, res in MODELS.items():
        print(f"model {name} @ {res}")
        gltf = get_json(API + name)["gltf"][res]["gltf"]
        folder = ROOT / "models" / name
        download(gltf["url"], folder / f"{name}.gltf")
        for rel, info in gltf.get("include", {}).items():
            download(info["url"], folder / rel)

    for name, res in HDRIS.items():
        print(f"hdri {name} @ {res}")
        download(get_json(API + name)["hdri"][res]["hdr"]["url"], ROOT / "hdri" / f"{name}.hdr")

    total = sum(p.stat().st_size for p in ROOT.rglob("*") if p.is_file())
    print(f"done: {total / 1e6:.1f} MB in {ROOT}")


if __name__ == "__main__":
    sys.exit(main())
