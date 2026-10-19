# Canonical Manager article source

Source authority: Daisuke134/life-manager, immutable revision `45b41beea3c87bb563b5c08e97066bcea66eaada`.
Reviewed package manifest SHA-256: `dd509054ac523d2483449da5ab5148fff5d2647f32ced3c4591b31d7a834ead1`.

The existing PR and deployment workflows verify and run the canonical pre-build importer. It stages 54 reviewed articles (27 English, 27 Japanese), 29 hash-addressed images and the guarded Manager-only blog integration before Next generates the existing blog index, category pages and sitemap. `/blog/manager` is the canonical collection, `/blog/c/manager` the category alias, and article paths remain `/blog/manager-<topic>-ja/en`.

This repository contains the publishing bridge only. Do not edit generated Manager copies here. Make content/code changes in the canonical repository, review and test them, then update both immutable workflow pins and installer digest. Existing post-build marketing overlay and payment smoke remain unchanged.
