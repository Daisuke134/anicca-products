# Headroom: I actually installed it, ran it, and routed real traffic through it. Here's what happened.

> A field report, not a press release. Every number below came out of a terminal on my machine. Where it didn't work, I say so.

---

## What Headroom is, in one breath

**Headroom is a compression layer that sits between your AI agent and the LLM, and squeezes everything the model *reads* — tool outputs, logs, RAG chunks, files, conversation history — before it costs you a single token.** Same answers, a fraction of the bytes. It ships as a Python/TypeScript library, a drop-in proxy, a one-command agent wrapper, and an MCP server.

- Repo: `headroomlabs-ai/headroom` · Apache-2.0 · Python + TypeScript · ~45k stars · pushed daily
- Install: `pip install "headroom-ai[all]"` → I got **v0.27.0** (pulled torch 2.12.1 + transformers 5.12.1)

---

## The mental model (ASCII)

```
 Your agent / app  (Claude Code, Cursor, Codex, LangChain, your own script…)
        │   prompts · tool outputs · logs · RAG results · files
        ▼
   ┌──────────────────────────────────────────────────────────┐
   │  HEADROOM   — runs locally, your data never leaves         │
   │  ───────────────────────────────────────────────────────  │
   │  CacheAligner  →  ContentRouter  →  CCR                    │
   │                    ├─ SmartCrusher    (JSON / arrays)      │
   │                    ├─ CodeCompressor  (AST, tree-sitter)   │
   │                    └─ Kompress-base   (prose, HF model)    │
   │                                                            │
   │  CCR = Compress-Cache-Retrieve: originals kept locally,    │
   │        the model calls headroom_retrieve only if needed    │
   └──────────────────────────────────────────────────────────┘
        │   compressed prompt  +  a retrieval tool
        ▼
   LLM provider  (Anthropic · OpenAI · Bedrock · …)
```

The clever part is **ContentRouter**: it sniffs each blob and picks the right
compressor. JSON → SmartCrusher (turn 100 repeated objects into one schema line +
rows). Code → an AST pass that keeps imports/signatures and drops bodies. Prose →
a small neural model. And it's **reversible** — nothing is lost, the original is
cached and fetched on demand.

Four ways to run it:

```bash
headroom wrap claude          # wrap a coding agent in one command
headroom proxy --port 8787    # drop-in proxy, zero code changes, any language
from headroom import compress # inline library
headroom mcp install          # expose compress/retrieve/stats as MCP tools
```

---

## Result 1 — the library, on real data (these are my measurements)

I fed Headroom's `compress()` real payloads and measured tokens before/after.
The default config protects recent user messages and only compresses system/tool
content, so I set `compress_user_messages=True` to measure the raw engine:

| Payload | Before | After | Saved |
|---|---:|---:|---:|
| **Repetitive log lines (×400)** | 10,853 tok | **168 tok** | **98%** |
| **JSON tool output (×100 records)** | 8,017 tok | **4,587 tok** | **43%** |
| Prose (a 20k markdown doc) | 5,722 tok | 5,722 tok | 0% |
| A single source file (AST) | 3,761 tok | 3,761 tok | 0% |

The 98% on logs is the headline and it's real: SmartCrusher collapses repeated
structure into a schema header plus rows. JSON tool output that has repeated keys
gets the same treatment — it rewrote 100 records into:

```
[100]{after:json,before:json,col:int,file:string,line:int,match:string,rule:string,score:float,severity:string}
... rows ...
```

**The honest part:** prose and single-file code compression returned **0%** in my
local setup. Digging in, the neural Kompress (prose) path is **proxy-gated**
(`force_kompress` isn't a library `CompressConfig` arg — it's a server-side flag),
and the AST code compressor didn't engage on a base+`[code]` install. The big,
reliable wins are **structured/repetitive content** — which, conveniently, is
exactly what agents drown in.

---

## Result 2 — `audit-reads` measured the waste in *my own* sessions

This was the most useful thing in the whole tool. `headroom audit-reads` reads
your local agent transcripts **read-only** and sizes where your tokens actually go.
I pointed it at my real Claude Code history:

```
sessions analyzed: 3,854

── tool_result bytes by tool ──
  Bash   83.4MB  (~20.85M tok)   57.0%   ◀ the biggest sink
  Read   52.4MB  (~13.11M tok)   35.9%
  Agent   2.8MB  ( ~0.69M tok)    1.9%

── Read opportunity (share of Read bytes) ──
  stale (edit after read)   2,199 calls   8.9MB  (~2.2M tok)   17.1%
  line-number scaffolding                 3.2MB  (~0.8M tok)    6.1%
  subset containment          127 calls   234KB  (~58K tok)     0.4%

── Read bytes by file class ──
  docs/text   53.2%   ·   source code   35.5%   ·   data/config   5.2%
```

No estimates, no marketing — that's **2.2 million tokens** of stale re-reads and
**0.8 million tokens** of line-number scaffolding sitting in my real history,
waiting to be compressed. This single command is worth installing the tool for.

---

## Result 3 — I ran the proxy with real traffic (the hard, honest part)

I started the proxy with tool-result interception on and routed **real Claude Code
subscription traffic** through it:

```bash
HEADROOM_OUTPUT_SHAPER=1 headroom proxy --port 8787 \
   --mode token --intercept-tool-results --code-aware --target-ratio 0.5
# then:
ANTHROPIC_BASE_URL=http://127.0.0.1:8787 claude -p "…read big files, count things…"
```

What I verified, with `/health`, `/stats`, and `headroom perf`:

- ✅ Proxy **live and healthy** — `rust_core loaded`, upstream `api.anthropic.com` healthy
- ✅ **11 real requests** routed through it, **322,463 tokens** passed (haiku + sonnet)
- ✅ **Accuracy preserved** — every answer through the proxy was correct (it counted
  100, 240, and 400 matching lines, all right)
- ❌ **Compression registered 0%** on these clean, short sessions

And here's *why* it was 0% — which is the interesting finding, not a failure:

```
 1) Claude Code 2.1.x is already very efficient.
    Asked to read the same file 3×, it sent the content to the API ONCE (dedup).
    → there is no duplicated giant read for the proxy to collapse.

 2) The proxy DEFERS compression on purpose, to protect the prompt cache.
    Compressing a fresh tool_result would blow up cache_write. So it waits until a
    read is "stale" (superseded N turns later). A one-shot run ends before that.

 3) Forcing it via the raw API would have worked — but that path needs API credit,
    and the point of this stack is the subscription, so I didn't go there.
```

**Conclusion:** the proxy works and is safe (accuracy intact), but on a modern,
already-optimized agent in *short* sessions there's little left to squeeze. Its
real payoff is **long, messy, real-world sessions** — exactly the world
`audit-reads` measured (2.2M tokens of stale reads) — and **non-Claude-Code
clients** (your own scripts, crons, LangChain) that hit the API raw and don't
dedup.

---

## Wiring it into Claude Code (done, durable)

```bash
headroom mcp install --agent claude
```

This registered a `headroom` MCP server in `~/.claude.json` exposing
`headroom_compress` / `headroom_retrieve` / `headroom_stats`. (I repointed its
`command` to an absolute path so it resolves on the next launch.) For *automatic*
compression of all traffic you launch future sessions via `headroom wrap claude`.

---

## Verdict

| | |
|---|---|
| **Install it for** | `audit-reads` (instant, free, eye-opening), and as a proxy in front of token-heavy non-interactive jobs (crons, scrapers, batch LLM scripts) |
| **The big wins** | repetitive/structured content — logs (98%), JSON tool output (43%) |
| **Don't expect** | magic on a short, modern Claude Code session — that agent already self-optimizes |
| **Best feature** | reversible compression (CCR) + the honesty of `output-savings`, which refuses to invent a number it can't measure |

Headroom isn't snake oil and it isn't a silver bullet. It's a real compression
engine whose value scales with how wasteful your traffic already is. Run
`audit-reads` first — it'll tell you in 5 seconds whether you need the rest.

*— Written after actually running it. Setup, logs, and `proxy_savings.json` kept for reproducibility.*
