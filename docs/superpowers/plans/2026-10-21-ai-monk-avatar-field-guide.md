# AI Monk Avatar Articles and Open Dataset Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use `superpowers:executing-plans` to implement this plan task by task. Steps use checkbox syntax for tracking.

**Goal:** Publish free English/Japanese Yang Mun and AI monk avatar articles, a cited public starter dataset, a bilingual book proposal, and natural vertical YouTube Shorts embeds, then link the articles from X.

**Architecture:** Keep article content in the existing `apps/landing/data/research/*.json` format. Publish one schema-versioned JSON dataset from `apps/landing/public/data/`. Extend the existing Markdown shortcode renderer with `lite-youtube-embed`, preserving the legacy 16:9 marker and adding an accessible 9:16 Shorts marker. Publish through the existing PR → Netlify path; post to X only after production URLs are readable.

**Tech Stack:** Next.js 14.2.5, React 18, Node `node:test`, Markdown-in-JSON articles, `lite-youtube-embed@0.3.4` (Apache-2.0), YT-DLP/ffmpeg for temporary public-video analysis, Postiz existing X transport.

**Spec:** `docs/superpowers/specs/2026-10-21-ai-monk-avatar-field-guide.md`

## Global Constraints

- Preserve existing article slugs and keep all Anicca articles free.
- Store source URLs, collection date, metric, and confidence beside every numeric or AI-provenance claim.
- Do not present followers, views, seller counters, creator claims, gross revenue, and net profit as interchangeable.
- Use only real AI monk-avatar videos as core video examples; exclude real monks and animation with unknown AI provenance from the sample.
- Publish high-level script/visual mechanics and short summaries only; do not reproduce full scripts, clone personas, or host downloaded video files.
- Keep the dataset a documented starter set, not a claimed complete census; unknown handles remain unknown.
- Use fixed YouTube video IDs and the `youtube-nocookie.com` host; the portrait embed loads its iframe only after click.
- Add no paid account, scraping service, or subscription; incremental spend target is `$0`.

## Review Focus

- A malformed video ID or title must not become an arbitrary iframe URL or unsafe HTML; renderer tests assert the 11-character ID allowlist, escaped title, and fixed player host.
- A vertical Shorts marker must stay 9:16 while the legacy marker stays 16:9; renderer tests assert both class names and absence of eager `<iframe>` output.
- A profile with mixed or screenshot-only AI evidence must retain that status in the database and article; JSON content and article copy label the provenance source.
- A metric without a platform and capture date must not be presented as current; database records require source and snapshot fields or an explicit `null` reason.
- An English/Japanese page must never receive a mismatched language slug or cross-link; verify each JSON `slug`, title, language, and related-page link.

---

### Task 1: Publish the starter account and video dataset

**Files:**
- Create: `apps/landing/public/data/ai-monk-avatar-database-2026.json`

**Interfaces:**
- Produces: JSON `schema_version`, `updated_at`, `scope`, `sources[]`, and `accounts[]`.
- Each account record includes `id`, `display_name`, `ai_status`, `ai_evidence[]`, `platforms[]`, `offers[]`, `creative_samples[]`, `source_urls[]`, and `unknowns[]`.
- `ai_status` values: `confirmed`, `reported`, `unverified`.
- `platforms[]` records `platform`, `handle`, `profile_url`, and `snapshot` (`value`, `metric`, `as_of`, `source_url`) or a reasoned `null`.
- `creative_samples[]` stores public URL, title, capture date, view snapshot, and an original structural summary; it never stores a transcript or downloaded media.

- [x] **Step 1: Add source-backed records** for Yang Mun, Ming San, SifuChen California, Leo Chen with unresolved handle, and the user-supplied `monjechen` profile with `evidence_origin: user_screenshot`.
- [x] **Step 2: Check the JSON syntax**.

Run: `python3 -m json.tool apps/landing/public/data/ai-monk-avatar-database-2026.json`

Expected: exit 0; every value is valid JSON.

- [x] **Step 3: Inspect every record** for a source URL, a dated metric or explicit unknown, and a non-overstated AI status.
- [x] **Step 4: Commit and push the dataset** with the spec and plan.

### Task 2: Add portrait, lazy YouTube Shorts embeds

**Files:**
- Modify: `apps/landing/lib/render-article-markdown.js`
- Modify: `apps/landing/app/layout.tsx`
- Modify: `apps/landing/app/globals.css`
- Modify: `apps/landing/app/blog/[slug]/page.tsx`
- Modify: `apps/landing/package.json`
- Modify: `apps/landing/package-lock.json`
- Create: `apps/landing/components/blog/LiteYouTubeEmbedLoader.tsx`
- Create: `apps/landing/types/lite-youtube-embed.d.ts`
- Create: `apps/landing/test/render-article-markdown-youtube.test.mjs`

**Interfaces:**
- Legacy marker: `[youtube-embed:VIDEO_ID]` → `lite-youtube` element at 16:9.
- Shorts marker: `[youtube-short:VIDEO_ID|TITLE]` → `lite-youtube.youtube-short` element at 9:16, centered and max-width 360px.
- `VIDEO_ID` matches exactly `[A-Za-z0-9_-]{11}`; `TITLE` is HTML-escaped before attribute/text insertion.
- The generated element has a YouTube thumbnail, an accessible play label, and an official fallback link; it contains no iframe before a user activates it.
- A client-only loader imports `lite-youtube-embed` only on blog pages whose Markdown contains either embed marker.

- [x] **Step 1: Write the failing renderer tests** for legacy 16:9, Shorts 9:16, title escaping, invalid IDs, and no initial iframe.
- [x] **Step 2: Run the renderer test**.

Run: `node --test test/render-article-markdown-youtube.test.mjs`

Expected: FAIL because the Shorts marker and lazy custom element do not exist.

- [x] **Step 3: Add the pinned dependency** `lite-youtube-embed@0.3.4` in `apps/landing` and update its lockfile.
- [x] **Step 4: Render fixed-host `lite-youtube` elements** from the two markers; preserve the old marker’s 16:9 layout.
- [x] **Step 5: Import the library CSS and client loader**; add the local declaration for the package's untyped side-effect import; gate the loader on article Markdown containing a YouTube marker.
- [x] **Step 6: Add portrait CSS** with `padding-bottom: 177.7778%` (9:16), `max-width: 360px`, and centered margins.
- [x] **Step 7: Run the focused renderer test**.

Run: `node --test test/render-article-markdown-youtube.test.mjs`

Expected: PASS; no eager iframe or arbitrary host is present.

### Task 3: Add the AI monk category and write both article families

**Files:**
- Modify: `apps/landing/lib/blog-business.mjs`
- Modify: `apps/landing/lib/blog-business.test.mjs`
- Modify: `apps/landing/app/blog/[slug]/page.tsx`
- Modify: `apps/landing/data/research/ebook-publishing-yang-mun-video-to-product.json`
- Modify: `apps/landing/data/research/ebook-publishing-ai-monk-economy-2026.json`
- Create: `apps/landing/data/research/ebook-publishing-yang-mun-case-study-ja.json`
- Create: `apps/landing/data/research/ai-monk-avatar-field-guide-ja-2026.json`

**Interfaces:**
- `BUSINESSES.ai-monk-avatars` provides the label `AI Monk Avatars` and a sourced-research introduction.
- `businessOf(slug, project)` returns `ai-monk-avatars` for `ebook-publishing-ai-monk-economy-2026` and the `ai-monk-avatar-` slug family.
- Yang Mun EN keeps its current slug; its JA counterpart gets its own stable `ebook-publishing-yang-mun-case-study-ja` slug.
- The English field guide keeps the `ebook-publishing-ai-monk-economy-2026` slug; the JA counterpart uses `ai-monk-avatar-field-guide-ja-2026`.
- Japanese article JSON sets `lang: "ja"` and `character_count`; the page renders `lang="ja"` and labels the count in Japanese characters.
- Every article links to the machine-readable JSON and to its same-topic counterpart.

- [x] **Step 1: Add the failing category assertion** to `lib/blog-business.test.mjs`.
- [x] **Step 2: Run the category test**.

Run: `node --test lib/blog-business.test.mjs`

Expected: FAIL because `ai-monk-avatars` is not a recognized business.

- [x] **Step 3: Add the category mapping** and rerun the focused category test.
- [ ] **Step 4: Expand the English Yang Mun case** with creator attribution, the two observed Shorts, dated platform snapshots, offer mechanics, conflicting self-reported earnings, and a clear unknowns section.
- [ ] **Step 5: Add the Japanese Yang Mun edition** with Japanese-first hook, headings, examples, `lang: "ja"`, and a Japanese character count; preserve all source links and caveats.
- [ ] **Step 6: Rewrite the existing eBook economy article in place** as the English field guide; preserve its slug and eBook-economics section, remove non-avatar animation and living-monk examples, and link to the database.
- [ ] **Step 7: Write the Japanese field guide** with a concise taxonomy, cautious timeline, curated profile notes, shared creative patterns, visible offer routes, health-claim caveats, database links, `lang: "ja"`, and a Japanese character count.
- [ ] **Step 8: Render article language and length labels** in `app/blog/[slug]/page.tsx`: `lang` on the article element, `文字` for Japanese `character_count`, and `words` for English `word_count`.
- [ ] **Step 9: Confirm the category hub** resolves the legacy English field-guide slug and the new Japanese field-guide slug.
- [ ] **Step 10: Parse all changed article JSON** and confirm each embedded marker refers to a source-backed YouTube video ID.

Run: `python3 -m json.tool <each changed article JSON>`

Expected: all article files parse successfully.

### Task 4: Add the bilingual book proposal

**Files:**
- Create: `docs/books/the-monk-in-your-feed-outline-en.md`
- Create: `docs/books/the-monk-in-your-feed-outline-ja.md`

**Interfaces:**
- Both files share the thesis, title concept, target reader, hook, evidence rules, and 10 chapter topics.
- The Japanese proposal is localized, not a line-for-line translation.

- [ ] **Step 1: Write the English proposal** with a provocative but accurate hook and ten source-backed chapter briefs.
- [ ] **Step 2: Write the Japanese proposal** with the same argument and a natural Japanese hook.
- [ ] **Step 3: Confirm each chapter connects to an evidence source or a stated research gap.**

### Task 5: Build, merge, and verify production pages

**Files:**
- Review the complete branch diff; no additional files are expected.

- [ ] **Step 1: Run the focused tests**.

Run: `cd apps/landing && node --test test/render-article-markdown-youtube.test.mjs lib/blog-business.test.mjs`

Expected: all focused tests PASS.

- [ ] **Step 2: Build the landing app**.

Run: `cd apps/landing && npm run build`

Expected: successful Next.js build with the new article slugs and custom element.

- [ ] **Step 3: Run `git diff --check`, commit, and push** the dedicated branch.
- [ ] **Step 4: Open the PR, wait for exact-head checks, merge with the repo’s normal admin merge path, and verify Netlify production deployment.**
- [ ] **Step 5: Read back all four article URLs, the category hub, the public JSON, and rendered HTML confirming `lite-youtube` plus 9:16 styling and no pre-click iframe.**

### Task 6: Promote each published article on X in its native language

**Files:**
- Create: `docs/evidence/ai-monk-avatar-x-distribution-20261021.json` (public post receipts only; no credentials).

- [ ] **Step 1: Compose four concise posts**, one for each EN/JA article URL, with language-matched copy, a source-based hook, and the counterpart link where the character budget permits.
- [ ] **Step 2: Publish each post exactly once through the existing Postiz `x_post.py` path** after confirming the exact production URLs.
- [ ] **Step 3: Read back all four provider receipts and exact X permalinks; save only sanitized public receipt fields.**

## Self-review checklist

- [ ] Every spec requirement maps to Tasks 1–6.
- [ ] No task asks an implementer to invent a filename, function signature, metric definition, or account handle.
- [ ] English/Japanese slugs, article filenames, and category mapping agree.
- [ ] The source-level review-focus cases appear in the renderer tests and dataset acceptance.
- [ ] No full third-party script, video, voice, image, or private account information is committed.
