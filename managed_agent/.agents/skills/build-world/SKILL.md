---
name: build-world
description: Write the single-file three.js Waymo World game (city, Waymo car, driving, lasers, HUD, start modal, leaderboard, minimap) that satisfies the world contract in SPEC.md
---

# Build the world

Write `workspace/out/baseline_v0/index.html`. Build it in the order below, rendering after each
step (see `render-critique-loop`) so bugs are caught while they're small.

## Skeleton

```html
<script type="importmap">
{ "imports": {
  "three": "https://cdn.jsdelivr.net/npm/three@0.160.0/build/three.module.js",
  "three/addons/": "https://cdn.jsdelivr.net/npm/three@0.160.0/examples/jsm/" } }
</script>
<script type="module"> import * as THREE from 'three'; … </script>
```

## Order of work

1. **Terrain and streets.** `getElevation` copied *exactly* from SPEC.md §2. Displace a
   1200×1200 plane, use a canvas road texture repeated `GRID_STEPS` times (asphalt, double yellow
   lines, crosswalks, sidewalks), and set `getTerrainNormal` by finite differences.
2. **City.** Loop over `gx, gz` in `0..11`, skip blocks with `bx > 380` (the bay), and use
   `cityRandom = mulberry32(415)` for every choice that affects collision boxes. Downtown
   (`gx >= 6 && 4 <= gz <= 8`) gets towers; everything else gets four row houses per block, with
   pitched roofs and bay windows. Landmarks: Transamerica (gx 7, gz 6), Coit Tower (gx 4, gz 7).
   Push a box `{minX,maxX,minZ,maxZ,maxY}` per building. Props go on sidewalks only, so check each
   one against the street bounds before placing it.
3. **Waymo mesh.** A white clearcoat I-PACE silhouette, tinted glass, a roof lidar dome
   (`userData.turret` spins), corner sensor pods, and headlights and taillights. Tint the player's
   accents cyan and everyone else's pink.
4. **`class Vehicle`** with `pos`, `angle`, `speed`, `hp`, `energy`, `lastShot`, `spawnTime`, and
   (for remote cars) `net`, `name`, `label`, `id`, `isBot`. Local physics: throttle, friction,
   speed-scaled steering, boost drains energy, sliding AABB collision against `buildings`, a hard
   clamp at `SHORE_X` and the city edge, terrain following, and tilt from the terrain normal.
5. **`class Laser`** per SPEC.md §2. Use emissive or basic material so it reads in daylight without bloom.
6. **Camera.** A chase camera 11 behind and 4.5 above the car, kept clear of hills behind it.
   Before Start, orbit the downtown skyline.
7. **HUD and UI.** The start modal, leaderboard, whole-city minimap (pre-render the static
   buildings layer once; draw dots and the heading arrow each frame), bars, kill feed, damage
   flash, and name and HP sprites over remote cars.
8. **Telemetry hook.** Set `window.__waymo = { fps, speed, pos, hp, lasersFired, enemiesVisible, … }`
   every frame. `scripts/render.py` reads it after each drive step.
9. **Look.** Apply SPEC.md §5 and your `out/reference_notes.md`.

While building single-player, put networking behind a `netSend()` that does nothing until
connected. The `multiplayer-server` phase fills it in.

## Optional Argon baseline

For comparison you can also run the original single-pass generator:

```bash
cd workspace && pip install google-genai python-dotenv
GEMINI_API_KEY=proxy python scripts/generate_world.py --out out/argon_baseline
```

## Before moving on

- Render it and confirm zero console errors.
- Confirm the car moves and isn't stuck at spawn: `telemetry.state.speed` is above 0 after the "w" step.
- Confirm the minimap shows the whole city and the arrow rotates when you steer.
