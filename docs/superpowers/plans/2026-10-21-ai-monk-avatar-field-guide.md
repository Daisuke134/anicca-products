# AI Monk Avatar Directory and Articles Implementation Plan

> **For agentic workers:** Execute inline in this session. Steps use checkbox syntax for tracking.

**Goal:** Ship a searchable public AI monk avatar directory and four engaging English/Japanese articles that send readers to the directory with source-backed profiles.

**Architecture:** Keep the current static JSON as the public data source. Add one pure filtering helper and one Next.js route with a client search/filter view; retain existing article URLs and update their content in place. Use the existing Postiz route only after the new pages are live.

**Tech Stack:** Next.js 14.2.5 App Router, React 18, TypeScript, Tailwind, JSON, Node `node:test`, existing natural-japanese linter, existing Postiz route.

**Spec:** `docs/superpowers/specs/2026-10-21-ai-monk-avatar-field-guide.md`

## Global Constraints

- Preserve the four existing article slugs and keep all Anicca articles free.
- Use the existing five source-backed profiles; unknown handles, languages, and locations stay unknown.
- Do not claim a world-first or world-largest census without exhaustive, repeatable evidence.
- Analyze creative structure; do not reproduce full scripts, video files, voices, images, faces, or designs.
- Add no paid service, subscription, npm dependency, account, or actor run.
- Do not resend the four existing X promotions; publish new posts only for the updated work, each with a direct URL.
- Update the existing spec and plan before implementation; keep this work in the dedicated `feat/ai-monk-avatar-directory-20261021` worktree.

## Review Focus

- Empty `languages`, `region_evidence`, or platform handles remain valid input and never render as false facts.
- Multiple active filters intersect; a profile matching one filter but not another is excluded.
- User text is treated as text, not HTML; source links use the original URLs from the dataset.
- The existing `/monk` checkout page and four old article slugs remain unchanged.
- The page remains usable on a narrow screen and with keyboard focus; no real creator portrait is copied into the directory.

---

### Task AM-7: Add sourced language and region fields plus a tested search contract

**Files:**
- Modify: `apps/landing/public/data/ai-monk-avatar-database-2026.json`
- Create: `apps/landing/lib/ai-monk-directory.mjs`
- Create: `apps/landing/lib/ai-monk-directory.test.mjs`

**Interface:**

`filterAiMonkAccounts(accounts, filters)` receives the existing `accounts` array and `{ query, status, language, platform, region }`; each filter may be `"all"`. It returns the original account objects in input order. Text search is case-insensitive and checks display name, creator name, language labels, region labels, platform names, and handles. Non-`all` filters combine with AND. Null or absent fields do not throw and do not match a concrete value.

Each account gains `languages: [{ label, source_ids }]` and `region_evidence: { label, basis, source_id } | null`. Record English/Spanish only where the source supports the language. Label a profile flag as a profile signal, not an operator location; keep unknown country `null`.

- [ ] **RED:** Add tests for case-insensitive name/handle/creator search, AND-combined status/language/platform/region, empty language/region, and no-match results.
- [ ] Run `cd apps/landing && node --test lib/ai-monk-directory.test.mjs`; confirm it fails because the helper is not implemented.
- [ ] Add only source-supported `languages` and `region_evidence` to the five account records.
- [ ] Implement `filterAiMonkAccounts(accounts, filters)` in `lib/ai-monk-directory.mjs`.
- [ ] Run the focused test again; confirm all cases pass.
- [ ] Parse the JSON with `python3 -m json.tool public/data/ai-monk-avatar-database-2026.json`.

### Task AM-8: Build the searchable directory at `/ai-monk-database`

**Files:**
- Create: `apps/landing/app/ai-monk-database/page.tsx`
- Create: `apps/landing/components/AiMonkDatabase.tsx`
- Create: `apps/landing/components/ai-monk-database.css` only if Tailwind cannot express a needed layout rule.

**Interface:**

The server page imports the public JSON and passes its `accounts` to `<AiMonkDatabase accounts={accounts} />`. The client component renders a prominent search field, status/language/platform/region controls, a live result count, and a responsive scrollable card grid. Cards expose display name, evidence status, known languages, sourced region signal, creator and creator-account links, avatar social links, visible offer summary, dated audience/video snapshots, source links, and unknowns. The page includes links to the four articles, the public JSON, and a GitHub contribution route. It uses CSS/Tailwind already installed; no component or database package is added.

- [ ] Build the page and client component with visible `aria-label`s for search and each filter, an accessible no-results state, and a clear-filters control.
- [ ] Show “Unknown” when a value is absent; never label the creator's location as the avatar's country.
- [ ] Show the five profile cards without copying portraits or downloading creators' videos.
- [ ] Add `metadata` with canonical `https://aniccaai.com/ai-monk-database` and a concise directory description.
- [ ] Add a visible link from the existing AI monk category/articles to `/ai-monk-database`.
- [ ] Run `cd apps/landing && npx tsc --noEmit`; confirm the route and prop contract compile.

### Task AM-9: Rewrite the four article bodies as readable features

**Files:**
- Modify: `apps/landing/data/research/ebook-publishing-yang-mun-video-to-product.json`
- Modify: `apps/landing/data/research/ebook-publishing-yang-mun-case-study-ja.json`
- Modify: `apps/landing/data/research/ebook-publishing-ai-monk-economy-2026.json`
- Modify: `apps/landing/data/research/ai-monk-avatar-field-guide-ja-2026.json`

**Editorial contract:**

- H1 titles: `The Yang Mun Shock: The Monk in Your Feed Has a Checkout Page`; `Yang Munの衝撃`; `The Art of AI Monks`; `AI僧侶列伝`.
- Preserve each `slug`, `lang`, existing source URLs, inline YouTube shortcode IDs, and the existing open dataset URL. Add `https://aniccaai.com/ai-monk-database` prominently.
- The Yang Mun feature opens with a concrete 65-second video scene and reveals the synthetic persona early; then follows its format, Shalev Hani, public offer, conflicting revenue claims, and spiritual-trust question.
- The field guide opens with a surprising feed-level contrast, distinguishes synthetic personas from a real Thai monk's 2D avatar, gives a sourced five-profile walk-through, explains language/platform/monetization patterns, and closes with what readers can verify in the directory.
- Keep metrics dated and attributed. The Thai PBS Phra Maha AI example is an earlier real monk with a 2D animated character, not a synthetic monk account and not part of the five-profile count.
- Write fresh English and Japanese prose; copy only article mechanics such as scene-led openings, concrete details, specific subheads, and a useful close.

- [ ] Rewrite each title, description, `markdown`, `word_count`, and Japanese `character_count` while preserving its slug and language.
- [ ] Run JSON parse checks on all four files and assert the old slugs plus matching database/article links remain.
- [ ] Run `python3 /Users/anicca/.codex-acct2/skills/natural-japanese/scripts/lint.py --json --genre essay` for both Japanese article files; resolve substantive findings and read each article aloud once.
- [ ] Read each English article from H1 to final paragraph; confirm no report-only labels, unsupported “first/largest” claim, full transcript, or unlinked factual claim remains.

### Task AM-10: Verify, merge, and read back production

**Files:**
- Update: `docs/superpowers/specs/2026-10-21-ai-monk-avatar-field-guide.md`
- Update: this plan with checked steps and actual evidence.

- [ ] Run `cd apps/landing && node --test lib/ai-monk-directory.test.mjs`.
- [ ] Run the existing focused article/YouTube/category tests named in the current plan/spec.
- [ ] Run `cd apps/landing && npm run build` and inspect static output for `/ai-monk-database` and the four existing article routes.
- [ ] Run `git diff --check`, inspect only the dedicated branch diff, and verify no media download, secret, or unrelated file entered it.
- [ ] Commit and push the dedicated branch; open a PR; wait for exact-head CI; merge through the repo's normal `--admin` path.
- [ ] Confirm the Netlify production deploy and read back `/ai-monk-database`, all four article URLs, and `/data/ai-monk-avatar-database-2026.json`.

### Task AM-11: Promote the live directory and revised features on X

**Files:**
- Create: `docs/evidence/ai-monk-avatar-directory-x-distribution-20261021.json`

- [ ] Use one English post for the directory and one Japanese post for `Yang Munの衝撃`; each post contains its own direct production URL and a unique UTM campaign.
- [ ] Publish through the existing `@selawmqt` Postiz identity only after live URL readback; do not edit or resend the previous four posts.
- [ ] Read back each Postiz `PUBLISHED` receipt and X permalink; store sanitized public receipt fields and distinguish views/pageviews from clicks, orders, and revenue.

## Plan self-review

- Every user request maps to AM-7–11. Searchable web UI precedes article distribution; no user re-approval or additional service setup is a task dependency.
- The only new runtime logic is one pure filtering function and one client view. Existing JSON, article routing, Postiz, and Netlify deployment patterns remain the source-of-truth integrations.
- The focused filter test covers null fields, AND composition, and no-match behavior; the build covers static route generation.

**Current cursor:** AM-7 — write the failing search/filter tests.
