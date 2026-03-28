# Spec: ReelFarm TikTok Factory — Closed-Loop Slideshow Automation

**Status:** LIVE — LOOP A/B cron稼働中、EN4/JP4 automation作成済み
**Date:** 2026-03-29（初版 2026-03-28）
**Branch:** dev (実装時)
**Author:** Claude Code + ダイス

---

## 概要

ReelFarm API を使った TikTok スライドショー自動化システム。2つのクローズドループで自律運用する。

```
┌───────────────────────────────────────────────────────────────┐
│                    REELFARM AUTOMATIONS                        │
│  ┌─────────┐ ┌─────────┐ ┌─────────┐         ┌─────────┐    │
│  │ AUTO #1 │ │ AUTO #2 │ │ AUTO #3 │  ...    │ AUTO #N │    │
│  │ EN      │ │ JP      │ │ ES      │         │ (増殖)  │    │
│  └────┬────┘ └────┬────┘ └────┬────┘         └────┬────┘    │
│       └───────────┴───────────┴────────┬──────────┘          │
│                                        │                      │
│                    投稿 → メトリクス蓄積                        │
└────────────────────────┬──────────────────────────────────────┘
                         │
          ┌──────────────┴──────────────┐
          ▼                              ▼
┌──────────────────┐         ┌──────────────────────┐
│ LOOP A: 内部改善  │         │ LOOP B: 外部探索      │
│ (毎日 04:00 JST)  │         │ (毎週日曜 04:30 JST)  │
│                  │         │                      │
│ GET /videos      │         │ GET /library         │
│ → 分析           │         │ → バイラル発見         │
│ → PATCH hooks    │         │ → GET /pinterest     │
│ → PATCH style    │         │ → POST /automations  │
│ → Slack報告      │         │ → Slack報告           │
└──────────────────┘         └──────────────────────┘
```

---

## 確定事項

| 項目 | 値 |
|------|-----|
| API Base | `https://reel.farm/api/v1` |
| API Key | `rf_DgLHPO6BylVQ8wS_oqMnhrAgLqee3cuvbnQl1S_wTL8` |
| プラン | Max Plan（150 automations、無制限生成） |
| スキル場所 | `~/.openclaw/skills/reelfarm/SKILL.md` |
| TikTok EN4 | `anicca.en4` ID: `-000CIIeSXrsgxpeDbThsltKCF-cmnjMbw_h` ✅接続済み |
| TikTok JP4 | `anicca.jp4` ID: `-000_iUw_TD236YemHot7I_hYLpIdZ39KMOA` ✅接続済み |
| クレジット残 | 9,803（Unlimited Plan、毎月リセット） |
| 接続済みアカウント | **13アカウント**（en4,en5,en7,en,jp3,jp4,jp5,jp6,jp,es,anicca57,honnejp,honnejp1） |
| アクティブautomation | **7個**（EN: 3, JP: 3, ES: 1） |
| paused automation | **10個**（再利用可能） |
| cron TZ | ReelFarm側は **PST**。OpenClaw側は **Asia/Tokyo** |
| 投稿頻度 | 各アカウント2回/日 → 計4投稿/日（初期） |
| TikTok制限 | 6投稿/アカウント/24時間（API制限） |

---

## TikTokアカウントマッピング（API検証済み 2026-03-28）

### ReelFarm接続済み全13アカウント

| アカウント | TikTok ID | 言語 | ReelFarm Automation | 状態 |
|-----------|-----------|------|--------------------|----|
| **anicca.en4** | `-000CIIe...` | EN | Mindset Shifts / Healing | paused |
| **anicca.jp4** | `-000_iUw...` | JP | INFJ Lists | paused |
| anicca.en5 | `-0003Vxz...` | EN | Hustle Motivational | paused |
| anicca.jp5 | `-0005epV...` | JP | anicca ja 2 | **active** |
| anicca.en7 | `-0006iUv...` | EN | Hustle Motivational | paused |
| anicca.en | `-000cCZg...` | EN | **Anicca en 1** | **active** |
| anicca57 | `-000A4Mi...` | EN | **anicca en 2** | **active** |
| anicca.jp3 | `-0006sZ5...` | JP | デイリーダンマ | **active** |
| anicca.jp | `-000j-QZ...` | JP | **anicca ja 1** | **active** |
| aniccajp6 | `-000VsH2...` | JP | anicca ja 3 + Woman Rel | paused |
| anicca.es | `-000WjeH...` | ES | **Anicca** | **active** |
| honnejp1 | `-000TJCX...` | JP | **本音翻訳** | **active** |
| honnejp | `-000RuG1...` | JP | -- | -- |

### アクティブ Automation 一覧（LOOP Aが毎日イテレート）

| Automation ID | タイトル | アカウント | フック数 | cron(PST) |
|--------------|---------|-----------|---------|-----------|
| `3143be7b` | Anicca en 1 | anicca.en | 15 | 04,16,22時 |
| `4a7912e1` | anicca en 2 | anicca57 | 10 | 05,16,23時 |
| `c64a09f6` | Anicca (ES) | anicca.es | 23 | 04,16,20時 |
| `b91325c4` | anicca ja 2 | anicca.jp5 | 6 | 04,16,22時 |
| `3400d885` | anicca ja 1 | anicca.jp | 6 | 04,16,22時 |
| `a17b9467` | デイリーダンマ | anicca.jp3 | 5 | 04,16,20時 |
| `37e26301` | 本音翻訳 | honnejp1 | 6 | 04,17,21時 |

### API検証結果（2026-03-28 テスト済み）

| テスト | 結果 | データ |
|--------|------|--------|
| `GET /account` | ✅ | 9,803クレジット、Unlimited |
| `GET /tiktok/accounts` | ✅ | 13アカウント |
| `GET /automations` | ✅ | 17 automation（7 active） |
| `GET /tiktok/posts` (anicca.en 30日) | ✅ | 120K views, 1K likes, 20投稿 |
| `GET /library/niches` | ✅ | 59ニッチ（self improvement: 157profiles） |
| `GET /library?niche=spirituality` | ✅ | @slideofreality: 29.9M views |
| `GET /pinterest/search` | ✅ | 16画像取得 |

### メトリクス分析例（anicca.en 30日）

**TOP（維持すべきフック）:**

| Views | Likes | フック |
|-------|-------|-------|
| 47,963 | 187 | Nobody Talks About How Exhausting It Is To Live In Your Own... |
| 26,872 | 67 | You're Not Overthinking. Your Nervous System Is Stuck In... |

**パターン:** 「感情に訴える2人称の共感フレーズ」が圧倒的に強い

**BOTTOM（差し替え対象）:**

| Views | Likes | フック |
|-------|-------|-------|
| ~950 | ~15 | 4 Ways to Stop/Begin/Soften/Move... |

**パターン:** 「4 Ways to...」のリスト形式が弱い。差し替え推奨

---

## 初期Automation設定

### anicca.en4 用 Automation

```json
{
  "tiktok_account_id": "{{EN4_TIKTOK_ACCOUNT_ID}}",
  "schedule": [
    { "cron": "0 15 * * 1-5" },
    { "cron": "0 19 * * 1-5" }
  ],
  "title": "Anicca EN - Mindfulness & Productivity Slideshows",
  "slideshow_hooks": [
    "5 things I stopped doing that changed my mental health forever",
    "why your morning routine is making you more anxious",
    "the lie about productivity that keeps you stuck",
    "I tried meditating for 30 days and here's what actually happened",
    "signs you're burned out and don't even realize it",
    "how I finally broke the cycle of overthinking everything",
    "3 tiny habits that actually made me happier (not what you think)",
    "the truth about self-improvement nobody talks about",
    "why discipline is a scam (and what actually works)",
    "I deleted social media for a week — here's what I learned",
    "things I wish I knew in my 20s about mental health",
    "the 2-minute rule that changed how I deal with anxiety",
    "stop trying to be positive all the time. here's why",
    "your brain is lying to you. here's the proof",
    "the real reason you can't focus (it's not your phone)",
    "how i stopped procrastinating without willpower",
    "5 signs you're actually growing as a person",
    "the morning habit that ended my anxiety spiral"
  ],
  "style": "I want EXACTLY 6 slides (NO MORE THAN 6 TOTAL SLIDES). The first slide should have 1 text item in EXTRA LARGE font size, all lowercase, outline text style, centered on the slide. All other slides (2-6) should have 2 text items: first text item is a short heading (3-5 words) in MEDIUM font size, second text item is supporting text (8-12 words) in SMALL font size. ALL TEXT SHOULD BE LOWERCASE. ALL TEXT ITEMS SHOULD BE OUTLINE TEXT STYLE AND ON THE TOP 1/3RD OF THE SLIDE. 80% width for all text items. Written in a motivational yet conversational tone using FIRST person 'I' perspective. Write at a 7th grade reading level. Use short, punchy sentences that feel authentic and conversational. The tone should feel like advice from a friend, not a self-help guru.",
  "narrative": "Create content about mindfulness, mental health, and personal growth. The content should resonate with people aged 18-35 who are dealing with anxiety, burnout, overthinking, and the pressure of modern life. Focus on practical, actionable advice rather than vague positivity.",
  "language": "English",
  "num_of_slides": 6
}
```

**cron解説（PST）:**
- `0 15 * * 1-5` = 3PM PST = **08:00 JST** = 5PM EST（US東海岸ゴールデン開始）
- `0 19 * * 1-5` = 7PM PST = **12:00 JST** = 9PM EST（US全域ピーク）

### anicca.jp4 用 Automation

```json
{
  "tiktok_account_id": "{{JP4_TIKTOK_ACCOUNT_ID}}",
  "schedule": [
    { "cron": "0 0 * * 1-5" },
    { "cron": "0 3 * * 1-5" }
  ],
  "title": "Anicca JP - マインドフルネス・自己成長スライドショー",
  "slideshow_hooks": [
    "メンタルが壊れる前に気づくべき5つのサイン",
    "「頑張れ」が逆効果な理由を科学的に説明する",
    "朝の不安を30秒で消す方法を見つけた",
    "完璧主義をやめたら人生が楽になった話",
    "先延ばし癖を直すのに意志力はいらなかった",
    "考えすぎて動けない人に伝えたい3つのこと",
    "瞑想を30日続けて分かったリアルな変化",
    "「自分を変えたい」と思ってる人が最初にやるべきこと",
    "メンタルが強い人が絶対にやらない習慣",
    "毎日5分のこの習慣で不安が激減した",
    "自己肯定感が低い人の共通点と抜け出し方",
    "スマホ依存をやめたら起きた5つの変化",
    "「もう無理」と思った時に効く思考法",
    "朝活より大事な夜の3つの習慣",
    "なぜあなたは集中できないのか（原因は意外なところにある）",
    "人間関係のストレスを一瞬で軽くする考え方",
    "心が疲れた時にやるべきたった1つのこと"
  ],
  "style": "スライドは必ず6枚（6枚を超えない）。1枚目は1つのテキストアイテム、EXTRA LARGEフォントサイズ、すべて小文字のoutlineテキストスタイル、スライド中央配置。2-6枚目は2つのテキストアイテム：1つ目は見出し（3-5語）MEDIUMフォントサイズ、2つ目は説明文（8-12語）SMALLフォントサイズ。全テキストoutlineスタイル、スライド上部1/3配置。幅80%。語り口は親しみやすく、友達に話すような1人称。中学生でも読める平易な日本語。短い文で、リズム感のある表現。",
  "narrative": "マインドフルネス、メンタルヘルス、自己成長についてのコンテンツ。18-35歳の不安、バーンアウト、考えすぎ、現代社会のプレッシャーに悩む人に響く内容。漠然としたポジティブさではなく、実践的で具体的なアドバイスを重視。",
  "language": "Japanese",
  "num_of_slides": 6
}
```

**cron解説（PST）:**
- `0 0 * * 1-5` = 12AM PST = **17:00 JST**（JPゴールデン開始）
- `0 3 * * 1-5` = 3AM PST = **20:00 JST**（JP夜ピーク）

---

## Gateway衝突回避マップ

```
時刻JST ┃ 既存cron                        ┃ ReelFarm(RF側実行)  ┃ RF OpenClaw cron
━━━━━━━┿━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━┿━━━━━━━━━━━━━━━━━━━━┿━━━━━━━━━━━━━━━━
03:00   │ ttl-cleaner, autonomy           │                    │
04:00   │ (空き)                           │                    │ ← LOOP A 内部改善
04:30   │ (空き)                           │                    │ ← LOOP B 外部探索(日曜)
05:00   │ trend-hunter                    │                    │
08:00   │ mau-tiktok-ja                   │ EN-1投稿            │
08:15   │ mau-tiktok-en                   │                    │
09:00   │ x/tt-poster, nudge, standup(4)  │                    │
12:00   │ reelclaw-ja-1                   │ EN-2投稿            │
14:00   │ app-nudge-afternoon             │                    │
17:00   │ trend-hunter, mau-ja            │ JP-1投稿            │
20:00   │ app-nudge-evening               │ JP-2投稿            │
21:00   │ x/tt-poster, reelclaw(2)        │                    │
23:00   │ daily-memory, moltbook          │                    │
```

**結論:** LOOP A/Bは04:00/04:30 JST。Gateway空き時間帯。安全。

---

## LOOP A: 内部メトリクス改善（reelfarmスキルへのパッチ）

### 概要

既存reelfarmスキルにセクションを追加。別スキル不要。

**cron:** 毎日 04:00 JST（`0 19 * * *` UTC / `0 11 * * *` PST）
**jobs.json id:** `reelfarm-metrics-loop`

### 実行フロー

```
Step 1: 各アカウントのメトリクス取得
  GET /api/v1/tiktok/posts?tiktok_account_id={id}&timeframe=3&sort=views
  → 直近3日の全投稿のview/like/comment/share/bookmark取得

Step 2: パフォーマンス分析
  上位20%のフックを特定（view_count + like_count でスコアリング）
  下位20%のフックを特定
  パターン抽出: どの感情/構造/トーンが効いているか

Step 3: Automation更新
  PATCH /api/v1/automations/{id}
  {
    "slideshow_hooks": [上位フック維持 + 下位フック差し替え + 新フック追加]
  }
  ※ style は週1回のみ変更（頻繁な変更は逆効果）

Step 4: Slack報告
  POST to #metrics:
  📊 ReelFarm Daily Metrics Report
  - EN: {top_hook} (views: X, likes: Y)
  - JP: {top_hook} (views: X, likes: Y)
  - Updated: {N} hooks replaced
  - Next: {action}

Step 5: ログ保存
  ~/.openclaw/workspace/reelfarm/metrics/YYYY-MM-DD.json
```

### SKILL.mdへのパッチ内容

```markdown
## Cron Mode: Daily Metrics Iteration (LOOP A)

When invoked by cron `reelfarm-metrics-loop`, execute this flow:

### 環境変数
- REELFARM_API_KEY: rf_DgLHPO6BylVQ8wS_oqMnhrAgLqee3cuvbnQl1S_wTL8
- REELFARM_EN_AUTOMATION_ID: (作成後に埋める)
- REELFARM_JP_AUTOMATION_ID: (作成後に埋める)
- REELFARM_EN_TIKTOK_ID: (接続後に埋める)
- REELFARM_JP_TIKTOK_ID: (接続後に埋める)

### 実行手順

1. GET /api/v1/tiktok/posts?tiktok_account_id={EN_ID}&timeframe=3&sort=views
2. GET /api/v1/tiktok/posts?tiktok_account_id={JP_ID}&timeframe=3&sort=views
3. 各アカウントの上位20%フックと下位20%フックを特定
4. GET /api/v1/automations/{EN_AUTOMATION_ID} で現在のhooksを取得
5. GET /api/v1/automations/{JP_AUTOMATION_ID} で現在のhooksを取得
6. 下位フックを削除し、上位フックのパターンに基づく新フックを生成
7. PATCH /api/v1/automations/{id} で hooks を更新
8. 結果をSlack #metrics に報告
9. ~/.openclaw/workspace/reelfarm/metrics/YYYY-MM-DD.json に保存
```

---

## LOOP B: 外部ライブラリ探索 & 新Automation作成

### 概要

ReelFarmライブラリから実際にバズっているスライドショーを発見し、それを模倣した新automationを作成。

**cron:** 毎週日曜 04:30 JST（`0 19 * * 0` UTC）
**jobs.json id:** `reelfarm-library-loop`

### 実行フロー

```
Step 1: ニッチ検索
  GET /api/v1/library/niches → 関連ニッチ一覧取得
  関連ニッチ: spirituality, self-improvement, mental health, mindfulness,
              affirmation, meditation, productivity, wellness

Step 2: バイラルスライドショー発見
  各ニッチで:
  GET /api/v1/library?niche={niche}
  → プロフィールごとのスライドショーをviews/likesでソート
  → 上位3件のスライドショー構造を分析:
     - スライド枚数
     - テキストスタイル
     - 画像の雰囲気
     - フックのパターン

Step 3: Pinterest画像検索
  バイラルスライドショーの画像テーマに基づいて:
  GET /api/v1/pinterest/search?q={aesthetic+keyword}
  → 最適な画像URLを収集

Step 4: 新Automation作成
  POST /api/v1/automations
  {
    "tiktok_account_id": "{対象アカウント}",
    "schedule": [{ "cron": "適切な時間" }],
    "title": "Auto-{ニッチ}-{日付}",
    "slideshow_hooks": [バイラルから模倣したフック],
    "style": [バイラルから模倣したスタイル],
    "language": "{EN or JP}",
    "num_of_slides": {バイラルと同じ枚数}
  }

Step 5: Slack報告
  📡 ReelFarm Weekly Library Report
  - Niches scanned: {N}
  - Viral slideshows found: {N}
  - New automations created: {N}
  - Accounts: {list}

Step 6: ログ保存
  ~/.openclaw/workspace/reelfarm/library/YYYY-MM-DD.json
```

### 制約

| 制約 | 値 | 理由 |
|------|-----|------|
| 新automation数/週 | 最大2個 | 品質重視、クレジット節約 |
| 既存automationの最大数 | 20個 | 管理可能な範囲 |
| 同一アカウントへの投稿上限 | 6回/日 | TikTok API制限 |
| 投稿スケジュール | 既存cronと30分以上空ける | Gateway衝突回避 |

---

## TikTokアカウント作成 & ウォームアップ（スケーリング用）

### 問題

9,000投稿/月 = 300投稿/日 = 50アカウント必要（6投稿/アカウント/日）。
現在2アカウント。段階的にスケールする。

### Phase 1: 手動（今〜2週間）

| ステップ | 誰が | やること |
|---------|------|---------|
| 1. アカウント作成 | ダイス | Gmail作成 → TikTok登録 |
| 2. プロフィール設定 | ダイス | ニッチに合うプロフ画像・バイオ設定 |
| 3. ウォームアップ | ダイス | 5-7日間FYPスクロール（5-20分/日） |
| 4. ReelFarm接続 | ダイス | Settings → Connected Accounts → OAuth |
| 5. ドラフトモード | Anicca | 最初7日はDRAFT投稿（ダイスが手動パブリッシュ） |
| 6. 直接投稿切替 | Anicca | ウォームアップ完了後DIRECT_POSTに切替 |

### Phase 2: 半自動（2週間後〜）

ウォームアップ期間のドラフト管理をAniccaが自動監視:
- 毎日チェック: `GET /api/v1/videos?status=completed` でドラフト確認
- ウォームアップ完了アカウントを自動でDIRECT_POSTに切替

### Phase 3: 完全自動（将来 — Web App化時）

Web App (aniccaai.com/factory) でユーザーのTikTok OAuthを受け取り、
自動でautomation作成 → ドラフト投稿 → ウォームアップ完了判定 → 直接投稿。

---

## jobs.json 追加エントリ

### LOOP A: reelfarm-metrics-loop

```json
{
  "id": "reelfarm-metrics-loop",
  "agentId": "anicca",
  "jobId": "reelfarm-metrics-loop",
  "name": "reelfarm-metrics-loop",
  "schedule": {
    "kind": "cron",
    "expr": "0 4 * * *",
    "tz": "Asia/Tokyo"
  },
  "sessionTarget": "isolated",
  "wakeMode": "now",
  "payload": {
    "kind": "agentTurn",
    "message": "Execute reelfarm skill in LOOP A mode (Daily Metrics Iteration). Read ~/.openclaw/skills/reelfarm/SKILL.md and follow the 'Cron Mode: Daily Metrics Iteration' section. Use API key from env REELFARM_API_KEY. For each TikTok account (EN and JP), fetch 3-day metrics, analyze top/bottom hooks, update automation hooks via PATCH. Save results to ~/.openclaw/workspace/reelfarm/metrics/YYYY-MM-DD.json. CRITICAL: Post summary to Slack #metrics (C091G3PKHL2). This is MANDATORY."
  },
  "delivery": {
    "mode": "announce",
    "channel": "slack",
    "to": "channel:C091G3PKHL2"
  },
  "enabled": true
}
```

### LOOP B: reelfarm-library-loop

```json
{
  "id": "reelfarm-library-loop",
  "agentId": "anicca",
  "jobId": "reelfarm-library-loop",
  "name": "reelfarm-library-loop",
  "schedule": {
    "kind": "cron",
    "expr": "30 4 * * 0",
    "tz": "Asia/Tokyo"
  },
  "sessionTarget": "isolated",
  "wakeMode": "now",
  "payload": {
    "kind": "agentTurn",
    "message": "Execute reelfarm skill in LOOP B mode (Weekly Library Exploration). Read ~/.openclaw/skills/reelfarm/SKILL.md and follow the 'Cron Mode: Weekly Library Exploration' section. Use API key from env REELFARM_API_KEY. Search ReelFarm library for viral slideshows in related niches (spirituality, self-improvement, mental health, mindfulness, affirmation). For top viral formats found, search Pinterest for matching images. Create max 2 new automations for underserved niches. Save results to ~/.openclaw/workspace/reelfarm/library/YYYY-MM-DD.json. CRITICAL: Post summary to Slack #metrics (C091G3PKHL2). This is MANDATORY."
  },
  "delivery": {
    "mode": "announce",
    "channel": "slack",
    "to": "channel:C091G3PKHL2"
  },
  "enabled": true
}
```

---

## ReelFarm SKILL.md パッチ計画

既存スキルに以下のセクションを追加（別スキル作成不要）:

### パッチ1: Cron Mode: Daily Metrics Iteration (LOOP A)

```diff
+ ## Cron Mode: Daily Metrics Iteration (LOOP A)
+
+ Triggered by cron `reelfarm-metrics-loop` daily at 04:00 JST.
+
+ ### 手順
+ 1. GET /api/v1/account — クレジット残高確認
+ 2. 各TikTokアカウントのメトリクス取得:
+    GET /api/v1/tiktok/posts?tiktok_account_id={id}&timeframe=3&sort=views
+ 3. エンゲージメントスコア算出:
+    score = views * 0.4 + likes * 0.3 + comments * 0.2 + shares * 0.1
+ 4. 上位20%と下位20%のフックを特定
+ 5. 各automationの現在のhooksを取得:
+    GET /api/v1/automations/{id}
+ 6. 下位フックを削除、上位パターンから新フック生成
+ 7. hooks更新:
+    PATCH /api/v1/automations/{id} { "slideshow_hooks": [...] }
+ 8. 結果を ~/.openclaw/workspace/reelfarm/metrics/YYYY-MM-DD.json に保存
+ 9. Slack #metrics (C091G3PKHL2) に報告
```

### パッチ2: Cron Mode: Weekly Library Exploration (LOOP B)

```diff
+ ## Cron Mode: Weekly Library Exploration (LOOP B)
+
+ Triggered by cron `reelfarm-library-loop` every Sunday at 04:30 JST.
+
+ ### 手順
+ 1. GET /api/v1/library/niches — 関連ニッチ一覧取得
+ 2. 各ニッチのバイラルスライドショー検索:
+    GET /api/v1/library?niche={niche}
+ 3. 上位スライドショーの構造分析（枚数、テキストスタイル、フック）
+ 4. Pinterest画像検索:
+    GET /api/v1/pinterest/search?q={keyword}
+ 5. 新automation作成（最大2個/週）:
+    POST /api/v1/automations { ... }
+ 6. 結果を ~/.openclaw/workspace/reelfarm/library/YYYY-MM-DD.json に保存
+ 7. Slack #metrics (C091G3PKHL2) に報告
+
+ ### 新automation作成ルール
+ - 既存automationと同じフックを使わない
+ - スケジュールは既存cronと30分以上ずらす
+ - 最初7日はドラフトモードで投稿
+ - 既存automation合計が20個を超えたら、最低パフォーマンスのものを削除してから作成
```

---

## 投稿ボリューム成長計画

### Month 1（4投稿/日）

| アカウント | Automation数 | 投稿/日 | 月計 |
|-----------|-------------|---------|------|
| anicca.en4 | 1 | 2 | 60 |
| anicca.jp4 | 1 | 2 | 60 |
| **合計** | **2** | **4** | **120** |

### Month 2（12投稿/日）— 新アカウント追加

| アカウント | Automation数 | 投稿/日 | 月計 |
|-----------|-------------|---------|------|
| anicca.en4 | 3 | 6 | 180 |
| anicca.jp4 | 3 | 6 | 180 |
| **合計** | **6** | **12** | **360** |

### Month 3（30投稿/日）— 5アカウント

| アカウント | Automation数 | 投稿/日 | 月計 |
|-----------|-------------|---------|------|
| en4, en5, en6 | 各3 | 各6 | 540 |
| jp4, jp5, jp6 | 各3 | 各6 | 540 |
| **合計** | **18** | **36** | **1,080** |

### Month 6（目標: 300投稿/日 = 9,000/月）

50アカウント × 6投稿/日 = 300投稿/日
各アカウント3 automations × 2投稿/automation/日

---

## 全体投稿マトリクス（全システム統合）

| システム | タイプ | プラットフォーム | 投稿/日 | 月計 |
|---------|--------|----------------|---------|------|
| **ReelFarm** | スライドショー | TikTok | 4→300 | 120→9,000 |
| **reelclaw** | UGC + デモ | TikTok + IG + YT | 6 | 180 |
| **mau-tiktok** | Hook + CTA | TikTok + IG + YT | 12 | 360 |
| **larry** | スライドショー | TikTok + IG | 8 | 240 |
| **tiktok-poster** | 画像+キャプション | TikTok | 2 | 60 |
| **TikTok Ads** | 有料広告 | TikTok | - | 有料 |
| **合計(Month 1)** | | | **~32** | **~960** |
| **合計(Month 6)** | | | **~330** | **~10,000** |

---

## Web App: aniccaai.com/factory（Phase 3 — 別スペック）

### 概要

自社のReelFarm成功実績を基に、他の開発者にも同じ仕組みを提供するSaaS。
「アプリのURL入れるだけ。あとは全部やる。」

### 既存 mobileapp-factory-saas-spec.md との関係

既存スペックはアプリ生成（ralph.sh）中心。本スペックはマーケティング特化。
統合案: factory = ビルド + マーケティング の両方を提供。

### 技術スタック

| レイヤー | 技術 |
|---------|------|
| フロントエンド | Next.js 15 (App Router) + Tailwind + shadcn/ui |
| 認証 | Clerk |
| 決済 | Stripe ($30/月, $180/年) |
| DB | PostgreSQL (Prisma) on Railway |
| キュー | BullMQ + Redis on Railway |
| TikTok投稿 | ReelFarm API（各ユーザーのOAuth） |
| メトリクス | ReelFarm Analytics API |
| 収益追跡 | RevenueCat API（ユーザー提供キー） |
| ホスティング | Vercel (フロント) + Railway (API) |

### ユーザーフロー

```
1. aniccaai.com/factory にアクセス
2. Stripe決済（$30/月 or $180/年）
3. オンボーディング:
   a. アプリURL入力（App Store / Play Store）
   b. RevenueCat APIキー入力（任意 — 収益トラッキング用）
   c. TikTok OAuth接続 or 「アカウント代行作成」選択
4. 自動セットアップ:
   a. アプリ分析（カテゴリ、ターゲット、競合）
   b. ニッチ特定 & フック生成
   c. ReelFarm automation作成
   d. 投稿開始（最初7日はドラフト）
5. ダッシュボード:
   a. 投稿パフォーマンス（view/like/comment）
   b. アカウント健全性
   c. 収益トラッキング（RevenueCat連携時）
   d. LOOP A/Bの自動改善ログ
```

### 差別化

| 比較 | LarryLoop | ReelFarm直接 | **Anicca Factory** |
|------|-----------|-------------|-------------------|
| アカウント作成 | 手動 | 手動 | **代行** |
| ウォームアップ | 手動 | 手動 | **自動管理** |
| コンテンツ生成 | 自前AI | AI生成 | **ReelFarm + 自社改善ループ** |
| 投稿 | ドラフト→手動 | 自動 | **完全自動** |
| メトリクス改善 | 手動 | なし | **自動（LOOP A）** |
| 新コンテンツ発見 | 手動 | なし | **自動（LOOP B）** |
| 価格 | ~$100/月 | $49-199/月 | **$30/月** |

### 価格

| プラン | 月額 | 年額 | 内容 |
|--------|------|------|------|
| Starter | $30 | $180 | 3アカウント、6投稿/日 |
| Pro | $80 | $480 | 10アカウント、30投稿/日、RevenueCat連携 |
| Scale | $200 | $1,200 | 50アカウント、150投稿/日、全連携 |

---

## 手動作業チェックリスト（ダイスMUST）

| # | やること | 状態 | 備考 |
|---|---------|------|------|
| 1 | ReelFarm にログイン | ⬜ | https://reel.farm |
| 2 | anicca.en4 を TikTok OAuth接続 | ⬜ | Settings → Connected Accounts |
| 3 | anicca.jp4 を TikTok OAuth接続 | ⬜ | Settings → Connected Accounts |
| 4 | tiktok_account_id 2つをメモ | ⬜ | このスペックに埋める |
| 5 | REELFARM_API_KEY を OpenClaw env に追加 | ⬜ | `~/.openclaw/.env` |
| 6 | 初回automation作成をAniccaに指示 | ⬜ | ID取得後 |

---

## 実装順序

| Phase | やること | 担当 | 状態 |
|-------|---------|------|------|
| 0 | ReelFarmスキルインストール | CC | ✅完了 |
| 1 | ダイス手動作業（OAuth接続、ID取得） | ダイス | ✅完了（13アカウント接続済み） |
| 2 | ReelFarm SKILL.md にLOOP A/Bパッチ追加 | CC | ✅完了（2026-03-29） |
| 3 | 初回automation作成（EN4 + JP4） | CC | ✅完了（363ccc5e + 82056504） |
| 4 | jobs.json にLOOP A/B追加 | CC | ✅完了（128f5702） |
| 5 | `openclaw gateway restart` | CC | ✅完了 |
| 6 | LOOP A手動テスト実行（anicca.en フック更新） | CC | ✅完了（15フック全更新） |
| 7 | EN4/JP4 image_settings設定 | CC | ✅完了（collection_7142） |
| 8 | SKILL.md修正パッチ（実行で判明した問題修正） | CC | ⬜ |
| 9 | Aniccaでテスト実行（Just For Today cron） | CC | ⬜ |
| 10 | 1週間モニタリング & チューニング | Anicca | ⬜ |
| 11 | TikTokアカウント自動作成・ウォームアップ | CC + ダイス | ⬜ |
| 12 | iOS改善ループ（screenshot/paywall/onboarding/UX）| CC | ⬜ |
| 13 | Web App (factory) 構築開始 | CC | ⬜ |

---

## 競合調査 & State of the Art

### TikTok マーケティング自動化プラットフォーム比較

Source: 各公式サイト（2026-03-28 Firecrawl スクレイプ）

| 機能 | **LarryLoop** | **ReelFarm** | **Postiz** | **Agent-Media** | **Repurpose.io** | **Anicca Factory（俺ら）** |
|------|-------------|----------|--------|------------|-------------|----------------------|
| コンテンツ生成 | スライドショー | スライドショー+動画 | AIテキスト | UGC動画 | -- | **全部** |
| 自動投稿 | TikTok+IG | TikTok | 20+ SNS | -- | クロスポスト | **TikTok+IG+YT** |
| メトリクス追跡 | ビュー+**収益** | ビュー | 基本 | -- | -- | **ビュー+収益** |
| 収益アトリビューション | **Stripe/RevenueCat** | -- | -- | -- | -- | **RevenueCat** |
| 自動反復ループ | **毎週自動** | -- | -- | -- | -- | **毎日自動** |
| マルチアカウント | プラン依存 | 無制限 | プラン依存 | -- | 3+/SNS | **無制限** |
| アカウント作成 | -- | -- | -- | -- | -- | **代行（Phase 3）** |
| ウォームアップ | -- | ガイドのみ | -- | -- | -- | **自動管理（Phase 3）** |
| 最低価格 | $39/月 | $19/月 | $29/月 | クレジット | $35/月 | **$30/月** |

### E2E マーケティング自動化の State of the Art

| フェーズ | 現状 | 誰がやっているか |
|---------|------|----------------|
| 1. アカウント作成 | **誰もやっていない** | ToS違反リスクで全プラットフォームが回避 |
| 2. ウォームアップ | **誰もやっていない** | ReelFarmがマニュアルガイド提供のみ |
| 3. コンテンツ生成 | **最も成熟** | LarryLoop/ReelFarm（スライドショー）、Agent-Media（UGC動画） |
| 4. 投稿 | **成熟** | TikTok OAuth APIで全ツール対応 |
| 5. メトリクス分析 | **LarryLoopのみ真のクローズドループ** | 収益アトリビューション（Stripe/RevenueCat紐付け）はLarryLoopだけ |
| 6. 反復改善 | **LarryLoopのみ** | 毎週自動で勝者分析→負けフック淘汰→次バッチ生成 |

**結論:** 「完全E2E」は2026年3月時点で存在しない。最大ギャップはPhase 1-2（アカウント作成+ウォームアップ）。

### アプリビルド+マーケティング統合プラットフォーム比較

| 項目 | **Rork/Max** | **Bolt.new** | **Lovable** | **Creatify** | **Genstore** | **Anicca Factory** |
|------|-------------|-------------|------------|------------|------------|-------------------|
| ビルド自動化 | **App Store提出まで** | Webホスティング | Webホスティング | -- | ECストア | **App Store + マーケ** |
| マーケ自動化 | -- | SEOのみ | -- | **広告配信+ROAS** | TikTok/Amazon連携 | **TikTok+IG+YT+広告** |
| TikTok対応 | -- | -- | -- | 広告のみ | アプリ連携 | **オーガニック+広告** |
| 決済統合 | 手動 | -- | -- | -- | Stripe | **RevenueCat自動** |
| E2E Score | 40-50% | 30% | 25% | 70%(広告のみ) | 75%(ECのみ) | **目標100%** |

**「Build→App Store→TikTokマーケ→収益」をワンストップで自動化するプラットフォームは存在しない。**
Anicca Factory はこのギャップを埋める。

### LarryLoopから学ぶべきこと

| 学び | 詳細 |
|------|------|
| **収益アトリビューションが最大の差別化** | 「どの投稿が何ドルの収益を生んだか」をStripe/RevenueCatと紐付け |
| **The Loop（自動反復）が核心** | 毎週: 勝者パターン分析→負けフック淘汰→次バッチ生成 |
| **OpenClawスキルとしても提供** | LarryBrain.comで無料提供。統合可能 |
| **$109K+の収益生成実績** | 11,000+ユーザー。証明済み |

---

## MoneyPrinterV2 分析

**GitHub:** https://github.com/FujiwaraChoki/MoneyPrinterV2
**Stars:** 26,862 | **License:** AGPL-3.0（要注意）

### 概要

| 項目 | 内容 |
|------|------|
| 正体 | YouTube Shorts/TikTok動画自動生成ツール |
| パイプライン | トピック生成→スクリプト→AI画像→TTS→字幕→動画合成→アップロード |
| LLM | Ollama（ローカル、llama3.2:3b） |
| 画像生成 | Gemini API |
| TTS | KittenTTS（ローカル） |
| 字幕 | faster-whisper（ローカル）or AssemblyAI |
| 動画合成 | MoviePy + ImageMagick |
| 投稿 | Selenium + Firefox（YouTube/Twitter）、Post Bridge（TikTok/IG） |

### 機能一覧

| 機能 | 状態 | 詳細 |
|------|------|------|
| YouTube Shorts生成 | ✅ | フルパイプライン |
| Twitter Bot | ✅ | トピックベースのツイート生成・投稿 |
| アフィリエイト | ✅ | Amazon商品リンク→ピッチ生成→Twitter共有 |
| ローカルビジネス発掘 | ✅ | Google Mapsスクレイピング→メール送信 |
| CRONスケジューリング | ✅ | 1日1-3回の自動投稿 |

### セットアップ手動作業

| 作業 | 内容 |
|------|------|
| Ollama導入 | `ollama pull llama3.2:3b` |
| Firefox Profile | YouTube/Twitterに**手動ログイン**済みプロファイル必要 |
| config.json | APIキー設定 |
| ImageMagick | `brew install imagemagick` |
| Gemini API Key | Google AI Studioから取得 |

### 統合判断

| 結論 | 理由 |
|------|------|
| **コードそのままの統合は非推奨** | AGPL-3.0（anicca-productsリポに公開義務発生）、Selenium依存（壊れやすい）、Ollama固定、コード品質低 |
| **アーキテクチャ参考に自前構築を推奨** | Claude API + Gemini画像 + KittenTTS + MoviePy で独自パイプライン |
| **即座に使える部分** | KittenTTS（MIT）、faster-whisper（MIT）は独立利用可能 |
| **別プロセスで動かすなら可** | AGPL対策として別プロセス/サブモジュール化が安全 |

### 俺らにとっての価値

```
ReelFarm = スライドショー自動化（既に導入済み）
reelclaw = UGC + デモ動画（既に導入済み）
mau-tiktok = Hook + CTA動画（既に導入済み）
MoneyPrinterV2的パイプライン = ナレーション付き動画（未導入）
```

**MoneyPrinterV2のアイデアは有用だが、AGPL問題のため自前構築が正解。**
既存のRemotionスキル + Claude API + KittenTTS で同等のことができる。
優先度は低い — まずReelFarm/reelclaw/mau-tiktokの最適化が先。

---

---

## 2026-03-29 実行結果

### LOOP A テスト実行（anicca.en — Anicca en 1）

| 項目 | 結果 |
|------|------|
| 対象 | `3143be7b` Anicca en 1 (anicca.en) |
| 分析投稿数 | 20件（3日間） |
| 合計views | 120,971 |
| 合計likes | 1,030 |
| TOP | "Nobody Talks About How Exhausting It Is To Live In Your Own Head." = 47,963 views (score 19,242) |
| 2nd | "You're Not Overthinking. Your Nervous System Is Stuck In Threat Mode." = 26,872 views (score 10,770) |
| BOTTOM | "4 Ways/Steps/Things to..." パターン = 一律 ~950 views |
| **勝ちパターン** | **感情的2人称 empathy 文 — No numbers, no lists** |
| **負けパターン** | **「4 Ways to...」番号リスト形式 — 40倍低い** |
| アクション | 旧15フック全削除 → 感情的2人称パターンの新15フックに置換 |
| style変更 | なし（フックのみ） |

### LOOP B テスト実行（EN4 + JP4 新automation作成）

| 新automation | ID | アカウント | フック数 | crons(PST) | image_settings |
|-------------|-----|-----------|---------|-----------|---------------|
| Anicca EN4 — Inner Healing | `363ccc5e` | anicca.en4 | 10 | 07/13/19 | collection_7142 ✅ |
| Anicca JP4 — 心の癒し | `82056504` | anicca.jp4 | 10 | 07/13/19 | collection_7142 ✅ |

**合計アクティブautomation: 9個（旧7 + 新2）**

### スキル修正が必要な点（実行で判明）

| # | 問題 | 原因 | 修正 |
|---|------|------|------|
| 1 | `tiktok_account_username` がautomation APIレスポンスにない | API設計 | LOOP Aの先頭に「GET /tiktok/accounts でID→usernameマッピング構築」追加 |
| 2 | `timeframe=3` で3日分ではなく20件返る | APIの挙動 | timeframeの解釈を注釈追加（件数ではなく日数だが上限あり） |
| 3 | `self-improvement` `mindfulness` ニッチが0件 | ライブラリのデータ | LOOP Bで「まずGET /library/nichesで利用可能ニッチ確認」に変更 |
| 4 | 投稿枠計算ロジックがない | 設計漏れ | 各アカウントの現在投稿数/日を計算し6未満のみに割当 |
| 5 | image_settingsの設定が欠落 | 設計漏れ | 新automation作成時にcollection_7142をデフォルト設定 |
| 6 | 1180 slideshowsキュー詰まりでサンプル生成不可 | ReelFarm同時制限(3) | LOOP B実行前にキュー確認ステップ追加 |
| 7 | 「新アカウント必要」時のSlack通知が欠落 | 設計漏れ | 投稿枠フル時にSlackで手動ステップ通知 |

---

## TikTokアカウント自動作成・ウォームアップ

### 調査結果（2026-03-29）

**3つのアプローチ:**

| # | 方法 | ツール | コスト | 自動化度 |
|---|------|--------|--------|---------|
| A | 既存アカウント購入 | BulkAccountsBuy | $20/aged(2-4年,1K followers), $1.50/fresh | 購入=Playwright自動化可、OAuth接続=手動 |
| B | 自動ウォームアップ | l-portet/tiktok-warmup-bot (Node.js, 643★) | 無料 | iOS Voice Control経由でスクロール・いいね・フォロー自動化 |
| C | アカウント作成 | hendrikbgr/TikTok-Account-Creator (Python, 206★) | 無料 | Selenium + プロキシで自動作成 |
| D | US IP取得 | DansVPN ($2/月) | $2/月 | Outline VPN、CLI操作可能 |

### ツール評価

| ツール | 言語 | 方式 | シャドウバンリスク | 推奨 |
|--------|------|------|----------------|------|
| **l-portet/tiktok-warmup-bot** | Node.js | iOS Voice Control + ElevenLabs音声 | **低** — 物理デバイスシミュレーション | ✅ 使う |
| hendrikbgr/TikTok-Account-Creator | Python | Selenium + ChromeDriver | **高** — ブラウザオートメーション検出される | ⚠️ 要注意 |
| KD Pro | 不明(有料) | バルクウォームアップ | **中** — 専用ソフト | ❌ 有料、不透明 |

### 推奨フロー

```
Step 1: DansVPN でUS IP取得 ($2/月)
Step 2: ダイスが手動でTikTokアカウント作成（CAPTCHA回避のため）
   or hendrikbgr/TikTok-Account-Creator でプロキシ経由自動作成（リスクあり）
Step 3: l-portet/tiktok-warmup-bot でウォームアップ自動化（7日間）
   - Mac Mini にインストール: npm install
   - OpenClaw cronで毎日20分セッション
   - Voice Controlで物理デバイスシミュレーション → シャドウバンリスク最小
Step 4: ウォームアップ完了後、ダイスがReelFarm OAuth接続（手動必須）
Step 5: LOOP Bが自動で新automationを割り当て
```

**手動ステップ:** アカウント作成（CAPTCHAのため）+ ReelFarm OAuth接続（ブラウザ必須）
**自動化可能:** ウォームアップ（7日間cron）+ automation作成（LOOP B）

---

## iOS改善自動ループ（追加タスク）

### 既存スキルとの対応

| 改善対象 | 既存スキル | cron頻度 | 内容 |
|---------|-----------|---------|------|
| **App Store スクリーンショット** | `screenshot-ab` | 週1 | メトリクス確認→勝者判定→新ヘッドライン生成→PNG生成→VQA→承認→ASCアップロード→PPO実験 |
| **Paywall** | `paywall-ab` | 3日ごと | RevenueCat Experiments でCVR A/Bテスト→勝者分析→新バリアント生成→承認→RC新実験 |
| **オンボーディング** | (Eronred: `onboarding-optimization`) | 週1 | Mixpanel離脱ポイント分析→フロー修正→A/Bテスト |
| **アプリ体験** | (なし — 新規作成必要) | 週1 | RevenueCat churn率分析→UX改善→SwiftUIコード修正→ビルド→提出 |
| **ASO** | `aso` + Eronred `aso-skills` | 3日ごと | キーワード分析→メタデータ更新→ASCアップロード |
| **app-metrics** | `app-metrics` | 毎日 | RevenueCat + Mixpanel + ASC CLIからメトリクス取得→workspace保存 |

### Eronred/aso-skills（626★）

| スキル | 用途 | Aniccaに必要か |
|--------|------|--------------|
| `aso-audit` | リスティング10項目スコア(0-100) | ✅ |
| `keyword-research` | ボリューム×難易度×関連性 | ✅ |
| `metadata-optimization` | タイトル/サブタイトル/キーワード最適化 | ✅ |
| `screenshot-optimization` | 10枠スクリーンショット戦略 | ✅（screenshot-abと統合） |
| `onboarding-optimization` | 初回フロー監査、アクティベーション定義 | ✅ |
| `retention-optimization` | アクティベーション→習慣→エンゲージメント | ✅ |
| `monetization-strategy` | 価格/paywall/トライアル最適化 | ✅（paywall-abと統合） |
| `app-analytics` | イベント追跡計画、KPIフレームワーク | ✅ |
| `competitor-tracking` | 週次競合監視 | ✅ |

**注意:** Eronred aso-skills は **Appeeky API** 依存。API キーが必要。

### 改善対象と問題

```
┌─────────────┐   ┌─────────────┐   ┌─────────────┐   ┌─────────────┐
│ low impression│   │ low install │   │ low paywall │   │ high churn  │
│ (marketing)   │   │ rate        │   │ CVR         │   │ rate        │
│               │   │ (screenshot)│   │ (onb+paywall│   │ (app UX)    │
│ → ReelFarm   │   │ → screenshot│   │  +pricing)  │   │ → UX改善    │
│   TikTok Ads │   │   -ab loop  │   │ → paywall-ab│   │   retention │
│   mau-tiktok │   │   ASO loop  │   │   onb loop  │   │   loop      │
└─────────────┘   └─────────────┘   └─────────────┘   └─────────────┘
```

---

最終更新: 2026-03-29 01:00 JST
