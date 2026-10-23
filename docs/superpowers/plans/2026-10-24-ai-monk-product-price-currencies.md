# AI Monk 商品価格・通貨 v0.4.6実行計画

目的・範囲・完了条件の正本 → `../specs/2026-10-24-ai-monk-product-price-currencies.md`。全体順序は変更せず、DB-1の限定追加観測をFactory/Plugin業務と独立して反映する。

## TODO・現在cursor

- [ ] SPEC: spec/planと全体DB-1参照を先にcommit/pushしてremote objectを照合する。
- [ ] RED: 既存Web表示testでbase表示欠落を確認し、private source acceptanceで未反映3系統を確認する。
- [ ] DATA: 3sourceを追加し、Beetroot/Ananta両account/Raviの既存offerを更新する。Kaelと他のunknownは保持する。
- [ ] WEB: 既存2価格表示にBase priceだけを追加し、CLI/MCPの既存返却metadataへ同じ意味を伝える。
- [ ] VERSION: package/lock/server/READMEを0.4.6へ揃える。source数・snapshot SHAは実計算する。
- [ ] VERIFY: 既存package suite/shared helper/Web rendering・build・実stdio6toolとsource acceptanceを確認する。
- [ ] PUSH: 実装と結果receiptをcommit/pushし、remote SHA一致でprimaryへ引き渡す。
- [ ] PRIMARY: fresh read-only根拠review、PR/main、immutable CLI v0.4.6 Release、Registry公開、Web/JSON/remote MCP/URL導入/実stdioの公式readback。

現在cursor: SPEC。source受入証拠 → `../../evidence/ai-monk-product-price-currencies-20261024.json`。private元bodyは公開しない。source受入と公開完了を分離する。
