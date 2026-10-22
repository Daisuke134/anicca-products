# AI Monk Avatar Directory and Articles Implementation Plan

> **For agentic workers:** Execute inline in this session. Steps use checkbox syntax for tracking.

**Goal:** Ship a searchable public AI monk avatar directory and four engaging English/Japanese articles that send readers to the directory with source-backed profiles.

**Architecture:** Keep the current static JSON as the public data source. Add one pure filtering helper and one Next.js route with a client search/filter view; retain existing article URLs and update their content in place. Use the existing Postiz route only after the new pages are live.

**Tech Stack:** Next.js 14.2.5 App Router, React 18, TypeScript, Tailwind, JSON, Node `node:test`, Yomiyasu v2.1.1 for Japanese article editing, existing Postiz route.

**Spec:** `docs/superpowers/specs/2026-10-21-ai-monk-avatar-field-guide.md`

## Global Constraints

- Preserve the four existing article slugs and keep all Anicca articles free.
- Use the existing five source-backed profiles; unknown handles, languages, and locations stay unknown.
- Do not claim a world-first or world-largest census without exhaustive, repeatable evidence.
- Analyze creative structure; do not reproduce full scripts, video files, voices, images, faces, or designs.
- Add no paid service, subscription, npm dependency, account, or actor run.
- Do not automate Instagram profile collection. Instagram robots.txt prohibits automated collection without Instagram's express written permission and sets `Scrapy` to `Disallow: /`; this environment has no Apify connector or API credential. Manually transcribe fully visible screenshot handles as unverified leads only.
- Do not infer millions of accounts from screenshots showing a partial following list with 100 or 102 following.
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

`filterAiMonkAccounts(accounts, filters)` receives the existing `accounts` array and `{ query, status, language, platform, region }`; each filter may be `"all"`. It returns the original account objects in input order. Text search is case-insensitive and checks display name, aliases, creator name/profile URL, language and region labels, platform names/handles, offer names/types, and creative sample titles. Non-`all` filters combine with AND. Null or absent fields do not throw and do not match a concrete value.

Each account gains `languages: [{ label, source_ids }]` and `region_evidence: { label, basis, source_id } | null`. Record English/Spanish only where the source supports the language. Label a profile flag as a profile signal, not an operator location; keep unknown country `null`.

- [x] **RED:** Add tests for case-insensitive name/handle/creator search, AND-combined status/language/platform/region, empty language/region, and no-match results.
- [x] Run `cd apps/landing && node --test lib/ai-monk-directory.test.mjs`; it failed as expected with `ERR_MODULE_NOT_FOUND` before the helper existed.
- [x] Add only source-supported `languages` and `region_evidence` to the five account records.
- [x] Implement `filterAiMonkAccounts(accounts, filters)` in `lib/ai-monk-directory.mjs`.
- [x] Run the focused test again; 4/4 cases pass.
- [x] Parse the JSON with `python3 -m json.tool public/data/ai-monk-avatar-database-2026.json`; all language/region source IDs resolve.

### Task AM-7B: Add screenshot-seeded leads without claiming they are AI

**Files:**
- Modify: `apps/landing/public/data/ai-monk-avatar-database-2026.json`
- Modify: `apps/landing/components/AiMonkDatabase.tsx` only if existing status copy does not clearly distinguish leads.

**Interface:**

Manually transcribe only handles that are fully legible in the supplied Instagram following-list screenshots. Add candidate records with `ai_status: "unverified"`, the visible handle, and a profile link constructed from that handle. Leave creator, language, region, offer, and metrics empty. Include an unknown explaining that AI origin and account details have not been independently checked. Keep the source account identity and the fact that these came from its following list out of the public UI.

- [x] Add a non-public-source evidence record for the supplied screenshots; do not copy or publish the images.
- [x] Add 66 fully legible handles; skip cropped names and handles already in the researched records.
- [x] Keep each lead unverified and searchable by visible handle; do not infer AI status, language, creator, location, or follower counts.
- [x] Do not make automated Instagram profile requests after discovering Instagram's robots.txt restriction.
- [x] Parse the JSON and confirm every candidate evidence reference resolves; 71 total records, 5 researched + 66 leads, 28 sources, no duplicate handles.

### Task AM-8: Build the searchable directory at `/ai-monk-database`

**Files:**
- Create: `apps/landing/app/ai-monk-database/page.tsx`
- Create: `apps/landing/components/AiMonkDatabase.tsx`
- Create: `apps/landing/components/ai-monk-database.css` only if Tailwind cannot express a needed layout rule.
- Create: `apps/landing/AI-MONK-INDEX-LICENSE.md` (scoped MIT license for the new index implementation)
- Create: `apps/landing/public/data/ai-monk-avatar-database-license.md` (CC BY 4.0 scope for Anicca-authored dataset notes)

**Interface:**

The server page imports the public JSON and passes its `accounts` to `<AiMonkDatabase accounts={accounts} />`. The client component renders a prominent search field, status/language/platform/region controls, a live result count, and a responsive scrollable card grid. Cards expose display name, evidence status, known languages, sourced region signal, creator and creator-account links, avatar social links, visible offer summary, dated audience/video snapshots, source links, and unknowns. The page includes links to the four articles, the public JSON, and a GitHub contribution route. It uses CSS/Tailwind already installed; no component or database package is added.

- [x] Build the page and client component with visible `aria-label`s for search and each filter, an accessible no-results state, and a clear-filters control.
- [x] Show “Unknown” when a value is absent; never label the creator's location as the avatar's country.
- [x] Distinguish 9 researched profiles from 66 unverified candidate leads in the count and card status; do not present the list as a census.
- [x] Show the researched profiles and candidate leads without copying portraits or downloading creators' videos.
- [x] Add `metadata` with canonical `https://aniccaai.com/ai-monk-database` and a concise directory description.
- [x] Add a visible link from the four articles to `/ai-monk-database`.
- [x] Publish separate scoped code and dataset license notes and link them from the directory.
- [x] Run `cd apps/landing && npx tsc --noEmit`; it reports six existing errors in dashboard, wallet, and Life Manager CTA files, with no new AI Monk file errors. The static build below confirms the route.

### Task AM-9: Rewrite the four article bodies as readable features

**Files:**
- Modify: `apps/landing/data/research/ebook-publishing-yang-mun-video-to-product.json`
- Modify: `apps/landing/data/research/ebook-publishing-yang-mun-case-study-ja.json`
- Modify: `apps/landing/data/research/ebook-publishing-ai-monk-economy-2026.json`
- Modify: `apps/landing/data/research/ai-monk-avatar-field-guide-ja-2026.json`

**Editorial contract:**

- H1 titles: `The Yang Mun Shock: The Monk in Your Feed Has a Checkout Page`; `Yang Munの衝撃`; `The Art of AI Monks`; `AI僧侶列伝`.
- Preserve each `slug`, `lang`, existing source URLs, inline YouTube shortcode IDs, and the existing open dataset URL. Add `https://aniccaai.com/ai-monk-database` prominently.
- The Yang Mun feature opens with a concrete 65-second video scene and reveals the disagreement about the persona's identity early; then follows its format, Shalev Hani, the 30-day program and eBook bundle, conflicting revenue claims, and spiritual-trust question.
- The field guide opens with a surprising feed-level contrast, distinguishes synthetic personas from a real Thai monk's 2D avatar, gives a sourced five-profile walk-through, explains language/platform/monetization patterns, and closes with what readers can verify in the directory.
- Keep metrics dated and attributed. HeyGen/Columbia describe Yang Mun as AI-generated; the first-party page linked by Columbia says the teacher is real and only the voice is AI-translated. Report that conflict without resolving it. The Thai PBS Phra Maha AI example is a real monk with a 2D animated character, not part of the five-profile count.
- Explain the public $49.99 30-day journey (daily 5–10 minute practice, weekly videos, community and Q&A), the $59.99 bundle with three eBooks, separate seller counters, and creator revenue statements without treating any of these as audited sales or profit.
- Keep the 65-second/521,549-view and 78-second/1,102,388-view snapshots distinct from the 12-million-view metadata-only example. Views are not orders; health claims are not medical advice.
- The Maldita 250-account investigation covers seven languages and a broad health-account sample, not 250 monk avatars. Its account totals and product-link percentages must retain that denominator.
- Write fresh English and Japanese prose; copy only article mechanics such as scene-led openings, concrete details, specific subheads, and a useful close.

- [x] Rewrite each title, description, `markdown`, `word_count`, and Japanese `character_count` while preserving its slug and language.
- [x] Run JSON parse checks on all four files and assert the old slugs plus matching database/article links remain.
- [x] Run Yomiyasu v2.1.1 (`fbe02c93877d697cc53d9377b7a45dd8a1dd99b3`) for both Japanese articles as public feature articles for general readers. Reviewed the diff candidates, corrected the single revision, reran, and verified the exact final hashes. The final runs report zero lint errors and zero fact-gap candidates; remaining warnings are intentional register/repetition suggestions, not skipped numeric or identity conflicts.
- [x] Include the seller-displayed `$49.99` Journey with 5–10 minute daily practice, weekly lessons, community/Q&A; `$59.99` with three eBooks; and the separate `$19.99` home-page bundle. Attribute counters and prices to seller pages.
- [x] Read each English article from H1 to final paragraph; no unsupported first/largest claim, full transcript, or unlinked factual claim remains.

### Task AM-10: Verify, merge, and read back production

**Files:**
- Update: `docs/superpowers/specs/2026-10-21-ai-monk-avatar-field-guide.md`
- Update: this plan with checked steps and actual evidence.

- [x] Run the focused directory search test; 4/4 cases pass. Run related article JSON-LD, blog business, reading-order, YouTube embed, and CTA-link tests; 24/24 pass.
- [x] Stage the canonical marketing and Manager blog inputs at their pinned revisions with matching SHA256, then run `cd apps/landing && npx next build`; all 662 static pages generate, including `/ai-monk-database` and all four article routes. The build shows existing Wallet dependency and Tailwind warnings.
- [x] Run `git diff --check`, inspect only the dedicated branch diff, and verify no video/media download, secret, or Manager staging artifacts remain in the branch.
- [x] Commit and push the dedicated branch; open a PR; wait for exact-head CI; merge through the repo's normal `--admin` path.
- [x] Confirm the Netlify production deploy and read back `/ai-monk-database`, all four article URLs, and `/data/ai-monk-avatar-database-2026.json`.

### Task AM-11: Promote the live directory and revised features on X

**Files:**
- Create: `docs/evidence/ai-monk-avatar-directory-x-distribution-20261021.json`

- [x] Use one English and one Japanese post for the directory and linked revised features; each post contains its own direct production URL and a unique UTM campaign.
- [x] Publish through the existing `@selawmqt` Postiz identity only after live URL readback; do not edit or resend the previous four posts.
- [x] Read back each Postiz `PUBLISHED` receipt and X permalink; store sanitized public receipt fields and distinguish views/pageviews from clicks, orders, and revenue.

## Plan self-review

- Every user request maps to AM-7–11. Searchable web UI precedes article distribution; no user re-approval or additional service setup is a task dependency.
- The only new runtime logic is one pure filtering function and one client view. Existing JSON, article routing, Postiz, and Netlify deployment patterns remain the source-of-truth integrations.
- The focused filter test covers null fields, AND composition, and no-match behavior; the build covers static route generation.

**AM-7 status:** Complete. Five researched profiles carry sourced fields; 66 screenshot leads remain explicitly unverified. English/Spanish are the only verified languages; unknown account/operator locations remain unknown.

**AM-8 status:** Searchable route, 75-entry directory, source links, illustration, open data, contribution link, and scoped MIT/CC BY licenses are implemented and present in static output.

**AM-9 Yomiyasu record:** v2.1.1 at `fbe02c93877d697cc53d9377b7a45dd8a1dd99b3`. Yang Mun run `20261021T125254Z-8ea0305f`, final hash `72a6283fa8cc`; field guide run `20261021T125254Z-ded07132`, attempt 2, final hash `800fa9146d13`. Both `verify` calls matched the exact final file. Lint reported zero errors and zero fact-gap candidates; two repetition warnings remain in each article and were reviewed as acceptable polite-article register.

**Build ruling:** `npm run build` invokes `prebuild`, which fetches the live dashboard endpoint and overwrites the tracked `app/dashboard/_snapshot.json`. That dashboard refresh is outside this task. Use the installed `next build` binary directly to compile the static site against the checked-in snapshot.

**Canonical staging ruling:** The full export also requires the Life Manager marketing overlay at revision `3c41b727b8e5c6ed64008afd814e9833e0047025` (SHA256 `bd3a31878a87c9770a6cefa7e8c8140a41625da2e102cbe9f2e8cb7f35a3eec9`) and Manager blog package at revision `6ec72c658ee993cd4292548b4f8668b3fca3181d` (installer SHA256 `3f80daa0880902f2ed571b81606d62dff9d5894d04e17689355c667c01443a32`). Both were staged for the local build, then generated Manager files and tracked integration patches were restored/removed before commit.

**Current cursor:** AM-14 — existing factory recovery; AM-10 and AM-11 are complete with production/provider evidence below.

## 英語優先の公開継続

- [x] AM-12: vidIQの公開検索・profile readback、yt-dlp metadata、GitHub OSSの実測を保存し、英語の有力profileと公開metricsをデータへ反映する。
- [x] 新題 The Art of AI Monks を日英book outlineへ反映し、記事・directory・新刊・factoryを同じspecへ接続する。
- [x] 有力profileを公開platformのfollowers順で比較できる最小sortを追加し、既存検索/AND filterを保持する。
- [x] 最新main由来の専用branchへ未公開成果を継承し、AM-10/AM-11を閉じる。

**現在cursor:** AM-14の既存配信復旧。AM-12/10/11は完了。公開worktreeは `/Users/anicca/Projects/anicca-products-worktrees/ai-monk-index-launch-20261022`、branchは `feat/ai-monk-index-launch-20261022`。

**公開継続の検証:** 追加sortは失敗テスト（export未実装）を先に確認し、実装後5/5 PASS。関連記事/読み順/CTA/YouTubeを含むfocused25件PASS。最新mainのcanonical marketing `ddae10f6f511d374229062e0a15a3c9c3e41e33d` とManager renderer `25eefdf84842b14059800b35667f3520b06ec4c9` / content `32cb5b84d052de9f2be3b2a3c8e8c21a150c4da1` をworkflow通りstageし、681静的pageのbuild成功。buildは依存Wallet/Tailwind既存warnings、TS/lint skipを出す。canonical stagingのsource差分と106生成fileはtask branchから除外。最終75件dataはJSON参照/重複検証をPASSし、exact-head CIで再buildする。

**型検査の限界:** `tsc --noEmit --incremental false` は既存6件（dashboard-core declaration、wallet ExportPrivateKeyButtonProps、LmBody/LmJaCtaのwriter CTA exports）でexit2。AI Monk追加fileのerrorは0。full buildは既存設定通りtype validationをskipするため、この型債務を解消したとは報告しない。

**公開前の限定検証修正:** fresh read-only検証で指摘された3候補の古いunknown、provider丸め値/出典の表示不足、4記事の旧5/64件表記を修正。丸め値とsourceリンクのrender失敗testを先に確認し、修正後6/6 PASS。Yomiyasu v2.1.1で日本語最終稿2本のlint/diff/materialsとhash verifyを実行。lint error0、fact gap0、各warn2（既存の敬体反復）。数値差分候補3件は実データに基づく5→9の意図した更新として確認。receiptは `docs/evidence/ai-monk-editorial-20261022/summary.json`。

**本番・告知の完了:** PR #551 merged SHA `d4380515c995abd0611987bedead436fbe432dcb`。exact-head CI PASS、Netlify run `39800192156` success。UI・4記事・JSONを本番readbackし、75 records/48 sources。英語X `2113286528508285146`、日本語X `2113286777054360059` はPostiz PUBLISHEDと正確なintegration/content/permalinkを照合。analytics未測定はnullで保持。証拠は `docs/evidence/ai-monk-index-production-20261022.json` と `docs/evidence/ai-monk-x-launch-{en,ja}-20261022.json`。

**実行順の更新:** 旧AM-13→AM-14、新AM-14限定復旧→AM-13。既存配信の停止を公式Postizで確認したため、既存収益導線を先に回復する。Life Manager S11が運用TODOの正本。現在はHeyGen既存生成結果の照合とdisclosure修正。新刊本文/EPUB/PDF/販売、OSS factory、subscriptionは未完。
