# AI Monk 商品価格・通貨 v0.4.6実行計画

目的・範囲・完了条件の正本 → `../specs/2026-10-24-ai-monk-product-price-currencies.md`。全体順序は変更せず、DB-1の限定追加観測をFactory/Plugin業務と独立して反映する。

## TODO・現在cursor

- [x] SPEC: spec/planと全体DB-1参照を先にcommit/pushする。main5ca8138dの既存公開receiptを取り込んだspec commit `38f5a6de5f782dc0c37cf683a34b5c39b134f7d3`とremote objectの一致を確認する。
- [x] RED: 既存Web表示testでbase表示欠落を確認し、private source acceptanceで未反映3系統を確認する。
- [x] DATA: 3sourceを追加し、Beetroot/Ananta両account/Raviの既存offerを更新する。Kaelと他のunknownは保持する。
- [x] WEB: 既存2価格表示にBase priceだけを追加し、CLI/MCPの既存返却metadataへ同じ意味を伝える。
- [x] VERSION: package/lock/server/READMEを0.4.6へ揃える。source数・snapshot SHAは実計算する。
- [x] VERIFY: 既存package suite/shared helper/Web rendering・build・実stdio6toolとsource acceptanceを確認する。
- [x] PUSH: 実装と結果receiptのcommit `e815787f0ae48a68a0dc8a2fad88c51375781157`をpushし、remote SHA一致を確認する。primaryへsourceを引き渡す。
- [x] PRIMARY: fresh read-only根拠review SHIP/Blocking0、PR632のexact-head CI成功、main95f50a9dd298c7683ff57ed271998370a31ed183への統合、固定main入力のCLI v0.4.6 Release、Registry公開、Web/JSON/remote MCP/URL導入/実stdioの公式readbackを確認する。

現在cursor: この価格追加観測・v0.4.6公開unitは完了する。Database全体のDB-1、Plugin正式掲載とFactoryの残件は全体planで継続する。source受入 → `../../evidence/ai-monk-product-price-currencies-20261024.json`、公開受入 → `../../evidence/ai-monk-cli-mcp-v046-release-20261024.json`。private元bodyは公開しない。

## source受入結果

公開73/archive75・176→179source・637参照missing0を確認する。canonical snapshot SHA256は `b38ed6fabb78a357718cbddae7840c1922859b04e4858a578c2de2e76e768f02`。package15test、shared helper9/rendering4test、CIと同じcanonical marketing素材をstageしたLanding650ページbuild、実stdio6toolと全target get、Web exportのJSON完全一致/73card/179source/base価格表示はPASS。初回buildのignored素材不足と既存wallet/Tailwind警告はreceiptへ記録する。

旧v0.4.5/Plugin0.1.2/X投稿時snapshotは履歴として保持し、v0.4.6公開済みへ読み替えない。

## 公開受入結果

[新Release](https://github.com/Daisuke134/anicca-products/releases/tag/ai-monk-index-v0.4.6)のasset670400280は57574bytes、SHA256 `b33729dc9a343eed2a7dc176a0c969ec051efcde3c8b1f387592d616b24e843c`。公開download、URL導入CLI、実stdio6tool、本番HTTPS6tool、公開JSON/Webの73件/179出典とsnapshotが一致する。公開Webの基準価格とKael通貨不明も維持する。GitHubの`immutable=false`はそのまま記録し、Releaseロック有効とは主張しない。

Registry workflow40024564179はmain95f50a9dd由来でSUCCESS、dispatch1/resend0、新secret0。exact v0.4.6 GET200でactive/isLatestを確認する。Netlify deploy40023790498はSUCCESS、公式published deploy6adbcc4d0d6ae8f7fbd864fcはready。commit_ref=nullは成功SHAへ置換せず、title/GHAと公開snapshotの一致を根拠にする。利用者のinstall・注文・売上、ChatGPT/Museの正式掲載やFactory完成へ換算しない。
