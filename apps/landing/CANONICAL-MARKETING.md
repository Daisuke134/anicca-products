# Canonical marketing deployment bridge

The canonical marketing source is `Daisuke134/life-manager/apps/landing/marketing`. Both full-site workflows currently pin `MANAGER_MARKETING_REVISION` to `510d0ba5bffe6784e77fb605779d7754a642e370`; the adapter SHA-256 is `ea2a20b9326138052409b18ef303d90f33575537f86807b8553f9c365e794a42`. The workflows stage canonical app assets, build this repository's complete static export, and then replace the allowlisted marketing routes/assets. The `/dais` and `/dais/ja` source templates are `pages/products-en.html` and `pages/products.html` at Life Manager revision `6bbef9053bb1feb011c971c2c0eb38d8da9a71ad`. Both workflows apply only those two pages through `MANAGER_PRODUCTS_REVISION` after the full-site overlay and record the catalog revision in `out/manager-release.json`. The duplicate Next.js catalog is not a source; never maintain a second copy of the marketing pages here.

The post-deploy smoke checks the actual HTML and any legacy page chunk using the existing tested `assertWebAppHandoff`, then checks provider health, legacy Stripe reachability and the checkout method guard. The static page does not require a nonexistent Next.js page chunk. Auto-rollback remains active.

## Manager homepage publication

PR #733 merged as main `75865dc23cfb07015ce8b74623d4e0f86359b40a` and updated the full-site marketing pin before the catalog release. The current public `/en` and `/ja` readbacks contain the new homepage story. The Manager article installer/content remain independently pinned at `9a60b49e4bd4d288a491f0fb026af74e933c7eba` / `ec903aa16ce2683f59a7a10e67b6cdc994c722ec`; homepage readback does not prove every article destination or traffic outcome.

The canonical homepage story is live. Separate article coverage and product outcomes remain distinct acceptance items.

Local builds must stage the same pinned package with `node /tmp/manager-publish-overlay.mjs --stage` after downloading and verifying the adapter exactly as the workflows do. Generated registry/icons are build inputs, not a second source registry. The Manager research overlay keeps its independent reviewed pin.

## Published app discovery

The publisher's topic-first `/blog` index renders the existing `AppDiscovery` immediately before `MediaFooter`, using all six canonical published apps in their existing Anicca-first order. Preserve the legacy import literal required by the pinned Manager adapter. `public/llms.txt` lists Daily Dhamma, Sleep Reset and STUDIO CHERIE with the same introduction links, Store identities and product facts; existing unpublished-product labels remain explicit.

Acceptance: the existing Manager adapter remains repeatable, landing CI and the existing Netlify production build pass, and official HTTP readback confirms the homepage research update and all six introduction/App Store destinations. The Manager research collection retains its independent article source pin. These checks establish publication and reachability; traffic, installs and revenue impact remain unmeasured.
