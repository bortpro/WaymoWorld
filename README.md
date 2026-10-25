# WaymoWorld

A multiplayer browser game: players drive Waymos around a city and shoot lasers at each other.

## Status

- **Frontend** (`index.html`): a fairly complete **single-player** game. Multiplayer is not wired up yet.
- **Backend** (`backend/`): scaffolding for a WebSocket server. It currently just relays every message to all other connected clients; there's no game logic yet.

## Deployments (Render)

| Part     | URL                                       |
| -------- | ----------------------------------------- |
| Frontend | https://waymoworld.onrender.com/          |
| Backend  | https://waymoworld-server.onrender.com    |

- WebSocket endpoint: `wss://waymoworld-server.onrender.com/ws`
- Health check: `https://waymoworld-server.onrender.com/health` returns `{ ok, clients }`

## Layout

```
index.html          # Whole frontend: one HTML file with an inline ES module, Three.js r160 from jsDelivr via importmap
backend/
  package.json      # Node >= 20, ESM, sole dependency: ws
  src/server.js     # HTTP server (/health) + WebSocketServer on /ws, broadcast relay, 30s ping/pong heartbeat
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

## Message protocol (current)

- On connect, the server sends `{ "type": "welcome" }`.
- Clients send JSON; the server rebroadcasts each message unchanged to every other client.
- If a message isn't valid JSON, the server replies `{ "type": "error", "error": "invalid JSON" }`.

## Game state in `index.html`

The world is 3D with **y pointing up**; cars drive on the **x–z plane**. State lives in module-level globals: `player`, `bots[]`, `lasers[]`, `particles[]`, `buildings[]` (collision boxes `{minX,maxX,minZ,maxZ,maxY}`), `score`, and `keys` (input).

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
| `vel` | declared but never used | no |
| `maxSpeed`, `accel`, `handling` | fixed tuning values | no |
| `lastShot` | timer that limits fire rate | no (owner only) |
| `aiState`, `targetAngle`, `aiTimer` | bot AI only | no |

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

