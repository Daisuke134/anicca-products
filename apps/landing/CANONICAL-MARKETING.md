# Canonical marketing deployment bridge

The approved marketing implementation is maintained exclusively in `Daisuke134/life-manager`, revision `72f1c4150d549e25f98fa0220bffd7c06ba592d9`, under `apps/landing/marketing`. This revision refreshes only the English/Japanese homepage research sections and restores the full 19-file package contract from the last deployed pin, including the six-app registry, verified icons, founder pages and public resume. The existing Netlify workflow fetches a SHA256-pinned adapter, stages the canonical app assets into ignored `public/assets/manager-site/` before building this repository's complete static export, then applies the same adapter and verifies the 19-file manifest before replacing only approved routes/assets. All other products, functions and payment handlers remain unchanged. Update the immutable pin through review; never maintain a second copy of the marketing pages here.

The post-deploy smoke checks the actual HTML and any legacy page chunk using the existing tested `assertWebAppHandoff`, then checks provider health, legacy Stripe reachability and the checkout method guard. The static page does not require a nonexistent Next.js page chunk. Auto-rollback remains active.

## Manager homepage update candidate

The current candidate is pinned to life-manager revision `72f1c4150d549e25f98fa0220bffd7c06ba592d9`; the Manager article installer/content remain independently pinned at `9a60b49e4bd4d288a491f0fb026af74e933c7eba` / `ec903aa16ce2683f59a7a10e67b6cdc994c722ec`. Both landing CI and Netlify use the same pins. The candidate build completed locally with all 737 static routes, including 67 Manager article pages; the post-build adapter verified and applied its 19-file allowlisted marketing package without replacing other routes. The English and Japanese homepage outputs link to the latest AI assistant/agent and artificial-societies articles and expose current engineering, population-synthesis, behavior-evaluation, and research-library status.

This is source and build verification only. The public `/en` and `/ja` readback on 2026-10-25 still did not contain the 67-article homepage copy or the two latest article links. The update is not live until this branch passes normal review, is merged, the Netlify deployment succeeds, and the public pages are read back again. Do not describe a local build or branch as a production update.

Local builds must stage the same pinned package with `node /tmp/manager-publish-overlay.mjs --stage` after downloading and verifying the adapter exactly as the workflows do. Generated registry/icons are build inputs, not a second source registry. The Manager research overlay keeps its independent reviewed pin.

## Published app discovery

The publisher's topic-first `/blog` index renders the existing `AppDiscovery` immediately before `MediaFooter`, using all six canonical published apps in their existing Anicca-first order. Preserve the legacy import literal required by the pinned Manager adapter. `public/llms.txt` lists Daily Dhamma, Sleep Reset and STUDIO CHERIE with the same introduction links, Store identities and product facts; existing unpublished-product labels remain explicit.

Acceptance: the existing Manager adapter remains repeatable, landing CI and the existing Netlify production build pass, and official HTTP readback confirms the homepage research update and all six introduction/App Store destinations. The Manager research collection retains its independent article source pin. These checks establish publication and reachability; traffic, installs and revenue impact remain unmeasured.
