# SF Laser Taxi: Babylon.js experiment

An experimental rework of the game in Babylon.js 8.56.2, focused on graphics. It keeps the live game's
world contract (street grid, elevation, seeded city generator, building collision boxes) and its
network protocol, so it plays on the same server as the root `index.html`, bots included.

## Assets

The CC0 Poly Haven assets (~47 MB: textures, two glTF models, the HDRI sky) are **not committed**.
`babyexpt/assets/` is gitignored and `fetch_assets.py` downloads it. The script uses only the
Python standard library, so it runs anywhere with `python3` (no uv needed), and it skips files
that are already there.

## Run locally

```sh
python3 babyexpt/fetch_assets.py       # or: uv run babyexpt/fetch_assets.py
cd babyexpt && python3 -m http.server 8000
# open http://localhost:8000  (connects to ws://localhost:8080/ws; start backend/ for bots)
# or  http://localhost:8000/?server=wss://waymoworld-server.onrender.com/ws  to join the live game
```

## Deploy (e.g. a Render static site)

- Build command: `python3 babyexpt/fetch_assets.py`
- Publish directory: `babyexpt`

The page connects to `wss://waymoworld-server.onrender.com/ws` automatically when it isn't served from localhost.

URL flags: `?q=ultra|high|low` (graphics tier, also on the start screen), `?touch=1` (phone controls),
`?ssao=1` (try ambient occlusion, currently noisy), `?server=...`.

## What's in it

- **Lighting:** Poly Haven HDRI sky and image-based lighting, a sun aligned with the HDRI's sun, 3-cascade soft shadows.
- **Post:** HDR pipeline (ACES, bloom, sharpen, vignette); screen-space reflections on Ultra; glow on lasers and lights.
- **City:** Poly Haven asphalt, sidewalk, clapboard, plaster, brick, sandstone, shingle, grass and sand textures.
  Facade atlases are painted at load time (windows with interior variation, trim, storefronts) with matching
  normal and roughness maps, so glass reflects the sky.
- **Buildings:** Victorian rows with bay windows, cornices, brackets and stoops; downtown towers with
  storefronts, setbacks, awnings and rooftop clutter.
- **Landmarks:** Transamerica Pyramid, Salesforce Tower, Coit Tower, Golden Gate and Bay bridges, Ferry Building,
  Sutro Tower, Lombard planters, Golden Gate Park (windmill, Stow Lake, Conservatory), Ocean Beach.
- **Streets:** painted lanes, crosswalks and stop bars, cable-car rails with moving cable cars, traffic signals
  that cycle, Poly Haven street lamps and utility boxes, procedural trees, palms and cypresses, parked cars.
- **Taxi:** procedural I-PACE-style robotaxi with clear-coat paint, roof lidar dome in team colour, aero wheels.
- **Performance:** geometry merged per material in 300 m chunks (frustum culled per camera and cascade),
  instancing for repeated props, dynamic resolution and automatic SSR drop below 45 fps.

## Files

`js/shared.js` world contract · `js/materials.js` textures and facades · `js/geo.js` geometry batching ·
`js/city.js` city and landmarks · `js/props.js` vegetation, signals, models, cable cars · `js/car.js` taxi ·
`js/game.js` vehicles, lasers, effects · `js/net.js` multiplayer · `js/hud.js` HUD and input · `js/main.js` boot and loop.
