# A2+A3 — per-platform verify-prompts + one-tap orchestrators (zenn/substack/x) — 2026-06-25

VSDD. Builder = me; gate = fresh vcsdd:vcsdd-adversary. Mirrors the proven note F1/F2 (publish-to-note.sh +
note-agent-prompt.md + run-note-agent.sh). Goal: each platform = deterministic SCRIPT (hands) + a verify-PROMPT
(the claude -p agent's eyes) that LOOKS at the rendered draft and refuses to publish slop.

## CONTRACT
For platform PF ∈ {zenn, substack, x}:
- **run-<pf>-agent.sh** — args → INPUTS line → `claude -p "<prompt> + INPUTS" --allowedTools Read,Bash,Write,Edit
  --dangerously-skip-permissions`. AUTONOMY defaults off (stop at draft).
- **<pf>-agent-prompt.md** — LOOP: (1) take MD (or write from TOPIC) (2) draft via the orchestrator (3) run the
  deterministic verify → screenshot (4) ★LOOK★: Read the screenshot, judge the platform CHECKLIST citing what is
  seen (5) DECIDE: fix→re-verify (max 3) OR publish only if checklist PASSES and AUTONOMY=on, else stop at draft
  (6) REPORT JSON {"verdict","published","url","screenshot","reasons"}.
- Orchestrator gives a uniform interface: `<pf> publish <md> --mode draft|go` (+ `verify <id>` where applicable).

## PER-PLATFORM CHECKLIST (the eyes — what each prompt must judge)
- **zenn** (free honest explainer, git): mermaid renders (SVG), tables not broken, blank line around tables, NO
  AI-slop, ★NO run/result claims (no-lie gate must PASS — zenn is the free explainer; the run lives only in paid
  note)★, honest closing with NO upsell/note link, headings clean. Deterministic: no-lie gate PASS. Rate-limit: 1
  new article / 24h.
- **substack** (paid sub): every body image ≤950px on-screen (no full-page; verify-preview.py measures the REAL
  preview), paywall node sits AFTER the free explainer / BEFORE the paid setup+results, free preview clean, tables
  + mermaid render as PNG fine, honest. Deterministic: verify-preview FAIL if any img >950; paywall node present.
  Stripe must be connected for only_paid gating.
- **x** (free STANDALONE Article): every TABLE is clean (our HTML renderer — blue header, **bold** parsed — NOT the
  ugly table_to_image), every image ≤950px (no full-page), mermaid clean, ★NO funnel/upsell link (ethics:
  standalone free, never bait to paid note/substack)★, honest title (no 検証してみた if the run isn't shown).
  Deterministic: x_fullverify TALL>900 must be empty.

## A3 — orchestrators + de-Automaton
- zenn: publish-to-zenn.sh exists (adapt/gate/render/draft/publish, --paid-from/slug params). OK.
- substack: substack-publish.py is env-driven (SUBSTACK_SRC/TITLE/PAID_FROM/AUDIENCE/GO). Add publish-to-substack.sh
  wrapper (uniform `publish <md> --mode draft|go`).
- x: publish-to-x.py (X_PARSED) + prep-x-md.py (X_SRC/X_DST/X_ASSETS) + x_fullverify.py. Add publish-to-x.sh wrapper
  (`publish <md> --mode draft|go` chains prep→parse→publish-to-x; `verify <draftUrl>`), and parameterize
  x_fullverify.py to take the draft URL as argv (was hardcoded).
- note: publish-to-note.sh is CLI-parameterized; DEFAULT_KEY is just a default (override via --key). Inner-script
  full de-Automaton (asset dir/slug from the md) = follow-up; the agent path already takes --md/--key/--paywall.

## DONE = 4-D convergence
spec ✓ + the prompts+wrappers exist & are self-consistent ✓ + a REAL run of one run-<pf>-agent.sh (claude -p,
draft mode) produces a correct PASS/FAIL verdict by actually looking ✓ + fresh-context adversary PASS ✓.
