# The Art of AI Monks 日本語版の販売公開

## 目的と完了条件

既存の日本語全文と60頁PDF/EPUBを、既存Anicca landingとStripe Checkoutから購入・納品できる状態にする。全文は引き続き無料GitHubで公開し、有料9.99 USDは整形済みPDF/EPUBで研究を支援する購入だと明示する。売上・利益・bestsellerは実績が得られるまで主張しない。日本語販売ページ、正確な本番SKU/price、言語・版を照合する納品、main/Netlify反映、公式readbackを確認する。実購入・支払済み本番納品・注文・売上は別の成果として未確認を保持する。

## 方式

- 既存の原稿・source manifest・英語版を維持する。日本語原稿SHAは `7c127015dc3e9ee2f8c4230010909b6beadc1940da5d46e0eade019e3ea3a5e7`。
- 日本語EPUBは当初9,351,338 bytes。既存の非streaming納品に適した大きさへ収めるため、導入済みFontToolsで本文に必要な日本語フォントglyphを残し、ASCIIとlicense metadataも保持する。日本語文字・EPUB構造・引用先を再照合する。
- 現行の英語版と同じ `ai_monk_book` product分類を使い、言語 `ja`、SKU `art_of_ai_monks_ja_v1`、独立したStripe product/priceを固定catalogへ追加する。`jp`は既存Reset用の別契約なので本書へ流用しない。clientがprice・SKU・納品先を選べない仕様を守る。
- Checkoutは言語に対応する固定catalogのみで作成する。downloadはStripe公式sessionのcomplete/paid/live/payment、product・language・SKUを照合し、その版のPDF/EPUBのみを返す。requestの言語・SKUで権限を上書きしない。
- 日本語URLは `/the-art-of-ai-monks/ja`。既存英語ページと購入componentを最小限共有し、言語切替、無料全文、書籍の内容・頁数・10章・4worksheet、購入後のdownload案内を明確にする。比喩・問いかけの販売コピーは使わない。
- 既存API pinと署名検証を維持する。新しいメール配信、DB、依存、アカウント、決済手段は追加しない。新規契約費用とself-purchaseは0。

## 順序更新

旧順序: 公開UI修正 → remote MCP → 日本語書籍の販売公開 → factory残作業。
新順序: 公開UI修正 → 日本語書籍の販売公開 → remote MCP → factory残作業。画像追加調査は並行する。
理由: 日本語全文・formatのsource acceptanceが揃い、英語版で稼働する既存購入経路へ接続すれば販売可能な成果を閉じられる。remote MCPのsourceは専用branchへpush済みで保持し、公開plugin申請には別の外部必須条件が残る。進行中のprovider effectへ触れない。

## TODOと現在cursor

- [x] EPUBを必要glyphのフォントで生成し、納品可能なsize・全文字・引用・構造を確認する。3,048,258 bytes、base64 4,064,344 bytes。両fontに全原稿文字とASCIIが残り、全XHTML・PDF・HTMLは変更前と一致する。
- [x] Stripe既存catalogを公式GETで照合し、日本語版のproduct/priceを重複なく登録する。`prod_VUVvsa1587Elri` / `price_1UTWtpEeDsUAcaLSV3fRzwl9`。公式GETでlive/active/USD999/one_time/SKU/lang一致を確認。
- [x] 言語固定Checkout/納品と日本語ページを実装し、最小の失敗テストから確認する。購入copyはJAなのにEnglish表示する失敗を確認して修正。
- [x] 英語版/既存Reset・Letterを含む関連契約、CI、main、Netlifyを確認する。source CI39882333826、main f2ab81fd、Netlify39882793550が成功。
- [x] 公開日本語ページと未払いCheckout/保護を公式readbackし、実注文/支払済み納品の未達を記録する。JAのlive固定価格999 USD cents、PDF/EPUB未払い403、private直URL404、canary expired/unpaidを確認。

現在cursor: 日本語版の販売公開と未払い保護の確認は完了。実購入・売上・paid本番納品は未達として保持する。次は既存remote MCP/ChatGPT pluginのsourceと公開経路を進め、画像調査はUI planの並行cursorを継続する。

### Checkout/納品のsource検証

日本語Checkoutと実PDF/EPUB bytesのテストが未対応を理由に3件失敗することを確認し、固定catalogを英語・日本語へ拡張した。13件のbook契約と既存Reset/Letterの関連契約を含む26件がPASSする。paid/live/payment・商品・言語・SKUを照合し、queryの版指定を無視する。

### ページと関連契約

既存ENページを共通componentへ移し、JA route・言語切替・正確な版/頁数/価格・無料全文を追加した。英語ページの比喩見出しも直接的な内容へ置換した。DBから両版へリンクする。37 testsがPASSする（book Checkout/実bytes納品/保護、既存Reset・Letter、両版SSR/metadata、DB契約）。Landing CIの既存book stepへSSR4件を加える。full buildはCIで確認する。元のJA PDF/EPUB・引用先・原稿は変更しない。

### 統合と独立検証

PR563のsource `418298e8825e7a3c711a16649af09084af8a0afc` はLanding CI39882333826が成功し、main `f2ab81fd273509cbb82580c94e0cbfefa53baad3` へ統合する。fresh-context read-only検証は指摘0、book/Reset/Letter/page30件とWriter20件PASS、不正session68件の拒否、query版上書き4件を反証する。報告は `docs/evidence/ai-monk-ja-payment-source-review-20261023.json`。GitHubの日本語全文は認証なしGET200・原稿SHA一致を確認する。本番Checkout/納品の証明はdeploy後の別receiptとし、localの結果で置き換えない。

### 本番readback

日本語ページ・価格・無料全文・10章・60頁表示・canonical/言語alternate・EN/JA切替・1440/390/320px・client error0を登録browserで確認する。原稿全文は認証なしGitHub GET200・SHA一致。未払い確認用Checkout1件を公開functionから作り、Stripe公式GETでlang/SKU/price/payment/live/999 USD centsを照合し、PDF/EPUBの未払い403と直URL404を確認してexpired/unpaidにする。実決済は行わない。公式全pageの最新snapshotは有料注文EN0/JA0。証拠 → `docs/evidence/ai-monk-book-ja-production-20261023.json`。
