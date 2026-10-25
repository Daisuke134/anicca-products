# eBook Legacy Access Readback Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use `superpowers:executing-plans` to implement this plan inline. Steps use checkbox syntax.

**Goal:** Clear a migrated paid-access hold only after a complete, customer-matched Stripe subscription inventory has been read and stored.

**Architecture:** When the existing webhook reserves a subscription state for a subscriber with `stripe_legacy_paid_pending_readback`, the server verifies the stored Stripe customer ID, lists that customer’s subscriptions with `status=all` and cursor pagination, classifies every subscription as Letter or explicitly non-Letter, and updates each Letter state through the existing generation-protected RPC. A service-role-only finalizer clears the legacy hold and recomputes `tier` only after all pages and state writes succeed. Any mismatch, unknown subscription, or incomplete readback preserves the hold. The manual production workflow also emits the normalized Supabase project ref, never the URL or service-role key. Stripe’s [List subscriptions API](https://docs.stripe.com/api/subscriptions/list) supports customer filtering, `status=all`, and `starting_after` pagination.

**Tech Stack:** Netlify Functions, Node.js built-in test runner, PostgreSQL PL/pgSQL, Supabase PostgREST, Stripe REST API.

**Spec:** Life Manager canonical SSOT, `docs/superpowers/specs/2026-09-25-life-manager-unified-ssot.md`, eBook items 33–40.

## Latest-main carry-forward (2026-10-25)

- Current branch is rebased onto latest `origin/main` `3d28ad9e8afb2768fd7e42d606b6a66895a50c69`; PR #420 and #453 remain open/stale and are not the merge target.
- Last production DB audit (read-only, 2026-10-24T19:27:36Z): intended project `cycgdwndgfgdbnndithc`; 10 subscribers, 0 paid, 0 paid rows without a subscription pointer, no receipt/state tables, and no migration-added subscriber columns. Refresh this audit immediately before DDL.
- Source from the old PR includes the deterministic subscription backfill and subscriber-before-state lock ordering, but the manual workflow still invokes mutable `netlify-cli@latest`. Verify each old PR review comment against the exact source, add missing regressions, and replace that secret-reading CLI path before source acceptance.
- Current cursor: PR #710 includes the source entitlement fix and receipt/state migration. Initial migration `20261025031520 ebook_webhook_receipts` and ACL correction source file `20261025031703_ebook_webhook_service_role_only.sql` are each applied once; the production migration registry reports the ACL correction as version `20261025032324`. Exact-head Landing CI and independent ACL review passed before rebase; focused eBook contracts pass 69/69. Official production readback confirms 10 subscribers preserved, no paid/legacy holds or mapping conflicts, empty receipt/state tables, deny-by-default table ACLs for anon/authenticated, service_role-only SELECT/INSERT/UPDATE, and all five fixed-search-path RPCs executable only by service_role. PostgREST table access and RPC schema-cache/null-guard reads passed without writes. Sanitized evidence → `../../evidence/ebook-legacy-webhook-acl-20261025.json`. The source branch has been rebased onto `origin/main` `3d28ad9e8afb2768fd7e42d606b6a66895a50c69`; current cursor is push/recheck PR #710, merge, deploy from main, and verify the deployed webhook route. Existing paid holds remain fail-closed. The production Resend sender is configured; its value is not recorded here.
- Factory buttons are already clickable in current main and report a local readiness blocker; production generation remains fail-closed because runtime/provider funding and Instagram readiness are absent. This eBook cursor does not change Factory or Grok Bot daily posting.

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
- [x] Commit and run manual metadata workflow 37888016410 after CI; workflow completed successfully.
- [x] Read-only production result: project ref cycgdwndgfgdbnndithc is ACTIVE_HEALTHY; receipt/state tables are not exposed, receipt probe is 404/PGRST205, and paid subscriber counts are 0.
- [x] Read-only Management API ACL check: anon, authenticated, and service_role have no CREATE on public. The centrally stored secondary token metadata includes database_migrations_write; no token was logged.

### Task 3: Complete source acceptance for PR #420

- [x] Full-checkout npm ci, npm run test:telemetry, and npm run build passed in workflow 37888016410 on head 381edca7aec07d34caabe3f46017658db5605b21.
- [x] Run `git diff --check` and inspect the final diff.
- [x] Obtain a fresh read-only safety verification of the changed access-state and workflow files: no Critical/Important findings. The reviewer did not re-audit the SQL migration.
- [x] Changes are pushed to PR #420, synced with main by GitHub, and required Landing CI passed on head 381edca7aec07d34caabe3f46017658db5605b21.
- [ ] Keep PR #420 open until the production target is confirmed, the corrected migration is applied once, and table/function/ACL/schema-cache readbacks pass. Do not call source merge or tests a paid checkout/PDF receipt.

### Task 4: Prevent Stripe customer remapping for every Letter subscriber

**Goal:** A non-null Stripe customer mapping remains bound to its subscription state. Legacy-held subscribers also require the stored subscriber customer ID to match. A mismatch returns before any state or pointer update; a separate new subscription may use a new Stripe customer. When a subscription event has no email, a customer-ID fallback maps only when exactly one subscriber matches; ambiguous matches fail before any subscription-state write.

**Files:**
- Modify: `apps/landing/netlify/functions/_migrations/2026-10-05-ebook-webhook-receipts.sql`
- Modify: `apps/landing/netlify/functions/webhook.js`
- Test: `apps/landing/netlify/functions/_lib/__tests__/ebook-webhook.test.js`

- [x] Write failing tests for (a) an existing subscription receiving a different customer ID, (b) a customer mapping changed between reservation and apply, and (c) every `SECURITY DEFINER` function using `search_path = pg_catalog, public, pg_temp`. Preserve the existing test where a separate new subscription for the same email has a separate customer.
- [x] Run those tests and confirm the customer-mismatch cases currently mutate state and the migration still uses the unsafe search path.
- [x] Make `reserve_ebook_subscription_readback` and `apply_ebook_subscription_state` return `customer_mismatch` before writes when the incoming ID disagrees with that exact subscription state's stored customer ID. Keep the stored subscriber/customer check for legacy-held rows. Preserve the existing legacy-specific outcome and allow a new subscription to use its own Stripe customer.
- [x] Pin each `SECURITY DEFINER` function to `search_path = pg_catalog, public, pg_temp`.
- [x] Make the webhook classify the new outcome as `stripe_customer_mapping_mismatch` with `manual_customer_reconciliation`; update the fake gateway to model the SQL contract.
- [x] Run the focused webhook tests (30/30) and `git diff --check`.
- [x] Full landing acceptance passed in workflow 37888016410 on current main-synced PR head.
- [x] Sync the PR branch with latest main through GitHub; resulting head 381edca7aec07d34caabe3f46017658db5605b21 passed required CI.
- [x] Fresh read-only CodeRabbit audit on head `f82c106` identified two P2 findings: duplicate subscription backfill was nondeterministic, and migration/RPC lock order could deadlock.
- [x] Revalidate deterministic backfill and subscriber-before-state lock-order regressions on latest-main source. The focused webhook suite confirms stable `DISTINCT ON ... ORDER BY signed_up_at NULLS FIRST, id::text` selection and subscriber-before-state locking.
- [x] Replace the mutable CLI in the live production deploy workflow. Latest main no longer has the older manual metadata workflow described by the prior TODO; `.github/workflows/netlify-deploy.yml` now installs exact `netlify-cli@27.14.2` from the isolated `apps/landing/scripts/netlify-cli/package-lock.json` under Node 22 and runs that local binary. The tool lock overrides vulnerable `toml` to patched 5.0.1; its isolated `npm audit` reports zero vulnerabilities. An offline contract test checks exact manifest/lock versions, the override, runtime, and local binary invocation. The application package lock remains unchanged.
- [x] Audit the carried PR #420/#453 findings against current code and add regressions for reproduced gaps: Stripe invoice metadata precedence, lifecycle events with missing metadata, explicit non-Letter products sharing a Letter price, database-issued legacy snapshot time, stale pre-send receipt recovery, and cancellation before the Letter welcome send. The latest-main webhook suite passes all 38 tests.
- [ ] Run focused and full Landing acceptance, `git diff --check`, and a fresh read-only security review of the complete branch, including SQL and workflow.

### Task 5: Apply and verify the production migration

- [x] Confirm the intended project `cycgdwndgfgdbnndithc` and aggregate-only pre-migration snapshot: 10 subscribers, 0 paid, 0 paid without pointer, 0 conflicting subscription mappings; receipt/state tables and RPCs absent; no existing subscriber rows changed.
- [x] Apply initial migration once through official Supabase API; registry recorded `20261025031520 ebook_webhook_receipts`. Readback confirmed schema, columns, all five functions/search paths, RLS, and subscriber preservation.
- [x] Inspect production ACL and identify default ALL privileges inherited by anon/authenticated/service_role on both new tables; policies are absent and tables currently contain 0 rows. This is a least-privilege mismatch even though RLS currently blocks row access.
- [x] Push follow-up migration source file `20261025031703_ebook_webhook_service_role_only.sql`; the pre-rebase exact-head Landing CI and fresh-context read-only ACL review passed. Re-run CI on the rebased PR head before merge.
- [x] Apply the corrective migration once through the official Supabase migration API; production registry version is `20261025032324` and confirms one application.
- [x] Read back migration version, table RLS and exact grants (anon/authenticated no privileges; service_role SELECT/INSERT/UPDATE only), all five fixed-search-path RPCs, and PostgREST table/schema-cache access. Sanitized receipt → `../../evidence/ebook-legacy-webhook-acl-20261025.json`.
- [ ] Push the latest-main rebased branch and refresh PR #710 checks; merge the accepted source branch; deploy from main; verify the deployed webhook route loads. Paid Checkout and locale PDF delivery remain unproven until an actual paid receipt exists.
