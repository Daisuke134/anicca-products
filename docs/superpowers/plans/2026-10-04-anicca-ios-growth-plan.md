# ANICCA iOS 成長改善の実行計画

> 実行担当者: 継続目標はこの計画を順に進め、ANICCA iOSの獲得・収益改善ループを実測で成立させる。現在cursorはGrowth Task 1（公開build・offerings・同一ユーザーファネルの不足証拠）。Task 3の最新保存readbackは2026-10-04分で、effect fenceとstore/paid attributionは未解決。各Taskの変更範囲とowner境界を守り、計画文書の更新を製品成果や$10K達成と扱わない。

**Goal:** 公開済みANICCAで獲得・初回価値・課金・継続を測り、売上を改善する反復手順を作る。

**Architecture:** ASC、Mixpanel、RevenueCatの既存構成を再利用する。計測と配信を並行し、ASO、価値体験、課金方式を一変数ずつ改善する。収益の正本は実取引とし、クライアントイベントを二重に数えない。

**Tech Stack:** SwiftUI、Mixpanel、PostHog、RevenueCat、ASC CLI、Apple PPO/CPP。

**Spec:** `docs/superpowers/specs/2026-10-04-anicca-ios-growth-design.md`

## Global Constraints

- 継続目標は公開ANICCAの成長ループを一つずつ改善すること。Growthの正本cursorはこの計画で管理し、ownerのprovider/stateを重ねない。
- Growth spec/plan/handoverは `Daisuke134/anicca-products` に置き、ANICCA iOS sourceはLife Managerの `Daisuke134/life-manager/apps/mobile/anicca-ios` を唯一のcode authorityとする。ソース変更は最新 `life-manager origin/main` 由来の専用worktreeで行う。
- ASC metadata、購読条件、広告、公開投稿、稼働中の配信loopは、現owner/effect状態とTaskの範囲を確認せずに変更・再送しない。
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

### レーン分担と最新readback（2026-10-05）

- Growth内の順序は変更しない。Task 1の後、Task 2とTask 3を重ならない範囲で並行し、その後Task 4→5→6へ進む。Task 1は最初の未完項目のまま。参照するASC report windowは10月4日までで、ローカルsummary rowは10月5日00:00 JSTに保存済み情報を再観測した。ASC/RevenueCat APIを新規取得したわけではない。
- 別のMobile Metrics計画のTasks 1–3は、branch feat/lm-mobile-metrics-20261003 / HEAD 1f045eff3d27cfec3945cd8d2dff64f06928c834上でsource/test実装が完了している。内容はASC store rateの分母保護（install_to_paidはunavailable）、ASC proceedsとRevenueCat chart observationの分離、CFO summaryのfunnel/source status表示。これは候補branch上のsource完了であり、Growth Task 1、本番反映、同一ユーザーの課金帰属、settled net revenueの完了ではない。
- 最新比較ではLife Manager origin/mainは82d31995e6。候補branchはmain固有24 commitsが未取り込みで、候補固有34 commitsがある。PRなし。apps/mobile/anicca-iosにはmainとの差分がない。変更はacquisition/Financial Manager/CFO backend側なので、Growth文書やnative source branchへコピー・mergeしない。
- Task 8の前回whole-branch reviewにはImportant findingが残る。Financial Managerがpositive unassigned_row_countをpartial coverageとして表示しない。issue #6547はopen・comments 0だが、Daisuke134（repository admin）の+1があり、maintainer approval条件は満たす。partial-coverage修正、最新main同期、同期後の受入れ、fresh ship reviewは未完。candidate planの「maintainer +1 pending」は古い記述。
- 所有範囲は維持する。Mobile Metrics ownerはapps/life-manager、skills/cfo、producer/CFO integration、issue #6547を担当する。このlaneは既存refsから公式証拠をread-onlyで接続し、不足証拠を特定する。ASC/RevenueCat collectorやFinance Detail作業は重ねない。native onboarding/paywall sourceはcanonical iOS mobile ownerの範囲であり、CFO implementation branchへ引き取らない。
- 次のGrowth cursorはTask 1のbuild/ASC/offering/cohort/financial crosswalk refsの照合。Task 3のowner-only effect-fence/readbackは別境界で扱う。異なるwindowや分母のままASO/PPO・onboarding treatmentへ進まない。

現在cursorは **Task 1: 公開build/offerings/同一ユーザーファネルの不足証拠を照合**。最新Anicca local `business-outcomes.jsonl` rowはbusiness date 2026-10-03 / observed `2026-10-04T15:00:23.470913Z`。保存済みDiscovery Standard reportはwindow 2026-09-30..10-02 (processed 10-03)で、10/01にImpression 12 rows / total Counts20、Page view 3 rows / total Counts5（1/3/1）。保存済みDownloads Standard report (processed 10-04)は10/02 first-time download1、App Store search、DE/iPhone、App Version1.9.4で、restore/redownloadなし。保存済みPurchases Standard reportは09/07にAnicca app ID6755129214 / content ID6762049696のpurchase1、Sales USD31.40 / report Proceeds USD26.69を記録し、Subscription Event Standardは09/12 full-price start activation1。同じuser/settlement periodとは結ばず、current MRRへ加えない。US/JP/DE public pagesでJPは47 ratings、各localeのコピーとIAP表示が異なる。current source mainは1.9.5/build365だが公開pageと実測download rowは1.9.4で、ASC build mappingは未確認。別ownerのRork Analytics common window 10/01は0 first-time downloads / 5 unique impressions / 0 unique page views。指標/segment/windowが違うためCVRは作らない。RevenueCat rowは10/03 MRR20.34/Actives5だがcurrency/revenue_definitionなし。Mixpanel raw event countsは5/1/4でuser cohort/purchase eventなし、PostHog credential unavailable。現行sourceではpaywall前に`onboarding_completed`が発火し、初回onboardingは未ログインでも表示される。PostHogはRevenueCat appUserID、Mixpanelはcredentials更新後にidentifyされ、両IDの明示的alias/cross-source bridgeは見えない。したがって匿名起点から購入までの同一user cohortはsource証拠で確立できない。ASC Sales snapshotはavailableだがrow_count0・proceeds object emptyでありsettled zeroとは扱わない。CFO aggregateは別combined window 09/30–10/02でDL1/impressions16/unique11/page views0、unattributed/campaign unavailable。これらの欠損が埋まるまでinstall→purchase rateやnet MRRは未算出。Task 3 previous accepted strict rolling 28d readback (cutoff `2026-10-04T14:26:22Z`)は557 unique platform provider IDs（IG229/TikTok231/YouTube97）、93 exact metrics joins。397 mature posts中46件にin-window 168h checkpoint（32 measured/14 unavailable）あり、46/46 raw hashesとpublication-identity native IDsを一致確認した。Measured 168h posts: IG10 (per-post reach sum8,331/views11,586), TikTok8 (views311), YouTube14 (views7)。click/ASC install/paid joinは未取得。Task 2にはpaywall view重複送信のsource-only修正branch/commitがあるが、実イベントcount、build、公開版への反映は未確認。既存owner cadenceは維持し、成果計測なしに追加volumeを増やさない。

Task 3の前回readback（receipts 11:34Z / metrics 11:33:50Z）は562 IDs / 399 mature / 52 checkpointsだった。前回受入れ済みstrict rolling 28d readback（cutoff 2026-10-04T14:26:22Z）は557 unique provider IDsで、97 metrics posts中93件がpublished receiptのprovider IDとexact joinした。成熟済み投稿397件のうち46件に168hのin-window checkpoint（32 measured/14 unavailable）がある。46 raw hashはprovider-response journalと、46 native IDは最新resolved publication-identity rowと一致した。測定値はInstagram10 posts（per-post reach sum8,331/views11,586）、TikTok8 posts（views311）、YouTube14 posts（views7）。合計は投稿別valuesでdeduplicated audienceではない。Impressionsはnull、click fieldはschemaになく、ASC install/paid joinもない。14:17–14:23Zのowner journalをread-only確認し、fenced metric readerには触れていない。

Task 1 persisted report check: existing official `App Store Discovery and Engagement Standard` artifact `/Users/anicca/.local/state/life-manager/marketing-metrics-daily/evidence/business/2026-10-03/anicca-ios/6755129214-discovery.json` has `evidence_sha256` (canonical JSON evidence) `20699ca154166f5b2db9f0463c6f5b8baeb235509f1c8dc04362c84c4c2c9b71`; file-byte SHA256 is `46e3e18e47cf0c7c28f78a18164374d9572be6df9027eadd7ffec12062977d44`. It contains 2026-10-01 `Event="Page view"` in 3 rows with `Counts` 1/3/1 (sum 5); `Impression` appears in 12 rows with Counts sum20. This confirms the static enum mismatch against owner source `row.Event === "Page View"`; it is the Standard report, not a persisted same-request Detailed report response. Therefore the mobile owner's focused regression and Detailed request fresh readback remain open, and the Analytics unique page-view value 0 is not treated as user behavior.

CFO/Mobile lane evidence consumed without duplicate provider reads: CFO §87-B's production `collectProduct()` aggregate is 2026-09-30..10-02, processing 10/03, DL1/total impressions16/unique11/page views0, `unattributed`, campaign unavailable; report-level source windows are absent, so it does not reconcile with the separate 10/01 Standard report. CFO §87-Q records Anicca MRR JPY3,196.91 for 10/03 (USD query20.34) and September RevenueCat proceeds JPY3,363.77; these are provider metrics, not settled bank/net receipts. Mobile Task 9's private D7 0/1 sample and Task 10's campaign/purchase-denominator gaps are also recorded in the spec's cross-lane evidence table; none completes Growth's same-user funnel.

Task 3の保存journal診断（cutoff 2026-10-04T16:14:47Z、read-only）: status=published / product_id=anicca-ios / provider_post_idで個別receipt JSONを集計すると557 IDs（IG229/TT231/YT97）で、前回と同じ。親のmarketing/receipts.jsonlは別単位のsummaryで、provider_post_idを含まない。現在のpost-metrics stateはAniccaのunique Postiz IDが98件、うち94件がprovider_post_idとexact joinする。target-168h / in-windowの候補checkpointは57件（39 measured / 18 unavailable）、そのうち53件（37/16）がpublished receipt IDと結合し、53/53 raw hashがprovider-response journalと一致、53/53 native IDがlatest resolved publication-identity rowと一致した。前回の受入れ済み14:26Z snapshotは46件（32/14）、hash/identity 46/46だった。metrics/provider-response filesは15:22Z、identity fileは16:11Zに前回cutoff後のmtimeがあり、per-row ingestion timestampがないため旧・新のcountを同一snapshotとして比較できない。遅延追加またはidentity更新が原因かは確定できていない。追加の6h Instagram readbackでは、既存の10:01Z投稿を16:02Zに観測し、reach291 / views401 / likes2 / shares0 / saves1、impressionsはnull。response hashとnative identityは一致するが、これは1投稿の配信値でASC install/paidには結びつかない。このlaneから公開、provider API call、wake、replay、fence closeは行っていない。

15:47ZのInstagramと15:53ZのTikTok statusはloaded-idle / exit75 / resource_effect_unknownでprovider receiptなし。Instagramはreadback adapterなし、TikTokはdiagnostic fieldsが揃ったがreceiptなし。ownerの公式履歴/effect reconciliationが取れるまでreaderを再試行しない。

Task 4 preliminary ASO readback: screenshot visual auditは2026-10-04のUS listingでiPhone 6.7-inch screenshot 4枚を確認。2026-10-05T15:39ZのUS/JP/DE metadata再readbackでも公開version1.9.4のまま、JP47 ratings、US/DEはrating overview表示なし。順に「Personalized Affirmations」「Reminders to Stay Positive」「Choose From 8 Themes」「Change How You Think」。1/2/4枚目は似たaffirmation-card構成で、3枚目の8 themesはlisting descriptionの13 self-care themesと不一致。title 27 characters / subtitle 30 charactersでAppleの各30文字上限内。これはpublic-page観測とvisual assessmentで、表示可能theme数・機能の誤りやPPO upliftの証明ではない。Task 1〜3のgate、実機能確認、PPO標本可能性を通るまで素材公開やonboarding変更をしない。

順序はTask 1→Task 2とTask 3の並行→Task 4→Task 5→Task 6とする。まず現状と計測の信頼性を確かめつつ、Task 3では既存配信のreadbackを前進させる。distributionは最初の成長施策だが、reach→store→installの測定前に投稿本数や広告費だけを増やさない。Task 4ではスクリーンショット/PPOを先に検証し、その後に初回カード体験を別実験にする。Life Manager全体のTODO/orderはprimaryの統合SSOTであり、この表はANICCA growth lane内の作業順である。

| Task | 成果 | 状態 | 依存 |
|---|---|---|---|
| 1 | 公開版/build/課金経路/現状値の証拠 | **進行中。** 10/01 local Standard reportはImpressions20/Page views5、Rork common-windowは5 unique impressions/0 unique page views。Downloads Standardは10/02 first-time download1 / App Store search / version1.9.4。source mainは1.9.5/build365でASC mapping未確認。US pageはrating overviewなし、JP pageは47 ratings、DEは別locale copy。CFO aggregateは別combined range 09/30–10/02でDL1/impressions16/unique11/page views0、`unattributed`・campaign unavailable。CFO RC direct readbackは10/03 MRR JPY3,196.91/USD20.34・Sep proceeds JPY3,363.77だがsettled netやuser cohortではない。 | owner Detailed request/fix/readback、source/build/ASC mapping、locale metadata/PPO history、live offering/checkout、report windows/metric definitions reconciliation、FINANCIAL↔FINANCE_DETAIL row attribution、Mixpanel/RC unique-user refsが不足 |
| 2 | 信頼できるコホートと課金ファネル | 部分進行。Growth paywall-view source-only correctionはcandidate branchのみ、event count/public binary未確認。Mobile ownerにはD7 cohort readerがfeature branch上にあるがexperimental/private（9/25 Anicca 0/1、9/26 n=3 unavailable as of 10/03）。CFO Financial Managerはfinancial aggregation/receipt pathで、onboarding step/user identityは扱わない。 | published event readback、stable anonymous/user→RC ID mapping、Mixpanel step→real card→purchase cohort、renewal/refund、D35 economics。owner lane sourceは重複実装しない |
| 3 | 配信別の獲得と改善記録 | 部分進行。前回受入れ済み14:26Z readbackは557 published provider IDs、93 exact post-metrics joins、397 mature、46 D7 checkpoint（32/14）、46/46 hash/identity match。16:14Zの現local-state diagnosticではID 557・metrics 98 IDs/94 joinsだが、D7は53 receipt-bound checkpoint（37/16）、latest identity exact join 53/53となり前回の46/46と同一snapshotとして再現できない。journal file mtimeがcutoff後、per-row ingestion timestampなしのため前回値は歴史的readbackとして保持し、ownerの同一query/immutable snapshotで原因を照合する。click/ASC install/paid joinは未接続。 | owner fence official readbackを待つ。metrics readerはwake/replay/fence-closeしない。current cutoff・window・file hashを記録し、D7 count差を解消する。existing cadenceは維持 |
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
- CFO direct RevenueCat readback is a provider MRR point for 2026-10-03 (Anicca JPY3,196.91; USD query20.34) and September proceeds metric JPY3,363.77. It is not Apple/bank settlement or net profit; chart unit labels conflict for the JPY query and the local 10/03 business-outcomes row still lacks currency/revenue_definition. Do not call this verified net MRR.
- 先行指標は対象reach→ASC impression/page view/first-time download→unique onboarding cohort→value/paywall→paid→renewal/refund。利益判断は別途同期間のApple proceeds/fees, refunds, variable compute/infra, ad CACを必要とする。
- 前回受入れ済みstrict-window 168h sample（cutoff 2026-10-04T14:26:22Z）はInstagram10 measured posts、TikTok8、YouTube14。TikTokの8 measured carousel postsは同じmedia/caption hash、views sum311（median39.5/max58）。次の候補は既存owner cadence内の次slotで、同じ承認済み日本語affirmation/caption/CTAを15〜30秒9:16 short video形式に再構成するformat test（詳細とTikTok公式creative guidanceはspec「最初のTikTokテスト案」）。投稿時刻/audience/CTAを固定し、既存`experiment_id` fieldでvariantを記録する。1本はscreeningに留め、historical baselineよりよければ新assetを2本追加してからdirectional callをする。TikTok for Business guidanceは広告向けなのでorganic liftを保証しない。click/ASC install/paid join前にcadenceや広告費は増やさない。
- 反復順は課題/配信仮説→同一window獲得→初回価値/課金→成熟D35 paid→renewal/contribution→横展開。実測で1st gateが未達なら次app複製や大規模有料獲得はしない。

## Task 1: 公開版と現状値の証拠を再確認する

**Files:** このspecの「現状の証拠」、この計画のタスク状態。製品コードは読取のみ。

**Interfaces:** ASC app `6755129214` / bundle `ai.anicca.app.ios`、既存取得ownerのASC/RevenueCat refs/hash、Mixpanel project、投稿担当の実績を読む。出力は取得時点/期間/取得元/分母/欠損付きの基準表と公開build対応表。公式APIの再取得は既存ownerと共有し、同じ取得を並走しない。

- [x] 既存mobile設計のProvider observationsから24登録/6公開アプリ、旧未公開rosterとの違いを取り込み、根拠SHA/hashをspecへ記録する。私による公式API再取得とは扱わない。
- [x] 最新anicca-products mainのUX/分析コードと、既存business-outcomesのproduct_analytics/PostHog statusを読んで部分基準表を記録する。raw件数を離脱率へ変換しない。
- [x] current mainの`ContentView`→`OnboardingFlowView`→`PaywallFlowContainer`→`PaywallVariantBView`、event trigger、Mixpanel/PostHog/RevenueCat identity call sitesをread-only traceする。初回は未ログインでもonboarding/paywallへ進み、`onboarding_completed`はpaywall前。購入client eventsはserver-settled truthではなく、anonymous→RC cross-source bridgeもsource上で証明されないと記録する。
- [x] 2026-10-05T00:00 JSTに最新Anicca business-outcomes rowをread-only再確認し、row observed_at 2026-10-04T15:00:23.470913Zとsource statuses/report hashesを記録する。raw user rowsを使わずowner APIは重複取得しない。
- [x] CFO laneのread-only provider artifactsをGrowth baselineへ別sourceとして取り込む。§87-B/ASC readbackはcombined 2026-09-30..10-02, processing 10-03でDL1 / total impressions16 / unique11 / page views0 / unattributed、campaign unavailable。§87-Q/RevenueCatは2026-10-03 Anicca MRR JPY3,196.91 (USD query20.34)とSeptember proceeds JPY3,363.77。どちらも同一user cohort・settled Apple/bank netではない。
- [x] Mobile owner Task8/9/10 planとCFO candidate Task1-3/8A evidenceをread-onlyで比較し、FINANCE_DETAIL crosswalk・private D7 sample・日次財務receiptの再利用境界をspecへ記録する。Growth laneはowner source/stateを変更しない。
- [x] Mobile Metrics branch Tasks 1–3とTask 8のreadbackを2026-10-05に更新する。candidate source/testsは完了だがnot merged/production。issue #6547はopen・comments 0、Daisuke134 adminの+1がありmaintainer-approval signalは成立。partial-coverage fix、main sync、再受入れ、fresh reviewは残る。Growth laneはsource implementationを引き取らない。
- [x] mobile owner feature branchをread-only確認し、collector predicate/fixtureの`Page View`を特定する。Growth laneのcollector sourceは変更しない。
- [x] 保存済みofficial Standard Discovery reportを読み、10/01の`Page view` 3行・Counts合計5、Impression 12行・Counts合計20を確認する。canonical `evidence_sha256`とfile-byte SHA256は区別してspecへ記録し、row-level Unique Countsをoverall audienceに合算しない。
- [x] mobile取得ownerとprimaryへ重複しない所有範囲と必要なrefs/hashを共有する。primaryの分離了承は受信済み、mobile owner本人の返信は未確認。
- [x] US/JP/DE App Store pageを2026-10-05T15:39Zに`crwl`でmetadata再readbackし、title/subtitle/version/category/languages/age/rating overview/IAP/legal subscription textを記録する。screenshotのvisual auditは2026-10-04分を保持する。掲載IAPをRevenueCat live offeringとは扱わない。
- [x] 2026-10-05 current public listingを再readbackし、version1.9.4が継続していることとASC Downloads Standard row/source `project.pbxproj`のversion差を照合する。公開1.9.4/download row 1.9.4とsource 1.9.5/build365のmapping gapを記録し、main sourceを公開済みbuildと見なさない。
- [x] 2026-10-05 US/JP/DE App Store public pagesをread-only比較し、JPの47 ratings、US/DE rating overview非表示、locale別title/subtitleと異なる掲載IAP価格を記録する。localization readbackはASC keywords、promo text、PPO historyやlocalized screenshotsを代替しない。
- [ ] Existing ASC owner refsでhidden keyword fields、promo text、metadata update time、localized screenshot/PPO historyを確定し、public US/JP/DE pagesとの差を記録する。keyword fieldはpublic HTMLで推測しない。
- [ ] mobile ownerが`Page view` raw enumに合うcollector predicate/fixtureを修正してfocused regressionを実行し、既存ASC requestのfresh readback refs/hashを共有する。Growth laneは変更を取り込まず、結果だけを消費する。
- [ ] そのowner readbackで10/01 first-time downloads 0の一致、page-view total5/unique0の差、segment/StoreKit含有を照合する。20 total impressions/5 unique impressionsは異なるmetric定義であり直接不一致としない。rateは対応する同一定義の値だけで計算する。
- [ ] CFO `collectProduct` combined aggregate (09/30..10/02)とStandard raw report/Rork Analytics report-level `data_from/data_to`・event definitionsをowner refsでreconcileする。16 total vs Oct1 Standard row count20, page view total5 vs product total0を混ぜず、cohort conversionを作らない。
- [ ] 既存ownerから最新apps/versions/buildのofficial refsを共有してもらい、公開版対応表を確定する。独自に同じASC取得を始めない。
- [ ] 公開1.9.4 build metadata・actual checkout・current source pathを既存owner refsから照合する。ソースのcloseと別画面のPostHog設定だけでliveゲートを断定しない。
- [x] 保存済みASC Subscription State report（processing 2026-10-04 / data window 10/01–10/03 / 81 rows）とMobile Metrics owner planのRevenueCat project/product rosterをread-only照合する。Anicca Annual ID 6762049696、Anicca Monthly B 6769264298、Anicca Weekly 6762049888などASC product recordsがある。RevenueCat projectは8 app records / 21 products across six app IDs。いずれもcurrent checkout offeringを示す証拠ではない。
- [ ] Existing owner refsでcurrent RevenueCat offering→product/SKU→ASC subscription/app mapping、trial eligibility、実購入画面を確定する。Offer Type/NameがblankのASC state reportやUS page上の6 IAP recordからlive trial/offerを推定しない。
- [ ] Apple FINANCIAL fiscal rowとFINANCE_DETAIL Z1 candidate mapping（child ID 6762049696 + SKU ai.anicca.app.ios.yearly.b → parent 6755129214）が同一report/rowかowner evidence refsで確認する。issue #6547 coverage gate、natural import、B7/Financial Manager receiptまで未達なのでJPY 4,250を計上しない。
- [x] Existing saved ASC Purchases/Subscription Event evidenceをAnicca app IDでread-only照合: 09/07 purchase row1 (content ID6762049696, Sales USD31.40 / report Proceeds USD26.69, paying users1); 09/12 subscription start count1. Preserve report/date separation; this is not a same-user join, current renewal, settlement, or bank receipt.
- [ ] 既存owner refsから最新Sales/Analytics期間とType1/1F download dataを照合し、app SKU/parent、通貨、期間、official receiptを記録する。必要な秘密情報はcredential SSOTで安全に解決し、値を文書へ書かない。
- [ ] Mixpanelのfirst-open/step別unique cohortと既存RC purchase/refund/updateを同期間で照合する。rawイベント、customer cohort、ASC install cohortを別分母として扱う。PostHog read権限不足はownerの既存経路で解決する。
- [x] specの新しいlocal/public observationに観測時点・source・window・分母を記録し、古いsnapshotは歴史的観測として分離する。生レポートを公開Gitへ載せない。
- [ ] 成功判定: liveゲートを証拠付きで記述でき、集計の欠損が見える。製品変更を必要としない。

## Task 2: 最小の計測整備

**進捗:** 2026-10-05 readbackではcanonical Life Manager main 82d31995e6のPaywallVariantBViewに同じpaywall eventを送る二経路が残る。旧1行candidateは非canonicalなanicca-products mirror branch fix/anicca-paywall-event-dedupe-20261004-growth / commit 76cf8b6e5968f958ee837318d68b6842386f4eb2のみで、test・PR・public event receiptがなく再利用しない。Mobile Metrics owner branchはapps/mobile/anicca-iosを変更していない。native fixとGrowth Task 2のuser-level funnelはcanonical mobile ownerの残作業であり、このCFO/readback laneでは実装しない。前回のXcode buildはiOS 26.5 destination/Simulator runtimeなしでcompile前にexit70。event countと公開版への反映は未確認。

**Files:** 将来の実装対象は `aniccaios/aniccaios/Services/AnalyticsManager.swift`、`Services/SubscriptionManager.swift`、`AppDelegate.swift`、`Onboarding/PaywallVariantBView.swift`、`Onboarding/OnboardingFlowView.swift`。実際に欠損がある箇所だけ変更する。`scripts/daily-metrics/*`は旧経路の読取参照にとどめ、既存Life Manager producerに対抗する別取得/集計loopを作らない。CFO/ASC/RCの接続修正は既存ownerが所有する。

**Interfaces:** 既存の `AnalyticsManager.track(_:properties:)`、`trackPaywallViewed()`、`trackPurchaseCompleted(productId:revenue:)`、RevenueCat user/transaction ID。出力は一ユーザーの段階表示/完了/購入を接続できるファネル。収益はRCの取引イベントへ寄せる。

- [ ] Task 2着手時に関連targetのbaselineを確認する。`OnboardingV2Tests.swift`は旧case参照があるため、対象への組込みと現enumとの整合性を調べる。既存suiteを無条件に実行可能と書かない。
- [ ] duplicate表示を一回のonAppearで再現する。検証assertionは `paywall_plan_selection_viewed` が一回。既存ログ/受信イベントで再現できなければ、同targetで最小capture回帰を追加する。
- [ ] `PaywallVariantBView`の直接送信と`trackPaywallViewed()`の重複を解消する。SKAN更新が残る経路を使う。
- [ ] 同一取引の再受信→新規購入1回、restore→新規購入0、pending/取消→新規購入0を検証する。delegateのentitlement更新を取引発生の代用にしない。
- [ ] 既存IDを確認し、first-openコホート、app/onboarding version、step、experiment/variant、offering/productで不足する属性だけ追加する。悩みの自由記述は送らない。
- [ ] RevenueCat→MixpanelのID/更新/返金を照合し、Sandboxとproductionを分ける。取得できない指標を0へ埋めない。
- [ ] Existing mobile ownerから最新のmature D7 cohort source/refをread-onlyで受け取る。2026-09-26 Anicca n=3 cohortは2026-10-03 probe時点でunavailableだったため、mature後のfresh resultもprivate/experimental label付きで扱い、再取得を並走しない。
- [ ] 変更に関係する既存テストと新しい最小回帰を実行する。Xcode schemeは`aniccaios`、projectは`aniccaios/aniccaios.xcodeproj`。利用可能なSimulator IDを実測して `xcodebuild test -project aniccaios/aniccaios.xcodeproj -scheme aniccaios -destination 'platform=iOS Simulator,id=<実測ID>' -only-testing:aniccaiosTests/<対象クラス>` を実行する。
- [ ] 成功判定: one-view/one-eventと取引の重複防止を確認し、同コホートのファネルが読める。反映が依頼された場合のみ公開版の受信まで確認する。

## Task 3: 既存配信を測って改善する

**Files:** 既存配信担当のANICCA設定/投稿記録。正本の場所はTask 1の担当確認で特定し、別配信loopは作らない。この計画へ実際のownerと正本パスを記録する。

**Interfaces:** 投稿ID/URL、切り口、言語、reach、クリック、campaign/CPP集計。出力は週次の獲得比較と次の切り口。

- [x] 既存marketing receipt/jobs journalとmetrics runnerを発見する。specの「継続調査の基準表」に絶対パスを記録する。全product journal行数をAniccaの投稿数にしない。
- [x] 前回11:34Z cutoffのstrict rolling 28d snapshotは562 provider IDs（IG231/TT234/YT97）。歴史的cutoff値として記録し、後続windowのcurrent countと同一視しない。
- [x] 前回11:34Z sampleでは97 unique Postiz IDsのうち93件をpublished receipt provider IDへplatform別exact join。成熟post399件中52 checkpoint（37 measured/15 unavailable）、52 raw hash verified。後続cutoffは別readbackとして記録する。
- [x] 14:26Z in-window measured asset-hash群: Instagram10 posts / 4 groups (5/3/1/1), TikTok8 / 1 group, YouTube14 / 5 groups (5/5/2/1/1)。これは反復状況を示し、勝者の因果効果を示さない。
- [x] 2026-10-04T14:26Z strict rolling 28d refresh: 557 unique provider IDs (IG229/TT231/YT97)、93件のexact platform/provider-ID→post-metrics join。成熟投稿397件中46件にin-window 168h checkpoint（32 measured/14 unavailable）があり、46 raw hashと46 publication-identity native IDが一致した。cutoffとquery定義が異なるsnapshot間は直接比較しない。
- [x] 2026-10-04T16:14:47Z persisted-journal Task 3 diagnostic: per-receipt provider ID count 557, 98 Anicca metrics IDs/94 joins; D7 candidate 57, receipt-bound 53 (37 measured/16 unavailable), 53/53 response hash and latest identity joins. The prior 14:26Z 46/46 snapshot remains historical because journal files changed later and lack row ingestion timestamps; preserve the difference as unresolved until owner supplies the exact snapshot/query.
- [ ] Owner-owned `life-manager-instagram-metrics` / `life-manager-tiktok-metrics` は現状`resource_effect_unknown` admission fence、旧occurenceのprovider readback adapterなし。既存ownerがofficial Telegram/platform historyでeffectを照合し、fence close可否を決めるまで私がrestart/resendしない。
- [x] Fresh `lm-loop status` readback 2026-10-04T14:17:22Z (Instagram) / 13:56:17Z (TikTok): both `exit75 / host_admission_deferred:resource_effect_unknown`, loaded-idle, no new provider receipt/readback, and old claimed/history_incomplete fence with `provider_state=no_adapter`. Installed release SHAs were `9a76dcc8` / `1a20a537`. No wake/replay/fence close performed; this runtime status does not change the separately sampled post-metrics data.
- [ ] 全体primary/既存ownerからfence owner/readback planを受け取り、official message/provider historyで効果を照合してから既存readerを回復する。自分のlaneからwake/replay/fence closeしない。
- [x] Existing `marketing-owner-events` post-metrics sampleをread-onlyで取得。これは`life-manager-instagram-metrics`/`life-manager-tiktok-metrics` fenced readersのstatusを解消しない。sampleのimpressions値はnull、click fieldはschemaになく、store install/paidとも未接続。
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
