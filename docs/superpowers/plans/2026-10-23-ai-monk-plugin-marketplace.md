# AI Monk Index repo marketplace配布計画

## 目的と方式

既存portable v0.1.1へのcatalog参照と導入案内だけを追加する。新しいtoolやnative wrapperは作らない。目的・範囲・完了条件・旧順序→新順序・理由の正本 → `../specs/2026-10-23-ai-monk-plugin-marketplace.md`。

baseは最新main `9cdd0d613693d3f7c2257a4b6c46665b823dfd77`。専用worktree `ai-monk-plugin-marketplace-20261023`、branch `feat/ai-monk-plugin-marketplace-20261023`で他者変更を保持する。モデル/provider/auth、SSOT、既存ZIP、日次投稿/loopは操作しない。

## TODO

- [ ] spec/planと現在cursorを先にcommit/pushしremote objectを確認する。
- [ ] catalogの無い現状を隔離CLIでRED確認し、repo root相対のcatalogを追加する。
- [ ] README/supportへ通常marketplace add/plugin add、公式directoryとの区別、Factoryリンクを追加する。
- [ ] JSON、payload3hash、空`CODEX_HOME`での実install/enabled/MCP設定load、support pageの既存focused検証、diffを確認しcompact evidenceへ記録する。
- [ ] commit/push/remote SHA一致とPRを確認しprimaryへ渡す。
- [ ] primary: main統合後、公開main SHAを固定しsparse cloneから再installする。
- [ ] primary: hostのnatural-language routingを確かめる。portal認証/identity/権限/walkthrough/審査提出/公式directory掲載は別の境界として進める。

## 現在cursor

計画のsource commit/push→catalog/案内実装。local config loadを実tool呼出や自然言語routingの成功に換算しない。審査提出/公式directory掲載とMuse URL同定は未達を保持する。
