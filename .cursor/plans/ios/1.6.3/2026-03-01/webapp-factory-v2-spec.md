# webapp-factory v2 — 自己改善 + 品質ゲート + 報告 + Stripe 統合

**Date**: 2026-03-01
**Author**: Claude Code
**Status**: ⬜ 未実行
**オリジナリティ**: 0%

---

## 0. なぜ v2 か

v1（初回テストラン 20260301-webapp）で以下が失敗した:

| 失敗 | 根本原因 |
|------|---------|
| フェーズ報告が来ない | prompt.md に報告義務がなかった |
| `alert("Stripe checkout coming soon")` | Stripe Product/Price 作成の指示がなかった |
| git push されてない | prompt.md に push 指示がなかった |
| 品質ゲートがザル | `alert()` があるのに passes:true にした |
| 自己改善なし | エラーから学んで SKILL.md を更新する仕組みがなかった |

v2 は以下を全て外部ソースから完コピする:

| パターン | ソース | URL |
|---------|--------|-----|
| 自己改善 BLOCKING GATE | mobileapp-builder SKILL.md | ローカル |
| 自己改善メモリ | charon-fan/agent-playbook/self-improving-agent | https://github.com/charon-fan/agent-playbook |
| 工場ルール F1-F3 | mobileapp-builder SKILL.md | ローカル |
| L0 決定論的品質ゲート | Macaron Software Factory | https://github.com/macaron-software/software-factory |
| L1 独立レビュアー | ManaLabs | https://manalabs.wtf/ |
| フェーズ報告 | mobileapp-factory-v3-spec | ローカル |
| Stripe 統合 | wshobson/agents/stripe-integration | https://github.com/wshobson/agents |
| Stripe Next.js パターン | Stripe 公式 + DEV Community 2026 | https://docs.stripe.com/checkout/quickstart?client=next |
| 1機能ずつ実装 | Anthropic 公式 | https://www.anthropic.com/engineering/effective-harnesses-for-long-running-agents |
| progress.txt パターン | Ralph / Anthropic | https://github.com/snarktank/ralph |

---

## 1. 修正対象（3ファイル + 1アプリ）

| # | ファイル | 何を直す |
|---|---------|---------|
| 1 | `~/.openclaw/skills/webapp-factory-orchestrator/prompt.md` | Claude Code への指示を全面改修 |
| 2 | `~/.openclaw/skills/webapp-factory-orchestrator/SKILL.md` | Anicca 監督の動きを全面改修 |
| 3 | `daily-apps/20260301-webapp/` | DeepWork.fm の Stripe 修正 + 再デプロイ |

---

## 2. prompt.md 改修（Claude Code への指示）

### 2.1 報告義務（追加）

ソース: mobileapp-factory-v3-spec lines 590-601
引用: 「各 iteration 開始: 🏭 Iteration N: US-XXX 開始 / 各 iteration 完了: ✅ US-XXX 完了: [成果物]」

各 US の開始時・完了時に `openclaw system event` を発火する:

```bash
# 開始時
openclaw system event --text "US-XXX_START: [title]" --mode now

# 完了時
openclaw system event --text "US-XXX_DONE: [title] — [one-line summary]" --mode now

# エラー時
openclaw system event --text "US-XXX_ERROR: [error summary]" --mode now
```

### 2.2 git push 強制（追加）

ソース: mobileapp-builder SKILL.md lines 49-55
引用: 「git push せずに進む → git add -A && git commit && git push まで完了させる」

各 US 完了時:

```bash
git add -A && git commit -m "feat: [US-ID] - [title]" && git push origin main
```

禁止: git push せずに次の US に進む

### 2.3 Stripe Product 自動作成（US-002 に追加）

ソース: wshobson/agents/stripe-integration SKILL.md
引用: 「Product: What you're selling / Price: How much and how often」

ソース: Stripe 公式 Next.js Quickstart
引用: 「Price or inventory information should always reside on the server to prevent client-side manipulation.」

US-002 に以下を追加:

```bash
# Stripe Product + Price 作成（API で）
curl https://api.stripe.com/v1/products \
  -u "$STRIPE_SECRET_KEY:" \
  -d name="$APP_NAME Pro"
# → prod_xxx を取得

curl https://api.stripe.com/v1/prices \
  -u "$STRIPE_SECRET_KEY:" \
  -d product=prod_xxx \
  -d unit_amount=499 \
  -d currency=usd \
  -d "recurring[interval]=month"
# → price_xxx を取得

# .env.local に保存
echo "STRIPE_PRICE_ID=price_xxx" >> .env.local
echo "NEXT_PUBLIC_STRIPE_PRICE_ID=price_xxx" >> .env.local
```

### 2.4 Stripe Checkout 実装パターン（US-004 に追加）

ソース: DEV Community 2026
引用: 「Server Actions are the standard for creating Checkout Sessions, eliminating traditional /api/checkout folders.」

ソース: Stripe 公式
引用: 「Embedded Checkout uses an iframe that lives inside your Next.js page, keeping your user on your domain.」

2つの方法がある。v2 では **Server Action + リダイレクト** を採用（シンプル）:

```typescript
// src/app/actions/checkout.ts
"use server";
import Stripe from "stripe";

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!);

export async function createCheckoutSession(priceId: string) {
  const session = await stripe.checkout.sessions.create({
    mode: "subscription",
    line_items: [{ price: priceId, quantity: 1 }],
    success_url: `${process.env.NEXT_PUBLIC_URL}/success?session_id={CHECKOUT_SESSION_ID}`,
    cancel_url: `${process.env.NEXT_PUBLIC_URL}/pricing`,
  });
  return session.url;
}
```

禁止:
- `alert()` でプレースホルダー
- `href="#"` でデッドリンク
- `"coming soon"` テキスト

### 2.5 L0 決定論的品質ゲート（US-005 に追加）

ソース: Macaron Software Factory
引用: 「L0 Deterministic — instant detection of slop (lorem ipsum, TBD), mocks (NotImplementedError, TODO)」

US-005 Phase 6 に以下を追加:

```bash
# L0 Gate — 1件でも見つかったら FAIL
grep -rn 'alert(' src/ && echo "FAIL: alert() found" && exit 1
grep -rn 'coming soon' src/ && echo "FAIL: placeholder found" && exit 1
grep -rn 'console\.log' src/ && echo "FAIL: console.log found" && exit 1
grep -rn 'href="#"' src/ && echo "FAIL: dead link found" && exit 1
grep -rn 'TODO' src/ && echo "FAIL: TODO found" && exit 1
grep -rn 'FIXME' src/ && echo "FAIL: FIXME found" && exit 1
grep -rn 'lorem ipsum' src/ && echo "FAIL: lorem ipsum found" && exit 1
grep -rn 'NotImplemented' src/ && echo "FAIL: NotImplemented found" && exit 1
echo "L0 Gate: PASS"
```

### 2.6 自己改善 BLOCKING GATE（各 US 末尾に追加）

ソース: mobileapp-builder SKILL.md lines 57-77
引用: 「このフェーズで以下が1件でもあった場合は SKILL.md を修正してから次フェーズへ進む。修正前の次フェーズ開始は禁止。」

各 US の末尾に:

```
┌─────────────────────────────────────────┐
│ 🔄 US-XXX 終了前チェック（BLOCKING）      │
└─────────────────────────────────────────┘
トリガー（1件でも該当すれば prompt.md 修正必須）:
  □ CLI コマンドがエラーを返した
  □ 想定外の動作が起きた
  □ コマンドを訂正した
  □ ドキュメントに書いてない回避策を使った

修正手順:
  1. prompt.md の対応 US セクションに修正内容を追記
  2. git add prompt.md && git commit -m "fix(webapp-factory): <修正内容>" && git push
  3. git push 完了後に次 US へ
```

### 2.7 工場ルール（追加）

ソース: mobileapp-builder SKILL.md lines 135-144

```
F1: 承認待ち禁止。Slack に報告して即次フェーズへ。
F2: 詰まったら prompt.md を必ず修正。修正せずに進むのは禁止。
F3: クローズドループ強制。今日の失敗は明日の成功のソース。
F4: オリジナル禁止。判断する前に既存ベストプラクティスを検索する。
```

### 2.8 1機能ずつ実装（US-004 に追加）

ソース: Anthropic 公式
引用: 「asked to work on only one feature at a time」

禁止: 複数ページを同時に実装してプレースホルダーで埋める
必須: 1ページ完成 → git commit → 次のページ

### 2.9 prd.json AC 強化

| US | 追加する AC |
|----|-----------|
| US-002 | 「Stripe product + price created via API (real price_xxx ID in .env.local)」 |
| US-004 | 「Stripe checkout button calls Server Action (no alert/placeholder)」 |
| US-004 | 「No alert(), console.log, 'coming soon', TODO, or href='#' in source」 |
| US-005 | 「L0 Gate: grep returns 0 matches for all banned patterns」 |

---

## 3. SKILL.md 改修（Anicca 監督）

### 3.1 system event ベースの監視

Claude Code が `US-XXX_START` / `US-XXX_DONE` / `US-XXX_ERROR` を system event で発火。
Anicca が受信 → Slack #metrics に転送。

### 3.2 ポーリング補助

5分ごとに `process(action: "log")` でログ確認。
10分以上 system event がない場合、ログを Slack に報告。

### 3.3 工場ルール（Anicca 側）

- Claude Code が prompt.md を修正 → Anicca は翌日の実行で自動反映
- 3回連続エラー → Slack に人間レビュー依頼

---

## 4. DeepWork.fm 修正（今のアプリ）

| # | 修正 | 方法 |
|---|------|------|
| 1 | Stripe Product + Price 作成 | `curl` で Stripe API（**すでに作成済み: prod_U4KicmEZfpkr9x / price_1T6C45EeDsUAcaLSg8SXT0xT**） |
| 2 | pricing/page.tsx 修正 | `alert()` → Server Action で Stripe Checkout Session 作成 + リダイレクト |
| 3 | Server Action 作成 | `src/app/actions/checkout.ts` |
| 4 | Vercel env vars 追加 | `STRIPE_PRICE_ID` + `NEXT_PUBLIC_STRIPE_PRICE_ID` |
| 5 | Vercel 再デプロイ | `vercel deploy --prod` |
| 6 | L0 Gate 実行 | grep で banned patterns 確認 |

---

## 5. 実行手順（TODO リスト）

| # | 何をするか | 誰が | 依存 |
|---|-----------|------|------|
| 1 | **prompt.md を改修**（セクション 2 の全内容を反映） | Claude Code（俺） | なし |
| 2 | **SKILL.md を改修**（セクション 3 の全内容を反映） | Claude Code（俺） | なし |
| 3 | **DeepWork.fm の Stripe 修正** | Claude Code（俺） | 1 完了後 |
| 3.1 | Server Action `src/app/actions/checkout.ts` 作成 | Claude Code | なし |
| 3.2 | `pricing/page.tsx` の `alert()` を Server Action 呼び出しに変更 | Claude Code | 3.1 |
| 3.3 | L0 Gate 実行（grep banned patterns） | Claude Code | 3.2 |
| 3.4 | `npm run build` 確認 | Claude Code | 3.3 |
| 3.5 | Vercel に STRIPE_PRICE_ID env var 追加 | Claude Code | 3.4 |
| 3.6 | Vercel 再デプロイ | Claude Code | 3.5 |
| 3.7 | 本番 URL で Stripe Checkout 動作確認 | Claude Code | 3.6 |
| 4 | **git push**（ファクトリースキル + アプリ修正） | Claude Code（俺） | 3 完了後 |
| 5 | **テストラン**（修正後のファクトリーで新アプリを1本ビルド） | Anicca（cron or 手動） | 4 完了後 |

---

## 6. ビジュアルフロー（v2 改修後）

```
cron 09:00 JST
    │
    ▼
┌─ Anicca（監督）────────────────────────────────────────┐
│  STEP 1: APP_NAME 決定 → Slack 🏭                      │
│  STEP 2: prd.json 生成（AC 強化版）                      │
│  STEP 3: CLAUDE.md 生成                                  │
│  STEP 4: git init + remote                              │
│  STEP 5: Claude Code Opus 起動                          │
│  STEP 6: system event 監視ループ                         │
│    ├─ US-XXX_START 受信 → Slack「🏗️ US-XXX 開始」       │
│    ├─ US-XXX_DONE 受信 → Slack「✅ US-XXX 完了」         │
│    ├─ US-XXX_ERROR 受信 → Slack「❌ エラー」             │
│    └─ 10分無音 → process(log) → Slack に進捗報告         │
│  STEP 7: COMPLETE 受信 → Slack 🎉                       │
└────────────────────────────────────────────────────────┘
    │
    ▼
┌─ Claude Code Opus（選手）──────────────────────────────┐
│                                                         │
│  各 US の実行フロー:                                     │
│                                                         │
│  ① system event「US-XXX_START」                          │
│  ② 1機能ずつ実装（Anthropic 公式）                       │
│  ③ git commit + git push                                │
│  ④ AC 全項目チェック                                     │
│  ⑤ L0 Gate 実行（grep banned patterns）                 │
│  ⑥ 自己改善 BLOCKING GATE チェック                       │
│     エラーあった？                                        │
│     ├─ YES → prompt.md 修正 → git push → 次へ           │
│     └─ NO → 次へ                                        │
│  ⑦ prd.json passes:true + progress.txt 追記             │
│  ⑧ system event「US-XXX_DONE」                          │
│  ⑨ 次の US へ                                           │
│                                                         │
│  US-002 特有:                                            │
│  ├─ Stripe API で Product + Price 作成                   │
│  └─ price_xxx を .env.local に保存                       │
│                                                         │
│  US-004 特有:                                            │
│  ├─ Server Action で Stripe Checkout Session             │
│  ├─ 1ページずつ完成 → commit → 次のページ               │
│  └─ alert() / placeholder 禁止                          │
│                                                         │
│  US-005 特有:                                            │
│  ├─ L0 Gate（grep 8パターン）                             │
│  ├─ SEO チェック（sitemap, robots, OG）                  │
│  └─ Stripe /api/checkout or Server Action 動作確認       │
│                                                         │
│  全 US 完了 → system event「COMPLETE」                   │
└────────────────────────────────────────────────────────┘
```

---

## 7. 受け入れ条件

| # | 条件 | 検証方法 |
|---|------|---------|
| AC1 | prompt.md に報告義務（system event）がある | grep "system event" prompt.md |
| AC2 | prompt.md に git push がある | grep "git push" prompt.md |
| AC3 | prompt.md に Stripe Product 作成手順がある | grep "stripe.com/v1/products" prompt.md |
| AC4 | prompt.md に L0 Gate がある | grep "L0 Gate" prompt.md |
| AC5 | prompt.md に自己改善 BLOCKING GATE がある | grep "BLOCKING" prompt.md |
| AC6 | prompt.md に工場ルール F1-F4 がある | grep "F1:" prompt.md |
| AC7 | SKILL.md に system event 監視がある | grep "US-XXX_START" SKILL.md |
| AC8 | DeepWork.fm の pricing ページで Stripe Checkout に遷移する | curl + 手動確認 |
| AC9 | DeepWork.fm に alert() がない | grep -rn "alert(" src/ |
| AC10 | 全変更が git push 済み | git status clean |

---

## 8. ソース一覧

| # | ソース | URL | 何をコピーしたか |
|---|--------|-----|----------------|
| S1 | mobileapp-builder SKILL.md | ローカル | 自己改善 BLOCKING GATE、工場ルール F1-F6、git push ルール |
| S2 | mobileapp-factory-v3-spec | ローカル | フェーズ報告パターン、Slack メッセージテーブル |
| S3 | Macaron Software Factory | https://github.com/macaron-software/software-factory | L0 決定論的品質ゲート（banned patterns） |
| S4 | ManaLabs | https://manalabs.wtf/ | 独立レビュアーパターン、8/10 threshold |
| S5 | charon-fan/agent-playbook/self-improving-agent | https://github.com/charon-fan/agent-playbook | 自己改善ループ、Multi-Memory Architecture |
| S6 | wshobson/agents/stripe-integration | https://github.com/wshobson/agents | Stripe Checkout Session パターン、Webhook 設計 |
| S7 | Stripe 公式 Next.js Quickstart | https://docs.stripe.com/checkout/quickstart?client=next | Server Action + Checkout Session |
| S8 | DEV Community Stripe 2026 | https://dev.to/sameer_saleem/the-ultimate-guide-to-stripe-nextjs-2026-edition-2f33 | Server Actions 標準、Embedded Checkout |
| S9 | Anthropic 公式 Long-Running Agents | https://www.anthropic.com/engineering/effective-harnesses-for-long-running-agents | 1機能ずつ実装、progress.txt |
| S10 | snarktank/ralph | https://github.com/snarktank/ralph | prd.json パターン、progress.txt、COMPLETE シグナル |
| S11 | Addy Osmani Self-Improving Agents | https://addyosmani.com/blog/self-improving-agents/ | AGENTS.md パターン、学習ループ |
| S12 | Pedro Alonso Stripe Guide | https://www.pedroalonso.net/blog/stripe-nextjs-complete-guide-2025/ | Webhook 冪等性、レースコンディション防止 |

---

## 9. 境界（やらないこと）

| やらないこと | 理由 |
|------------|------|
| L1 独立レビュアー（別 LLM） | v2 では L0 Gate で十分。L1 は v3 で検討 |
| Webhook Route Handler | v2 では Checkout Session redirect のみ。Webhook は v3 で |
| Embedded Checkout（iframe） | v2 では Stripe Hosted Checkout（redirect）で十分 |
| multi-memory architecture（semantic/episodic/working） | v2 では prompt.md 直接修正のみ。charon-fan のフル実装は v3 で |
| テスト（TDD） | v2 のスコープはスキル修正 + アプリ修正のみ |
