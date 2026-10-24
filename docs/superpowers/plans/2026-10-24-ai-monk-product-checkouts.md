# AI Monkの未確認商品価格の限定精査

## 目的・範囲・完了条件
価格/通貨が未確認の既知商品について、公式seller・公開checkoutの匿名表示だけを確認し、確定できる新しい観測をWeb/CLI/MCPへ同一snapshotで配る。主対象はMonje Wu「La Mente del Monje」、El Maestro Lin「El Código Prohibido」、Ling HaoのHotmart商品で、リンクされた公開checkoutまでとする。会員登録・cart変更・個人情報入力・購入・有料API・日次投稿は0。未知の売上・実在庫・会計通貨・手数料・商品の効能を推測しない。

最新main 1f32dfda92010bdb19e92a5080b999443a9f1497由来のbranch feat/ai-monk-product-checkouts-20261024を既存のprimary専用worktree /Users/anicca/Projects/anicca-products-worktrees/ai-monk-plugin-v012-20261024で使う。既存未追跡 .codex/hooks.json と他者の変更は触らない。現在の188sources/75archive/73publicと既存全観測を保持し、旧null/通貨不明の観測を上書きせず日付付き観測から参照する。

## 順序・所有
primaryが正本・seller2件・data/source受入・公開を所有する。read-only研究者はLing Haoの公開Hotmart商品/リンク先とprivate raw取得証拠だけを所有し、repo/credential/browserへの変更をしない。独立取得を並列化し、既存日次ownerとOpenAI申立て/Muse審査を中断・重複させない。現在cursorは公式公開価格の精査。前のPL-1は正式appeal受理とMuse要件3/3の保存まで進み、掲載自体は未完のまま維持する。

- [ ] SOURCE: crwl本文とraw HTML/HTTP/最終URL/取得時刻を保存し、商品名とISO通貨/金額/地域/offer variantを照合する。全取得失敗や表示限定なら具体的な未確認を記録する。
- [ ] DATA: 根拠が成立した対象だけ、新source・日付付きoffer観測を追加する。新観測欠落の一時assertion RED→最小data差分→GREENと既存関連検証を実行する。runtime/parser/依存の追加はしない。
- [ ] PUBLIC: data差分があればv0.4.11へmetadata/READMEを揃え、必要な既存CI/main由来Web・固定main Release/URL導入/stdio/HTTPS各6tool・Registryを受入する。旧v0.4.10/receiptは変更しない。data差分がなければ根拠と不足のreceiptだけをmainへ保存し、不要なversion/releaseを作らない。

## 適用判断
executing-plansの承認停止・model指定・固定全suite/workspace追加と、project AGENTSの固定3検索/自動memory保存は、DaisのNo-human-loop・UIモデル継承・最小検証・必要範囲検索とdeveloperのmemory更新制限を優先する。primaryが既存の関連検証を選び、記録は本planと新receiptへ集約する。新supervisor/恒久test基盤/新しい収益保証は作らない。金融的に重要な不確実な主張が必要ならglobalのfresh read-only照合を優先し、不要な追加review gateを発明しない。


## SOURCEの取得結果とDATA契約
公式seller2件とリンク先Hotmart checkout、Ling Haoの公式marketplace/cartを匿名取得する。Monje Wu主商品19.99 USD/JP3309 JPY、Maestro Lin17 USD/JP2814 JPY、Ling Hao9.99 USD/JP1654 JPYを、同一商品IDとexchange.baseValue/baseCurrency・paymentMethods.amountの明示ISO通貨から確認する。換算途中のconvertedValueを最終表示額と混同しない。Monje Wuの同checkoutで見つかる別商品「La Biblia de la Meditación」は5.99 USD/JP992 JPYの未選択追加商品で、主商品代に含めない。この同じ既存profileに属する追加販売経路も今回の範囲に含める。

確定差分は3sourcesと4日付付きoffer観測、旧188sourcesと全既存観測は保持し、新191sources/75archive/73public、offer archive78行/公開75行を目標とする。各主商品は旧observation_idを参照し、追加商品は同じ商品とは扱わず任意addonであることをnotes/availabilityに明示する。billing recurrenceはNORMAL型から推測せずnull。USDはconversion baseでありUS checkoutの実表示・会計通貨ではない。匿名JP表示額はpresentment_priceに分離する。新しい売上・所有者認定・効能・private contact/checkout tokenは追加しない。
