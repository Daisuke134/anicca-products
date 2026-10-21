# AI Monk Avatar Articles and Open Dataset

## Purpose

Make Anicca a source-backed English/Japanese reference on AI monk avatars: one Yang Mun case study, one field guide, an open starter dataset, and a bilingual book proposal. Improve the site’s YouTube Shorts embeds and route X readers to the matching Anicca pages.

## As-Is

- The live Yang Mun article is English-only and focuses mainly on the visible eBook offer and evidence gaps.
- The live AI monk economy article mixes Yang Mun with animated stories whose AI status is unknown and an interview with a living monk. Those examples do not meet the requested definition of an AI monk avatar.
- Its video marker renders a normal 16:9 iframe even for a 9:16 Short.
- The current English X post already links to the earlier Anicca article. New article families need their own tracked links.
- Anicca has no public, machine-readable index limited to AI monk avatar accounts.

## To-Be

1. **Yang Mun case study:** expand the existing English page and add a naturally written Japanese counterpart. Cover creator Shalev Hani, dated social/account evidence, video format, production claims, the public offer ladder, competing revenue claims, and open questions.
2. **AI monk avatar field guide:** reuse the existing English `ebook-publishing-ai-monk-economy-2026` URL as the English field guide and add a Japanese counterpart. Preserve the old URL because the existing X post points to it; retain the eBook-economics section inside the broader field guide. Add an `AI Monk Avatars` category hub at `/blog/c/ai-monk-avatars`.
3. **Correct the field-guide evidence:** replace the old mixed six-video sample with AI monk avatar video examples only. The English legacy slug and the new Japanese slug link to the same open directory and each other.
4. **Open starter dataset:** add `apps/landing/public/data/ai-monk-avatar-database-2026.json`. Each record includes profile URLs, platform, provenance status and evidence, visible offer type, dated audience/video snapshots, and unresolved fields. This is a curated starter set, not a claim to cover every account.
5. **Book proposal:** add a shared English/Japanese title, hook, reader promise, and 10-chapter outline under `docs/books/`. This deliverable is an outline, not a completed book.
6. **Natural Shorts embed:** add the open-source Apache-2.0 `lite-youtube-embed` component. Keep `[youtube-embed:VIDEO_ID]` as 16:9; add `[youtube-short:VIDEO_ID|TITLE]` as a centered 9:16 player card capped at 360px. Load the full `youtube-nocookie.com` iframe only after the reader presses play.
7. **Own-channel distribution:** publish four native-language X posts through the existing Postiz path, one per published article URL; each links directly to its language-matched Anicca article with source attribution and campaign parameters.

## Evidence contract

- Use `confirmed` only for creator/platform disclosures or credible reporting that identifies a synthetic monk persona. Use `reported` when an investigative source makes the classification but another source leaves it unresolved. Use `unverified` for appearance-only or screenshot-only claims.
- The starter dataset includes Yang Mun, Ming San, SifuChen California, Leo Chen (handle unresolved), and the user-supplied `monjechen` profile with the screenshot provenance stated. Keep real clergy using virtual characters outside the synthetic-persona count.
- Do not guess Yang Mun’s TikTok handle. Public reporting mentions multiple accounts but does not establish their exact handles.
- Store platform, source URL, collection date, metric and claim type beside every number. Instagram followers, YouTube subscribers, views, seller counters, creator statements, orders, and net profit are different measures.
- Keep Columbia’s reported-revenue statement, Virtual Humans’ reported-profit statement, Yang Mun’s own X headline, and seller-displayed counters separate. None is an audited profit result.
- Analyze scripts as structure: hook type, pacing, visual setup, emotional arc, payoff, CTA. Do not publish complete transcripts or reproduce a creator’s exact words, images, voice, or design. Downloaded Shorts stay temporary for analysis and are never hosted by Anicca; page embeds use YouTube’s official player.
- Treat health claims in the videos as unverified until checked against independent medical sources; do not use them as advice or repeat them as facts.
- Keep all articles free. Use the existing site and Postiz accounts. Add no paid service or subscription.

## Completion evidence

- The existing Yang Mun EN page and new JA page are public and free.
- The AI monk field-guide EN/JA pages are public and free; the English field guide retains its existing URL.
- The field guide links to the JSON dataset and the Yang Mun case study.
- The `/blog/c/ai-monk-avatars` hub lists both field-guide editions.
- The existing English field-guide URL has no non-avatar videos in its sample and links to the dataset and Yang Mun case study.
- `lite-youtube-embed` renders Shorts in portrait and does not create a full iframe until click; legacy embeds remain landscape.
- The two book proposals are in the repository and share one thesis and chapter structure adapted for each language.
- The public JSON parses and its records link to their evidence.
- Four X posts are confirmed by distinct `PUBLISHED` receipts and exact permalinks; every EN/JA article URL receives a direct tracked link.
- PR CI passes, the main merge is deployed, and production reads confirm the article pages, dataset, and Shorts embed markup.
- Additional subscription/tool spend is $0.

## Atomic TODO and order

| ID | Exact change | Dependency | DONE evidence |
|---|---|---|---|
| AM-1 | Create `apps/landing/public/data/ai-monk-avatar-database-2026.json` with sourced account, offer, provenance, creative, and dated metric fields. | Public source review; supplied screenshots. | JSON parses; each account has evidence status, source URLs, and explicit unknowns. |
| AM-2 | Add the renderer contract for `[youtube-short:ID|TITLE]`, preserve `[youtube-embed:ID]`, and wire `lite-youtube-embed` for article pages. | Existing `render-article-markdown.js` and site App Router. | Focused test passes for portrait/landscape, escaped titles, invalid IDs, and no eager iframe. |
| AM-3 | Expand Yang Mun EN; add Yang Mun JA; rewrite the existing `ebook-publishing-ai-monk-economy-2026` page as the English field guide; create its JA counterpart; map both field slugs to `ai-monk-avatars`; link the dataset and related Anicca articles. | AM-1 and AM-2. | Four EN/JA pages are source-linked and free; the English field URL remains stable; the category hub lists both editions; video examples are AI monk avatars. |
| AM-4 | Add EN/JA book proposals under `docs/books/`. | AM-1 and AM-3. | Both files contain title, hook, reader promise, and the same 10 connected chapters. |
| AM-5 | Run focused checks, commit/push, open PR, pass exact-head CI, merge, and verify Netlify production readback. | AM-1–AM-4. | Main merge SHA, successful deploy, and exact article/data/embed reads. |
| AM-6 | Publish four tracked X posts through the existing Postiz route, one for each article URL in its native language. | AM-5. | Four distinct Postiz `PUBLISHED` receipts and exact X permalinks; all four URLs receive a direct link; no duplicate sends. |

**AM-1 status:** Dataset source data is recorded in `apps/landing/public/data/ai-monk-avatar-database-2026.json`; five profile records and 21 source records pass JSON syntax and source-reference checks.

**AM-2 status:** Renderer tests cover portrait Shorts, legacy landscape embeds, escaped titles, invalid IDs, and no eager iframe. The pinned Apache-2.0 `lite-youtube-embed@0.3.4` dependency and client-only loader are in the worktree; focused renderer and CTA tests pass.

**Current cursor:** AM-3 English/Japanese article family and category hub.
