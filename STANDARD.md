# AUMARA / EL CID — vertical slice standard

One repository. Three blocks. A living process, not a slide.

| Block | Path | What it does |
| --- | --- | --- |
| Hands (MCP) | `.vscode/mcp.json`, `.github/mcp-config.json` | Agents get GitHub tools |
| Pipeline | `.github/workflows/auto-prepare-merge.yml` | Every PR is typechecked and linted |
| Director | `agent/director.mjs` + `.github/workflows/director.yml` | Reads open PRs, comments a merge decision |

Copy these files into the next AUMARA / EL CID repo. Keep the lock (`AUMARA_TWIN_LOCK.json`) as the geometry source of truth in the twin repo.
