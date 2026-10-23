# AI Monk Database一覧の復元

## 目的・範囲・完了条件
Daisが指摘する73→4の減少を解消する。未調査69件を消さず、included4/pending69の73件を公開一覧へ戻す。既存イラスト系excluded2件とscope欠落は非掲載、全75record/57sources・画像・各recordの判定/未知の指標は不変。全件を確認済みAI動画avatarと呼ばない。

既存共有selectorの条件だけをexplicit included/pendingへ変更し、Web/CLI/stdio/remote MCPを同じscopeへ揃える。新scope option/selector/DB/provider/依存は作らない。Webはpendingの短い調査中注記と既存reasonを示し、AI status badge/filterは復活しない。metadata/MCP/READMEのincluded限定copyを揃える。過去v0.4.1は保持、新配布物をv0.4.2にする。

## TODO
- [ ] 既存helper/SSR/packageの73件・pending検索/get・excluded/欠落拒否を最小REDで確認する。
- [ ] 共有selector/UI/metadata/canonicalトップ説明/MCP説明を最小修正し、各accountとsource/画像bytes不変を確認する。
- [ ] 既存の関連Node/package/SSR tests、fresh read-only反証、exact CIをPASSしてmainへ統合する。ローカル全依存再導入や全repo QAは追加しない。
- [ ] Netlify公開HTMLの73card・pending注記・excluded非掲載、public JSONの75archive/4included/69pending/2excluded、remote MCPの73件を公式readbackする。
- [ ] v0.4.2の公式tag/asset digestと公開URL導入で同じ73件を確認する。
- [ ] 受入結果を本計画とfield-guide現在cursorへ記録し、Monk Factory Web appへ進む。

## 所有と判断
primaryはspec/plan/evidence/main判定と配布を所有。実装workerは共有helper/UI/metadata/canonicalトップ説明/package説明・既存tests/versionだけを所有する。他者のsource/公開content/credential/投稿/loopを変更しない。

Superpowersの原因調査/TDDとponytail fullを使う。共通指示のfresh公開前検証をproject旧review禁止より優先し、modelはCodex UI継承でoverrideしない。検証は今回の動作に関係する既存testsへ限定する。
