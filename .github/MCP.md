# MCP for AUMARA / EL CID

This file is the contract. JSON in the repo does **not** install Copilot cloud MCP.

## Already on (do not duplicate)

Copilot cloud agent and Copilot code review already ship **GitHub MCP** and **Playwright MCP**.
Do not paste a second GitHub server with `"tools": ["*"]`.

## VS Code / Copilot Chat (Windows)

1. Open `.vscode/mcp.json` (HTTP server, no `tools` field — that is not part of the VS Code HTTP schema).
2. In the MCP view, press **Auth** on the `github` server.
3. Complete the GitHub OAuth flow for `https://api.githubcopilot.com/mcp/`.

## Copilot cloud (github.com)

Repository **Settings → Copilot → MCP servers**.

- Built-in GitHub MCP is enough for this repo.
- `.github/mcp-config.json` is a **paste template** for *extra* servers only. It starts empty on purpose.
- If a custom GitHub server is required later, use `https://api.githubcopilot.com/mcp/` with an allowlisted toolset — never `"*"`.
