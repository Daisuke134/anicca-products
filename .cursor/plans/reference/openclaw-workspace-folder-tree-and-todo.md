# OpenClaw Anicca: workspace フォルダツリーと TODO（やること一覧）

最終更新: 2026-02-14

---

## 0) プロンプトの絶対ルール（Anicca への命令）

**SKILL 内のプロンプトは、すべて「Anicca への命令」である。毎回同じ。**

| やること | 禁止 |
|----------|------|
| 主語は **「あなたが」** または **省略**（命令文で主語なし） | 「Anicca（VPS）が」「Anicca が」などの説明・便利な補足をプロンプトに書かない |
| 命令だけ書く | 自分用のメモ・学習・「こういう仕組みです」はプロンプトに含めない |

例: ❌ 「Anicca が誰に何を送るか決め、結果を workspace/nudges/... に書く」  
例: ✅ 「あなたが、Railway から取得したユーザー一覧を見て、この slot で送る nudge を 1 件ずつ決めよ。結果を workspace/nudges/decisions_YYYY-MM-DD.json に書け。」

---

## 1) 方針（ベストプラクティスに基づく決定）

- **フォルダは「タスク・ワークフローの名前空間」として使う**（Agentic AI のファイルシステム活用の一般的な整理）。
- **ops/** は **キューと運用状態だけ** に限定する。cron で直接動くジョブの「結果」は ops に詰めない。
- **cron で定期実行されるスキル**（autonomy-check, roundtable-*, moltbook-*, hookpost-ttl-cleaner, sto-weekly-refresh, suffering-detector）は **それぞれ専用フォルダ** を持ち、実行結果・ログをそのフォルダに書く。step 取得元は steps.json にしない（キューされる仕事ではないため）。
- **mission-worker がキューから取る step** だけが `ops/steps.json` と `ops/completed/` を使う（例: trend-hunter, x-poster, tiktok-poster）。

---

## 2) workspace フォルダツリー（フル）

```
/home/anicca/.openclaw/workspace/
├── ops/                                    # キュー・heartbeat・提案のみ
│   ├── steps.json                          # 未実行 step キュー（mission-worker が読む）
│   ├── heartbeat_state.json               # ops-heartbeat の状態
│   ├── proposals.json                      # 提案一覧
│   └── completed/                          # mission-worker が完了した step の記録
│       └── YYYY-MM-DD.json
│
├── trends/                                 # trend-hunter 出力（トレンドのみ）
│   └── YYYY-MM-DD.json
│
├── hooks/                                  # trend-hunter 出力（投稿用 1 本）
│   └── YYYY-MM-DD.json
│
├── nudges/                                 # app-nudge-sender 用（誰に何を送るか）
│   └── decisions_YYYY-MM-DD.json
│
├── suffering/                              # suffering-detector 用（検知結果）
│   └── findings_YYYY-MM-DD.json
│
├── autonomy-check/                         # autonomy-check 用（実行結果・監査）
│   └── audit_YYYY-MM-DD.json
│
├── hookpost-ttl-cleaner/                   # hookpost-ttl-cleaner 用
│   └── run_YYYY-MM-DD.json
│
├── moltbook-monitor/                       # moltbook-monitor 用（Moltbook 監視結果）
│   └── run_YYYY-MM-DD.json
│
├── moltbook-poster/                        # moltbook-poster 用（Moltbook 投稿結果）
│   └── run_YYYY-MM-DD.json
│
├── roundtable-standup/                     # roundtable-standup 用
│   └── run_YYYY-MM-DD.json
│
├── roundtable-memory-extract/              # roundtable-memory-extract 用
│   └── run_YYYY-MM-DD.json
│
├── roundtable-initiative-generate/         # roundtable-initiative-generate 用
│   └── run_YYYY-MM-DD.json
│
├── sto-weekly-refresh/                     # sto-weekly-refresh 用
│   └── run_YYYY-MM-DD.json
│
└── (x-poster / tiktok-poster は hooks/ を読むだけ。専用フォルダは持たない)
```

---

## 2.5) スキルフロー一覧（トリガー・動作・保存先・TODO 用）

| スキル | トリガー | 何をするか | どこで動く | 出力・保存先 |
|--------|----------|------------|------------|--------------|
| ops-heartbeat | cron 5分毎 | proposals / steps の評価、次にやる step の追加、stale 回復。heartbeat 状態と提案一覧を更新。 | VPS | ops/heartbeat_state.json, ops/proposals.json。steps.json に step を追加。 |
| mission-worker | cron 毎分 | steps.json から 1 件取り、stepKind に応じて trend-hunter / x-poster / tiktok-poster などを実行。完了したら steps から削除し completed に追記。 | VPS | ops/steps.json（読む・更新）, ops/completed/YYYY-MM-DD.json（書く）。 |
| trend-hunter | step または cron | 日本でトレンド検索 → trends/YYYY-MM-DD.json に保存 → 1 本選んで hooks/YYYY-MM-DD.json に postText・caption・imageUrl・imagePrompt を生成。 | VPS | trends/YYYY-MM-DD.json, hooks/YYYY-MM-DD.json。 |
| x-poster | step | 当日 hooks/YYYY-MM-DD.json の slot 9am または 9pm の postText を読んで X に投稿。 | VPS | 読むだけ: hooks/。 |
| tiktok-poster | step | 当日 hooks の slot 9am または 9pm の caption と imageUrl を読んで TikTok に投稿。 | VPS | 読むだけ: hooks/。 |
| app-nudge-sender | cron 9/14/20 時 | Railway からユーザー一覧取得 → 誰に何を送るか決める → nudges/decisions_YYYY-MM-DD.json に保存 → そのリストを Railway API に渡す → Railway が各ユーザーにアプリ nudge を配信。 | VPS（判断）＋ Railway（配信） | nudges/decisions_YYYY-MM-DD.json。ユーザーは Railway DB、送信は Railway API。 |
| autonomy-check | cron 毎日 3 時 | 規約違反・DLQ 滞留・失敗率をチェック。問題あれば Slack。結果を監査ログに書く。 | VPS | autonomy-check/audit_YYYY-MM-DD.json。 |
| hookpost-ttl-cleaner | cron | 古い hook の TTL 掃除。 | VPS | hookpost-ttl-cleaner/run_YYYY-MM-DD.json。 |
| moltbook-monitor | cron | Moltbook を監視（API/インターフェース使用）。 | VPS | moltbook-monitor/run_YYYY-MM-DD.json。 |
| moltbook-poster | cron | Moltbook に投稿。 | VPS | moltbook-poster/run_YYYY-MM-DD.json。 |
| roundtable-standup | cron | 朝会。学習・タスクの棚卸し。 | VPS | roundtable-standup/run_YYYY-MM-DD.json。 |
| roundtable-memory-extract | cron | メモリ抽出。 | VPS | roundtable-memory-extract/run_YYYY-MM-DD.json。 |
| roundtable-initiative-generate | cron | イニシアチブ生成。 | VPS | roundtable-initiative-generate/run_YYYY-MM-DD.json。 |
| sto-weekly-refresh | cron | 週次の投稿時間最適化更新。 | VPS | sto-weekly-refresh/run_YYYY-MM-DD.json。 |
| suffering-detector | cron | 苦しみ・危機検知。severity≥0.9 は SAFE-T + Slack。 | VPS | suffering/findings_YYYY-MM-DD.json。 |

---

## 3) 各スキルごとの保存先フルパスと SKILL.md の修正内容

| スキル | 保存先（フルパス） | SKILL.md に書く「保存先」セクション |
|--------|--------------------|--------------------------------------|
| **ops-heartbeat** | `.../workspace/ops/heartbeat_state.json`, `.../workspace/ops/proposals.json` | 既存の通り ops の 2 ファイル。 |
| **mission-worker** | 読む: `.../workspace/ops/steps.json`。書く: `.../workspace/ops/completed/YYYY-MM-DD.json` | 既存の通り。キューから取る step のみ。 |
| **trend-hunter** | `.../workspace/trends/YYYY-MM-DD.json`, `.../workspace/hooks/YYYY-MM-DD.json` | 既存の通り。 |
| **x-poster** | 読むだけ: `.../workspace/hooks/YYYY-MM-DD.json`（slot 9am/9pm） | 既存の通り。 |
| **tiktok-poster** | 読むだけ: 同上 | 既存の通り。 |
| **app-nudge-sender** | `.../workspace/nudges/decisions_YYYY-MM-DD.json` | 判断結果をこのパスに書く。 |
| **suffering-detector** | `.../workspace/suffering/findings_YYYY-MM-DD.json` | 検知結果をこのパスに書く。 |
| **autonomy-check** | `.../workspace/autonomy-check/audit_YYYY-MM-DD.json` | cron 実行結果・監査ログをこのパスに書く。steps.json は使わない。 |
| **hookpost-ttl-cleaner** | `.../workspace/hookpost-ttl-cleaner/run_YYYY-MM-DD.json` | 実行結果をこのパスに書く。 |
| **moltbook-monitor** | `.../workspace/moltbook-monitor/run_YYYY-MM-DD.json` | Moltbook 監視の結果をこのパスに書く。Moltbook の API/インターフェースを使用。 |
| **moltbook-poster** | `.../workspace/moltbook-poster/run_YYYY-MM-DD.json` | Moltbook 投稿の結果をこのパスに書く。 |
| **roundtable-standup** | `.../workspace/roundtable-standup/run_YYYY-MM-DD.json` | 朝会の出力をこのパスに書く。 |
| **roundtable-memory-extract** | `.../workspace/roundtable-memory-extract/run_YYYY-MM-DD.json` | 実行結果をこのパスに書く。 |
| **roundtable-initiative-generate** | `.../workspace/roundtable-initiative-generate/run_YYYY-MM-DD.json` | 実行結果をこのパスに書く。 |
| **sto-weekly-refresh** | `.../workspace/sto-weekly-refresh/run_YYYY-MM-DD.json` | 実行結果をこのパスに書く。 |

---

## 4) やること一覧（TODO）— MD に書いて忘れない

### 4.1) ドキュメント・SKILL の修正

| # | やること | 対象ファイル |
|---|----------|--------------|
| 1 | openclaw-anicca.md の 8.5.6 を「スキルごとフォルダ」に合わせて更新する。ops はキュー・heartbeat のみ。cron スキルは各 workspace/<skill>/ を記載。 | `.cursor/plans/reference/openclaw-anicca.md` |
| 2 | trend-hunter SKILL.md: プロンプト全文を「例は JSON の外・出力 JSON はプレースホルダーのみ」に統一。listStyle の JSON 内の「例: 完璧主義…」を削除。日本市場・日本語出力を前提に記載。 | `openclaw-skills/trend-hunter/SKILL.md` |
| 3 | autonomy-check SKILL.md: 保存先を `workspace/autonomy-check/audit_YYYY-MM-DD.json` に。実行は VPS 上。steps.json は使わない。 | `openclaw-skills/autonomy-check/SKILL.md` |
| 4 | hookpost-ttl-cleaner SKILL.md: 保存先を `workspace/hookpost-ttl-cleaner/run_YYYY-MM-DD.json` に。 | `openclaw-skills/hookpost-ttl-cleaner/SKILL.md` |
| 5 | moltbook-monitor SKILL.md: 保存先を `workspace/moltbook-monitor/run_YYYY-MM-DD.json` に。Moltbook のインターフェースを使用する旨を明記。 | `openclaw-skills/moltbook-monitor/SKILL.md` |
| 6 | moltbook-poster SKILL.md: 保存先を `workspace/moltbook-poster/run_YYYY-MM-DD.json` に。 | `openclaw-skills/moltbook-poster/SKILL.md` |
| 7 | roundtable-standup SKILL.md: 保存先を `workspace/roundtable-standup/run_YYYY-MM-DD.json` に。 | `openclaw-skills/roundtable-standup/SKILL.md` |
| 8 | roundtable-memory-extract SKILL.md: 保存先を `workspace/roundtable-memory-extract/run_YYYY-MM-DD.json` に。 | `openclaw-skills/roundtable-memory-extract/SKILL.md` |
| 9 | roundtable-initiative-generate SKILL.md: 保存先を `workspace/roundtable-initiative-generate/run_YYYY-MM-DD.json` に。 | `openclaw-skills/roundtable-initiative-generate/SKILL.md` |
| 10 | sto-weekly-refresh SKILL.md: 保存先を `workspace/sto-weekly-refresh/run_YYYY-MM-DD.json` に。 | `openclaw-skills/sto-weekly-refresh/SKILL.md` |
| 11 | suffering-detector SKILL.md: 保存先を `workspace/suffering/findings_YYYY-MM-DD.json` に。 | `openclaw-skills/suffering-detector/SKILL.md` |
| 12 | app-nudge-sender SKILL.md: 保存先を `workspace/nudges/decisions_YYYY-MM-DD.json` に。判断は Anicca 内で行う旨を追記。 | `openclaw-skills/app-nudge-sender/SKILL.md`（存在すれば） |

### 4.2) VPS 上での実施

| # | やること |
|---|----------|
| 13 | VPS で `workspace/ops/` を作成し、steps.json / heartbeat_state.json / proposals.json を初期化。ops/completed/ を作成。 |
| 14 | VPS で `workspace/autonomy-check/`, `workspace/hookpost-ttl-cleaner/`, `workspace/moltbook-monitor/`, `workspace/moltbook-poster/`, `workspace/roundtable-standup/`, `workspace/roundtable-memory-extract/`, `workspace/roundtable-initiative-generate/`, `workspace/sto-weekly-refresh/`, `workspace/suffering/`, `workspace/nudges/`, `workspace/trends/`, `workspace/hooks/` を作成（無い場合）。 |
| 15 | repo の SKILL.md を VPS の `~/.openclaw/skills/<name>/SKILL.md` に反映する。 |
| 16 | VPS の `~/.openclaw/.env` に API_BASE_URL, DATABASE_URL 等を揃える。 |

### 4.3) 実装の変更

| # | やること |
|---|----------|
| 17 | mission-worker 実装: ops/steps.json を読む・ops/completed/ に書く。step API は使わない。 |
| 18 | ops-heartbeat 実装: ops/heartbeat_state.json, ops/proposals.json に書く。heartbeat API は使わない。 |
| 19 | autonomy-check, hookpost-ttl-cleaner, moltbook-*, roundtable-*, sto-weekly-refresh, suffering-detector: cron で直接起動し、実行結果を各スキルの workspace/<skill>/ に書く。POST .../api/admin/jobs/... は呼ばない。 |

---

## 5) trend-hunter 用プロンプト全文（例は JSON の外・出力はプレースホルダーのみ）

- 日本市場向け。検索は日本でトレンドのものを。投稿・キャプション・画像テキスト・imagePrompt はすべて日本語で出力する。
- 例はプロンプト本文に「例（参考・JSON の外）」として書き、**出力する JSON の中身はプレースホルダーのみ**にする。
- listStyle の行は「例: 完璧主義…」を削除し、プレースホルダーのみにする。

---

## 5) trend-hunter 用プロンプト全文（例はプロンプト内・JSON の外 / 出力 JSON はプレースホルダーのみ）

**前提:** 日本市場向け。検索は日本でトレンドのものを用い、投稿・キャプション・画像テキスト・imagePrompt はすべて日本語で出力する。

---

### プロンプト 1: トレンド出力（trends/YYYY-MM-DD.json）

「X / TikTok / Reddit から取得したトレンド候補を、次の形式の JSON で **trends/YYYY-MM-DD.json** にまとめよ。日本市場向けのため、トレンド検索は日本でトレンドのものを用い、hook / trendContext / pattern / analysis は日本語で書く。投稿はまだ生成しない。」

**出力する JSON の形（このとおりのキーで、値はプレースホルダーとする）:**

```json
{
  "date": "YYYY-MM-DD",
  "source": "trend-hunter",
  "trends": [
    {
      "id": "tr-001",
      "hook": "（バズったそのままの文言）",
      "source": "x または tiktok または reddit",
      "trendContext": "（そのトレンドがどこで・なぜ起きているか 1〜2 文）",
      "pattern": "（再現用の短い型）",
      "category": "（カテゴリ）",
      "analysis": "（なぜバズったか）"
    }
  ]
}
```

**例（参考・JSON の外）:** 英語でバズった hook のトーンとして、「権威（セラピスト等）の一言を読者に渡す」形がある。例文: "My therapist taught me to interrupt my anxious thinking with thoughts like, 'What if things work out?' and 'What if all my hard work pays off?' So, I'm passing that on to you wherever you are, whatever you're leaving, or whomever you're becoming." 日本語のときは日本で伸びている文言をそのまま hook に書く。

---

### プロンプト 2: 投稿 1 本生成（hooks/YYYY-MM-DD.json）

「**保存済みの trends/YYYY-MM-DD.json** を見て、X 用 1 本と TikTok 用 1 本を生成し、**hooks/YYYY-MM-DD.json** 用の JSON を出せ。日本市場向けのため、postText・caption・imagePrompt はすべて日本語で出力する。」

**出力する JSON の形（値はプレースホルダーとする）:**

```json
{
  "date": "YYYY-MM-DD",
  "slot": "9am または 9pm",
  "scheduledTime": "（ISO 8601）",
  "entries": [
    {
      "id": "hook-001",
      "platform": "x",
      "postText": "（280字以内の実際にXに載せる1ツイート）",
      "reasons": ["（どの tr-xxx のどの pattern を参考にしたか）"]
    },
    {
      "id": "hook-001",
      "platform": "tiktok",
      "caption": "（最大2200文字。ハッシュタグ可）",
      "imageUrl": "（生成した画像の公開URL）",
      "imagePrompt": "（画像生成に使ったプロンプト。日本語）",
      "reasons": ["（どの tr-xxx を参考にしたか）"]
    }
  ],
  "listStyle": "（リスト型のタイトル）"
}
```

**例（参考・JSON の外）:**  
- postText: 1 ツイートで完結。スレッドにしない。  
- caption: リスト型なら「〇〇する４つの工夫」のようなタイトルを入れる。  
- listStyle の例: 完璧主義の苦しみを減らす４つの工夫、スマホ依存から抜け出す４つの方法、不安を和らげる４つの習慣。

---

### プロンプト 3: 画像 URL 生成

「**hooks 用に決めた caption と postText（と slot）** を入力とする。TikTok 用の 1 枚の画像を生成するプロンプト（画像生成 API 用）を日本語で書き、実行して得た公開画像 URL を返せ。そのプロンプト全文を hooks の **imagePrompt** に書く。」

---

## 6) Moltbook について

moltbook-monitor と moltbook-poster は、Moltbook のインターフェース（API / ダッシュボード等）を使用する。監視対象・投稿先は Moltbook 上で管理する。
