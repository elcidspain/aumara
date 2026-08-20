# AUMARA Director

Vertical slice for every AUMARA / EL CID repository:

1. **MCP** — `.vscode/mcp.json` (IDE) + `.github/mcp-config.json` (Copilot cloud).
2. **Auto-Prepare-Merge** — `.github/workflows/auto-prepare-merge.yml`
3. **Director** — this folder + `.github/workflows/director.yml`

## Run locally

```bash
export GITHUB_TOKEN=ghp_xxx
export GITHUB_REPOSITORY=elcidspain/aumara
node agent/director.mjs
```

On a pull request the Actions job comments the same report on the PR.
