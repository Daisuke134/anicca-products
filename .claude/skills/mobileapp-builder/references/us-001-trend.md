# US-001: Trend Research + Idea Selection

Source: rshankras idea-generator SKILL.md
URL: https://github.com/rshankras/claude-code-apple-skills/blob/main/skills/product/idea-generator/SKILL.md

## Skills to Read
1. `.claude/skills/idea-generator/SKILL.md` — rshankras（5-lens フレームワーク）
2. `.claude/skills/apify-ultimate-scraper/SKILL.md` — TikTok ハッシュタグ定量データ（Lens 5）
3. `.claude/skills/app-store-scraper/SKILL.md` — App Store 競合分析 + レビュー（Lens 4）

## Environment

```bash
source ~/.config/mobileapp-builder/.env
# APIFY_TOKEN が必要（TikTok ハッシュタグスクレイピング用）
```

## Process (rshankras idea-generator そのまま)

### 0. Pre-check: 既存アプリ重複排除

**Apple Guideline 4.3 (Spam) 対策。同カテゴリのアプリを同一デベロッパーアカウントから出すとリジェクトされる。**

```bash
ls mobile-apps/
```

既存アプリのカテゴリを確認し、以下を Lens 生成時の**除外カテゴリ**として扱う:

| 既存アプリ例 | 除外カテゴリ |
|-------------|-------------|
| breath-calm, breatheai | 呼吸法・瞑想 |
| sleep-ritual | 睡眠 |
| dailydhamma | マインドフルネス・仏教 |
| calmcortisol | ストレス管理 |
| rork-thankful-gratitude-app | 感謝日記 |

**ルール:** 上記カテゴリと重複するアイデアは Feasibility Filtering で自動除外する。

### 1. Developer Profile Elicitation
Technical skills, domain interests, platform preference, time availability, constraints.
→ Factory では固定プロファイル: iOS, Swift/SwiftUI, solo dev, 1 day, subscription model.

### 検索ルール

| ルール | 値 |
|--------|-----|
| WebSearch 最低回数 | **10回**（5 Lens × 2回以上） |
| Apify TikTok | Lens 5 で必須（定量データ取得） |
| iTunes Search API | Lens 4 で必須（競合分析 + ★1-2 レビュー） |
| キーワード多様性 | 英語 + 日本語、一般化・隣接分野含む |

### 2. Five Brainstorming Lenses (各 Lens 5-8 アイデア生成)

| Lens | 何 | データソース |
|------|---|-------------|
| 1: Skills & Interests | What can you uniquely build? | (内部知識) |
| 2: Problem-First | What took 30s that should take 5? | WebSearch |
| 3: Technology-First | Apple frameworks with few indie apps? | WebSearch |
| 4: Market Gap | App Store カテゴリの穴 | **app-store-scraper** (iTunes API) + WebSearch |
| 5: Trend-Based | マクロトレンドから新機会 | **apify-ultimate-scraper** (TikTok) + WebSearch |

Lens 4/5 の置換理由 — Source: ManaLabs (https://manalabs.wtf/appfactory)
> 「Dedicated research agents scan Reddit, X, and App Store categories for pain points」

#### Lens 4 詳細: app-store-scraper の使い方

```bash
# 1. 競合検索（キーワードで上位10件）
curl -s "https://itunes.apple.com/search?term=KEYWORD&media=software&entity=software&limit=10" | \
  jq '.results[] | {name: .trackName, rating: .averageUserRating, reviews: .userRatingCount, price: .formattedPrice}'

# 2. 競合の★1-2レビュー取得（ペインポイント発掘）
curl -s "https://itunes.apple.com/us/rss/customerreviews/page=1/id=APP_ID/sortby=mostrecent/json" | \
  jq '.feed.entry[] | select((.["im:rating"].label | tonumber) <= 2) | {title: .title.label, rating: .["im:rating"].label, review: .content.label}'
```

**目的:** 競合の★1-2レビューから「ユーザーが不満に思っていること」を定量的に把握する。

#### Lens 5 詳細: apify-ultimate-scraper の使い方

```bash
# TikTok ハッシュタグのビュー数を取得（定量トレンド検証）
source ~/.config/mobileapp-builder/.env
node --env-file=.env ${CLAUDE_PLUGIN_ROOT}/reference/scripts/run_actor.js \
  --actor "clockworks/tiktok-hashtag-scraper" \
  --input '{"hashtags": ["deskstretching", "officestretching", "KEYWORD"], "resultsPerPage": 10}'
```

**目的:** WebSearch の「〜がトレンド」という定性情報を、TikTok ビュー数で定量検証する。

### 3. Feasibility Filtering (rshankras そのまま, 5基準)
Solo Dev Scope, Platform API Fit, Monetization Viability, Competition Density, Technical Complexity

### 4. Scoring and Ranking
5次元 1-10 スケール。Solo Dev Scope + Technical Fit は 1.5x 重み付け。

### 5. Shortlist Output (3-5 アイデア)
各アイデアに: one-liner, lens, problem_statement, target_user, feasibility scores, overall_score, monetization_model, competition_notes, mvp_scope, next_step

## Output
`spec/01-trend.md` — rshankras idea-generator 出力フォーマット
Fields: rank, idea, one_liner, lens, platform, problem_statement, target_user, feasibility, overall_score, monetization_model, competition_notes, mvp_scope, next_step, ideas_filtered_out, recommendation

## Acceptance Criteria
- spec/01-trend.md exists
- At least 5 ideas evaluated, top 1 selected
- Sources cited for each trend
