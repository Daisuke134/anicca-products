# 日本語書籍の購入表示名

## 目的・範囲・完了条件

Dais指定の日本語書名「ヤング・ムンの衝撃 - AI僧侶ビジネスの最前線」を、公開page・本体だけでなく既存Stripe商品の購入表示にも合わせる。実checkout呼び出しは既存price IDを使い、productのnameは旧「The Art of AI Monks — 日本語版」のままという公式GETを確認する。

対象は既存product `prod_VUVvsa1587Elri`のnameだけ。既存price `price_1UTWtpEeDsUAcaLSV3fRzwl9`、USD999、SKU、product ID、購入backend、他商品、決済/顧客stateは変更しない。新規商品・価格・購入・課金は作成しない。credentialはprivate SSOTのexact serviceから読み、値をrepo/logへ複製しない。

公式account/product/price GETのpreflight、idempotency付きname更新、公式product/price GETのreadbackで表示名と固定価格契約を確かめる。POSTの効果が不明なら再送より公式GETを先に行う。sourceの価格契約はPR573の17testsとCIを継承する。

- [x] 公式GETでaccount/product/priceを照合し旧書名とUSD999を確認。
- [ ] 同じproductのnameを指定書名へ更新。
- [ ] 公式GETで新nameと既存price/ID/active/liveを確認し、receiptを記録。

現在cursorは既存productの表示名更新。
