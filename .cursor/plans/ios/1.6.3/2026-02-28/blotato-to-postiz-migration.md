# Blotato → Postiz 移行 + 全修正スペック

**Date**: 2026-02-28
**Author**: Anicca
**Status**: ⬜ 未実行

---

## ソース

| # | ソース | URL | 核心の引用 |
|---|--------|-----|-----------|
| S1 | Postiz Public API Docs | https://docs.postiz.com/public-api/posts/create | POST api.postiz.com/public/v1/posts + Authorization header |
| S2 | Postiz API Overview | https://docs.postiz.com/public-api | 30 requests per hour limit |
| S3 | Postiz Agent CLI | https://postiz.com/agent | postiz analytics:post <post-id> -d 7 |
| S4 | Build In Public Roadmap | https://github.com/buildinginpublic/buildinpublic | Phase 5: Metrics, Reflection, and Adjustment |
| S5 | npm ci docs | https://docs.npmjs.com/cli/v10/commands/npm-ci | npm ci requires a package-lock.json to be present |
| S6 | Zenn FAQ rate-limit | https://zenn.dev/faq#rate-limit | 24時間以内の投稿数に基づいて判定。24時間経過すれば再投稿可 |
| S7 | larry SKILL.md | ~/.openclaw/workspace/skills/larry/SKILL.md | check-analytics.js --connect でPostiz postをTikTokビデオIDに接続 |

---

## Postiz Integration IDs（確認済み）

```
X @aniccaxxx:       cmm6d7m5703rwpr0yr5vtme3w
TikTok @anicca.jp2: cmlrv8jq000hun60yy57eaptx
TikTok @aniccaen2:  cmlt171eq04d9r00yzzceb6bw
Slack:              cmlrv5o0t00hgn60y734e1q3c
```

---

## 全実行ステップ

### A. Blotato → Postiz 移行

| # | タスク | スキル種別 | 状態 |
|---|--------|-----------|------|
| P0 | .envにPOSTIZ_X_INTEGRATION_ID=cmm6d7m5703rwpr0yr5vtme3w追加 | env | ⬜ |
| P1 | x-poster SKILL.md: Blotato API → Postiz API（投稿先: @aniccaxxx） | OpenClaw | ⬜ |
| P2 | build-in-public SKILL.md: Blotato → Postiz + @aniccaxxx + メトリクスループ | OpenClaw | ⬜ |
| P3 | trend-hunter SKILL.md: Blotoメトリクス → Postiz analytics | OpenClaw | ⬜ |
| P4 | article-writer SKILL.md: エラー表のBlotato残骸行削除 | OpenClaw | ⬜ |
| P5 | tiktok-poster スキル削除（larryが代替済み、cronなし） | OpenClaw | ⬜ |
| P6 | x-poster cron 2個停止 | OpenClaw cron | ⬜ |
| P7 | TOOLS.md: Blotato→Postiz更新 | OpenClaw workspace | ⬜ |
| P8 | AGENTS.md: Blotato→Postiz更新 | OpenClaw workspace | ⬜ |

### B. larry TikTokメトリクス修正

| # | タスク | 根本原因 | 状態 |
|---|--------|---------|------|
| L1 | check-analytics --connect cronを追加（毎朝6:00 JST） | 67投稿中0個がTikTokビデオIDに未接続。connect stepが欠落。(S7) | ⬜ |
| L2 | error状態のlarry cron 4個のログ確認 + 修正 | morning-ja, afternoon-en/ja, evening-ja が error | ⬜ |

### C. Zenn修正

| # | タスク | 根本原因 | 状態 |
|---|--------|---------|------|
| Z1 | article-writer cronの投稿頻度を24時間に1本に制限 | Zenn rate limit: 24時間に1投稿まで (S6) | ⬜ |

### D. dev.to修正

| # | タスク | 根本原因 | 状態 |
|---|--------|---------|------|
| D1 | package-lock.json生成 + push | npm ci に package-lock.json が必要 (S5) | ⬜ |
| D2 | DEV_TO_GIT_TOKEN secretがGitHubリポに設定されてるか確認 | GitHub Actions が使う | ⬜ |

### E. ハードウェア + Xcode

| # | タスク | 状態 |
|---|--------|------|
| H1 | USB-A→Cアダプタ + マウス購入（ドンキ新宿東南口、24時間営業） | ⬜ |
| H2 | Xcode → Settings → Accounts → Apple ID追加 | ⬜ |

### F. git

| # | タスク | 状態 |
|---|--------|------|
| G1 | 全変更を git commit & push | ⬜ |

---

## スキル種別まとめ

| スキル名 | どこにある | 誰が使う |
|---------|-----------|---------|
| x-poster | ~/.openclaw/skills/x-poster/ | OpenClaw (Anicca) |
| build-in-public | ~/.openclaw/skills/build-in-public/ | OpenClaw (Anicca) |
| trend-hunter | ~/.openclaw/skills/trend-hunter/ | OpenClaw (Anicca) |
| article-writer | ~/.openclaw/skills/article-writer/ | OpenClaw (Anicca) |
| tiktok-poster | ~/.openclaw/skills/tiktok-poster/ | OpenClaw (削除予定) |
| larry (tiktok-app-marketing) | ~/.openclaw/workspace/skills/larry/ | OpenClaw (Anicca) |
| xcellent | ~/.openclaw/workspace/skills/xcellent/ | OpenClaw (未使用) |

全てOpenClawスキル。Claude Codeのスキル（.claude/skills/）ではない。

---

## オリジナリティ: 0%
