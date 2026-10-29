"""Single source of truth for the Waymo World Builder managed agent.

deploy.py sends this to `client.agents.create(...)`; run.py uses it for --inline runs.
Field names follow https://ai.google.dev/gemini-api/docs/custom-agents (managed agents are in preview).
"""
import os
from pathlib import Path

HERE = Path(__file__).resolve().parent
REPO = HERE.parent

AGENT_ID = "waymo-world-builder"            # unique per project; must not start with gemini-/google-/antigravity-
BASE_AGENT = "antigravity-preview-09-2026"
AGENT_CONFIG = {"type": "antigravity", "model": os.environ.get("AGENT_MODEL", "gemini-3.8-flash")}
DESCRIPTION = "Builds Waymo World (multiplayer three.js SF laser tag) from Waymo Open Dataset references."

# AGENTS.md is auto-loaded as system instructions; this only points at it.
SYSTEM_INSTRUCTION = (
    "You are the Waymo World Builder. Your full instructions are in .agents/AGENTS.md and the "
    "spec is in workspace/SPEC.md. Load the matching skill from .agents/skills/ before each phase."
)

TOOLS = [
    {"type": "code_execution"},
    {"type": "url_context"},
]

# The original project's pipeline scripts, shipped unchanged into workspace/scripts/.
REPO_SCRIPTS = ["fetch_waymo_images.py", "argon.py", "generate_world.py", "render.py", "loop.py"]

# Stored credentials the egress proxy injects at request time (secrets never enter the definition).
# Create them in your Gemini API project under these names, or override the names via env vars.
CRED_GEMINI = os.environ.get("CRED_GEMINI", "waymo-world-gemini")    # x-goog-api-key for Argon calls
CRED_WAYMO_GCS = os.environ.get("CRED_WAYMO_GCS", "waymo-world-gcs")  # OAuth for a Waymo-license-accepted account
CRED_GITHUB = os.environ.get("CRED_GITHUB", "waymo-world-github")     # only used with --github


def _inline(target: str, path: Path) -> dict:
    return {"type": "inline", "target": target, "content": path.read_text()}


def collect_sources() -> list[dict]:
    """Every file under .agents/ and workspace/, plus the repo's scripts, as inline sources."""
    sources = []
    for root in (".agents", "workspace"):
        for path in sorted((HERE / root).rglob("*")):
            if path.is_file() and "__pycache__" not in path.parts:
                sources.append(_inline(path.relative_to(HERE).as_posix(), path))
    for name in REPO_SCRIPTS:
        sources.append(_inline(f"workspace/scripts/{name}", REPO / "scripts" / name))
    return sources


def network(github: bool = False) -> dict:
    allow = [
        {"domain": "generativelanguage.googleapis.com", "credential": CRED_GEMINI},
        {"domain": "storage.googleapis.com", "credential": CRED_WAYMO_GCS},
        # Package installs
        {"domain": "pypi.org"},
        {"domain": "files.pythonhosted.org"},
        {"domain": "registry.npmjs.org"},
        # three.js for the game and headless renders
        {"domain": "cdn.jsdelivr.net"},
        # `playwright install chromium` downloads (check these if the install is blocked)
        {"domain": "cdn.playwright.dev"},
        {"domain": "playwright.download.prss.microsoft.com"},
    ]
    if github:
        allow += [
            {"domain": "api.github.com", "credential": CRED_GITHUB},
            {"domain": "github.com", "credential": CRED_GITHUB},
        ]
    return {"allowlist": allow}


def base_environment(github: bool = False) -> dict:
    return {"sources": collect_sources(), "network": network(github)}
