# Canonical marketing deployment bridge

The approved marketing implementation is maintained exclusively in `Daisuke134/life-manager`, revision `3c41b727b8e5c6ed64008afd814e9833e0047025`, under `apps/landing/marketing`. The existing Netlify workflow fetches a SHA256-pinned adapter, stages the canonical six-app registry and verified icons into ignored `public/assets/manager-site/` before building this repository's complete static export, then applies the same adapter and verifies a 16-file manifest before replacing only approved routes/assets. All other products, functions and payment handlers remain unchanged. Update the immutable pin through review; never maintain a second copy of the marketing pages here.

The post-deploy smoke checks the actual HTML and any legacy page chunk using the existing tested `assertWebAppHandoff`, then checks provider health, legacy Stripe reachability and the checkout method guard. The static page does not require a nonexistent Next.js page chunk. Auto-rollback remains active.

Local builds must stage the same pinned package with `node /tmp/manager-publish-overlay.mjs --stage` after downloading and verifying the adapter exactly as the workflows do. Generated registry/icons are build inputs, not a second source registry. The Manager research overlay keeps its independent reviewed pin.

## Published app discovery

The publisher's topic-first `/blog` index renders the existing `AppDiscovery` immediately before `MediaFooter`, using all six canonical published apps in their existing Anicca-first order. Preserve the legacy import literal required by the pinned Manager adapter. `public/llms.txt` lists Daily Dhamma, Sleep Reset and STUDIO CHERIE with the same introduction links, Store identities and product facts; existing unpublished-product labels remain explicit.

Acceptance: the existing Manager adapter remains repeatable, landing CI and the existing Netlify production build pass, and official HTTP readback of `/blog` and `/llms.txt` confirms all six introduction and App Store destinations. The three immutable workflow pins remain unchanged. These checks establish publication and reachability; traffic, installs and revenue impact remain unmeasured.
