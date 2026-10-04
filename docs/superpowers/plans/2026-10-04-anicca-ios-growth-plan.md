# ANICCA iOS 成長改善の実行計画

> 実行担当者: 継続目標はこの計画を順に進め、ANICCA iOSの獲得・収益改善ループを実測で成立させること。現在cursorはTask 1、Task 3は既存配信記録のread-only調査中。各Taskの変更範囲とowner境界を守り、計画文書の更新を製品成果や$10K達成と扱わない。

**Goal:** 公開済みANICCAで獲得・初回価値・課金・継続を測り、売上を改善する反復手順を作る。

**Architecture:** ASC、Mixpanel、RevenueCatの既存構成を再利用する。計測と配信を並行し、ASO、価値体験、課金方式を一変数ずつ改善する。収益の正本は実取引とし、クライアントイベントを二重に数えない。

**Tech Stack:** SwiftUI、Mixpanel、PostHog、RevenueCat、ASC CLI、Apple PPO/CPP。

**Spec:** `docs/superpowers/specs/2026-10-04-anicca-ios-growth-design.md`

## Global Constraints

- 継続目標は公開ANICCAの成長ループを一つずつ改善すること。現在の作業cursorはTask 1とTask 3のread-only調査で、task表の順序と受入条件に従う。
- ソース変更は最新main由来の専用worktreeで行う。ASC metadata、購読条件、広告、公開投稿、稼働中の配信loopは、現owner/effect状態とTaskの範囲を確認せずに変更・再送しない。
- リポジトリは `Daisuke134/anicca-products`。
- 共有checkout `/Users/anicca/anicca-project` の他者変更を戻さない。
- 将来の実装はその時点の最新main由来の専用worktree/branchに置く。この文書branchを製品リリースに使わない。
- Codexの計画/調査/レビューは `gpt-6.1-sol` / `medium`、実装は `gpt-6-luna` / `max`。generic subagentを使う場合はモデルとeffortを明示する。
- 一実験の主要仮説は一つ。国、言語、版、期間、コホートをそろえる。
- 購入正本はサーバー取引。Sandbox、restore、pending、cancelを新規有料購入に数えない。
- MRR、年額売上、買い切り、Developer Proceeds、入金、利益を分ける。
- 低標本の結果を勝者扱いしない。未取得を0としない。
- mobile collector/ASC・RC取得/Finance Detail/CFO接続は既存 `lm-cfo-observability-1002` の成果を再利用し、同じ実装・provider操作・shared state書込を重複させない。

## Review Focus

1. 再表示・再起動・購読delegate更新で表示や新規購入を二重に数えない。Task 2が所有。
2. offeringsの空/通信失敗時に購入不能のまま閉じ込めない。Task 5が所有。
3. restore/取消/pendingと実課金の区別、既存有料ユーザーの権利を保つ。Task 2/5が所有。
4. soft-dismiss後の無料範囲と再課金、通知拒否後の継続が整合する。Task 4/5が所有。
5. 匿名ID/版変更/再訪でコホートや実験割当が重複・変更しない。Task 2/5が所有。

## タスク一覧 — 残作業の正本

現在cursorは **Task 1: 公開build/offerings/同一ユーザーファネルの不足証拠を照合**。新しいlocal `business-outcomes.jsonl` row（business date 2026-10-03 / observed 2026-10-04T10:56:36.419433Z）は、ASC App Store Discovery reportで10/01のImpression counts20・Page view counts5、Downloads reportで10/01 restore1・10/02 App Store search由来first-time download1を記録する。Rork Analytics common-window readbackは10/01で0 first-time downloads / 5 unique impressions / 0 unique page views。Appleの定義上、Discovery `Counts`はtotal events、`Unique Counts`はrow-level unique users、Discovery Impression eventはpage viewsを含まない。したがって20 total impressionsと5 unique impressionsは直接矛盾せず、10/01 first-time downloads 0も一致する。未解決はDiscovery page-view total5に対するRork unique page views0。owner branchのread-only auditで、TSV parserが値をそのまま保持する一方、collector predicateとfixtureが`Page View`を要求し、Apple enum/raw rowが`Page view`であるmismatchを発見した。0を実ユーザー行動と解釈せず、mobile ownerによる正しいenumの回帰と同じrequestのfresh readbackまでconversionを出さない。同rowのRevenueCat chartは2026-10-03 period MRR20.34/Actives5だがcurrency/revenue_definition欠落、App Store Salesは`provider_query_failed`、PostHogは`missing_project_read_credential`。これはsettled CFO P&Lでも同一user funnelでもない。依頼者は全アプリ合計約3 installs/日と述べているが、app内訳・期間・公式sourceの一致が未確認なのでbaselineには採用しない。Task 3 strict rolling 28d receipt filterは562 unique IDs（IG231/TikTok234/YouTube97）。前回567は異なるquery/window basis。Owner post-metricsは93 exact receipt joins。7d measured sample37件もpublication-identity ledgerでresolved/native_post_id一致。最新168h sampleは399 mature posts中52 checkpoint（37 measured/15 unavailable）、raw hash 52/52 match。7d measured metricsはIG14 (reach sum12,342/views17,037), TT8 (views311), YouTube15 (views7); click/ASC install/paid joinは未取得。Task 2にはpaywall view重複送信のsource-only修正branch/commitがあるが、実イベントcount、build、公開版への反映は未確認。既存owner cadenceは維持し、成果計測なしに追加volumeを増やさない。

Task 3 latest readback（receipts 2026-10-04T11:34:00Z / metrics latest 11:33:50Z）: 562 Anicca published receiptsをstrict rolling 28dで数えた。93/562はowner metricsのPostiz IDとreceipt provider_post_idがexact match。7d measured sample37件もpublication-identity ledgerでresolved/native_post_id一致。168h mature posts399件中52件にin-window checkpointがあり、37 measured/15 unavailableで、52 raw evidence hashesがprovider-response journalと一致する。7d sampleはInstagram 14 measured postsのper-post reach合計12,342・views17,037、TikTok 8 postsのviews311、YouTube 15 postsのviews7。asset hashはIG4 group (6/4/3/1)、TikTok1 group (8)、YouTube5 groups (6/5/2/1/1)。これらはper-post/provider metricsで、unique audienceやASC store install/paid attributionではない。impressions値はsample内ですべてnull、click fieldはschemaにない。別ownerのmetrics loopは`resource_effect_unknown` fenceのまま。

Task 4 preliminary ASO readback: 2026-10-04のUS listingはiPhone 6.7-inch screenshotが4枚。順に「Personalized Affirmations」「Reminders to Stay Positive」「Choose From 8 Themes」「Change How You Think」。1/2/4枚目は似たaffirmation-card構成で、3枚目の8 themesはlisting descriptionの13 self-care themesと不一致。title 27 characters / subtitle 30 charactersでAppleの各30文字上限内。これはpublic-page観測とvisual assessmentで、表示可能theme数・機能の誤りやPPO upliftの証明ではない。Task 1〜3のgate、実機能確認、PPO標本可能性を通るまで素材公開やonboarding変更をしない。

順序はTask 1→Task 2とTask 3の並行→Task 4→Task 5→Task 6とする。まず現状と計測の信頼性を確かめつつ、Task 3では既存配信のreadbackを前進させる。distributionは最初の成長施策だが、reach→store→installの測定前に投稿本数や広告費だけを増やさない。Task 4ではスクリーンショット/PPOを先に検証し、その後に初回カード体験を別実験にする。Life Manager全体のTODO/orderはprimaryの統合SSOTであり、この表はANICCA growth lane内の作業順である。

| Task | 成果 | 状態 | 依存 |
|---|---|---|---|
| 1 | 公開版/build/課金経路/現状値の証拠 | 進行中。Impression差はApple定義上count/uniqueの違いで説明可能。page-view 0はmobile owner source/testのenum mismatchが有力候補。owner fix/fresh readback待ち | 公式build/source対応・live offering・page-view mapping/ref・同一ユーザーファネルのrefs不足 |
| 2 | 信頼できるコホートと課金ファネル | 部分進行・source-only重複event修正あり。実測/公開版反映/unique cohortは未確認 | Task 1のlive path/offering確認。既存metrics ownerのprovider作業と重複しない |
| 3 | 配信別の獲得と改善記録 | 部分進行・strict 28dで562 receipts、93件のpost-metrics join、168h mature checkpointは52件（37 measured/15 unavailable）。ASC install/paidとのjoinなし | post-level views/reach→ASC source/date/campaignへ接続。fenced readerはwake/replay/closeしない。既存cadenceは維持 |
| 4 | ストア訴求と初回カード体験の改善 | 部分進行。US listingの4 screenshots/title/subtitleをread-only監査済み。素材の反復と8-vs-13 themes不一致を確認。実機能/locale/build照合・PPO/onboarding実験は未着手 | Task 1〜3の基準と十分な標本可能性。ASO/PPOの後にonboardingを別実験 |
| 5 | 訴求→hard/softの比較とD35 economics | 未着手 | live offering、計測可能なcohort、標本見積り。renewal/refundは最初の有料cohortから追跡 |
| 6 | 他の公開アプリへ再利用 | 未着手 | ANICCAで獲得・課金・継続・CFO ownerのnet unit economicsを実測 |

### $10Kの運用モデル

- 長期構想は公開アプリをそれぞれ$10K MRRへ育てること。最初はportfolio $10Kを目標にし、再現性があり需要と採算を確認できたwinnerへ投資する。全appへ均等投資せず、成功を先に仮定しない。
- Portfolio $10Kは1 app×$10K、2 apps×$5K、5 apps×$2Kなどの構成で実現できる。均等分布は仮定しない。
- 月換算$10 MRR/paid subscriberなら1 appあたり1,000 active paid subscribersが$10K目安。月次解約10%仮定で月100 new paid subscriberを補充する。
- RevenueCat D35 cohort conversionを感度分析に使う。月100 new paidに約4,762 DL (2.1%), 2,000 DL (5%), 935 DL (10.7%)。2.1%/10.7%はRevenueCatで異なるmodel群のmedian、5%は仮定。live Anicca conversionとはしない。
- 目標の途中段階は$100→$1K→$3K→$10K MRRとし、各段階で必要な有料会員・解約補充分・installを実測値で更新する。$10/人・月次解約10%・D35 conversion 5%の仮定では、$10K段階の維持だけで1,000 active paid、月100 replacement paid、月2,000 install（約67/日）が必要。成長分の純増installは別に足す。
- 現状はこのunit-economics入力値が未確定。最初の業務成果は$10K到達を予測することではなく、投稿reach→ASC acquisition→unique onboarding cohort→server-confirmed paid→renewal/refund→CFO同期間net economicsの一本を読めるようにすること。
- 継続率は後工程まで放置しない。MRRは解約で減るため、first paid cohortからrenewal/refundを保護指標として追う。利益の最終判定はgrowth側で推定せずCFO ownerのofficial proceeds/cost refsへ委ねる。
- $20.34 RevenueCat MRR chart (complete period 2026-10-02, USD) はmobile owner readback。CFO settlement/profitではなく、10/03 JSONLはcurrency/revenue_definition欠落。正式なstarting CFO MRRは未確定。
- 先行指標は対象reach→ASC impression/page view/first-time download→unique onboarding cohort→value/paywall→paid→renewal/refund。利益判断は別途同期間のApple proceeds/fees, refunds, variable compute/infra, ad CACを必要とする。
- 最新owner snapshotではInstagram14件、TikTok8件、YouTube15件の168h valuesがある。TikTokの8 measured carousel postsは同じmedia/caption hash、D7 views median 39.5/max58。次の候補は既存owner cadence内の次slotで、同じ承認済み日本語affirmation/caption/CTAを15〜30秒9:16 short video形式に再構成するformat test（詳細とTikTok公式creative guidanceはspec「最初のTikTokテスト案」）。投稿時刻/audience/CTAを固定し、既存`experiment_id` fieldでvariantを記録する。1本はscreeningに留め、historical baselineよりよければ新assetを2本追加してからdirectional callをする。TikTok for Business guidanceは広告向けなのでorganic liftを保証しない。click/ASC install/paid join前にcadenceや広告費は増やさない。
- 反復順は課題/配信仮説→同一window獲得→初回価値/課金→成熟D35 paid→renewal/contribution→横展開。実測で1st gateが未達なら次app複製や大規模有料獲得はしない。

## Task 1: 公開版と現状値の証拠を再確認する

**Files:** このspecの「現状の証拠」、この計画のタスク状態。製品コードは読取のみ。

**Interfaces:** ASC app `6755129214` / bundle `ai.anicca.app.ios`、既存取得ownerのASC/RevenueCat refs/hash、Mixpanel project、投稿担当の実績を読む。出力は取得時点/期間/取得元/分母/欠損付きの基準表と公開build対応表。公式APIの再取得は既存ownerと共有し、同じ取得を並走しない。

- [x] 既存mobile設計のProvider observationsから24登録/6公開アプリ、旧未公開rosterとの違いを取り込み、根拠SHA/hashをspecへ記録する。私による公式API再取得とは扱わない。
- [x] 最新anicca-products mainのUX/分析コードと、既存business-outcomesのproduct_analytics/PostHog statusを読んで部分基準表を記録する。raw件数を離脱率へ変換しない。
- [x] 2026-10-04T10:56:36Z local business-outcomes rowからApp Store Discovery/Downloads reportのdate/aggregate fieldsとlatest RC summaryを再readbackする。raw user rowsを使わず、owner APIを重複取得しない。
- [x] mobile owner feature branchをread-only確認し、collectorの`Page View`比較/fixtureとApple raw enum `Page view`のmismatch候補を特定する。Growth laneのcollector sourceは変更しない。
- [x] mobile取得ownerとprimaryへ重複しない所有範囲と必要なrefs/hashを共有する。primaryの分離了承は受信済み、mobile owner本人の返信は未確認。
- [x] US App Store pageを2026-10-04T12:24Zに`crwl`で再readbackし、title/subtitle/version/category/languages/age/rating overview/IAP/legal subscription textを記録する。掲載IAPをRevenueCat live offeringとは扱わない。
- [ ] 既存ASC owner refsからtarget locale別title/subtitle/keywords/category/promo text、metadata更新日、localized screenshot/PPO履歴を受け取り、public listingと差分を記録する。keyword fieldはpublic HTMLで推測しない。
- [ ] mobile ownerが`Page view` raw enumに合うcollector predicate/fixtureを修正してfocused regressionを実行し、既存ASC requestのfresh readback refs/hashを共有する。Growth laneは変更を取り込まず、結果だけを消費する。
- [ ] そのowner readbackで10/01 first-time downloads 0の一致、page-view total5/unique0の差、segment/StoreKit含有を照合する。20 total impressions/5 unique impressionsは異なるmetric定義であり直接不一致としない。rateは対応する同一定義の値だけで計算する。
- [ ] 既存ownerから最新apps/versions/buildのofficial refsを共有してもらい、公開版対応表を確定する。独自に同じASC取得を始めない。
- [ ] 公開1.9.4 build metadata・actual checkout・current source pathを既存owner refsから照合する。ソースのcloseと別画面のPostHog設定だけでliveゲートを断定しない。
- [ ] 取得済みASC subscriptionsとRevenueCat offering/productの対応を既存owner refsから読む。US page掲載の6 IAP recordをlive offeringと見なさず、live trial有無とsource上のtrial無効を分ける。
- [ ] 前回Sales/Analytics期間を再取得し、type1/1F、app SKU/parent、通貨、期間を明示する。必要な秘密情報はcredential SSOTで安全に解決し、値を文書へ書かない。
- [ ] Mixpanelのfirst-open/step別unique cohortと既存RC purchase/refund/updateを同期間で照合する。rawイベント、customer cohort、ASC install cohortを別分母として扱う。PostHog read権限不足はownerの既存経路で解決する。
- [ ] specの古い外部値を置き換えるか観測時点を明示する。生レポートを公開Gitへ載せない。
- [ ] 成功判定: liveゲートを証拠付きで記述でき、集計の欠損が見える。製品変更を必要としない。

## Task 2: 最小の計測整備

**進捗:** duplicate paywall view eventのsource-only prerequisiteは個別branch `fix/anicca-paywall-event-dedupe-20261004-growth` / commit `76cf8b6e5968f958ee837318d68b6842386f4eb2` にpush済み（spec「Source-onlyの計測重複修正」参照）。Task 2本体のuser-level funnel追加は未着手。source correctionはpublic binaryに入っていない。Simulator/generic iOS buildはXcodeがiOS 26.5 destinationを使用できずコンパイル前exit70、event-count regression testなし。source changeをproduction fixと扱わない。

**Files:** 将来の実装対象は `aniccaios/aniccaios/Services/AnalyticsManager.swift`、`Services/SubscriptionManager.swift`、`AppDelegate.swift`、`Onboarding/PaywallVariantBView.swift`、`Onboarding/OnboardingFlowView.swift`。実際に欠損がある箇所だけ変更する。`scripts/daily-metrics/*`は旧経路の読取参照にとどめ、既存Life Manager producerに対抗する別取得/集計loopを作らない。CFO/ASC/RCの接続修正は既存ownerが所有する。

**Interfaces:** 既存の `AnalyticsManager.track(_:properties:)`、`trackPaywallViewed()`、`trackPurchaseCompleted(productId:revenue:)`、RevenueCat user/transaction ID。出力は一ユーザーの段階表示/完了/購入を接続できるファネル。収益はRCの取引イベントへ寄せる。

- [ ] Task 2着手時に関連targetのbaselineを確認する。`OnboardingV2Tests.swift`は旧case参照があるため、対象への組込みと現enumとの整合性を調べる。既存suiteを無条件に実行可能と書かない。
- [ ] duplicate表示を一回のonAppearで再現する。検証assertionは `paywall_plan_selection_viewed` が一回。既存ログ/受信イベントで再現できなければ、同targetで最小capture回帰を追加する。
- [ ] `PaywallVariantBView`の直接送信と`trackPaywallViewed()`の重複を解消する。SKAN更新が残る経路を使う。
- [ ] 同一取引の再受信→新規購入1回、restore→新規購入0、pending/取消→新規購入0を検証する。delegateのentitlement更新を取引発生の代用にしない。
- [ ] 既存IDを確認し、first-openコホート、app/onboarding version、step、experiment/variant、offering/productで不足する属性だけ追加する。悩みの自由記述は送らない。
- [ ] RevenueCat→MixpanelのID/更新/返金を照合し、Sandboxとproductionを分ける。取得できない指標を0へ埋めない。
- [ ] 変更に関係する既存テストと新しい最小回帰を実行する。Xcode schemeは`aniccaios`、projectは`aniccaios/aniccaios.xcodeproj`。利用可能なSimulator IDを実測して `xcodebuild test -project aniccaios/aniccaios.xcodeproj -scheme aniccaios -destination 'platform=iOS Simulator,id=<実測ID>' -only-testing:aniccaiosTests/<対象クラス>` を実行する。
- [ ] 成功判定: one-view/one-eventと取引の重複防止を確認し、同コホートのファネルが読める。反映が依頼された場合のみ公開版の受信まで確認する。

## Task 3: 既存配信を測って改善する

**Files:** 既存配信担当のANICCA設定/投稿記録。正本の場所はTask 1の担当確認で特定し、別配信loopは作らない。この計画へ実際のownerと正本パスを記録する。

**Interfaces:** 投稿ID/URL、切り口、言語、reach、クリック、campaign/CPP集計。出力は週次の獲得比較と次の切り口。

- [x] 既存marketing receipt/jobs journalとmetrics runnerを発見する。specの「継続調査の基準表」に絶対パスを記録する。全product journal行数をAniccaの投稿数にしない。
- [x] Strict rolling 28d receipt window（2026-09-06T11:34:00Z–2026-10-04T11:34:00Z）でnested `receipt.product_id=anicca-ios` / status=`published` / unique provider_post_idを数えた: 562（Instagram231/TikTok234/YouTube97）。以前の567とはbasisが違い、current coverageには562を使う。
- [x] Owner post-metrics 97 unique Postiz IDsのうち93をpublished receipt provider IDへplatform別にexact joinし、raw evidence hashをresponse journalと照合した。7d measured sample37件はpublication-identity ledgerでも全件resolved/native_post_id一致。399件が168h mature、52件にin-window checkpoint（37 measured/15 unavailable）、52件すべてraw hashあり。
- [x] 168h sampleのasset-hash群を比較した。Instagram 14 measured postsは4 media/caption hash groups (6/4/3/1)、TikTok 8 postsは1 group、YouTube 15 postsは5 groups (6/5/2/1/1)。これはcontent repetitionの観測で、勝者の因果判定ではない。
- [ ] Owner-owned `life-manager-instagram-metrics` / `life-manager-tiktok-metrics` は現状`resource_effect_unknown` admission fence、旧occurenceのprovider readback adapterなし。既存ownerがofficial Telegram/platform historyでeffectを照合し、fence close可否を決めるまで私がrestart/resendしない。
- [x] 正規`lm-loop status life-manager-instagram-metrics`/`life-manager-tiktok-metrics` readback: last occurrence 2026-10-04T10:17:07Z/10:22:10Z、exit75 `resource_effect_unknown`、old claimed/history_incomplete fence、provider receipt/refなし、diagnosis `no_adapter`。このstatusだけでreach/sampleを補わない。
- [ ] 全体primary/既存ownerからfence owner/readback planを受け取り、official message/provider historyで効果を照合してから既存readerを回復する。自分のlaneからwake/replay/fence closeしない。
- [x] Existing `marketing-owner-events` post-metrics sampleをread-onlyで取得。これは`life-manager-instagram-metrics`/`life-manager-tiktok-metrics` fenced readersのstatusを解消しない。sampleのimpressions値はnull、click fieldはschemaになく、store install/paidとも未接続。
- [x] Existing 168h sampleのasset hash/platform valuesをread-onlyで比較した。IG 14 postsに4 group、TikTok 8 postsに同一media/caption hash、YouTube 15 postsに5 group。これは再利用状況の観測で因果効果ではない。
- [ ] 配信ownerとTikTok format testを既存cadenceの次slotへ適用するか決める。候補: 同じ承認済みJapanese affirmation/caption/CTAを9:16・15〜30秒videoとして1本だけ制作し、同じ投稿時刻/対象者を保つ。投稿前に既存`experiment_id`へvariantを記録。外部post自体はまだ実施せず、captionは編集せず、既存ownerの承認済みcopy/approval pathを使う。
- [ ] 168hで同じmetrics sourceからviews/postと取れるlikes/shares/savesをreadbackする。8件のcarousel baseline（median 39.5 views、max58）はhistorical/nonrandomized controlで、1本のpilotから勝者を宣言しない。方向が良ければ次の既存slotで2本の独立assetを再確認し、cadence変更はASC click/install/paid linkが閉じるまでしない。
- [ ] post-level reach/viewsを同期間ASC source/page-view/first-time-download dataへ接続する。click/campaign identityがない分岐はunavailableのまま記録し、metrics reader effect fenceを自laneからwake/replay/closeしない。
- [ ] 既存ownerの予定済み配信 cadenceは維持する。計測が取れない状態で追加account/publisherや過剰なpost volumeを自作しない。sample pathが閉じたら、実測で勝ったcreativeを追加テストする。
- [ ] 最新の国別DLと実績を見て、日本/日本語を第一案とする。夜の考えすぎ、自己批判、先延ばしの切り口を比較する。
- [ ] 投稿別campaign linkを設計する。SNS reachとストアImpressionを混ぜず、個人単位の帰属ができるとは仮定しない。
- [ ] 既存ownerのcadenceと制作能力を確認し、計測可能な勝ち切り口が見つかった後に追加クリエイティブ案を増やす。実カード/通知を見せ、記事は勝った悩みを掘り下げる。週10本/週1記事は能力確認前の必達本数にしない。
- [ ] 毎週クリック→初回DL→購入→D35売上/インストールを比較し、取得不能な段は欠損として残す。
- [ ] 成功判定: 実投稿と獲得が比較でき、次に増やす切り口に証拠がある。単なる投稿数を成功としない。
- [ ] MRR/$10K目標はアプリ別とportfolio合計で分け、source windowと有料分母が揃うまで目標到達/転換率を宣言しない。

## Task 4: ASOと初回価値体験を順に改善する

**Files:** ASCのANICCAスクショ/metadata、既存`.claude/skills/screenshot-ab/`資産、`Onboarding/OnboardingStep.swift`、`OnboardingFlowView.swift`、`PersonalizedInsightStepView.swift`、`ProcessingStepView.swift`、`NotificationPermissionStepView.swift`、既存カード描画、`Resources/{ja,en}.lproj/Localizable.strings`。

**Interfaces:** 既存 `next: () -> Void` とuserProfileの悩み/時間、カード表示。出力はストア訴求一案の実験、次に実カード体験の独立実験。両者を同時に変更しない。

- [x] 公開US listingのiPhone 6.7-inch screenshot 4枚と見出し、title/subtitle文字数をread-onlyで監査し、spec「公開ASO素材」に記録する。1/2/4枚目の視覚的反復、screenshotの8 themesとdescriptionの13 themesの差を「要確認」と記録する。
- [ ] Task 1で公開build/sourceと実際のtheme数、各localeの素材、live offeringを照合する。8-vs-13が解消するまでtheme数コピーを変更しない。未確認の個別化・AI機能・改善率を見出しへ足さない。
- [ ] Task 1〜3のsource/計測gate後、Apple PPOの対象version/locales、daily impressions/downloads、必要標本、期間、conversion定義を確認する。PPOは同時に1 testで最大90日なので、その期間内に必要な標本が見込めなければ実験を延期し、現行素材を維持する。[Apple PPO](https://developer.apple.com/app-store/product-page-optimization/)
- [ ] PPO treatmentを1案作り、先頭3枚を課題/得られる結果→使う場面→実在する製品体験として差別化する。現行に対しscreenshotsだけを変え、title/subtitleや価格を同時変更しない。
- [ ] Apple PPOでcontrol対1 screenshot treatmentを比較し、事前に定めたconversion measureとAppleが示す必要標本/90%以上confidenceで判定する。低trafficの小差は勝者としない。外部listing更新は既存ownerの申請/審査経路を使う。[Apple PPO](https://developer.apple.com/app-store/product-page-optimization/)
- [ ] 公開buildの実際のfirst-run画面とTask 2で測れる同一新規user cohortを照合し、first-open→step→初回実カード→paywall→server-confirmed purchaseのbaselineを記録する。raw event countをunique conversionにしない。
- [ ] onboarding案は歓迎→悩み選択→体験を変える場合だけ時間選択→実際に回答へ合うカード→通知の価値と適切な許可依頼→明確な料金/期間/trial/更新条件を示すpaywallの順に設計する。既存card UI/dataを再利用し、通知拒否でも続行可能にする。
- [ ] 「選んだ悩みが異なると表示カードも異なる」をfocused回帰で固定する。保存済み旧stepのmigrationと途中再開は実際に必要な範囲だけ扱う。
- [ ] onboardingの一変数treatmentを作り、価格・trial・paywall選択・store screenshotsを固定して同一new-user cohortで比較する。hard/softは現行実装だけで決めず、live paywall/offeringsと十分なsampleを見てTask 5で別比較する。
- [ ] 81%改善主張と引用レビューの根拠を調べ、根拠がなければ使わない。rate依頼の移動や段階削除は実離脱と用途から決める。
- [ ] Apple標準rating promptの利用条件を確認し、最初の実価値体験後の適切なmomentを候補化する。onboarding/paywallを遮らず、購入・高ratingの対価を付けない。
- [ ] 成功判定: product-page conversionと、初回価値到達→server-confirmed purchase/D35 revenue per first-time installを同じvariant/cohort単位で比較できる。価格を固定し、未成熟cohortは未確定のまま残す。

## Task 5: ペイウォールを一変数ずつ比較する

**Files:** 実際のlive経路の`OnboardingBibleViews.swift`/`PaywallVariantBView.swift`、RC offerings/experiments。使われていない`PlanSelectionStepView`だけ変更して実験開始としない。

**Interfaces:** 現価格、offering/product、匿名ID、固定variant。出力はまず訴求一案対現行、その後にhard/softの独立比較。

- [ ] Task 1のliveゲートをcontrolとし、価格/トライアルは固定する。初回は価値説明だけを変える。
- [ ] 現行hard/softの実動作は公開buildと購入経路を確認してから記録する。`PaywallFlowContainer`にclose buttonがあるsource観測だけで、公開体験や無料利用範囲を断定しない。
- [ ] offerings空/通信失敗→再読込/restore、購入取消/pending→購入計上0、既存有料→権利保持を最小検証する。
- [ ] 標本見積り後、softの無料範囲/再アップグレード契機とhardの復旧を定義する。既存Free/Pro実機能を確認してからコピーを作る。
- [ ] hard/soft比較を行う場合はその形式だけを変え、価格/trial/訴求を固定する。購入率だけでなくD35 revenue per first-time install、返金、利用、解約とrestoreを保護指標にする。
- [ ] 新規ユーザーのvariantは再起動後も固定し、比較中に価格やスクショを変えない。
- [ ] D35売上/インストールと購入率、返金、初回利用、購読解除を比較する。年額更新は短期では未確認とする。
- [ ] 成功判定: 同条件コホートで評価できる。trial startや少数購入だけで勝者としない。

## Task 6: 他の公開アプリへ展開する

- [ ] 仮説、変えた一点、母数、期間、結果、次の一点を既存の実験正本に記録する。
- [ ] ANICCAで有効な獲得と課金の組合せが再現できたら、最新の需要/売上を確認して次の公開アプリ一つを選ぶ。
- [ ] 計測と運用手順を再利用し、訴求はそのアプリの顧客に合わせる。
- [ ] 成功判定: アプリ別MRRと費用を区別して改善を評価できる。各アプリが自動で$10Kになるとは仮定しない。

## セルフレビューと保存時検証

- specの目的/現状/体験/計測/課金/展開はTask 1〜6で対応する。
- 外部値は前回観測、ソース所見は作成元main、とラベルを分ける。
- 文書だけの差分とリンク先存在を検査し、`git diff --check`を実行する。
- 実装テスト、課金、配信、MRR改善は今回未実施。文書保存のPASSと混ぜない。
