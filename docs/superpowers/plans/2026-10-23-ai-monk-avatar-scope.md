# AI Monk Avatar掲載範囲

## 目的・範囲・完了条件

Daisの明示指示に従い、Yang Munのような写真に近いAI僧侶の動画avatarへ集中する。水彩・絵画・イラストの僧侶コンテンツを対象avatarとして掲載しない。既存のAI status・未確認・出典は捏造せず、未確認候補を認定済み扱いにしない。

75recordの研究archiveは保持し、掲載scopeをcanonical dataで一元管理する。既存sourceでイラスト系と分かる`kai-tsukimi`と`buddha-would-say`を対象外へ分類し、Web・CLI・stdio/HTTP MCPで検索/個別取得/集計のscopeを揃える。公開一覧73件（調査7＋未確認候補66）を今回のsource予定値とし、残候補は今後も同じ動画avatar基準で確認する。画像だけでAI生成や動画形式を断定しない。新しい分類用frameworkや外部serviceは追加しない。

H1は`AI Monk Database`を保ち、説明文はAI monk video avatarsを直接示す。OGの水彩illustrationも対象avatarの実画像へ替える。画像PR571は候補75件の原画像coverageであり、AI avatar認定とは分離する。book/記事の過去snapshotを現在の対象件数に書き換えず、今後の改稿・制作はこのfocusを採用する。

完了条件は対象外2件がWeb/CLI/MCPの検索・個別取得・集計へ出ないこと、75record/AI status/出典を保持すること、関連テスト・CI、本番WebとMCPのreadback、更新CLI配布物の公式取得である。旧v0.1/v0.2配布物は過去snapshotとして保持する。

## TODO・現在cursor

- [x] 最新main専用branchでspec/planを更新しpush。
- [x] 対象外2件の検索・集計・SSRの失敗テスト3件を確認。
- [x] dataのscopeと共有selector、Web/CLI/MCP/copy/OGを最小変更。関連9＋12テストPASS。既存75record/48sourceの内容と依存package recordは不変。
- [ ] 関連テスト・source確認・CI、main統合と本番Web/MCP確認。
- [ ] 更新CLI配布とspec/evidenceへ反映。

順序変更: 旧cursorは73画像の公開だった。Daisが水彩/イラストを除きAI monk video avatarsへ絞るよう指定したため、scope修正→画像sourceの統合→本番確認へ変更する。既存Postiz/HeyGen effectは中断・再送しない。scope sourceはPR572/mainへ統合済み。本番確認は継続中。source証拠 → `docs/evidence/ai-monk-avatar-scope-source-20261023.json`。

## 追加範囲: ビジネス指標を主役にする

Daisの追加指示に従い、WebのAI status badge/filter/説明枠を削除し、フォロワー・動画再生・商品・売上をcard上で比較する。AI生成根拠は原研究dataに保持し、全候補を新たに認定したとは扱わない。名称はDatabase=`AI Monk Database`、Agent=`AI Monk Factory`、英語書名=`The Art of AI Monks`、日本語書名=`ヤング・ムンの衝撃 - AI僧侶ビジネスの最前線`。書籍の最小修正は別担当が所有する。

Web/CLI/MCPのsortへviews/revenueを追加する。followersは現在の最新source snapshotの単一platform値、viewsは調査した単一動画の最大観察値、revenueはUSDの3か月gross revenueとして記録された値に限定する。月次売上・利益・買収提示・商品価格・seller counterを売上へ混ぜない。一次出所を再読するとColumbiaの30万USD超は「made」という収益申告で、gross/netの区別がない。比較欄にはVirtual Humansが報じるYang Munの3か月gross revenue 213,000USD超のみを、期間・下限・本人申告・非監査・出所付きで構造化する。30万USDの既存claimは詳細へ保持する。不明は0へ変換せず末尾へ。表示金額はsourceの当時の申告であり、現在の月商や利益を推定しない。

Sensor Towerの指定app URLは取得がtitleのみ。公開公式siteのApp Performance Insightsと、MobbinのSquareの期間/金額/ソート列を参考に、期間と根拠を見える位置へ置く。推定売上の独自modelや新規有料providerを導入しない。追跡はsource/date付きのsnapshotを蓄積する既存research経路を継続し、定期更新の自然実行は未完として残す。

- [x] UIのAI status非表示、再生/売上の型・比較基準を失敗test3＋CLI 1件で確認。
- [x] 既存sourceから売上観察を構造化し、共通sortとcard表示を最小実装。関連12＋13テストPASS。
- [ ] 関連テスト/CI/main/公開readbackとv0.3.0配布物に新sortを反映。

現在cursorはビジネス指標の追加。PR572のscope修正にこの指示を反映し、source CIを更新してからmain統合する。画像PR571は続けて統合する。

## Source統合

PR572の最終head `bb7c9913fea918432117fe19e01869dd1e2efe5f`はpackage CI39890899008・landing CI39890899070 PASS。別fresh contextのread-only検証者が実SSR/CLI/共用MCP関数と売上原典・比較probeを確認し、確実な実害のある指摘なし。main merge `9e9f321ac7f054bf760b84f4cb5c20b3041f9c11`。

画像PR571はmain `532e18464b28c78b4b13399b824029cec8e8cdcb`へ統合。研究archive原画像73件のうち、公開対象は71画像＋未取得2件。deor.ieの1件はplatform default iconで、AI動画avatarの認定画像として数えない。

書籍PR573はCI39891424243 PASS、main `3085d15b5ab7aaf661acc6cec4a322337040f2ec`へ統合。JAの指定題名・新表紙と日英の制作対象を揃え、価格/SKU/購入backendを維持。独自book planの本番確認を続ける。

現在cursor: Netlify反映と公開readback。並行して、取得できた4つのpublic Instagram headerと3つのYouTube metadataを、旧観察を保持するdated snapshotとして追加する。現時点で毎日の自然更新や売上追跡の完全性を完了扱いにしない。

## 定期更新

既存のCreator/ebook記事loopは記事制作を所有し、日々のdatabase指標更新を所有するDesktop automationは見つからない。指標更新は現在threadのheartbeatを毎朝9時Asia/Tokyoで1つ作成し、既存記事/動画producerやPostiz effectを重複起動しない。新しい常駐supervisor、agent framework、model固定、paid APIは追加しない。

対象は同じAI monk avatarのpublic followers/subscribers・sampled video views・商品/価格/導線・根拠のある売上申告。人気と商品導線のある対象から進め、source identity・観測日・期間・丸めを保持する。unknownを0にせず、異なる期間/通貨/利益を売上へ変換しない。取得不能なら未取得理由を記録して独立したsourceへ進む。既存のrepo source acceptance/CI/mainと公開readbackを使う。所有者とleaseが競合するeffectを重ねない。自然な初回の定期実行は未来のため、設定作成・今回の手動収集と区別する。

- [ ] 毎朝9時のthread heartbeatを作成しprovider設定をreadback。
- [ ] 初回定期runで日付付き更新または具体的未取得理由と公開状態を確認。
