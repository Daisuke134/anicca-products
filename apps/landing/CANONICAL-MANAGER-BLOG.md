# Canonical Manager article source

Source authority: Daisuke134/life-manager, immutable revision `20828fc55f66d2ed8681d6bac4a9d2461ebec91a`.
Installer SHA-256: `c0908ffa9f899138f3f342140063b595e3b7bcab72f6e516d704290d3207e141`.

The reviewed canonical package at `docs/research/manager/publication/2026-10-19/manifest.json` contains **63 articles and the same 29 media files**: 54 legacy articles plus nine standalone Manager English manuscripts. Two of those nine—the evidence-card and population/behavior/causality articles—were already published through the previous supplement package; their exact bytes and URLs are retained. The seven additions cover evidence-based management, prediction versus intervention, Radiant, autonomous agents and wealth, and three distinct EBA research articles.

The existing canonical importer reads this consolidated manifest and verifies every article and media hash. The source inventory at `products/manager/publication/articles-2026-10-22.json` binds the nine original manuscripts to their source hashes; `products/manager/scripts/build_blog_publication.py --check` verifies the generated package. Seven manuscripts retain their source bytes exactly. Two EBA manuscripts remove YAML frontmatter, and source-relative citations resolve to existing files at the recorded immutable source commit. No new media or article renderer is introduced.

The existing PR and deployment workflows run the canonical pre-build importer. `/blog/manager` is the canonical collection, `/blog/c/manager` the category alias, and article paths remain `/blog/manager-<topic>-ja/en`.

This repository contains the publishing bridge only. Do not edit generated Manager copies here. Make content/code changes in the canonical repository, review and test them, then update both immutable workflow pins and installer digest. Existing post-build marketing overlay and payment smoke remain unchanged.

Source publication does not assert a completed production deploy. After deployment, independently verify `/blog/manager/release.json` against the exact source revision, 63 unique article/hash pairs and 29 media hashes. Confirm all 56 previously deployed article/hash pairs remain, read all seven new public article bodies and canonical metadata, and verify collection/sitemap links and media bytes. Record the actual deploy and readback separately from source preparation. Publishing research does not establish measured beneficiary improvement.
