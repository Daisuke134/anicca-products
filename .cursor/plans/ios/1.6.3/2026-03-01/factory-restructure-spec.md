# factory-restructure — フォルダ分離 + 2層構造統一 + リネーム

**Date**: 2026-03-01
**Status**: ⬜ 未実行

---

## 0. As-Is → To-Be

### As-Is

```
daily-apps/                          ← iOS と Web が混在
├── 20260301-webapp/                 ← Web
├── breath-calm/                     ← iOS
├── calmcortisol/                    ← iOS
├── ...

~/.openclaw/skills/
├── webapp-factory-orchestrator/     ← 1層構造（管理+ビルド混在）
├── mobileapp-factory/               ← 管理のみ（正しい）

~/.claude/skills/
├── mobileapp-builder/               ← 古い版（daily-apps 参照11箇所）

.claude/skills/
├── mobileapp-builder/               ← 新しい版（daily-apps 参照なし）
```

### To-Be

```
web-apps/                            ← Web アプリ専用
├── .env                             ← 共通キー（VERCEL_TOKEN等）
├── 20260301-deepwork/
│   └── .env.local                   ← アプリ固有（STRIPE_PRICE_ID等）
├── 20260302-focustimer/
└── ...

mobile-apps/                         ← iOS アプリ専用
├── breath-calm/
├── calmcortisol/
└── ...

~/.openclaw/skills/
├── web-app-factory-manager/         ← Anicca: cron→管理→監視
├── mobileapp-factory/               ← Anicca: cron→管理→監視（パス修正のみ）

.claude/skills/
├── web-app-factory/                 ← CC: Web アプリビルド指示
│   ├── SKILL.md                     ← 今の prompt.md を移動
│   ├── CLAUDE.md.template
│   ├── prd.json.template
│   └── ralph.sh
├── mobileapp-builder/               ← CC: iOS アプリビルド指示（変更なし）
```

ソース: [Turborepo](https://turborepo.dev/docs/crafting-your-repository/structuring-a-repository) / 引用: 「Split packages into apps/ for applications and services and packages/ for everything else」
ソース: [12-Factor App](https://12factor.net/config) / 引用: 「env vars are granular controls, each fully orthogonal to other env vars... independently managed for each deploy」

---

## 1. 命名規則

| レイヤー | Mobile | Web | 役割 |
|---------|--------|-----|------|
| **Anicca スキル（管理）** | mobileapp-factory | web-app-factory-manager | cron → フォルダ作成 → テンプレコピー → ralph.sh 起動 → 監視 |
| **CC スキル（ビルド）** | mobileapp-builder | web-app-factory | CC への全ビルド指示。ralph.sh がこれを読む |
| **OSS 名** | mobile-app-factory | web-app-factory | skill.sh / ClawHub で公開する名前 |

---

## 2. web-app-factory（CC スキル）の中身

| ファイル | 内容 | 元ファイル |
|---------|------|-----------|
| `SKILL.md` | CC への全ビルド指示（US-001〜007） | `~/.openclaw/skills/webapp-factory-orchestrator/prompt.md` を移動 |
| `CLAUDE.md.template` | `Read .claude/skills/web-app-factory/SKILL.md and follow it exactly.` | 新規作成 |
| `prd.json.template` | タスクテンプレート（US-001〜007 の雛形） | 新規作成 |
| `ralph.sh` | ループスクリプト。`web-apps/.env` を source。`--mcp-config` 付き | 移動 + 修正 |

---

## 3. web-app-factory-manager（Anicca スキル）の中身

Mobile の mobileapp-factory と同じ構造:

```
STEP 1: web-apps/YYYYMMDD-HHMMSS-app/ を作成
STEP 2: テンプレートをコピー
  cp .claude/skills/web-app-factory/prd.json.template → prd.json
  cp .claude/skills/web-app-factory/CLAUDE.md.template → CLAUDE.md
  cp .claude/skills/web-app-factory/ralph.sh → ralph.sh
  touch progress.txt
STEP 3: Slack #metrics に起動報告
STEP 4: ralph.sh を起動（tmux or exec background）
STEP 5: 監視（system event → Slack 転送）
STEP 6: 完了後 → Slack 報告 + Webhook 登録依頼
```

---

## 4. ralph.sh の --mcp-config 修正

**`claude --print` でも `--mcp-config` で MCP サーバーを使える。**

```
claude --help より:
  --mcp-config <configs...>  Load MCP servers from JSON files or strings
```

| 変更対象 | 変更内容 |
|---------|---------|
| web-app-factory の ralph.sh | `claude --dangerously-skip-permissions --print --mcp-config ~/.claude/mcp.json < CLAUDE.md` |
| mobileapp-builder の ralph.sh | 同上（Pencil MCP が使えるようになる） |

---

## 5. .env 配置

### 共通キー: `web-apps/.env`

```bash
VERCEL_TOKEN=（ダイスが作成済み — web-apps/.env に設定する）
STRIPE_SECRET_KEY=（~/.openclaw/.env から移動）
POSTIZ_API_KEY=（~/.openclaw/.env から移動）
POSTIZ_X_INTEGRATION_ID=（~/.openclaw/.env から移動）
```

### アプリ固有キー: `web-apps/YYYYMMDD-xxx/.env.local`（CC が自動生成）

```bash
STRIPE_PRICE_ID=price_xxx        # CC が US-002 で生成
NEXT_PUBLIC_URL=https://xxx      # CC が US-006 で生成
STRIPE_WEBHOOK_SECRET=whsec_xxx  # ダイスがデプロイ後に追加
```

ソース: [12-Factor App](https://12factor.net/config) / 引用: 「The twelve-factor app stores config in environment variables」

---

## 6. ゴミ削除

| # | ファイル | 内容 | アクション |
|---|---------|------|-----------|
| 1 | `~/.openclaw/.env` L226 | `# VERCEL_TOKEN=  # TODO:...` | 行削除 |
| 2 | `~/.config/mobileapp-builder/.env` | `# VERCEL_TOKEN=  # TODO:...` | 行削除 |
| 3 | `~/.openclaw/skills/webapp-factory-orchestrator/` | 旧スキル全体 | ディレクトリ削除 |
| 4 | `~/.claude/skills/mobileapp-builder/` | 古い版（daily-apps 参照11箇所） | ディレクトリ削除（プロジェクト内の新版が正） |

---

## 7. mobileapp-factory パス修正

| ファイル | 箇所 | 変更 |
|---------|------|------|
| `~/.openclaw/skills/mobileapp-factory/SKILL.md` L17 | `daily-apps/<name>/` | `mobile-apps/<name>/` |
| `~/.openclaw/skills/mobileapp-factory/SKILL.md` L20 | `daily-apps/$(date)` | `mobile-apps/$(date)` |
| `~/.openclaw/skills/mobileapp-factory/SKILL.md` L90 | `daily-apps/<date>-app` | `mobile-apps/<date>-app` |

---

## 8. cron 設定

| cron | スケジュール | スキル | 状態 |
|------|-------------|--------|------|
| mobileapp-factory-morning | 毎日 07:00 JST | mobileapp-factory | ✅ 既存 |
| **web-app-factory-daily** | **毎日 15:00 JST** | **web-app-factory-manager** | ⬜ 新規作成 |

---

## 9. TODO（実行順序）

| # | タスク | 依存 |
|---|--------|------|
| 1 | `web-apps/` `mobile-apps/` フォルダ作成 + 既存アプリ移動 | なし |
| 2 | `web-apps/.env` 作成（VERCEL_TOKEN + 共通キー） | 1 |
| 3 | CC スキル `.claude/skills/web-app-factory/` 作成（SKILL.md, CLAUDE.md.template, prd.json.template, ralph.sh） | 1 |
| 4 | Anicca スキル `~/.openclaw/skills/web-app-factory-manager/` 作成（SKILL.md） | 3 |
| 5 | 旧 `~/.openclaw/skills/webapp-factory-orchestrator/` 削除 | 4 |
| 6 | `~/.openclaw/skills/mobileapp-factory/SKILL.md` パス修正（3箇所） | 1 |
| 7 | `~/.claude/skills/mobileapp-builder/` 削除（古い版） | なし |
| 8 | `~/.openclaw/.env` VERCEL_TOKEN コメント行削除 | なし |
| 9 | `~/.config/mobileapp-builder/.env` VERCEL_TOKEN コメント行削除 | なし |
| 10 | ralph.sh に `--mcp-config ~/.claude/mcp.json` 追加（web + mobile 両方） | 3 |
| 11 | git push | 1-10 |
| 12 | web-app-factory-daily cron 作成（毎日 15:00 JST） | 4 |
| 13 | テスト cron で E2E 確認（後でタイミング決定） | 12 |
| 14 | デプロイ後 STRIPE_WEBHOOK_SECRET 登録 | 13 |

---

## 10. 受け入れ条件

| # | 条件 | 検証方法 |
|---|------|---------|
| AC1 | `web-apps/` フォルダが存在し Web アプリが入っている | `ls web-apps/` |
| AC2 | `mobile-apps/` フォルダが存在し iOS アプリが入っている | `ls mobile-apps/` |
| AC3 | `daily-apps/` が空 or 削除済み | `ls daily-apps/` |
| AC4 | `web-apps/.env` に VERCEL_TOKEN がある | `grep VERCEL_TOKEN web-apps/.env` |
| AC5 | `.claude/skills/web-app-factory/SKILL.md` が存在 | `ls .claude/skills/web-app-factory/` |
| AC6 | `~/.openclaw/skills/web-app-factory-manager/SKILL.md` が存在 | `ls` |
| AC7 | 旧 `webapp-factory-orchestrator/` が削除済み | `ls` で存在しない |
| AC8 | mobileapp-factory SKILL.md に `daily-apps` 参照がない | `grep daily-apps` |
| AC9 | ralph.sh に `--mcp-config` がある | `grep mcp-config ralph.sh` |
| AC10 | cron `web-app-factory-daily` が 15:00 JST で設定済み | cron jobs 確認 |

---

## 11. 境界（やらないこと）

| やらないこと | 理由 |
|------------|------|
| スキルのリネーム（mobileapp-factory → mobile-app-factory-manager 等） | Web 側を先に動かす。Mobile のリネームは別タスク |
| OSS 切り出し | E2E テスト完了後 |
| Turborepo / Nx 導入 | 今は不要。フォルダ分離だけで十分 |
