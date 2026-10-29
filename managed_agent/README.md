# Waymo World Builder (Gemini managed agent)

A [Gemini API managed agent](https://ai.google.dev/gemini-api/docs/custom-agents) that rebuilds
this whole project from scratch in a remote sandbox:
1. pull real Waymo camera frames with the repo's existing dataset script
2. build a three.js San Francisco
3. improve it with the render → critique → fix loop
4. add the multiplayer server with bots and the debug dashboard
5. hand back a deployable `build/`

> **Status:** scaffold only, never run. Managed agents are in preview. Field names follow the docs
> page as of 2026-10-09; the items under [Unverified](#unverified) are the ones most likely to need changes.

## Layout

```
managed_agent/
  .agents/
    AGENTS.md                      # system instructions (auto-loaded by the runtime)
    skills/                        # auto-discovered: one per phase
      fetch-waymo-images/SKILL.md
      build-world/SKILL.md
      render-critique-loop/SKILL.md
      multiplayer-server/SKILL.md
      handoff/SKILL.md
  workspace/
    SPEC.md                        # product + technical spec (world contract, wire protocol, done criteria)
    tools/fetch_waymo_https.py     # sandbox adapter for scripts/fetch_waymo_images.py (no gcloud CLI)
  agent_definition.py              # id, base agent, model, tools, sources, network allowlist
  deploy.py                        # client.agents.create / list / get / delete
  run.py                           # client.interactions.create
```

At deploy time, every file under `.agents/` and `workspace/` is sent as an `inline` source at
the same path. The repo's `scripts/` (`fetch_waymo_images.py`, `argon.py`, `generate_world.py`,
`render.py`, `loop.py`) are sent **unchanged** into `workspace/scripts/`, so the agent runs the same
pipeline as this repo, and there are no copies here to drift out of sync.

The agent is deliberately **not** given the finished `index.html` or `backend/`. It has to build
its own Waymo World from `SPEC.md`.

## Setup

1. **Credentials.** Network access goes through an egress proxy that injects stored credentials,
   so no secret is ever part of the agent definition or visible to the agent. Create these in
   your Gemini API project (names can be overridden with env vars of the same name):

   | Credential | Domain | What it must hold |
   |---|---|---|
   | `waymo-world-gemini` (`CRED_GEMINI`) | `generativelanguage.googleapis.com` | a Gemini API key (`x-goog-api-key`), for the Argon critic and builder in `scripts/loop.py` |
   | `waymo-world-gcs` (`CRED_WAYMO_GCS`) | `storage.googleapis.com` | OAuth for a Google account that has **accepted the [Waymo Open Dataset license](https://waymo.com/open/terms)** (see the repo README's Accounts table) |
   | `waymo-world-github` (`CRED_GITHUB`) | `api.github.com`, `github.com` | optional; only with `--github`, for pushing the build branch |

2. **Local API key** for deploying and running: `GEMINI_API_KEY` in the repo's `.env` (same as `scripts/argon.py`).

3. **Check the request** without calling the API:

   ```bash
   uv run managed_agent/deploy.py --dry-run     # writes managed_agent/.build/agent_request.json
   ```

## Deploy and run

```bash
uv run managed_agent/deploy.py                 # create (use --recreate after editing; there's no versioning yet)
uv run managed_agent/run.py                    # full build with the default task
uv run managed_agent/run.py --continue <interaction-id> --task "Run one more improve iteration"
uv run managed_agent/run.py --inline           # skip the saved agent; send the definition with the request
```

Each run's output and interaction ID are saved to `managed_agent/.runs/`, which is gitignored.

## What the agent does

| Phase | Skill | Uses | Output in the sandbox |
|---|---|---|---|
| 1. Reference frames | `fetch-waymo-images` | `tools/fetch_waymo_https.py` → `scripts/fetch_waymo_images.extract()` | `data/images/<segment>/*_FRONT.jpg`, `out/reference_notes.md` |
| 2. Baseline | `build-world` | its own code (optionally `scripts/generate_world.py`) | `out/baseline_v0/index.html` |
| 3. Improve | `render-critique-loop` | `scripts/render.py`, `scripts/loop.py` (Argon critic and builder) | `out/loop_*/`, `out/scores.md` |
| 4. Multiplayer | `multiplayer-server` | Node + `ws` | `build/backend/`, `out/mp_test.mjs` |
| 5. Handoff | `handoff` | git (optional) | `build/{index.html, backend/, render.yaml, REPORT.md}` |

Waymo frames are references only. The instructions forbid copying them into `build/`, printing
them, or pushing them, as the dataset license requires.

## Unverified

These aren't shown on the docs page, so they're best guesses to check against the API reference
before the first real run:
- **API argument names:** `client.agents.get(id=...)` and `client.agents.delete(id=...)`, plus
  `previous_interaction_id` on `interactions.create` (the docs only say the pattern applies),
  and `interaction.id`.
- **Network credentials:** `{"domain": ..., "credential": "<name>"}` entries. The docs show this
  form but not how credentials are created. GCS needs an OAuth token that gets refreshed; check
  that a stored credential supports that, or use a service account the license is attached to.
- **Sandbox tooling:** that it has `pip`, Node/`npm`, and permission for
  `playwright install --with-deps chromium`. The Playwright download domains in the allowlist may
  need adjusting, and `--with-deps` may need OS package mirrors added.
- **Run length:** a full build is long. If interactions time out, switch `run.py` to the
  background-execution API (separate docs page), or run one phase per call with `--continue`.
- **Getting files out:** the docs don't describe downloading files from the sandbox. The handoff
  skill pushes `build/` to a GitHub branch when `--github-repo` is given; without that, you only
  get the text report.
