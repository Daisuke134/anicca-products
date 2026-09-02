# CodeGraph: I installed it (twice — it was broken), indexed a real repo, and queried it. Here's what it actually does.

> A field report. Real commands, real output, including the part where the CLI
> shipped broken and I had to repair it by hand.

---

## What CodeGraph is, in one breath

**CodeGraph pre-indexes your entire codebase into a local SQLite knowledge graph —
every symbol, every call edge, every file — so an AI agent can ask "what calls
this / what breaks if I change it / how does X work" in one query instead of a
dozen grep-and-read round trips.** It auto-syncs on file changes and runs 100%
locally. It plugs into Claude Code, Codex, Gemini, Cursor, and others over MCP.

- Repo: `colbymchenry/codegraph` · MIT · TypeScript · ~52k stars
- Install: `curl -fsSL …/install.sh | sh` then `codegraph init`

---

## The mental model (ASCII)

```
   Without CodeGraph                       With CodeGraph
   ┌──────────────────────────┐           ┌──────────────────────────┐
   │ grep "classifyUser" → 30 │           │ codegraph explore        │
   │ Read fileA   (whole file)│           │  "how does user-type     │
   │ Read fileB   (whole file)│           │   classification work?"  │
   │ Read fileC … ×20         │   ──▶      │                          │
   │ grep callers             │           │  ONE call returns:       │
   │ Read more …              │           │   • entry points         │
   │ = 20+ tool calls         │           │   • blast radius         │
   │ = whole files in context │           │   • call graph           │
   └──────────────────────────┘           │   • verbatim source      │
        slow · costly · noisy             └──────────────────────────┘
                                              fast · cheap · scoped
```

The index is a SQLite DB (`node:sqlite`, WAL + FTS5) kept fresh by a background
daemon. Reads are sub-millisecond. Because it already knows the graph, the agent
stops paying to rediscover it on every question.

---

## What it looks like on a real repo (mine)

After `codegraph init`, `codegraph status` on my project:

```
  Files:   1,661        Nodes:   14,327        Edges:   25,430
  DB Size: 30.91 MB     Backend: node:sqlite (WAL)   Journal: wal

  Nodes by kind:  function 2,255 · method 2,170 · class 449 · route 170
                  struct 450 · import 3,859 · constant 1,239 · enum 99
  Languages:      swift 447 · js 474 · python 308 · tsx 162 · ts 42 · go 28 · lua 68
```

That's a polyglot mobile + API + web monorepo reduced to a **31 MB graph** the
agent can interrogate instantly.

---

## The result that sells it: `codegraph explore`

One command, one round trip:

```
$ codegraph explore "how does the api server handle user type classification"

## Exploration: how does the api server handle user type classification
Found 34 symbols across 21 files.

### Blast radius — what depends on these (verify before editing)
- handler (apps/api/src/api/billing/revenuecatSync.js:6) — 1 caller in
  routes/billing/revenuecat-sync.js;  ⚠️ no covering tests found

### Relationships
  calls:  handler → resolveProfileId
          handler → fetchCustomerEntitlements
          handler → applyRevenueCatEntitlement
          fetchCustomerEntitlements → parseActiveEntitlements …(+31 more)
  refs:   POST / → handler

### Source Code
> verbatim, current on-disk source of these files, line-numbered — treat each
> block as a Read you've already performed; do NOT re-Read these files.
```

That last line is the whole point: it hands the agent the **exact source it would
otherwise have spent ~20 Read calls fetching**, plus the call graph and the blast
radius, in a single response. Fewer tool calls, fewer tokens, and — crucially —
it tells you what your change will break (and that there are no tests covering it).

Other commands I ran that worked: `codegraph query "compress"` (ranked symbol
search), `codegraph status`, `codegraph files`. Over MCP the same engine exposes
`codegraph_context`, `codegraph_trace` (full call paths, including dynamic-dispatch
hops grep can't follow), `codegraph_callers/callees`, and `codegraph_impact`.

---

## The honest part: the CLI shipped broken — twice

I'm including this because a field report that hides the rough edges is useless.

```
 Attempt 1:  codegraph --help
   → Error: Cannot find module '.../versions/v0.9.8/lib/dist/bin/codegraph.js'
   The installed version directory was missing its build output.

 Fix 1:  re-ran the official installer  →  upgraded to v1.0.1, linked the binary.

 Attempt 2:  codegraph --version
   → Error: Cannot find module 'commander'
   The installer downloaded the package but never ran `npm install` for its deps,
   AND my Node is v25 while the package requires `node >=20 <25` (engine mismatch).

 Fix 2:  cd ~/.codegraph/versions/v1.0.1/lib && npm install --omit=dev
   → "added 12 packages"  →  codegraph --version → 1.0.1  →  everything works.
```

Worth knowing: the **MCP daemon was alive and serving the whole time** (the graph
DB, socket, and pid were all healthy) — only the *CLI launcher* was broken. So if
you reach CodeGraph through an MCP-native agent, you might never hit this. If you
use the CLI directly, mind the **Node `<25` requirement** and check that
`node_modules` actually got installed.

---

## Verdict

| | |
|---|---|
| **Install it for** | killing grep→read→grep loops on medium-to-large codebases; instant "what calls this / what breaks if I touch it" |
| **Best feature** | `explore` / `context` returning blast radius + call graph + verbatim source in one shot — and flagging untested code |
| **Watch out for** | a flaky CLI install (Node `<25`, run `npm install` in the version dir if `commander` is missing); the MCP path is more robust |
| **Cost** | a ~31 MB local SQLite DB and a lightweight auto-sync daemon. 100% local, no cloud, no keys |

CodeGraph attacks the *other half* of the token problem from a compressor like
Headroom: instead of shrinking what you read, it stops you from reading the wrong
things in the first place. On a 1,661-file polyglot repo it turned exploratory
spelunking into single, scoped, source-backed answers. The install needed a
mechanic — but once running, it's the kind of tool you stop noticing because the
agent just… knows the codebase.

*— Written after actually running it. Index, daemon logs, and command output kept for reproducibility.*
