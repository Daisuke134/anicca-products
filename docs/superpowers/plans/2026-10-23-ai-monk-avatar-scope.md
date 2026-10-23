# AI Monk Avatar掲載範囲

## 目的・範囲・完了条件

Daisの明示指示に従い、Yang Munのような写真に近いAI僧侶の動画avatarへ集中する。水彩・絵画・イラストの僧侶コンテンツを対象avatarとして掲載しない。既存のAI status・未確認・出典は捏造せず、未確認候補を認定済み扱いにしない。

75recordの研究archiveは保持し、掲載scopeをcanonical dataで一元管理する。既存sourceでイラスト系と分かる`kai-tsukimi`と`buddha-would-say`を対象外へ分類し、Web・CLI・stdio/HTTP MCPで検索/個別取得/集計のscopeを揃える。旧公開一覧73件（調査7＋未確認候補66）は履歴snapshotとし、現在の公開条件は下記「未調査候補の掲載修復」で上書きする。画像だけでAI生成や動画形式を断定しない。新しい分類用frameworkや外部serviceは追加しない。

H1は`AI Monk Database`を保ち、説明文はAI monk video avatarsを直接示す。OGの水彩illustrationも対象avatarの実画像へ替える。画像PR571は候補75件の原画像coverageであり、AI avatar認定とは分離する。book/記事の過去snapshotを現在の対象件数に書き換えず、今後の改稿・制作はこのfocusを採用する。

完了条件は対象外2件がWeb/CLI/MCPの検索・個別取得・集計へ出ないこと、75record/AI status/出典を保持すること、関連テスト・CI、本番WebとMCPのreadback、更新CLI配布物の公式取得である。旧v0.1/v0.2配布物は過去snapshotとして保持する。

## TODO・現在cursor

- [x] 最新main専用branchでspec/planを更新しpush。
- [x] 対象外2件の検索・集計・SSRの失敗テスト3件を確認。
- [x] dataのscopeと共有selector、Web/CLI/MCP/copy/OGを最小変更。関連9＋12テストPASS。既存75record/48sourceの内容と依存package recordは不変。
- [x] 関連テスト・fresh source確認・CI、main統合。初回本番Web/MCPの掲載scopeと画像を確認。
- [x] 更新CLI v0.3.0をGitHub Releaseへ公開し、公開URLからの導入と73件・55出典を確認。
- [x] 最新商品previewの本番反映を確認し、最終Web readbackとspec/evidenceを保存。

順序変更: 旧cursorは73画像の公開だった。Daisが水彩/イラストを除きAI monk video avatarsへ絞るよう指定したため、scope修正→画像sourceの統合→本番確認へ変更する。既存Postiz/HeyGen effectは中断・再送しない。scope sourceはPR572/mainへ統合済み。source証拠 → `docs/evidence/ai-monk-avatar-scope-source-20261023.json`。

## 追加範囲: ビジネス指標を主役にする

Daisの追加指示に従い、WebのAI status badge/filter/説明枠を削除し、フォロワー・動画再生・商品・売上をcard上で比較する。AI生成根拠は原研究dataに保持し、全候補を新たに認定したとは扱わない。名称はDatabase=`AI Monk Database`、Agent=`AI Monk Factory`、英語書名=`The Art of AI Monks`、日本語書名=`ヤング・ムンの衝撃 - AI僧侶ビジネスの最前線`。書籍の最小修正は別担当が所有する。

Web/CLI/MCPのsortへviews/revenueを追加する。followersは現在の最新source snapshotの単一platform値、viewsは調査した単一動画の最大観察値、revenueはUSDの3か月gross revenueとして記録された値に限定する。月次売上・利益・買収提示・商品価格・seller counterを売上へ混ぜない。一次出所を再読するとColumbiaの30万USD超は「made」という収益申告で、gross/netの区別がない。比較欄にはVirtual Humansが報じるYang Munの3か月gross revenue 213,000USD超のみを、期間・下限・本人申告・非監査・出所付きで構造化する。30万USDの既存claimは詳細へ保持する。不明は0へ変換せず末尾へ。表示金額はsourceの当時の申告であり、現在の月商や利益を推定しない。

Sensor Towerの指定app URLは取得がtitleのみ。公開公式siteのApp Performance Insightsと、MobbinのSquareの期間/金額/ソート列を参考に、期間と根拠を見える位置へ置く。推定売上の独自modelや新規有料providerを導入しない。追跡はsource/date付きのsnapshotを蓄積する既存research経路を継続し、定期更新の自然実行は未完として残す。

- [x] UIのAI status非表示、再生/売上の型・比較基準を失敗test3＋CLI 1件で確認。
- [x] 既存sourceから売上観察を構造化し、共通sortとcard表示を最小実装。関連12＋13テストPASS。
- [x] 関連テスト/CI/mainを通し、本番remote MCPとv0.3.0配布物で新sortを確認。

PR572はscope修正とビジネス指標を合わせてsource CI後に統合し、画像PR571を続けて統合する。

## Source統合

PR572の最終head `bb7c9913fea918432117fe19e01869dd1e2efe5f`はpackage CI39890899008・landing CI39890899070 PASS。別fresh contextのread-only検証者が実SSR/CLI/共用MCP関数と売上原典・比較probeを確認し、確実な実害のある指摘なし。main merge `9e9f321ac7f054bf760b84f4cb5c20b3041f9c11`。

画像PR571はmain `532e18464b28c78b4b13399b824029cec8e8cdcb`へ統合。研究archive原画像73件のうち、公開対象は71画像＋未取得2件。deor.ieの1件はplatform default iconで、AI動画avatarの認定画像として数えない。

書籍PR573はCI39891424243 PASS、main `3085d15b5ab7aaf661acc6cec4a322337040f2ec`へ統合。JAの指定題名・新表紙と日英の制作対象を揃え、価格/SKU/購入backendを維持。独自book planの本番確認を続ける。

初回Netlify反映後、73原画像の公開hashと掲載71画像のnative decode、検索・sort・320/390px表示を確認する。取得できた4つのpublic Instagram headerと3つのYouTube metadataは、旧観察を保持するdated snapshotとしてPR576に統合する。毎日の自然更新や売上追跡の完全性を完了扱いにしない。

## 定期更新

既存のCreator/ebook記事loopは記事制作を所有し、日々のdatabase指標更新を所有するDesktop automationは見つからない。指標更新は現在threadのheartbeatを毎朝9時Asia/Tokyoで1つ作成し、既存記事/動画producerやPostiz effectを重複起動しない。新しい常駐supervisor、agent framework、model固定、paid APIは追加しない。

対象は同じAI monk avatarのpublic followers/subscribers・sampled video views・商品/価格/導線・根拠のある売上申告。人気と商品導線のある対象から進め、source identity・観測日・期間・丸めを保持する。unknownを0にせず、異なる期間/通貨/利益を売上へ変換しない。取得不能なら未取得理由を記録して独立したsourceへ進む。既存のrepo source acceptance/CI/mainと公開readbackを使う。所有者とleaseが競合するeffectを重ねない。自然な初回の定期実行は未来のため、設定作成・今回の手動収集と区別する。

- [x] 毎朝9時のthread heartbeat `ai-monk-database`をACTIVEで作成し、provider viewと永続設定のkind/status/schedule/current thread一致をreadback。初回定期実行は未到来。
- [ ] 初回定期runで日付付き更新または具体的未取得理由と公開状態を確認。

商品cardも観測日、またはsourceの公開/確認日を表示し、過去の価格を現在の在庫・価格と混同しない。表示のRED1件→関連12テストPASS。既存決済や売上計算のcontractは変更しない。

## 最新指標と商品preview

PR576/main `8af42e44d395a4dd4ee7d3fc8941f52c812b6001`で研究source55へ更新する。旧48sourceは不変、IG4件の丸めfollowersとYouTube3本のviews、商品2件をsource/日付付きで追加し、旧観察を保持する。UIの商品previewは観測日の新しいものを先に出し、新たに分かった具体的商品が過去のplaceholderの後ろに隠れないようにする。全商品は既存detailsへ保持する。RED1→関連12tests PASSを確認する。

最新snapshotはNetlify run39893057802で反映し、canonical SHA256 `1bc7880a88f32e082744eaab4c6b8d27d6a14a7b2dce07cd0d30237825f34f45`、75archive/73directory/55sourcesが公開MCP・CLI/stdioと一致する。v0.3.0の公式tagはmain `8af42e44d395a4dd4ee7d3fc8941f52c812b6001`、tarballは27,970bytes/SHA256 `616b39cc8f69d39756bd4003d38a10afa741c7e676da5811e05e1d4328303eef`。GitHub公式assetと公開URL導入を確認する。書籍の題名・表紙も公開URLで一致し、JA既存Stripe商品名だけを指定題名へ更新、価格objectは不変。

PR578/main `708b7adbd554d6bf8b216c8b7f4657a6497b03dc`はLanding CI39893316472とNetlify39893766896がsuccess。最終の通常ブラウザreadbackは最新2商品、IG/YouTubeのdated snapshot、73card、71画像＋2頭文字、AI status非表示、followers/views/revenue sort、対象外2件の検索除外、320/390pxの横overflowなし、client error0を確認する。JA本文の`main lang=ja`と指定題名も確認する。画像hash/native decodeは初回public proofを参照し、画像bytesを変えないpreview修正で再検証を増やさない。

現在cursor: AM-14 / AI Monk Factoryの既存ownerの復旧。運用TODO正本はLife ManagerのS11を参照する。定期task初回の自然run、全候補の動画形式精査・画像2件/標準icon1件の補完、全creator売上、factory復旧・実売上・subscriptionは未完のまま。

公開証拠 → `docs/evidence/ai-monk-avatar-scope-production-20261023.json`、`docs/evidence/ai-monk-business-ui-production-20261023.json`、`docs/evidence/ai-monk-business-mcp-production-20261023.json`、`docs/evidence/ai-monk-cli-mcp-v03-release-20261023.json`、`docs/evidence/ai-monk-book-title-production-20261023.json`。

## 未調査候補の掲載修復

**目的・範囲・完了条件:** AI statusをUIから外した後も、未調査候補をAI僧侶動画avatarとして掲載しない。公開73件中66件は未調査候補、4研究profileもAI動画形式の根拠が不足し、既存selectorがscope欠落を掲載扱いにするためDaisの指定focusを満たさない。canonicalの既存directory_scopeをincluded/pending/excludedへ揃え、source-linkedな掲載判断だけをWeb/CLI/stdio/remote MCPへ共通適用する。75archive/55sources/画像原本・各種未知・既存bookの過去snapshotを保持する。

**単一推奨:** Yang Mun、Ming San、Leo Chenの3件を、保存済み制作provider/調査報道の根拠に基づきincludedとする。70件はpendingへ戻し、既存イラスト系2件はexcludedを保持する。SifuChen Californiaは報道でAI画像が示されるが個別動画の根拠が未確定のためpendingとする。新たなAI originやhandle・売上を推測しない。3件とも出所付きの顔画像/記事stillを使い、native profile画像との同一性が未検証の素材はmanifestの制約を保持する。AI status badge/filterは復活しない。候補も含むDownload JSONはresearch archiveと明示する。

**原因・実経路:** canonical accounts→getAiMonkAvatarAccountsのstatus !== excluded→Web component/CLI/MCP core。対象外2件のdenylistだけでは新候補やscope欠落を掲載へ昇格する。共有selectorをincludedだけにする1箇所修正を採り、classifier/framework/新API/providerを増やさない。status欠落/pending/excludedがsearch/get/stats/SSRへ出ないREDを先に確認する。過去v0.3.0配布物は変更せず新v0.4.0にする。

**順序変更:** 旧cursor=Factory費用照合/EN通常配信＋X欠落リンク補完。新cursor=この実証済みscope欠陥をsource/本番まで修復→同じXリンク補完→Factory費用照合/日次配信。公開内容をDais指定の対象と一致させてから送客する方が、無関係な候補へ送るより直接成果へ近いため。既存HeyGen/Postiz fenceや稼働owner、未知費用を中断・再送しない。

- [ ] 既存7研究profileの根拠を読み取り専用で照合し、scope/本文/metadataを先に更新する。
- [ ] 欠落/pending候補が掲載されるREDと、CLI/get/statsの同じscopeのREDを観測する。
- [ ] canonical判定と共有selector、型、UI/CLI/MCPの説明・既存関連testsを最小修正する。
- [ ] 関連tests・exact CI/main・本番Web/remote MCP・v0.4.0公開配布物を照合する。
- [ ] sourceと実公開を区別してspec/evidenceに記録し、X送客/Factoryの残cursorへ戻る。

best=対象の明確な小さい一覧を起点に同じ根拠基準で拡大する。base=3件の既存根拠だけを掲載し収益情報不足を明示する。worst=多くの候補を公開保留するため件数の見栄えが弱くなる。候補も同列掲載する案の最強論拠は発見coverageだが、今回はAI動画avatar限定という明示条件を満たさない。自分が間違うとしたら、pendingの大半に既に利用可能な動画/AI根拠があり、その追加調査の方が少ない時間で多くの適切なavatarを掲載できる場合である。
