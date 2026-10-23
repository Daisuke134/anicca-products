# AI Monk 商品価格・通貨の追加観測契約（v0.4.6）

Kaelの後続観測・現行追加契約 → 2026-10-24-ai-monk-kael-currency.md。本書はv0.4.6のsource受入契約として保持する。

## 目的・範囲・完了条件

DB-1の既存4商品系統に対する公開一次資料の追加観測を、canonical JSONとWeb・CLI・MCPの同一snapshotへ反映する。確定するのはBeetroot Capsules、Remedios Olvidados、Monge Ravi two-ebook bundleの価格・ISO通貨である。Kaelの$27はISO通貨不明を保持する。既知73公開/75archiveとAI状態・言語・画像・指標・収益観測を変更しない。

source受入は新規3資料と既存source参照、価格の種類、base/presentmentの分離、未知値保持、既存関連test/buildと実stdio6toolを確認して判定する。本番公開・immutable v0.4.6 Release・Registry・公開readbackはprimaryが所有し、source完了から公開済みとは導かない。旧v0.4.5 Releaseを変更しない。

## データ契約

- Beetrootは公式product JSONのvariant 51739327430929 / Default Title / VOX4BEETの一回購入29.99 USDを既存offerへ適用する。毎月配送26.99 USDと比較価格44.99 USDは別metadataに保持する。USDは匿名の既定storefront/US responseで観測した通貨であり、merchantの会計通貨まで確定したとは扱わない。Moringaアップセル24.99を採らない。
- Remedios Olvidadosは既存observation `remaining-ananta-remedios`を維持し、tempiovitaとmaestroanantaの両accountへ同じbase offer9.99 USDを適用する。公開LPの`pago único`を一回払いの根拠にする。HotmartのJP presentment1654 JPYを別metadataで保存する。
- Monge Raviセットは既存observation `remaining-ravi-duo`を維持し、offer `w7hjj3yf`のbase offer60 BRLを適用する。JP presentment1992 JPYを別metadataで保存する。単品合計と30%割引から価格を計算しない。継続周期の明示は未確認のまま保持する。
- base offerは数値`price`と`currency`、`price_kind: base_offer_price`、notesで意味を示す。Webの既存2価格表示にもBase priceを明記し、localized価格と誤認させない。CLI/MCPは同じoffer metadataを省略せず返す。
- 新規3sourceは正式公開URL・取得時刻・元公開responseのSHA256・短い根拠だけを公開する。元HTML/JSONやcheckoutの匿名一時token/public連絡先はrepoへコピーしない。既存sourceは歴史として内容を変更しない。現行offer/unknowns内の古い価格不明・通貨不明だけを新観測に合わせる。
- Kaelは27/通貨nullを保持し、今回のGET200 shell、公開OG、DDG202確認画面という再取得境界を新しいevidenceへ記録する。Linktreeの他スポンサーUSDを流用しない。
- 価格を注文、売上、利益、commission、効能、creator権利やAI確定へ変換しない。個人情報入力、申込、購入、外部メッセージは0。

## 入力・所有

private観測正本: `/Users/anicca/.local/state/life-manager/ebook/evidence/ai-monk-product-price-followup-20261024/observations.json`。directory700/file600、元body hashを照合する。専用worktree `/Users/anicca/Projects/anicca-products-worktrees/ai-monk-product-prices-v046-20261024`、branch `feat/ai-monk-product-prices-v046-20261024`、base main `5ca8138d87e778904935621235d194423ead32fc`。公開済みv0.4.5の比較baselineはmain `2cfc70e2c706ef7d697dbe30b47e319d4c28b3c1`の同一canonical JSONである。

変更はcanonical JSON、ai-monk-index v0.4.6 metadata/README、base価格の既存Web表示と型/既存test、今回のspec/plan/evidence、全体planのDB-1状態に限る。Factory source、Plugin0.1.2、credential/browser、本番、外部publishは触らない。他者の変更をrevertしない。追加依存・新しい価格framework・恒久的データmirroring testを作らない。

実行順・残TODO・現在cursor → `../plans/2026-10-24-ai-monk-product-price-currencies.md`。
