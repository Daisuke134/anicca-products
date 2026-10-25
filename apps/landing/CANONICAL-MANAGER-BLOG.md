# Canonical Manager article source

Initial publication package: `Daisuke134/life-manager` revision `32cb5b84d052de9f2be3b2a3c8e8c21a150c4da1`, merged through [source PR #8518](https://github.com/Daisuke134/life-manager/pull/8518). Current installer code is pinned at `9a60b49e4bd4d288a491f0fb026af74e933c7eba`; current content is independently pinned at `ec903aa16ce2683f59a7a10e67b6cdc994c722ec`.
Installer SHA-256: `9a00fa62a6048d249b332958c1ee14a2eeeae57f2f33277b538b915bed51dbf0`.

The original canonical package at `docs/research/manager/publication/2026-10-19/manifest.json` contained 65 articles and 33 media files. The current content revision contains **67 articles and 34 media files**. It preserves the prior 65 article hashes and 33 media hashes, and adds `manager-ai-assistant-vs-agent-next-task-en`, `manager-artificial-societies-open-behavior-research-ja`, plus one media file. The immutable installer emits all 67 unique article/hash records and 34 media files; the live collection readback has the same 67 unique article slugs.

New article URLs:

- [English: Ampersand Explained](https://aniccaai.com/blog/manager-humansand-ampersand-en)
- [Japanese: Ampersandを基礎から理解する](https://aniccaai.com/blog/manager-humansand-ampersand-ja)
- [English: AI assistant or agent?](https://aniccaai.com/blog/manager-ai-assistant-vs-agent-next-task-en)
- [Japanese: 人工社会を使ったオープンな行動研究](https://aniccaai.com/blog/manager-artificial-societies-open-behavior-research-ja)

The articles explain language models, reinforcement learning, simulated people, and long-term collaboration, with comparisons to research from Simile, Aaru, and Andon Labs. The practical work reanalyzes published evaluation data and records an API-access check. It does not claim an authenticated Ampersand inference or an independently measured model-performance result.

The existing canonical importer reads the consolidated manifest and verifies every article and media hash. The source inventory at `products/manager/publication/articles-2026-10-22.json` binds eleven standalone manuscripts and the four additive figures to their source hashes; `products/manager/scripts/build_blog_publication.py --check` verifies the generated package. Source-relative citations resolve to existing files at each manuscript's recorded immutable source commit. Existing importer and article-renderer bytes remain unchanged.

The existing PR and deployment workflows run the canonical pre-build importer. `/blog/manager` is the canonical collection, `/blog/c/manager` the category alias, and article paths remain `/blog/manager-<topic>-ja/en`.

This repository contains the publishing bridge only. Do not edit generated Manager copies here. Make content/code changes in the canonical repository, follow its existing checks, then update both immutable workflow pins and verify the installer digest. Existing marketing pins, post-build marketing overlay, and payment smoke remain unchanged.

Source publication does not assert a completed production deploy. After deployment, independently verify `/blog/manager/release.json` against the exact code/content revisions, 67 unique article/hash pairs and 34 media hashes. Confirm all 65 earlier article/hash pairs and all 33 prior media hashes remain, read the two new public article bodies and their canonical/language metadata, and verify collection/sitemap links and all media bytes. Record the actual deploy and readback separately from source preparation. Publishing research does not establish measured beneficiary improvement.
