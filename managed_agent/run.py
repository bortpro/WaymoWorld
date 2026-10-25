# /// script
# requires-python = ">=3.10"
# dependencies = ["google-genai", "python-dotenv"]
# ///
"""Invoke the Waymo World Builder.

Each invocation forks the agent's base environment, so every run starts clean. Use --continue to
follow up on an earlier interaction (previous_interaction_id).

Usage:
  uv run managed_agent/run.py                                  # full build with the default task
  uv run managed_agent/run.py --task "Only run phases 1-2"     # custom task
  uv run managed_agent/run.py --continue <interaction-id> --task "Now do phase 4"
  uv run managed_agent/run.py --github-repo you/waymo-world    # ask it to push (deploy with --github)
  uv run managed_agent/run.py --inline                         # no saved agent: define it per request
"""
import argparse
import json
import sys
import time
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parent))
import agent_definition as d  # noqa: E402
from deploy import client  # noqa: E402

DEFAULT_TASK = """Build Waymo World end to end, following .agents/AGENTS.md:
1. Fetch 2 segments of FRONT-camera reference frames.
2. Build the single-file three.js baseline that meets workspace/SPEC.md.
3. Run up to 3 render -> critique -> fix iterations.
4. Build and verify the multiplayer server with bots and the debug dashboard.
5. Assemble workspace/build/ with REPORT.md and give me the final summary."""


def main():
    p = argparse.ArgumentParser()
    p.add_argument("--task", help="task text (default: full build)")
    p.add_argument("--task-file", type=Path)
    p.add_argument("--continue", dest="previous", metavar="INTERACTION_ID")
    p.add_argument("--github-repo", help="owner/repo to push the build branch to")
    p.add_argument("--inline", action="store_true", help="send the agent definition with the request")
    a = p.parse_args()

    task = a.task_file.read_text() if a.task_file else (a.task or DEFAULT_TASK)
    if a.github_repo:
        task += f"\n\nGITHUB_REPO={a.github_repo} (push per the handoff skill)."

    kwargs = {"input": task}
    if a.previous:
        kwargs["previous_interaction_id"] = a.previous
    if a.inline:
        kwargs.update(
            agent=d.BASE_AGENT,
            system_instruction=d.SYSTEM_INSTRUCTION,
            tools=d.TOOLS,
            environment=d.base_environment(github=bool(a.github_repo)),
        )
    else:
        kwargs.update(agent=d.AGENT_ID, environment="remote")

    c = client()
    t0 = time.time()
    interaction = c.interactions.create(**kwargs)
    elapsed = time.time() - t0

    interaction_id = getattr(interaction, "id", None)
    output = interaction.output_text
    print(output)
    print(f"\n[interaction {interaction_id}, {elapsed:.0f}s]", file=sys.stderr)

    runs = d.HERE / ".runs"
    runs.mkdir(exist_ok=True)
    record = {"id": interaction_id, "agent": kwargs["agent"], "task": task, "seconds": round(elapsed), "output": output}
    (runs / f"{time.strftime('%Y%m%d-%H%M%S')}.json").write_text(json.dumps(record, indent=2))


if __name__ == "__main__":
    main()
