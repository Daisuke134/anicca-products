# The Art of AI Monks — research log (ongoing deepening loop)

Purpose: every pass ADDS dated, cited material; never rewrite. Manuscript: `docs/books/the-art-of-ai-monks-en.md`; manifest: `docs/books/the-art-of-ai-monks-sources.json`; build: `python3 apps/landing/scripts/build-ai-monk-book.py --language en` (needs pandoc + weasyprint).

Rules: facts only from sources; creator figures are labeled creator statements; no invented numbers or quotes; cite with new `S##` ids appended at the end of Appendix C.

## Pass 2 — 2026-10-23 (JST)

Read via X API: @shalevhvs (Shalev Hani, user id 1627750431454597146) original posts and articles from 2026-06-04 to 2026-10-19 (~120 posts, replies/reposts excluded), plus the pinned article of 2026-04-09.

Added: Ch.3 priority-claim paragraph; Ch.4 section “In the creator's own words, April–October 2026” (origin, five-step system, $170K sale, 7-character/4-VA operation, product ladder, number table, priority, what happened next); Ch.9 section “What the creator says about persuasion”; S31 upgraded from discovery lead to read-back; S33–S46 added.

| ID | Date (UTC) | URL | What it is |
|---|---|---|---|
| S31 | 2026-04-09 | https://x.com/shalevhvs/status/2042242260784537736 | Pinned article: I Built a Fake AI Monk, Made $500K in 6 Months |
| S33 | 10 July 2026 | https://x.com/shalevhvs/status/2075547466896929129 | “How I Run 7 AI Characters With 4 VAs and Make $70K-$100K a Month”, X article |
| S34 | 26 June 2026 | https://x.com/shalevhvs/status/2070484602112901418 | “How ONE AI Character Makes Money 5 Ways”, X article |
| S35 | 16 July 2026 | https://x.com/shalevhvs/status/2077788420240494866 | sale announcement post |
| S36 | 28 July 2026 | https://x.com/shalevhvs/status/2082119075095060964 | “How I Built a Fake AI Monk Into a $170K Exit”, X article |
| S37 | 14 August 2026 | https://x.com/shalevhvs/status/2088280128313012510 | “How I Build AI Characters That Make Money While I Sleep”, X article |
| S38 | 8 September 2026 | https://x.com/shalevhvs/status/2097341909765362013 | five-stage thread |
| S39 | 26 August 2026 | https://x.com/shalevhvs/status/2092594203151024478 | “ebooks are the lowest tier” post |
| S40 | 9 July 2026 | https://x.com/shalevhvs/status/2075216613083890068 | coverage and priority post |
| S41 | 11 October 2026 | https://x.com/shalevhvs/status/2109344859538817070 | “they want to feel understood” post |
| S42 | 20 June 2026 | https://x.com/shalevhvs/status/2068359500290294062 | “your mom won’t” post |
| S43 | 25 June 2026 | https://x.com/shalevhvs/status/2070173211216756851 | career-claim post |
| S44 | 18 October 2026 | https://x.com/shalevhvs/status/2111854752770453629 | reset and hiring post |
| S45 | 25 June 2026 | https://x.com/shalevhvs/status/2070165893641048162 | TikTok Shop throwback post |
| S46 | 7 October 2026 | https://x.com/shalevhvs/status/2107862141051261038 | “4 ways to make money with AI in 2027” post |

Discrepancies recorded (not reconciled): digital-products-only (Apr) vs supplement/Amazon affiliate (Jun, Oct); 5M→6M followers for Yang Mun, 8M across 7 characters; $500K dated to “2025” in a Jun 2026 post while the Apr 2026 article says “6 months ago”; Columbia ($300K+ revenue, rejected $325K offer) vs creator ($170K sale, Jul 2026).

## Open leads for the next pass

- Older @shalevhvs posts before 2026-06-04 (paginate further with get_users_posts; next token at end of pass 2 run).
- Articles not yet read in full: 2066132946285891963 (5-minute build), 2065429953488081307 (Dropshipping is dead), 2069415756497027409 (Unemployable), the 60-days $48K breakdown linked from 2065773168070144164.
- Eurovision News piece on Yang Mun (creator mentions it in S40; not located yet).
- Post-sale Yang Mun accounts: who operates them, any change in disclosure or offers.
- Other creators in the AI Monk Database (aniccaai.com/ai-monk-database) with their own public write-ups.
- Japanese edition: needs a translation pass for the new sections before `--language ja` builds again (the build asserts the JA translation matches the EN manuscript hash).
