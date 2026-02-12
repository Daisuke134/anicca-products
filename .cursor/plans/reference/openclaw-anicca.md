# OpenClaw × Anicca 現在ステータス（SSOT）

最終更新: 2026-02-12 01:26 JST
対象: 1.6.2 最終E2E検証（実コマンド確認ベース）

---

## 1) いま何を目指しているか

Anicca 1.6.2 の運用目標は以下:

1. 苦しみを検知（suffering-detector）
2. 危機は SAFE-T で即中断（safe_t_interrupt）
3. 通常は最適チャネルへ届ける（App / X / TikTok / Moltbook）
4. 反応を記録し、次の打ち手を改善（closed-loop）

---

## 2) 実装/運用ステータス（2026-02-12時点）

| 領域 | ステータス | 根拠 |
|---|---|---|
| Crisis SAFE-T | ✅ 完了 | `safeTTriggered: true` を実確認 |
| ops-heartbeat | ⚠️ 部分障害 | Ops系で `undefined.findMany/findUnique/count` エラー |
| autonomy-check(dry_run) | ✅ 成功 | HTTP 200 確認 |
| app-nudge-sender | ⚠️ 設定不足 | `NUDGE_ALPHA_USER_ID is required` |
| X投稿系 | ✅ 投稿記録API動作 | `POST /api/admin/x/posts` 成功 |
| TikTok投稿系 | ✅ 投稿記録API動作 | `POST /api/admin/tiktok/posts` 成功 |
| Moltbook投稿 | ✅ 成功 | `moltbook-poster dry_run:false` 成功 |
| Moltbook返信生成 | ✅ 成功 | `platform:moltbook` / `optIn:true` / HTTP 200 |

---

## 3) 現在の主なブロッカー

### A. App通知
- 直接原因: `NUDGE_ALPHA_USER_ID` 未設定
- 影響: `app-nudge-sender` が `ok:false` のまま

### B. Ops閉ループ
- 症状: `/api/ops/proposal` が 500、heartbeatの一部ステップ失敗
- ログ: `Cannot read properties of undefined (reading findMany/findUnique/count)`
- 推定原因: Prisma Client と Opsモデル反映の不整合（再生成/再デプロイ要）

---

## 4) スキル一覧（目的と苦しみ軽減）

| スキル | 役割 | 苦しみ軽減への寄与 |
|---|---|---|
| suffering-detector | 苦しみ/危機を検知 | 早期検知で悪化を防ぐ |
| ops-heartbeat | 司令塔（トリガー/反応/実行/回復） | 継続介入の基盤 |
| mission-worker | step 実行 | 検知→行動に変換 |
| app-nudge-sender | iOS通知送信 | 最短導線で支援を届ける |
| x-poster | X投稿（返信禁止） | 認知拡大、アプリ導線 |
| tiktok-poster | TikTok投稿 | 若年層への接点拡大 |
| moltbook-monitor | Moltbook監視 | エージェント層の文脈把握 |
| moltbook-poster | Moltbook投稿 | AIエージェントへ知見共有 |
| roundtable-* | 学習・提案生成 | 改善速度向上 |
| autonomy-check | 健全性監視 | 事故予防 |

---

## 5) アカウント / リンク（確認用）

### Moltbook
- Agent username: **`anicca-wisdom`**
- Profile: https://www.moltbook.com/u/anicca-wisdom
- API profile (認証必要): `GET /api/v1/agents/profile?name=anicca-wisdom`

### X / TikTok
- 現在確認済みなのは「投稿記録API」の成功（DB記録）
- 公開URLはこの検証時点では未確定（実投稿IDベースのリンク生成工程が未完）

---

## 6) 次にやること（短期）

1. `NUDGE_ALPHA_USER_ID` 設定 → `app-nudge-sender` を `ok:true` 化
2. Ops系 Prisma 不整合修復（client再生成 + 再デプロイ）
3. `proposal → mission → step → event` を1本通して最終E2E証跡を確定

---

## 7) 重要ポリシー

- Xは **投稿のみ**（返信禁止）
- すべての運用報告先は **#metrics (C08RZ98SBUL)**
- E2E検証は実コマンド結果ベース（推測禁止）


---

## 8) Skillsフォルダ構成（Tree）

### OpenClaw 同梱スキル（VPS）
```text
/usr/lib/node_modules/openclaw/skills/
├── clawhub/
├── coding-agent/
├── github/
├── healthcheck/
├── openai-image-gen/
├── openai-whisper-api/
├── session-logs/
├── skill-creator/
├── slack/
├── tmux/
└── weather/
```

### ユーザー追加スキル（VPS workspace）
```text
/home/anicca/.openclaw/workspace/skills/
├── appstore-review-responder/
├── content-research-writer/
├── daily-metrics-reporter/
├── gitclaw/
├── mac-codex/
├── newsletter-publisher/
└── x-research/
```

### Macローカル参照先（今回更新対象リポジトリ）
```text
/Users/cbns03/Downloads/anicca-project/.cursor/skills/
└── (local skill docs / review specs)
```

---

## 9) 現在の「実運用で使っている」主要スキルと用途

| スキル | 使い方（現在） |
|---|---|
| suffering-detector | crisis/suffering検知、SAFE-T分岐 |
| ops-heartbeat | 提案評価・反応処理・step実行・stale回復 |
| mission-worker | step実行ワーカー |
| app-nudge-sender | iOS通知送信（現在は NUDGE_ALPHA_USER_ID が必要） |
| x-poster | X投稿フロー（運用ポリシー: reply禁止） |
| tiktok-poster | TikTok投稿フロー |
| moltbook-monitor | Moltbookの苦しみ監視 |
| moltbook-poster | Moltbook投稿（proactive） |
| roundtable-standup | 朝会・学習ループ |
| hookpost-ttl-cleaner | 古いhook/投稿のTTL掃除 |
| sto-weekly-refresh | 週次の投稿時間最適化更新 |
| autonomy-check | 毎日の健全性点検 |


---

## 10) Live Proof Links（2026-02-12）

### Moltbook
- Profile: https://www.moltbook.com/u/anicca-wisdom
- Post: https://www.moltbook.com/post/8fb71783-460f-46b7-b5a1-ed0584f520a2
- Comment #1 ID: `8c8c32a6-4c3c-4850-a41e-bb9e802905be`
- Reply-to-comment ID: `430c73ec-1b0a-472c-959c-4faa30fa866c`

### X (Blotato)
- Account (from env): `BLOTATO_ACCOUNT_ID_EN=11852`
- Submission ID: `67225bfb-517c-406d-b60f-732f3a8eab57`
- Public URL: https://x.com/AniccaNudges/status/2021624561423323319

### TikTok
- 現状: 投稿未完（link未発行）
- 失敗理由: Blotato v2 が target に以下必須項目を要求
  - `privacyLevel`
  - `disabledComments`
  - `disabledDuet`
  - `disabledStitch`
  - `isBrandedContent`
  - `isYourBrand`
  - `isAiGenerated`
- 追加で TikTok 投稿仕様（動画/メディア要件含む）を満たす実装が必要

