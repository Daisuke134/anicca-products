# 既存X告知の欠落リンクを補完する

**目的・範囲・完了条件:** Postiz hostのlink stripで送客URLが欠落した既存英語書籍・Database英語・Database日本語の3告知を、各exact parentへのnative返信1件ずつで補完する。日本語書籍の補完済み返信2113556550073921584は再送しない。元Postiz receipt/投稿を保持し、元UTMと目的ページのexpanded URL・native返信ID/親ID・同accountの別permalink/body readbackで完了する。送信ボタンや空composerだけを証拠にしない。

**実行順:** 公開scopeの本番確認→具体copy/親/account/hashのfresh read-only照合→既存登録x:anicca leaseの正規取得→native専用O_EXCL/fsync済みfence→book-en→database-en→database-jaを各1件→lease release→receipt/specをcommit/push/CI/mainへ記録する。Postiz経由ではlinkを回復できないため再投稿・draft/promote・bare domain回避はしない。

**具体copy:** docs/evidence/ai-monk-existing-x-link-recovery-{book-en,database-en,database-ja}-20261023.json。book-en親2113304729166213433、database-en親2113286528508285146、database-ja親2113286777054360059。本人は@selawmqt/integration cmt4l2jld031tqp0y8qtyo983。元告知と同じ目的URL/UTMを各1回だけ使う。原告知の公開は取得済み本文の事実、売上/retweet保証ではない。

**実行境界:** 他者の使用中lease/profileを触らない。登録profile ~/.cloak/profiles/x-repost-dailyとlive signed-in handleを照合し、未知の新accountや別identityを使わない。native operatorはこの3targetだけを許可し、copy hash/270文字上限/親本文をlive照合する。各targetの専用fenceは送信前にexclusive create/flush/fsyncし、存在すればdispatchを無効化する。不確実な応答やURL不一致はretryable=false/readback-onlyとし、再送しない。UIが実際に発行したCreateTweet応答だけを観測し、直接POSTしない。receiptを受けた後も正確な返信permalinkを別に開いて本人本文と目的URLを確認する。

**検証と残件:** copyは公開済み商品/無料databaseへの案内だけを述べ、競合の収益・効能・販売成功を流用しない。新規商品や比較試験ではなく既存依頼のリンク欠落修復である。クリック/流入/campaign注文/利益は未測定を保持する。新刊paid Checkoutの直近公式値は英日各0件で、送客補完を売上と扱わない。Factory旧費用guard/生成/投稿owner/既存fenceは変更しない。

- [x] 3件の具体copy/元UTM/hash/親を永続specへ保存しpush。
- [x] fresh copy/operator read-only照合、source/mainの公開scopeを確認。
- [ ] native3返信をそれぞれ1回だけ実行し公式native receipt/expanded URL/permalinkを照合。
- [ ] 自分のlease releaseを確認し、元receiptを保持して結果を記録/統合。

**実行operator:** /private/tmp/ai_monk_existing_x_link_reply_20261023.py、SHA256 3c41ed77a5b05f2cc4055a6dced7bd9a50e0eab8285630ae7c9e72b5cf8db4b8。3targetの親ID/本文fragment/copy SHA/元URLを固定し、正規guard acquire完了時の自身lease PID34833/UUID/portを実行前に照合する。lease再取得でPIDが変わった場合は旧operatorをそのまま使わず再照合する。source copyとoperatorはfresh read-only受入前で未送信。

**lease照合の補正:** guardのnative契約は短命shellのPID死亡後も1800秒のfresh timestampで排他を保持するため、初期検証者の「死亡だけで無効」という指摘は撤回する。自分が取得した旧leaseを正規releaseし、既存AI_BROWSER_HOLDER_PID引数で同UIDの生存Codex process34833へ正規acquireし直す。operatorは同PIDとstart時刻を追加照合し、1800秒をまたぐ作業でも他者へ混在させない。global guard/registry/profile設定は変更せず、送信0を維持する。

**送信前の独立受入:** fresh context検証者の最終findings0/Blocking0。3copy SHA・元UTM・親fragment・本人・公開商品/無料原稿の事実、保守文字数73/59/57、最終operator SHA3c41ed77a5b05f2cc4055a6dced7bd9a50e0eab8285630ae7c9e72b5cf8db4b8が独立一致する。live lease PID34833/同UID/start/port/UUIDも実測する。本人UIと投稿結果は実行時に照合する。新しいnative fenceは3件ともまだ存在せず送信0。
