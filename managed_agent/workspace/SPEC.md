# Waymo World: spec

A browser game in the spirit of fly.pieter.com: open the page, pick a username, and you're
driving a Waymo in a shared 3D San Francisco with everyone else who's online, shooting lasers.

## 1. Player experience

- **Start modal** (centered): title, one-paragraph pitch, username input (≤16 chars, remembered
  in `localStorage`), controls list, **Start** button (Enter also starts), connection status.
  Behind the modal, the camera orbits the city and other players' cars keep driving.
- **Controls:** W/S or ↑/↓ throttle and reverse, A/D or ←/→ steer, Space or click to fire, Shift to boost.
- **HUD:** kills, deaths, speed (top left); armor and laser-energy bars (bottom left);
  **leaderboard** (top right: "N players online · M bots", top 10 by kills with your row
  highlighted); **whole-city minimap** (bottom right: north-up, buildings drawn, you as a heading
  arrow, everyone else as a dot with their name); kill feed (left).
- **Combat:** 25 damage per hit, 100 HP, so 4 hits is a kill. The killer heals 25. The victim
  respawns at a random street position with 2 s of spawn protection.
- Remote cars show a floating name and an HP bar.

## 2. World contract (client and server must agree)

Units are meters, y is up, and cars drive on the x–z plane. Heading `a` is in radians and forward
is `(sin a, 0, cos a)`.

```js
const GRID_STEPS = 12, BLOCK_SIZE = 70, STREET_WIDTH = 30;
const CELL_SIZE = BLOCK_SIZE + STREET_WIDTH;        // 100
const OFFSET = (GRID_STEPS * CELL_SIZE) / 2;        // 600
const SHORE_X = 395;                                // cars can't drive east of this (the bay)
// Block (gx, gz) has buildings from cellX + STREET_WIDTH to cellX + CELL_SIZE (cellX = -OFFSET + gx*CELL_SIZE).
// So street centerlines are at x, z = -OFFSET + k*CELL_SIZE + STREET_WIDTH/2 = -585 + 100k.
// Streets carry NO collision boxes (props go on sidewalks only), so bots can drive centerlines blind.

function getElevation(x, z) {                       // copy EXACTLY into the server
  if (x > 450) return -8;
  let bayFactor = 1;
  if (x > 300) bayFactor = 1 - ((x - 300) / 150);
  let h = 0;
  h += (Math.sin(x * 0.008) * Math.cos(z * 0.008) + 1) * 25;
  const d1 = Math.sqrt((x + 100) ** 2 + (z - 100) ** 2);
  h += Math.max(0, 60 - d1 * 0.2);
  const d2 = Math.sqrt((x - 100) ** 2 + (z + 200) ** 2);
  h += Math.max(0, 45 - d2 * 0.15);
  return h * bayFactor;
}
```

- **The city is deterministic.** Building heights and choices come from a seeded `mulberry32`
  (seed 415), so every client builds identical collision boxes `{minX,maxX,minZ,maxZ,maxY}`.
  Cosmetic randomness (window textures, particles) may use `Math.random`.
- **Water is always outside the city.** It starts at the shoreline or the city edge, never over streets.
- **Lasers:** spawn at the roof (y + 2.02), speed 250, life 1 s, straight line. They stop on
  terrain, buildings, or a car (horizontal radius² < 5.2, |dy| < 1.7 around y + 1).

## 3. Wire protocol (WebSocket, JSON, `type` field)

The server listens on `/ws` (port `$PORT`, default 8080) and also serves `/health` and `/debug`.

Client → server:

| type | fields | server behavior |
|---|---|---|
| `join` | `name` | sanitize to `[\p{L}\p{N} _.-]`, ≤16 chars, default `Waymo<id>` |
| `state` | `x, z, a, s` | 20 Hz; clamp to ±700 |
| `shoot` | `p:[x,y,z], d:[x,y,z]` | 150 ms cooldown; record the shot; relay to everyone except the sender |
| `hit` | `target` | the shooter's laser hit a player or bot; validate, then apply damage |
| `botHit` | `bot` | a bot's laser hit *my* car (bots can't see lasers); validate, then apply damage |

Server → client: `welcome {players:[{id,name,kills,deaths,x,z,a,s,hp,bot}]}` on connect,
`joined {id,name}`, `join {player}`, `leave {id}`, `snap {p:[[id,x,z,a,s,hp],…]}` at 20 Hz
(sent whenever any socket is connected, so spectators see movement), `shoot {id,p,d}`,
`hp {id,hp,by?}`, `kill {killer,victim,killerKills,victimDeaths}`, `error {error}`.

**Authority:** each client owns its own car's movement. The server owns HP, kills, and deaths.
A hit is rejected (and counted by reason) if the shooter has no unspent shot from the last 2 s,
the target is more than 320 units away, or the target is spawn-protected (2 s).

**Remote cars** ease toward the latest snapshot and dead-reckon with `s` for up to 250 ms. A jump
of more than 40 units snaps instead (a respawn).

## 4. Server extras

- **5 bots** that are always in the game (`bot: true`, same entity shape as players). They drive
  intersection to intersection on street centerlines (streets 1–9 in x, 1–11 in z), head toward
  the nearest human within 450 units 70% of the time, and fire only straight down their own
  street at a human within 140 units (guaranteed line of sight), with ±2 units of aim spread and
  1.1–1.6 s between shots. Skip the simulation when no sockets are connected.
- **Debug dashboard** at `/debug`, polling `/debug/state`. It shows the overview, a top-down map,
  every player and bot field, every socket, counters (messages by type, hits rejected by reason),
  config, and the last 200 events. It answers localhost only, unless `DEBUG_TOKEN` is set and
  passed as `?token=`.
- The frontend picks its server like this: `?server=` override; otherwise `ws://localhost:8080/ws`
  on localhost or file://; otherwise the production URL (a constant).

## 5. Look

Clear, sunny San Francisco daytime. No fog, no daytime bloom. A blue gradient sky dome pinned to
the far plane, ACES tone mapping at about 0.78 exposure, PBR materials, non-metallic mid-grey
asphalt, soft shadows from one sun that follows the player. The Waymo is a white Jaguar I-PACE
silhouette with a roof lidar dome and corner sensor pods. Victorian and Edwardian row houses with
bay windows sit on the hills, with a downtown cluster (Transamerica Pyramid, Salesforce Tower),
Coit Tower, a Golden Gate Bridge over water beyond the city edge, and cable cars. Props go on
sidewalks, never in the roadway. Match the palette and street character of the Waymo reference frames.

## 6. Done criteria

1. `build/index.html` opens with zero console errors (other than a failed connection when no server is running).
2. A scripted drive (`scripts/render.py`) shows the car moving, lasers firing, and no getting stuck.
3. A two-client scripted test against `build/backend` passes: both clients see each other; 4
   validated hits produce `hp` 75 → 50 → 25 and then a `kill`; invalid hits are rejected; bots
   appear in `welcome` and move only on street centerlines.
4. The rubric score of the final version (from `scripts/loop.py --eval-only`) beats the baseline's.
