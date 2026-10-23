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

順序変更: 旧cursorは73画像の公開だった。Daisが水彩/イラストを除きAI monk video avatarsへ絞るよう指定したため、scope修正→画像sourceの統合→本番確認へ変更する。既存Postiz/HeyGen effectは中断・再送しない。現在cursorはscope PRのCI確認とmain統合。source証拠 → `docs/evidence/ai-monk-avatar-scope-source-20261023.json`。

## 追加範囲: ビジネス指標を主役にする

Daisの追加指示に従い、WebのAI status badge/filter/説明枠を削除し、フォロワー・動画再生・商品・売上をcard上で比較する。AI生成根拠は原研究dataに保持し、全候補を新たに認定したとは扱わない。名称はDatabase=`AI Monk Database`、Agent=`AI Monk Factory`、英語書名=`The Art of AI Monks`、日本語書名=`ヤング・ムンの衝撃 - AI僧侶ビジネスの最前線`。書籍の最小修正は別担当が所有する。

Web/CLI/MCPのsortへviews/revenueを追加する。followersは現在の最新source snapshotの単一platform値、viewsは調査した単一動画の最大観察値、revenueはUSDの3か月gross revenueとして記録された値に限定する。月次売上・利益・買収提示・商品価格・seller counterを売上へ混ぜない。一次出所を再読するとColumbiaの30万USD超は「made」という収益申告で、gross/netの区別がない。比較欄にはVirtual Humansが報じるYang Munの3か月gross revenue 213,000USD超のみを、期間・下限・本人申告・非監査・出所付きで構造化する。30万USDの既存claimは詳細へ保持する。不明は0へ変換せず末尾へ。表示金額はsourceの当時の申告であり、現在の月商や利益を推定しない。

Sensor Towerの指定app URLは取得がtitleのみ。公開公式siteのApp Performance Insightsと、MobbinのSquareの期間/金額/ソート列を参考に、期間と根拠を見える位置へ置く。推定売上の独自modelや新規有料providerを導入しない。追跡はsource/date付きのsnapshotを蓄積する既存research経路を継続し、定期更新の自然実行は未完として残す。

- [x] UIのAI status非表示、再生/売上の型・比較基準を失敗test3＋CLI 1件で確認。
- [x] 既存sourceから売上観察を構造化し、共通sortとcard表示を最小実装。関連12＋13テストPASS。
- [ ] 関連テスト/CI/main/公開readbackとv0.3.0配布物に新sortを反映。

現在cursorはビジネス指標の追加。PR572のscope修正にこの指示を反映し、source CIを更新してからmain統合する。画像PR571は続けて統合する。
