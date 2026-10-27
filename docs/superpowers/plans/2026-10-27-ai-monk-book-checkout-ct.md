# AI Monk書籍購入クリック計測の実装計画

> **作業方式:** 本セッションで直接実装する。

**Goal:** 英語版・日本語版の書籍購入クリックを、既存の cookieless funnel に言語別 `ct` 付きで記録する。

**Architecture:** 既存 `AiMonkBookPurchase` のbusy guard通過後、Stripe Checkout要求前に `trackEvent('checkout_click', { ct })` を1回呼ぶ。`trackEvent` はページURLのUTM値を既存 `/hit` 経路へ渡す。

**Tech Stack:** Next.js/React、TypeScript、Node.js `node:test`。

**Spec:** `docs/superpowers/specs/2026-10-21-ai-monk-avatar-field-guide.md`「AI Monk書籍の購入クリック計測」。

## Global Constraints

- CTは英語 `ai_monk_book_en_checkout`、日本語 `ai_monk_book_ja_checkout`。
- 既存 `$9.99` price、SKU、Stripe Checkout request、fulfillmentを変えない。
- 新しい依存、cookie、IP、user IDを追加しない。
- 合成eventはテストとして記録し、注文・売上として扱わない。

## Review Focus

- 英語・日本語が逆のCTを出さない: 2言語の購入component wiringを検証する。
- UTM source/medium/campaignがCT追加で失われない: `site-hit-client.test.mjs` でpayloadを検証する。
- telemetryの失敗がCheckout操作を壊さない: 既存 `trackEvent` の例外吸収を維持し、価格・fetch経路に分岐を追加しない。

---

### Task 1: 既存書籍購入ボタンをfunnelへ接続

**Files:**
- Modify: `apps/landing/components/AiMonkBookPurchase.tsx`
- Modify: `apps/landing/test/ai-monk-book-page.test.mjs`
- Modify: `apps/landing/test/site-hit-client.test.mjs`
- Test: `apps/landing/netlify/functions/_lib/__tests__/site-hit-store.test.js`
- Test: `apps/landing/netlify/functions/__tests__/site-hit.test.js`

**Interfaces:** `trackEvent(event, { type?, ct?, path? })` は `apps/landing/lib/site-hit.ts` が公開する既存関数。

- [x] **Step 1: RED** `site-hit-client.test.mjs` に `checkout_click` とedition別CT・UTMのpayload検証を追加し、現状で失敗することを確認する。
- [x] **Step 2: RED** `ai-monk-book-page.test.mjs` に英日componentからedition別CTの `checkout_click` を呼ぶ配線契約を追加し、現状で失敗することを確認する。
- [x] **Step 3: GREEN** busy guard後、Checkout fetch前にedition別CTで `trackEvent` を呼ぶ最小変更を行う。
- [x] **Step 4: Verify** `node --test test/ai-monk-book-page.test.mjs test/site-hit-client.test.mjs netlify/functions/_lib/__tests__/site-hit-store.test.js netlify/functions/__tests__/site-hit.test.js` を実行する。
- [x] **Step 5: Verify** `git diff --check` を実行し、Checkout request・SKU・priceが変更されていないことをdiffで確認する。
- [ ] **Step 6: Commit** spec、plan、実装、テストを専用branchへcommitしてpushし、PR経由で統合する。
