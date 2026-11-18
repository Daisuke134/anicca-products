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
- [ ] 指定成果物commit/push・remote確認

実行中観測: 標準GLM 5.3が4096 tokensを推論だけで消費しcontent=null、finish_reason=lengthになる。既存harnessはAttributeErrorをtransport failureと粗く記録するが、raw responseにより実際はHTTP成功後の候補欠落と識別する。比較条件を変えず、再抽選もしない。既存前払残高59.205556692 USDを確認し、完走費用に合わせ評価専用キーlimitだけ0.25→1 USDへ変更してprovider readback。入金・auto-reload APIは呼ばない。

Round 3結果: NO-GO。32/32条件終了・受理0・送信可能文0（FAIL率は算出不能）。38応答中31件length/content=null、残る7セットはgrounding reject。全生成40文を全文確認: FAIL6/40=15%、捏造4、tone0、none7。question24/40=60%。導入済みJanomeの固定語彙は『調子』『過去』『手』『きっかけ』など正常な介入語も拒否し、過剰棄却する。ガードは捏造完全検出を保証しない。
応答cost Decimal合計0.3629275269 USD。generation37 receiptと1件404応答fallback合計0.362927526 USD。公式key usageとの差は結果レポートへ併記。原harnessのnull.strip()→AttributeErrorはJSON/validation retryの対象外なので31件はretryなし。比較を守り実行中・終了後の再抽選やmax_tokens変更は行わない。
現在cursor: コード成果物push、opsの指定結果ファイルcommit/pushとremote照合。
