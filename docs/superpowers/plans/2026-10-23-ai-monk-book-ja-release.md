# The Art of AI Monks 日本語版の販売公開

## 目的と完了条件

既存の日本語全文と60頁PDF/EPUBを、既存Anicca landingとStripe Checkoutから購入・納品できる状態にする。全文は引き続き無料GitHubで公開し、有料9.99 USDは整形済みPDF/EPUBで研究を支援する購入だと明示する。売上・利益・bestsellerは実績が得られるまで主張しない。日本語販売ページ、正確な本番SKU/price、言語・版を照合する納品、main/Netlify反映、公式readbackを確認する。実購入・支払済み本番納品・注文・売上は別の成果として未確認を保持する。

## 方式

- 既存の原稿・source manifest・英語版を維持する。日本語原稿SHAは `7c127015dc3e9ee2f8c4230010909b6beadc1940da5d46e0eade019e3ea3a5e7`。
- 現在の日本語EPUBは9,351,338 bytes。既存の非streaming納品に適した大きさへ収めるため、導入済みFontToolsで本文に必要な日本語フォントglyphを残し、ASCIIとlicense metadataも保持する。日本語文字・EPUB構造・引用先を再照合する。
- 現行の英語版と同じ `ai_monk_book` product分類を使い、言語 `ja`、SKU `art_of_ai_monks_ja_v1`、独立したStripe product/priceを固定catalogへ追加する。`jp`は既存Reset用の別契約なので本書へ流用しない。clientがprice・SKU・納品先を選べない仕様を守る。
- Checkoutは言語に対応する固定catalogのみで作成する。downloadはStripe公式sessionのcomplete/paid/live/payment、product・language・SKUを照合し、その版のPDF/EPUBのみを返す。requestの言語・SKUで権限を上書きしない。
- 日本語URLは `/the-art-of-ai-monks/ja`。既存英語ページと購入componentを最小限共有し、言語切替、無料全文、書籍の内容・頁数・10章・4worksheet、購入後のdownload案内を明確にする。比喩・問いかけの販売コピーは使わない。
- 既存API pinと署名検証を維持する。新しいメール配信、DB、依存、アカウント、決済手段は追加しない。新規契約費用とself-purchaseは0。

## 順序更新

旧順序: 公開UI修正 → remote MCP → 日本語書籍の販売公開 → factory残作業。
新順序: 公開UI修正 → 日本語書籍の販売公開 → remote MCP → factory残作業。画像追加調査は並行する。
理由: 日本語全文・formatのsource acceptanceが揃い、英語版で稼働する既存購入経路へ接続すれば販売可能な成果を閉じられる。remote MCPのsourceは専用branchへpush済みで保持し、公開plugin申請には別の外部必須条件が残る。進行中のprovider effectへ触れない。

## TODOと現在cursor

- [ ] EPUBを必要glyphのフォントで生成し、納品可能なsize・全文字・引用・構造を確認する。
- [ ] Stripe既存catalogを公式GETで照合し、日本語版のproduct/priceを重複なく登録する。
- [ ] 言語固定Checkout/納品と日本語ページを実装し、最小の失敗テストから確認する。
- [ ] 英語版/既存Reset・Letterを含む関連契約、CI、main、Netlifyを確認する。
- [ ] 公開日本語ページと未払いCheckout/保護を公式readbackし、実注文/支払済み納品の未達を記録する。

現在cursor: EPUBのfont sizeを縮小する。既存9.35MBのままで納品可能とは扱わない。
