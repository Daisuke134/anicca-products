# Canonical marketing deployment bridge

The canonical marketing source is `Daisuke134/life-manager/apps/landing/marketing`. This publisher PR updates both full-site workflows to pin `MANAGER_MARKETING_REVISION` to `f1926301087199fd319d60a36769ce27dc517e12`; the adapter SHA-256 remains `ea2a20b9326138052409b18ef303d90f33575537f86807b8553f9c365e794a42`. The workflows stage canonical app assets, build this repository's complete static export, and then replace the allowlisted marketing routes/assets. The `/dais` and `/dais/ja` source templates are `pages/products-en.html` and `pages/products.html` at Life Manager revision `6bbef9053bb1feb011c971c2c0eb38d8da9a71ad`. Both workflows apply only those two pages through `MANAGER_PRODUCTS_REVISION` after the full-site overlay and record the catalog revision in `out/manager-release.json`. The duplicate Next.js catalog is not a source; never maintain a second copy of the marketing pages here.

The post-deploy smoke checks the actual HTML and any legacy page chunk using the existing tested `assertWebAppHandoff`, then checks provider health, legacy Stripe reachability and the checkout method guard. The static page does not require a nonexistent Next.js page chunk. Auto-rollback remains active.

## Manager homepage publication

The earlier homepage story from PR #733 is already live; this is a separate research-progress update. Life Manager PR #8940 merged into main at `f1926301087199fd319d60a36769ce27dc517e12` on 2026-10-25. It adds current population-synthesis results, partial E16 evidence, the 90-evaluation EBA landscape, behavior-change and persuasion research, Humans& references, and the existing 67-article library while distinguishing measured engineering results from unproven human effects. At the start of this publisher PR, production still serves the previous full-site marketing pin `510d0ba5bffe6784e77fb605779d7754a642e370`; this candidate must not be described as live until the Netlify deployment and public readbacks pass.

The Manager article installer/content remain independently pinned at `9a60b49e4bd4d288a491f0fb026af74e933c7eba` / `ec903aa16ce2683f59a7a10e67b6cdc994c722ec`. The 67 existing articles are not republished by this homepage update. Homepage readback does not prove every article destination, behavior-change effect, traffic, installs, or revenue.

After deployment, verify `https://aniccaai.com/`, `/en`, `/ja`, and `/blog/manager`, the featured article links, and the deployment revision. Update this record with the exact deploy and readback only after the production pages show the pinned source. Local builds or a merged pin alone are not production publication.
## Published app discovery

The publisher's topic-first `/blog` index renders the existing `AppDiscovery` immediately before `MediaFooter`, using all six canonical published apps in their existing Anicca-first order. Preserve the legacy import literal required by the pinned Manager adapter. `public/llms.txt` lists Daily Dhamma, Sleep Reset and STUDIO CHERIE with the same introduction links, Store identities and product facts; existing unpublished-product labels remain explicit.

Acceptance: the existing Manager adapter remains repeatable, landing CI and the existing Netlify production build pass, and official HTTP readback confirms the homepage research update and all six introduction/App Store destinations. The Manager research collection retains its independent article source pin. These checks establish publication and reachability; traffic, installs and revenue impact remain unmeasured.
