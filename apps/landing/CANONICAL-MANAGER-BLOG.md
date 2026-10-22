# Canonical Manager article source

Source authority: Daisuke134/life-manager, immutable revision `32cb5b84d052de9f2be3b2a3c8e8c21a150c4da1`, merged through [source PR #8518](https://github.com/Daisuke134/life-manager/pull/8518).
Installer SHA-256: `c0908ffa9f899138f3f342140063b595e3b7bcab72f6e516d704290d3207e141`.

The canonical package at `docs/research/manager/publication/2026-10-19/manifest.json` contains **65 articles and 33 media files**. All 63 previously published articles retain their exact bytes and URLs, and all 29 existing media entries and hashes remain unchanged. This update adds English and Japanese articles explaining humans& Ampersand, plus four original PNG figures showing the learning loop and evaluation-score weighting in both languages.

New article URLs:

- [English: Ampersand Explained](https://aniccaai.com/blog/manager-humansand-ampersand-en)
- [Japanese: Ampersandを基礎から理解する](https://aniccaai.com/blog/manager-humansand-ampersand-ja)

The articles explain language models, reinforcement learning, simulated people, and long-term collaboration, with comparisons to research from Simile, Aaru, and Andon Labs. The practical work reanalyzes published evaluation data and records an API-access check. It does not claim an authenticated Ampersand inference or an independently measured model-performance result.

The existing canonical importer reads the consolidated manifest and verifies every article and media hash. The source inventory at `products/manager/publication/articles-2026-10-22.json` binds eleven standalone manuscripts and the four additive figures to their source hashes; `products/manager/scripts/build_blog_publication.py --check` verifies the generated package. Source-relative citations resolve to existing files at each manuscript's recorded immutable source commit. Existing importer and article-renderer bytes remain unchanged.

The existing PR and deployment workflows run the canonical pre-build importer. `/blog/manager` is the canonical collection, `/blog/c/manager` the category alias, and article paths remain `/blog/manager-<topic>-ja/en`.

This repository contains the publishing bridge only. Do not edit generated Manager copies here. Make content/code changes in the canonical repository, follow its existing checks, then update both immutable workflow pins and verify the installer digest. Existing marketing pins, post-build marketing overlay, and payment smoke remain unchanged.

Source publication does not assert a completed production deploy. After deployment, independently verify `/blog/manager/release.json` against the exact source revision, 65 unique article/hash pairs and 33 media hashes. Confirm all 63 previously deployed article/hash pairs and all 29 prior media hashes remain, read both new public article bodies and their canonical/language metadata, and verify collection/sitemap links and all media bytes. Record the actual deploy and readback separately from source preparation. Publishing research does not establish measured beneficiary improvement.
