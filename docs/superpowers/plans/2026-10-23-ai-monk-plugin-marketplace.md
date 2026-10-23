# AI Monk Index repo marketplace配布計画

## 目的と方式

既存portable v0.1.1のrepo配布を受入し、Database→CLI→pluginの配布・販売をFactory完成形より先に進める。現在の変更は配布仕様/計画とsanitized証拠だけとし、catalog/CLI/package/releaseを変更しない。目的・範囲・完了条件・販売条件の正本 → `../specs/2026-10-23-ai-monk-plugin-marketplace.md`。全体scope・旧順序→新順序・理由の正本 → `../specs/2026-10-21-ai-monk-avatar-field-guide.md`「現在scopeと優先順」。

catalog実装時のbaseはmain `9cdd0d613693d3f7c2257a4b6c46665b823dfd77`、worktree `ai-monk-plugin-marketplace-20261023`、branch `feat/ai-monk-plugin-marketplace-20261023`。現在のdocs更新はPR609統合済みmain `0675d5e0a7c3d6a0e5a9caf19f7363256525e894`由来のworktree `ai-monk-distribution-priority-20261024`、branch `docs/ai-monk-distribution-priority-20261024`で行う。他者変更を保持し、モデル/provider/auth、SSOT、既存ZIP、日次投稿/loopは操作しない。

## TODO

- [x] spec/planと現在cursorを先にcommit/pushしremote objectを確認する（`ec1f7fffedd2f5a99002c222d229ab25b188311a`）。
- [x] catalogの無い現状を隔離CLIでRED確認し、repo root相対のcatalogを追加する。
- [x] README/supportへ通常marketplace add/plugin add、公式directoryとの区別、Factoryリンクを追加する。
- [x] JSON、payload3hash、空`CODEX_HOME`での実install/enabled/MCP設定load、support TSX構文/案内契約を確認しcompact evidenceへ記録する。full Next buildを含むLanding CI39975581104はSUCCESS。
- [x] source commit/push/remote SHA一致と[PR609](https://github.com/Daisuke134/anicca-products/pull/609)を確認する（実装commit `c6d50b98d`）。primaryがmain統合を所有する。
- [x] PR609をmain `0675d5e0a7c3d6a0e5a9caf19f7363256525e894`へ統合する。
- [x] 公開main SHA固定の初回probeで、payloadだけのsparse取得がcatalog欠落/exit1となるREDを確認する。local rootの成功だけでは検出できなかった取得境界として保持する。
- [x] 公開main `0675d5e0a7c3d6a0e5a9caf19f7363256525e894`固定で`--sparse .agents/plugins --sparse packages/ai-monk-plugin`を使い、5段階すべてexit0/payload3hash一致/auth file0/model flags0の再install GREENを受入する。証拠 → [PR611 compact receipt](https://github.com/Daisuke134/anicca-products/blob/7879d75abc457bb39217fe28ea72610e629743b5/docs/evidence/ai-monk-plugin-public-install-20261024.json)。
- [x] PR611はmain 0e1778d2d64b6f345526aa3b74476773e7aea2eeへ統合し、Landing CI39976934630/Netlify39977780297はSUCCESS。同SHAの空home公開install5段階・clone HEAD・payload3hash一致と公開supportの2pathコマンド、Database73件をreadbackする。証拠 → `../../evidence/ai-monk-plugin-public-final-20261024.json`。
- [x] hostのnatural-language routingを実5positive/3negativeで受入する。2 finite runs/7実MCP calls、全exit0。初回revenueの最終文章は証拠に数えず、fresh runの実`sort=revenue`呼出で補完する。sanitized証拠 → `../../evidence/ai-monk-plugin-native-routing-20261024.json`。
- [ ] primary: 公開CLI v0.4.2とmain追加研究tool/新snapshotの配布整合を確認し、必要なCLI公開版更新を行う。
- [ ] 配布・販売を先行する。確認したDirectoryのデジタル販売制限を守り、別Web/CLIを含めて許される販売経路と条件を具体化する。販売/決済/売上は未達を保持する。
- [ ] portal認証/identity/権限/walkthrough/審査提出/公式directory掲載を別の境界として進める。Muse URLは未特定。
- [ ] 後続: 利用者が自分のTikTokを接続し、動画制作・投稿を自動で実行するFactoryサービスを実装する。現在の公開draft/local planを完成形SaaSと扱わない。

## 現在cursor

公開CLIとmain研究tool/新snapshotの配布整合確認→販売経路の具体化。PR611はmain 0e1778d2d64b6f345526aa3b74476773e7aea2eeへ統合し、Landing CI39976934630/Netlify39977780297はSUCCESS。同SHAの空home公開install5段階・clone HEAD・payload3hash一致と公開supportの2pathコマンド、Database73件をreadbackする。公開sparse導入のcatalog欠落REDと2path指定の公開runtime GREENを別に保持する。PR609/main統合・Landing CIとnative自然言語5positive/3negative受入は完了する。source/config loadだけを実tool呼出へ換算せず、nativeの実receiptを別に保持する。Factory完成形の実装は後回しとし、審査提出/公式directory掲載、Muse URL同定、販売/決済/売上は未達を保持する。
