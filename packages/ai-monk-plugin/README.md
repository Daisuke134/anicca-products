# AI Monk Index plugin

Portable, free, read-only plugin package for the [AI Monk Database](https://aniccaai.com/ai-monk-database). Root `plugin.json` and `mcp.json` follow the Agent Plugins 1.0.0 schemas. The remote endpoint exposes profile search, lookup and coverage through `search_ai_monks`, `get_ai_monk` and `ai_monk_index_stats`, plus format, monetization and source-linked playbook research through `top_formats`, `how_they_monetize` and `winning_playbooks`. No credentials, hooks, executable, local MCP server or video Factory is bundled.

## Install in Codex

Use a Codex CLI with `codex plugin marketplace` support (checked with 0.160.0):

```sh
codex plugin marketplace add Daisuke134/anicca-products --sparse .agents/plugins --sparse packages/ai-monk-plugin
codex plugin add ai-monk-index@anicca
codex plugin list --marketplace anicca
```

This installs from Anicca's repository marketplace. The plugin connects to the existing public, read-only MCP endpoint; no API key or payment is required. Tool reference: [AI Monk Index](../ai-monk-index/README.md).

For a separate video project workspace, open [Monk Factory Web](https://aniccaai.com/ai-monk-factory/).

## Portable ZIP and directory submission

Use the released ZIP as an authoring/submission package. A downloaded ZIP or reachable MCP endpoint does not establish a ChatGPT/Codex public directory listing. Initial MCP review also needs a real reviewer-accessible walkthrough and publisher authentication, identity, permission and domain verification; these cannot be fabricated in source metadata.

The packaged icon is the existing Anicca app artwork. Code and manifest are MIT; the remote dataset has its own attribution and third-party content limits. See the [service terms](https://aniccaai.com/ai-monk-database/terms) and [privacy notice](https://aniccaai.com/ai-monk-database/privacy).
