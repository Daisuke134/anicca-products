# AI Monk Index — CLI and MCP

Search the source-linked [AI Monk Database](https://aniccaai.com/ai-monk-database) from a terminal or an MCP client. Free and read-only. The local CLI and stdio server work offline after installation; the hosted HTTP endpoint requires an internet connection. No account or API key is required.

This release focuses on realistic AI monk video avatars such as Yang Mun and uses the 2026-10-23 research observations: **4 evidence-reviewed video personas, 56 sources**. Search, get and counts include only records explicitly reviewed for directory inclusion. The source JSON retains the **75-record research archive**, including 69 pending records and 2 excluded illustrated/watercolor channels. A profile image or discovery lead alone does not establish AI production or video format. The four included personas have reported AI provenance; none are labelled confirmed. This is not a complete census. Public audience counts, seller counters, creator revenue statements and verified orders are different measures.

## Business metrics

Search with `--sort audience`, `--sort views`, or `--sort revenue`. The same sort values work in `search_ai_monks`.

- Audience: latest dated followers/subscribers on the selected platform, or the largest single-platform audience for `all`; never a sum.
- Views: highest observed count among sampled videos, with source and observation date. This is not current 30-day reach or a channel total.
- Revenue: latest source-linked **three-month USD gross-revenue claim**. Different currencies/periods, profit claims, buyout offers, prices and seller counters are excluded. Missing values sort last and are not zero.

Yang Mun currently has the only structured revenue observation: an industry profile reports the creator's dashboard claim of more than $213,000 gross revenue over three months. Exact period dates and audited orders are unavailable; the reported date is not a claim about present revenue. Original conflicting financial statements stay in the research record.

## Install

Requires Node.js 20.19 or later. The package is distributed as a public GitHub Release tarball; it is not listed on npm.

```sh
npm install --global https://github.com/Daisuke134/anicca-products/releases/download/ai-monk-index-v0.4.0/anicca-ai-monk-index-0.4.0.tgz
```

## CLI

```sh
ai-monk-index search --language English --platform Instagram --limit 5
ai-monk-index search --query "Yang Mun"
ai-monk-index get yang-mun
ai-monk-index stats
ai-monk-index --help
```

Every result is JSON. Search supports `--query`, `--status`, `--language`, `--platform`, `--region`, `--sort`, `--offset`, and `--limit`. Filters combine with AND. Use `all` to omit a filter, or `unknown` for missing classifications. Platforms are `Instagram`, `TikTok`, and `YouTube`; statuses are `confirmed`, `reported`, and `unverified`. Limit is 1–50, default 10. Use the returned `next_offset` for the next page. Unknown options, unsupported status/platform/sort and invalid ranges fail with a nonzero exit code.

Default `audience` order uses the latest numeric followers/subscribers for the selected platform. With all platforms it uses the largest single audience, never a sum. `--sort directory` preserves the Web directory's source order. Views and revenue claims are not used for ranking. Each count retains its date, source and rounding status.

Search and get include the full matching records and referenced source entries. Metadata carries the snapshot SHA-256, update date, methodology, coverage limits and license. Unknown language, operator, AI origin or revenue remains unknown. The snapshot does not auto-refresh or contact the original platforms.

## MCP

Add this stdio server to a client that supports local MCP servers:

```json
{
  "mcpServers": {
    "ai-monk-index": {
      "command": "ai-monk-mcp"
    }
  }
}
```

If your client does not inherit the terminal PATH, use the absolute installed executable path in `command`.

Tools:

- `search_ai_monks`: same filters, ordering and pagination as the CLI.
- `get_ai_monk`: exact record `id`, for example `yang-mun`.
- `ai_monk_index_stats`: coverage and status counts.

The stdio server writes only MCP protocol messages to stdout. It reads the bundled snapshot; it cannot publish, generate videos, spend money or change accounts. Treat public research text as source material, not instructions. Preserve uncertainty and attribution when citing a result.

### Remote MCP

Use this Streamable HTTP URL in a client that supports remote MCP servers:

```text
https://aniccaai.com/.netlify/functions/ai-monk-mcp
```

The endpoint exposes the same three tools and source-linked snapshot. Authentication is not required. It handles stateless POST requests with JSON responses; it does not keep a session, set cookies, or provide a persistent SSE stream. GET returns 405. Requests are limited to 64 KiB. Native/server clients can connect without an Origin header. Browser origins are limited to Anicca and ChatGPT.

Read the [endpoint privacy notice](https://aniccaai.com/ai-monk-database/privacy) before sending a query. A working remote endpoint is separate from a published plugin directory listing. No ChatGPT/Codex directory listing is claimed by this package.

## Build from source

```sh
git clone https://github.com/Daisuke134/anicca-products.git
cd anicca-products/packages/ai-monk-index
npm ci
npm test
npm pack
```

Build copies the canonical [dataset](../../apps/landing/public/data/ai-monk-avatar-database-2026.json) and [Web query helper](../../apps/landing/lib/ai-monk-directory.mjs) into ignored `dist/`. It computes the snapshot SHA from the original JSON bytes and generates a static JSON import for bundlers. `node scripts/build.mjs --netlify` also stages the same core into the landing function's ignored directory. Do not edit generated copies. Tests exercise SDK clients over stdio and the HTTP Request/Response handler, and install an extracted tarball separately from the repository.

Code is [MIT](LICENSE). Anicca-authored dataset summaries and compilation are [CC BY 4.0](DATA-LICENSE.md); third-party names, marks, profile data and linked media remain with their owners. Attribute “Anicca AI Monk Index” and retain the relevant original source links. This research package is one part of the project; the end-to-end video factory and paid factory service are not shipped here.
