# AI Monk Factory専用Gemini project・キー準備

## 目的・範囲・完了条件

SaaS-1の専用Gemini利用準備として、既存の本人Google identityから未課金Cloud projectと制限付きAPI keyを作り、private SSOTと公式readbackを一致させる。project名はAI Monk Factory、project IDは`anicca-monk-factory-20261024`、key IDは`factory-gemini-server`とし、全操作はこの新規resourceだけへ限定する。費用上限はUSD0。API認証とmodel一覧の受入を、paid生成権限・実残高・invoice・Factory稼働とは区別する。

所有はprimary。canonical checkoutと日次Grok所有のIG/TikTok/Postiz/HeyGen/key/walletを変更しない。元Factory source契約と既存価格/予約/回数/秒数を維持する。Gemini adapterの実装はPR647のsource/CI/main反映として独立に受入する。

## 現在の事実と採る手段

SSOT全文をRAMで確認し、gcloudのactive本人IDとexact Google行の一致を確認する。公式billing accounts listは1件、open=true、linked projectsは4件、monk/factory名のproject一覧は0件を返す。既存accountをFactory専用財布へ読み替えない。ブラウザCDPの保護hook拒否は未解消だが、gcloud公式APIのread-only認証は成功する。拒否されたCDP経路の再試行・policy変更を行わない。

installed gcloudの公式helpでprojects create、services api-keys create/get-key-stringを確認する。既存認証設定・default projectを変更せず、各commandへ対象projectを明示する。project作成は`--no-enable-cloud-apis`、必要なmanagement/Gemini APIだけを後で対象指定enableする。キーは`generativelanguage.googleapis.com`だけに制限する。

新Cloud Billing accountのself-service作成と専用Gemini paid walletは未準備。既存共有billing accountへのlink、Prepay開始、既存balance/auto-reload変更、支払方法作成/更新、購入、LLM/画像/動画生成は0。権限やbilling依存が不足する場合は公式結果を記録し、その資源操作を繰り返さない。

## TODO・重複防止

- [x] SPEC: 当planを専用branchへcommit/pushしremote objectを確認する。mainへ通常統合し、外部操作前に同じplan blobを確認する。
- [x] PROJECT: 事前のowned request fenceをO_EXCL/fsyncで保存し、project作成を1回だけ送る。公式describeでID/name/lifecycle/帰属を確認し、billing未接続を公式readbackする。通信不明時は同IDのGETを先に行い、重複createしない。
- [x] KEY: 対象projectの必要APIだけを有効化し、固定key IDの既存状態をGET/listで確認する。新規作成は専用fenceの最初の1回だけ。API制限を公式describeで照合する。
- [x] SSOT: key値はRAMから直ちに`~/.local/share/anicca/credentials.json`のexact service `gemini-ai-monk-factory`へ保存する。既存行と他者更新を保持し、directory700/file600を維持する。keyをrepo/private log/chatへ複製しない。保存後にSSOTを新しく読んだ別requestでmodels GETを行う。
- [x] READBACK: 新project/billing未接続/key restriction/models認証の結果を秘匿receiptに保存し、公開receiptにはkey値・本人email・他project一覧を入れない。失敗はerror class/exit/effect/readback/次の操作を残す。
- [x] RECORD: 新規準備receiptと当plan・配布正本の現在cursorを本docs差分へ保存する。source/公開反映と未完の専用paid billing・実生成・Stripe/本人IGの受入を分け、通常のcommit/push/main統合とmain blob照合で閉じる。

## 実行境界

Cloud project/key作成とAPI enableは対象限定で宣言して実行する。既存認証・共有課金・browser/profile・Netlify secrets・Factory enable flagは変更しない。未取得token/残高/料金を0へ変換しない。sourceテスト成功をprovider課金/生成の成功と呼ばない。追加scheduler・framework・customer設定は作らない。

## 準備結果と残る条件

先行planはPR648/main `6c54f3a9a4c4df080174c1d76ddbbaa85a168737`のblob一致を確認してから実行する。project作成1回/API2件enable/key作成1回、project ACTIVE/本人owner、Gemini APIのみのkey制限、SSOT保存/再読込と2モデルGET200を公式確認する。専用projectのbillingEnabled=false・billing未接続を維持する。独立read-only検証は9項目PASS/Blocking0で、公式keyとSSOTの一致をRAM内だけで比較する。初回の誤ったGoogle行selectorのFAILはprovider call0の履歴として保持し、訂正後PASSを新規followup receiptに保存する。結果 → ../../evidence/ai-monk-factory-gemini-project-preparation-20261024.json。

native bundle-only selectorは別業務profileへ誤routingするため受入に使わず、当該表示を元の空ページへ戻す。自分の確認window閉鎖・既存window保持・lease解放と、後続公式billing未接続/既存account1件を確認する。billing form最終送信・支払・実生成・Netlify専用key設定・Factory enableは0。次のFactory条件は正しいPID/profile固定のUI経路、独立Cloud Billing/paid wallet、実原価と実生成の受入。全体の実行cursorと優先順 → 2026-10-24-ai-monk-research-distribution.md。
