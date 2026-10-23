# AI Monk Indexのrepo marketplace配布

## 目的・範囲・完了条件

既存portable plugin v0.1.1を、公開repoのcatalogからCodexへ直接installできるようにする。所有範囲は`.agents/plugins/marketplace.json`、plugin README、公開support page、本spec/plan/evidenceと既存field-guide/plugin planの現在cursorだけとする。既存MCP、Factory runtime、認証、日次投稿、loopには触れない。

source受入はcatalog JSONの読込、隔離した空の`CODEX_HOME`でのmarketplace追加→plugin追加→installed/enabled→MCP設定読込、README/supportの同じ導入コマンドとFactoryリンク、対象pageの既存検証、payload不変の照合とする。専用branchをcommit/pushしremote SHAとPRを確認する。main統合、公開main SHAを固定したsparse再install、natural-language routingと公式directory掲載はprimaryの後続受入であり、このsource受入から完了を導かない。

## 最小契約

- marketplace名は`anicca`、plugin名は既存の`ai-monk-index`。`source.source`は`local`、`source.path`はrepo root基準の`./packages/ai-monk-plugin`とする。
- policyは`installation: AVAILABLE`、`authentication: ON_USE`、`products: [CODEX]`、categoryは`Productivity`。公開MCPは既存の認証不要URLを維持し、catalogのpolicyから認証機能を新設しない。
- native wrapper、新manifest、新dependency、新tool、ZIP再発行を追加しない。root `plugin.json`、`mcp.json`、`assets/icon.png`のbytesを保持し、READMEだけを更新する。既存ZIP v0.1.1のSHA256は`ae8ef5922c5001d7b314d45c939dd2c529cd1295a0e53aed50c12f1f2a864127`であり、今回変更しない。
- 通常の導入は`codex plugin marketplace add Daisuke134/anicca-products --sparse packages/ai-monk-plugin`、`codex plugin add ai-monk-index@anicca`。既存のモデル/provider/auth設定を変更する引数を使わない。
- pluginは研究用の読み取り専用配布。動画生成/投稿は別の[Factory Web](https://aniccaai.com/ai-monk-factory/)へ案内する。repo marketplaceからのinstallをOpenAI公式directory掲載やhostでの自然言語tool routingと呼ばない。

## 旧順序→新順序→理由→現在cursor

旧順序はportal認証診断→identity/権限/walkthrough→審査提出/掲載→host routing。新順序は既存portableのrepo marketplace配布→公開main SHA固定+sparse再install→host routingとportal診断/提出/掲載。空の隔離`CODEX_HOME`で既存portableを変更せずinstall/loadできることを確認しており、publisher portalのOpenAI MFA境界と独立に利用可能な配布導線を作れるため、この順に進める。進行中の認証や既存外部effectは操作・中断しない。

現在cursorは[PR609](https://github.com/Daisuke134/anicca-products/pull/609)のmain統合と既存Landing PR CI→公開main SHA固定+sparse再install。通常のfeature override無しのCLIで空`CODEX_HOME`からinstall/enabled/MCP設定loadを確認する。既存MCPの6読取機能に案内だけを整合し、旧payload/ZIPと当時の3tool受入は保持する。source証拠 → `../../evidence/ai-monk-plugin-marketplace-source-20261023.json`。残TODO正本 → `../plans/2026-10-23-ai-monk-plugin-marketplace.md`。

## 一次資料と事前実測

- [OpenAI公式catalogの固定事例](https://github.com/openai/plugins/blob/0722921d5542fc593105c27bd52630babd8b8c2a/.agents/plugins/marketplace.json)の`source: local`と`./plugins/...`を踏襲する。
- [Codex v0.160.0のcatalog path解決](https://github.com/openai/codex/blob/a956835d020762cb2b570053af06f643a11c0ecc/codex-rs/core-plugins/src/marketplace.rs#L717)はcatalogの場所からrepo rootを求める。`./`の明示を保ち、catalog directoryを基準にしない。
- [同版のportable root manifest受入](https://github.com/openai/codex/blob/a956835d020762cb2b570053af06f643a11c0ecc/codex-rs/core-plugins/src/agent_plugin_manifest_tests.rs#L29)とlocal `codex plugin marketplace add --help` / `codex plugin add --help`を根拠とする。
- 事前private probeはCodex 0.160.0で既存4filesをそのままlocal fixtureへコピーし、marketplace add/list/plugin add/list/MCP設定loadを全exit0で確認する。`auth.json`なし、model/provider指定0、実model runとprovider呼出0。`--plugin-dir`は同版で受理されず採用しない。今回の通常コマンドの受入は実装後のcompact evidenceへ記録する。
