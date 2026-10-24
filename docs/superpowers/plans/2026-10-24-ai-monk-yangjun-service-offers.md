# Yangjunの公開サービス価格をDatabaseとCLIへ反映

## 目的・範囲・完了条件

既存Yangjun recordの価格が無いUGC総称だけの状態から、公式Collabstrに掲載された11のサービスメニュー名・package ID・明示USD価格を日付付き観測として追加する。既存195source・全75archive/73公開profile・旧80offer観測を保持し、新source1件・offer11件だけを追加する。売上、注文、creator、AI制作、課金周期、最終Checkout総額は新たに確定しない。旧generic UGC listingも保持する。

正本はapps/landing/public/data/ai-monk-avatar-database-2026.json、呼出経路はWeb AiMonkDatabaseのカード/全offer detailsと共通検索helper、package buildの同JSONコピー、CLI getとhow_they_monetize、stdio/HTTPS MCPの既存6tool。Webは日付順の先頭2件と全offer details、CLI/MCPは全offerを返すためruntime変更は不要。

base mainは66faa51718acb4ed55daa1147e68595a277627d3、既存専用worktreeのbranch feat/ai-monk-yangjun-service-offers-20261024で進める。DB差分とpackage/lock/serverの0.4.13、READMEの196source・新価格説明・導入URLだけを揃える。新framework・依存・backend・plugin payload・既存投稿/共有wallet・認証/課金設定は変更しない。価格をサービスの成果・売上・医療的効能へ拡張しない。

根拠はhttps://collabstr.com/yangjun のHTTP200公開capture。11のService OfferはpriceCurrency=USDを明示し、DOM package title/ID/表示額と一致する。private取得正本 → ~/.local/state/life-manager/ebook/evidence/ai-monk-next-product-source-20261024/research-readback.json。Li ShenのTributeは価格を取得できず、追加しない。

## 受入順

- [x] SOURCE: 未追加の1source/11offerを検出する最小assertionのRED→追加→GREEN、旧観測保持、金額とnull維持、既存package15test・helper/render15testを確認する。取得者とは別のfresh read-only検証でraw/構造化通貨/DOM/旧record保持を照合する。
- [x] MAIN: source receiptとspec/current cursorを保存し、commit/push・CI・PR/mainを受入する。
- [x] PUBLIC: 固定main由来の新v0.4.13 artifactを既存Release手順で公開し、公式digest/匿名download/URL導入・CLI/実stdioとHTTPS各6tool、公開JSON/Webの73件・196source・11新offer、Registry exact version active/isLatestを確認する。旧Release・証拠を上書きしない。
- [x] RECORD: 公開結果を新receiptへ保存し、正本を最新の未完cursorへ進めてmainへ統合する。正式Plugin掲載、Factory課金/実生成/本人IG投稿、USD10K MRRの未完を保持する。


SOURCEは1source/11offerのRED→GREEN、package15/helper-render15、raw/DOM/JSON-LD/旧観測保持の独立27項目PASS・Blocking0で受入する。検証者の初回public件数probeはschema型誤認による誤検知で、原記録を保持した訂正で73件と4/69/2を確認する。実装は不変。source結果 → ../../evidence/ai-monk-yangjun-service-offers-source-20261024.json。正式公開はMAIN/PUBLICの後続受入で判定する。


## 公開受入

source PR667/main7a201619be67f6e06008d657ff8ccedb6e18091b、Release422527725/asset671319698、65,191bytesの公式digestと匿名downloadを確認する。公開URL導入のCLIと別担当の実stdio各6tool、本番HTTPS各6toolは同じsnapshotを返す。公開Webは73card/71画像/196source、Yangjun詳細の新11価格、公開JSONは498,088bytesの正本と完全一致する。stdio/HTTPS全responseの元bytesも775,554bytesで一致する。Registry40064992351 SUCCESSとexact GET active/isLatestを確認する。証拠 → ../../evidence/ai-monk-cli-mcp-v0413-release-20261024.json。

GitHub immutable=false、Netlify commit_ref=nullは保持し、固定main/digestとGHA/title/公開snapshotの相関を区別する。新しいviewport試験は主張しない。初回Web probeはローカルpython3のscrapy importで通信前に失敗し、既存pipx interpreterへ合わせる。source変更やdeploy再送は0。今回の公開unitを完了とし、全体の未確認商品/収益・正式Plugin掲載・Factory提供とMRRは未完のまま、既存書籍のX販売導線へ進める。
