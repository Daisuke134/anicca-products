# daily-memory

## 目的
Anicca 用の日次メモリ（学び・日記）を VPS の `~/.openclaw/memory/anicca/` に記録する。cron で毎日 23:00 JST に実行される。

## 必須 env
なし（ファイル読み書きのみ）。

## 必須 tools
- ファイル読み書きまたは `run_terminal_cmd`（AGENTS.md の読取、lessons-learned への追記、diary ファイルの作成に使用）

## 入力
なし（cron 起動）。

## 実行手順
1. `/home/anicca/.openclaw/memory/anicca/AGENTS.md` を読む。存在しなければ空で進める。
2. 今日の学びを 1〜3 行でまとめ、`/home/anicca/.openclaw/memory/anicca/lessons-learned.md` に追記する（日付と内容を 1 行で追加）。
3. 今日の日記を `/home/anicca/.openclaw/memory/anicca/diary-YYYY-MM-DD.md` に書く。ファイル名の日付は実行日の日付（JST）。中身は短い日次サマリでよい。

## 出力 / 監査ログ
- 3 ファイルへの読み書き結果。失敗時は理由をログに残す。

## 失敗時処理
- ファイルが無い: 必要なディレクトリ・ファイルを作成してから書く。AGENTS.md が無い場合はスキップして 2 と 3 のみ実行。

## 禁止事項
- `workspace/anicca.ai` 以下には書かない。必ず `/home/anicca/.openclaw/memory/anicca/` の絶対パスを使う。

## Cron
`0 23 * * *` (23:00 JST 毎日)
