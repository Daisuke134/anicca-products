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

### 7.1) プロンプトの絶対ルール（SKILL 内）

**SKILL に書くプロンプトは、すべて「Anicca への命令」である。毎回同じ。**

- 主語は **「あなたが」** または **省略**（命令文で主語なし）。
- **禁止:** 「Anicca（VPS）が」「Anicca が」などの説明・便利な補足をプロンプトに書かない。自分用のメモ・学習はプロンプトに含めない。
- 例（app-nudge）: ❌ 「Anicca が誰に何を送るか決め…」 → ✅ 「あなたが、ユーザー一覧を見て誰に何を送るか決めよ。結果を workspace/nudges/decisions_YYYY-MM-DD.json に書け。」


---

## 8) VPS スキル配置（2箇所・実機確認 2026-02-14）

**重要:** スキルは **2 種類のパス** がある。更新するときはどちらをいじるか必ず確認する。

### A. メイン（OpenClaw がロードするスキル）

**パス:** `/home/anicca/.openclaw/skills/`  
**役割:** jobs.json や agent が参照するスキルはここ。**repo の `openclaw-skills/*` を scp/rsync する先はここ。**

一覧（直下のみ）:
```text
/home/anicca/.openclaw/skills/
├── anicca-auto-development
├── app-nudge-sender
├── appstore-review-responder
├── asc-build-lifecycle, asc-cli-usage, asc-id-resolver, asc-metadata-sync, asc-notarization
├── asc-ppp-pricing, asc-release-flow, asc-signing-setup, asc-submission-health
├── asc-testflight-orchestration, asc-xcode-build
├── autonomy-check
├── bird
├── codex-review
├── content-research-writer
├── copywriting
├── daily-memory
├── daily-metrics-reporter
├── flightclaw
├── gitclaw
├── github-task-queue
├── gog
├── hookpost-ttl-cleaner
├── mac-codex
├── master-marketing
├── mission-worker
├── moltbook-interact
├── newsletter-publisher
├── ops-heartbeat
├── proactive-agent
├── revenuecat
├── roundtable-initiative-generate
├── roundtable-memory-extract
├── roundtable-standup
├── slack-mention-handler
├── social-intelligence
├── social-scheduler-pro
├── sto-weekly-refresh
├── suffering-detector
├── swift-expert
├── swiftui-ui-patterns
├── systematic-debugging
├── tdd-discipline
├── tiktok-poster
├── trend-hunter
├── usdc-testnet-tx-checker
├── x402
├── x-poster
└── x-research
```

### B. ワークスペース用（別用途・少ない）

**パス:** `/home/anicca/.openclaw/workspace/skills/`  
**役割:** ここにあるのは **daily-metrics-reporter** と **reddit-cli** のみ（2026-02-14 時点）。**5am 日次レポートはメインの `~/.openclaw/skills/daily-metrics-reporter/` を参照する。** workspace の `daily-metrics-reporter` は冗長なので削除してよい。

**Workspace 整理（VPS 上で実行）:**  
VPS にログインしたら `rm -rf /home/anicca/.openclaw/workspace/skills/daily-metrics-reporter` を実行してよい。

### workspace フォルダ一式作成（VPS 上で実行）

**VPS にログインした状態で** 以下をそのまま実行する。ローカルから ssh で叩かず、VPS 上で実行する。

```bash
BASE=/home/anicca/.openclaw/workspace
mkdir -p "$BASE/ops/completed"
mkdir -p "$BASE/trends" "$BASE/hooks" "$BASE/nudges" "$BASE/suffering"
mkdir -p "$BASE/autonomy-check" "$BASE/hookpost-ttl-cleaner"
mkdir -p "$BASE/moltbook-monitor" "$BASE/moltbook-poster"
mkdir -p "$BASE/roundtable-standup" "$BASE/roundtable-memory-extract" "$BASE/roundtable-initiative-generate"
mkdir -p "$BASE/sto-weekly-refresh"
echo "{}" > "$BASE/ops/heartbeat_state.json"
echo "[]" > "$BASE/ops/proposals.json"
echo "[]" > "$BASE/ops/steps.json"
ls -la "$BASE"
ls -la "$BASE/ops"
```

メインのスキルは A にあり、**x-research / trend-hunter は A のパス。** SKILL 更新は必ず A に送る。

### 同期ルール

| やりたいこと | 送り先 |
|--------------|--------|
| repo `openclaw-skills/trend-hunter/SKILL.md` を反映 | `scp ... anicca@46.225.70.241:/home/anicca/.openclaw/skills/trend-hunter/SKILL.md` |
| repo `openclaw-skills/x-poster/SKILL.md` を反映 | `.../skills/x-poster/SKILL.md` |
| repo `openclaw-skills/x-research/SKILL.md` を反映 | `.../skills/x-research/SKILL.md`（**workspace/skills ではない**） |

### Hooks / Trends 保存先（VPS・2種類）

| 種類 | パス | 用途 |
|------|------|------|
| トレンド狩り結果のみ | `/home/anicca/.openclaw/workspace/trends/YYYY-MM-DD.json` | X/TikTok/Reddit から取ったトレンド＋pattern。投稿はしない。 |
| 投稿用 1 本 | `/home/anicca/.openclaw/workspace/hooks/YYYY-MM-DD.json` | Blotato に schedule する 1 本（slot 9am/9pm、X 文・TikTok caption＋画像 URL）。 |

**サブフォルダ方針:** 使わない。1 日 1 ファイルで `slot`（9am \| 9pm）と `platform`（x \| tiktok）で区別する。

---

## 8.5) Railway API を叩くスキル（VPS → API_BASE_URL）

Anicca（VPS）は **DB に直接繋がない。** Railway 上で動く API が DB を読む/書く。VPS のスキルは「API を叩く」だけなので、Anicca は Railway や DB のことを知らなくてよい。**API_BASE_URL に HTTP でリクエストする。**

以下のスキルが **Railway API（API_BASE_URL）を叩く**（SKILL または実装で明示）:

| スキル | 叩くエンドポイント例 |
|--------|------------------------|
| app-nudge-sender | POST .../api/admin/jobs/app-nudge-sender → 結果として /api/mobile/nudge/pending に enqueue |
| autonomy-check | POST .../api/admin/jobs/autonomy-check |
| hookpost-ttl-cleaner | POST .../api/admin/jobs/hookpost-ttl-cleaner |
| mission-worker | **Anicca 内の step キューを使用。** 読む: `workspace/ops/steps.json`。完了時: `workspace/ops/completed/YYYY-MM-DD.json` に追記。Railway の step API は使わない。 |
| moltbook-monitor | POST .../api/admin/jobs/moltbook-shadow-monitor |
| moltbook-poster | POST .../api/admin/jobs/moltbook-poster |
| ops-heartbeat | **Anicca 内に状態を保存。** 書く: `workspace/ops/heartbeat_state.json`, `workspace/ops/proposals.json`。Railway の heartbeat API は使わない。 |
| roundtable-standup | POST .../api/admin/roundtable/standup |
| roundtable-memory-extract | POST .../api/admin/roundtable/memory-extract |
| roundtable-initiative-generate | POST .../api/admin/roundtable/initiative-generate |
| sto-weekly-refresh | POST .../api/admin/jobs/sto-weekly-refresh |
| suffering-detector | POST .../api/admin/jobs/suffering-detector |
| trend-hunter | proposal/step 経路で API を叩く場合あり（保存は VPS ローカル JSON） |
| x-poster / tiktok-poster | step 実行が Railway 上で Blotato に投げるため、mission-worker 経由で API を叩く |

**Railway = アプリ用 nudge のみ（方針確定）:**  
トレンド・hook・投稿データは **VPS ローカルのみ**（trends/*.json, hooks/*.json）。Railway に送るのは **アプリ用 nudge**（`app-nudge-sender` → `/api/mobile/nudge/*`）と、ops  orchestration に必要な最小限（heartbeat, step claim 等）のみ。hook 候補の保存は **Railway DB に書かない。**

**iOS アプリ:** アプリは **Railway API だけ** 叩く（例: /api/mobile/nudge/pending, profile, entitlement）。DB は触らない。

---

## 8.5.5) Anicca が参照する API / DB のパス（フルパス）

Anicca（VPS）が Railway API や DB にアクセスするときに読む設定は **1 箇所だけ** に置く。

| 用途 | フルパス | 中身の例 |
|------|----------|----------|
| **API のベース URL とトークン** | **`/home/anicca/.openclaw/.env`** | `API_BASE_URL=https://anicca-proxy-production.up.railway.app`（本番）, `ANICCA_AGENT_TOKEN=...`, `INTERNAL_API_TOKEN=...` |
| **DB 接続（読むだけにする場合）** | 上記と同じ `.env` に追加 | `DATABASE_URL=postgresql://...`（Railway の接続文字列。本番/ステージングは別々のキーでよい） |

**ローカルで Anicca に渡す用にコピーする場合:**  
- ローカル: `/Users/cbns03/Downloads/anicca-project/.env`  
- ここに `API_BASE_URL` と `DATABASE_URL`（必要なら）を書いておき、`scripts/openclaw-vps/sync-env-to-vps.sh` で VPS の `/home/anicca/.openclaw/.env` に反映する。  
- Anicca が「ローカルでも見る」なら、同じ内容を **ローカルの .env** にも持てばよい（VPS と共有する必要はないが、値は揃える）。

**HTTP API の「どこに書いてあるか」:**  
- VPS 上: **`/home/anicca/.openclaw/.env`** の `API_BASE_URL`。  
- リポジトリ内の説明: **`.cursor/plans/reference/secrets.md`**（変数名と用途）。実値は `.env`（gitignore）。

---

## 8.5.6) 各スキルのデータ保存先（Anicca 内・パス一覧）

step キュー・heartbeat 状態・トレンド・hooks は **すべて VPS の Anicca 配下** に置く。Railway DB には step/proposal を書かない。cron で直接動くスキルはそれぞれ専用フォルダに結果を書く。

| スキル | 保存先（フルパス） | 内容 |
|--------|--------------------|------|
| **ops-heartbeat** | `/home/anicca/.openclaw/workspace/ops/heartbeat_state.json` | 直近の heartbeat 結果・状態 |
| **ops-heartbeat** | `/home/anicca/.openclaw/workspace/ops/proposals.json` | 提案一覧 |
| **mission-worker** | `/home/anicca/.openclaw/workspace/ops/steps.json` | 未実行 step キュー（読む・更新） |
| **mission-worker** | `/home/anicca/.openclaw/workspace/ops/completed/YYYY-MM-DD.json` | 完了した step の記録（日付別） |
| **trend-hunter** | `/home/anicca/.openclaw/workspace/trends/YYYY-MM-DD.json` | トレンド狩り結果のみ |
| **trend-hunter** | `/home/anicca/.openclaw/workspace/hooks/YYYY-MM-DD.json` | 投稿用 1 本（slot 9am/9pm） |
| **x-poster** | 読むだけ: `/home/anicca/.openclaw/workspace/hooks/YYYY-MM-DD.json`（slot 9am または 9pm） | 投稿文はここから取得。保存はしない。 |
| **tiktok-poster** | 同上 | caption と imageUrl をここから取得。 |
| **app-nudge-sender** | `/home/anicca/.openclaw/workspace/nudges/decisions_YYYY-MM-DD.json` | 誰に何を送るかの判断結果。送信は Railway API に依頼。 |
| **suffering-detector** | `/home/anicca/.openclaw/workspace/suffering/findings_YYYY-MM-DD.json` | 検知結果。 |
| **autonomy-check** | `/home/anicca/.openclaw/workspace/autonomy-check/audit_YYYY-MM-DD.json` | 監査ログ。 |
| **hookpost-ttl-cleaner** | `/home/anicca/.openclaw/workspace/hookpost-ttl-cleaner/run_YYYY-MM-DD.json` | 実行結果。 |
| **moltbook-monitor** | `/home/anicca/.openclaw/workspace/moltbook-monitor/run_YYYY-MM-DD.json` | Moltbook 監視結果。 |
| **moltbook-poster** | `/home/anicca/.openclaw/workspace/moltbook-poster/run_YYYY-MM-DD.json` | Moltbook 投稿結果。 |
| **roundtable-standup** | `/home/anicca/.openclaw/workspace/roundtable-standup/run_YYYY-MM-DD.json` | 朝会出力。 |
| **roundtable-memory-extract** | `/home/anicca/.openclaw/workspace/roundtable-memory-extract/run_YYYY-MM-DD.json` | メモリ抽出結果。 |
| **roundtable-initiative-generate** | `/home/anicca/.openclaw/workspace/roundtable-initiative-generate/run_YYYY-MM-DD.json` | イニシアチブ生成結果。 |
| **sto-weekly-refresh** | `/home/anicca/.openclaw/workspace/sto-weekly-refresh/run_YYYY-MM-DD.json` | 週次更新結果。 |

**ops 用フォルダ（Anicca 内）:**  
**`/home/anicca/.openclaw/workspace/ops/`**  
- ここに `heartbeat_state.json`, `proposals.json`, `steps.json` を置く。  
- `completed/` サブフォルダに日付別で完了 step を保存する。

---

## 8.5.7) TODO 一覧（step/heartbeat Anicca 内移行・trend-hunter 仕様）

| # | タスク | 状態 | 備考 |
|---|--------|------|------|
| 1 | openclaw-anicca.md に Anicca データパス・各スキル保存先・API/DB フルパスを追記 | ✅ 済 | 8.5.5, 8.5.6 |
| 2 | mission-worker SKILL.md を ops フォルダ読む/書くにパッチ | ✅ 済 | `openclaw-skills/mission-worker/SKILL.md` |
| 3 | ops-heartbeat SKILL.md を ops フォルダに状態保存するようにパッチ | ✅ 済 | `openclaw-skills/ops-heartbeat/SKILL.md` |
| 4 | trend-hunter SKILL.md を flow・postText 280 字・listStyle・プロンプト全文で更新 | ✅ 済 | `openclaw-skills/trend-hunter/SKILL.md` |
| 5 | x-poster / tiktok-poster SKILL.md に「保存先（読むだけ）」を追記 | ✅ 済 | hooks の slot 9am/9pm を参照 |
| 6 | VPS 上で `workspace/ops/` を作成し steps.json / heartbeat_state.json / proposals.json の初期化 | 未 | 実装時に実施 |
| 7 | mission-worker 実装を Railway step API ではなく ops/steps.json 読む・completed に書くに変更 | 未 | コード変更 |
| 8 | ops-heartbeat 実装を Railway heartbeat API ではなく ops に書くに変更 | 未 | コード変更 |

---

## 8.6) 12h トレンド→投稿サイクル（確定）

- **5am（trend-hunter-5am）:** payload で slot 9am・date 今日。メトリクス取得 → トレンド検索 → trends 保存 → 1 本選んで hooks に slot 9am で書く。9:00 の投稿は x-poster / tiktok-poster が hooks を読んで実行。
- **5pm（trend-hunter-5pm）:** payload で slot 9pm・date 今日。メトリクス取得 → トレンド検索 → trends 保存 → 1 本選んで hooks に slot 9pm で書く。21:00 の投稿は x-poster / tiktok-poster が hooks を読んで実行。
- 毎投稿ごとにメトリクス→学習するので closed loop が早く回る。**12h で 1 サイクル。**

---

## 8.7) 「そのまま投稿する内容」を JSON に持つ（TODO）

今の `hooks/YYYY-MM-DD.json` は hook 文＋メタのみ。**Blotato に schedule するには「そのまま貼る 1 ツイート」と「TikTok 用 caption＋画像 URL」が必要。**

| 変更対象 | パス / 内容 |
|----------|-------------|
| 出力スキーマ | `hooks/YYYY-MM-DD.json` の各要素に `tweetText`（X 用・260字以内の確定文）, `tiktokCaption`, `tiktokImageUrl`（公開 URL）を追加する。 |
| 誰が埋めるか | trend-hunter の後段、または「投稿準備」ステップで: (1) hook から **tweetText** を 1 本に確定 (2) TikTok 用 **画像を 1 枚生成**（FAL / Blotato Create Video 等）して URL を取得 (3) **tiktokCaption** を確定。 |
| 画像生成 | VPS で FAL または Blotato の Create Video/画像 API を叩き、1 枚の公開 URL を返す。その URL を `tiktokImageUrl` に書く。 |
| Blotato に渡す | 上記 JSON を読んで、`scheduledTime`（9:00 または 21:00 の ISO 8601）付きで POST https://backend.blotato.com/v2/posts を呼ぶ。X 用は content.text = tweetText、TikTok 用は content.text = tiktokCaption, mediaUrls = [tiktokImageUrl]。 |
| 実装場所候補 | (A) VPS の新スキル or trend-hunter 拡張で JSON に 3 フィールドを書き、同じく VPS から Blotato を直接叩く。(B) Railway に「scheduledTime + content を受け取って Blotato に渡す」API を追加し、VPS はその API を叩く。 |

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

---

## 11) VPS の .env パス（混乱防止）

| VPS パス | 用途 | 優先 |
|----------|------|------|
| `/home/anicca/.openclaw/.env` | OpenClaw / Anicca が読む | **これが正本** |
| `/home/anicca/.env` | systemd 等が読む場合あり | 同じ内容で揃える |
| `/home/anicca/.openclaw/workspace/.env` | 約 100 バイト・ほぼ空。**参照しない。** | 無視 |
| `/home/anicca/openclaw-docker/.env` | Docker 用（別用途） | 必要時のみ |

**結論:** Anicca が使うのは **`/home/anicca/.openclaw/.env`** のみ。Firecrawl / ReddAPI / Apify 等のキーはここに書く。MEMORY に「KEY あり」とあっても、このファイルにないと Anicca は読めない。**Firecrawl キーがないと報告される場合は、このファイルに `FIRECRAWL_API_KEY=...` を追加してから `scripts/openclaw-vps/sync-env-to-vps.sh` でローカルと揃える。**

## 11.5) ローカル .env → VPS .env の自動同期

**ルール:** ローカル `anicca-project/.env` を VPS の **正本 2 箇所** に同じ内容で置く。

| VPS パス | 用途 |
|----------|------|
| `/home/anicca/.openclaw/.env` | OpenClaw が読む（正本） |
| `/home/anicca/.env` | systemd 用 |

### 同期コマンド（プロジェクトルートで）

```bash
cd /Users/cbns03/Downloads/anicca-project && \
ssh anicca@46.225.70.241 "mkdir -p /home/anicca/.openclaw && cat > /home/anicca/.openclaw/.env" < .env && \
ssh anicca@46.225.70.241 "cat > /home/anicca/.env" < .env
```

**スクリプト:** プロジェクトルートで `./scripts/openclaw-vps/sync-env-to-vps.sh` を実行すると、ローカル `.env` が VPS の 2 箇所に上書きされる。

---

## 12) VPS スキル一覧（実機 2026-02-14）・redapi / Firecrawl

### スキルフォルダ（メインのみ。moltbook-monitor / moltbook-poster はフォルダ名ではない）

**パス:** `/home/anicca/.openclaw/skills/`  
**一覧:** anicca-auto-development, app-nudge-sender, appstore-review-responder, asc-*（複数）, autonomy-check, bird, codex-review, content-research-writer, copywriting, daily-memory, daily-metrics-reporter, flightclaw, gitclaw, github-task-queue, gog, hookpost-ttl-cleaner, mac-codex, master-marketing, mission-worker, moltbook-interact, newsletter-publisher, ops-heartbeat, proactive-agent, reddit-cli, revenuecat, roundtable-*, slack-mention-handler, social-intelligence, social-scheduler-pro, sto-weekly-refresh, suffering-detector, swift-expert, swiftui-ui-patterns, systematic-debugging, tdd-discipline, tiktok-poster, tiktok-scraper, trend-hunter, usdc-testnet-tx-checker, x402, x-poster, x-research.

**moltbook:** VPS に **moltbook-monitor / moltbook-poster というフォルダはない。** あるのは **moltbook-interact** のみ。監視・投稿の job はこのスキルを呼ぶ。

### redapi / Firecrawl / Apify

| 項目 | 状態 |
|------|------|
| Reddit | **REDDAPI_API_KEY**（reddapi.com）。VPS `~/.openclaw/.env` に設定。reddit-cli スキルで curl 使用。 |
| TikTok | **APIFY_API_TOKEN**。tiktok-scraper スキル（Apify clockworks~tiktok-scraper）。 |
| Firecrawl | **FIRECRAWL_API_KEY** を `~/.openclaw/.env` に書く。MEMORY にあっても ENV になければ Anicca は使えない。 |

---

## 12.5) trend-hunter：2 種類の JSON と実行順序（確定）

### 実行順序（必ずこの順）

1. **昨夜 21:00 投稿のメトリクス確認・学習**（先にやる）
2. トレンド検索（x-research, tiktok-scraper, reddit-cli の 3 スキル。web_search は使わない）
3. トレンドを `trends/YYYY-MM-DD.json` に保存
4. 候補から 9am 用 1 本を選び、`hooks/YYYY-MM-DD.json` に追記（X 文・TikTok caption＋画像 URL・reasons・slot）

### 出力 JSON その 1：トレンド狩り結果のみ（投稿しない）

**パス:** `~/.openclaw/workspace/trends/YYYY-MM-DD.json`

```json
{
  "date": "2026-02-14",
  "source": "trend-hunter",
  "trends": [
    {
      "id": "tr-001",
      "hook": "I tried meditating for 30 days and here's what happened to my anxiety",
      "source": "tiktok",
      "trendContext": "TikTok Meditation in Sleep Hours feature, doomscrolling 対策系が伸びている",
      "pattern": "[習慣] + [30日] → 試した → 結果が変わった",
      "category": "meditation",
      "platform": ["tiktok", "x"]
    },
    {
      "id": "tr-002",
      "hook": "10 minute guided meditation for beginners",
      "source": "reddit",
      "trendContext": "r/meditation で初心者向け短尺がトレンド",
      "pattern": "[時間] + [初心者向け] → 手軽さが売り",
      "category": "meditation",
      "platform": ["tiktok", "x"]
    }
  ]
}
```

- **source:** `"x"` | `"tiktok"` | `"reddit"`
- **pattern:** 再現用の短い型。例: `"[彼氏] + [疑い] → 一緒に試した → 反応が変わった"`

### 出力 JSON その 2：投稿用 1 本（Blotato に schedule する中身）

**パス:** `~/.openclaw/workspace/hooks/YYYY-MM-DD.json`

```json
{
  "date": "2026-02-14",
  "slot": "9am",
  "scheduledTime": "2026-02-14T09:00:00+09:00",
  "entries": [
    {
      "id": "hook-001",
      "platform": "x",
      "postText": "I tried meditating for 30 days. Here's what actually happened to my anxiety. (thread 1/3)",
      "reasons": ["30-day format は TikTok で伸びている", "anxiety は 13 ProblemType と直結"]
    },
    {
      "id": "hook-001",
      "platform": "tiktok",
      "caption": "30 days of meditation changed my anxiety. Here’s what happened. #meditation #mindfulness",
      "imageUrl": "https://example.com/gen/2026-02-14-9am.png",
      "reasons": ["同上"]
    }
  ]
}
```

- **slot:** `"9am"` | `"9pm"`
- **scheduledTime:** ISO 8601（Blotato に渡す時刻）
- **platform:** `"x"` は `postText` のみ。`"tiktok"` は `caption` + `imageUrl`（必須）。

### Blotato への schedule 方法（決定）

**別 cron / heartbeat で行う。** 同じ trend-hunter フローには含めない。

- 例: 8:55 と 20:55 に「当日 `hooks/YYYY-MM-DD.json` を読む」cron を実行。
- `slot === "9am"` かつ未送信なら 9:00 に Blotato に 1 本 schedule。
- `slot === "9pm"` かつ未送信なら 21:00 に 1 本 schedule。
- 実行後は「送信済み」フラグを付与するか、別ファイルに移す等で重複防止。

### データソース（3 スキルのみ・web_search 禁止）

| ソース | スキル | キー（VPS `~/.openclaw/.env`） |
|--------|--------|--------------------------------|
| X | x-research | X_BEARER_TOKEN |
| TikTok | tiktok-scraper（Apify） | APIFY_API_TOKEN |
| Reddit | reddit-cli（reddapi） | REDDAPI_API_KEY |

保存は **VPS ローカルのみ。** Railway DB には hook/trend を書かない。

---

## 13) トラブルシュート

| 症状 | 対処 |
|------|------|
| `timeout acquiring session store lock: .../sessions.json.lock` | VPS で gateway 停止 → ロックファイル削除 → gateway 再起動。手順: `scripts/openclaw-vps/VPSで叩く-セッションロック解除.md` または `vps-fix-session-lock.sh` |
| `Session file path must be within sessions directory`（ローカル Control UI） | 別マシン（VPS）の state をコピーした、または profile/state-dir の食い違いで `sessions.json` に別マシンの絶対パスが入っていると発生。**対処（公式どおり）:** gateway は `openclaw gateway` のみで起動（OPENCLAW_STATE_DIR を付けない）、`openclaw doctor` を実行、Control UI は `openclaw dashboard` または http://127.0.0.1:18789/ で開く。VPS の state でローカルを上書きしない。詳細: `scripts/openclaw-vps/local-control-ui-doc-fix.md` |

