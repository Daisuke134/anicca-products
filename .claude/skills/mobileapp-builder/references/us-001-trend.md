# US-001: Trend Research + Idea Selection

Source: rshankras idea-generator SKILL.md
URL: https://github.com/rshankras/claude-code-apple-skills/blob/main/skills/product/idea-generator/SKILL.md

## Skills to Read
1. `.claude/skills/idea-generator/SKILL.md` — rshankras

## Process (rshankras idea-generator そのまま)

### 1. Developer Profile Elicitation
Technical skills, domain interests, platform preference, time availability, constraints.
→ Factory では固定プロファイル: iOS, Swift/SwiftUI, solo dev, 1 day, subscription model.

### 2. Five Brainstorming Lenses (各 Lens 5-8 アイデア生成)

| Lens | 何 | データソース |
|------|---|-------------|
| 1: Skills & Interests | What can you uniquely build? | (内部知識) |
| 2: Problem-First | What took 30s that should take 5? | WebSearch |
| 3: Technology-First | Apple frameworks with few indie apps? | WebSearch |
| 4: Market Gap | App Store カテゴリの穴 | **x-research スキル (X)** + WebSearch |
| 5: Trend-Based | マクロトレンドから新機会 | **tiktok-scraper スキル (TikTok)** + WebSearch |

Lens 4/5 の置換理由 — Source: ManaLabs (https://manalabs.wtf/appfactory)
> 「Dedicated research agents scan Reddit, X, and App Store categories for pain points」

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
