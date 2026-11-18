# 通知文 eval v2

目的: 報告 §7 の5修正を検証し、同一8プロフィール×4帯を指定実モデルで再評価する。
範囲: このrepoには対象生成器が存在しないため、報告のimmutable commit
`Daisuke134/anicca@2e6c23d1caff6209d99667f67a945bb106a9f276` から取得した単一モジュールを
reference/interventions.py に保存して修正する。upstream.patch を適用可能な差分として出す。
指定外repoの変更、merge、本番有効化はしない。この成果は稼働側への統合を意味しない。

## TODO
- [x] 修正前の失敗テスト → 最小実装 → focused tests
- [ ] 同一プロフィール・local_day=2026-11-18・recent_reactions=[]・4時刻で実モデル32決定
- [ ] 各API応答と費用receiptを保存。再試行の棄却候補を含む全候補を読み判定
- [ ] 不合格率5%未満かつ捏造0件。契約失敗とnoneを別計上
- [ ] 結果をanicca-ops/mainへ、コードを指定branchへcommit/pushしてremote確認

現在cursor: 実モデル32条件生成。

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
