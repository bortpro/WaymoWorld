---
name: handoff
description: Assemble the final deliverable in workspace/build, write REPORT.md with scores and verification results, and (if a GitHub credential is configured) push it as a branch
---

# Handoff

## Assemble

```
workspace/build/
  index.html        # the best-scoring version, wired for multiplayer; set PROD_SERVER_URL to a placeholder
  backend/          # from the multiplayer-server phase (no node_modules)
  render.yaml       # Render blueprint: static site for index.html, web service for backend (start: node src/server.js)
  REPORT.md
```

Before finishing, confirm that `build/` contains no Waymo frames or anything derived from their
pixels. `grep -rI` for `.jpg`, `base64` and `data:image/jpeg` must come back empty.

## REPORT.md

- Pipeline that was run: which segments were fetched (names only), and the iterations with their per-criterion scores.
- The baseline vs final score table, with an `out/<version>/shot_*.png` path for each version.
- Verification results: render console errors, each multiplayer test check with pass or fail, and the browser check.
- Known gaps and next steps.

## Optional: push

Push only if `GITHUB_REPO` is set in the task input. The egress proxy then has an `api.github.com`
credential, and `github.com` is on the allowlist.

```bash
cd workspace/build
git init -b agent/waymo-world && git add -A && git commit -m "Waymo World built by managed agent"
git push "https://github.com/$GITHUB_REPO.git" agent/waymo-world
```

Never force-push, and never push to `main`. If the push fails, report it and leave the build in place.
