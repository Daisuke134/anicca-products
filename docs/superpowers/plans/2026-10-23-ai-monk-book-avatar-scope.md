# AI僧侶書籍の制作対象と日本語書名の修正

## 目的・範囲・完了条件

制作対象をYang Mun型の、写真に近い話すAI僧侶動画avatarへ限定する。水彩・イラスト・絵画系は制作対象外。Kai Tsukimiは中核制作例から外し、商品導線の比較を残す場合は対象外の隣接比較と明記する。Buddha Would Say等の過去研究snapshot、75record/48source、32参照、AI statusと出典は維持する。

英語書名は `The Art of AI Monks` のまま。日本語書名は指定どおり `ヤング・ムンの衝撃 - AI僧侶ビジネスの最前線` とし、JA原稿・catalog・HTML/PDF/EPUB・表示ページmetadata/coverへ反映する。英語表紙と既存商品は保持する。JA表紙は既存装画を基に題名を合わせた専用assetとする。装画は研究対象のプロフィール画像やAI分類の証拠として扱わない。

所有: 日英原稿、対応source/translation manifestと既存builder由来PDF/EPUB/HTML/receipt、JA catalog表示title/cover、JA表示のための既存共有book pageとbuilderの必要最小箇所、JA専用表紙、本計画と修正evidence。

禁止: 購入backend、価格/currency/SKU/id/slug/Stripe product/price、認証、外部provider操作、記事、DB/UI、profile画像、旧research snapshotの書換、他者変更のrevert。main統合・本番反映はrootが所有し、この担当はPR作成/attachとCI報告で停止する。

## 基点と既存経路

- remote: `https://github.com/Daisuke134/anicca-products.git`
- base: `8df0a1b26e68bbb0196802a3be08384ae84058fb`（作成時の最新origin/main）
- branch: `fix/ai-monk-book-avatar-scope-20261023`
- worktree: `/Users/anicca/Projects/anicca-products-worktrees/ai-monk-book-avatar-scope-20261023`
- ネイティブworktree toolは会話cwdをrepoと認識しないため、Git worktree fallbackで分離。cleanを確認する。
- 原稿→source/translation SHA guard→既存 `apps/landing/scripts/build-ai-monk-book.py --language en|ja` →private PDF/EPUB/HTML・catalog/receipt。
- JA pageはcatalogから共有 `AiMonkBookPage` へ渡る。見出し・metadata・構造化dataはcatalog title、coverは現状英語共通assetを参照する。
- 既存SSR/固定購入・納品契約17testsはbaseline PASS。既存pandoc/WeasyPrint/Poppler/Noto/fontToolsを使い、新規依存を導入しない。
- repo旧dev開始・固定3検索の手順より、今回のlatest main・監査済み最小修正指示を優先する。

## 最小変更

1. この計画を先にcommit/pushし、remote object一致を確認。
2. 日英原稿の定義（旧92行）、Kaiの概要/台本比較/商品表/実践参照（旧72/240/289/459行）だけを修正。JA H1を指定書名へ変更。歴史・未確認説明・出典・archive数値は保持。
3. JA専用coverとcatalog表示title/coverの経路を合わせる。英語表示・表紙と決済契約は不変。既存builderのcover選択だけをcatalogへ合わせる。
4. 原稿SHA/文字・語数とsource/translation manifestを更新し、参照とsnapshotの内容不変を照合。既存builderで両言語を再生成。
5. 既存17tests、32参照/95引用・10章/4sheet、EPUB構造/言語/title/cover、PDF title/font/抽出・表紙と変更付近の紙面を確認。価格/SKU/id/slug/currency/Stripe fieldsと記事/DB/profile画像/購入backendの不変、diff check、公開ファイルsecret scanを確認。
6. 対象pathだけcommit/pushしてremote一致、PR作成/attach。正確なhead/CI/変更・未完を報告し、rootへ統合と本番を引き継ぐ。

## TODO / 現在cursor

- [x] 最新main・remote・他worktree所有・cleanを確認。
- [x] 既存builder/guard/catalog/page/生成物/関連17testsを読む。
- [ ] 計画を先にcommit/push、remote一致。
- [ ] 最小原稿修正とJA書名/表紙経路の一致。
- [ ] manifestsと両言語生成物を更新、必要最小の確認。
- [ ] 限定commit/push・PR作成/attach・head/CI報告。

現在cursor: 計画の先行commit/push。購入/Stripe/記事/DBを編集しない。
