# AI Monk Factory専用課金の無課金preflight

## 目的・範囲・完了条件
SaaS-1の専用Gemini課金について、既存本人認証の権限・課金口座の分離・必要入金額・Factory全体の予算の不足を具体化する。開始時main 00870b1c531f30bcd97d69c8eab148dd5d694e11由来の専用branch docs/ai-monk-billing-preflight-20261024を既存専用worktreeで使う。今回のspend-capはUSD0。

primaryは本plan・SSOTのRAM内照合・gcloud公式read-only・新規receipt・master現在pointerを所有する。既存read-only agentはGoogle公式資料の取得だけを所有し、同じrepoやcredentialを編集しない。日次Grokのwallet/key/投稿、既存顧客資源、他者branchを変更しない。

受入はSSOTとactive本人の一致、Factory projectの公式billing状態、見えるbilling accountのopen状態と権限、現行Google公式のpaid/prepay/budget契約を根拠付きで記録し、未確定の予算・支払元・権限を成功へ置換しないこと。新規account/key/billingの作成・紐付け、入金/購入、支払方法、生成、Netlify設定、Factory enable、Stripe顧客課金、審査申請の再送は0。

## 実行順
- [x] SPEC: 本planをcommit/pushしremote objectを確認する。
- [ ] LIVE: SSOT全体をRAMで確認し、exact service googleのうちFactory本人に一致する1行と既存gcloud active identityを照合する。既存認証のままaccounts list、対象project billing、権限を対象限定の公式GETで読む。共有account名/ID・email・token・他projectは出力しない。必要なら現在権限に対するtestIamPermissionsだけをPOSTし、mutationとは区別する。権限/支払profileがAPIから未確認なら、登録済み専用identityをleaseし、正しいPID/window/siteをfresh照合したnative UIで作成入口と保存済支払profileの選択可否だけを読む。課金作成/Prepay移行/購入の確定送信は0。専用profileに別のSSOT所有Google identityがある場合はlogoutせず、通常アカウント選択/通常ログインでFactory本人へ合わせる。既存profileや認証のコピー、新account作成、回復/resetは行わない。本人不一致の規約同意は0。CDP保護hook拒否の再試行や変更はしない。失敗は境界を記録し、同じ認証や課金操作を再送しない。
- [x] DOCS: paid tier/Prepay最低入金・新billing account作成権限・budget hard cap性を一次資料で確認する。既存trial4.25/paid70の予約額をbootstrap spend-capへ流用しない。
- [x] RECORD-SOURCE: private結果と16参照のbytes/SHAを新receiptへ集約し、JSON/diffと未完条件を確認する。証拠 → ../../evidence/ai-monk-factory-billing-preflight-20261024.json。branch受入はcommit/push/remote一致、PR/main統合と今回3blob一致で閉じ、認証や課金を完了扱いしない。

## 適用判断
using-superpowers→executing-plans、using-git-worktrees、ponytail fullを使い、docs/read-onlyに新TDDや固定全suite・workspace・review gateを追加しない。skillの停止/モデル強制はDaisのNo-human-loop/UIモデル継承を優先する。google-loginのKeychain指示はDaisのprivate SSOT/Apple credential store禁止を優先する。secret・case番号・支払方法・本人emailをrepo/log/chatへコピーしない。既存authのread-only失敗を新account作成や共有wallet利用の根拠にしない。

## 現在cursor
LIVEの公式APIは本人一致、Factory billingEnabled=false/未接続、既存口座1/open1・本人Billing Admin・関連4projectを確認する。既存口座のadmin権限を新口座作成/payments profile権限へ拡張しない。正しいPID/profileのGoogle sessionはFactory本人と不一致、別SSOT所有identityに一致したため、規約/課金操作0のまま通常アカウント選択を修正する。

公式accounts.google.comをnative screenshotで確認し、SSOT本人email1回・password1回から通常ログインを進める。利用不可のnative passkey画面を1回閉じてpasswordを選び、次の2段階認証でGoogle Promptを1回選ぶ。本人iPhoneのGmail確認待ちで、認証完了・本人Consoleの課金作成権限・payments profile利用可否は未受入。再送/回復/reset/規約同意/課金resource変更0。本人端末の操作は非同期で要求し、未回答を完了へ置換しない。

Factory全体のbootstrap capは既存SSOT/specに無い。別AgentCore workstreamのUSD100未満承認は流用しない。公表最低額の小計は約USD60（Upload-Post月額50、HeyGen最低入金5、Gemini最低Prepay5）だが、税/為替・対象tier/地域の最終Checkout額・全運転費・支出承認を示さない。必要な金額情報を非同期で質問する。金額回答前の支出は0。

Google公式4資料では、Tier/Prepay残高はAPI keyでなくCloud Billing accountに帰属する。別Cloud Billing accountで既存payments profileを選べるがSign-up and purchase権限は別に必要。Org所属ならbilling.accounts.createも必要。Gemini公表Prepay最低USD5、最終UIの地域/tier条件は別。既存PostpayからPrepayへの移行は入金前でもaccount状態を変え得るため、共有口座では進めない。通常budgetは通知用だが、現行spend-cap budgetは単一project/単一eligible serviceのGeminiにも対応する。Project cap・spend-cap budget・Prepayにも遅延/進行中request/負残高があり、invoiceの厳密hard ceilingとは扱わない。根拠は新receiptの公式URLと保存参照を正本にする。

次は同じGoogle Promptの結果と初期予算の回答を受け取り、本人Consoleの独立口座/支払profile/地域別必要額を確認する。課金作成/紐付け/購入/生成の確定はこの無課金unitの対象外で、必要額と分離条件を具体化した後続契約に分ける。全体の優先順と成果条件は2026-10-24-ai-monk-research-distribution.mdを正本とし、PL-1のOpenAI既存申立ては正式却下、Muse既存提出は残2件審査中として別に追跡する → ../../evidence/ai-monk-marketplace-followup-20261024.json。

## 既存の信頼済みGoogle sessionからの確認

旧順は専用provision profileの本人iPhone/Gmail Prompt結果待ち、新順はその待機を保持しつつ登録済みinteractive:daisの既存Google sessionからConsoleを確認する。理由は、同じ認証通知を再送せず、既存本人sessionだけで課金元の分離・payments profile利用可否を具体化できる可能性があるため。現在cursorはこのread-only確認。運転予算への未回答とUSD0 capは保持し、支出承認へ読み替えない。

primaryはSSOT全体とregistryのowner/profile/leaseを確認し、正しいPIDを照合してから通常のnative UIでroot所有の新windowを1つ作る。既存の顧客windowをnavigateしない。Consoleの本人をSSOTとRAM照合し、既にsigned-inの正しい本人を選択できる場合だけ進める。新login/password/Google Prompt送信、recovery/reset、logout、profile/authのコピーは0。本人が確認できた場合はbilling作成の入口・既存payments profileの選択可否・地域別の必要額を読み取るが、作成・規約同意・紐付け・Prepay移行・購入の確定は行わない。

- [x] TRUSTED-LIVE: 既存Google sessionの本人、Console入口と見える権限/支払profile/必要額を確認する。取得できない場合は具体的な画面と不足条件を残す。
- [x] TRUSTED-RECORD: 自分のwindowとleaseを閉じ、秘密値を除いた新receiptと本planをcommit/push/PR/mainへ保存する。旧記録を上書きせず、認証/課金完了を推測しない。


### 信頼済みsessionの確認結果

既存のアカウント選択にFactory本人がログイン済みで表示され、1回選択する。続く本人ConsoleのアカウントcontrolとSSOTのemailをRAM照合し、一致を確認する。専用provision profileのGoogle Prompt完了を意味しないが、この経路では新login・password・通知再送を必要条件にしない。

本人Consoleの「請求先アカウントの管理」と「アカウントを作成」の表示をwindow screenshot/native OCRで確認する。中央内容がAX treeから欠落し、入口click後の作成formへの遷移は確認できない。新口座作成権限、既存payments profileの選択可否、地域別の最終必要額は未確認のまま保持する。表示やclick受付を作成成功へ置換しない。途中で既存native daemonの終了とCLI fallbackのAccessibility拒否を観測し、署名済みappの公開LaunchServices serve経路から復帰する。TCC・browser・hook・認証profileは変更しない。

自分のwindowだけを閉じ、直後のinventoryではまだ残るが、後続のfresh inventoryで消失と既存named 6window保持を確認する。guard holder空と衝突なしを確認する。支出、課金resource作成/紐付け、規約同意、Prepay移行、生成はすべて0。private証拠は700/600を保つ。今回の観測unitの結果 → ../../evidence/ai-monk-factory-trusted-billing-session-20261024.json。

現在cursorは、確認済みの既存Factory本人sessionから対象を確実に限定できるnative経路で作成formを読み、権限・payments profile・地域額を具体化すること。初期予算の未回答とUSD0 capを維持し、別profileのGoogle Promptは再送しない。正式Plugin掲載はOpenAI既存appealの正式却下とMuse残2項目の審査を保持し、根拠のない設定変更・重複提出を行わない。


## 作成formの対象window限定preflight

目的は、既存Factory本人sessionの課金作成formへ入り、権限・既存payments profile・地域別必要額を読み取ること。完了はその実画面または取得できない具体的な境界の記録、root所有windowの閉鎖、既存window保持、lease解放とmain保存で判定する。spend-cap USD0と予算未回答を保持し、作成・規約同意・紐付け・Prepay移行・購入・生成の確定は0。新login・password・Google Prompt再送・auth/profileコピーも0。

前の観測は中央内容のAX欠落と、background pixel click後の遷移未確認。仮説は対象windowへの入力dispatchの不足である。登録済みprofile/PIDとleaseをfresh確認し、root所有new windowだけを作る。CuaDriverの公開APIにwindow raise操作が無いため、必要ならmacOS標準AXの既存権限の範囲で、そのPID内のexact titleに一致するroot所有window1つだけをAXRaiseし、以後の入力はCuaDriverで行う。既存window・他profileをactivate/navigateせず、TCC/Automation権限の変更・browser/daemon/hookのpatchや再起動はしない。権限拒否や対象の不一致なら同操作を再送せず、具体的な境界を残して独立したDB-1調査へ進む。

- [ ] FORM-LIVE: 対象windowの同一性を確認し、作成form・見える権限/支払profile/必要額を読む。入力受付とprovider反映を区別する。
- [ ] FORM-RECORD: 秘密値を除いた新receiptとcurrent cursorを保存し、最小の参照/hash/権限確認後にcommit/push/PR/mainへ統合する。
