# AUMARA / EL CID — vertical slice standard

One repository. Three blocks. A living process, not a slide.

| Block | Path | What it does |
| --- | --- | --- |
| Hands (MCP) | `.vscode/mcp.json` | VS Code Copilot: open the file, press **Auth** on `github`. See `.github/MCP.md`. |
| Hands (cloud) | `.github/mcp-config.json` | **Settings template only** — does not install MCP. Built-in GitHub MCP is already on. |
| Pipeline | `.github/workflows/auto-prepare-merge.yml` | Typecheck **and** lint. Lint is a hard gate (`continue-on-error` is forbidden). |
| Director | `agent/director.mjs` | Waits for prepare-merge, reads the real conclusion, comments GO or HOLD. |

Copy these files into the next AUMARA / EL CID repo. Keep the lock (`AUMARA_TWIN_LOCK.json`) as the geometry source of truth in the twin repo.

Green means both jobs actually passed. A green badge with a failing lint step is a hold.
