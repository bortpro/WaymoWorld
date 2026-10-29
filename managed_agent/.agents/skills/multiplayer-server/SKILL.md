---
name: multiplayer-server
description: Build the Node.js WebSocket game server (players, 20 Hz snapshots, server-validated hits, 5 street-driving bots, /debug dashboard) and connect the client to it, then verify with scripted clients
---

# Multiplayer server

Build `workspace/build/backend/`:

```
backend/
  package.json      # "type": "module", engines node >= 20, scripts start/dev, only dependency: ws
  src/server.js     # http (/, /health, /debug, /debug/state) + WebSocketServer on /ws
  src/debug.html    # dashboard page served at /debug
```

```bash
cd workspace/build/backend && npm install ws && node src/server.js   # PORT defaults to 8080
```

## Server design (follow SPEC.md §3–4 exactly)

- **State:** `players: Map<ws, entity>` for joined humans and `bots: entity[]`. Both use one
  entity shape: `{id,name,kills,deaths,x,z,a,s,hp,joinedAt,spawnedAt,lastShotAt,lastStateAt,shots[]}`,
  and bots add `bot: true` plus nav state `{i,j,di,dj,speed,fireMs}`. Spectators (connected, not
  joined) get every broadcast.
- **One hit path:** `tryHit(shooter, target, now)` is used for `hit` (human→anyone) and `botHit`
  (bot→the sender). It spends one live shot, checks range and spawn protection, applies damage,
  broadcasts `hp`, and on a kill updates kills and deaths, heals the killer, respawns bots on the
  server side, and broadcasts `kill`.
- **Tick (50 ms):** dt-based bot movement along centerlines (turn at intersections), the bot
  firing check, then one `snap` with every entity. Skip the tick when `wss.clients.size === 0`.
- **Hardening:** `maxPayload` of 4 KB, `Object.hasOwn(handlers, type)` dispatch (so
  `{"type":"toString"}` is ignored), and a ping/pong heartbeat that terminates dead sockets every 30 s.
- **Instrumentation for `/debug`:** counters (messages in and out, bytes, messages by type,
  rejected shots and hits by reason, bot shots, kills), per-socket metadata (IP from
  `x-forwarded-for`, user agent, message counts, `bufferedAmount`), and a 200-entry event ring
  buffer. Access: if `DEBUG_TOKEN` is set, require `?token=` (constant-time compare); otherwise
  allow only direct localhost requests.

## Client wiring (in `index.html`)

- `connect()` with auto-reconnect every 2 s. On open, send `join` if the game was already started.
- Handlers for `welcome`, `joined`, `join`, `leave`, `snap`, `shoot`, `hp` and `kill`, per SPEC.md §3.
- `sendState()` on a 50 ms interval. `netSend()` is a no-op until `joined`.
- Own lasers report `hit` for remote targets. Bot lasers hitting the local car report `botHit`.
  Show the spawn shield (blue sparks, no hit report) inside the 2 s protection window.
- Leaderboard: count humans (`!bot`) for "N players online" and list bots in grey italics.

## Verify (required before handoff)

Write `workspace/out/mp_test.mjs` with Node and `ws`, then run it against a local server. Check all of these:

1. Two clients join. Each sees the other's `join`. A third socket's `welcome` lists both
   players and all 5 bots.
2. A `hit` with no prior `shoot` is rejected, and a `hit` inside the 2 s spawn protection is rejected.
3. After 2 s, four `shoot` + `hit` pairs produce `hp` 75, 50, 25 and then a `kill` with the right
   `killerKills` and `victimDeaths`.
3b. Park a client 40 units in front of a bot on its street. The bot fires, `botHit` reports are
   accepted, and the client's HP drops.
4. Over about 6 s of snapshots, every bot position lies on a street centerline (`(v + 585) % 100 ≈ 0` in x or z).
5. Malformed JSON gets an `error` reply, and the server keeps running.
6. `/debug/state` from localhost returns 200. With `X-Forwarded-For` set and no token, it returns 403.

Also do one browser check: open `build/index.html?server=ws://localhost:8080/ws` in two Playwright
pages, start both, and screenshot one page showing the other car with its name label and minimap dot.

## Load note for the report

Snapshots cost N² (every client gets every entity, 20 times a second), and each shot fans out to
N−1 clients. On the original project, 300 bot clients took 60 MB/s outbound. If the report
discusses scale, recommend rooms of about 50 players before upgrading the server.
