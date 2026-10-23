# AI Monk Indexのrepo marketplace配布

## 目的・範囲・完了条件

既存portable plugin v0.1.1を、公開repoのcatalogからCodexへ直接installできるようにする。catalog・README・supportの実装はPR609でmain統合する。現在はfield-guide、本spec/plan、sanitized受入証拠を更新する。catalog、payload、CLI/package/release、Factory runtime、認証、日次投稿、loopには触れない。

source受入はcatalog JSONの読込、隔離した空の`CODEX_HOME`でのmarketplace追加→plugin追加→installed/enabled→MCP設定読込、README/supportの同じ導入コマンドとFactoryリンク、対象pageの既存検証、payload不変の照合とする。source/config loadだけから公開再install・native routing・公式directory掲載の完了を導かず、それぞれの実receiptを分ける。現在のdocs受入は優先順・Factory完成形・販売条件と受入証拠の整合、docs限定diff、commit/push/remote SHA一致とPRで判定する。main統合はprimaryが所有する。

## 最小契約

- marketplace名は`anicca`、plugin名は既存の`ai-monk-index`。`source.source`は`local`、`source.path`はrepo root基準の`./packages/ai-monk-plugin`とする。
- policyは`installation: AVAILABLE`、`authentication: ON_USE`、`products: [CODEX]`、categoryは`Productivity`。公開MCPは既存の認証不要URLを維持し、catalogのpolicyから認証機能を新設しない。
- native wrapper、新manifest、新dependency、新tool、ZIP再発行を追加しない。root `plugin.json`、`mcp.json`、`assets/icon.png`のbytesを保持し、READMEだけを更新する。既存ZIP v0.1.1のSHA256は`ae8ef5922c5001d7b314d45c939dd2c529cd1295a0e53aed50c12f1f2a864127`であり、今回変更しない。
- 通常の導入は`codex plugin marketplace add Daisuke134/anicca-products --sparse .agents/plugins --sparse packages/ai-monk-plugin`、`codex plugin add ai-monk-index@anicca`。catalogとpayloadの両方をcheckoutする。既存のモデル/provider/auth設定を変更する引数を使わない。
- pluginは研究用の読み取り専用配布。動画生成/投稿は別の[Factory Web](https://aniccaai.com/ai-monk-factory/)へ案内する。repo marketplaceからのinstallをOpenAI公式directory掲載やhostでの自然言語tool routingと呼ばない。

## 旧順序→新順序→理由→現在cursor

Database→CLI→pluginの配布・販売を先行し、Factory完成形の実装は後回しにする。全体scope、旧順序→新順序と理由の正本 → `2026-10-21-ai-monk-avatar-field-guide.md`「現在scopeと優先順」。repo配布はpublisher portalのOpenAI MFA境界と独立して進める。公開draft/local planを利用者のTikTok接続・自動制作投稿SaaSの完成と扱わず、進行中の認証や既存外部effectは操作・中断しない。

現在cursorは公式掲載の未完境界とplugin本体の商品契約。既存の無料plugin配布と外部の有料書籍経路は確認済みであり、本体課金・実注文とは区別する。v0.4.3はPR613/main 65004993114e32933f11f7194d3220ff7d97eef8から公開する。source15tests、package CI39978560061/Landing CI39978560073、fresh公開前review blocking0、official tag/asset669562735のdigestと公開GET、公開URLからのnpm install・CLI73件/57出典・実stdio6toolのsnapshot一致を受入する。公開証拠 → `docs/evidence/ai-monk-cli-mcp-v043-release-20261024.json`。PR611はmain 0e1778d2d64b6f345526aa3b74476773e7aea2eeへ統合し、Landing CI39976934630/Netlify39977780297はSUCCESS。同SHAの空home公開install5段階・clone HEAD・payload3hash一致と公開supportの2pathコマンド、Database73件をreadbackする。最終証拠 → `../../evidence/ai-monk-plugin-public-final-20261024.json`。PR609のmain統合/Landing CI、公開main `0675d5e0a7c3d6a0e5a9caf19f7363256525e894`固定の2path sparse再install、実native routingの5positive/3negative受入は完了する。旧payload/ZIPと当時の3tool受入は保持する。source証拠 → `../../evidence/ai-monk-plugin-marketplace-source-20261023.json`、native証拠 → `../../evidence/ai-monk-plugin-native-routing-20261024.json`。公開sparse証拠は[PR611のcompact receipt](https://github.com/Daisuke134/anicca-products/blob/7879d75abc457bb39217fe28ea72610e629743b5/docs/evidence/ai-monk-plugin-public-install-20261024.json)を参照する。残TODO正本 → `../plans/2026-10-23-ai-monk-plugin-marketplace.md`。

公開Git sourceではpayloadだけの`--sparse packages/ai-monk-plugin`がcatalogを取得せず、marketplace追加はmissing manifest/exit1になる。catalogのあるlocal rootを使ったsource probeではこの取得境界を検出できない。2path指定の公開SHA probeは5段階すべてexit0、payload3hash一致、auth file0/model flags0でGREENとなる。README/support修正のPR611はmain/Netlify反映と最終SHA再installを完了する。案内sourceの反映とruntime受入は別の証拠に記録する。local成功を公開install成功へ換算しない。

## 販売条件

販売はユーザー意図であり、販売済み・課金済みとは扱わない。[公式Plugin guidelines](https://developers.openai.com/plugins/plugin-guidelines#commerce-and-monetization)はDirectory掲載pluginのcommerceをphysical goodsに限定し、digital products/services、subscription、content、creditsの直接・間接販売とupsellを認めない。既存有料accountの契約内機能へのaccessは認めるが、新規subscriptionやupgradeの促進、取引checkoutへの直接linkは認めない。

[公式Checkout API](https://developers.openai.com/plugins/build/monetization)の一般向け経路はphysical goods向けのexternal checkoutであり、ChatGPT payment sheetは選定marketplace向けprivate betaである。[submission](https://developers.openai.com/plugins/deploy/submission)の`review.commerce`は申告であり、legal termsへの同意ではない。repo catalogに有料checkoutがあるとはinstall受入から推定しない。既存の無料配布口は[Codex導入support](https://aniccaai.com/ai-monk-database/support)と[portable v0.1.1](https://github.com/Daisuke134/anicca-products/releases/tag/ai-monk-plugin-v0.1.1)。関連書籍は[日本語](https://aniccaai.com/the-art-of-ai-monks/ja)・[英語](https://aniccaai.com/the-art-of-ai-monks)の各$9.99一回払いで、無料全文と有料PDF/EPUBを分けて公開する。liveページ、既存Stripe Checkout/complete+paid付きdownloadの実装、過去の公式Stripe証拠を確認する。pluginのcommerce:false、公開supportの無料契約、MCPだけの接続を保持し、確認した範囲にはplugin用価格・課金認証・利用権制御が無い。plugin本体の有料化は商品契約・決済・利用権制御・実注文の別TODOとする。書籍販売はplugin外の既存商品ページで扱い、plugin内/ChatGPT Directoryへのdigital upsellを追加しない。現在の無料read-only pluginの契約は変更せず、注文数・売上・実決済後の本番納品は今回未確認とする。

## 一次資料と事前実測

- [OpenAI公式catalogの固定事例](https://github.com/openai/plugins/blob/0722921d5542fc593105c27bd52630babd8b8c2a/.agents/plugins/marketplace.json)の`source: local`と`./plugins/...`を踏襲する。
- [Codex v0.160.0のcatalog path解決](https://github.com/openai/codex/blob/a956835d020762cb2b570053af06f643a11c0ecc/codex-rs/core-plugins/src/marketplace.rs#L717)はcatalogの場所からrepo rootを求める。`./`の明示を保ち、catalog directoryを基準にしない。
- [同版のportable root manifest受入](https://github.com/openai/codex/blob/a956835d020762cb2b570053af06f643a11c0ecc/codex-rs/core-plugins/src/agent_plugin_manifest_tests.rs#L29)とlocal `codex plugin marketplace add --help` / `codex plugin add --help`を根拠とする。
- 事前private probeはCodex 0.160.0で既存4filesをそのままlocal fixtureへコピーし、marketplace add/list/plugin add/list/MCP設定loadを全exit0で確認する。`auth.json`なし、model/provider指定0、実model runとprovider呼出0。`--plugin-dir`は同版で受理されず採用しない。今回の通常コマンドの受入は実装後のcompact evidenceへ記録する。
