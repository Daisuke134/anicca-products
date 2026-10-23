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
