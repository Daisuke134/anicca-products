# AI僧侶アバター記事と公開ディレクトリ

## 目的

Aniccaのブログを、AI僧侶アバターを読者が楽しみながら理解できる日英の読み物と、検索できる公開ディレクトリにする。Yang Munのケース、AI僧侶アバターの歴史・表現・販売導線、根拠を示すプロフィール一覧を同じサイト内で結ぶ。

## As-Is

- Yang Mun単独記事とAI僧侶フィールドガイドは英語・日本語の計4本が公開済み。公開URLは維持する。
- 4本の記事は証拠を整理している一方、導入と見出しが調査報告書寄りで、読者を引き込む物語・ユーモア・読み進める理由が弱い。
- 現在のarchive・公開scope・出典数・配布版・本番受入の正本 → `../plans/2026-10-24-ai-monk-research-distribution.md` の「順序と現在cursor」。過去版の公開証拠は各receiptで保持する。
- Yang MunのAI生成状態は、HeyGenとColumbiaの説明に対し、Columbiaがリンクする本人側ページが「本人は実在し、声だけAI翻訳」と主張している。現時点では食い違いを解消できない。
- 追加提供されたInstagram画面には100〜102件のフォロー中表示と複数の僧侶風アカウント名が写っている。リスト全体でもAI生成状態でもなく、個別確認用の候補発見材料。
- `/monk` は既存eBook販売ページなので使用しない。
- Xの前回4投稿は、各記事への直接URLを含み、Postizの `PUBLISHED` とX permalinkを記録済み。今回の記事改稿・新ディレクトリを告知する投稿は別途必要。
- ApifyのInstagram Scraperページは公開閲覧できる。実行用Apify連携はこの環境のツール一覧になく、認証SSOTにも `service=apify` の記録がない。

## To-Be

1. **読者向け記事4本を改稿する。** 既存slugを維持し、本文・H1・descriptionを更新する。中心タイトルは `Yang Munの衝撃` / `The Yang Mun Shock` と `AI僧侶列伝` / `The Art of AI Monks`。副題は読者の好奇心を増す場合だけ付ける。
2. **履歴・事実・分析を一つの読み物にする。** Yang Mun記事では65秒Shortから人物の正体をめぐる矛盾、動画の仕組み、30日プログラムとeBook、異なる収益主張、宗教的な信頼の問題へ進む。総覧記事ではAI生成の僧侶キャラクター、実在僧侶の仮想アバター、物語アニメーションを分け、文化の前史と現在のSNS型を描く。
3. **検索可能な公開Webディレクトリ `/ai-monk-database` を維持する。** 画面上部の検索、言語・プラットフォーム・地域の絞り込み、4sort、スクロール可能なプロフィールカードを備える。AI status badge/filterは表示しない。検索対象は表示名、別名、handle、creator、国・地域、言語、SNS、提供物。
4. **プロフィールに根拠を残す。** 現行snapshotでは公開73件のうち制作/動画根拠確認6件と調査中67件を区別し、pendingの短い注記とreasonを表示する。creator、プロフィールリンク、投稿言語、地域情報の根拠、見える商品導線、取得時点付き数値、出典、未確認事項を表示する。候補のAI生成状態・運営者・国・言語は推測で埋めず、全73件を確認済みAI動画avatarとは呼ばない。
5. **開いたデータへ読者を案内する。** 公開JSONとGitHubのデータファイルをリンクし、プロフィール追加を提案できる導線を置く。更新可能な初期ディレクトリとして公開し、「世界初」「世界最大」「全件網羅」は調査で立証できるまで主張しない。
   コードはAI Monk Indexの実装ファイルに限ってMIT、Anicca執筆のデータ要約・編成はCC BY 4.0で公開し、第三者素材の権利を含めない。
6. **記事とXを新しいディレクトリへつなぐ。** 2言語の記事から検索UIへリンクし、公開後に既存Postiz経路で新規の告知投稿を行う。本文に直接URLを含め、post receiptとpermalinkを記録する。前回4投稿は重複送信しない。

## 編集方針

- 想定読者は、短尺動画の文化、AIキャラクター、SNS上の商売に興味がある英語・日本語の一般読者。読み終えた後に、少なくとも一つのプロフィールを検索し、主張と根拠を自分で確かめられる状態を目指す。
- 各記事の冒頭は具体的な場面・奇妙な事実・問いのいずれかで始め、記事の中心発見を早めに見せる。見出しには情報ラベルでなく、続きを読みたくなる主張を置く。
- Malditaの調査記事の「場面から始め、具体例を重ね、調査範囲と限界を明かす」構成、および既存Anicca記事の一人称の場面描写・手触りのある数字・会話調の節運びから、構成上の仕組みを学ぶ。自社の原稿・台本・動画・新キャラクターを既存作品の丸写しにしない。プロフィールの識別用画像は「データとUI契約」に従う。
- 読者が使える情報として、確認済みSNS、創作者、公開商品、価格、動画の構図と話の運び、未確認事項、更新日を具体的に示す。
- 視聴者数、再生数、商品価格、seller counter、creator claim、売上、利益、注文を区別する。自己申告・販売ページ・広告主の顧客事例は、その情報源の主張として示す。Yang MunのAI生成状態に関する一次発信と報道の矛盾も併記する。
- AI僧侶の台詞は全文転載せず、hook・感情の展開・映像・CTAの仕組みを要約する。健康上の主張は医療助言として紹介しない。
- 収益や医療効果、AI生成状態、制作者、アカウントの所在地を未確認のまま断定しない。

## データとUI契約

- 正本データ: `apps/landing/public/data/ai-monk-avatar-database-2026.json`。75レコードのarchiveからexplicit included/pendingの73件だけを掲載する。各recordの`ai_status`・`directory_scope`・画像・metricsを保持し、確認できた `languages` と `region_evidence` だけを追記する。
- `languages` は、プロフィールまたは投稿サンプルで言語を確認できた場合だけ値を持つ。初版では英語・スペイン語を表示し、SifuChenの投稿言語など未確認は空欄のまま「言語未確認」とする。
- `region_evidence` は地域名と根拠の種類を持つ。創作者の居住地、プロフィールに表示された国旗、対象市場を同じ「所在地」として扱わない。
- UIは既存のNext.js 14、React、Tailwind、静的JSONを使う。ユーザー登録、投稿フォーム、外部DB、決済、APIスクレイピング、追加npm依存は含めない。追加提案はGitHubへのリンクで受ける。
- 検索は入力ごとに表示名・別名・creator名とプロフィールURL・地域・言語・プラットフォーム・handle・商品名・creative sampleタイトルを対象に大文字小文字を無視して絞る。各選択フィルターはANDで組み合わせ、該当件数と0件時の状態を表示する。
- カードには全件アイコンを置く。Daisの公開画面への指示に合わせ、本人の公開プロフィールとの対応を確認できる画像を優先し、取得元・取得日・hashを記録する。画像未取得・読み込み失敗は名前のイニシャルで示し、実写真やAI生成状態を偽らない。第三者画像をデータのCC BY対象に含めない。
- ページのH1とmetadataは `AI Monk Database`。コピーは直接的な名詞・短い説明・操作名に統一し、比喩と問いかけを除く。検索を上部に置き、顔・名前・handle・主要数値をコンパクトなカードで比較できるようにする。Mobbinと類似directoryの観測状況・採用する構造・未確認事項は今回のUI計画と参照記録を正本にする。→ `docs/superpowers/plans/2026-10-23-ai-monk-database-ui.md`

## 成功事例・設計参照

| 参照 | 確認できた内容 | 反映する仕組み | 指標と限界 |
|---|---|---|---|
| [Maldita 250 profiles](https://maldita.es/investigaciones/20260727/250-ai-health-instagram-accounts/) | 調査側が250件、7言語、45,600超の投稿、5,370万人超のフォロワー、224件の販売URLを報告。僧侶以外も含む健康アカウント調査。 | 方法・分類・範囲を明かし、僧侶サブセットへ全体値を誤って当てない。 | 集計値は同調査の報告値。Anicca記事の成果は未公開。 |
| [Maldita 16 accounts](https://maldita.es/investigaciones/20260710/cuentas-ia-instagram-facebook-salud-libros/) | 調査側が16アカウント、350万人超のフォロワー、7,050万超の再生、Leo ChenとSifuChenの異なるeBook導線を報告。 | 具体的な動画の入口から、DM・ハイライトの商品導線へ話を進める。 | 報道値で、売上や利益ではない。記事の成果は未公開。 |
| [AvatarFactory directory](https://avatarfactory.io/ai-influencers) | 事業者は179 profileを分析したと表示。検索結果はカードと分類を用いる。 | プロフィールカード、検索、絞り込み、対象数の明示。 | 事業者の表示であり、独立した利用・売上実績は未確認。 |
| [GrowwStacks AI factory](https://growwstacks.com/blog/ai-factory-creates-ai-avatar-instagram-videos-daily-n8n-automation) | n8n等の制作手順と20+時間/月の削減を事業者が主張。Yang Munの公式ワークフローとは独立している。 | 制作段階を分解して、読者に再利用できる手順として伝える。 | 20+時間削減は独立検証されていない。成果の根拠として引用しない。 |
| [Mobbin: Mailchimp directory hero](https://mobbin.com/sites/sections/937b2c14-8890-4a1e-bc55-c32be0481863), [Semrush listing](https://mobbin.com/screens/9d9d1461-4626-4863-9248-0ceedf542a13), [Workable directory](https://mobbin.com/screens/74f4187c-e8cc-45d2-be00-f1060f3989c8) | 検索欄、結果カード、絞り込み、状態chipの実画面を確認。 | 検索を最初に見せ、一覧と絞り込みの関係をすぐ理解できる配置。 | UI参照。プロダクト成果値は参照画面から分からない。 |

## 収集ツールと費用

- [Apify Instagram Scraper](https://apify.com/apify/instagram-scraper) の公開ページは、使用量課金を1,000結果あたり `$1.50` からと表示し、Free planは最大1,851結果・月額 `$0` と掲載している。選択プランで単価・compute条件が異なる。
- Apify実行ツールが接続されず、Instagramのrobots.txtも明示的な書面許可なしの自動収集を禁止するため、新しい課金actorは実行しない。既存接続vidIQと、ログイン不要で公開されるプロフィール/投稿のメタデータを使い、取得経路と制限を保存する。初期5件と66候補から、根拠を確認できたレコードを継続して拡充する。
- 新規サービス費用は `$0`。既存接続のvidIQ公開調査と既存CLIを使い、課金actor・新規契約・有料top-upは追加しない。HeyGen等の既存契約は今回追加しない。

## 公開SNSプロフィールの取得境界

- 旧仕様のInstagram自動取得一律禁止は、公開プロフィールを既存toolで収集するDaisの明示指示に合わせて更新する。取得は公開情報と既存provider接続に限定し、ログイン壁、CAPTCHA、非公開範囲、rate limitを迂回しない。robots.txtやproviderの取得制限・エラーは記録し、同じ拒否を盲目的に再試行しない。
- 100〜102件の表示は候補発見の入力にだけ使い、画面に完全表示されたハンドルを手作業で転記する。省略表示・切れたハンドルは追加しない。
- スクリーンショット由来の記録は `unverified` とし、AI生成・運営者・言語・所在地・フォロワー数を主張しない。公開メタデータを取得できた場合はsourceと日時を追加し、未確認欄だけを根拠付きで更新する。
- 「数百万件」はこの画面から裏付けられない。データベース件数は確認した記録だけを数え、全世界の総数として表現しない。

## 外部事実の出典

- [HeyGen: Yang Mun customer story](https://www.heygen.com/ja-jp/customer-stories/yangmun): ベンダー顧客事例。作者・制作工程の公開主張。
- [Columbia News Service: Yang Mun was never real](https://columbianewsservice.com/2026/03/24/millions-found-comfort-in-a-buddhist-monk-but-he-was-never-real/): Yang Munをめぐる独立取材、creator、本人の収益発言、信頼・宗教的懸念。
- [Yang Mun official product page](https://www.yang-mun.com/pages/journey): `$49.99` program と `$59.99` bundle の販売表示。販売数を示す独立証拠ではない。
- [Yang Mun first-party identity statement](https://www.yangmuns.com/blog/the-truth-behind-%E2%80%9Ctime-to-heal%E2%80%9D-by-yang-mun): 現在のページは本人を実在の教師とし、声だけAI翻訳と主張する。HeyGenとColumbiaの説明と食い違う。
- [Thai PBS: Phra Maha AI](https://www.thaipbsworld.com/around-thailand/thailands-first-virtual-monk-to-preach-buddhism-to-new-generation): 実在僧侶と2Dキャラクターの先行例。AI生成の僧侶人格としては数えない。
- [Virtual Humans: Yang Mun](https://virtualhumans.org/article/who-is-yang-mun-the-ai-generated-wellness-guru-with-2-6m-followers): creator発言として紹介された別期間・別会計基準の収益値。監査済み利益ではない。

## 受け入れ条件

- 既存4 article URLを保ち、日英の4記事が指定タイトルを使い、物語として読める導入・固有の見出し・原資料リンクを備える。
- `/ai-monk-database` に73件が表示され、名前・handle・creator・language・region・platform・offerを検索または絞り込める。調査中69件の注記とreason、既存根拠を表示する。
- 検索語とlanguage/platform/country filtersがANDで機能し、4sortと未知・未確認値を保持する。AI status badge/filterは復活させない。
- 各profileの根拠ソースへ直接移動でき、データJSONとcontribution linkがある。
- 既存の4 X記事投稿を再送せず、新規告知投稿には公開済みの直接URLが含まれ、Postiz `PUBLISHED` とX permalinkを記録する。
- 関連テスト、landing build、PR CI、main merge、Netlify production readbackが通る。

## AI monk avatarの対象範囲

Yang Mun型の写真に近いAI僧侶動画avatarへ集中する。水彩・絵画・イラスト中心の僧侶コンテンツは対象外。既存資料のKai TsukimiとBuddha Would Sayを公開検索から外し、研究archiveへ残す。未確認候補はAI生成や動画形式を認定せず、同じ基準で個別確認する。Web/CLI/MCPの掲載範囲をcanonical scopeで揃える。正本実行計画 → `docs/superpowers/plans/2026-10-23-ai-monk-avatar-scope.md`。

## Atomic TODO（初期実装の履歴）

下表は初期実装の範囲を残す。現行の掲載契約は「データとUI契約」、未完作業は末尾の「現在cursor」を正本とする。

| ID | 変更対象 | 依存 | DONE |
|---|---|---|---|
| AM-7 | 既存AI monk datasetへ確認済みの言語・地域根拠を足し、`apps/landing/lib/ai-monk-directory.mjs` に検索・AND filter関数を定義。 | 出典照合済み5件 | テストでname/handle/creator/language検索、status+language+platform filter、未知値、0件を確認。 |
| AM-7B | 追加スクリーンショットの完全に読めるhandleを候補レコードとして追加し、AI状態・creator・言語・所在地は `unverified` / unknown のまま保持。Instagramの明示許可なし自動取得は行わない。 | AM-7, user-supplied screenshots | 候補レコードは既存検索で名前・handle検索でき、UI上で調査済みプロフィールと未確認候補を見分けられる。 |
| AM-8 | `apps/landing/app/ai-monk-database/page.tsx` と `apps/landing/components/AiMonkDatabase.tsx` でレスポンシブ一覧を構築し、記事とJSONへの導線を付ける。 | AM-7, AM-7B, Mobbin UI参照 | `/ai-monk-database` routeがbuildされ、検索欄・filter・profile cards・sources・open-data linkが表示される。 |
| AM-9 | 4つの既存研究JSON本文を英日記事として改稿し、指定タイトル、歴史、creator、video structure、offer、根拠と限界、database linkを入れる。日本語2本はYomiyasu v2.1.1（`fbe02c93877d697cc53d9377b7a45dd8a1dd99b3`）のlint・diff・修正1回・最終hash verifyで校正する。 | AM-7, AM-8, source references | JSON parse、見出し数・順の保持、Yomiyasuのrunとverify、既存記事slugと直接リンク確認。 |
| AM-10 | focused checksとlanding buildを実行してPRを作成、merge、production readbackを行う。 | AM-7–9 | exact-head CI PASS、main SHA、Netlify deploy、記事4本とdatabase UIのHTTP/readback。 |
| AM-11 | databaseと改稿記事を英日でX告知し、直接URLを本文に含める。 | AM-10, Postiz identity/session readback | 送信ごとにdistinct `PUBLISHED` receipt/permalink、重複ゼロ、記事UTM click countの初期値を記録。 |

**順序変更:** 旧cursorは記事改稿だった。Daisが検索Webアプリを先に作るよう指示したため、旧順序（記事→UI）をデータ/検索契約→候補登録→UI→記事→配信へ変更。今回のInstagramフォロー画面は未確認候補の収集としてAM-7Bへ挿入し、自動スクレイピングなしで候補の出所を保持する。

現在cursor → 末尾の「現在cursor」を参照。

## The Art of AI Monks — 全体成果と実行順

- 記事と新刊の正題は **The Art of AI Monks**。新刊は既存の内省本 The Anicca Reset と別商品とし、既存の日英10章outlineを継続利用する。
- 英語圏を先に扱い、公開フォロワー数・再生数・商品導線の根拠がある有力プロフィールを優先する。followers、views、売上自己申告、公式注文、利益を区別し、順位は取得時点とplatformを表示する。収益未確認の対象をbest-sellingとは呼ばない。
- 目的は調査と娯楽の価値を無料で届け、その学習を自社AI僧侶の台本・HeyGen制作・既存の日次SNS配信・eBook販売へ戻すこと。成功事例の仕組みを学び、独自の人格・台本・素材を使う。
- 「全員」は継続的なcoverage目標とする。発見元、検索query、platform、言語、取得日、未確認欄、重複統合を残し、初期候補をAI確定アカウントと取り違えない。
- 既存のJSONを公開machine-readable interfaceとし、コードMIT、Anicca執筆の編成・要約CC BY 4.0を維持する。ChatGPT app/MCP/CLIは同じデータを利用する配信口として段階化し、別の正本DBを作らない。
- Xは既存Postizの @selawmqt で公開後に告知する。Yang Munのcreatorへの敬意と、確認できたhandleへのmentionを含める。Daisが自分のアカウントで投稿できる完成tweetを別途提示する。retweet・バイラル・売上・アンバサダー採用は結果として観測し、確約しない。
- 自社factoryは既存Life ManagerのeBook/marketing-engine/HeyGen ownerを再利用する。稼働・cadence・投稿URL・注文をlive readbackし、uncertain effectは再送せず照合する。将来のOSS化と有料subscriptionは、自社で通った制作→配信→購入→納品の経路から提供する。

| ID | 成果 | 完了条件 |
|---|---|---|
| AM-12 | ツール実測と英語プロフィール拡充 | vidIQ、yt-dlp、GitHub OSS、既存tregの利用可否・費用・限界を記録。公開根拠を持つprofile/metrics/offerをデータへ反映し、followers順と英語filterで閲覧できる。 |
| AM-10 | 検索アプリと記事を公開 | 最新main由来worktreeで既存未公開成果を保持し、focused test/build、commit/push、PR CI、main merge、Netlify deployと公開URL/JSONを確認。 |
| AM-11 | X告知と再投稿用copy | live URL付き投稿をPostizへ送信し、PUBLISHEDとX permalinkを保存。Dais用の完成tweetを提示。 |
| AM-14 | 自社AI monkで学習を実践 | 日次TikTok/Instagram運用・既存ownerの生成/費用照合/投稿/復旧はGrok Bot担当。本作業は操作しない。実生成・公開URL・制作費・注文・売上は公式証拠なしに完了へ変えない。 |
| AM-13 | 新刊 The Art of AI Monks | 既存outlineを継承し、英語初版は約8,000–12,000語の10章全本文、front matter、具体例・仮定を明示した計算例、再利用可能なワークシート、出典appendixと機械可読source manifestを先に完成させる。その後の日英EPUB/PDF、販売ページ・SKU、公式出版/納品readbackまでがAM-13全体の完了条件。出版・注文・売上は原稿完成だけでは達成扱いにしない。 |
| AM-15 | 再利用できるOSS factory | 自社で通った経路を既存実装から切り出し、秘密を含まないsetup・asset license・一連のCLI・dry runを公開。機械可読JSONの利用例を提供。 |
| AM-16 | factoryの有料web app | 実測済みfactoryをsubscriptionへ接続し、顧客ごとのaccount・素材・予算・公開先を分離。契約、決済、生成・配信、解約の公式readbackを閉じる。 |

**AM-13本文進捗:** 英語初版 `docs/books/the-art-of-ai-monks-en.md` と `docs/books/the-art-of-ai-monks-sources.json` の初版執筆・source acceptanceは完了。正題 The Art of AI Monks、副題 Avatars, Attention, and the Business Behind the Robes、著者Anicca、snapshot明記のfront matter、全10章、4種の再利用sheet、methodology/coverage limits、32参照と元48 sourceのmanifestを備える。URL・参照label・数値だけのtokenを除く英語語数は全体10,874語、付録前9,424語、10章本文8,787語。75 records / 48 sources、調査対象9件と未確認候補66件、AI status reported4 / unverified71 / confirmed0を保持し、first-party主張・独立取材・過去の観察・metadata-only・推論・架空演習を区別する。Yang Munの身份の不一致、seller counter/価格/creator収益申告の限界、自社factoryの未復旧・未販売を明記。JSON parse、10章/4 sheet/32参照の整合、48 source一致、長文段落重複ゼロ、機微文字列scan、語数、diff checkはPASS。原著本文・script・sheetはCC BY 4.0、第三者素材は対象外。外部公開・課金・credential操作は本文作業に含めない。共有indexを避けるrootの指示により、専用branchのcommit/push・remote SHA照合とformat/公開はrootへ一本化する。本文snapshotを完成として渡し、AM-13全体は未完。

**AM-13の小段階:** 英語初版と日本語初版の本文・出典・PDF/EPUB・購入ページを公開する。日本語は60頁・10章・4worksheet、整形済み版は両言語とも `$9.99`。全文は無料GitHub。PR563/main `f2ab81fd273509cbb82580c94e0cbfefa53baad3`、CI39882333826とNetlify39882793550はsuccess。公開日本語ページ、固定SKU/言語/USD999の未払いCheckout、PDF/EPUBの403、確認sessionのexpired/unpaidを公式readbackする。実購入・paid本番納品・売上・利益・bestsellerは完了扱いにしない。仕様とreceipt → `docs/superpowers/plans/2026-10-23-ai-monk-book-ja-release.md`。

**過去の順序更新:** 公開版が5件のまま検索UIが404という実測と、英語・有力アカウント優先の指示に基づき、AM-12調査をAM-10公開準備と並行する。当時は旧HeyGen生成要求とeffect fenceを理由に、旧順AM-13→AM-14をAM-14→AM-13へ変更する。この運用復旧優先は過去の実行順であり、現在の日次運用・復旧はGrok Bot担当。現在の作業順は末尾の「現在cursor」を参照する。

**AM-12実測:** 接続vidIQで公開profile/discoveryを取得し、yt-dlpでYouTube最新20件と公開投稿metadataを確認。新4候補と既存5件更新を統合して75 records/48 sources。AI生成statusはreported4、unverified71。vidIQは既存credits不足のため停止、新規課金なし。Instagram直接取得はrobots notice確認後に停止し、継続経路は接続providerとcreator公式site/YouTube metadataとする。詳細は `docs/evidence/ai-monk-english-research-20261022.json`。

**公開済みの証拠:** AM-10はPR [#551](https://github.com/Daisuke134/anicca-products/pull/551)、main SHA `d4380515c995abd0611987bedead436fbe432dcb`、exact-head Landing PR buildとNetlify run `39800192156`がsuccess。検索UI、英日4記事、75 records/48 sourcesのJSONをHTTP 200でreadback。詳細は `docs/evidence/ai-monk-index-production-20261022.json`。

**X公開済み:** AM-11はPostiz公式GETで英語 `cmvjodr4i18bbot0y14apjr6z` / [X](https://x.com/selawmqt/status/2113286528508285146)、日本語 `cmvjofwki18joot0ye8ugzfyl` / [X](https://x.com/selawmqt/status/2113286777054360059) をPUBLISHED確認。接続は両方 `@selawmqt`。独立したX timeline readback、閲覧数、click、注文、売上は今回未測定で0とはしない。本文とreceiptは `docs/evidence/ai-monk-x-launch-{en,ja}-20261022.json`。Dais用再投稿copyは同じ完成本文として提示する。

**factoryの現状と残TODO:** Database73件復元とMonk Factory Web公開・localhost plan受入は完了済み。公開/ローカル同一UIと既存Factory接続の受入は `docs/superpowers/plans/2026-10-23-ai-monk-factory-web-publish.md`、配布の残TODOは `docs/superpowers/plans/2026-10-23-ai-monk-plugin-package.md` を参照する。日次投稿はDais指定のGrok Botが所有し、この作業ではPostiz/HeyGen/稼働loopの生成・投稿・再試行・容量復旧を行わない。販売は公開の必須条件にせず、他者の収益やUSD10K超MRRは未達を保持する。

**AM-13英語初版の実装・検証:** 原稿とsource manifestはcommit `930233f17`でpush済み。citationの隣接記法が参照先を取り違える問題を直し、原稿SHAは `4858b58ea835500ce3be38d55d91469d8207461cfe73e6d9042b1787afdb5d79`。`apps/landing/scripts/build-ai-monk-book.py` が既存pandoc/WeasyPrintで59頁PDFとEPUBを生成し、HTML95引用リンクとEPUBの引用先・mimetype/container/spineを照合する。表紙は全体を収め、サンプル紙面を目視確認。正式assetは `apps/landing/private/ebooks/the-art-of-ai-monks-en.{pdf,epub}`。

購入は既存Checkoutで固定SKU `art_of_ai_monks_en_v1`、英語・one-timeのみ。決済完了画面から両形式を取得し、serverがcomplete/paid/本番mode/正確なproduct・SKU・言語を照合する。既存Writerと同じCheckout entitlementによる納品で、新書籍のメール送信は追加しない。Resend既存helperの失敗握り潰しとtest-domain senderが独立検証で見つかったため、新書籍のメール分岐を除き、既存Reset/Letterへ混ざらない契約testを残す。関連20件PASS。full manuscript/sourceは無料GitHubで読め、$9.99は整形済み版で研究を支援する購入だと販売ページに明示する。

**過去の運用反映:** factory修正はLife Manager PR #8544、main `1dbf2b502d9f0733e91b6f53a6ecd2ab86675da1`、全13checks PASSで統合。正式release `20261023T003543-1dbf2b50`をEN TikTokとebook-articlesのidle ownerへ限定採用し、loaded SHA/argvをreadback。旧HeyGen動画は公式scenesとの完全一致でIDを回復し、cost_reconciliation_required / cost=null / guard維持。日次公開の復旧・注文・売上は未達。

**AM-13英語版の公開:** PR [#553](https://github.com/Daisuke134/anicca-products/pull/553)、main `6c21d91c08eb37ce3c47e2290606f58ccf361781`、exact-head landing CIとNetlify run `39809692295`がsuccess。販売ページ `https://aniccaai.com/the-art-of-ai-monks` はHTTP200、canonical・59ページ・10,874語・PDF/EPUB・$9.99・無料全文への案内を確認。fresh independent reviewは残存指摘0、関連35テストPASS。live Checkoutは公式Stripe GETでSKU/999 USD cents/one-time/本番mode/成功URLを確認し、未払いPDF/EPUBは共に403。検証sessionは未払いのまま失効を公式GET確認。原稿・出典・英語format・販売ページ・SKU・未払い保護までは公開済み。実購入・支払済み本番納品・注文・売上は未確認。根拠は `docs/evidence/ai-monk-book-{production,checkout-production,stripe-catalog}-20261023.json`。

**73件復元の契約:** 公開一覧は制作/動画根拠を確認したincluded4件とpending69件の計73件、既存イラスト系excluded2件は非掲載。75record/57sourcesのarchive、各recordのdirectory_scope/ai_status/画像/未知の指標は保持する。included限定条件が73→4の減少原因であり、未調査をプロフィール非表示へ結び付けない。共有selectorはexplicit included/pendingだけを返し、scope欠落/excludedは非掲載。Web/CLI/stdio/remote MCPのscopeを揃え、pendingは短い調査中注記とreason・既存根拠へつなぐ。AI status badge/filterは復活させず、全73件をAI認定済みとも呼ばない。Databaseの既存毎朝9時heartbeatは重複作成しない。受入 → `docs/superpowers/plans/2026-10-23-ai-monk-directory-restoration.md`。

**公開scope修復の旧snapshot:** PR588/main e6fdf0b3で、canonical directory_scopeの明示included4件だけをWeb/CLI/MCPへ掲載するsourceを受入する。69pendingと2excludedを含む75record/56sourcesのresearch archiveを保持する。Yang Mun/Ming San/Leo Chen/Yan Chenは出所付きの顔画像を持ち、AI status UI非表示・followers/views/products/期間付き売上比較を維持する。v0.4.0の公式tag/asset/公開URL導入とCLI/stdioの4件/56sources一致は確認済み、Netlify39938900630はSUCCESS、本番Webの4card/4顔画像とremote MCP全sort/件数/公開JSON SHAの一致を受入済み。具体根拠・残TODO正本は2026-10-23-ai-monk-avatar-scope.md。Factory利用者publisherはLife Manager PR8668/main7c63b4e3/固定版までsource受入済みで、旧費用照合・日次実配信・事前USD cap・実購入/paid納品・他者導入/MCP/subscriptionは未完。このsnapshotの次段階は後続のリンク補完結果へ記録する。現在の日次運用はGrok Bot担当。

**AM-15データ利用口の公開:** `packages/ai-monk-index` は唯一の正本JSONとWeb検索helperをbuildで取り込み、`search/get/stats` CLIと3つのread-only stdio MCP toolsを提供する。PR [#558](https://github.com/Daisuke134/anicca-products/pull/558)、main `838e6bb7101a2ef647560eeb5a5ef0bbc19d950a`、Node20 package CIとlanding CI成功、fresh review指摘0。v0.1.0は[GitHub Release](https://github.com/Daisuke134/anicca-products/releases/tag/ai-monk-index-v0.1.0)として公開する。23,806 bytesのtarballは公式asset digest・再取得hashが一致し、公開URLを使うnpm installから75 records/48 sourcesのCLI readbackを確認する。通常利用のネットワーク・API key・accountは不要。npm registry掲載、remote MCP/ChatGPT app、動画生成/投稿factoryのOSS化、subscriptionはこのreleaseの完了範囲に含めない。根拠 → `docs/evidence/ai-monk-cli-mcp-release-20261023.json`。

**AM-15 remote MCP/v0.2.0公開:** PR566/main `f8dde2b78ac9fa81c388f0495ed779e7321379d2`、package CI39884702345・landing CI39884702372・Netlify39885561755はsuccess。同じ3 read-only toolsを既存Netlifyのpublic HTTPS MCPから呼び出し、公式SDK clientでWeb版と同じ75 records/48 sources/SHAを返すことを確認する。11testsとfresh reviewerの追加118assertはPASS。v0.2.0 tarball24,833 bytesは公式GitHub digestと公開GETのhashが一致し、公開URLのnpm導入・CLI/stdioが同じ75/48を返す。公開privacyも200。証拠 → `docs/evidence/ai-monk-{remote-mcp-production,cli-mcp-v02-release}-20261023.json`。

**plugin認証の旧snapshot:** [plugin portal](https://platform.openai.com/plugins)の旧browser readbackは`/login`からGoogle既存account選択を経てOpenAI側のpasskey画面へ進み、代替リンク1回でも同画面を示す。証拠 → `docs/evidence/ai-monk-plugin-auth-boundary-20261023.json`。これは最新認証状態ではない。現在のlive persistent contextでのOpenAI MFA境界は `docs/evidence/ai-monk-plugin-auth-diagnosis-20261023.json` を参照する。MCP稼働やZIP公開を掲載済みと扱わず、未認証画面だけで権限不足や本人手続き必須を断定しない。日次投稿・費用照合はGrok Bot担当。実購入/paid納品と画像未取得2件は未確認を保持する。


**書籍の発売告知:** 公開済み英語版の告知を既存Postiz @selawmqtで1件行う。既存database告知は再送せず、別campaign `art_of_ai_monks_book_launch_en`、直接販売ページURL、無料全文と有料整形済み版の明示、creatorへの敬意を含める。copy・参照・検証済み成功事例がない穴・計測指標は `docs/evidence/ai-monk-book-launch-copy-20261023.json`。同じ対象/媒体/目的の実績が未取得のため、小さい1件の検証とし、retweet・売上・利益を約束しない。SKU全体のStripe公式全page読戻しでは16:17 UTC時点で支払済み注文0件。campaign帰属の注文やclickは未確認として分ける。

書籍のX告知はPostiz `cmvjqztrg1hrgot0ymefyzjqt` がPUBLISHED、[公開投稿](https://x.com/selawmqt/status/2113304729166213433)を公式readback。既存database告知と別campaign、重複送信0。independent X timeline・閲覧数・campaign click/注文/利益は未確認。本文・receiptは `docs/evidence/ai-monk-book-{launch-copy,x-launch-en}-20261023.json`。

**AM-13両版の注文snapshot:** Stripe公式の全page照合（`docs/evidence/ai-monk-book-ja-production-20261023.json`）は英語0件・日本語0件の有料Checkoutを確認する。公開や未払いcanaryを売上へ換算せず、paid本番納品は未検証を保持する。


**日本語書籍のX告知契約:** 公開済みの日本語版をPostiz @selawmqt/integration cmt4l2jld031tqp0y8qtyo983で1件告知する。既存database/英語書籍の告知を再送せず、別campaign art_of_ai_monks_book_launch_jaを使う。直接の日本語販売ページ、正題、無料原稿全文と有料PDF/EPUB $9.99、確認済みcreator @shalevhvsへの敬意を明示する。live pageと公式integration有効・72投稿内の既存JA書籍告知0・JA既存publication fenceなしを確認する。copyのX文字数上限は保守的に273で、未知の閲覧/click/注文/利益を0にしない。同対象/媒体/目的の成功指標は既存調査で未確認のため、小さい1投稿の検証として扱う。外部送信前に具体copyと根拠を独立read-onlyで照合し、既存book launch手順の永続effect fence/公式GET readbackを再利用する。受付が不確実ならGET照合だけを続け、新規POSTを再送しない。完了はPostiz PUBLISHED/同account/同content/正確な公開permalinkとDais用copy。正本copy → docs/evidence/ai-monk-book-launch-copy-ja-20261023.json。


**日本語書籍X告知の実結果と残件:** Postiz id `cmvkoqikc2huxlh0yjbzwnayu` は公式PUBLISHED、https://x.com/selawmqt/status/2113542427495841883 。本文の正題/価格/無料原稿/creatorは公開されるが、末尾の販売URLはproviderの保存済み本文とlive X取得本文の両方に存在しない。送信1件、再送0件。`GET /public/v1/integration-settings/cmt4l2jld031tqp0y8qtyo983` はlinks will be strippedというhostルールを明示する。一次sourceのSTRIP_LINKS_FROM_X_POSTSと保存前/送信前strip処理に一致し、shortLink:falseでもリンクは残らない。bare domainもhelperの対象であり、同経路の再投稿/replyで回復できるとは扱わない。既存Postiz経由の過去EN/DB告知もリンク保持は未証明へ戻し、本文公開と送客完了を分ける。当初の既存X identity `x:anicca/@selawmqt` はreachable=falseだったが、容量回復後に正規launcher/leaseで同じprofileを復旧し、本人handleと親投稿をlive照合する。販売リンクは下記のnative返信で補完済みである。新しいaccountや他者profileで代替せず、閲覧/click/注文/利益は未確認を保持する。正本receipt → docs/evidence/ai-monk-book-x-launch-ja-20261023.json。今後のX外部link投稿ではintegration-settingsのhostルールを送信前に読み、strip時に同経路へ送信しない。


**日本語書籍リンク補完契約:** 容量回復を既存producer gateの実許可で確認し、既存登録identity x:anicca/@selawmqtを正規launcherで復旧する。正確なsigned-in handleと親投稿2113542427495841883の本文をlive readbackした後、同じ親への返信1件だけで元の日本語販売URLを補完する。新しい告知本文を再投稿せず、Postizを再送しない。具体copy/hash/UTMは docs/evidence/ai-monk-book-ja-x-link-recovery-20261023.json。独立read-onlyでcopy/親/accountを照合し、native専用fenceを送信前に保存する。未知effectは再送せず同一親の本人返信/本文/実href/正確なpermalinkをGET/UIで照合し続ける。完了は本人返信のnative permalinkと実hrefの販売URL/UTM一致で判定し、composerの空欄やclick成功だけは証拠にしない。既存告知/receiptは削除・再帰属せず、閲覧/click/注文/利益は未確認を保持する。

**日本語書籍リンク補完の実結果:** native返信は https://x.com/selawmqt/status/2113556550073921584 。実際のCreateTweet応答でreply ID2113556550073921584、親ID2113542427495841883、expanded URLと日本語販売ページ/元UTMの完全一致を確認し、返信permalinkを別に開いて本人本文を照合する。送信前のO_EXCL/fsync済み専用fenceを保持し、native送信1件/再送0件。元Postiz id/本文/permalinkは保持し、同Postiz再送0件。使用した自分のleaseはrelease後holder空、browserは停止しない。リンク配信の欠落は補完済みだが、閲覧/click/注文/利益は未測定であり、売上やretweetを導出しない。原告知と別のnative receiptを docs/evidence/ai-monk-book-{x-launch-ja,ja-x-link-recovery}-20261023.json に保存する。当時の次段階であるEN/DB告知のリンク補完は後続の実結果を参照する。日次配信・費用照合・復旧はGrok Bot担当とし、現在cursorへ運用作業を戻さない。


**既存EN書籍/Database英日リンク補完:** 3件とも公開X本文に元URLが無いことを読み取り確認する。Postiz hostのstripを回避する再投稿はせず、各exact parentへ元UTM付きnative返信1件だけを行う。具体copy/hash/親/本人/at-most-once境界と残TODO正本 → docs/superpowers/plans/2026-10-23-ai-monk-existing-x-link-recovery.md。JA書籍補完済み返信は対象外。新たな閲覧・click・注文・利益・retweetを推測しない。


**既存3告知のリンク補完結果:** 英語書籍返信2113582983580139758、Database英語返信2113583291374952934、Database日本語返信2113583436426625030で、各exact parent/元URL+UTM/native応答/別permalinkの本人本文を照合する。各送信1/再送0、元Postiz receiptを保持。自分のleaseはholder空へrelease、browserは停止しない。JA書籍の先行補完と合わせて既存4告知の目的URLを配信するが、閲覧/click/注文/利益/retweetの達成とはしない。69pendingの根拠拡充は継続課題、既存ownerの費用制御/実配信/復旧はGrok Bot担当とする。旧30/30 snapshotを現在状態と扱わず、現在cursorは末尾を参照する。

**収益一次資料の追加範囲:** 制作者本人の公開記事を収益の一次申告として調査JSONへ追加し、既存の第三者記事とscreenshot由来の申告履歴を保持する。公開日・取得時刻・対象persona・期間を記録し、gross/net、通貨code、同記事内の合計が整合しない部分は未確認として明記する。6か月のheadlineを現在月商や比較可能な3か月USD grossへ換算しない。公開対象4件・pending69件・除外2件と既存sort契約は維持する。受入条件はsource参照の整合、未知値を維持した既存関連test、main/公開JSON/remote MCPへの反映とする。英日書籍のリンク補完後の公式注文snapshotも証拠へ追加する。Factoryの共有ownerと本番stateは変更しない。

**収益一次資料のsource受入:** 本人記事 `https://x.com/i/article/2042242260784537736` の公開日はHTMLの2属性が一致する2026-04-09T14:04:32.000Z、取得は2026-10-23T11:01:27.030748+00:00。最初の3か月$300K、冒頭の6か月$500Kに対し、後半のYang Mun累計$450Kと別6キャラクター$50Kの範囲が整合しない。既存claimを消さず、未監査の本人申告と不整合を追記する。3か月USD grossの既存sort数値は変更しない。archive75件/出典57件、公開4件/pending69件/除外2件、canonical SHA256 `8711cf04c6c310a3ea07bf4a72e4387be18207e45b20a001457ed0f59edd0ff4`。関連helper9件とCLI/stdio/HTTP/独立install13件、全source参照とscope不変の照合はPASS。新しいread-only reviewerの指摘は0件。CLI patch版はv0.4.1とし、統合/公開readbackはこのsource受入だけで完了にしない。証拠 → `docs/evidence/ai-monk-creator-business-source-20261023.json`。

**リンク補完後の有料注文snapshot:** 2026-10-23T10:54:49.877550+00:00のStripe公式GETは対象期間の全pageを走査し、新刊のpaid Checkoutは英語0件/日本語0件。provider書込0/self-purchaseなし。fees/refunds/settlement/profitとcampaign帰属は未検証であり、利益0やX返信の効果へ換算しない。証拠 → `docs/evidence/ai-monk-book-paid-orders-after-x-link-recovery-20261023.json`。

**本人収益申告とv0.4.1の公開受入:** PR591/head `47051952ce86aa2bee0ae610ed143f0d9fc6d876` はpackage CI39943660190、Landing CI39943660200、CodeRabbitがSUCCESSでmain `c66e4fa4fab2052328e26a454c2bb598d64ca7b4`へ統合する。Netlify39944184677は同mainでSUCCESS。公開HTMLのH1/4件/顔画像4件/AI status非表示/4sort/本人claim本文とsource link、公開JSONの完全一致、公式SDKによるremote MCPの4件/57出典/75archive/本人claim完全一致を確認する。公開CLI v0.4.1は同mainを指すofficial tag、asset digestとdownload SHA、公開URLからの実installを照合し、同じsnapshotを返す。旧v0.4.0は履歴として保持する。証拠 → `docs/evidence/ai-monk-creator-business-production-20261023.json`、`docs/evidence/ai-monk-cli-mcp-v041-release-20261023.json`。この受入はFactory運用や注文獲得の完了ではない。


**過去の順序更新と担当境界:** Factory既存投稿/費用/資源復旧→Database根拠拡充→Web appから、Database73件復元→Monk Factory Web→Muse/ChatGPT配布口へ変更し、Database復元とWeb公開/localhost plan受入を完了する。当時の順序であり、現在scopeと実行順は末尾を参照する。既存投稿effectやownerを中断・再送しない。Museの具体service URLは未特定で、推測した別サービスへ公開しない。


**73件復元の公開受入:** PR595/main6ac3f6c、Netlify39953593583はSUCCESS。公開HTML73card/候補注記69、公開JSONとmainの完全一致、公式SDKのremote MCP全4sort/search/get73件、v0.4.2公式tag/assetdigest/公開URL導入/実stdio一致を確認する。制作根拠確認4件、調査中69件、対象外2件を区別し、公開画像71件を保持する。復元計画は完了済み。証拠 → `docs/evidence/ai-monk-directory-restoration-production-20261023.json`、`docs/evidence/ai-monk-cli-mcp-v042-release-20261023.json`。

## Factory Webの公開・localhost受入

Life Manager PR8721/main `eb78a805c4f79cd807852c27f52f9e4207a1ba61` とproducts PR602/main `fcbe8ec027bcc78825f5e50e0d83d0926a036525` を受入する。関連37PASS、fresh最終blocking0、Security Scan39964362189・Landing CI39966601616・Netlify39967298318は全SUCCESS。公開 https://aniccaai.com/ai-monk-factory/ とslash無しの入口、固定4filesのhash、Database CTAと73/69維持、公開draftの保存/reload/実download/importを確認する。専用immutable localhostでは空scriptから実Codexが台本を生成し、MCP→実Python offline planがplanned/exit0、Factory provider_calls0/external_effects[]を返し、履歴再表示まで受入する。これは実HeyGen生成・投稿・native公開・売上の証明ではない。詳細 → `docs/superpowers/plans/2026-10-23-ai-monk-factory-web-publish.md`、合成証拠 → `docs/evidence/ai-monk-factory-web-production-20261023.json`。

## 現在scopeと優先順

Factoryの完成形は、利用者が自分のInstagramを先に接続し、独自avatar・台本・縦動画の制作と投稿を自動実行するcloudサービスである。TikTokは後続とする。現在の公開draft保存とlocalhost plan受入は部分成果であり、SaaSの完成ではない。詳細契約 → 末尾「Database・Plugin・Factoryの追加契約」。

旧順序はDatabase復元→Factory Web→plugin配布・認証診断。新順序はDatabase→CLI→pluginの配布・販売を先行→Factory完成形の実装。Daisが配布・販売を先に進めると指定し、既存の研究データとCLI/pluginを先に利用可能な経路へ届けられるため、この順に変更する。販売はユーザー意図であり、無料配布・install・tool受入を販売済みや売上へ換算しない。確認したプラットフォーム内販売条件と未確認の販売経路 → `docs/superpowers/specs/2026-10-23-ai-monk-plugin-marketplace.md`「販売条件」。日次投稿と既存Factory運用はGrok Bot担当のままとし、進行中のeffectを中断・重複させない。

## 現在cursor

実行順・残TODO・現在のDatabase/CLI/Registry/Plugin公開・正式提出状態 → docs/superpowers/plans/2026-10-24-ai-monk-research-distribution.md。

日次IG/TikTokと既存HeyGen/Postiz/loopはGrok Bot所有。Factory SaaS・実生成/本人接続/自動投稿/metrics・有料注文・USD10K MRR・他者無人収益は未完を保持する。OpenAI/Museのprovider gate、現状、正式提出・掲載の違いは `docs/superpowers/plans/2026-10-24-ai-monk-research-distribution.md` を正本とし、account固有のappeal結果と本人提示画面を同一accountの証拠と推定しない。

## Database・Plugin・Factoryの追加契約

この節はDatabase・Plugin・Factoryのproduct契約を定める。実行順の変更履歴とcurrent cursorの正本は `docs/superpowers/plans/2026-10-24-ai-monk-research-distribution.md` とする。OpenAI identity/review待ちでDatabaseやFactoryを停止せず、進行中の公開Release/PRやGrok Bot所有の日次posting effectは中断・重複しない。

### 事業目標と公開状態

1. **AI Monkの専門性と最大級のDatabase:** 既知プロフィールをできるだけ広く収録し、creator・platform・followers/views・商品・価格・期間/通貨付きの売上根拠を継続調査する。世界最大・全件網羅は比較調査で立証するまで公開主張しない。
2. **Instagram/TikTokの成長:** 日次投稿のownerはGrok Bot。Postiz integration IDはTikTok `cmo5rwq2p00twn10yrsdglng3`、Instagram `cmoopzaak04yop70y1yx1bwr1`。Codexは日次投稿を変更・重複しない。フォロワーや再生数はplatform公式readbackと観測日を添えて追う。
3. **AI Monk ebook事業の月間継続売上USD10,000超:** 目標は未達。Recurring MRRは実際の有料Stripe invoiceから測る。現在の一回払いebook売上、install数、followers、creator申告はMRRへ換算しない。
4. **誰でも使える無人運転Factory:** Web SaaSを先に提供し、APIを通じて一度のInstagram OAuth後に既定avatar/profile/scriptと縦動画を生成し、毎日自動投稿する。利用者に初期設定・日々の操作を求めず、profile編集と停止を可能にする。無料枠は完成動画3本・期限なし・カード不要で、3日trialは置かない。Instagramを先行し、TikTokは公式審査後に追加する。CLI/Pluginからの操作はtenant認証済みFactory APIの後続とする。

Databaseはv0.4.20で75件のarchive、73件の公開プロフィール（included 6 / pending 67 / excluded 2）、239出典、120 offer rowを持ち、42プロフィールに商品観測、1プロフィールに売上観測がある。以前4件しか表示されなかった原因は、共有selectorがincludedだけを公開しpendingを隠したこと。PR/main `26f752c15`でincludedとpendingを検索・個別取得・集計へ戻し、現在の本番WebとCLI/MCPは73件を返す。研究archiveの削除は確認されていない。ユーザーが記憶する17件の画面は該当snapshotをまだ特定していないため、古い4件表示と同一原因と断定しない。現在の実測と実行順 → `docs/superpowers/plans/2026-10-24-ai-monk-research-distribution.md`。

Codex向けrepo Plugin v0.1.4は公開済み。正式ChatGPT Directory掲載はユーザー提示のPersonal/Default画面でIdentity in reviewのため未提出・未掲載。過去に無効化されたOpenAI accountの状態を今回の画面と同一accountと推定しない。Museは既存submissionの審査中で、最終承認/listingは未確認。Grok Connectorsのpublisher listing経路も未確認。これら外部gateはDatabase/CLIとFactoryの独立作業を止めない。

Databaseは既知の73公開profile/75archiveを対象に、creator・媒体・言語・商品名/価格/URL・出所付き期間/通貨/売上claimを精査し、新しい実在候補も追加する。全世界の全件網羅を証明済みと呼ばず、調査範囲・取得日・未確認を表示する。価格を売上、本人申告を監査済み収益、未知を0へ変換しない。公開中pendingのreasonに残る非掲載という古い説明も正す。

PluginはDatabase由来の制作手順/台本/format/product researchを検索できる、既存6toolsの無料read-only研究配布とする。Codex repo/Registry公開とOpenAI Plugin Directory、Muse Connector、Grok Connectorsを別々の配布経路として扱う。OpenAI DirectoryはChatGPT/Codex両方のdiscoverabilityを提供するが、正式提出には個人またはbusiness identity verification完了、verified Developer identity、organization ownerまたは`api.apps.write`、MCP scan・review・approval・publishが必要である。`Identity in review`の間は正式reviewへsubmitしない。Directoryではdigital goods/services・subscription・content・creditsの直接/間接販売、freemium upsell、価格・trial・promotionの宣伝やtransaction linkを認めないため、Pluginは独立価値を持つ無料research toolとし、ebook/Factory課金導線をDirectory内に置かない。Museはbusiness verification・data processing questionnaire・integration credentials/tool documentation・reviewer test account/demoを含む独立submission/reviewで、Approved後にdiscoverableとなる。Museでsensitive writeと分類されたtoolは毎回の承認が必要でAlways allowにできない。SNS publishがどう分類されるかはMuse reviewまで未確定なので、Factoryの無人投稿をMuse Connectorの機能として約束しない。無人運転の正本はFactory Webの一度限りのInstagram OAuthと、その後のserver-side official APIである。Grok [Connectors](https://grok.com/connectors)はuser-facing connection entry pointを示すが、取得した公開公式資料ではpublisher listing flowを確認できない。connectionをmarketplace listingと呼ばない。現状と残TODOは `docs/superpowers/plans/2026-10-24-ai-monk-research-distribution.md` を参照する。

FactoryはDatabaseと一体のcloud Web appとし、詳細契約は `docs/superpowers/specs/2026-10-24-ai-monk-factory-saas-design.md` を正本とする。無料は時間制ではなく、完成したAI Monk動画3本。利用者はInstagramをOAuthで一度接続し、Factoryがmonk avatar・名前・profile・台本を既定値で選び、毎日自動生成・投稿する。初期設定は不要とし、profile編集と自動投稿停止はいつでも可能にする。Instagramを先行し、TikTokはContent Posting APIの公開監査後に追加する。web appを先に完成し、iPhone appは後続とする。料金・月間本数はReelFarmの無料3本/自動運転/分析導線を参考にし、動画生成原価・投稿API・決済費から利益が残る値を決める。3日trialは採用しない。現在のdraft/local plan完成からSaaS提供を達成扱いしない。

初回のFactoryローンチはE2E受入後、Xへ一度だけ告知する。継続配信は初回ローンチと分け、観測済みの新しい成果・改善だけを扱うループで行う。X向けcopyは同じ対象・媒体・目的の成功事例を先に調べ、導入・構成・見せ方・CTAを自社の確認済み事実で組み直す。既出ローンチの再送や未確認の再生数・売上・利益は使わず、公式receipt/permalinkを残す。既存Grok Botの日次IG/TikTok投稿は引き続きそのownerに任せ、素材・投稿の重複を避ける。

### 継続改善・配信ループ

このsessionの一回限りの出荷目標は、Factory Web/APIの実E2E受入と初回Xローンチ一度だけである。Databaseのsource追加、Factoryの製品改善、継続的な配信は、その2つの完了後に反復loopとして運用する。既存daily Database task/heartbeatのownerと状態を確認して再利用し、現在稼働中の投稿やtaskを中断・重複させない。重複scheduleやMac常駐loopは作らない。

1回のloop起動は有限runとし、Databaseはsource-backedの小さな1batch、製品改善は公式analytics・有料conversion・実費・support/feedbackから最優先の1件、X配信は新しい根拠か出荷差分に基づく最大1投稿までとする。各runはsource・取得時刻・変更・テスト・main/公開readback・投稿receiptを保存して終了する。新しい根拠や改善対象がないrunは投稿・変更を捏造せず、その理由だけを記録する。Follower数、seller claim、未確定売上を0や利益へ換算しない。日次Grok Bot投稿、Factory利用者ごとの日次生成job、内部のDatabase/product/distribution loopは別owner/effectとして扱う。

Database根拠拡充は67IG候補の公開UIから64followersとbio言語を追加し、公式15site中13siteから20商品（18価格/2unknown）を記録する。source139、73public/75archiveと既存収益観測1件を保持し、本人AI開示でreported6/unverified67となる。package15tests/shared helper9testsはPASS。PR614/main fbc141f759c01d0d14269f22e4f75525fcf252c0、最終head package/Landing CI成功、fresh最終blocking0を受入する。CLI v0.4.4の公式asset669669941/digest/公開GET200/公開URL導入/実stdio6toolは完了し、Netlify39985074291はSUCCESS、公開JSONはmain bytesと完全一致し、Web73件/139出典とremote MCP6tools/73件/139出典/reported6/unverified67/snapshot SHA一致を受入する。公開証拠 → docs/evidence/ai-monk-database-v044-production-20261024.json。証拠 → docs/evidence/ai-monk-research-integration-20261024.json。

MCP Registryは既存remote-only metadataをGitHub OIDCで登録する。公開契約と現在cursor → docs/superpowers/plans/2026-10-24-ai-monk-mcp-registry.md。ChatGPT/Muse公式審査掲載、販売/注文、Factory SaaSの達成とは区別する。

## 残28入口の商品観測統合

Databaseの今回範囲は、保存済み公開一次資料の28 discovery入口・33商品の追加観測である。private readbackには49 source候補があるが、商品内容またはprofileから商品の帰属経路を実際に支えるsourceだけをcanonicalへ引用し、未取得URL・失敗本文・非商品経路を無条件に出典数へ加えない。source URL、取得日・時刻、private証拠のSHA-256を保持し、raw本文は公開repoへ複製しない。

既存139 source、75archive、73public、included4/pending69/excluded2、既存収益観測1件と各profileのAI状態・画像・指標を保持する。商品は既存`offers`の数値`price`、`currency`、`source_id`と補足metadataへ合わせる。数値価格26件のうち通貨未確認4件は`currency: null`のままとし、記号・free/PWYW・参考価格・分割払い・定期購入variantを区別する。価格不明7件、注文・売上不明はnullを保持する。review・購読者・収録点数を注文や収益へ換算しない。Zen Munの月額placeholderとbonus価値から現在価格を作らない。

重複する2入口は同一`observation_id`の商品へ帰属させ、accountごとの関連行とdistinct商品数を区別する。先行crawl再利用2入口は取得時刻と既存sourceを保持し、先行20商品へ追加していない商品だけを採用する。既存商品と同一の可能性があるYon Chenの30-Day Healing Journeyは新商品数へ算入しない。同名だけで同一SKUや所有者を断定しない。取得不可4入口と非商品1入口をreceiptへ残し、全件の内容確認や売上監査が完了したとは呼ばない。

このsource統合はRED→最小データ統合→GREEN・既存package15/helper9検証を通し、v0.4.5として公開する。当該データ差分はRegistry workflow、plugin payload、Factory、認証、投稿、checkout、有料APIと既存日次loopを変更しない。実行計画 → docs/superpowers/plans/2026-10-24-ai-monk-products-remaining.md。現在の全体cursorは上記の正本を参照する。

source受入では49候補から39 sourceを引用し、既存2 sourceを変更せず再利用、新規37 sourceを追加して176出典とする。33 distinct商品を35 account関連行へ統合し、seller counterは7関連行を追加する。未取得・失敗・非商品などの残10 source候補はreceiptへ状態とhashを残す。元139 source・75archive・73public・scope/AI状態・既存収益観測1件は不変。source acceptanceは未統合33件のREDからGREEN、参照628件のmissing0、既存package15/helper9とbuild済みAPIの33商品検索・出典返却・unknown保持を確認する。PR619/main bbd81158d27d0c8b84fe5fc656062f54df7f50d5へ統合し、v0.4.5の公開JSON/Web/CLI/stdio/remote MCPを同じsnapshotで受入する。source証拠 → docs/evidence/ai-monk-products-remaining-integration-20261024.json。公開証拠 → docs/evidence/ai-monk-cli-mcp-v045-release-20261024.json。

## 未確認商品価格・通貨の追加観測

v0.4.6で確定3系統のbase/定期/比較/presentment価格を分け、Kaelと他の未知値を維持する契約 → `2026-10-24-ai-monk-product-price-currencies.md`。

Arisの既存商品へseller JSON-LDの価格/通貨を新しい観測として追加し、過去の価格不明・未監査売上と区別する限定契約 → `../plans/2026-10-24-ai-monk-research-distribution.md`「商品構造化データの限定追加」。

Yang Mun現行offerの通貨/商品対応の限定追加契約と現在cursor → docs/superpowers/plans/2026-10-24-ai-monk-research-distribution.md「Yang Mun現行offerの通貨精査」。
