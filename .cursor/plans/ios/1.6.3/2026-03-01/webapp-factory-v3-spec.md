# webapp-factory v3 — オリジナリティ完全排除 + 一次ソース検証済み

**Date**: 2026-03-01
**Author**: Claude Code
**Status**: ⬜ 未実行
**オリジナリティ**: 0%（v2 で発見した5つのオリジナリティを全て修正）

---

## 0. v2 → v3 の変更点

v2 で5つのオリジナリティが発見された。v3 は全て修正する。

| # | v2 のオリジナリティ | v3 の修正 | 一次ソース |
|---|-------------------|----------|-----------|
| O-1 | 単発 `-p` 呼び出しで全7 US を1回実行 | **Ralph ループ**（bash ループで `-p` を反復実行） | [snarktank/ralph ralph.sh](https://github.com/snarktank/ralph/blob/main/ralph.sh) — `claude --dangerously-skip-permissions --print < "$SCRIPT_DIR/CLAUDE.md"` |
| O-2 | X 投稿がない | **Postiz agent CLI** で X に自動投稿 | [Postiz 公式](https://postiz.com/) — ⚠️ `docs.postiz.com/usage/cli` は 404。正しいドキュメントは [docs.postiz.com/introduction](https://docs.postiz.com/introduction)。CLI コマンドは `postiz agent`。**ただし Mac Mini に未インストール** |
| O-3 | E2E テストなし（grep のみ） | **Playwright**（Mac Mini にインストール済み `/opt/homebrew/bin/playwright`）+ **webapp-testing スキル** | Playwright: インストール確認済み。webapp-testing スキル: `/Users/anicca/anicca-project/.claude/skills/webapp-testing/SKILL.md` に存在 |
| O-4 | vercel-deploy スキル未使用 | **vercel-deploy スキル**を使う | インストール確認済み。デプロイスクリプト: `bash /mnt/skills/user/vercel-deploy/scripts/deploy.sh [path]` |
| O-5 | 単発起動（コンテキスト溢れリスク） | **Ralph ループパターン**で各 US を独立イテレーションで実行 | [Anthropic Long-Running Agents](https://www.anthropic.com/engineering/effective-harnesses-for-long-running-agents) — 「Every token you add to the context window competes for the model's attention」 |

### 一次ソース検証結果（v2 で引用したものを全て再検証）

| ソース | URL | 検証結果 |
|--------|-----|---------|
| snarktank/ralph | https://github.com/snarktank/ralph | ✅ 存在確認済み |
| ralph.sh | https://github.com/snarktank/ralph/blob/main/ralph.sh | ✅ `claude --dangerously-skip-permissions --print` 確認済み |
| 0xAxiom/AppFactory | https://github.com/0xAxiom/AppFactory | ✅ 存在確認済み。Playwright E2E 記載あり |
| OpenClaw RFC #10320 | https://github.com/openclaw/openclaw/discussions/10320 | ✅ 存在確認済み（2026-02-06 投稿） |
| Anthropic Long-Running Agents | https://www.anthropic.com/engineering/effective-harnesses-for-long-running-agents | ✅ 存在確認済み |
| supercent-io/vercel-deploy | https://github.com/supercent-io/skills-template | ✅ 存在確認済み |
| Postiz docs.postiz.com/usage/cli | https://docs.postiz.com/usage/cli | ❌ **404 エラー**。正しいドキュメントは https://docs.postiz.com/introduction |
| Postiz 本体 | https://postiz.com/ | ✅ 存在確認済み。CLI コマンドは `postiz agent` |
| wshobson/agents stripe-integration | https://github.com/wshobson/agents | ✅ 前回検証済み |
| charon-fan/agent-playbook | https://github.com/charon-fan/agent-playbook | ✅ 前回検証済み |
| Macaron Software Factory | https://github.com/macaron-software/software-factory | ✅ 前回検証済み |
| Stripe 公式 Next.js Quickstart | https://docs.stripe.com/checkout/quickstart?client=next | ✅ 前回検証済み |

---

## 1. 工場の全体像（誰が何をやるか）

```
┌──────────────────────────────────────────────────────────────────┐
│                    webapp-factory v3 全体像                       │
│                                                                  │
│  登場人物:                                                       │
│  ├─ Anicca（OpenClaw エージェント）= 工場長。監視・報告・指示     │
│  ├─ Claude Code Opus（`-p` モード）= 作業員。コードを書く       │
│  └─ ダイス（人間）= オーナー。Slack で報告を受け取る            │
│                                                                  │
└──────────────────────────────────────────────────────────────────┘

┌─ 24/7 Factory Flow ──────────────────────────────────────────────┐
│                                                                   │
│  cron 09:00 JST（Anicca OpenClaw jobs.json）                     │
│      │                                                            │
│      ▼                                                            │
│  ┌─ ANICCA（工場長）──────────────────────────────────────────┐  │
│  │                                                             │  │
│  │  ① SKILL.md を読む                                         │  │
│  │  ② Slack #metrics に「🏭 webapp-factory 起動」              │  │
│  │  ③ Ralph ループスクリプトを起動:                             │  │
│  │     exec pty:true background:true                           │  │
│  │     command: "bash ralph-webapp.sh"                         │  │
│  │  ④ 監視ループ開始:                                          │  │
│  │     ├─ system event を待つ                                  │  │
│  │     │   US-XXX_START → Slack「🏗️ US-XXX 開始」             │  │
│  │     │   US-XXX_DONE  → Slack「✅ US-XXX 完了」              │  │
│  │     │   US-XXX_ERROR → Slack「❌ エラー」                   │  │
│  │     │   COMPLETE     → Slack「🎉 完成」                     │  │
│  │     │                                                       │  │
│  │     ├─ 10分無音 → process(action:log) でログ確認            │  │
│  │     │   → Slack に進捗報告                                  │  │
│  │     │                                                       │  │
│  │     └─ エラー検出 → エラーマッピングテーブルからガイダンス   │  │
│  │         → process(action:submit) でワーカーに送信           │  │
│  │         → Slack に「🔧 ガイダンス送信」                      │  │
│  │                                                             │  │
│  └─────────────────────────────────────────────────────────────┘  │
│      │                                                            │
│      ▼                                                            │
│  ┌─ RALPH ループ（bash スクリプト）────────────────────────────┐  │
│  │                                                             │  │
│  │  while prd.json に passes:false がある:                     │  │
│  │     ① prd.json から次の US（passes:false）を取得           │  │
│  │     ② CLAUDE.md + prompt.md を結合                         │  │
│  │     ③ claude --dangerously-skip-permissions --print         │  │
│  │        < combined_prompt.md                                 │  │
│  │     ④ 出力を progress.txt に追記                           │  │
│  │     ⑤ prd.json の該当 US を passes:true に                 │  │
│  │     ⑥ git commit + push                                   │  │
│  │     ⑦ 次のイテレーション（新鮮なコンテキスト）             │  │
│  │                                                             │  │
│  │  利点:                                                      │  │
│  │  ├─ 各 US が独立したコンテキストで実行される               │  │
│  │  ├─ 1回クラッシュしても次のイテレーションで続行            │  │
│  │  └─ prd.json + git history + progress.txt がメモリ         │  │
│  │                                                             │  │
│  └─────────────────────────────────────────────────────────────┘  │
│      │                                                            │
│      ▼                                                            │
│  ┌─ CLAUDE CODE OPUS（作業員 — 各イテレーション）──────────────┐  │
│  │                                                             │  │
│  │  1つの US だけを実行:                                       │  │
│  │  ① system event「US-XXX_START」                             │  │
│  │  ② 実装（1機能ずつ。プレースホルダー禁止）                 │  │
│  │  ③ L0 Gate（grep 8パターン）                                │  │
│  │  ④ Playwright E2E（US-005 のみ）                            │  │
│  │  ⑤ 自己改善 BLOCKING GATE                                  │  │
│  │     エラーあった → prompt.md に Evolution marker → git push │  │
│  │  ⑥ git commit + push                                       │  │
│  │  ⑦ system event「US-XXX_DONE」                              │  │
│  │  ⑧ 終了（Ralph ループが次の US を呼ぶ）                     │  │
│  │                                                             │  │
│  └─────────────────────────────────────────────────────────────┘  │
│      │                                                            │
│      ▼                                                            │
│  ┌─ 完了後 ───────────────────────────────────────────────────┐  │
│  │                                                             │  │
│  │  ① AGENTS.md に学習記録を集約                               │  │
│  │  ② Slack #metrics に完成報告                                │  │
│  │  ③ X（Twitter）に投稿（Postiz agent CLI — 要インストール） │  │
│  │  ④ Vercel URL をダイスに共有                                │  │
│  │                                                             │  │
│  └─────────────────────────────────────────────────────────────┘  │
│                                                                   │
└───────────────────────────────────────────────────────────────────┘
```

---

## 2. Slack 報告の仕組み（詳細）

```
Claude Code（作業員）
    │
    │  openclaw system event --text "US-003_DONE: ..." --mode now
    │
    ▼
OpenClaw Gateway（Mac Mini 常駐）
    │
    │  system event を受信
    │
    ▼
Anicca（工場長 — SKILL.md のロジック）
    │
    │  イベントを解釈 → Slack メッセージを構成
    │
    ▼
Slack #metrics (C091G3PKHL2)
    │
    ▼
ダイス（人間）が Slack で確認
```

| 報告タイミング | 誰が発火 | どうやって Slack に届く |
|---------------|---------|----------------------|
| US 開始 | Claude Code | `openclaw system event` → Anicca → Slack |
| US 完了 | Claude Code | `openclaw system event` → Anicca → Slack |
| エラー | Claude Code | `openclaw system event` → Anicca → Slack |
| 10分無音 | Anicca（自発） | `process action:log` でログ確認 → Slack |
| ガイダンス送信 | Anicca（自発） | エラー検出 → `process action:submit` → Slack |
| 工場完成 | Claude Code | `openclaw system event "COMPLETE"` → Anicca → Slack |

---

## 3. 各 US の詳細

### US-001: トレンド調査 + prd.json 生成

| 項目 | 値 |
|------|-----|
| **担当** | Claude Code |
| **入力** | なし（自律開始） |
| **出力** | `daily-apps/{YYYYMMDD}-webapp/prd.json` + `CLAUDE.md` |
| **使用スキル** | content-trend-researcher, startup-idea-validation, google-trends, reddit-insights |
| **ソース** | [0xAxiom/AppFactory](https://github.com/0xAxiom/AppFactory) — 「turns market signals into validated app specs」 |

### US-002: Stripe Product + Price 作成

| 項目 | 値 |
|------|-----|
| **担当** | Claude Code |
| **入力** | prd.json の price_monthly_usd |
| **出力** | `STRIPE_PRICE_ID` in `.env.local` |
| **方法** | Stripe REST API（curl） |
| **ソース** | [Stripe API Reference](https://docs.stripe.com/api/products/create) — 一次ソース確認済み |

### US-003: Next.js プロジェクト作成

| 項目 | 値 |
|------|-----|
| **担当** | Claude Code |
| **入力** | prd.json の slug, tech_stack |
| **出力** | `npx create-next-app` 完了 + `npm run build` PASS |
| **使用スキル** | nextjs-expert, senior-frontend |
| **ソース** | [Next.js Installation](https://nextjs.org/docs/getting-started/installation) — 一次ソース確認済み |

### US-004: 機能実装（1ページずつ）

| 項目 | 値 |
|------|-----|
| **担当** | Claude Code |
| **入力** | prd.json の機能仕様 |
| **出力** | 全ページ実装 + Stripe Checkout 動作 |
| **使用スキル** | app-builder, senior-frontend, nextjs-expert |
| **Stripe パターン** | Server Action（`"use server"` + `stripe.checkout.sessions.create`） |
| **Stripe ソース** | [Stripe Checkout Quickstart](https://docs.stripe.com/checkout/quickstart?client=next) — 一次ソース確認済み |
| **禁止** | alert(), href="#", "coming soon", console.log, TODO, FIXME, lorem ipsum, NotImplemented |

### US-005: 品質チェック + E2E テスト

| 項目 | 値 |
|------|-----|
| **担当** | Claude Code |
| **入力** | 実装済みコード |
| **出力** | L0 Gate PASS + Playwright E2E PASS + `npm run build` PASS |

**テスト3層**:

| 層 | ツール | 何を確認 | ソース |
|----|--------|---------|--------|
| L0 | grep（8パターン） | alert(), console.log, TODO 等の slop 検出 | [Macaron Software Factory](https://github.com/macaron-software/software-factory) |
| L1 | `npm run build` | TypeScript コンパイル + Next.js ビルド | Next.js 標準 |
| L2 | **Playwright**（`/opt/homebrew/bin/playwright`）| ブラウザ E2E: ページ表示、リンク遷移、Stripe ボタン | Mac Mini にインストール確認済み。webapp-testing スキル（`.claude/skills/webapp-testing/`）でラップ |

### US-006: Vercel デプロイ

| 項目 | 値 |
|------|-----|
| **担当** | Claude Code |
| **入力** | ビルド済みコード |
| **出力** | 有効な Vercel URL |
| **使用スキル** | **vercel-deploy**（supercent-io/skills-template）— インストール確認済み |
| **ソース** | [supercent-io/skills-template](https://github.com/supercent-io/skills-template) — 一次ソース確認済み |

### US-007: 完了報告 + X 投稿

| 項目 | 値 |
|------|-----|
| **担当** | Claude Code + Anicca |
| **出力** | AGENTS.md + Slack 報告 + X 投稿 |
| **X 投稿方法** | **Postiz agent CLI** — ⚠️ 要インストール（`npm install -g postiz`）。CLI コマンド: `postiz agent`。[postiz.com](https://postiz.com/) — 一次ソース確認済み。**注意**: `docs.postiz.com/usage/cli` は 404。正しいドキュメントは [docs.postiz.com/introduction](https://docs.postiz.com/introduction) |
| **AGENTS.md** | [snarktank/ralph AGENTS.md](https://github.com/snarktank/ralph/blob/main/AGENTS.md) — 一次ソース確認済み |

---

## 4. Ralph ループの仕組み（v3 の核心）

```
ralph-webapp.sh（bash スクリプト — 新規作成必須）
│
│  ソース: snarktank/ralph ralph.sh
│  一次ソース: https://github.com/snarktank/ralph/blob/main/ralph.sh
│  引用: claude --dangerously-skip-permissions --print < "$SCRIPT_DIR/CLAUDE.md"
│  引用: Each iteration is a fresh instance with clean context.
│         Memory persists via git history, progress.txt, and prd.json.
│
│  while:
│     ① jq で prd.json から次の passes:false US を取得
│     ② なければ EXIT（全 US 完了）
│     ③ CLAUDE.md + prompt.md を結合してプロンプト作成:
│        「US-XXX をやれ。prompt.md に従え。」
│     ④ claude --dangerously-skip-permissions --print < prompt
│     ⑤ 出力を progress.txt に追記
│     ⑥ prd.json の該当 US を passes:true に更新
│     ⑦ git add -A && git commit && git push
│     ⑧ ループ先頭に戻る
│
│  最大イテレーション: 20（安全装置）
│  各イテレーション間: 新鮮なコンテキスト（過去のトークンなし）
│
│  Ralph ループ完了後:
│     openclaw system event --text "COMPLETE: {app} — {url}" --mode now
```

**v2（単発呼び出し）vs v3（Ralph ループ）の比較**:

| 比較 | v2（単発） | v3（Ralph ループ） |
|------|-----------|------------------|
| コンテキスト | 7 US 分蓄積 → 溢れる | 各 US が新鮮 |
| クラッシュ耐性 | 1回死んだら全部終わり | 次のイテレーションで続行 |
| メモリ | Claude のコンテキストのみ | git + progress.txt + prd.json |
| ソース | **オリジナル（悪い）** | [snarktank/ralph](https://github.com/snarktank/ralph) |

---

## 5. 対話モード vs 非対話モード（v3 の決定）

**決定: 非対話モード（`--print`）**

| 根拠 | ソース |
|------|--------|
| Ralph は `--print` を使う | [ralph.sh](https://github.com/snarktank/ralph/blob/main/ralph.sh) — `claude --dangerously-skip-permissions --print` |
| Anthropic は headless/自動化に `-p` を推奨 | [Claude Code Headless Mode](https://code.claude.com/docs/en/headless) — 「The --print flag runs Claude Code in non-interactive mode for automation」 |
| OpenClaw coding-agent も `-p` を使う | [OpenClaw coding-agent](https://github.com/openclaw/openclaw/blob/main/skills/coding-agent/SKILL.md) |
| 対話モードは Enter 忘れ等で詰まる | 実体験（v1 テストラン） |

**ただし PTY は必須**:

| ソース | 引用 |
|--------|------|
| [OpenClaw coding-agent](https://github.com/openclaw/openclaw/blob/main/skills/coding-agent/SKILL.md) | 「Always use pty:true - coding agents need a terminal!」 |

---

## 6. インストール済みスキル一覧（実機確認済み）

| # | スキル | 場所 | 用途 | 確認 |
|---|--------|------|------|------|
| 1 | appfactory-builder | `.agents/skills/` | 7パイプラインオーケストレーター | ✅ |
| 2 | app-builder | `.agents/skills/` | テンプレート選択 + エージェント調整 | ✅ |
| 3 | senior-frontend | `.agents/skills/` | React/Next.js/TypeScript | ✅ |
| 4 | nextjs-expert | `.agents/skills/` | App Router, Server Components | ✅ |
| 5 | webapp-testing | `.claude/skills/` | **Playwright E2E ラッパー** | ✅ |
| 6 | ralph-autonomous-dev | `.claude/skills/` | Ralph ループパターン（スキル版） | ✅ |
| 7 | vercel-deploy | skills（npx） | Vercel デプロイ | ✅ |
| 8 | content-trend-researcher | skills（npx） | SNS トレンド分析 | ✅ |
| 9 | startup-idea-validation | skills（npx） | 市場規模・競合スコアリング | ✅ |
| 10 | slack-webhook | skills（npx） | Slack 通知 | ✅ |
| 11 | Playwright CLI | `/opt/homebrew/bin/playwright` | ブラウザ E2E テスト | ✅ |
| 12 | Postiz CLI | ❌ 未インストール | X 投稿 | ❌ 要インストール |

---

## 7. 修正対象ファイル

| # | ファイル | 何を直す |
|---|---------|---------|
| 1 | `~/.openclaw/skills/webapp-factory-orchestrator/SKILL.md` | Ralph ループ起動に変更 |
| 2 | `~/.openclaw/skills/webapp-factory-orchestrator/prompt.md` | Ralph ループ対応 + Playwright E2E + vercel-deploy スキル + Postiz |
| 3 | **新規**: `~/.openclaw/skills/webapp-factory-orchestrator/ralph-webapp.sh` | Ralph ループスクリプト |
| 4 | **新規**: Postiz CLI インストール | `npm install -g postiz` |

---

## 8. 受け入れ条件

| # | 条件 | 検証方法 |
|---|------|---------|
| AC1 | Ralph ループで各 US が独立イテレーションで実行される | ralph-webapp.sh の while ループ確認 |
| AC2 | `--print` モード（非対話）で実行される | ralph-webapp.sh 内の claude コマンド確認 |
| AC3 | Playwright E2E テストが US-005 に含まれる | prompt.md に playwright コマンドあり |
| AC4 | vercel-deploy スキルを使ってデプロイされる | prompt.md に vercel-deploy スキル参照あり |
| AC5 | Postiz CLI で X 投稿される | Postiz インストール済み + prompt.md に postiz agent あり |
| AC6 | 各 US の進捗が Slack #metrics に報告される | system event → Anicca → Slack |
| AC7 | L0 Gate（grep 8パターン）が PASS | grep 実行結果 |
| AC8 | Stripe Checkout が Server Action で動作 | pricing ページのボタンクリック → Stripe |
| AC9 | AGENTS.md に学習記録が蓄積される | ファイル存在確認 |
| AC10 | 全ソースが一次ソースで検証済み | セクション 0 の検証テーブル |
| AC11 | prompt.md に self-improvement BLOCKING GATE がある | grep "BLOCKING" prompt.md |
| AC12 | 全変更が git push 済み | git status clean |

---

## 9. 境界（やらないこと）

| やらないこと | 理由 |
|------------|------|
| L1 独立レビュアー（別 LLM） | v3 では L0 Gate + Playwright で十分 |
| Customer Portal（Stripe Billing Portal） | v3 ではサブスク管理 UI 不要 |
| charon-fan フル Multi-Memory（JSON メモリシステム） | AGENTS.md + Evolution/Correction markers のライト版のみ |
| 並列実行 | 1日1本から |
| Embedded Checkout（iframe） | Stripe Hosted Checkout（redirect）で十分 |

---

## 10. 実行手順

| # | 何をするか | 依存 |
|---|-----------|------|
| 1 | Postiz CLI インストール: `npm install -g postiz` | なし |
| 2 | ralph-webapp.sh 作成 | なし |
| 3 | SKILL.md 更新（Ralph ループ起動に変更） | 2 |
| 4 | prompt.md 更新（Playwright + vercel-deploy + Postiz + Ralph 対応） | 1, 2 |
| 5 | git push | 3, 4 |
| 6 | テスト実行（一時 cron で1回実行） | 5 |

---

## 11. ソース一覧（全て一次ソース検証済み）

| # | ソース | URL | 検証 | 何をコピーしたか |
|---|--------|-----|------|----------------|
| S1 | snarktank/ralph | https://github.com/snarktank/ralph | ✅ | Ralph ループパターン、prd.json、progress.txt、AGENTS.md |
| S2 | snarktank/ralph ralph.sh | https://github.com/snarktank/ralph/blob/main/ralph.sh | ✅ | `claude --dangerously-skip-permissions --print` コマンド |
| S3 | Anthropic Long-Running Agents | https://www.anthropic.com/engineering/effective-harnesses-for-long-running-agents | ✅ | 2エージェントパターン、progress.txt、新鮮コンテキスト |
| S4 | Anthropic Claude Code Best Practices | https://www.anthropic.com/engineering/claude-code-best-practices | ✅ | Headless mode 推奨 |
| S5 | Claude Code Headless Mode | https://code.claude.com/docs/en/headless | ✅ | `--print` フラグの公式ドキュメント |
| S6 | OpenClaw coding-agent | https://github.com/openclaw/openclaw/blob/main/skills/coding-agent/SKILL.md | ✅ | PTY 必須、background 実行パターン |
| S7 | OpenClaw RFC #10320 | https://github.com/openclaw/openclaw/discussions/10320 | ✅ | Ralph + OpenClaw 統合パターン |
| S8 | 0xAxiom/AppFactory | https://github.com/0xAxiom/AppFactory | ✅ | Playwright E2E、品質ゲート |
| S9 | Macaron Software Factory | https://github.com/macaron-software/software-factory | ✅ | L0 決定論的品質ゲート |
| S10 | Stripe API Products | https://docs.stripe.com/api/products/create | ✅ | Product + Price 作成 |
| S11 | Stripe Checkout Quickstart | https://docs.stripe.com/checkout/quickstart?client=next | ✅ | Server Action パターン |
| S12 | wshobson/agents stripe-integration | https://github.com/wshobson/agents | ✅ | Webhook handler、テストカード |
| S13 | charon-fan/agent-playbook | https://github.com/charon-fan/agent-playbook | ✅ | Evolution/Correction markers |
| S14 | Postiz 公式 | https://postiz.com/ | ✅ | X 自動投稿 |
| S15 | Postiz ドキュメント | https://docs.postiz.com/introduction | ✅ | CLI: `postiz agent` |
| S16 | Next.js Installation | https://nextjs.org/docs/getting-started/installation | ✅ | create-next-app |
| S17 | Addy Osmani Self-Improving Agents | https://addyosmani.com/blog/self-improving-agents/ | ✅ | AGENTS.md パターン |
| S18 | supercent-io/skills-template | https://github.com/supercent-io/skills-template | ✅ | vercel-deploy スキル |
| S19 | mobileapp-builder SKILL.md | ローカル | ✅ | 自己改善 BLOCKING GATE、工場ルール |
| S20 | webapp-testing SKILL.md | ローカル | ✅ | Playwright E2E ラッパー |
