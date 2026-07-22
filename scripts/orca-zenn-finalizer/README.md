# Orca Zenn finalizer

Orca記事のZenn日本語版・英語版を、Zennの直近24時間の新規公開制限に合わせて順番に再トリガーし、両方がliveになった後にHTTP・API・実renderを検証する一時運用ツールです。

## 正本と実行先

- 正本: このディレクトリの `finalizer.py`
- 実行コピー: `~/.local/share/anicca/orca-zenn-finalizer/finalizer.py`
- LaunchAgent: `~/Library/LaunchAgents/ai.anicca.orca-zenn-finalizer.plist`
- 状態・証拠: `~/.local/share/anicca/orca-zenn-finalizer/`

LaunchAgentは60秒ごとに起動します。Zenn APIの最新 `published_at` に24時間と10秒を加えた時刻まではpushしません。日本語がliveになるまで英語を公開せず、各slugのpushは最大3回です。

## 検証

```bash
python3 -m unittest scripts/orca-zenn-finalizer/test_finalizer.py
python3 -m py_compile scripts/orca-zenn-finalizer/finalizer.py
plutil -lint scripts/orca-zenn-finalizer/ai.anicca.orca-zenn-finalizer.plist
```

`exit 0`だけを完了根拠にしません。完了条件は `success.marker`、`live-evidence.json`、両URLのHTTP 200、Zenn API掲載、実render screenshotとDOM検証の全てです。

このツールが完了させるのはZenn公開と表示検証までです。記事カードの `done/` 移動、全URL書き戻し、対象repoのcommit/push、AgentMail完了通知とthread read-backは、両Zenn URLがliveになった後に行います。
