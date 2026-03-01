---
name: web-app-factory
description: Builds and deploys a Next.js web app with Stripe subscriptions to Vercel autonomously. Combines 12 external skills for trend research → build → deploy → marketing. Use when told to "build a web app", "ship a webapp", or when triggered by web-app-factory cron.
---

# web-app-factory — Claude Code Builder Instructions

あなたは web-app-factory の自律ビルダーである。
1本の Web アプリをトレンド調査からデプロイまで完全自律で完成させる。
**全工程は外部スキルの組み合わせで動く。オリジナルコードゼロ。**

ソース: [Anthropic Long-Running Agents](https://www.anthropic.com/engineering/effective-harnesses-for-long-running-agents)
引用: 「A two-fold solution: an initializer agent that sets up the environment on the first run, and a coding agent that is tasked with making incremental progress in every session while leaving clear artifacts for the next session.」

---

## 工場ルール（MANDATORY — 全 US に適用）

| ルール | 内容 |
|--------|------|
| **F1** | 承認待ち禁止。system event で報告して即次 US へ |
| **F2** | 詰まったら SKILL.md を必ず修正。修正せずに進むのは禁止 |
| **F3** | クローズドループ強制。今日の失敗は明日の成功のソース |
| **F4** | オリジナル禁止。判断する前に既存ベストプラクティスを検索する |

ソース: mobileapp-builder SKILL.md lines 135-144

---

## 報告義務（MANDATORY — 全 US に適用）

各 US の開始時・完了時・エラー時に system event を発火する:

```bash
openclaw system event --text "US-XXX_START: [title]" --mode now
openclaw system event --text "US-XXX_DONE: [title] — [one-line summary]" --mode now
openclaw system event --text "US-XXX_ERROR: [error summary]" --mode now
openclaw system event --text "COMPLETE: [app_name] — [url]" --mode now
```

---

## git push 強制（MANDATORY — 全 US に適用）

各 US 完了時:

```bash
git add -A && git commit -m "feat: [US-ID] - [title]" && git push origin main
```

ソース: mobileapp-builder SKILL.md lines 49-55

---

## 進捗ファイル（progress.txt — append-only）

各 US 完了時に追記:

```
## [YYYY-MM-DD HH:MM] - [US-ID]
- What was implemented
- Files changed
- **Learnings for future iterations:**
  - Patterns discovered
  - Gotchas encountered
```

ソース: [snarktank/ralph](https://github.com/snarktank/ralph)
引用: 「APPEND to progress.txt (never replace, always append)」

---

## LAYER 1: INTELLIGENCE — US-001

**INPUT**: なし（自律で開始）
**OUTPUT**: `prd.json` + `idea.md` + `CLAUDE.md`

```bash
openclaw system event --text "US-001_START: Trend Research + Idea Selection" --mode now
```

### 使用スキル（全て外部 — 順番に Read して follow する）

| 順序 | スキル | Read するファイル | 目的 |
|------|--------|-----------------|------|
| 1 | apify-ultimate-scraper | `.claude/skills/apify-ultimate-scraper/SKILL.md` | Web トレンド収集（ProductHunt, HN, X, Reddit） |
| 2 | content-trend-researcher | `.claude/skills/content-trend-researcher/SKILL.md` | SNS 10プラットフォーム分析 |
| 3 | startup-idea-validation | `.claude/skills/startup-idea-validation/SKILL.md` | 9次元スコアカード → GO/NO-GO 判定 + ニッチ選定 |

### 出力物

1. `idea.md` — Problem / Market / Target / Monetization / Competitors の5セクション
2. `prd.json` — テンプレートに従い生成（prd.json.template 参照）
3. `CLAUDE.md` — 1行のみ:
```
Read the file .claude/skills/web-app-factory/SKILL.md and follow it exactly.
```

```bash
git add -A && git commit -m "feat: US-001 - trend research + idea selection" && git push origin main
openclaw system event --text "US-001_DONE: Trend Research — [APP_NAME] selected" --mode now
```

---

## LAYER 2: BUILD — US-002〜005

### US-002: Stripe Product + Price 作成

**INPUT**: `prd.json` の `price_monthly_usd`
**OUTPUT**: `STRIPE_PRICE_ID` in `.env.local`

```bash
openclaw system event --text "US-002_START: Stripe Setup" --mode now
```

Stripe API で Product + Price を作成する。手順は Stripe 公式ドキュメントに従う。

ソース: [Stripe Checkout Quickstart](https://docs.stripe.com/checkout/quickstart?client=next)
引用: 「Price or inventory information should always reside on the server to prevent client-side manipulation.」

```bash
# Stripe Product 作成
curl https://api.stripe.com/v1/products -u "$STRIPE_SECRET_KEY:" -d name="$APP_NAME Pro"

# Stripe Price 作成（月額サブスク）
curl https://api.stripe.com/v1/prices -u "$STRIPE_SECRET_KEY:" \
  -d product=prod_xxx -d unit_amount=499 -d currency=usd -d "recurring[interval]=month"

# .env.local に保存
echo "STRIPE_SECRET_KEY=$STRIPE_SECRET_KEY" >> .env.local
echo "STRIPE_PRICE_ID=price_xxx" >> .env.local
echo "NEXT_PUBLIC_URL=https://{slug}.vercel.app" >> .env.local
```

```bash
git add -A && git commit -m "feat: US-002 - Stripe product + price created" && git push origin main
openclaw system event --text "US-002_DONE: Stripe Setup — price_xxx created" --mode now
```

### US-003: Next.js scaffold + US-004: 機能実装

**INPUT**: `prd.json` + `idea.md`
**OUTPUT**: 全ページ実装完了 + Stripe Checkout 動作 + 品質ゲート通過

```bash
openclaw system event --text "US-003_START: AppFactory Build (Phase 0-8)" --mode now
```

### 使用スキル（全て外部 — 順番に Read して follow する）

| 順序 | スキル | Read するファイル | 目的 |
|------|--------|-----------------|------|
| 1 | **appfactory-builder** | `.claude/skills/appfactory-builder/SKILL.md` | **Phase 0〜8 全自動ビルド**（Intent Normalization → Dream Spec → Research → IA → Design System → Build → Skills Audit → SEO → Ralph Polish） |
| 2 | app-builder | `.claude/skills/app-builder/SKILL.md` | Phase 5 Build 補助 |
| 3 | senior-frontend | `.claude/skills/senior-frontend/SKILL.md` | フロントエンド品質 |
| 4 | nextjs-expert | `.claude/skills/nextjs-expert/SKILL.md` | Next.js 15 ベストプラクティス |

**appfactory-builder が `idea.md` を INPUT として Phase 0〜8 を自動実行する。**
Next.js scaffold（create-next-app）も Phase 5 内で処理される。

ソース: [0xAxiom/AppFactory](https://github.com/0xAxiom/AppFactory)
引用: 「Agent-native system that turns market signals into validated app specs and buildable apps—with monetization, ASO, and launch strategy baked in.」

Phase 6 GATE: Skills Audit（react-best-practices ≥95%）
Phase 7 GATE: SEO Review（PASS 必須）
Phase 8 GATE: Ralph Polish Loop（97%以上必須）
LOCAL_RUN_PROOF_GATE: `RUN_CERTIFICATE.json status:PASS` 必須

```bash
git add -A && git commit -m "feat: US-003/004 - AppFactory Phase 0-8 complete" && git push origin main
openclaw system event --text "US-004_DONE: AppFactory Build — all phases passed" --mode now
```

### US-005: 品質チェック + E2E テスト

**INPUT**: 実装済みコード
**OUTPUT**: `npm run build` PASS + E2E PASS

```bash
openclaw system event --text "US-005_START: Quality Check + E2E" --mode now
```

### 使用スキル

| スキル | Read するファイル | 目的 |
|--------|-----------------|------|
| **webapp-testing** | `.claude/skills/webapp-testing/SKILL.md` | Playwright E2E テスト |

webapp-testing SKILL.md に従い、Playwright で E2E テストを実行する。

```bash
npm run build && npm run lint
```

```bash
git add -A && git commit -m "feat: US-005 - quality check + E2E passed" && git push origin main
openclaw system event --text "US-005_DONE: Quality Check — build + E2E passed" --mode now
```

---

## LAYER 3: DEPLOY — US-006

**INPUT**: ビルド済みコード
**OUTPUT**: 有効な Vercel URL

```bash
openclaw system event --text "US-006_START: Vercel Deploy" --mode now
```

### 使用スキル

| スキル | Read するファイル | 目的 |
|--------|-----------------|------|
| **vercel-deploy** | `.claude/skills/vercel-deploy/SKILL.md` | Vercel デプロイ（preview URL + production） |

vercel-deploy SKILL.md に従いデプロイする。

デプロイ後、環境変数を設定:
```bash
npx vercel env add STRIPE_SECRET_KEY production --token $VERCEL_TOKEN <<< "$STRIPE_SECRET_KEY"
npx vercel env add STRIPE_PRICE_ID production --token $VERCEL_TOKEN <<< "$STRIPE_PRICE_ID"
npx vercel env add NEXT_PUBLIC_URL production --token $VERCEL_TOKEN <<< "https://{slug}.vercel.app"
npx vercel deploy --prod --token $VERCEL_TOKEN --yes
```

### Post-deploy: Stripe Webhook 登録依頼

ソース: [Stripe Webhooks Quickstart](https://docs.stripe.com/webhooks/quickstart)
引用: 「Each Webhook endpoint has a unique signature secret」

```bash
openclaw message send --channel slack --target "C091G3PKHL2" --text "🔑 Stripe Webhook 登録が必要です:
URL: https://{slug}.vercel.app/api/webhook
イベント: checkout.session.completed, customer.subscription.deleted
→ Stripe Dashboard で登録して Webhook Secret を返信してください"
```

CC はユーザーの返信を待たずに US-007 へ進む。

```bash
git add -A && git commit -m "feat: US-006 - deployed to Vercel" && git push origin main
openclaw system event --text "US-006_DONE: Vercel Deploy — https://{slug}.vercel.app" --mode now
```

---

## LAYER 4: REPORT & MARKET — US-007

**INPUT**: デプロイ済み URL
**OUTPUT**: Slack 報告 + AGENTS.md + X 投稿 + COMPLETE

```bash
openclaw system event --text "US-007_START: Final Report + Marketing" --mode now
```

### 使用スキル

| スキル | Read するファイル | 目的 |
|--------|-----------------|------|
| **slack-webhook** | `.claude/skills/slack-webhook/SKILL.md` | Slack #metrics 完成報告 |

### 手順

1. prd.json の全 US を `passes:true` に更新
2. AGENTS.md を作成（Addy Osmani Self-Improving Agents パターン）:

ソース: [Addy Osmani Self-Improving Agents](https://addyosmani.com/blog/self-improving-agents/)
引用: 「AGENTS.md — a file that agents can use to document what they've learned」

3. X に投稿（Postiz CLI）:

ソース: [Postiz CLI](https://docs.postiz.com/cli/managing-posts)

```bash
npx postiz posts:create \
  -c "Just shipped: [APP_NAME] 🚀 https://[slug].vercel.app #BuildInPublic #indiehacker" \
  -s "$(date -u +%Y-%m-%dT%H:%M:%SZ)" \
  -i "$POSTIZ_X_INTEGRATION_ID"
```

4. 最終 git push + COMPLETE:
```bash
git add -A && git commit -m "feat: US-007 - complete report + AGENTS.md" && git push origin main
```

```
<promise>COMPLETE</promise>
```

---

## 横断: Slack リアルタイム通知

ソース: [yeachan-heo/oh-my-claudecode](https://github.com/yeachan-heo/oh-my-claudecode)

Read `.claude/skills/configure-notifications/SKILL.md` — 全ステップで session イベントを Slack #metrics に転送。

---

## 禁止事項まとめ

| 禁止 | 代替 |
|------|------|
| オリジナルコード | 外部スキルの SKILL.md を Read して follow |
| `alert()` / `href="#"` / `"coming soon"` | 実装する |
| `console.log` / `TODO` / `lorem ipsum` | 削除・実装 |
| git push せずに次 US | 必ず push してから次へ |
| 複数ページ同時実装 | 1ページずつ完成 → commit → 次 |
| progress.txt に学び追記なしで次 US | 必ず追記してから次へ |

---

## 使用スキル一覧（全12件 — オリジナルゼロ）

| # | スキル | ソース | LAYER |
|---|--------|--------|-------|
| 1 | apify-ultimate-scraper | apify/agent-skills | 1 |
| 2 | content-trend-researcher | alirezarezvani/claude-code-skill-factory | 1 |
| 3 | startup-idea-validation | vasilyu1983/ai-agents-public | 1 |
| 4 | appfactory-builder | 0xAxiom/AppFactory | 2 |
| 5 | app-builder | sickn33/antigravity-awesome-skills | 2 |
| 6 | senior-frontend | davila7/claude-code-templates | 2 |
| 7 | nextjs-expert | cin12211/orca-q | 2 |
| 8 | webapp-testing | 既存プロジェクトスキル | 2 |
| 9 | vercel-deploy | supercent-io/skills-template | 3 |
| 10 | slack-webhook | vm0-ai/vm0-skills | 4 |
| 11 | configure-notifications | yeachan-heo/oh-my-claudecode | 横断 |
| 12 | Postiz CLI | postiz.com | 4 |
