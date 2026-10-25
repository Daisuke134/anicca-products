# AI Monk Avatar掲載範囲

## 目的・範囲・完了条件

Daisの明示指示に従い、Yang Munのような写真に近いAI僧侶の動画avatarへ集中する。水彩・絵画・イラストの僧侶コンテンツを対象avatarとして掲載しない。既存のAI status・未確認・出典は捏造せず、未確認候補を認定済み扱いにしない。

75recordの研究archiveは保持し、掲載scopeをcanonical dataで一元管理する。既存sourceでイラスト系と分かる`kai-tsukimi`と`buddha-would-say`を対象外へ分類し、Web・CLI・stdio/HTTP MCPで検索/個別取得/集計のscopeを揃える。公開一覧はincluded4件とpending69件の計73件とし、対象外2件を除く。未調査という理由だけでプロフィールを非表示にしない。掲載の現在契約は2026-10-23-ai-monk-directory-restoration.mdを正本とする。画像だけでAI生成や動画形式を断定しない。新しい分類用frameworkや外部serviceは追加しない。

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

対象は同じAI monk avatarのpublic followers/subscribers・sampled video views・商品/価格/導線・根拠のある売上申告。人気と商品導線のある対象から進め、source identity・観測日・期間・丸めを保持する。unknownを0にせず、異なる期間/通貨/利益を売上へ変換しない。取得不能なら未取得理由を記録して独立したsourceへ進む。既存のrepo source acceptance/CI/mainと公開readbackを使う。所有者とleaseが競合するeffectを重ねない。設定作成・手動収集と自然な定期実行を区別し、初回heartbeatの実績を下記の本番受入へ記録する。

- [x] 毎朝9時のthread heartbeat `ai-monk-database`をACTIVEで作成し、provider viewと永続設定のkind/status/schedule/current thread一致をreadback。設定作成時点では初回定期実行は未到来で、実行結果は下記本番受入を参照。
- [x] 初回定期runで日付付き更新または具体的未取得理由と公開状態を確認。

### 初回heartbeatの実行範囲

`ai-monk-database`の2026-10-24T00:03:58.413Z実行を、base `373eec46af11c0d32566386df7fbd201413b3d5b`由来の`data/ai-monk-daily-20261024`で扱う。現在の掲載契約はdirectory-restorationの73件（included4/pending69）を維持する。人気と商品導線のあるYang Munの公開YouTube指標、Ming San/Yan Chenを含む既存公式商品ページを無料ツールで再確認し、観測日時・丸め・通貨・期間・未取得理由を記録する。既存75record/181source/過去snapshot・creator claimと未知の売上を保持する。完了条件は追記データのsource参照と過去値不変の照合、既存関連tests/CI/main、公開JSON・Web・remote MCPの一致である。データを更新した場合は現行CLI配布契約に従い次patch版へ反映する。動画生成・SNS投稿・Factory実装・有料provider購入・既存lease変更は対象外。

商品cardも観測日、またはsourceの公開/確認日を表示し、過去の価格を現在の在庫・価格と混同しない。表示のRED1件→関連12テストPASS。既存決済や売上計算のcontractは変更しない。

## 最新指標と商品preview

PR576/main `8af42e44d395a4dd4ee7d3fc8941f52c812b6001`で研究source55へ更新する。旧48sourceは不変、IG4件の丸めfollowersとYouTube3本のviews、商品2件をsource/日付付きで追加し、旧観察を保持する。UIの商品previewは観測日の新しいものを先に出し、新たに分かった具体的商品が過去のplaceholderの後ろに隠れないようにする。全商品は既存detailsへ保持する。RED1→関連12tests PASSを確認する。

最新snapshotはNetlify run39893057802で反映し、canonical SHA256 `1bc7880a88f32e082744eaab4c6b8d27d6a14a7b2dce07cd0d30237825f34f45`、75archive/73directory/55sourcesが公開MCP・CLI/stdioと一致する。v0.3.0の公式tagはmain `8af42e44d395a4dd4ee7d3fc8941f52c812b6001`、tarballは27,970bytes/SHA256 `616b39cc8f69d39756bd4003d38a10afa741c7e676da5811e05e1d4328303eef`。GitHub公式assetと公開URL導入を確認する。書籍の題名・表紙も公開URLで一致し、JA既存Stripe商品名だけを指定題名へ更新、価格objectは不変。

PR578/main `708b7adbd554d6bf8b216c8b7f4657a6497b03dc`はLanding CI39893316472とNetlify39893766896がsuccess。最終の通常ブラウザreadbackは最新2商品、IG/YouTubeのdated snapshot、73card、71画像＋2頭文字、AI status非表示、followers/views/revenue sort、対象外2件の検索除外、320/390pxの横overflowなし、client error0を確認する。JA本文の`main lang=ja`と指定題名も確認する。画像hash/native decodeは初回public proofを参照し、画像bytesを変えないpreview修正で再検証を増やさない。

現在cursor: AM-14 / AI Monk Factoryの既存ownerの復旧。運用TODO正本はLife ManagerのS11を参照する。全候補の動画形式精査・画像2件/標準icon1件の補完、全creator売上、factory復旧・実売上・subscriptionは未完のまま。

公開証拠 → `docs/evidence/ai-monk-avatar-scope-production-20261023.json`、`docs/evidence/ai-monk-business-ui-production-20261023.json`、`docs/evidence/ai-monk-business-mcp-production-20261023.json`、`docs/evidence/ai-monk-cli-mcp-v03-release-20261023.json`、`docs/evidence/ai-monk-book-title-production-20261023.json`。

## 履歴: included限定への変更（現在契約はdirectory-restorationを参照）

**目的・範囲・完了条件:** AI statusをUIから外した後も、未調査候補をAI僧侶動画avatarとして掲載しない。公開73件中66件は未調査候補、3研究profileもAI動画形式の根拠が不足し、既存selectorがscope欠落を掲載扱いにするためDaisの指定focusを満たさない。canonicalの既存directory_scopeをincluded/pending/excludedへ揃え、source-linkedな掲載判断だけをWeb/CLI/stdio/remote MCPへ共通適用する。75archive/既存55sources/画像原本・各種未知・既存bookの過去snapshotを保持する。

**単一推奨:** Yang Mun、Ming San、Leo Chen、Yan Chenの4件を、保存済み制作provider/調査報道の根拠に基づきincludedとする。69件はpendingへ戻し、既存イラスト系2件はexcludedを保持する。SifuChen Californiaは報道でAI画像が示されるが個別動画の根拠が未確定のためpendingとする。Yan ChenはMalditaの公開embedのexact title/handleとReel stillを再取得して裏付け、reportedへ更新し新sourceを追記する。旧ユーザー画像の未確認注記は履歴として残す。新たなhandle・売上を推測しない。4件とも出所付きの顔画像/記事stillを使い、native profile画像との同一性が未検証の素材はmanifestの制約を保持する。AI status badge/filterは復活しない。候補も含むDownload JSONはresearch archiveと明示する。

**原因・実経路:** canonical accounts→getAiMonkAvatarAccountsのstatus !== excluded→Web component/CLI/MCP core。対象外2件のdenylistだけでは新候補やscope欠落を掲載へ昇格する。共有selectorをincludedだけにする1箇所修正を採り、classifier/framework/新API/providerを増やさない。status欠落/pending/excludedがsearch/get/stats/SSRへ出ないREDを先に確認する。過去v0.3.0配布物は変更せず新v0.4.0にする。

**順序変更:** 旧cursor=Factory費用照合/EN通常配信＋X欠落リンク補完。新cursor=この実証済みscope欠陥をsource/本番まで修復→同じXリンク補完→Factory費用照合/日次配信。公開内容をDais指定の対象と一致させてから送客する方が、無関係な候補へ送るより直接成果へ近いため。既存HeyGen/Postiz fenceや稼働owner、未知費用を中断・再送しない。

- [x] 既存7研究profileの根拠を読み取り専用で照合し、scope/本文/metadataを先に更新する。
- [x] 欠落/pending候補が掲載されるREDと、CLI/get/statsの同じscopeのREDを観測する。
- [x] canonical判定と共有selector、型、UI/CLI/MCPの説明・既存関連testsを最小修正する。
- [x] 関連tests・exact CI/main・本番Web/remote MCP・v0.4.0公開配布物を照合する。
- [x] sourceと実公開を区別してspec/evidenceに記録し、X送客/Factoryの残cursorへ戻る。

best=対象の明確な小さい一覧を起点に同じ根拠基準で拡大する。base=4件の既存根拠だけを掲載し収益情報不足を明示する。worst=多くの候補を公開保留するため件数の見栄えが弱くなる。候補も同列掲載する案の最強論拠は発見coverageだが、今回はAI動画avatar限定という明示条件を満たさない。自分が間違うとしたら、pendingの大半に既に利用可能な動画/AI根拠があり、その追加調査の方が少ない時間で多くの適切なavatarを掲載できる場合である。

**根拠補正:** read-only調査はSifuの個別動画根拠不足を指摘する一方、Yan ChenはMalditaの公開embedでexact title/handle/imageをfresh HTTP照合し、既存画像のReel UI/写実的僧侶/寺院も確認する。AI statusだけの機械判定は採らず、Sifu pending/Yan includedとする。Web共有selectorの新規1 REDとCLI/statsの2 REDを観測し、既存scope fieldを使うincluded限定1行へ修復する。56sourcesへ増えるのはこの公開embed1件だけで、旧55source/75record/画像bytesは保持する。

**source検証:** 共通helper9件、package CLI/stdio/HTTP/公開tarball契約13件がPASS。75recordのID/順序と元55source、Yanの追記以外の既存fieldを比較して不変を確認する。local SSRは前回の依存回収後react-dom/typescript/lucide-reactが無いため起動できない。既存Landing exact-head CIはnpm ci後に同じSSR契約を実行するため、その結果を受入に使い余分なlocal全依存再生成はしない。source evidence → docs/evidence/ai-monk-reviewed-avatar-scope-source-20261023.json。fresh factual/source review、CI/main、本番/配布物は次の受入である。

**独立確認の補正:** fresh read-only検証者はMCP stats toolの説明だけに「未確認候補も件数へ含む」という旧文を見つける。実結果の候補漏れはなく、stats/getの説明をincluded限定の実契約へ揃える。分類・metric計算・UIは変更しない。

**SSRの限定復旧と指摘修復:** 未知売上fixtureだけscope fieldが欠落する独立指摘を受け、元のRevenue not available assertを保持してincluded/source_idsを追加する。依存不足は以前回収したtask-local packageへのdangling symlink3件と確定する。own worktreeのその3linkだけをexact lockfile version/SHA512一致のreact-dom18.3.1・typescript5.5.4・lucide-react0.454.0へ戻し、source manifest不変で実SSR4件PASSを確認する。fresh検証はhelper9/CLI・stdio・HTTP12PASS、全71非掲載ID拒否と4sortの同一4件、Yan exact embed/動画stillの根拠も独立照合する。旧MCP説明/fixtureの2指摘以外に新規指摘はない。

**統合とCLI v0.4.0公開:** PR588の最終head30ddf2fd981d90fde89397f21a0ac82795b006c1はLanding CI39938336276・package CI39938336680がSUCCESS、fresh最終Blocking0でmain e6fdf0b334ed6bb5448403a5b3fd8ad61f1e3dccへ統合する。同mainのpackage source/共有helper/JSON bytesと一致する配布物をGitHub release ai-monk-index-v0.4.0として公開する。tagの公式Git objectは同main、asset29,108bytes/SHA256 b9b4a0e75e90db499673ac9147992febdb6432089da14e1024dcd430d9d32f35。公開URLからのdownload/npm導入/実CLIとSDK stdioで4件/56sources/75archive、snapshot05413b1eef8e8e845374ec52cef419117d1c67d5fdf813a73329d6f3b2bc940fが一致する。views/revenue sort先頭Yang Mun、unknownを0にしない。Netlify39938900630の本番反映は進行中で、Web/remote MCPは未受入。

**本番受入:** Netlify39938900630はmain e6fdf0b3でSUCCESS。10:32 UTCの公開HTMLはH1 AI Monk Database、4card/4顔画像、AI status UI無し、followers/views/revenue sortを返す。公開JSONはmain canonical SHA05413b1eef8e8e845374ec52cef419117d1c67d5fdf813a73329d6f3b2bc940fと完全一致する。公式SDKのremote MCP stats/searchは同じ4件/56sources/75archive、全4sortでincluded4件だけ、pending getは拒否する。旧画像bytes/layoutは変わらないため再生成/全responsive再検証を増やさない。これでscope source/本番/CLI v0.4.0の受入を完了し、69pendingの追加調査と自然定期runは残す。現在cursorは既存Xリンク3件の補完→S11 Factory運用。証拠 → docs/evidence/ai-monk-reviewed-avatar-scope-{production,mcp-production}-20261023.json、ai-monk-cli-mcp-v04-release-20261023.json。

**初回heartbeatのsource受入:** 2026-10-24の公開観測を3プロフィールへ追記する。Yang MunのYouTube3本viewsは521603/1102391/12561596、channel subscribersは丸め159000。商品3ページをHTTP200で確認し、Ming Sanの29.99 USD単発/26.99 USD月次とYan Chenの9.95 EURを再観測する。Yang Munのドル表示とJPY storefront設定の不整合、YanのAgotado/InStock併記は未確定を維持する。追加は指標4件/offer4件/出典6件、合計187出典。旧181出典・offer/metric履歴・全scope・収益申告は不変。helper9＋CLI/stdio/HTTP/install15件PASS、fresh read-only指摘0件。Instagram followersは5creditsの有料lookupを使わず未取得、現在売上/注文/利益は公開価格から推定しない。学び・未取得理由・取得時刻は `docs/evidence/ai-monk-daily-refresh-20261024.json`。source受入段階の記録であり、公開結果は下記の本番受入を参照する。

**初回heartbeatの本番受入:** PR649/head `b724dce7d10055cecc9839026347a9980fe90751`はpackage CI40044088058・Landing CI40044087953・CodeRabbitがSUCCESSでmain `505aa8182356e286c586aa9a5f618d8509806f2e`へ統合する。Netlify40044430905は同mainでSUCCESS。2026-10-24T00:25:42.652Zの公開JSONはcanonical SHA256 `6daa9b82697c3ad2904a933c875ff0755e9b90d5de1b601655f6981e0d2bbafd`と一致し、公開HTMLの73card/新offer/観測日/AI status非表示/4sort、公式SDKのremote MCP6tools・73件/187出典/75archiveと変更3accountの完全一致を確認する。CLI v0.4.9の公式tagは同main、asset60,227bytes/SHA256 `63ce5eaedde30e0178581d79fd535749d96bcc73962c92f060372ef1b1051a90`。公開URLからの実installとstdioで同じsnapshotを返す。central registryのmetadata versionはこの日次taskでは再publishせず、既存remote URLは維持する。本人記事はcrwl本文空の後scrapyで再取得し、2026-04-09公開の既知申告を確認するが、現在売上/利益の証拠へ変換しない。初回自然定期runを受入済みとし、未取得IG followers・各creatorの会計情報・候補調査は残す。元の長時間goalはpausedのままで、このtaskによる動画生成/SNS投稿/追加課金は0。証拠 → `docs/evidence/ai-monk-daily-{refresh,production}-20261024.json`、`docs/evidence/ai-monk-cli-mcp-v049-release-20261024.json`。

## 2回目heartbeatの実行範囲

2026-10-24T23:59:58.755Zの定期更新を、base `29a84055d86fd4dbcf0dc82fb8f6530018125501`由来の専用branch `data/ai-monk-daily-20261025`で扱う。現行73公開/75archive・included6/pending67/excluded2・233出典と全履歴を保持する。Yang Munの既存YouTube3動画と丸めsubscriber、Yang Mun/Ming San/Yan Chenの公式商品ページを無料公開sourceで再確認する。取得時刻・出所・通貨・期間・未取得理由を記録し、不明売上を推定しない。公式creator記事の既知申告も再読する。Instagramの直接HTTP停止方針と既存browser leaseを維持し、有料lookup・動画生成・SNS投稿・Factory実装・元のpaused goalの再開を行わない。

- [ ] 日付付き観測を追記し、旧source/metric/offer/収益申告と非対象account不変を検証する。
- [ ] 関連既存testsと独立read-only確認、exact CI/main統合を通す。
- [ ] 公開JSON/Web/remote MCPと次patch CLIの公式取得を照合し、未取得理由と学びを証拠へ記録する。

現在cursor: 2回目heartbeatの公開情報収集。仕様・掲載判定・UIの振る舞い変更はなく、データ追記と配布snapshot更新に限定する。
