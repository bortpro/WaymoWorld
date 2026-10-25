# WaymoWorld

A multiplayer browser game: players drive Waymos around a city and shoot lasers at each other.

## Status

- **Frontend** (`index.html`): multiplayer game. A start modal asks for a username; a leaderboard (top right) shows players online and kill counts. Every other car is a real player (the old single-player bots were removed).
- **Backend** (`backend/`): WebSocket game server. Tracks players, broadcasts 20 Hz position snapshots, validates hits, and owns HP / kills / deaths.

## Deployments (Render)

| Part     | URL                                       |
| -------- | ----------------------------------------- |
| Frontend | https://waymoworld.onrender.com/          |
| Backend  | https://waymoworld-server.onrender.com    |

- WebSocket endpoint: `wss://waymoworld-server.onrender.com/ws`
- Health check: `https://waymoworld-server.onrender.com/health` returns `{ ok, clients, players }`
- Debug dashboard: `https://waymoworld-server.onrender.com/debug?token=<DEBUG_TOKEN>` (see below)

## Layout

```
index.html          # Whole frontend: one HTML file with an inline ES module, Three.js r160 from jsDelivr via importmap
backend/
  package.json      # Node >= 20, ESM, sole dependency: ws
  src/server.js     # HTTP server (/health, /debug) + WebSocketServer on /ws, player registry, 20 Hz snapshots, hit validation, 30s ping/pong heartbeat
  src/debug.html    # Debug dashboard page served at /debug
```

## Running locally

Frontend: serve the root folder with any static server, for example:

```sh
npx serve .
```

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

`/debug` is a live view of all server state. It polls `/debug/state` (JSON) every 0.25 to 5 s and shows:
- an overview: uptime, sockets, players, spectators, message rates, memory
- a top-down map of players with heading, HP, and hit range
- every player field (position, HP, live shots, spawn protection, how long since their last state update)
- every socket (IP, user agent, message counts, send buffer)
- counters, including messages by type and shots or hits rejected by reason
- config, a log of the last 200 events (connect, join, hit, hit-rejected, kill, leave, …), and the raw JSON

Access: with no `DEBUG_TOKEN` env var set, it only answers direct localhost requests (`http://localhost:8080/debug`). On Render, set `DEBUG_TOKEN` in the service's environment and open `/debug?token=<value>`. The page includes player IPs, so keep the token private.

## Multiplayer model

- **Each client owns its own car's movement** and sends `state` 20×/s. The server clamps it to the world bounds and rebroadcasts everyone in `snap`.
- **Remote cars** ease toward the latest snapshot, extrapolating with `speed` for up to 250 ms; a jump of more than 40 units snaps (respawn).
- **Hits are detected by the shooter's client** (its own lasers vs. remote cars) and reported as `hit`. The server rejects a hit if there's no unspent shot from the last 2 s, the target is more than 320 units away, or the target is within 2 s of (re)spawning. Otherwise it applies 25 damage.
- **The server owns HP, kills, and deaths.** At 0 HP it broadcasts `kill`, resets the victim to 100 HP, and heals the killer by 25. The victim's client picks a new random spawn point.
- **The city is generated with a seeded RNG** (`cityRandom`, seed 415), so building heights, and therefore laser collisions, match on every client. Window textures still use `Math.random` (cosmetic only).
- Clients on the start modal are connected but not joined: they receive all broadcasts (remote cars drive around behind the modal), but aren't in the roster.

## Message protocol

All messages are JSON with a `type` field. Tuning constants are at the top of `backend/src/server.js`; keep them in sync with `index.html`.

Client → server:

| type | fields | notes |
|---|---|---|
| `join` | `name` | sent on Start; name is sanitized to ≤16 chars of letters, digits, space, `_.-` (default `Waymo<id>`) |
| `state` | `x, z, a, s` | position, heading (rad), speed; 20 Hz |
| `shoot` | `p: [x,y,z], d: [x,y,z]` | laser origin and direction; server cooldown 150 ms |
| `hit` | `target` | id of the remote player your laser hit |

Server → client:

| type | fields | notes |
|---|---|---|
| `welcome` | `players: [{id,name,kills,deaths,x,z,a,s,hp}]` | on connect |
| `joined` | `id, name` | reply to your `join` (with the sanitized name) |
| `join` / `leave` | `player` / `id` | broadcast to everyone, including the joiner |
| `snap` | `p: [[id,x,z,a,s,hp], ...]` | 20 Hz, all joined players |
| `shoot` | `id, p, d` | to everyone except the shooter |
| `hp` | `id, hp, by?` | after damage or the kill heal |
| `kill` | `killer, victim, killerKills, victimDeaths` | |
| `error` | `error` | e.g. invalid JSON |

## Game state in `index.html`

The world is 3D with **y pointing up**; cars drive on the **x–z plane**. State lives in module-level globals: `player` (local car), `remoteVehicles` (Set of other players' cars), `roster` (Map id → `{id,name,kills,deaths,vehicle}`), `myId`, `lasers[]`, `particles[]`, `buildings[]` (collision boxes `{minX,maxX,minZ,maxZ,maxY}`), and `keys` (input).

### Car (`class Vehicle`)

| Field | What it's for | Send over the network? |
|---|---|---|
| `pos.x`, `pos.z` | position on the ground | **yes** |
| `angle` | heading in radians; forward is `(sin a, 0, cos a)` | **yes** |
| `speed` | signed scalar speed (driving backwards is negative) | yes, useful so other clients can predict movement |
| `hp` | 0–100 | yes |
| `energy` | 0–100, spent on boost and shooting | probably only the owner needs it |
| `pos.y` | worked out from the terrain (`getElevation(x, z)`) | no |
| `mesh.quaternion` | tilt on hills, worked out from the terrain normal and `angle` | no |
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
| `index.html` | Eric | the deployed game (Render) |
| `backend/` | Eric | multiplayer / WebSocket server |
| `scripts/` | Argon loop | data fetch, Argon client, generate / render / loop |
| `out/` | Argon loop | baseline and loop iterations |

Argon loop work happens on the `loop` branch and merges into `main` at the end.
Don't delete other people's paths; `git pull --rebase` before pushing; never force-push `main`.

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

