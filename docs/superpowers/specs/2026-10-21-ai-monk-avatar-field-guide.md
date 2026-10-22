# AI僧侶アバター記事と公開ディレクトリ

## 目的

Aniccaのブログを、AI僧侶アバターを読者が楽しみながら理解できる日英の読み物と、検索できる公開ディレクトリにする。Yang Munのケース、AI僧侶アバターの歴史・表現・販売導線、根拠を示すプロフィール一覧を同じサイト内で結ぶ。

## As-Is

- Yang Mun単独記事とAI僧侶フィールドガイドは英語・日本語の計4本が公開済み。公開URLは維持する。
- 4本の記事は証拠を整理している一方、導入と見出しが調査報告書寄りで、読者を引き込む物語・ユーモア・読み進める理由が弱い。
- `apps/landing/public/data/ai-monk-avatar-database-2026.json` の本番は75レコードと48出典。9件の調査対象プロフィールと66件の候補を検索・絞り込みできるWeb UIを公開済み。
- Yang MunのAI生成状態は、HeyGenとColumbiaの説明に対し、Columbiaがリンクする本人側ページが「本人は実在し、声だけAI翻訳」と主張している。現時点では食い違いを解消できない。
- 追加提供されたInstagram画面には100〜102件のフォロー中表示と複数の僧侶風アカウント名が写っている。リスト全体でもAI生成状態でもなく、個別確認用の候補発見材料。
- `/monk` は既存eBook販売ページなので使用しない。
- Xの前回4投稿は、各記事への直接URLを含み、Postizの `PUBLISHED` とX permalinkを記録済み。今回の記事改稿・新ディレクトリを告知する投稿は別途必要。
- ApifyのInstagram Scraperページは公開閲覧できる。実行用Apify連携はこの環境のツール一覧になく、認証SSOTにも `service=apify` の記録がない。

## To-Be

1. **読者向け記事4本を改稿する。** 既存slugを維持し、本文・H1・descriptionを更新する。中心タイトルは `Yang Munの衝撃` / `The Yang Mun Shock` と `AI僧侶列伝` / `The Art of AI Monks`。副題は読者の好奇心を増す場合だけ付ける。
2. **履歴・事実・分析を一つの読み物にする。** Yang Mun記事では65秒Shortから人物の正体をめぐる矛盾、動画の仕組み、30日プログラムとeBook、異なる収益主張、宗教的な信頼の問題へ進む。総覧記事ではAI生成の僧侶キャラクター、実在僧侶の仮想アバター、物語アニメーションを分け、文化の前史と現在のSNS型を描く。
3. **検索可能な公開Webディレクトリ `/ai-monk-database` を作る。** 画面上部の検索、証拠状態・言語・プラットフォーム・地域の絞り込み、スクロール可能なプロフィールカードを備える。検索対象は表示名、別名、handle、creator、国・地域、言語、SNS、提供物。
4. **プロフィールに根拠を残す。** 調査対象プロフィール9件と、未確認候補66件を区別して表示する。確認状態、creator、プロフィールリンク、投稿言語、地域情報の根拠、見える商品導線、取得時点付き数値、出典、未確認事項を表示する。候補のAI生成状態・運営者・国・言語は推測で埋めない。
5. **開いたデータへ読者を案内する。** 公開JSONとGitHubのデータファイルをリンクし、プロフィール追加を提案できる導線を置く。更新可能な初期ディレクトリとして公開し、「世界初」「世界最大」「全件網羅」は調査で立証できるまで主張しない。
   コードはAI Monk Indexの実装ファイルに限ってMIT、Anicca執筆のデータ要約・編成はCC BY 4.0で公開し、第三者素材の権利を含めない。
6. **記事とXを新しいディレクトリへつなぐ。** 2言語の記事から検索UIへリンクし、公開後に既存Postiz経路で新規の告知投稿を行う。本文に直接URLを含め、post receiptとpermalinkを記録する。前回4投稿は重複送信しない。

## 編集方針

- 想定読者は、短尺動画の文化、AIキャラクター、SNS上の商売に興味がある英語・日本語の一般読者。読み終えた後に、少なくとも一つのプロフィールを検索し、主張と根拠を自分で確かめられる状態を目指す。
- 各記事の冒頭は具体的な場面・奇妙な事実・問いのいずれかで始め、記事の中心発見を早めに見せる。見出しには情報ラベルでなく、続きを読みたくなる主張を置く。
- Malditaの調査記事の「場面から始め、具体例を重ね、調査範囲と限界を明かす」構成、および既存Anicca記事の一人称の場面描写・手触りのある数字・会話調の節運びから、構成上の仕組みを学ぶ。文章、台本、動画、画像、顔、声、デザインの複製はしない。
- 読者が使える情報として、確認済みSNS、創作者、公開商品、価格、動画の構図と話の運び、未確認事項、更新日を具体的に示す。
- 視聴者数、再生数、商品価格、seller counter、creator claim、売上、利益、注文を区別する。自己申告・販売ページ・広告主の顧客事例は、その情報源の主張として示す。Yang MunのAI生成状態に関する一次発信と報道の矛盾も併記する。
- AI僧侶の台詞は全文転載せず、hook・感情の展開・映像・CTAの仕組みを要約する。健康上の主張は医療助言として紹介しない。
- 収益や医療効果、AI生成状態、制作者、アカウントの所在地を未確認のまま断定しない。

## データとUI契約

- 正本データ: `apps/landing/public/data/ai-monk-avatar-database-2026.json`。9件の調査対象プロフィールと66件の未確認候補を分けて保存し、確認できた `languages` と `region_evidence` だけを追記する。
- `languages` は、プロフィールまたは投稿サンプルで言語を確認できた場合だけ値を持つ。初版では英語・スペイン語を表示し、SifuChenの投稿言語など未確認は空欄のまま「言語未確認」とする。
- `region_evidence` は地域名と根拠の種類を持つ。創作者の居住地、プロフィールに表示された国旗、対象市場を同じ「所在地」として扱わない。
- UIは既存のNext.js 14、React、Tailwind、静的JSONを使う。ユーザー登録、投稿フォーム、外部DB、決済、APIスクレイピング、追加npm依存は含めない。追加提案はGitHubへのリンクで受ける。
- 検索は入力ごとに表示名・別名・creator名とプロフィールURL・地域・言語・プラットフォーム・handle・商品名・creative sampleタイトルを対象に大文字小文字を無視して絞る。各選択フィルターはANDで組み合わせ、該当件数と0件時の状態を表示する。
- カードには実在人物の肖像画像を転載しない。表示名、個別色の記号、状態ラベル、提供元へのリンクで見分けられるようにする。
- Mobbinの実画面から、Mailchimpのディレクトリ検索hero、Semrushの一覧＋絞り込み、Workableの検索＋状態chipを参考にする。画面のコピーはしない。

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
- `/ai-monk-database` に9件の調査対象プロフィールと66件の未確認候補が表示され、名前・handle・creator・language・region・platform・offer・evidence statusを検索または絞り込める。
- 検索語とstatus/language/platform/country filtersがANDで機能し、未知・未確認値は誤って確定値に見えない。
- 各profileの根拠ソースへ直接移動でき、データJSONとcontribution linkがある。
- 既存の4 X記事投稿を再送せず、新規告知投稿には公開済みの直接URLが含まれ、Postiz `PUBLISHED` とX permalinkを記録する。
- 関連テスト、landing build、PR CI、main merge、Netlify production readbackが通る。

## Atomic TODO / 現在cursor

| ID | 変更対象 | 依存 | DONE |
|---|---|---|---|
| AM-7 | 既存AI monk datasetへ確認済みの言語・地域根拠を足し、`apps/landing/lib/ai-monk-directory.mjs` に検索・AND filter関数を定義。 | 出典照合済み5件 | テストでname/handle/creator/language検索、status+language+platform filter、未知値、0件を確認。 |
| AM-7B | 追加スクリーンショットの完全に読めるhandleを候補レコードとして追加し、AI状態・creator・言語・所在地は `unverified` / unknown のまま保持。Instagramの明示許可なし自動取得は行わない。 | AM-7, user-supplied screenshots | 候補レコードは既存検索で名前・handle検索でき、UI上で調査済みプロフィールと未確認候補を見分けられる。 |
| AM-8 | `apps/landing/app/ai-monk-database/page.tsx` と `apps/landing/components/AiMonkDatabase.tsx` でレスポンシブ一覧を構築し、記事とJSONへの導線を付ける。 | AM-7, AM-7B, Mobbin UI参照 | `/ai-monk-database` routeがbuildされ、検索欄・filter・profile cards・sources・open-data linkが表示される。 |
| AM-9 | 4つの既存研究JSON本文を英日記事として改稿し、指定タイトル、歴史、creator、video structure、offer、根拠と限界、database linkを入れる。日本語2本はYomiyasu v2.1.1（`fbe02c93877d697cc53d9377b7a45dd8a1dd99b3`）のlint・diff・修正1回・最終hash verifyで校正する。 | AM-7, AM-8, source references | JSON parse、見出し数・順の保持、Yomiyasuのrunとverify、既存記事slugと直接リンク確認。 |
| AM-10 | focused checksとlanding buildを実行してPRを作成、merge、production readbackを行う。 | AM-7–9 | exact-head CI PASS、main SHA、Netlify deploy、記事4本とdatabase UIのHTTP/readback。 |
| AM-11 | databaseと改稿記事を英日でX告知し、直接URLを本文に含める。 | AM-10, Postiz identity/session readback | 送信ごとにdistinct `PUBLISHED` receipt/permalink、重複ゼロ、記事UTM click countの初期値を記録。 |

**順序変更:** 旧cursorは記事改稿だった。Daisが検索Webアプリを先に作るよう指示したため、旧順序（記事→UI）をデータ/検索契約→候補登録→UI→記事→配信へ変更。今回のInstagramフォロー画面は未確認候補の収集としてAM-7Bへ挿入し、自動スクレイピングなしで候補の出所を保持する。

**現在cursor:** AM-14 — AM-12の初期英語調査、AM-10本番公開、AM-11英日X告知は完了。既存factoryの生成結果照合と配信復旧を進める。

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
| AM-14 | 自社AI monkで学習を実践 | 既存avatarとHeyGen、承認済み台本/素材を使い、既存ownerの日次TikTok/Instagram cadenceを診断・復旧。投稿日/URL、制作費、流入・注文を対応付ける。 |
| AM-13 | 新刊 The Art of AI Monks | 既存outlineを継承し、英語初版は約8,000–12,000語の10章全本文、front matter、具体例・仮定を明示した計算例、再利用可能なワークシート、出典appendixと機械可読source manifestを先に完成させる。その後の日英EPUB/PDF、販売ページ・SKU、公式出版/納品readbackまでがAM-13全体の完了条件。出版・注文・売上は原稿完成だけでは達成扱いにしない。 |
| AM-15 | 再利用できるOSS factory | 自社で通った経路を既存実装から切り出し、秘密を含まないsetup・asset license・一連のCLI・dry runを公開。機械可読JSONの利用例を提供。 |
| AM-16 | factoryの有料web app | 実測済みfactoryをsubscriptionへ接続し、顧客ごとのaccount・素材・予算・公開先を分離。契約、決済、生成・配信、解約の公式readbackを閉じる。 |

**AM-13本文進捗:** 英語初版 `docs/books/the-art-of-ai-monks-en.md` と `docs/books/the-art-of-ai-monks-sources.json` の初版執筆・source acceptanceは完了。正題 The Art of AI Monks、副題 Avatars, Attention, and the Business Behind the Robes、著者Anicca、snapshot明記のfront matter、全10章、4種の再利用sheet、methodology/coverage limits、32参照と元48 sourceのmanifestを備える。URL・参照label・数値だけのtokenを除く英語語数は全体10,874語、付録前9,424語、10章本文8,787語。75 records / 48 sources、調査対象9件と未確認候補66件、AI status reported4 / unverified71 / confirmed0を保持し、first-party主張・独立取材・過去の観察・metadata-only・推論・架空演習を区別する。Yang Munの身份の不一致、seller counter/価格/creator収益申告の限界、自社factoryの未復旧・未販売を明記。JSON parse、10章/4 sheet/32参照の整合、48 source一致、長文段落重複ゼロ、機微文字列scan、語数、diff checkはPASS。原著本文・script・sheetはCC BY 4.0、第三者素材は対象外。外部公開・課金・credential操作は本文作業に含めない。共有indexを避けるrootの指示により、専用branchのcommit/push・remote SHA照合とformat/公開はrootへ一本化する。本文snapshotを完成として渡し、AM-13全体は未完。

**AM-13英語初版の小段階:** 本文・出典完成→既存pandoc/WeasyPrintによる英語EPUB/PDF→既存landing・Stripe checkout/納品経路の本書SKU対応→公式公開/納品readbackの順で進める。日本語本文・日本語EPUB/PDFは後続とする。初版価格は既存調査で確認したcreator書籍のKindle表示価格 `$9.99` を単一の比較基準に採用し、実売・利益・bestseller・収益保証の根拠にはしない。販売ページ公開、購入、納品、注文、売上は個別の公式readbackが得られるまで未達とする。本文担当は上記3ファイルを所有し、format/SKU/販売経路はroot担当が進める。

**順序更新:** 旧順序はAM-10→AM-11。公開版が5件のまま、検索UIが404という実測と、英語・有力アカウント優先というDaisの指示に基づき、AM-12調査をAM-10公開準備と並行し、AM-10→AM-11→AM-14（既存配信の限定復旧）→AM-13→AM-15→AM-16へ進む。旧順序AM-13→AM-14を入れ替える理由は、公式Postizで10/21以降の新規eBook公開がなく、旧HeyGen生成要求と3件のeffect fenceが現在の収益導線を止めているため。新刊執筆より先に既存ownerの未完処理を閉じる。既存外部effectは中断・再送しない。

**AM-12実測:** 接続vidIQで公開profile/discoveryを取得し、yt-dlpでYouTube最新20件と公開投稿metadataを確認。新4候補と既存5件更新を統合して75 records/48 sources。AI生成statusはreported4、unverified71。vidIQは既存credits不足のため停止、新規課金なし。Instagram直接取得はrobots notice確認後に停止し、継続経路は接続providerとcreator公式site/YouTube metadataとする。詳細は `docs/evidence/ai-monk-english-research-20261022.json`。

**公開済みの証拠:** AM-10はPR [#551](https://github.com/Daisuke134/anicca-products/pull/551)、main SHA `d4380515c995abd0611987bedead436fbe432dcb`、exact-head Landing PR buildとNetlify run `39800192156`がsuccess。検索UI、英日4記事、75 records/48 sourcesのJSONをHTTP 200でreadback。詳細は `docs/evidence/ai-monk-index-production-20261022.json`。

**X公開済み:** AM-11はPostiz公式GETで英語 `cmvjodr4i18bbot0y14apjr6z` / [X](https://x.com/selawmqt/status/2113286528508285146)、日本語 `cmvjofwki18joot0ye8ugzfyl` / [X](https://x.com/selawmqt/status/2113286777054360059) をPUBLISHED確認。接続は両方 `@selawmqt`。独立したX timeline readback、閲覧数、click、注文、売上は今回未測定で0とはしない。本文とreceiptは `docs/evidence/ai-monk-x-launch-{en,ja}-20261022.json`。Dais用再投稿copyは同じ完成本文として提示する。

**factoryの現状と残TODO:** 現在の公式Postiz最新eBook公開は英語TikTok10/17、日本語TikTok10/19、日本語Instagram10/20。English IGは既存plan30/30で未接続。旧HeyGen requestのscript/video/cost照合、三ownerのexact effect readback、実Postizの自社宣伝disclosure、記事compose失敗の診断が必要。運用の正本はLife Manager `docs/superpowers/specs/2026-09-25-life-manager-unified-ssot.md` のS11。新刊の英語初版10章本文・出典manifestは完成し、日英outlineと表紙を継承する。日本語本文・EPUB/PDF・SKU・出版/注文/売上のreadbackは未完。factory OSS packageとsubscription web app、MCP/ChatGPT appは未実装。
