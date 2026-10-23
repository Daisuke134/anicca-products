# AI Monk Plugin 提出前の試験と実ログデモ

## 目的・範囲・完了条件

無料read-only Pluginの正式提出に必要な残りの試験と、reviewerが閲覧できる操作デモを準備する。公開済みv0.1.2のpositive3/4/5の実行は維持し、未実施positive1/2・negative1/2/3だけを有限の隔離Codexで追加する。五つのpositiveと三つのnegative、実tool結果と出典/unknownの扱い、モデル/provider強制0、共有設定/credential複製0を確認する。既存のnative実行harnessを再利用し、新supervisor/loopや恒久test frameworkを作らない。

公式根拠は https://developers.openai.com/plugins/deploy/submission のreview informationである。実試験とデモの準備を、valid default payment method/developer identity、正式upload/submit、審査や掲載の受入へ換算しない。

## 契約

- promptは既存v0.1.2 manifestの原文をそのまま用い、tool名を強制しない。positive1はcoverage、positive2はsearch/get、negativeは生成投稿/私的認証情報/収益保証を実行しない。未知や返答の不一致は保持し、成功へ書き換えない。
- private CODEX_HOME、read-only/ephemeral、現在のユーザー選択を継承し、model/provider引数を追加しない。通常auth参照だけを使い、値のコピーと共有config変更0。実行前に既存skillとSSOT/owner手順を確認する。参照は終了後除去する。未使用transportの起動エラーが再現したら従来どおり実呼び出しと分離し、認証修復をしない。
- デモは実際のprompt、完了tool名、実結果/日本語最終回答から作る。既存3caseのv0.4.6と追加caseの公開snapshotを各caseで明示し、同時実行した単一snapshotのsuiteと偽らない。最小の既存FFmpeg等で実行ログを動画表示する場合は、画面録画ではなく実行ログの再生と明記する。架空UI・架空tool応答・生成monk画像・合成voiceを追加しない。
- raw credential/auth、メール、private path、thread/session ID等を公開素材に含めない。公開する本文は実際の公開調査結果とprompt/日本語説明に限定し、元JSONL/hashとの対応をprivate manifestで記録する。
- 動画をprivateで作り、全caseの内容をprimaryが実ログと照合してから、固定mainを指す専用demo Release ai-monk-plugin-walkthrough-v1 のassetとして公開する。既存v0.1.2の4files/ZIP/Releaseは変更しない。demoはPlugin ZIPと別tagで固定し、公開URLの実GET/hashを確認してからmanifestのdemo_recording_urlとversion/release_notes/READMEをv0.1.3へ更新する。正式提出の外部gateは保持する。
- Factory provider/Stripe/日次posting/browser/sharedstate、pluginの6toolsとHTTPendpointは変更しない。新規有料API・入金・購入・投稿0。

## 所有と順序

primaryが受入、review、Release/asset公開とmain統合を所有する。bounded workerはpackages/ai-monk-plugin/{plugin.json,README.md}、本spec、対応docs/evidenceの新receiptとPlugin v0.1.2計画の後続pointerを所有する。master planはprimaryのみ編集する。他者の編集を上書きしない。worktreeは既存 ai-monk-plugin-v012-20261024 を保護store削除0で再利用し、branch feat/ai-monk-plugin-review-v013-20261024 を最新mainから作る。

- [x] SPEC: 本specを先にcommit/pushし、remote objectを確認する。spec-first commit c246a82f6を使用する。
- [ ] CASES: 追加5caseの実行・結果/制約・元hashを保存する。
- [ ] DEMO: 実ログのみのprivate動画と対応manifestを作り、primaryが内容を照合する。
- [ ] PUBLIC: 独立review後に実動画assetを公開し、URL GET/hashを確認する。
- [ ] PACKAGE: 確認済みdemo URLを含むv0.1.3をsource acceptance/CI/review/mainへ統合し、固定mainのZIPを公開する。

現在cursor: CASES / DEMO。既存3positiveの証拠は docs/evidence/ai-monk-plugin-native-v012-20261024.json。正式ChatGPT提出/掲載、Muse審査、Factory実利用/収益は未完のままとする。
