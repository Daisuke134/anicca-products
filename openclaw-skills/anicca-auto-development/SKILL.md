# Anicca Auto-Development（検索 → 報告 → spec → Codex Review → Codex 実装 → 検証 → 報告）

Anicca が「X と Firecrawl で深掘り」「spec を書く → **Codex Review でレビューして完璧な spec にする** → Codex に実装させる → 自分で E2E 検証して結果を報告する」まで回すスキル。**開発まわりに限定**。

## 役割分担

| 役割 | 担当 | やること |
|------|------|----------|
| マネージャー | Anicca | 検索・学習・#metrics 報告・spec 作成・**spec の Codex Review 依頼**・レビュー済み spec を Codex に渡す・**実装の Codex Review 依頼**・E2E 検証・結果報告 |
| レビュアー（spec） | **codex-review スキル**（VPS） | spec をレビューして ok: true になるまで反復。**完璧な spec** にしてから実装に回す。 |
| プレイヤー | Codex / Claude Code | レビュー済み spec どおりに実装・テスト。main は触らない。**dev から生やした worktree** で作業。 |
| レビュアー（実装） | **codex-review スキル**（VPS） | 実装を再度検証。コード・品質を codex-review で ok: true になるまで通す。 |

## 流れ（9 ステップ）

| ステップ | やること |
|----------|----------|
| 1. **検索** | **grok-context-research** を先に実行し、`data/context-research/` の .md を読んだうえで、**x-research** と **Firecrawl** で深掘り。X の開発ネタ・ドキュメント・記事を集める。 |
| 2. **学習 → #metrics 報告** | 整理して「このプラグイン使える」「このやり方で強化できる」などを把握。Grok の .md を要約の種にして、毎朝 5 時などで **#metrics** に「X の空気・気になった記事・注意点」を投稿。 |
| 3. **spec 作成** | 採用するものを決め、**実装用の spec**（何をどこに足すか・セキュリティ要件など）を書く。 |
| 4. **Codex Review（spec）** | **codex-review スキル**（VPS）で spec をレビュー。ok: true になるまで修正して **「完璧な spec」** にする。 |
| 5. **実装依頼** | その **レビュー済み spec** を Codex に渡して実装・テスト。「dev から worktree で。main にマージしないこと。」 |
| 6. **Codex Review（実装）** | **codex-review スキル**（VPS）で実装を再度検証。コード・品質を ok: true になるまで通す。 |
| 7. **E2E 検証** | Anicca がその機能を触って「動いた／動かなかった」を確認する。 |
| 8. **結果報告** | 「終わった、チェックして」を Slack で報告。 |
| 9. **あなたが確認** | 「動いてる」と確認。main マージはあなたが判断。 |

## 制約（絶対）

- **main にはマージしない。** 作業は dev から生やした worktree のみ。マージはユーザーがチェックしてから。
- **spec は Codex Review を通してから** Codex 実装に渡す。**実装も Codex の codex-review で再度検証**してから E2E に進む。
- **API キーが必要なら**「自分では取れないので、あなたが取ってほしい」と報告に含める。
- **コストが高いなら** それも報告に含める。

## 使うスキル・ツール

- **grok-context-research**: Grok で X の空気を 1 本の .md にまとめる。`npx tsx scripts/grok_context_research.ts --topic ...` で実行し、`data/context-research/` の .md を検索・#metrics・spec の材料に使う。
- **x-research**: X 検索・スレッド・プロフィール。**X_BEARER_TOKEN が無い場合は Firecrawl のみで検索・スクレイピング**（Oliver & Larry 等の URL を Firecrawl で取得してよい）。
- **Firecrawl / web fetch**: ドキュメント・記事の深掘り。`~/.openclaw/.env` に `FIRECRAWL_API_KEY` を書いておく。
- **Slack**: #metrics への投稿、結果報告。
- **codex-review**（VPS スキル）: spec と実装のレビューゲート。Anicca がこのスキルを呼び出す。ok: true になるまで修正してから次へ。
- **Codex / Claude Code**: レビュー済み spec を渡して worktree 上で実装・テストさせる。

## トリガー

- 毎朝 5 時などの cron で「今日の X リサーチ → 学習 → #metrics 報告」を実行。
- ユーザーや Slack からの依頼で「〇〇について X で調べて → よければ spec 書いて Codex に依頼して」をその都度実行。

## 仕様書の置き場

spec は `.cursor/plans/` やプロジェクトの plans フォルダなど、Codex/Claude Code が参照できる場所に置く。依頼時に「この spec のパス」を渡す。
