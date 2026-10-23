# Codex公開plugin導入コマンド修正

目的は公開repoのcatalogとpluginをsparse checkoutし、利用者の空CODEX_HOMEから導入を完了すること。範囲はREADME/supportの同一3commandsと本計画・受入証拠。payload3files/旧ZIP/remote MCP/source3tools追加は変更しない。

実RED: public main0675d5e0aの --sparse packages/ai-monk-plugin だけではcatalogが取得されずmarketplace root manifest無しでexit1。local fixtureのPASSを公開installのPASSと扱わない。

旧順は公開catalog→CLI整合→公式掲載。新順は導入コマンド修正・公開install受入→CLI整合→公式掲載。理由は公開導線が実際に失敗するため。現在cursorはCLI helpに基づきcatalogとpayloadの両sparse pathを指定してpublic SHAでprobeする。

- [ ] 空CODEX_HOMEの公開SHAでREDを保存し、修正flagsでmarketplace/add/list/MCPの5段階GREENを得る。
- [ ] README/supportへ同一commandsを反映し、必要な既存CI・main/公開案内を確認する。
- [ ] package payload不変と最終public SHAの導入結果を記録する。
