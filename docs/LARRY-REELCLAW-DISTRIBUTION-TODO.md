# Larry / Reelclaw 配信 — TODO + 状態 (SSOT)

**最終更新: 2026-06-23** / 担当: Claude Code (dev) / runtime: `~/.openclaw` (anicca-dais, branch `main-internal`)

このファイル = larry/reelclaw 配信の唯一の真実。消えないよう products repo に置く。

---

## ✅ 完了(検証済み)

| # | 項目 | 証拠 / 場所 |
|---|---|---|
| 1 | 日本語テキストはみ出し恒久修正 | `add-text-overlay.js` CJK文字折返し+禁則(JIS X 4051)+収まるまで縮小。male/female/sunset 実画像確認、メール3通送信済 |
| 2 | Apple ID パスワード → `Epoc1234!` | `~/.openclaw/.env:217,219` |
| A | larry-ja-5 = **anicca_buddha** 新アカウント | cron 3本 @7:00/13:00/20:00、実投稿 PUBLISHED 検証 (tiktok.com/@anicca_buddha) |
| 10 | IG クロス投稿配線 | 英語(aniccaen2)→ @anicca.encards(Anicca iOS) / 日本語(anicca.jpx)→ @アニッチャ / 他は全部 TikTok のみ。英語→anicca.jp.videos 誤配線を停止 |
| 3/4 | メインEN=女性 / メインJP=夕焼け 背景 | aniccaaffirmation←en-v4(femaleface) / anicca.jp←ja-v3(sunset)。設定は正(実投稿確認は #9) |
| — | post-to-tiktok.js を trunk に復元 | 1080縮小・JPEG(IG)・registry auto-pair・post後verify 入り318行版。side branch から main-internal へ |
| — | 背景アセット復元 | maleface/femaleface/sunset.jpg を `assets/human-face/` に + git追跡 |
| — | (土台) deepseek fallback共倒れ / TikTok>1080p / ENOSPC / codex未install / canvas破損 | 全て修正済(ただし下記★で再発中) |

## 📊 最終 アカウント×プラットフォーム 表

| TikTok アカウント | TikTok/日 | IG |
|---|---|---|
| @aniccaen2 (英語male) | 3 | → @anicca.encards |
| @anicca.jpx (日本語male) | 3 | → @アニッチャ |
| @aniccaaffirmation (英語/女性) | 3 | TikTok のみ |
| @anicca.jp (日本語メイン/夕焼け) | 3 | TikTok のみ |
| @anicca.he | 3 | TikTok のみ |
| @anicca.jp4 | 2 | TikTok のみ |
| @anicca_buddha (新) | 3 | TikTok のみ |
| reelclaw honne en/ja | 各3 | TikTok のみ |
| reelclaw card/widget ja | 各3 | TikTok+IG(anicca.jp.videos)+YouTube |
| reelclaw card/widget en | 各 | IG+YouTube(★TikTok無し=#12) |

---

## ⏳ 残り TODO

### 🔴 0. 最優先: 「修正が消える/フラッピング」を止める
- **症状**: model設定・codexプラグインを直しても、他agent/別コミットが絶えず変える → codex消失 → `MissingAgentHarnessError` → larry/reelclaw が `LLM request failed` 大量発生(2026-06-23: 24 error/19 OK)。
- **証拠**: openclaw.json の連続コミット `20b6b3f4 switch→gpt-5.4-mini` / `91176ead →deepseek-v4-pro` / `92c036f6 free/*追加` = 複数agentがmodel設定を奪い合い。
- **やること**: ①誰/何がmodel設定とcodexを変えてるか特定(cron? doctor --fix? 別agent?)②model設定の所有権を1つに固定(Dais指定=deepseek default + gpt-5.4-mini fallback)③codexが消えない仕組み。
- **要Dais判断**: model設定の最終所有者を誰にするか。

### 1. #9 — 背景の実投稿確認(私の作業, go不要)
- aniccaaffirmation が実際に女性背景で、anicca.jp が夕焼けで公開されるか fire して確認。

### 2. #11 — 再発防止を skill に embed(私の作業, go不要)
- ① canvas: build前に `require('canvas')` 確認→壊れてれば自動 `npm rebuild canvas`(node更新ABI対策)
- ② disk/session janitor cron(ENOSPC再発防止、session 14k堆積を定期削除)
- ③ worktree厳守 + **必ず main-internal トランクにcommit**(side branch放置で消えるのを防ぐ)

### 3. #12 — reelclaw 英語 card/widget に TikTok 無い ★要Dais★
- 現状 IG+YouTube のみ。英語 card/widget 用 TikTok アカウントを作るか、既存に出すか。

### 4. ja-v4 cron の --tt が IG id 誤 ★要Dais★
- ja-v4(1本/日)が `--tt` に Instagram の id を入れてて壊れてる。どの TikTok 用か不明 → 教えてもらうか停止。

### 5. telegram OutboundDeliveryError(3 cron)
- reelclaw-anicca-en-widget-1 / honne-en-1 / honne-ja-1 が telegram 配信アダプタでエラー。投稿でなく「完了通知の配信」失敗。要調査(投稿自体は出てる可能性)。

---

## 運用ルール(消えないため)
1. ★ runtime の修正は必ず `main-internal` トランクに commit + push ★(side branch に置くと runtime に届かず消える = 今回の事故の真因)
2. skill コード編集は worktree。ライブ state ファイル(account-history/auth-state/postiz-integrations)は gateway が常時書くので worktree merge 不可 → 直接編集。
3. model設定 = deepseek/deepseek-v4-flash default + openai/gpt-5.4-mini fallback のみ(Dais指定)。codex プラグイン必須(gpt-5.4-mini = codex harness)。
