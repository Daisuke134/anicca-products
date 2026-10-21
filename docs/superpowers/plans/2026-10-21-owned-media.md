# Owned media implementation plan

> Execute natively with Superpowers executing-plans and TDD. The user has approved implementation; no additional plan approval.

Goal: six correctly identified apps and a useful, crawlable article hub, preserving existing articles and purchase contracts.
Architecture: canonical marketing owns one six-app JSON registry and verified image bytes. Generated marketing HTML and the Next build consume that same registry through the existing immutable/hash-verified marketing bridge. Shared loadAllBlogPosts and businessOf own article corpus and taxonomy. Archive pages use static numbered routes, 24 posts per page, ordinary links.
Stack: existing HTML/CSS, Node, Next/React; no dependencies added.
Spec: unified user handoff 2026-10-21 in this task.

## Constraints
Preserve PR530, PR531 renderer/content ownership, PR477 dates, held PR468, Manager overlay and all articles/URLs/CTA/dates. No publisher replay or unknown-effect changes. Exactly six approved IDs. Cherie Japanese-only. Store metadata is not tested UI. No invented traction. All app CTA arrows removed. No release until exact-built visual QA.

## Art direction
Reference: parent inspected calai.app desktop, /blog desktop/narrow. White surface, black readable type, real app imagery, direct actions; no borrowed claims. Taste draw: split-stage chosen because a real product icon and its actual function can share the first screen. Use a calm reading column for article rows, with six product entries requested by user (overrides skill's blanket card prohibition). Keep actual icon artwork including its brand gradients. Do not invent motion/images merely to satisfy a generic quota. Blog headline: Articles for everyday life. Product section: Find your next app. Thankful: Make room for gratitude. All copy grounded in supplied official facts.

## Tasks
- [ ] RED: native Thankful identity, exactly six apps/icons/languages, arrow-free CTA and asset hashes. Implement canonical registry, generated cards and staged asset adapter. GREEN: real data and manifest validation.
- [ ] RED: ten historical/company fixtures outside app hub, true anicca-ios retained, shared corpus includes writer posts and dedupes with article-route precedence. Implement explicit classification and loader consistency. GREEN: category consumers and writer fixtures.
- [ ] RED: initial list <=9, crawlable archive covers every slug exactly once, boundary/invalid page handling, ItemList lengths. Implement shared list view, /blog hub and /blog/archive/[page], sitemap paths and feed categories. Preserve Manager adapter literals and test integration.
- [ ] Implement matching Thankful hero/product rows and scoped styles from approved direction; remove unsupported copy. Check source lint with explicit real-brand exceptions.
- [ ] Run focused + normal suites, combined exact build with pinned Manager and candidate marketing; verify old article identities and KDP content remain. Required LM independent review only; no prohibited AP Codex gate.
- [ ] Produce hashed minimal built preview for parent browser at 1440/768/390, critique icon/navigation/cards/links and correct problems. Draft PRs/CI; no publication before remaining gates.

## Review focus
Private-writer collision must match actual article route; invalid page numbers must not alias page1; empty corpora must retain valid archive navigation; generated registry copy must never become a second source; Manager adapter must preserve its fail-closed patch contract. No Honne article write until exact payload and ownership/fence reconciliation.
