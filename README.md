# SF Laser Taxi

A multiplayer browser game: players drive robotaxis around San Francisco and shoot lasers at each other.

## Status

- **Frontend** (`index.html` + `js/`): multiplayer game, rendered with Babylon.js 8.56.2 and CC0 Poly Haven assets. A start modal asks for a username; a leaderboard (top right) shows players online and kill counts. Every other car is a real player (the old single-player bots were removed).
- **Backend** (`backend/`): WebSocket game server. Tracks players, broadcasts 20 Hz position snapshots, validates hits, and owns HP / kills / deaths.

## Deployments (Render)

| Part     | URL                                       |
| -------- | ----------------------------------------- |
| Frontend | https://waymoworld.onrender.com/          |
| Backend  | https://waymoworld-server.onrender.com    |

- WebSocket endpoint: `wss://waymoworld-server.onrender.com/ws`
- Health check: `https://waymoworld-server.onrender.com/health` returns `{ ok, clients, players }`
- Debug dashboard: `https://waymoworld-server.onrender.com/?token=<DEBUG_TOKEN>` (see below)

## Layout

```
index.html          # Frontend page: HUD, start modal, loads Babylon.js 8.56.2 from jsDelivr and js/main.js
js/                 # Frontend ES modules (see "Frontend" below)
assets/             # Poly Haven textures, models and HDRI sky (gitignored; scripts/fetch_assets.py downloads them)
backend/
  package.json      # Node >= 20, ESM, sole dependency: ws
  src/server.js     # HTTP server (/health, / dashboard, /debug/*) + WebSocketServer on /ws, player registry, 20 Hz snapshots, hit validation, 30s ping/pong heartbeat
  src/debug.html    # Debug dashboard page served at / (and /debug)
```

## Running locally

Frontend: download the assets once, then serve the root folder with any static server:

```sh
python3 scripts/fetch_assets.py     # ~47 MB of CC0 Poly Haven assets into assets/ (stdlib only; skips files already there)
python3 -m http.server 8000         # or: npx serve .
```

Render static site settings for the frontend: build command `python3 scripts/fetch_assets.py`, publish directory `.` (the repo root).

Backend:

```sh
cd backend
npm install
npm run dev      # node --watch; listens on $PORT or 8080
```

Local WebSocket URL: `ws://localhost:8080/ws`

The frontend picks its server automatically: `ws://localhost:8080/ws` when served from `localhost` / `127.0.0.1` / `file://`, otherwise `wss://waymoworld-server.onrender.com/ws`. Override with `?server=ws://host:port/ws`.

To test multiplayer locally, open the page in two browser windows.

## Debug dashboard

The dashboard at `/` (also `/debug`) is a live view of all server state. It polls `/debug/state` (JSON) every 0.25 to 5 s and shows:
- an overview: uptime, sockets, players, spectators, message rates, memory
- a top-down map of players with heading, HP, and hit range
- every player field (position, HP, live shots, spawn protection, how long since their last state update)
- every socket (IP, user agent, message counts, send buffer)
- counters, including messages by type and shots or hits rejected by reason
- config, a log of the last 200 events (connect, join, hit, hit-rejected, kill, leave, …), and the raw JSON

- a **Daily users** line chart (14 to 365 days, from `/debug/dau?days=N`): **DAU** = total `join`s that day, **uDAU** = distinct players who joined. Players are identified by a random browser ID the client keeps in localStorage (`sflasertaxi-cid`, sent as `cid` in `join`), or by IP when the client doesn't send one. Days roll over at midnight America/Los_Angeles.

**Persistence:** when `DATABASE_URL` is set (it is on Render), counters, `nextId`, the event log (kept 30 days), and daily-user rows are stored in Postgres and restored on startup. Tables are created automatically (`server_stats`, `events`, `daily_users`). Without `DATABASE_URL` (local dev), everything stays in memory. If the database can't be reached at startup, the server still runs, in memory only, and the dashboard's `database` card shows `FAILED`.

Access: with no `DEBUG_TOKEN` env var set, it only answers direct localhost requests (`http://localhost:8080/`). On Render, set `DEBUG_TOKEN` in the service's environment and open `/?token=<value>`. The page includes player IPs, so keep the token private.

## Multiplayer model

- **Each client owns its own car's movement** and sends `state` 20×/s. The server clamps it to the world bounds and rebroadcasts everyone in `snap`.
- **Remote cars** ease toward the latest snapshot, extrapolating with `speed` for up to 250 ms; a jump of more than 40 units snaps (respawn).
- **Hits are detected by the shooter's client** (its own lasers vs. remote cars) and reported as `hit`. The server rejects a hit if there's no unspent shot from the last 2 s, the target is more than 320 units away, or the target is within 2 s of (re)spawning. Otherwise it applies 25 damage.
- **5 server-driven bots** (`BOT_NAMES` in `backend/src/server.js`) are always in the game. They use the same entity shape as players (`bot: true` in `welcome`/`join`), so snapshots, the leaderboard, and hits treat them the same. Bots drive intersection to intersection along street centerlines (`x, z = -585 + 100k`, which have no collision boxes), mostly toward the nearest human. They only fire straight down their own street, since that's guaranteed line of sight. The server can't see lasers, so the **victim's client** reports a bot laser hitting it with `botHit`, which goes through the same validation as `hit`. The server keeps its own copy of `getElevation()` for bot laser origins and aim, and it must match `js/shared.js` exactly.
- **The server owns HP, kills, and deaths.** At 0 HP it broadcasts `kill`, resets the victim to 100 HP, and heals the killer by 25. The victim's client picks a new random spawn point.
- **The city is generated with a seeded RNG** (`cityRandom`, seed 415), so building heights, and therefore laser collisions, match on every client. Window textures still use `Math.random` (cosmetic only).
- Clients on the start modal are connected but not joined: they receive all broadcasts (remote cars drive around behind the modal), but aren't in the roster.

## Message protocol

All messages are JSON with a `type` field. Tuning constants are at the top of `backend/src/server.js`; keep them in sync with `js/shared.js` and `js/game.js`.

Client → server:

| type | fields | notes |
|---|---|---|
| `join` | `name` | sent on Start; name is sanitized to ≤16 chars of letters, digits, space, `_.-` (default `USER-<id>`, zero-padded) |
| `state` | `x, z, a, s` | position, heading (rad), speed; 20 Hz |
| `shoot` | `p: [x,y,z], d: [x,y,z]` | laser origin and direction; server cooldown 150 ms |
| `hit` | `target` | id of the remote player or bot your laser hit |
| `botHit` | `bot` | a bot's laser hit your car (bots can't detect hits themselves) |

Server → client:

| type | fields | notes |
|---|---|---|
| `welcome` | `players: [{id,name,kills,deaths,x,z,a,s,hp,bot}]` | on connect; includes bots |
| `joined` | `id, name` | reply to your `join` (with the sanitized name) |
| `join` / `leave` | `player` / `id` | broadcast to everyone, including the joiner |
| `snap` | `p: [[id,x,z,a,s,hp], ...]` | 20 Hz, all joined players and bots; sent whenever any socket is connected |
| `shoot` | `id, p, d` | to everyone except the shooter |
| `hp` | `id, hp, by?` | after damage or the kill heal |
| `kill` | `killer, victim, killerKills, victimDeaths` | |
| `error` | `error` | e.g. invalid JSON |

## Frontend

The CC0 Poly Haven assets (textures, two glTF models, the HDRI sky) are **not committed**: `assets/` is gitignored and `scripts/fetch_assets.py` downloads it at build time.

URL flags: `?q=ultra|high|low` (graphics tier, also on the start screen), `?touch=1` (phone controls), `?ssao=1` (try ambient occlusion, currently noisy), `?server=...`.

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

Files: `js/shared.js` world contract · `js/materials.js` textures and facades · `js/geo.js` geometry batching ·
`js/city.js` city and landmarks · `js/props.js` vegetation, signals, models, cable cars · `js/car.js` taxi ·
`js/game.js` vehicles, lasers, effects · `js/net.js` multiplayer · `js/hud.js` HUD and input · `js/main.js` boot and loop ·
`js/sound.js` Web Audio synth.

The previous single-file three.js frontend is in git history (the last version is `index.html` at commit `41cace1`).

## Game state

The world is 3D with **y pointing up**; cars drive on the **x–z plane**. State lives on the shared `G` object in `js/shared.js`: `G.player` (local car), `G.remoteVehicles` (Set of other players' cars), `G.roster` (Map id → `{id,name,kills,deaths,vehicle}`), `G.myId`, `G.lasers[]`, `G.buildings[]` (collision boxes `{minX,maxX,minZ,maxZ,maxY}`). In the browser console it's at `window.__sflt.G`.

### Car (`class Vehicle`)

| Field | What it's for | Send over the network? |
|---|---|---|
| `pos.x`, `pos.z` | position on the ground | **yes** |
| `angle` | heading in radians; forward is `(sin a, 0, cos a)` | **yes** |
| `speed` | signed scalar speed (driving backwards is negative) | yes, useful so other clients can predict movement |
| `hp` | 0–100 | yes |
| `energy` | 0–100, spent on boost and shooting | probably only the owner needs it |
| `pos.y` | worked out from the terrain (`getElevation(x, z)`) | no |
| `root.rotationQuaternion` | tilt on hills, worked out from the terrain normal and `angle` | no |
| `maxSpeed`, `accel`, `handling` | fixed tuning values | no |
| `lastShot` | timer that limits fire rate | no (owner only) |
| `net` (remote cars only) | latest snapshot `{x,z,a,s,t}` that the rendered position eases toward | n/a |
| `spawnTime` | used to show spawn protection | no (server tracks its own) |

Minimum to draw a remote car: `{x, z, angle}`. Add `speed` for smoothing between updates and `hp` for health/kills.

### Laser (`class Laser`)

`pos` (3D), `dir` (3D unit vector), `owner`, `life` (starts at 1 s); speed is fixed at 250. Lasers fly in a straight line, so a single "shot fired" message `{pos, dir, ownerId}` is enough for each client to simulate the flight.

**Problem Statement Two: More Dimensions**

Gemini 4 Argon is also SOTA on [long video understanding](https://blog.google/innovation-and-ai/models-and-research/gemini-models/gemini-4-argon/#workingharder), and its output window lets it generate high-fidelity [3D games and procedural worlds](https://aistudio.google.com/learn/building-3d-games-and-worlds-with-gemini-4-argon) in a single pass. A single pass is only the first draft. Build a system that renders what it made, watches the result, critiques it against the goal, and fixes it in a loop.

## Gemini 4 Argon Hackathon

We are building Waymo World. We want to create a realistic 3D Waymo World
that has laser tag and uses the Gemini 4 Argon model to do this.
We have an API key for Gemini 4.

## Repo Layout

| Path | Owner | What |
|---|---|---|
| `index.html`, `js/` | Eric | the deployed game (Render) |
| `backend/` | Eric | multiplayer / WebSocket server |
| `scripts/` | Argon loop | data fetch, Argon client, generate / render / loop |
| `out/` | Argon loop | baseline and loop iterations |
| `managed_agent/` | Eric | Gemini managed agent that rebuilds the whole project from scratch (see its README) |

Argon loop work happens on the `loop` branch and merges into `main` at the end.
Don't delete other people's paths. Before pushing: `git pull --rebase` for unpushed local commits, but on an already-pushed branch (e.g. `loop`) use `git merge origin/main` instead of rebasing. Never force-push.

## Accounts & Setup

| What | Account |
|---|---|
| Gemini API / Google Cloud | `devstar7060@gcplab.me` |
| Waymo Open Dataset (license accepted) | `jinscripts@gmail.com` |

```bash
gcloud auth login devstar7060@gcplab.me   # Gemini / GCP
cp env.example .env                        # then paste GEMINI_API_KEY into .env in your editor
chmod 600 .env
uv run scripts/argon.py "Say hi"           # smoke test
```

`.env` is gitignored and `.claude/settings.json` denies Claude from reading it.
Never paste the key into chat or pass it on the command line.

## Waymo Open Datasets

Fetch camera JPEGs + poses from the v2 dataset (GCS, needs a license-accepted account):

```bash
uv run scripts/fetch_waymo_images.py --account jinscripts@gmail.com --segments 1 --every 10
```


If you can grab Waymo Open datasets of camera images published by Waymo
to help craft the 3D world, that is ideal.

## BASELINE (v0): Argon single pass

`out/baseline_v0/` is what Gemini 4 Argon produced from one prompt, no feedback loop:

> I want to build a 3D world that's visually appealing. I want to build "Waymo World", a realistic
> street world of SF where you control a Waymo, in a world full of other Waymo's, and they all play
> laser tag with each other. This should be a fun realistic 3D game. Build it

- ~2.5 min, 193 input / ~17K output tokens, one 62 KB `index.html` (three.js + bloom), 0 console errors
- Open `out/baseline_v0/index.html` in a browser to play (WASD, Space to fire, Shift to boost)
- Screenshots + gameplay video: `out/baseline_v0/shot_*.png`, `play.mp4`

![baseline](out/baseline_v0/shot_3.png)

Known gaps (targets for the render → critique → fix loop): car doesn't look like a Waymo, city
doesn't read as SF, easy to get stuck on buildings, opponents rarely on screen, no Waymo imagery used.

Reproduce:

```bash
uv run scripts/generate_world.py --out out/baseline_v0
uv run scripts/render.py out/baseline_v0
```

Note: Waymo Open Dataset images are **not** in this repo (license forbids redistribution);
fetch them yourself with `scripts/fetch_waymo_images.py`.

