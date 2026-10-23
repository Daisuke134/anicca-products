# AI Monk Index plugin

Portable, free, read-only plugin v0.1.2 for the [AI Monk Database](https://aniccaai.com/ai-monk-database). Root `plugin.json` and `mcp.json` follow the Agent Plugins 1.0.0 schemas. Research profiles, video structures, products and creator-published production patterns through six public tools:

| Tool | Research available |
| --- | --- |
| `search_ai_monks` | Filter profiles and candidates by language, platform and other indexed fields. |
| `get_ai_monk` | Retrieve one full profile and its referenced sources. |
| `ai_monk_index_stats` | Inspect snapshot coverage, AI status and methodology. |
| `top_formats` | Compare sampled video formats, hooks and script structures with dated view observations. |
| `how_they_monetize` | Inspect products, displayed prices, seller counters and separately attributed revenue claims. |
| `winning_playbooks` | Study source-linked script formulas, voice, cadence and product funnels published by creators. |

Candidate inclusion does not confirm AI production or video format. Sample views are not channel totals; prices and seller counters are not orders; creator claims are unaudited and do not establish profit or MRR. Unknowns remain unknown. Use playbooks as patterns rather than copying scripts verbatim. No credentials, hooks, executable, local MCP server, generation, social connection, posting, purchase flow or income guarantee is bundled.

## Install in Codex

Use a Codex CLI with `codex plugin marketplace` support (checked with 0.160.0):

```sh
codex plugin marketplace add Daisuke134/anicca-products --sparse .agents/plugins --sparse packages/ai-monk-plugin
codex plugin add ai-monk-index@anicca
codex plugin list --marketplace anicca
```

This installs from Anicca's repository marketplace. The plugin connects to the existing public, read-only MCP endpoint; no API key or payment is required. Tool reference: [AI Monk Index](../ai-monk-index/README.md).

## Portable ZIP and directory submission

Use the versioned ZIP as an authoring/submission package. v0.1.2 updates the metadata and five positive/three negative review cases for the existing six-tool endpoint; it does not add server behavior. A downloaded ZIP or reachable MCP endpoint does not establish a ChatGPT/Codex public directory listing. Initial MCP review also needs a real reviewer-accessible walkthrough and publisher authentication, identity, permission and domain verification; these cannot be fabricated in source metadata.

Release packaging uses the merged immutable main commit, with `plugin.json`, `mcp.json`, `README.md` and `assets/icon.png` at the ZIP root. Keep v0.1.1 intact and publish a new `ai-monk-plugin-v0.1.2` tag with `ai-monk-index-plugin-0.1.2.zip`. Verify its file hashes against that main commit and its public download against the official release digest. Release and directory submission remain separate operations.

The packaged icon is the existing Anicca app artwork. Code and manifest are MIT; the remote dataset has its own attribution and third-party content limits. See the [service terms](https://aniccaai.com/ai-monk-database/terms) and [privacy notice](https://aniccaai.com/ai-monk-database/privacy).
