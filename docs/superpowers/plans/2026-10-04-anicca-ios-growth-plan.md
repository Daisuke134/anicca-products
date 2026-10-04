# ANICCA iOS 成長改善の実行計画

> 実行担当者: 実装が明示依頼された段階で `superpowers:executing-plans` または必要な `superpowers:subagent-driven-development` を使う。現在はTask 1/3の読み取り調査と既存計画の更新を進め、製品実装は未着手。

**Goal:** 公開済みANICCAで獲得・初回価値・課金・継続を測り、売上を改善する反復手順を作る。

**Architecture:** ASC、Mixpanel、RevenueCatの既存構成を再利用する。計測と配信を並行し、ASO、価値体験、課金方式を一変数ずつ改善する。収益の正本は実取引とし、クライアントイベントを二重に数えない。

**Tech Stack:** SwiftUI、Mixpanel、PostHog、RevenueCat、ASC CLI、Apple PPO/CPP。

**Spec:** `docs/superpowers/specs/2026-10-04-anicca-ios-growth-design.md`

## Global Constraints

- 現在の依頼は調査・設計・計画・引き継ぎ資料の保存まで。
- 製品コード、ASC metadata、購読条件、広告出稿、配信loopの変更や実装開始は依頼されていない。
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

現在cursorは **Task 1: 公開build/offerings/同一ユーザーファネルの不足証拠を照合**。既存owner資料/コード/local rowから6つの公式published target、10/01 acquisitionの0 installs/5 unique impressions/page views0でrate unavailable、10/02 RevenueCat MRR chart $20.34 USD、10/03 raw event countsを部分取得した。これは同じwindow/user cohortのファネルでもsettled CFO P&Lでもない。Task 3ではAnicca-tagged local publish journalに28日間567 provider_post_id記録（IG234/TikTok236/YouTube97）を特定。reach/view/click→acquisitionのjoinは未取得。既存owner cadenceは継続し、成果計測の後に追加creativeを判断する。文書の更新・push完了を製品タスクの完了に含めない。

順序は元のTask 1→2→3→4→5→6を維持する。Task 3のread-only調査だけをTask 1/2と並行し、配信実行を前倒しする許可とは扱わない。Task 4内はスクリーンショット→初回カード体験の順に独立比較する。Life Manager全体のTODO/orderはprimaryの統合SSOTであり、この表はgrowth内の作業細分である。

| Task | 成果 | 状態 | 依存 |
|---|---|---|---|
| 1 | 公開版/build/課金経路/現状値の証拠 | 進行中・基準表部分取得 | build/source対応・offerings・user funnel不足 |
| 2 | 信頼できるコホートと課金ファネル | 未着手 | Task 1、実装依頼 |
| 3 | 配信別の獲得と改善記録 | 調査進行中・28日local posting count取得済 | 既存owner cadenceは維持。追加creative案の選択は同じpost IDのofficial reach/view/click→ASC window join後 |
| 4 | ストア訴求と初回カード体験の改善 | 未着手 | 1/2/3、実装/公開依頼 |
| 5 | 訴求→hard/softの比較 | 未着手 | 1/2/4、標本見積り、変更依頼 |
| 6 | 他の公開アプリへ再利用 | 未着手 | ANICCAでの学習結果 |

### $10Kの運用モデル

- 経営目標はまずportfolio $10K MRR、次に再現性があるwinner apps各$10K。全published appへ等しい投資はしない。
- Portfolio $10Kは1 app×$10K、2 apps×$5K、5 apps×$2Kなどの構成で実現できる。均等分布は仮定しない。
- 月換算$10 MRR/paid subscriberなら1 appあたり1,000 active paid subscribersが$10K目安。月次解約10%仮定で月100 new paid subscriberを補充する。
- RevenueCat D35 cohort conversionを感度分析に使う。月100 new paidに約4,762 DL (2.1%), 2,000 DL (5%), 935 DL (10.7%)。2.1%/10.7%はRevenueCatで異なるmodel群のmedian、5%は仮定。live Anicca conversionとはしない。
- $20.34 RevenueCat MRR chart (complete period 2026-10-02, USD) はmobile owner readback。CFO settlement/profitではなく、10/03 JSONLはcurrency/revenue_definition欠落。正式なstarting CFO MRRは未確定。
- 先行指標は対象reach→ASC impression/page view/first-time download→unique onboarding cohort→value/paywall→paid→renewal/refund。利益判断は別途同期間のApple proceeds/fees, refunds, variable compute/infra, ad CACを必要とする。
- 既存Aniccaはlocal journal上28日でIG/TikTok/YouTube published IDs567。直近ASC一日windowは0 installs/5 unique impressionsで、現段階でpost efficacyはunknown。次は既存ownerの投稿reach/clickを1つのsample pathで結び、reach自体が少ないかstore遷移で落ちるか見分ける。reachデータ無しにpost volumeを増やさない。
- 反復順は課題/配信仮説→同一window獲得→初回価値/課金→成熟D35 paid→renewal/contribution→横展開。実測で1st gateが未達なら次app複製や大規模有料獲得はしない。

## Task 1: 公開版と現状値の証拠を再確認する

**Files:** このspecの「現状の証拠」、この計画のタスク状態。製品コードは読取のみ。

**Interfaces:** ASC app `6755129214` / bundle `ai.anicca.app.ios`、既存取得ownerのASC/RevenueCat refs/hash、Mixpanel project、投稿担当の実績を読む。出力は取得時点/期間/取得元/分母/欠損付きの基準表と公開build対応表。公式APIの再取得は既存ownerと共有し、同じ取得を並走しない。

- [x] 既存mobile設計のProvider observationsから24登録/6公開アプリ、旧未公開rosterとの違いを取り込み、根拠SHA/hashをspecへ記録する。私による公式API再取得とは扱わない。
- [x] 最新anicca-products mainのUX/分析コードと、既存business-outcomesのproduct_analytics/PostHog statusを読んで部分基準表を記録する。raw件数を離脱率へ変換しない。
- [x] mobile取得ownerとprimaryへ重複しない所有範囲と必要なrefs/hashを共有する。primaryの分離了承は受信済み、mobile owner本人の返信は未確認。
- [ ] 既存ownerから最新apps/versions/buildのofficial refsを共有してもらい、公開版対応表を確定する。独自に同じASC取得を始めない。
- [ ] 公開版のbuild metadataと実際の提供画面を照合する。ソースのcloseと別画面のPostHog設定だけでliveゲートを断定しない。
- [ ] 取得済みASC subscriptionsとRC offering/productの対応を既存ownerのrefsから読む。project一覧の先頭をANICCAとして扱わない。live trial有無とソースのtrial無効を分ける。
- [ ] 前回Sales/Analytics期間を再取得し、type1/1F、app SKU/parent、通貨、期間を明示する。必要な秘密情報はcredential SSOTで安全に解決し、値を文書へ書かない。
- [ ] Mixpanelのfirst-open/step別unique cohortと既存RC purchase/refund/updateを同期間で照合する。rawイベント、customer cohort、ASC install cohortを別分母として扱う。PostHog read権限不足はownerの既存経路で解決する。
- [ ] specの古い外部値を置き換えるか観測時点を明示する。生レポートを公開Gitへ載せない。
- [ ] 成功判定: liveゲートを証拠付きで記述でき、集計の欠損が見える。製品変更を必要としない。

## Task 2: 最小の計測整備

**進捗:** duplicate paywall view eventのsource-only prerequisiteはTask 1計測品質対応として個別branchへpush済み（spec「Source-onlyの計測重複修正」参照）。Task 2本体のuser-level funnel追加は未着手。source correctionはpublic binaryに入っていない。Simulator/generic iOS buildはXcodeがiOS 26.5 destinationを使用できずコンパイル前exit70、event-count regression testなし。source changeをproduction fixと扱わない。

**Files:** 将来の実装対象は `aniccaios/aniccaios/Services/AnalyticsManager.swift`、`Services/SubscriptionManager.swift`、`AppDelegate.swift`、`Onboarding/PaywallVariantBView.swift`、`Onboarding/OnboardingFlowView.swift`。実際に欠損がある箇所だけ変更する。`scripts/daily-metrics/*`は旧経路の読取参照にとどめ、既存Life Manager producerに対抗する別取得/集計loopを作らない。CFO/ASC/RCの接続修正は既存ownerが所有する。

**Interfaces:** 既存の `AnalyticsManager.track(_:properties:)`、`trackPaywallViewed()`、`trackPurchaseCompleted(productId:revenue:)`、RevenueCat user/transaction ID。出力は一ユーザーの段階表示/完了/購入を接続できるファネル。収益はRCの取引イベントへ寄せる。

- [ ] 実装依頼後、関連targetのbaselineを確認する。`OnboardingV2Tests.swift`は旧case参照があるため、対象への組込みと現enumとの整合性を調べる。既存suiteを無条件に実行可能と書かない。
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
- [x] Anicca `product_id`に絞り、28日間のlocal published/provider_post_id記録をplatform別に数えた（Instagram234/TikTok236/YouTube97）。これはfresh platform-readbackやreach/clickの証明ではない。
- [ ] Owner-owned `life-manager-instagram-metrics` / `life-manager-tiktok-metrics` は現状`resource_effect_unknown` admission fence、旧occurenceのprovider readback adapterなし。既存ownerがofficial Telegram/platform historyでeffectを照合し、fence close可否を決めるまで私がrestart/resendしない。
- [x] 正規`lm-loop status life-manager-instagram-metrics`/`life-manager-tiktok-metrics` readback: last occurrence 2026-10-04T10:17:07Z/10:22:10Z、exit75 `resource_effect_unknown`、old claimed/history_incomplete fence、provider receipt/refなし、diagnosis `no_adapter`。このstatusだけでreach/sampleを補わない。
- [ ] 全体primary/既存ownerからfence owner/readback planを受け取り、official message/provider historyで効果を照合してから既存readerを回復する。自分のlaneからwake/replay/fence closeしない。
- [ ] metrics loopがofficial sourceを再取得できた後、既存ownerから直近28日のAnicca投稿ID/URLとplatform insights readbackを受け取り、reach/view/clickを同期間ASC refsへ1 sample pathで結ぶ。platform insightが欠ける場合は正確なowner取得境界/fieldの不足を記録する。
- [ ] Sample判定: low reachならcreative/audience test、reachあるがclick低ならCTA/offer fit、store impressionあるがproduct page/install低ならscreenshots/product-page。測れない分岐はunavailableのまま。
- [ ] 既存ownerの予定済み配信 cadenceは維持する。計測が取れない状態で追加account/publisherや過剰なpost volumeを自作しない。sample pathが閉じたら、実測で勝ったcreativeを追加テストする。
- [ ] 最新の国別DLと実績を見て、日本/日本語を第一案とする。夜の考えすぎ、自己批判、先延ばしの切り口を比較する。
- [ ] 投稿別campaign linkを設計する。SNS reachとストアImpressionを混ぜず、個人単位の帰属ができるとは仮定しない。
- [ ] 公開依頼後、週10本の独立クリエイティブ案を制作能力に合わせて調整する。実カード/通知を見せる。記事は勝った悩みを週1本掘り下げる。
- [ ] 毎週クリック→初回DL→購入→D35売上/インストールを比較し、取得不能な段は欠損として残す。
- [ ] 成功判定: 実投稿と獲得が比較でき、次に増やす切り口に証拠がある。単なる投稿数を成功としない。
- [ ] MRR/$10K目標はアプリ別とportfolio合計で分け、source windowと有料分母が揃うまで目標到達/転換率を宣言しない。

## Task 4: ASOと初回価値体験を順に改善する

**Files:** ASCのANICCAスクショ/metadata、既存`.claude/skills/screenshot-ab/`資産、`Onboarding/OnboardingStep.swift`、`OnboardingFlowView.swift`、`PersonalizedInsightStepView.swift`、`ProcessingStepView.swift`、`NotificationPermissionStepView.swift`、既存カード描画、`Resources/{ja,en}.lproj/Localizable.strings`。

**Interfaces:** 既存 `next: () -> Void` とuserProfileの悩み/時間、カード表示。出力はストア訴求一案の実験、次に実カード体験の独立実験。両者を同時に変更しない。

- [ ] 公開スクショを再取得し、最初の3枚を悩み/結果→届く場面→個別の実体験の一案として設計する。
- [ ] Apple PPOの必要標本/期間を確認し、現行対一案で比較する。公開依頼後に開始し、90%未満の信頼度の小差を勝者としない。
- [ ] オンボは歓迎→主な悩み→困る時間→実カード→通知価値説明→paywallを第一案とする。実カードの既存view/dataを再利用する。
- [ ] 「選んだ悩みが異なると表示カードも異なる」をfocused回帰で固定する。保存済み旧stepのmigrationと途中再開の必要なケースも検証する。
- [ ] 81%改善主張と引用レビューの根拠を調べ、根拠がなければ使わない。虚偽の個別化/処理演出を追加しない。
- [ ] 通知拒否でも次に進めること、無料dismissと既存購読者の着地を関連テストで確認する。rate依頼の移動や段階削除は実離脱と用途から決める。
- [ ] 成功判定: 初回価値到達/購入/D35売上を比較でき、実験割当・価格を固定できる。未成熟コホートは未確定のまま残す。

## Task 5: ペイウォールを一変数ずつ比較する

**Files:** 実際のlive経路の`OnboardingBibleViews.swift`/`PaywallVariantBView.swift`、RC offerings/experiments。使われていない`PlanSelectionStepView`だけ変更して実験開始としない。

**Interfaces:** 現価格、offering/product、匿名ID、固定variant。出力はまず訴求一案対現行、その後にhard/softの独立比較。

- [ ] Task 1のliveゲートをcontrolとし、価格/トライアルは固定する。初回は価値説明だけを変える。
- [ ] offerings空/通信失敗→再読込/restore、購入取消/pending→購入計上0、既存有料→権利保持を最小検証する。
- [ ] 標本見積り後、softの無料範囲/再アップグレード契機とhardの復旧を定義する。既存Free/Pro実機能を確認してからコピーを作る。
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
