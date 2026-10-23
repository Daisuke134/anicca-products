# AI Monk 残28入口の商品観測統合計画

## 目的・範囲・完了条件

保存済み28入口・33商品観測を既存Databaseの`offers`、参照source、seller counterへ統合する。private readbackの49 source候補から実際の内容と帰属根拠に必要なsourceを選び、raw本文を公開しない。正本契約 → `docs/superpowers/specs/2026-10-21-ai-monk-avatar-field-guide.md`「残28入口の商品観測統合」。

専用worktreeは `/Users/anicca/Projects/anicca-products-worktrees/ai-monk-products-remaining-20261024`、branchは `feat/ai-monk-products-remaining-20261024`、baseはmain `d5ba46143e81e506caab40f66c5da774c9efffbd`。共有checkoutと他workerの変更を編集しない。

## 入力と契約

- private入力: `/Users/anicca/.local/state/life-manager/ebook/evidence/ai-monk-database-profile-audit-20261024/product-research-remaining/readback.json`。商品関連23入口、取得不可/不成立4入口、非商品1入口。23には重複経路2と先行crawl再利用2を含む。
- distinct追加観測は33商品。数値価格26、うち通貨確定22/未確認4、価格不明7。明示free/PWYWと不明を区別し、`$`だけからUSDを補わない。
- 同一商品を2accountへ関連付ける場合は同じ`observation_id`を使う。行数をdistinct商品数と呼ばない。既存20商品を再計上しない。Yon Chenの同名programは同一可能性を記録して追加数から外す。
- 既存139 sourceは内容を変えず保持する。chennatural/mongeraviの既存sourceは再利用し、今回採用sourceの取得時刻・private hashはreceiptにも残す。未取得tracking URLや失敗経路はreceiptで状態を説明する。
- 75archive/73public/included4/pending69/excluded2、AI状態、画像、既存指標と収益観測1件を保持する。新規の注文・収益観測を作らない。
- 既存表示/helperが参照する数値`price`、`currency`、`name`、`type`、`url`、`source_id`を利用する。参考価格、定期購入価格、分割払い、availabilityと帰属限界は補足metadataへ分ける。review/購読者/収録点数はseller counterとして区別する。

## 所有範囲

canonical JSON、`packages/ai-monk-index/{package.json,package-lock.json,README.md}`、今回のfield-guide契約、当plan、新規`docs/evidence/ai-monk-products-remaining-integration-20261024.json`だけを編集する。新runtime/helper/依存やmirroring testを追加しない。

Registry metadata/workflow、plugin payload、Factory runtime、X/native browser、認証、投稿、checkout、有料API、既存日次loopは対象外。PR/main/release公開はprimaryが所有する。

## TODOと現在cursor

- [x] SPEC: 契約と当planを先にcommit/pushし、remote SHA `371561c61543c99faec5c59a1a2a7cdb447cffd8`の一致を確認する。
- [x] RED: 未統合33件を理由とするsource acceptanceのexit1を確認する。
- [x] DATA: 39 sourceを引用し、既存2を再利用/37を追加して176出典へ更新する。33 distinct商品/35 account関連行/7 counter関連行を追加し、v0.4.5 metadata/READMEへ揃える。
- [x] GREEN: 同じacceptanceで既存保持、628 source参照のmissing0、通貨未確認4、価格不明7、重複除外、raw非混入を確認する。
- [x] TEST: 既存package全15testとshared helper9testがPASS。build済みAPIで33商品検索・35関連行と全出典の返却、価格variant/unknown/既存収益sortを確認する。
- [x] PUSH: データ実装commit `f4c430d256506a2b29514a76985057125198611a`をpushし、`ls-remote`の同一SHAを確認する。receiptと当planへ結果を記録し、primaryへ引き渡す。

現在cursor: primaryによるPR/main統合とv0.4.5の公開反映。結果receipt → `docs/evidence/ai-monk-products-remaining-integration-20261024.json`。作業中にorigin/mainは `0d3aa13c077f845b3c4bfb8b3b77fe2b91624336`へ進むが、当branchのbaseは指定main `d5ba4614`のまま保持する。Database→Plugin→Factoryの既存順は変えず、進行中のRegistry公開や既存日次effectを中断・重複しない。

## 検証方法

source acceptanceはprivate入力とbase snapshotを照合し、33 distinct観測、accountへの関連行、価格/通貨/variant、必要sourceの実在、元139 sourceと全既存profileの非商品fieldの保持、収益観測不変を検査する。既存helperの検索・収益sortとpackageのCLI/stdio/HTTP/独立install検証を使う。追加商品だけを数える恒久的mirroring testは作らない。

未確認の売上、価格不明7件、通貨不明4件、所有・著作・同一SKU、paid納品と購入可能性は未達のまま残す。公開後の本番readbackはこの実装unitの完了と混同しない。

## Primaryの公開契約
worker引渡し後、primaryは既存Registryのserver.jsonのversionだけをpackageと同じ0.4.5へ合わせる。namespace/remote URL/workflow/tool/payload/課金/日次loopは変更しない。版一致のassertは0.4.4対0.4.5でREDを確認し、修正後に公式publisher validateと一致assertを行う。package/Landingのexact-head CIとmain/Netlify176出典readbackの後、v0.4.5を新しいimmutable ReleaseとRegistry versionとして配布する。既存v0.4.4/旧Releaseは書換しない。fresh data検証のblockingは0、raw60file hashesと33商品の実API返却を独立照合済み。
