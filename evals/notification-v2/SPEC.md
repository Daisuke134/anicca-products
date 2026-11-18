# 通知文 eval v2

目的: 報告 §7 の5修正を検証し、同一8プロフィール×4帯を指定実モデルで再評価する。
範囲: このrepoには対象生成器が存在しないため、報告のimmutable commit
`Daisuke134/anicca@2e6c23d1caff6209d99667f67a945bb106a9f276` から取得した単一モジュールを
reference/interventions.py に保存して修正する。upstream.patch を適用可能な差分として出す。
指定外repoの変更、merge、本番有効化はしない。この成果は稼働側への統合を意味しない。

## TODO
- [x] 修正前の失敗テスト → 最小実装 → focused tests
- [x] 同一プロフィール・local_day=2026-11-18・recent_reactions=[]・4時刻で実モデル32決定
- [x] 各API応答と費用receiptを保存。再試行の棄却候補を含む全候補を読み判定
- [x] 合否判定実施: 4/133不合格(3.0075%)・捏造2件でNO-GO。none32件を別計上
- [x] 結果をanicca-ops/mainへ、コードを指定branchへcommit/pushしてremote確認

現在cursor: 指定成果物のpush・remote照合。

結果: 32/32契約成功、133文面を全文確認しFAIL4・捏造2。20テスト成功。応答cost厳密合計0.0344521112 USD、評価キー課金usage0.032139508 USD。generation receipt30件取得・2件404、課金差異は未照合として結果へ明記。判定はCodexの読み確認であり独立人間審査ではない。

再開時確認: 原版では13失敗・5成功、修正版18成功。元生成器が指定repoに存在しないため、固定upstream原版と適用パッチを同梱する。OpenRouterの既存生成キーは401。管理キーで前払残高59.336924393 USDを確認し、同口座の0.25 USD上限評価キーを正本へ保存。自動チャージは変更しない。

## 設計
humorを許可kindから除外。質問を送信候補の半数以上・送信確率質量の半分以上とpromptで要求。
プロフィール以外の事実・発言・身体状態・関係を捏造しない。対決的tough-love禁止。
storeで候補validationまたはJSON decode失敗だけ1回再生成。通信失敗の再送はしない。
文面検証は引用符・空引用符・制御/置換文字・異種script・異常反復・未完断片を拒否。
日本語の意味成立や捏造は文字規則だけで保証できず、全件読み判定で別評価する。
max_tokens=2000以上。使用費用はOpenRouter generation receiptのtotal_costをDecimal合計。

根拠: ~/anicca-ops/files/notification-word-eval-2026-11-18.md §2,7,9。
モデル一覧一次資料: https://openrouter.ai/api/v1/models 。指定IDの存在をlive確認。

認証: 指定ops正本を全読し、openrouter行はWeb認証metadataのみと確認。同行と同口座の管理キーで残高確認・評価キーを作成。新規秘密値はrepo外のCredential SSOTだけに保持する。ハーネスは同SSOTの評価専用service完全一致で読む。

## Round 3 GLM
目的・範囲: Round 2の32 context・契約・1 retry・4096 tokens・並列4を維持し、捏造guardと負例だけを追加する。モデルはOpenRouter models APIの標準flagship `z-ai/glm-5.3`（canonical `z-ai/glm-5.3-20260816`）。Primeは同APIがhigh-speed variantと記載する派生版のため選ばない。
完了条件: 全sendable候補をRound 2 rubricで読み、FAIL <5%・捏造0・tone0の場合のみPASS。失敗セット・棄却attemptは別計上して隠さない。費用・receipt・結果を保存し指定branchとopsへpush。本番有効化・main統合は範囲外。
設計: 導入済みJanome 0.5.0で具体名詞・固有名詞をprofile本文へ照合（一般的な介入語彙のみ固定許可）。日時とeventの結合、現在地、身体状態、既往発言の断定は別規則で照合する。曖昧な照合はrejectし既存1 retryへ戻す。語彙照合は意味推論の完全証明ではないため全文判定を維持する。
根拠: Round 2 reportのcase17/28、OpenRouter https://openrouter.ai/api/v1/models のlive保存models-v3.json。
上位の共通規則が軽微な変更への固定検索回数を不要とし、末尾project規則の全行動3検索と矛盾するため、今回の実コード・公式API・既存失敗例を調査根拠とする。
TODO / cursor:
- [x] 捏造guardのRED→GREEN、関連suite（修正前6件の捏造が通過、修正後30 PASS）
- [x] 同一32条件を1回実行（既存前払残高のみ、38応答・6 retry）
- [x] 全候補判定・費用確認（課金差異は未解消と記録）
- [x] 指定成果物commit/push・remote確認

実行中観測: 標準GLM 5.3が4096 tokensを推論だけで消費しcontent=null、finish_reason=lengthになる。既存harnessはAttributeErrorをtransport failureと粗く記録するが、raw responseにより実際はHTTP成功後の候補欠落と識別する。比較条件を変えず、再抽選もしない。既存前払残高59.205556692 USDを確認し、完走費用に合わせ評価専用キーlimitだけ0.25→1 USDへ変更してprovider readback。入金・auto-reload APIは呼ばない。

Round 3結果: NO-GO。32/32条件終了・受理0・送信可能文0（FAIL率は算出不能）。38応答中31件length/content=null、残る7セットはgrounding reject。全生成40文を全文確認: FAIL6/40=15%、捏造4、tone0、none7。question24/40=60%。導入済みJanomeの固定語彙は『調子』『過去』『手』『きっかけ』など正常な介入語も拒否し、過剰棄却する。ガードは捏造完全検出を保証しない。
応答cost Decimal合計0.3629275269 USD。generation37 receiptと1件404応答fallback合計0.362927526 USD。公式key usageとの差は結果レポートへ併記。原harnessのnull.strip()→AttributeErrorはJSON/validation retryの対象外なので31件はretryなし。比較を守り実行中・終了後の再抽選やmax_tokens変更は行わない。
現在cursor: 完了。結果NO-GOを保持し、本番は有効化しない。

費用最終照合: key usageの遅延反映後0.397379636 USD、開始前0.03445211 USD、差分0.362927526 USDでreceipt/fallback合計と一致。completion costとの差は0.0000000009 USD。key-final-v3.jsonに保存。

ops成果物: repo Daisuke134/anicca-ops、worktree /Users/anicca/work/ops-notification-eval-v3、branch codex/notification-eval-v3-glm-20261118、commit 92b36bf。指定ローカルpath /Users/anicca/anicca-ops/files/notification-eval-v3-glm-result-2026-11-18.md とGitHub contents APIのblob SHAが一致（925295d9a8073c1d5d82f725e9cd124b2d8e9a70）。既存ops checkoutの他者編集はstageしない。残TODOなし。

## Round 4（owner: Mac Codex）
目的: v3のnull応答と語彙過剰棄却を修正し、同一32条件の送信可能集合でFAIL<5%・捏造0・tone0を判定する。
範囲: 既存codex/eval-v2-2026-11-18を継続（前回途中成果を保持）。main統合・本番配送なし。結果はopsの隔離branchへ保存しpush/readbackする。
設計: generator max_tokens=8192、reasoning.enabled=false、null/空本文をValueErrorとして既存1 retryへ。語彙照合を除き日時・現在地のhard patternだけ維持し、各候補を安価な別モデルgoogle/gemini-2.5-flash-liteでprofileに意味照合する。judge欠落/異常はfail closed、棄却セットは既存1 retry、候補間引きなし。judgeは全候補を一括で個別判定しraw receiptを保存する。
モデル: live https://openrouter.ai/api/v1/models でqwen/qwen4-maxを確認。予算が残ればz-ai/glm-5.3も実行。
資金: 既存prepaidのみ、auto-reloadの変更・入金なし。評価キー上限1 USD（実行前残0.602620364 USD）。残高58.79856536 USD。auto-reload OFFの既存記録はあるが公開credits/key APIでは現在設定を返さないため、確認限界を明記する。
TODO:
- [x] null retry・意味judgeの最小RED/GREENテスト（現在41 PASS）
- [x] 同一32条件Qwen、予算内でGLM実行（ケース単位保存・既存ケース再課金禁止）
- [x] 全sendable全文判定・finish_reason・Decimal費用/公式key readback
- [x] コードと証拠push、ops結果保存とremote readback
現在cursor: テスト先行。v4の有料実行は未実施。

Round 4中間観測: Qwen28/32受理・sendable160、77応答全stop、公式77receipt費用0.067140720 USD。GLMはreasoning無効をHTTP400で拒否。追加最小probeの公式errorは「Reasoning is mandatory for this endpoint and cannot be disabled.」。key usageはQwen費用以外に増分なし。未課金の拒否をoutput-v4/glmへ保存し、GLMだけreasoning指定を省略し8192 tokensでoutput-v4/glm-fixedへ実行する。モデル・prompt・32条件は維持する。

Qwen全文判定: accepted28、sendable160、FAIL6=3.75%、捏造5、日本語1、tone0によりNO-GO。judgments.jsonに全160文の判定を保存。GLMは別モデル行として継続中。評価専用key上限だけ1→1.50 USDへ変更しreadback、Credential SSOTのlimit metadataも同期。

Round 4最終結果: 両モデルNO-GO。Qwen28/32・160文FAIL6(3.75%)・捏造5・tone0。GLM24/32・140文FAIL6(4.285714%)・捏造2・tone0。全300 sendable文をprimaryが全文判定しjudgments.jsonへ保存。GLM生成50応答（stop41/length9、null6）、judge39応答全stop、18 retry。Qwen生成39/judge38全stop、7 retry。全166receipt取得、fallback0。費用0.067140720+0.804760433=0.871901153 USD、公式key usage増分と厳密一致。completion申告合計との差0.0000000025 USDは末尾丸め差。credit totalは155のままで追加チャージなし。auto-reload OFFは既存記録を継承し現在UI設定は未確認。関連41テストと両runの監査PASS。Qwenの質問比率違反case9/14/18は別計上し、文単位FAIL率へ混ぜない。
現在cursor: 完了。ops commit 0f6c67642e4611b1a94a4fe739c932fe73b38a9b の結果本文とローカルをGitHub contents APIで照合、blob SHA c18d8cf9b2108749e66d3149075eab4fb965ead8 が一致。コードsummaryも固定commit f7848105597c2018a1043a1496f51696f7125e29からreadback一致。残TODOなし。本番有効化・main統合なし。

## Round 5（owner: Mac Codex）
目的・範囲: eval-v5-task.mdの3点のみ。v4実失敗の動機/願望/努力/数量帰属をgeneratorとjudgeの負例へ追加し、質問kind候補数>=non-noneの半数を構造受理条件とする。既存再生成1回、8192 tokens、日時/現在地hard pattern、同一32 contextを維持。v4ファイルは変更しない。
完了条件: 全sendable全文手読みjudgments.json・audit PASS、FAIL<5%かつ捏造0かつtone0でGO。それ以外NO-GO。専用key・既存prepaidのみ、最大limit2 USD、receipt Decimal合計とkey usage差分一致、credits開始/終了記録。ops隔離branch結果とproducts評価branchのコード・証拠をpush/readback。main統合・配送なし。
TODO:
- [x] RED/GREENとv4の41件を含む関連tests（追加8、49 PASS）
- [x] Qwen32条件（GLMは主目的遅延を避けv5未実行）
- [x] 全sendable手読み・audit・公式費用照合
- [ ] products/ops pushとremote blob照合
現在cursor: テスト先行。v5有料呼び出し未実施。

Round 5開始前: 専用key usage1.269280789 USD、limit1.50 USD（SSOT一致、変更なし）、残0.230719211 USD。credits155、total_usage97.073335793。公式models APIでQwenとjudgeを確認。auto_top_upはops credentialsのopenrouter行の保存済みOFF記録をliveで確認、設定UIの現在readbackは未取得。現在cursor: Qwen32条件実行。

Round 5結果: Qwen31/32受理、177文の全文手読みでFAIL8（捏造7、日本語1、tone0、4.519774%）のためNO-GO。独立read-onlyエージェントも177文を全読し同じ8文を確認。質問候補数違反の最終棄却はcase13、受理31セットの違反0。関連51テストPASS。74公式receipt合計0.066280490 USDとkey usage1.269280789→1.335561279の差分がDecimal厳密一致。初期12receiptの404とkey usageは遅延反映し、最終fallback0。credits155→155、入金・auto-reload変更なし。receipt保存時ENOSPCは自所有ops疎checkout縮小で空き1.2GiBに回復し、モデル再実行なし。現在cursor: products/ops成果物push・GitHub照合。
