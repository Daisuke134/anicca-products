# Canonical marketing deployment bridge

The canonical marketing source is `Daisuke134/life-manager/apps/landing/marketing`; the full-site overlay remains pinned to `d9f627f81c0cbb3b79e14a64eef21e837ca7b1e8` and its adapter SHA-256 remains `ea2a20b9326138052409b18ef303d90f33575537f86807b8553f9c365e794a42`. It stages canonical app assets before building this repository's complete static export, then replaces the allowlisted marketing routes/assets. The `/dais` and `/dais/ja` catalog source now lives in `pages/products-en.html` and `pages/products.html` at Life Manager main revision `6bbef9053bb1feb011c971c2c0eb38d8da9a71ad`. Both workflows apply only those two pages through `MANAGER_PRODUCTS_REVISION` after the full-site overlay, recording the separate catalog revision in `out/manager-release.json`. The duplicate Next.js catalog is not a source. Keep the full-site pin unchanged for this catalog release so the separate homepage candidate remains unpublished; never maintain a second copy of the marketing pages here.

The post-deploy smoke checks the actual HTML and any legacy page chunk using the existing tested `assertWebAppHandoff`, then checks provider health, legacy Stripe reachability and the checkout method guard. The static page does not require a nonexistent Next.js page chunk. Auto-rollback remains active.

## Manager homepage update candidate

The newer homepage candidate is present in Life Manager main revision `6bbef9053bb1feb011c971c2c0eb38d8da9a71ad`; this products-catalog release deliberately applies only `/dais` and `/dais/ja`, leaving production `/en` and `/ja` on the full-site pin above. The Manager article installer/content remain independently pinned at `9a60b49e4bd4d288a491f0fb026af74e933c7eba` / `ec903aa16ce2683f59a7a10e67b6cdc994c722ec`. Publishing the homepage candidate requires its own scoped release and public readback.

This is source and build verification only. The public `/en` and `/ja` readback on 2026-10-25 still did not contain the 67-article homepage copy or the two latest article links. The update is not live until this branch passes normal review, is merged, the Netlify deployment succeeds, and the public pages are read back again. Do not describe a local build or branch as a production update.

Local builds must stage the same pinned package with `node /tmp/manager-publish-overlay.mjs --stage` after downloading and verifying the adapter exactly as the workflows do. Generated registry/icons are build inputs, not a second source registry. The Manager research overlay keeps its independent reviewed pin.

## Published app discovery

The publisher's topic-first `/blog` index renders the existing `AppDiscovery` immediately before `MediaFooter`, using all six canonical published apps in their existing Anicca-first order. Preserve the legacy import literal required by the pinned Manager adapter. `public/llms.txt` lists Daily Dhamma, Sleep Reset and STUDIO CHERIE with the same introduction links, Store identities and product facts; existing unpublished-product labels remain explicit.

Acceptance: the existing Manager adapter remains repeatable, landing CI and the existing Netlify production build pass, and official HTTP readback confirms the homepage research update and all six introduction/App Store destinations. The Manager research collection retains its independent article source pin. These checks establish publication and reachability; traffic, installs and revenue impact remain unmeasured.
