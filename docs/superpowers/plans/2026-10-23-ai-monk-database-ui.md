# AI Monk Databaseの一覧UIとプロフィール画像

## 目的・範囲・完了条件

Daisの公開画面への指摘に従い、見出しを `AI Monk Database` に統一し、全プロフィールをアイコンで識別できる一覧へ直す。比喩・問いかけを使わず、名前、アカウント、公開数値、言語を比較しやすくする。既存の75レコード、検索・絞り込み・並べ替え、出典と未確認表示、記事・書籍・公開データへの導線を維持する。コード、必要な検証、main統合、Netlify反映、公開画面の確認までを今回の完了条件とする。

## 設計

- 参考: [AvatarFactory](https://avatarfactory.io/ai-influencers) の顔・名前・handle・audienceをまとめるカード、[Virtual Humans](https://virtualhumans.org/#influencers) の人物中心の一覧、[Futurepedia](https://www.futurepedia.io/ai-tools) の分類と件数。コピーや収益主張は流用しない。公開される成果指標は未取得で、UI構成の参考として扱う。
- Mobbinは接続toolとplugin検索を確認するが利用可能な連携は見つからない。公開検索カテゴリとSemrushの個別画面を既存ブラウザで確認し、ロゴ・名前・主要情報を揃えたカード、件数とsort、一覧の横のfilterを観測する。取得状況と参照点は `docs/evidence/ai-monk-ui-reference-research-20261023.json` に記録する。
- 小さい見出し・一文の説明の直下に検索とフィルターを置く。白地、明確な境界、デスクトップ3列・中間2列・モバイル1列で表示する。大きな装飾heroは除く。
- 全カードに64px以上のプロフィールアイコンを置く。アカウントとの対応を確認できる公開プロフィール原画像を優先し、ローカルに原bytesを保存する。画像の取得元、対応ID、取得日、hashを記録する。第三者画像をCC BY対象にしない。
- 未取得の画像には名前から作るイニシャルを表示し、実写真と偽らない。読み込み失敗時もイニシャルへ戻る。人物画像を生成して補完しない。
- AI分類、丸め値、取得日、地域情報の根拠、数値の出典は保持する。最大の単一プラットフォームaudienceによる既存順位を変えない。商品価格・自己申告・売上を混同しない。
- 文言はcopywriting指針 `taste-skill/references/copy.md` に従い、名詞の見出し、具体的な説明、短い操作名を使う。追加npm依存やbackendは作らない。

## 順序と現在cursor

旧順序: remote MCPの公開 → 日本語書籍の販売整備 → factory復旧。
新順序: 今回のUI修正 → remote MCPの公開・日本語書籍・factoryの残作業。
理由: Daisが公開ページの理解しにくさと全プロフィールのアイコン不足を具体的に指摘しており、現在の公開入口を先に直す。remote MCPのsourceは専用branchにpush済みで保持し、進行中のprovider effectへ触れない。

- [x] 現行実装・データ契約・参照サイトを確認し、仕様を更新する。
- [x] 参照記録と原画像を収集する。75件のID対応と7画像のhash/sizeを確認し、未取得68件を明記する。
- [x] 直接的なコピーとコンパクトな一覧、全件アイコンを実装する。
- [x] 画像有無・既存根拠表示の最小テスト、既存検索契約、landing CIを確認する。
- [x] mainへ統合し、Netlifyと公開画面・画像を確認する。
- [ ] 未取得68件の画像を引き続き個別に照合し、確認できた分を追加する。

現在cursor: レイアウト・コピー・全75件のアイコン表示はPR #560でmainへ統合し、Netlify run 39879488202と公開ブラウザで確認する。7画像は全てHTTP200と原hashを照合、68件はイニシャル。検索（同名別handleの2件を保持）、媒体別handle/数値、AI状態filter、clear、0件、詳細、画像失敗fallbackはPASS。1440/390/320pxで横はみ出しなし、client error0。根拠 → `docs/evidence/ai-monk-database-ui-production-20261023.json`。次は68件の追加画像収集と、保留したremote MCP・日本語書籍・factoryの各残TODOを進める。実画像の全件取得・網羅的な調査・収益達成は未完。
