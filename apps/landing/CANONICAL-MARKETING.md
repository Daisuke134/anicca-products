# Canonical marketing deployment bridge

The approved marketing implementation is maintained exclusively in `Daisuke134/life-manager`, revision `8bfd89100c6ba50e8fb93bd9df4e3b493daf0061`, under `apps/landing/marketing`. The existing Netlify workflow builds this repository's complete static export, then fetches a SHA256-pinned adapter and verifies a nine-file manifest before replacing only approved routes/assets. All other products, functions and payment handlers remain unchanged. Update the immutable pin through review; never maintain a second copy of the marketing pages here.

The post-deploy smoke checks the actual HTML and any legacy page chunk using the existing tested `assertWebAppHandoff`, then checks provider health, legacy Stripe reachability and the checkout method guard. The static page does not require a nonexistent Next.js page chunk. Auto-rollback remains active.
