# AI僧侶アバター記事と公開ディレクトリ

## 目的

Aniccaのブログを、AI僧侶アバターを読者が楽しみながら理解できる日英の読み物と、検索できる公開ディレクトリにする。Yang Munのケース、AI僧侶アバターの歴史・表現・販売導線、根拠を示すプロフィール一覧を同じサイト内で結ぶ。

## As-Is

- Yang Mun単独記事とAI僧侶フィールドガイドは英語・日本語の計4本が公開済み。公開URLは維持する。
- 4本の記事は証拠を整理している一方、導入と見出しが調査報告書寄りで、読者を引き込む物語・ユーモア・読み進める理由が弱い。
- `apps/landing/public/data/ai-monk-avatar-database-2026.json` には5プロフィールと21出典がある。検索・絞り込み・閲覧のためのWeb UIはない。
- `/monk` は既存eBook販売ページなので使用しない。
- Xの前回4投稿は、各記事への直接URLを含み、Postizの `PUBLISHED` とX permalinkを記録済み。今回の記事改稿・新ディレクトリを告知する投稿は別途必要。
- ApifyのInstagram Scraperページは公開閲覧できる。実行用Apify連携はこの環境のツール一覧になく、認証SSOTにも `service=apify` の記録がない。

## To-Be

1. **読者向け記事4本を改稿する。** 既存slugを維持し、本文・H1・descriptionを更新する。中心タイトルは `Yang Munの衝撃` / `The Yang Mun Shock` と `AI僧侶列伝` / `The Art of AI Monks`。副題は読者の好奇心を増す場合だけ付ける。
2. **履歴・事実・分析を一つの読み物にする。** Yang Mun記事では65秒Shortから人物の正体、動画の仕組み、商品ページ、収益主張の不一致、宗教的な信頼の問題へ進む。総覧記事ではAI生成の僧侶キャラクター、実在僧侶の仮想アバター、物語アニメーションを分け、文化の前史と現在のSNS型を描く。
3. **検索可能な公開Webディレクトリ `/ai-monk-database` を作る。** 画面上部の検索、証拠状態・言語・プラットフォーム・地域の絞り込み、スクロール可能なプロフィールカードを備える。検索対象は表示名、別名、handle、creator、国・地域、言語、SNS、提供物。
4. **プロフィールに根拠を残す。** 5件の初期データをカードから読めるようにする。確認状態、creator、プロフィールリンク、投稿言語、地域情報の根拠、見える商品導線、取得時点付き数値、出典、未確認事項を表示する。国・言語・handleが分からない項目は空欄を推測で埋めず「未確認」とする。
5. **開いたデータへ読者を案内する。** 公開JSONとGitHubのデータファイルをリンクし、プロフィール追加を提案できる導線を置く。更新可能な初期ディレクトリとして公開し、「世界初」「世界最大」「全件網羅」は調査で立証できるまで主張しない。
6. **記事とXを新しいディレクトリへつなぐ。** 2言語の記事から検索UIへリンクし、公開後に既存Postiz経路で新規の告知投稿を行う。本文に直接URLを含め、post receiptとpermalinkを記録する。前回4投稿は重複送信しない。

## 編集方針

- 想定読者は、短尺動画の文化、AIキャラクター、SNS上の商売に興味がある英語・日本語の一般読者。読み終えた後に、少なくとも一つのプロフィールを検索し、主張と根拠を自分で確かめられる状態を目指す。
- 各記事の冒頭は具体的な場面・奇妙な事実・問いのいずれかで始め、記事の中心発見を早めに見せる。見出しには情報ラベルでなく、続きを読みたくなる主張を置く。
- Malditaの調査記事の「場面から始め、具体例を重ね、調査範囲と限界を明かす」構成、および既存Anicca記事の一人称の場面描写・手触りのある数字・会話調の節運びから、構成上の仕組みを学ぶ。文章、台本、動画、画像、顔、声、デザインの複製はしない。
- 読者が使える情報として、確認済みSNS、創作者、公開商品、価格、動画の構図と話の運び、未確認事項、更新日を具体的に示す。
- 視聴者数、再生数、商品価格、seller counter、creator claim、売上、利益、注文を区別する。自己申告・販売ページ・広告主の顧客事例は、その情報源の主張として示す。
- AI僧侶の台詞は全文転載せず、hook・感情の展開・映像・CTAの仕組みを要約する。健康上の主張は医療助言として紹介しない。
- 収益や医療効果、AI生成状態、制作者、アカウントの所在地を未確認のまま断定しない。

## データとUI契約

- 正本データ: `apps/landing/public/data/ai-monk-avatar-database-2026.json`。現行の5プロフィールを維持し、必要な `languages` と `region_evidence` を追記する。
- `languages` は、プロフィールまたは投稿サンプルで言語を確認できた場合だけ値を持つ。初版では英語・スペイン語を表示し、未確認は「言語未確認」とする。
- `region_evidence` は地域名と根拠の種類を持つ。創作者の居住地、プロフィールに表示された国旗、対象市場を同じ「所在地」として扱わない。
- UIは既存のNext.js 14、React、Tailwind、静的JSONを使う。ユーザー登録、投稿フォーム、外部DB、決済、APIスクレイピング、追加npm依存は含めない。追加提案はGitHubへのリンクで受ける。
- 検索は入力ごとに表示名・別名・creator・地域・言語・プラットフォーム・handleを対象に大文字小文字を無視して絞る。各選択フィルターはANDで組み合わせ、該当件数と0件時の状態を表示する。
- カードには実在人物の肖像画像を転載しない。表示名、個別色の記号、状態ラベル、提供元へのリンクで見分けられるようにする。
- Mobbinの実画面から、Mailchimpのディレクトリ検索hero、Semrushの一覧＋絞り込み、Workableの検索＋状態chipを参考にする。画面のコピーはしない。

## 成功事例・設計参照

| 参照 | 確認できた内容 | 反映する仕組み | 指標と限界 |
|---|---|---|---|
| [Maldita 250 profiles](https://maldita.es/investigaciones/20260727/250-ai-health-instagram-accounts/) | 調査側が250件、7言語、45,600超の投稿を報告。僧侶以外も含む健康アカウント調査。 | 数え方・分類・方法・除外を明かす。氏名や根拠の取れる僧侶だけを対象にする。 | 集計値は同調査の報告値。Anicca記事の読了率・流入成果は公開されていないためUTM流入と記事内クリックを計測する。 |
| [Maldita 16 accounts](https://maldita.es/investigaciones/20260710/cuentas-ia-instagram-facebook-salud-libros/) | 調査側が16アカウント、計350万フォロワー、動画の最大再生数・商品導線を報告。Leo ChenとSifuChenを区別して記載。 | 具体例から仕組みを説明し、商品導線と健康上のリスクを同時に扱う。 | 報道値で、売上や利益ではない。記事の成果は未公開。 |
| [AvatarFactory directory](https://avatarfactory.io/ai-influencers) | 事業者は179 profileを分析したと表示。検索結果はカードと分類を用いる。 | プロフィールカード、検索、絞り込み、対象数の明示。 | 事業者の表示であり、独立した利用・売上実績は未確認。 |
| [GrowwStacks AI factory](https://growwstacks.com/blog/ai-factory-creates-ai-avatar-instagram-videos-daily-n8n-automation) | n8n等の制作手順と20+時間/月の削減を事業者が主張。Yang Munの公式ワークフローとは独立している。 | 制作段階を分解して、読者に再利用できる手順として伝える。 | 20+時間削減は独立検証されていない。成果の根拠として引用しない。 |
| [Mobbin: Mailchimp directory hero](https://mobbin.com/sites/sections/937b2c14-8890-4a1e-bc55-c32be0481863), [Semrush listing](https://mobbin.com/screens/9d9d1461-4626-4863-9248-0ceedf542a13), [Workable directory](https://mobbin.com/screens/74f4187c-e8cc-45d2-be00-f1060f3989c8) | 検索欄、結果カード、絞り込み、状態chipの実画面を確認。 | 検索を最初に見せ、一覧と絞り込みの関係をすぐ理解できる配置。 | UI参照。プロダクト成果値は参照画面から分からない。 |

## Apifyと費用

- [Apify Instagram Scraper](https://apify.com/apify/instagram-scraper) の公開ページは、使用量課金を1,000結果あたり `$1.50` からと表示し、Free planは最大1,851結果・月額 `$0` と掲載している。選択プランで単価・compute条件が異なる。
- 今回はApify実行ツールが接続されず、認証SSOTにApify credentialもないため、actorを実行しない。アカウント作成・課金・ログインを迂回せず、確認済み公開ソースと現行の5件で初版を完成させる。
- 新規サービス費用は `$0`。HeyGen/Higgsfield等の既存契約は今回追加しない。

## 外部事実の出典

- [HeyGen: Yang Mun customer story](https://www.heygen.com/ja-jp/customer-stories/yangmun): ベンダー顧客事例。作者・制作工程の公開主張。
- [Columbia News Service: Yang Mun was never real](https://columbianewsservice.com/2026/03/24/millions-found-comfort-in-a-buddhist-monk-but-he-was-never-real/): Yang Munをめぐる独立取材、creator、本人の収益発言、信頼・宗教的懸念。
- [Yang Mun official product page](https://www.yang-mun.com/pages/journey): `$49.99` program と `$59.99` bundle の販売表示。販売数を示す独立証拠ではない。
- [Thai PBS: Phra Maha AI](https://www.thaipbsworld.com/around-thailand/thailands-first-virtual-monk-to-preach-buddhism-to-new-generation): 実在僧侶と2Dキャラクターの先行例。AI生成の僧侶人格としては数えない。
- [Virtual Humans: Yang Mun](https://virtualhumans.org/article/who-is-yang-mun-the-ai-generated-wellness-guru-with-2-6m-followers): creator発言として紹介された別期間・別会計基準の収益値。監査済み利益ではない。

## 受け入れ条件

- 既存4 article URLを保ち、日英の4記事が指定タイトルを使い、物語として読める導入・固有の見出し・原資料リンクを備える。
- `/ai-monk-database` に5プロフィールが表示され、名前・handle・creator・language・region・platform・offer・evidence statusを検索または絞り込める。
- 検索語とstatus/language/platform/country filtersがANDで機能し、未知・未確認値は誤って確定値に見えない。
- 各profileの根拠ソースへ直接移動でき、データJSONとcontribution linkがある。
- 既存の4 X記事投稿を再送せず、新規告知投稿には公開済みの直接URLが含まれ、Postiz `PUBLISHED` とX permalinkを記録する。
- 関連テスト、landing build、PR CI、main merge、Netlify production readbackが通る。

## Atomic TODO / 現在cursor

| ID | 変更対象 | 依存 | DONE |
|---|---|---|---|
| AM-7 | 既存AI monk datasetへ確認済みの言語・地域根拠を足し、`apps/landing/lib/ai-monk-directory.mjs` に検索・AND filter関数を定義。 | 出典照合済み5件 | テストでname/handle/creator/language検索、status+language+platform filter、未知値、0件を確認。 |
| AM-8 | `apps/landing/app/ai-monk-database/page.tsx` と `apps/landing/components/AiMonkDatabase.tsx` でレスポンシブ一覧を構築し、記事とJSONへの導線を付ける。 | AM-7, Mobbin UI参照 | `/ai-monk-database` routeがbuildされ、検索欄・filter・profile cards・sources・open-data linkが表示される。 |
| AM-9 | 4つの既存研究JSON本文を英日記事として改稿し、指定タイトル、歴史、creator、video structure、offer、根拠と限界、database linkを入れる。 | AM-7, AM-8, source references | JSON parse、2 Japanese articleのnatural-japanese lint、既存記事slugと相互リンク確認。 |
| AM-10 | focused checksとlanding buildを実行してPRを作成、merge、production readbackを行う。 | AM-7–9 | exact-head CI PASS、main SHA、Netlify deploy、記事4本とdatabase UIのHTTP/readback。 |
| AM-11 | databaseと改稿記事を英日でX告知し、直接URLを本文に含める。 | AM-10, Postiz identity/session readback | 送信ごとにdistinct `PUBLISHED` receipt/permalink、重複ゼロ、記事UTM click countの初期値を記録。 |

**順序変更:** 旧cursorは記事改稿だった。Daisが「検索できるDB Webアプリを先に作る」と明示したため、旧順序（記事→UI）を新順序（データ/検索契約→UI→記事→配信）に変更。検索可能な成果を先に公開可能な状態へし、記事をそこへ結び付ける。

**現在cursor:** AM-7 — dataset検索契約のテストを先に書く。
