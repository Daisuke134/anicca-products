# Canonical marketing deployment bridge

The approved marketing implementation is maintained exclusively in `Daisuke134/life-manager`, revision `0cab1c79d191eba26c0e1b82b8298a597dd0900f`, under `apps/landing/marketing`. The existing Netlify workflow fetches a SHA256-pinned adapter, stages the canonical six-app registry and verified icons into ignored `public/assets/manager-site/` before building this repository's complete static export, then applies the same adapter and verifies a 16-file manifest before replacing only approved routes/assets. All other products, functions and payment handlers remain unchanged. Update the immutable pin through review; never maintain a second copy of the marketing pages here.

The post-deploy smoke checks the actual HTML and any legacy page chunk using the existing tested `assertWebAppHandoff`, then checks provider health, legacy Stripe reachability and the checkout method guard. The static page does not require a nonexistent Next.js page chunk. Auto-rollback remains active.

Local builds must stage the same pinned package with `node /tmp/manager-publish-overlay.mjs --stage` after downloading and verifying the adapter exactly as the workflows do. Generated registry/icons are build inputs, not a second source registry. The Manager research overlay keeps its independent reviewed pin.
