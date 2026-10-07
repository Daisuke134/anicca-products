# eBook Legacy Access Readback Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use `superpowers:executing-plans` to implement this plan inline. Steps use checkbox syntax.

**Goal:** Clear a migrated paid-access hold only after a complete, customer-matched Stripe subscription inventory has been read and stored.

**Architecture:** When the existing webhook reserves a subscription state for a subscriber with `stripe_legacy_paid_pending_readback`, the server verifies the stored Stripe customer ID, lists that customer’s subscriptions with `status=all` and cursor pagination, classifies every subscription as Letter or explicitly non-Letter, and updates each Letter state through the existing generation-protected RPC. A service-role-only finalizer clears the legacy hold and recomputes `tier` only after all pages and state writes succeed. Any mismatch, unknown subscription, or incomplete readback preserves the hold. The manual production workflow also emits the normalized Supabase project ref, never the URL or service-role key. Stripe’s [List subscriptions API](https://docs.stripe.com/api/subscriptions/list) supports customer filtering, `status=all`, and `starting_after` pagination.

**Tech Stack:** Netlify Functions, Node.js built-in test runner, PostgreSQL PL/pgSQL, Supabase PostgREST, Stripe REST API.

**Spec:** Life Manager canonical SSOT, `docs/superpowers/specs/2026-09-25-life-manager-unified-ssot.md`, eBook items 33–40.

## Global Constraints

- A legacy hold is cleared only after exact Stripe customer identity and a complete `status=all` subscription list, including every page.
- While the hold is pending, a subscription event with a different or missing stored customer ID must not attach a new subscription or move the subscriber pointer.
- Letter subscriptions are recognized only by `metadata.product=letter` or the configured Letter price IDs; ambiguous records preserve the hold.
- Stripe/API errors, malformed cursors, incomplete pages, state-write failures, and customer mismatches never become an empty subscription list.
- A customer inventory row is discovery data, not the state to apply: after reserving each subscription generation, retrieve that exact subscription again and validate its customer and Letter classification before applying status. A failed or changed readback preserves the hold.
- The finalizer is `SECURITY DEFINER` with fixed `search_path`, revoked from `PUBLIC`, `anon`, and `authenticated`, and granted only to `service_role`.
- Do not apply production DDL until the manual Netlify readback confirms that `SUPABASE_URL` points to the intended project and a fresh read-only safety verification passes.
- The manual workflow validates an HTTPS `*.supabase.co` origin before any authenticated fetch; invalid roots and transport failures emit sanitized reason/status fields only. It prints the normalized project ref and aggregate paid/no-subscription-pointer counts, never row data or secrets.

## Review Focus

- Same email but a different stored Stripe customer ID must not reserve an unrelated subscription, change pointers, or clear the legacy hold.
- A canceled Letter subscription plus another active/trialing Letter subscription keeps access paid.
- A complete inventory with no active/trialing Letter subscriptions clears the hold and expires access.
- A failed second page, repeated cursor, unknown Letter product/price, null customer ID, or stale generation keeps the hold.
- If a sibling is active in the customer-wide list but canceled by a newer Stripe readback before its reservation, the fresh readback wins; the stale list status must not restore paid access.
- A subscription with explicit non-Letter metadata does not grant Letter access.
- A malformed production Supabase URL produces a sanitized no-probe result; no thrown URL or fetch error may reveal the URL or key.

---

### Task 1: Add failing customer-inventory regressions and implement the safe resolution path

**Files:**
- Modify: `apps/landing/netlify/functions/_lib/__tests__/ebook-webhook.test.js`
- Modify: `apps/landing/netlify/functions/webhook.js`
- Modify: `apps/landing/netlify/functions/_migrations/2026-10-05-ebook-webhook-receipts.sql`

**Interfaces:**
- Existing entrypoint: `webhookHandler(event, dependencies)`.
- New helper: `listStripeCustomerSubscriptions(customerId, stripeKey, fetchImpl) -> { snapshotAt, subscriptions }`.
- Extend `reserve_ebook_subscription_readback` JSON with the stored customer ID and `stripe_legacy_paid_pending_readback` flag.
- New RPC: `finalize_ebook_legacy_subscription_readback(p_subscriber_id text, p_stripe_customer_id text, p_snapshot_at timestamptz, p_letter_subscription_ids text[]) -> jsonb`.

- [x] **Step 1: Write failing tests** with these names and assertions:
  - `legacy paid hold clears after complete same-customer multi-page readback with no active Letter subscription` → `tier='expired'`, flag false, finalizer follows all page/state writes.
  - `legacy paid hold clears and stays paid when Letter is active` → active Letter plus canceled Letter keeps `tier='paid'` and clears the flag; an explicitly non-Letter active subscription does not count.
  - Extend `migration-carried paid access without a Stripe pointer survives unrelated canceled subscriptions` → a different customer ID leaves the flag true, preserves the stored customer/pointer, and does not call the finalizer.
  - `legacy paid hold is preserved when customer inventory is incomplete or unclassifiable` → failed page, repeated cursor, unknown Letter price/metadata, or null customer ID leaves the flag true.
  - `legacy paid hold is not cleared when any subscription state apply is stale` → stale generation prevents finalization.
- [x] **Step 2: Run the focused webhook test and confirm the new assertions fail for the missing reconciliation path.**

Run: `node --test netlify/functions/_lib/__tests__/ebook-webhook.test.js` from `apps/landing`.
Expected: the new legacy-readback assertions fail because no customer-wide list or finalizer exists; existing tests remain green.

- [x] **Step 3: Implement `listStripeCustomerSubscriptions`** using `GET /v1/subscriptions?customer=...&status=all&limit=100`, then `starting_after` until `has_more=false`. Validate page shape, next cursor progress, exact customer ID, subscription IDs, statuses, and Letter classification. Do not treat any failure as an empty list.
- [x] **Step 4: Extend `reserve_ebook_subscription_readback`** to return the stored customer ID and legacy flag without overwriting an existing customer mapping.
- [x] **Step 5: Add the service-role-only finalizer.** Lock the subscriber, require exact customer match and same-snapshot rows for every Letter subscription, reconcile omitted old states only after complete inventory, clear the legacy flag, and recompute access from active/trialing Letter states. Preserve the hold on any mismatch or stale state.
- [x] **Step 6: Wire checkout and lifecycle webhook paths** to invoke the full customer readback only for a matching pending legacy subscriber; reject a missing/mismatched customer mapping before state writes. Then run the focused tests and confirm RED→GREEN.
- [x] **Step 7: Commit** the verified code and tests to PR #420.
- [x] **Step 8: Close the inventory-to-apply race.** The regression changes a sibling from active in the customer-wide list to canceled before its per-subscription readback. The handler now reserves the generation, retrieves that exact subscription, validates customer/status/Letter classification, then applies the fresh state. Focused webhook suite passes 27/27; failed/mismatched reads preserve the hold.

Expected focused command: `node --test netlify/functions/_lib/__tests__/ebook-webhook.test.js` from `apps/landing` → PASS.

### Task 2: Expose the production Supabase project ref safely

**Files:**
- Modify: `.github/workflows/landing-pr-build.yml`

- [x] In the existing `workflow_dispatch`-only metadata step, strictly validate production `SUPABASE_URL` before any fetch and print only a sanitized validation failure or the normalized project ref plus exact paid and paid-without-subscription-pointer counts; never print the URL, service-role key, email, or row identifiers. Local malformed-URL probe printed only `invalid_supabase_url`.
- [x] Route all Supabase fetches through a failure-safe wrapper so thrown transport/URL errors never reach workflow logs. Inline Node syntax check passes.
- [ ] Commit/push the updated workflow and run it manually after CI to capture the actual production ref/counts; the probe remains read-only.

### Task 3: Complete source acceptance for PR #420

- [ ] Run full-checkout `npm ci && npm run test:telemetry` via required CI. A local sparse-worktree run lacks installed `ethers` and is not a full-suite result.
- [x] Run `git diff --check` and inspect the final diff.
- [x] Obtain a fresh read-only safety verification of the changed access-state and workflow files: no Critical/Important findings. The reviewer did not re-audit the SQL migration.
- [ ] Push the changes to PR #420 and wait for required full-checkout CI. Keep production DDL unapplied until the exact project ref is read back and a fresh read-only review of the SQL migration is complete.
- [ ] Keep PR #420 open until the production target is confirmed, the corrected migration is applied once, and table/function/ACL/schema-cache readbacks pass. Do not call source merge or tests a paid checkout/PDF receipt.
