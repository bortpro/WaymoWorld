# /// script
# requires-python = ">=3.10"
# dependencies = ["google-genai", "python-dotenv"]
# ///
"""Create, inspect, or delete the Waymo World Builder managed agent.

Managed agents have no versioning yet, so "update" means delete + create (--recreate).

Usage:
  uv run managed_agent/deploy.py --dry-run          # write the request to managed_agent/.build/, no API call
  uv run managed_agent/deploy.py                    # create
  uv run managed_agent/deploy.py --recreate         # delete the existing agent, then create
  uv run managed_agent/deploy.py --github           # also allow pushing the build to GitHub
  uv run managed_agent/deploy.py --show | --delete | --list
"""
import argparse
import json
import os
import sys

from dotenv import load_dotenv

import agent_definition as d


def client():
    load_dotenv(d.REPO / ".env")
    if not os.environ.get("GEMINI_API_KEY"):
        raise SystemExit("GEMINI_API_KEY not set; create .env from env.example")
    from google import genai
    return genai.Client()  # reads GEMINI_API_KEY; never printed


def request(github: bool) -> dict:
    return {
        "id": d.AGENT_ID,
        "base_agent": d.BASE_AGENT,
        "agent_config": d.AGENT_CONFIG,
        "description": d.DESCRIPTION,
        "system_instruction": d.SYSTEM_INSTRUCTION,
        "tools": d.TOOLS,
        "base_environment": d.base_environment(github),
    }


def main():
    p = argparse.ArgumentParser()
    p.add_argument("--dry-run", action="store_true", help="write the create request to .build/ and exit")
    p.add_argument("--recreate", action="store_true", help="delete the existing agent first")
    p.add_argument("--github", action="store_true", help="allowlist GitHub with the stored credential")
    p.add_argument("--show", action="store_true")
    p.add_argument("--delete", action="store_true")
    p.add_argument("--list", action="store_true")
    a = p.parse_args()

    req = request(a.github)
    if a.dry_run:
        out = d.HERE / ".build" / "agent_request.json"
        out.parent.mkdir(exist_ok=True)
        out.write_text(json.dumps(req, indent=2))
        srcs = req["base_environment"]["sources"]
        print(f"wrote {out.relative_to(d.REPO)}")
        print(f"{len(srcs)} inline sources, {sum(len(s['content']) for s in srcs) / 1024:.0f} KB:")
        for s in srcs:
            print(f"  {s['target']}  ({len(s['content']) / 1024:.1f} KB)")
        print("network allowlist:", ", ".join(e["domain"] for e in req["base_environment"]["network"]["allowlist"]))
        return

    c = client()
    # NOTE: argument names for get/delete aren't shown on the docs page; check the API reference.
    if a.list:
        for agent in c.agents.list():
            print(getattr(agent, "id", agent))
        return
    if a.show:
        print(c.agents.get(id=d.AGENT_ID))
        return
    if a.delete or a.recreate:
        try:
            c.agents.delete(id=d.AGENT_ID)
            print(f"deleted {d.AGENT_ID}")
        except Exception as e:  # not found on first deploy
            print(f"delete skipped: {e}", file=sys.stderr)
        if a.delete:
            return

    agent = c.agents.create(**req)
    print(f"created {getattr(agent, 'id', d.AGENT_ID)} on {d.BASE_AGENT} ({d.AGENT_CONFIG['model']})")


if __name__ == "__main__":
    main()
