# AUMARA Director

Vertical slice for every AUMARA / EL CID repository:

1. **MCP (VS Code)** — `.vscode/mcp.json`. Open it and press Auth. See `.github/MCP.md`.
2. **MCP (cloud)** — `.github/mcp-config.json` is a Settings paste template. GitHub MCP is already enabled by default.
3. **Auto-Prepare-Merge** — typecheck + lint, lint is a hard gate.
4. **Director** — second job on the same workflow (`needs: prepare-merge`). Reads the real conclusion.

## Run locally

```bash
export GITHUB_TOKEN=ghp_xxx
export GITHUB_REPOSITORY=elcidspain/aumara
export PREPARE_CONCLUSION=success
node agent/director.mjs
```

On a pull request the Actions job comments GO or HOLD. Manual dispatch: `workflow_dispatch` on `director.yml`.
