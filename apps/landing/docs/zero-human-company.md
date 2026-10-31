# 運営本の販売・納品契約

目的は、Anicca の実際の運用から一般化した「ゼロヒューマン会社の運営本」の通常版を USD 29、テンプレート版を USD 99 の一回払いで販売すること。会社の無人稼働、利益、権限の自動取得を保証しない。現在の故障や手動対応が残る事実を本文と販売ページに明記する。

## 商品と納品

- `ops_playbook` / `standard`: 日本語の本文PDFとMarkdown。USD 29。
- `ops_playbook` / `templates`: 同じ本文PDFとMarkdownに、役割契約・タスク正本・効果台帳・予算設定・引き継ぎ・日次報告の編集可能なテンプレートZIPを付ける。USD 99。
- 販売URLは `/zero-human-company`。Stripe の既存 live account の Payment Link から同ページに session_id 付きで戻す。
- 既存 `ebook-download` だけが private/ebooks から商品を配信する。完全な支払い済み live payment session、商品metadata、edition、USD の請求額が一致する場合だけ返す。通常版から上位版ZIPは取得できない。
- 支払いを実行していない本番Checkout到達は、実売上や完了した本番決済と報告しない。
- 納品は支払い後ページから即時取得する。メール配送や将来の機能・運用代行は販売範囲に含めない。

## 参照と模倣

- 価格と通常版/上位版の構成は担当正本 `Daisuke134/anicca-ops team/PLAN-10K.md` を使う。
- 一次資料: Alex Ellis「My first eBook - results and feedback」 https://blog.alexellis.io/my-first-ebook-results-feedback/ 。本人記事が、本文のみ25ドル、設定ファイル等付き50ドル、動画付き99ドルの明確な差別化と、27日で売上1万ドル到達を報告する。模倣するのは本文と実用品のtier分け・成果物見本・明確な受け取り方。第三者の売上をAniccaの売上として使わない。
- Anicca の内部 RULES / PRODUCT-LOOPS / LOOPS を読み、個人情報・credential・private URL・内部room ID・実在する顧客情報を商品へコピーしない。本文は公開可能な運用原則と架空例に作り直す。
- 計測はPayment Link別のCheckout件数・実支払いreceipt・返金receiptを区別する。実購入がない段階は売上 unknown と記録する。

## 実行と受入

- [x] 既存Stripe accountと既存電子書籍のprivate配信経路を照合。
- [x] 未払い・通貨違い・低額・tier違いを拒否する最小テストを先に失敗させ、既存回帰を含む10件をPASS。
- [ ] 本文とテンプレートを制作してPDFの見た目と内容を検証。
- [ ] liveカタログとPayment Linksをidempotencyキー付きで作成しGETで照合。
- [ ] private納品gate、LP、最小の関連回帰をPASS。
- [ ] 専用branchをpushしてPR/main統合、main由来のNetlify公開を公式readback。

Capafyの価格変更は別のprovider境界として、`team-outbox/PAID-PRODUCTS-TASK.md` に記録する。
