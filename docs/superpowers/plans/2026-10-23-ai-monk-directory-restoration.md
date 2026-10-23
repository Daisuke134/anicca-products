# AI Monk Database一覧の復元

## 目的・範囲・完了条件
Daisが指摘する73→4の減少を解消する。未調査69件を消さず、included4/pending69の73件を公開一覧へ戻す。既存イラスト系excluded2件とscope欠落は非掲載、全75record/57sources・画像・各recordの判定/未知の指標は不変。全件を確認済みAI動画avatarと呼ばない。

既存共有selectorの条件だけをexplicit included/pendingへ変更し、Web/CLI/stdio/remote MCPを同じscopeへ揃える。新scope option/selector/DB/provider/依存は作らない。Webはpendingの短い調査中注記と既存reasonを示し、AI status badge/filterは復活しない。metadata/MCP/READMEのincluded限定copyを揃える。過去v0.4.1は保持、新配布物をv0.4.2にする。

## TODO
- [x] 既存helper/SSR/packageの73件・pending検索/get・excluded/欠落拒否を最小REDで確認する。
- [x] 共有selector/UI/metadata/canonicalトップ説明/MCP説明を最小修正し、各accountとsource/画像bytes不変を確認する。
- [x] 既存の関連Node/package/SSR tests、fresh read-only反証、exact CIをPASSしてmainへ統合する。ローカル全依存再導入や全repo QAは追加しない。
- [x] Netlify公開HTMLの73card・pending注記・excluded非掲載、public JSONの75archive/4included/69pending/2excluded、remote MCPの73件を公式readbackする。
- [x] v0.4.2の公式tag/asset digestと公開URL導入で同じ73件を確認する。
- [x] 受入結果を本計画とfield-guide現在cursorへ記録し、Monk Factory Web appへ進む。

## 所有と判断
primaryはspec/plan/evidence/main判定と配布を所有。実装workerは共有helper/UI/metadata/canonicalトップ説明/package説明・既存tests/versionだけを所有する。他者のsource/公開content/credential/投稿/loopを変更しない。

Superpowersの原因調査/TDDとponytail fullを使う。共通指示のfresh公開前検証をproject旧review禁止より優先し、modelはCodex UI継承でoverrideしない。検証は今回の動作に関係する既存testsへ限定する。

## 公開受入
PR595/head26f752cは関連25件・fresh blocking0・Landing/package CIをPASSしmain6ac3f6cへ統合する。Netlify39953593583はSUCCESS。公開HTML73card/69候補注記/対象外0、公開JSONはmainとbytes一致。公式SDKでremote MCP3tools・全4sort73・pending検索/getと対象外拒否を確認し、公開URLから導入したv0.4.2の実stdioも同statsを返す。公式tagは同main、asset29,720bytes、SHA256 a46fa23cb6ac5cb959cff683851948852a7e622553c3ccfb74ddd65b6a6132a8。accounts75/sources57・画像・record metricsは変更しない。証拠 → docs/evidence/ai-monk-directory-restoration-production-20261023.json、docs/evidence/ai-monk-cli-mcp-v042-release-20261023.json。現在cursorはMonk Factory Web app。
