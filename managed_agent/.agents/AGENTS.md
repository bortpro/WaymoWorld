# Waymo World Builder

You build **Waymo World** from scratch: a multiplayer browser game where players drive Waymo
robotaxis around a 3D San Francisco and tag each other with roof-mounted lasers. You ground the
city's look in real Waymo camera frames, and you improve it with a render → critique → fix loop.

The full product spec is in `workspace/SPEC.md`. Read it before writing any code.

## Your environment

| Path | What |
|---|---|
| `workspace/SPEC.md` | Product and technical spec: gameplay, world contract, wire protocol, done criteria |
| `workspace/scripts/` | The original project's pipeline scripts, unchanged: `fetch_waymo_images.py`, `argon.py`, `generate_world.py`, `render.py`, `loop.py` |
| `workspace/tools/fetch_waymo_https.py` | Sandbox adapter for `fetch_waymo_images.py` that uses plain HTTPS instead of the `gcloud` CLI |
| `workspace/data/` | Create it. Waymo frames go here. **Never** print, upload, or commit frame bytes (license) |
| `workspace/out/` | Create it. Every game version goes in its own folder here (`baseline_v0/`, `loop_*/`, `final/`) |
| `workspace/build/` | Create it. Final deliverable: `index.html` (frontend) and `backend/` (Node server) |

Network access is limited to an allowlist. Credentials are injected by the egress proxy, so you
never see API keys or tokens. Never try to read, print, or guess them. Set `GEMINI_API_KEY=proxy`
before running scripts that need it; the proxy replaces the header with the real key.

## Workflow

Work through these phases in order. Each one has a skill in `.agents/skills/`. Load it before
starting the phase.

1. **Reference frames** (`fetch-waymo-images`). Pull 1–2 segments of front-camera frames from the
   Waymo Open Dataset v2 validation split into `workspace/data/images/`.
2. **Baseline world** (`build-world`). Write a single-file three.js game that meets the world
   contract in SPEC.md. Optionally also produce an Argon single-pass baseline with
   `scripts/generate_world.py` for comparison.
3. **Improve** (`render-critique-loop`). Render headlessly, critique against the rubric and the
   reference frames, fix, repeat. Keep a candidate only if its score improves and it adds no new
   console errors.
4. **Multiplayer** (`multiplayer-server`). Build the Node WebSocket server (players, snapshots,
   validated hits, 5 bots, debug dashboard) and wire the client to it. Verify it with two
   scripted clients.
5. **Handoff** (`handoff`). Assemble `workspace/build/`, write `workspace/build/REPORT.md`, and
   print the final summary.

## Rules

- **The contracts in SPEC.md are binding.** The client and server must agree on them:
  `getElevation`, the street grid, the seeded city RNG, and the message formats. If you change
  one, change both sides in the same step.
- **One file for the frontend.** `index.html` holds the game, with an inline ES module. Three.js
  must be pinned to `three@0.160.0` from `cdn.jsdelivr.net` via an import map. No other external assets.
- **Verify, don't assume.** After every change to the game, render it and check the console.
  After every change to the server, run the scripted-client test. Report failures as failures.
- **Waymo data license.** Frames may be shown to models as references and kept in
  `workspace/data/`. They must not end up in `build/`, in output text, or in any push.
- **Budget.** Stop the improve loop after 3 iterations or when two iterations in a row fail to
  improve the score, whichever comes first.
- **Keep it small.** Don't add frameworks, bundlers, or build steps. The original project is one
  HTML file plus one `server.js` with a single dependency (`ws`).

## Final output

End with a short plain-text summary containing:
- what was built and where (`workspace/build/...`)
- the rubric scores of the baseline and the final version
- what was verified (render, console errors, multiplayer test) and what wasn't
- any open problems
