# AI Monk正式掲載の復旧・審査対応

## 目的・範囲・完了条件
Daisの「Go fix」を受け、Codex公開済みとは別に、既存OpenAI専用accountの正規復旧と正式ChatGPT掲載、既存Muse submissionの審査・正式掲載を進める。既存の申立て・提出を正本とし、新しい通知・公式状態・具体的な不備から次の操作を決める。完了条件は復旧と正式提出・掲載の公式readbackであり、docs更新・公開MCPの成功だけでは完了にしない。

## 順序・境界
旧cursorはDatabase公開後の書籍X配信。新cursorはPL-1の公式通知と既存Muse提出の最新状態確認。理由はDaisが正式掲載の未完修正を明示したため。書籍配信の作成済みbranchは保持し、投稿を重複させない。Database→CLI/plugin→Factoryの全体成果は保持する。

既存OpenAI receiptはappeal却下・無効化維持・同案件の追加appealを検討しない旨を記録する。公式の再開案内や新しい要求がある場合だけ対応し、停止を迂回する新account・別account移管・API retry・同案件の重複appealを行わない。未開示の無効化理由を推定しない。Museは既存ID31824081-7a00-4287-a572-bdee976562c5の3/3受付を保持し、審査待ちだけを理由に再提出や推測の設定変更をしない。

認証はlocal credentials.json全体をRAMで確認し、exact serviceと本人一致を使う。secret値をrepo/log/chatへ複製しない。接続済みGmailを優先し、専用mailboxを読めない場合は既存の正規read-only経路だけを使う。browserは登録済みinteractive:daisのowner/live lease/sessionを確認し、使用中の他者leaseに触れない。日次Grok所有loop、支払、課金、Factory provider設定は対象外。

## 実行と受入
- [x] OpenAI公式復旧・掲載要件を最新一次資料と既存caseに照合する。
- [x] 既存mailboxの新通知を確認し、転送先と直接mailboxの観測範囲を分ける。
- [ ] Muse既存submissionを公式UIで再読し、変更要求・接続エラー・審査結果を確認する。
- [x] 観測した自所有不備があれば最小修正・関連検証・反映を行う。無ければ変更0を記録する。公開MCPの6実SDK呼出は成功し、設定変更0。
- [ ] 結果と不足条件をsanitized receiptへ保存し、spec/正本cursorをcommit/push・PR/mainへ反映する。

## 現在cursor
OpenAIは既存同一message ID・同case・正規送信元とDKIM/SPF/DMARC pass付きの最終却下を再取得する。復旧通知は取得できず、同案件の再申立て・別accountによる停止回避は行わない。公式の再開・復旧が必要。Museの新通知は観測した転送先に無いが、direct mailboxの全範囲を確認したとは扱わない。

Museの今回の公式UI再読は未達。登録済みprofileの新規owned windowへURLを入力してもNew Tabのままで、実ページ遷移を確認できない。別native bindingも本人session一致を確認できず操作0。過去の3/3受付・Business Approved・残2件In reviewは履歴として保持し、最新状態へ置換しない。root作成windowだけ閉じ、既存named window保持・lease解放を確認する。

公開MCP v0.4.13を実SDKから6tool呼出し、73profile/196source/snapshot一致を確認する。これはMuse hostの実scanや審査承認ではない。具体的な設定不備は観測できないため、推測のCORS変更や再提出は0。結果 → ../../evidence/ai-monk-marketplace-resolution-20261024.json。PL-1はOpenAI公式再開とMuse既存提出の正規readback・具体的要求への対応が残る。先行証拠 → ../../evidence/ai-monk-marketplace-followup-20261024.json。正式掲載の2条件は未完のまま保持し、独立したDatabase/CLI/plugin配布を元のgoalで継続する。
