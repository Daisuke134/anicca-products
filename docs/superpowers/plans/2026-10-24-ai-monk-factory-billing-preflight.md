# AI Monk Factory専用課金の無課金preflight

## 目的・範囲・完了条件
SaaS-1の専用Gemini課金について、既存本人認証の権限・課金口座の分離・必要入金額・Factory全体の予算の不足を具体化する。最新main 00870b1c531f30bcd97d69c8eab148dd5d694e11由来の専用branch docs/ai-monk-billing-preflight-20261024を既存専用worktreeで使う。今回のspend-capはUSD0。

primaryは本plan・SSOTのRAM内照合・gcloud公式read-only・新規receipt・master現在pointerを所有する。既存read-only agentはGoogle公式資料の取得だけを所有し、同じrepoやcredentialを編集しない。日次Grokのwallet/key/投稿、既存顧客資源、他者branchを変更しない。

受入はSSOTとactive本人の一致、Factory projectの公式billing状態、見えるbilling accountのopen状態と権限、現行Google公式のpaid/prepay/budget契約を根拠付きで記録し、未確定の予算・支払元・権限を成功へ置換しないこと。新規account/key/billingの作成・紐付け、入金/購入、支払方法、生成、Netlify設定、Factory enable、Stripe顧客課金、審査申請の再送は0。

## 実行順
- [ ] SPEC: 本planをcommit/pushしremote objectを確認する。
- [ ] LIVE: SSOT全体をRAMで確認し、exact service googleのうちFactory本人に一致する1行と既存gcloud active identityを照合する。既存認証のままaccounts list、対象project billing、権限を対象限定の公式GETで読む。共有account名/ID・email・token・他projectは出力しない。必要なら現在権限に対するtestIamPermissionsだけをPOSTし、mutationとは区別する。失敗は境界を記録し、同じ認証や課金操作を再送しない。
- [ ] DOCS: paid tier/Prepay最低入金・新billing account作成権限・budget hard cap性を一次資料で確認する。既存trial4.25/paid70の予約額をbootstrap spend-capへ流用しない。
- [ ] RECORD: private結果と参照hashを新receiptへ集約し、正本の未完条件と次の最小操作を更新する。JSON/diffの最小確認、commit/push/remote一致、PR/main統合と今回blob一致で閉じる。

## 適用判断
using-superpowers→executing-plans、using-git-worktrees、ponytail fullを使い、docs/read-onlyに新TDDや固定全suite・workspace・review gateを追加しない。skillの停止/モデル強制はDaisのNo-human-loop/UIモデル継承を優先する。google-loginのKeychain指示はDaisのprivate SSOT/Apple credential store禁止を優先する。secret・case番号・支払方法・本人emailをrepo/log/chatへコピーしない。既存authのread-only失敗を新account作成や共有wallet利用の根拠にしない。

## 現在cursor
SPEC。全体の優先順と成果条件は2026-10-24-ai-monk-research-distribution.mdを正本とし、PL-1のOpenAI既存申立て/Muse既存提出は外部回答待ちとして別に追跡する。
