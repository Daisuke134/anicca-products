# 26 — gig ループ AS-IS / TO-BE / 実行計画（compact-proof 正本・忘れ厳禁）

**これは gig ループを「自己検証・自己修復・自己改善する best-practice browser-use loop」に直すための唯一の durable 計画**。会話は compact で揮発する→ここに全部焼く。SSOT(00) の L1 はここを指す。検証BPの詳細は [25-browser-use-verify-selfimprove-bp.md](25-browser-use-verify-selfimprove-bp.md)。

Dais 確定方針(2026-07-11):
- **先に B0/B1/B2 の capability を loop に持たせる**（今は「やれと指示すらされていない」＝当然やらない。特に **B0 出品は harness に存在しない**）→ その上に検証/自己修復を載せる。
- 移動/改名しない・その場で直す。一つずつ・各段階で **builderと別contextのreality-verifierが結果画面をbrowserで読んで**確認してから次へ。通常運転は人間の承認・下書き送信待ちをterminal stateにしない。

---

## §1 AS-IS（実DOM確定・2026-07-11 :9222 で実観測。★私の初期ファイル推論「出品ゼロ」は誤りだった、browserが真実★）

アカウント: coconala、Google OAuth ログイン済（cookie `_coconala_session` ~2028、`CakeCookie[login_history]=Google`）。表示名 **「Kosuke AIエンジニア」**（= mtdc はハンドル/ID。Dais 確認済で正当）。KYC 済(Dais 確認)。

| 項目 | 実測 |
|---|---|
| loop 稼働 | ✅ ALIVE・今日も pass 完走。返信/応募/学習は活発（applied.jsonl 275行、lessons 100+pass） |
| **出品(サービス)** | **5件存在**: 公開中3=「業務自動化スクリプト Python/Node.js」¥10,000 /「SNSをAIで自動化しますます OSS自律AI」¥10,000 /「AI×AniccaがTikTok縦動画作りますます」¥3,000、**下書き放置2件(タイトル未設定)**。★ typo「しますます/作りますます」・下書き塩漬け・最適化ゼロ ★ |
| **取引中の注文** | **1件**: 買い手 jibieaian「IFU Double Face｜クラファン認知拡大 SNS運用代行」**¥40,000**・納品予定 2026/08/14・状態「取引中」（応募経由。**本物の金が1本動いている、未検収=未入金**） |
| earnings.jsonl | 空 = 確定入金 ¥0（¥40kは納品→検収待ち） |
| **harness の欠落** | ❌ **B0 出品ステップが STARTUP に無い**（cdp_shuppin.py も無い）＝loop は出品を作りっぱなしで**管理・改善・拡張していない**。応募(2%床)にだけ労力を注ぐ |
| **検証(auditor.sh)** | ❌ **report-skeptical でない** — core が自分で書いた applied/earnings.jsonl を信じるだけ。実の 出品管理/取引管理/売上 画面を読まない＝嘘・空回りを見抜けない |

**一言**: 「店を3つ開けたのに放置し、割の悪い出稼ぎ(応募)に通い続ける。出稼ぎ先で¥40kを1本掴んで今納品中。成果は自己採点。」

### 発見した正しい mypage URL（hard-won・実装で使う。ヘッダは `provider-header` の入れ子 shadow-DOM で querySelector 不可、再帰 shadowRoot 探索が必要）
- 出品サービス管理: `coconala.com/mypage/services_lists`（title「出品サービス管理」）
- 出品する: `coconala.com/services/add`
- 取引中(出品側): `coconala.com/mypage/received_orders/open`（title「取引中｜取引管理(出品)」）
- 購入前DM/問い合わせ一覧: `coconala.com/message`。`/mypage/messages` と `/mypage/talks` は 404。既存修正 `895fcfed` の実測を正とする。
- 売上/取引通知: `/mypage/activities/transaction`、`/mypage/dashboard_provider`
- 応募管理: `/mypage/job_matching/applied/offers`（単発/継続/スカウトのタブ）
- ※ `/mypage/services` `/mypage/identifications` `/mypage/received_orders` 等は 404。上記が正。

### B1 未返信回帰の現状

- live collector は `https://coconala.com/mypage/messages` を開き、実画面で「ご指定のページが見つかりませんでした」を受けている。それにもかかわらず `inquiries: 0` を success として記録するため、購入前DMを全件取りこぼす。
- このURLは旧repoで `/message` へ修正済みだが、`profitable-claude` への移設時に回帰する。既存解を再利用し、URLを再発見し直さない。
- 正しい `/message` の各カードは `/mypage/direct_message/<room_id>` へリンクする。`/talkrooms/` selectorでは購入前DMを拾えない。
- 対象threadは `opened=true / unreadCount=0` でもbuyerが最終発言者だった。未読だけを見る設計では、既読にした未返信を永久に失う。
- hourly full pass 内のB1だけでは即応にならない。返信laneを重い出品・応募・納品laneから分離し、軽量検知は5分、通常返信は検知から10分、絶対上限30分とする。
- 404、ログイン画面、bot block、空DOMは `queue_empty` ではなく `collector_unhealthy`。空キュー成功には、正しい受信箱title/URLと取得件数のground-truthが必要。
- 今回の `earth0809.com` threadはmanual rescueで具体返信を送信し、同じthreadの再読でseller最終送信と送信時刻 `08:44:21` を確認する。これは現行harnessの合格を意味せず、live E2E fixtureとして使う。

---

## §2 TO-BE（あるべき自走ループ）

### §2.1 runtime / model routing（正本）

```text
┌──────────────────────────────────────────────────────────────────────┐
│ SCHEDULER / OBSERVER（LLMなし）                                      │
│ event通知=即時 / fallback detector=5分 / full pass=1時間              │
│ URL・page identity・last_sender・order state・deadline・idempotency   │
└───────────────────────────────┬──────────────────────────────────────┘
                                │ actionable eventだけ
                                v
┌──────────────────────────────────────────────────────────────────────┐
│ DURABLE QUEUE（LLMなし）                                             │
│ P0 paid/new order > P1 pre-purchase DM > delivery > B0 > B2          │
│ SQLite outbox / thread coordination / lease / fencing / retry clock  │
└───────────────────────────────┬──────────────────────────────────────┘
                                v
┌──────────────────────────── MODEL ROUTER ─────────────────────────────┐
│ default executor: Terra medium                                       │
│ reply/strategy judgment: Luna high                                   │
│ learn/reflection/summary: Luna medium                                 │
│ unknown incident: Luna xhigh -> Terra high                           │
│ Sol: scheduled 0、下位model 2回失敗か高額/重大incidentのみ、最大2回/日 │
│ GPT-onlyを先にE2E必須。Claude-onlyは同一contractの別adapterとして検証 │
└───────────────────────────────┬──────────────────────────────────────┘
                                v
┌──────────────────────────────────────────────────────────────────────┐
│ ALLOWLISTED EXECUTOR                                                  │
│ reply / listing / proposal / artifact / delivery / follow-up         │
│ modelは直接stateを確定せず、executorだけがside effectを実行           │
└───────────────────────────────┬──────────────────────────────────────┘
                                v
┌──────────────────────────────────────────────────────────────────────┐
│ GROUND-TRUTH VERIFIER（まず決定論、必要時fresh Luna high）            │
│ outgoing hash/time/thread / listing public URL / order / paid amount │
└─────────────────┬────────────────────────────────┬───────────────────┘
                  │ PASS                           │ FAIL / UNKNOWN
                  v                                v
       ledger確定・次eventへ             reconcile -> self-fix -> canary
                                                    │
                                           PASSまでqueueを消さない
```

**無人運転契約**:

1. live connectorへ登録できるのは公式APIまたは書面許可済みUI automationだけ。さらに、platform idempotency key、またはmanifestで上限が保証されたconsistency window後に権威的なside-effect auditで未実行を証明できることを必須にする。規約未確認・曖昧送信を安全にreconcileできないconnectorを `draft_only` でごまかさず、そもそもliveにしない。manifestは `terms_url / effective_version / allowed_scope / prohibited_scope / permission_evidence_id / rate_limit / reconciliation_mode / max_consistency_window / revoked_at` を持ち、許可失効時はkill switchで新規claimを即時停止する。
2. live connector上の合法・実行可能なeventは `sent_and_verified / delivered_and_verified / paid_and_verified` までactiveのまま保持する。`draft_only / rejected / manual_review / failed_terminal` をterminal stateにしない。
3. model refusal・quota・timeoutは別GPT candidateへ自動routeする。Claudeが全停止しても `MODEL_FAMILY=gpt` だけで検知から入金確認まで完走する。
4. platform outage・auth lossは `retry_wait` で継続し、指数backoff（上限60分）で自動復旧する。人間待ちを成功扱いせず、復旧までSLA breachを記録し続ける。
5. 違法・scam・物理的に不可能な依頼はqueue投入前のdeterministic eligibility gateで除外する。これはmodelによる気分的拒否ではない。

**provider contract**: `AgentTask{objective,verified_facts,allowed_actions,prohibited_actions,deadline,token_budget,result_schema}` と `AgentResult{decision,requested_actions,evidence_refs,uncertainty}` を全providerで共通化する。実行modeは `gpt-only / claude-only / auto / shadow`。family試験中は他familyへcross-fallbackしない。

**料金根拠**: OpenAI公式Standard API短contextの100万token単価は Luna `$1 input / $6 output`、Terra `$2.50 / $15`、Sol `$5 / $30`。同一token量ならTerraはLunaの2.5倍、SolはLunaの5倍。10k input + 2k outputの例は Luna約`$0.022`、Terra約`$0.055`、Sol約`$0.11`。`high/xhigh` は別単価ではないがreasoning tokenとlatencyが増え得るため、代表fixtureで品質差が出た時だけ上げる。source: https://developers.openai.com/api/docs/pricing / https://developers.openai.com/api/docs/guides/latest-model

### §2.2 revenue scale（MRRの正本）

```text
$0 ───────────── $10k net MRR
 Coconala productized service / recurring retainers
 22% feeなら必要GMVは約$12,821/月
              │
              v
$10k ───────── $100k MRR
 許可済みmarketplace adapters + own inbound
 共通delivery engine / vertical playbooks / partner capacity
              │
              v
$100k ──────── $1M MRR
 Productized Agency OS / direct CRM & checkout / enterprise / white-label
 marketplaceはlead sourceの1つへ
              │
              v
$1M ────────── $10M MRR
 multi-tenant SaaS / API / partner ecosystem / transaction marketplace
 例: 20k SMB×$300=$6M + 200 enterprise×$10k=$2M + $40M GMV×5%=$2M
```

Coconala販売手数料22%の公式根拠: https://coconala.com/pages/guide_sell 。`$10M MRR` はgig sellerの線形拡大ではなく、serviceで得たworkflowをown software/platformへ製品化するstep-functionとしてのみ扱う。

---

## §3 B0/B1/B2/納品 の capability 定義（= STARTUP prompt に「何をせよ」を明記する中身。薄いB0は存在するが管理・検証・拡張が未完成）
- **B0 出品(SHUPPIN・新規追加)**: 毎pass、`/mypage/services_lists` を読む→(a)下書き2件を完成させ公開 (b)typo・弱いタイトル/説明/価格/カバー画像を改善 (c)公開数が目標(例5-7)未満なら AIが勝てるcat(AI活用支援/資料作成PPT/SNS運用/記事/翻訳/文字起こし/LP/自動化)で `/services/add` から新規出品。成果物サンプルは公式 `pptx`/portfolio skill で作る。
- **B1 返信/納品**: `/message` の購入前DMと `/mypage/received_orders/open` の購入後トークルームを別キューとして sweep する。buyer が最終送信者なら即返信し、仮払い契約は成果物作成→納品、検収済は評価依頼へ進める。返信検知を hourly full pass に埋め込まない。
- **B2 応募(改善)**: `max_apply_per_pass` を上げ(5→10〜15)、scan を category直URL+keyword に拡張、AI禁止/実績必須/物理必須を除外、掲載直後(応募一桁)を優先。**質と量の両方を上げる**。
- 各ステップで **cdp_snapshot.py `<pass_id> <seq> <label>`** を呼び trajectory を残す。

### §3.1 B1 即応SLA（返信速度の正本）

#### 優先順位と時間契約

| priority | queue | 検知目標 | 実質返信目標 | breach |
|---:|---|---:|---:|---:|
| P0 | 新規注文（buyer発言0件を含む） | `order_created_at` から5分以内 | 検知から10分以内 | 注文作成から30分 |
| P0 | 購入後の修正依頼・進捗確認 | `buyer_sent_at` から5分以内 | 検知から10分以内 | buyer送信から30分 |
| P1 | 新規購入前DM・問い合わせ | buyer送信から5分以内 | 検知から10分以内 | buyer送信から30分 |

時刻はplatform表示を取得してISO 8601へ変換し、内部ではUTC、報告ではJSTを使う。SLA起点 `origin_at` は、新規注文なら `order_created_at`、それ以外は `buyer_sent_at` とする。30分pollでは最悪30分待ち、hourly pollでは最悪60分待つため採用しない。5分ごとの処理はDOM/APIを読む軽量detectorだけとし、未返信がある時だけ最大2workerを起動する。P0を先に、同一priority内は `origin_at` が古い順に処理する。応募follow-up、出品、応募、学習はB1 SLA外としてhourly full passに残す。

#### 検知契約

1. 購入前DMは `https://coconala.com/message`、購入後取引は `https://coconala.com/mypage/received_orders/open` から取得する。pagination/infinite scrollを既知checkpointまで走査し、first viewportだけで終了しない。
2. current URL、page title、受信箱container markerを検証する。404、login redirect、error page、container欠落は `collector_unhealthy`。正しいpage identityとcontainerを確認した上でmessage cardが0件なら `queue_empty` とする。
3. 新規注文はbuyer発言の有無にかかわらず `order_created_at / order_id / thread_id / thread_url / seller_initial_contact_at / initial_contact_required` を取得する。`seller_initial_contact_at` が無い新規注文は `initial_contact_required=true` とし、buyer発言0件でもP0 workerを起動する。購入後buyer発言と購入前DMでは `buyer_sent_at / message_id / last_sender / reply_required` を取得する。共通で `event_type / origin_at / observed_at` を永続化する。`opened/unreadCount` は補助情報であり、既読を返信済みと扱わない。顧客の生メッセージ本文・メール・cookieは保存しない。
4. event idempotency key は新規注文初回連絡なら `platform + order_id + initial_seller_contact`、message IDがあるbuyer発言なら `platform + thread_id + message_id`。message IDがないbuyer発言だけ `platform + thread_id + buyer_sent_at + stable_ordinal + sha256_v1(normalized_body)` とする。`sha256_v1` はUnicode NFC、CRLF→LF、連続horizontal whitespaceの1space化、前後空白除去後のUTF-8 SHA-256。`stable_ordinal` は同一platform timestamp内のfull-thread DOM順を初回観測時にcheckpointへ固定し、再走時に再採番しない。timestampまたは安定順序を取得できなければ `collector_unhealthy` としてclaimしない。別event keyでも同一threadなら `platform + thread_id` をcoordination keyとし、DB unique constraintでactive outbox actionを最大1件にする。
5. outbox actionは `covered_event_keys[]` を持ち、`pending -> claimed -> send_intent -> click_started -> verifying -> replied` を主state machineにする。回復side stateは `retry_wait / reconcile_pending` のみで、いずれもterminalではなく主stateへ戻る。claimはSQLite transactionまたは原子的O_EXCL lockでthreadごとに1workerだけが所有し、単調増加する `fencing_token` を発行する。各immutable intent revisionは `active|superseded` を持ち、`send_intent` は `outgoing_hash / owner_id / fencing_token / content_revision` を送信clickより前にwrite-aheadでcommitする。
6. 新規注文初回連絡actionが `click_started` 前にあり、同threadのbuyer messageを検知した場合、別actionを作らない。同一transactionでbuyer event keyを `covered_event_keys` に追加し、buyer messageへ答える1返信へcontentを再生成して `content_revision` とfencing tokenを更新し、旧intent revisionと旧ownerを `superseded` にしてactionを新revisionの `claimed` へ戻す。この1返信のground-truthが取れた時点で `initial_contact_required` と `reply_required` の両方を充足する。senderは送信直前にthreadをfresh-readし、未取込buyer eventがあれば同じcoalesce transactionへ戻る。`click_started` 後に到着したbuyer eventだけは別の後続actionとして扱い、先行actionのground-truth確認後までclaimしない。
7. senderはclick直前のtransactionでthread coordination key・owner・lease・fencing token・content revision・`click_started_at IS NULL` を再検証して `click_started` をcommitする。claim期限切れだけでは別workerへ送信権を渡さない。期限切れ時はsupervisorが旧owner processと専用browser sessionの停止を確認してtokenを失効させる。`click_started` 前に停止確認できた場合だけ新tokenでpre-send処理を再開する。`click_started` 後またはclick実行有無が曖昧な場合は `reconcile_pending` へ入り、fresh verifierとbounded consistency windowで自動解決する。人間review待ちへ遷移しない。
8. lifecycleとして `detected_at / queued_at / started_at / send_intent_at / click_started_at / replied_at / covered_event_keys / content_revision / pre_send_attempt_count / send_click_count / reconcile_attempt_count / next_attempt_at / last_error / owner_id / claim_expires_at / fencing_token` を永続化する。ACK/seen化は送信後ground-truthが取れた後だけ行う。
9. collector heartbeatまたはsnapshotが10分以上古い、detector exitが非0、pending ageが15分を超える場合、返信laneだけを1回restartしfresh workerを起動する。次の再起動は5分backoff、3連続失敗でcritical。30分超過もcriticalとする。supervisor heartbeatやhourly full passの成否だけで健康判定しない。

#### 返信品質契約

返信は短く、次の5要素を含める。

1. 共有内容を受領したことを伝える。
2. 相手の依頼・質問へ直接答える。thread/order内の検証済み固有情報を1点使う。
3. Web/InstagramのURLがあり2分以内に安全に確認できる場合だけ、外部で実測した固有情報を加える。リンク欠落・block・調査遅延時は「確認した」と主張せず、thread内事実で返信して外部調査を後続taskへ回す。
4. こちらが次に行う具体的作業と最短の正直な予定を示す。
5. 作業開始に本当に必要な未確定事項があれば、質問は1つに絞る。不要なら質問せず着手を宣言する。

「受領しました」「本日連絡します」だけのackは実質返信に数えない。相手の質問・依頼へ具体的に答えるか、調査済みの初期診断と次アクションを示した時だけSLAを満たす。

#### 送信後ground-truth

- 返信成功はagentの自己申告やclick完了では判定しない。同じthreadを再読し、対象 `origin_at` 以後に送信本文の正規化hashとseller送信時刻が存在し、thread URLが一致した時だけ先行actionを `replied` とする。seller送信後にbuyer messageが無ければseller-lastも確認する。seller送信後にbuyer messageがあれば、先行actionはhash/timeで完了させ、そのbuyer messageを別eventとして同じtransactionでpendingへ登録する。現在のlast senderを先行actionの成否と混同しない。
- send action後にDOM再読が失敗する曖昧状態ではblind retryしないが、actionも停止させない。platform idempotency key対応connectorは同じkeyのまま再要求し、platform側でside effectを1件に畳む。authoritative-audit型connectorはmanifestの `max_consistency_window` が終わるまで `t+0/+10秒/+30秒/+2分/...` で照会し、その後に権威的auditが同じkey/hashの不在を返した場合だけ新revisionを1回送る。単なるDOM不在や任意の待機時間は未送信証明にしない。いずれの方式も無いconnectorはlive eligibility FAILであり、自動送信を開始しない。以後も同じreconcile cycleを最大60分backoffで継続し、`replied` までqueueから消さない。
- browser navigation・selector取得など、`click_started` 前と証明できる失敗は初回 `t+0`、第2回 `t+2分`、第3回 `t+5分` で試行する。3回失敗後はterminal failureにせず `retry_wait` へ移り、`5/10/20/40/60分` backoffで自動再実行する。各retry前に現owner・lease・fencing tokenをtransactionで再検証する。通常pathの `send_click_count` はactive revisionごとに最大1、reconcile再送は新revisionとして記録する。
- 永続evidenceは `thread_url / seller_sent_at / outgoing_hash / last_sender` のみにする。screenshotが必要な場合は顧客本文・氏名・添付をmaskしowner-only `0600`、保持7日後に削除する。cookie・tokenは常に保存禁止。

#### Acceptance matrix

| queue | case | expected |
|---|---|---|
| P1 `/message` | 正しいpage + 0 cards | `queue_empty`、worker起動0 |
| P1 `/message` | 404 / login redirect / container欠落 | `collector_unhealthy`、空キュー記録禁止 |
| P1 `/message` | buyer-last（既読・未読どちらも） | `reply_required=true`、5分以内検知 |
| P1 `/message` | seller-last | `reply_required=false`、送信0 |
| P0 `/mypage/received_orders/open` | 正しいpage + 0 orders | `queue_empty`、worker起動0 |
| P0 `/mypage/received_orders/open` | 404 / login redirect / container欠落 | `collector_unhealthy`、空キュー記録禁止 |
| P0 `/mypage/received_orders/open` | 新規注文・buyer発言0・seller初回連絡なし | `initial_contact_required=true`、5分以内検知、buyer発言0のまま10分以内送信、hash/time/thread一致で`replied` |
| P0 `/mypage/received_orders/open` | 新規注文・seller初回連絡済み | `initial_contact_required=false`、送信0 |
| P0 `/mypage/received_orders/open` | buyer-lastの初回連絡・修正依頼・進捗確認 | `reply_required=true`、5分以内検知、P1より先にclaim |
| P0 `/mypage/received_orders/open` | seller-last | `reply_required=false`、送信0 |
| P0同一thread | 初回連絡actionの`click_started`前にbuyer message到着 | active action 1、buyer replyへcoalesce、両event充足、総click 1 |
| P0同一thread | 初回連絡actionの`click_started`後にbuyer message到着 | 先行verifyまで後続claim 0。先行確認後、未返信buyer eventだけ後続action |
| P0同一thread | 初回送信後・verify前にbuyer message到着、DOM読取成功 | outgoing hash/timeで先行`replied`、buyer eventをpending登録、後続claim可能 |
| 同一thread coordination keyへ2worker同時起動 | claim成功1、active action 1、送信最大1 |
| claim期限切れで旧ownerが生存 | 旧process/session停止とfence失効まで新ownerの送信0 |
| `send_intent` commit直後にcrash | 停止確認後、新fenceでpre-send再開可能、送信最大1 |
| `click_started` commit直後またはsend後にcrash/DOM timeout | blind retry 0、`reconcile_pending`。同じplatform idempotency keyで再要求、またはmanifest上限後のauthoritative non-delivery証明時だけ新revision送信。最終`replied`、重複0、人間待ち0 |
| 送信前transient failure | `t+0/+2/+5分` 後も`retry_wait`で5〜60分backoffを継続、復旧後`replied`、terminal failure 0 |
| Luna/Terra refusal・quota・timeout | 同familyの次candidateへroute、draft保存で終了0、最終`replied` |
| Claude全停止 + `MODEL_FAMILY=gpt` | Claude process 0でP0/P1 detect→reply→verifyが完走 |
| pending 15分 / 30分 | fresh worker / critical |

決定論testはP0/P1それぞれの全caseについてexpected state、`covered_event_keys`、`pre_send_attempt_count`、`send_click_count`、fencing token、content revision、時刻差をassertする。全crash window（claim後、intent commit後、click_started commit後、click後、verify前）で旧owner停止・takeoverを競合実行し、通常pathはactive revisionごとのclick最大1、曖昧pathは `reconcile_pending` から必ず `replied` へ到達し、最終DOMに同一hashの重複がないことを固定clock/barrier testで検証する。さらにbuyer eventを初回連絡actionのclaim後・intent commit後・click_started後・send後verify前の各barrierで注入し、claim/intent後は両eventを1actionへcoalesceしてthread総click数1、click_started/send後はmatching outgoing hash/timeで先行actionを完了してbuyer eventを後続pendingにする。clockをfixtureで固定し、`origin_at -> detected_at <= 5分`、`detected_at -> replied_at <= 10分`、`origin_at -> replied_at <= 30分` を別々に検証する。live E2Eは専用controlled buyerからP1新規DMを1件送る。専用controlled order Aではbuyer発言0のままseller初回連絡を完了し、hash/time/threadと3 SLAを確認する。専用controlled order Bでは初回連絡actionが`send_intent`の間にbuyer messageを送ってcoalesceさせ、両eventを1返信・総click 1で充足させる。P0 no-message初回連絡・P0 coalesce race・P1 DM・Claude process 0のGPT-only run・自動reconcile runのいずれかが未実施ならB1 doneにしない。既にmanual返信済みの `earth0809` threadはP1 seller-last fixtureとして送信0・二重返信0を確認する。

根拠: ココナラ公式は「購入されたら後回しにせず、すぐに一言トークルームで連絡」「すぐ対応できない場合は一次返信」と案内する（https://mag.coconala.com/articles/knowhow-prevent-48hcancel）。48時間は自動キャンセル上限であり、営業SLAではない。

### §3.2 全side effect共通のeventual-action契約

返信以外にも同じdurable action envelopeを使う。`pending -> claimed -> intent_committed -> executing -> verifying -> verified` が主stateで、`retry_wait / reconcile_pending` だけを非terminal回復stateにする。executorはmodelの文章を直接実行せず、allowlist、policy manifest、expected current state、owner/lease/fencing token、immutable `action_revision` をtransaction内で再確認する。model refusal・quota・timeoutは同じtask familyの別candidateへrouteし、active actionをdraftやterminal failureへ落とさない。

| action | idempotency / coordination key | authoritative ground truth |
|---|---|---|
| listing create/update | `platform + listing_id_or_client_key + desired_content_hash` | 公開listing ID、public URL、公開state、content hash/version |
| proposal/application | `platform + job_id + seller_id + proposal_revision` | 応募履歴のapplication ID、job ID、本文hash、送信時刻 |
| reply/follow-up | `platform + thread_id + covered_event_keys + content_revision` | thread上のseller message ID/hash/time |
| artifact generation | `order_id + deliverable_slot + artifact_version` | atomic rename済みfile checksum、schema/preview test PASS |
| formal delivery/revision | `platform + order_id + delivery_slot + artifact_checksum` | delivery ID/state、添付checksum、seller送信時刻 |
| paid confirmation | `platform + order_id + payment_id`（read-only） | 売上/検収画面のpayment ID、amount、currency、paid state |

platform side effectを伴うactionは、同じidempotency keyで再要求可能、またはmanifest上限後のauthoritative auditで実行/未実行を二値判定できるconnectorだけでlive実行する。各actionのfailure-injection E2Eは、`intent_committed`直後、request/click直後、verify timeout、provider refusal/quota、auth loss、stale lease、2 worker競合を注入し、最終`verified`、platform side effect 1件、draft/manual-review/terminal-failure 0をassertする。artifactだけはatomic filesystem operationで同checksumへ収束させる。paid confirmationは観測専用で、入金を生成したと偽らない。

---

## §4 検証設計（BP=25準拠。★決め手は screenshot でなく結果画面の実データ読返し★）
3層: ①trajectory(action ログ=弱) ②screenshot(中) ③**ground-truth 読返し(強・事実)**=出品管理/取引管理/売上 の実DOMを別途読む。
- 実装: `browser-use/benchmark/judge.py`(実fetch済198L) を copy+tweak した **gig_judge**。`JudgementResult{reasoning, verdict:bool, failure_reason, impossible_task, reached_captcha}`。
- report-**skeptical**: core の summary は渡すが「実際に起きたか screenshot/結果画面で二重確認せよ」と明示（judge.py L148/L143/L101）。ground_truth 不一致なら verdict 必ず false(L76)。二値判定(rubric中間スコア禁止)。
- 金(¥)は **実 売上/検収 画面 or 入金でのみ PASS**（jsonl の自己申告では PASS しない）。
- 別 context の fresh spawn で報告非依存を担保（= auditor が reality-verifier を起動）。

---

## §5 自己修復設計（BP=25準拠）
- 全side effectをground truth invariantと比較し、`failure_fingerprint = platform + action + page_identity + invariant + normalized_error` を作る。同fingerprintのfixerは1つだけ起動する。
- 既知failureはLLMなしのdeterministic repair。未知failureは Luna xhighが診断し、Terra highが隔離worktreeでtest-first修正する。通常のself-fixにSol/Opusを使わない。
- Solは下位modelによる独立fixが2回失敗した、または高額契約・データ損失・重複決済級のincidentだけ。scheduled 0、最大2回/日、起動理由と推定token costをledgerへ残す。
- 修正は unit -> integration -> recorded replay -> controlled live -> fresh-context verifier -> 10%/50%/100% canary の順。どこかでFAILなら自動rollbackし、active eventは `retry_wait` のまま別revisionへ進む。
- verdict=false / ¥0 継続 → **Reflexion**を次passへ注入。成功trajectoryは、再現fixture・修正前FAIL・修正後PASS・fresh verifier PASSが揃った場合だけ **AWM** workflow/skillへ昇格する。
- auth wall、platform outage、quota、host OOM、規約未承認をcode bugと混同しない。provider circuit breakerとconnector healthで別routeへ切り替え、同じfixerを再spawnしない。
- 自動code changeは最大3件/日、同fingerprint最大3attempt。人間が日常承認しなくてもrollback可能な変更だけ自動promoteする。
- 連携ファイル: `~/.openclaw/state/.gig-core-selfheal-request.json`（STARTUP がpass冒頭で読む既存フック）、`~/anicca/skills/self/self-fix.sh`。

**babysit卒業gate（30日連続）**: P0/P1 missed-SLA=0、duplicate send=0、false-success=0、policy violation=0、通常日の人間介入=0、GPT-only E2E PASSを満たす。self-repair成功率は `fresh verifierまでPASSしたincident / fix attemptを開始したdistinct failure fingerprint` とし、自然incidentが不足する場合もcontrolled injectionで最低10件・5failure classを作り、8/10以上を必須にする。classはcollector URL、selector drift、provider refusal/quota、intent後crash、stale heartbeatを含む。rollback成功率は `rollback後にlast-known-goodのcontrolled E2EがPASS / rollbackを強制したdrill`、最低5件で5/5を必須とする。分母0はPASSにしない。Claude復旧後はClaude-only E2EもPASSする。

---

## §6 実行順序と done 条件（残TODOの正本）

| # | 段 | 残TODO | done（builderと別contextのverifierが確認） |
|---:|---|---|---|
| **0** | **live connector gate** | Coconalaを含む各platformで公式APIまたはUI automation書面許可、禁止action、rate limit、idempotency/audit能力をadapter manifestへ固定。未承認または曖昧side effectを安全にreconcileできないconnectorはlive登録しない | live connectorすべてが`api_auto|ui_auto_approved`、規約source/permission evidence、`platform_idempotency|authoritative_audit`、失効kill switchあり |
| **1** | **GPT-only provider contract** | 現Claude-first routeを廃止し、Terra medium default、Luna high judgment、Luna medium routine、Luna xhigh→Terra high incident、Sol最大2回/日のtask classesへ変更。共通AgentTask/Result schemaと`MODEL_FAMILY`を実装 | Claude executable/credential 0でdetector→reply→listing→proposal→delivery→verify→self-fix E2E PASS。scheduled Sol 0 |
| **2** | **deterministic kernel / health** | page identity、queue、outbox、lease/fence、retry、cost ledger、real `.last-pass`/snapshot healthを実装。supervisor heartbeatだけのfalse-greenを廃止 | 空キューでmodel call 0、stale passを10分以内にFAIL検知・自動restart、次pass成功を確認 |
| **3** | **B1 即応lane** | 正しい`/message`と`/mypage/received_orders/open`、即時通知+5分detector、thread coalesce、eventual-send reconcileを実装 | P1 DM、P0 no-message order、P0 race、crash/timeout、model refusalで全eventがsend+hash/time/thread verified。人間待ち/terminal failure 0 |
| **4** | **B0/B2/納品** | 下書き・typo・listing最適化、new-job scan、個別proposal、artifact作成、修正、formal delivery、検収を§3.2の共通action envelopeへ移す | 公開URL・応募履歴・talkroom・納品stateを実画面で確認。全actionのfailure-injection E2Eが最終verified、side effect 1件、draft/manual/terminal 0 |
| **5** | **reality verifier** | 毎side effectの決定論verify、異常時fresh Luna high、日次sample review、funnel reconciliationを実装 | 実claim PASS / 偽claim FAIL / false-success 0。LLM verifierを空キュー・正常routineで呼ばない |
| **6** | **self-heal / graduation** | fingerprint、Luna xhigh診断、Terra high test-first fix、canary、rollback、memory昇格gateを実装 | 注入bugを自分で発見→修正→再検証→promote。30日gateを満たす |
| **7** | **Claude-only parity** | Claude adapterが復旧した時に同一contractを`claude-only`で実行。GPTへのcross-fallbackなし | GPT-onlyとClaude-onlyが同じcontrolled E2E fixtureで同じbusiness outcome |
| **8** | **Coconala $10k net MRR** | diagnostic→sprint→recurring retainerのoffer ladder、10前後の継続client、upsell/retentionを自動運用 | fee後net MRR >= $10kを売上画面で3か月連続確認。22% feeならGMV目安 >= $12,821/月 |
| **9** | **multi-platform $100k MRR** | 許可済みmarketplace adapterとown inbound、共通CRM/delivery、vertical playbook、partner capacityを追加 | channel別CAC/close/retention/profitが可視化され、net MRR >= $100k |
| **10** | **own product $10M MRR** | gig workflowをmulti-tenant SaaS/API/enterprise/transaction marketplaceへ製品化。marketplace依存をlead sourceへ縮小 | SaaS+enterprise+take-rateの実売上合計がMRR >= $10M。gig GMVをMRRと偽らない |

**done 全体**: live connector上の合法・実行可能eventが、人間のdraft承認なしで検知→実行→ground-truth確認→自己修復まで閉じ、実売上が結果画面で確認できた時だけdone。送信・納品・入金確認に到達していないactive eventを「完了」と言わない。

---

## §6.5 gig 稼ぎ戦略 spec(2026-07-08) 完全実装チェックリスト（★Dais 原案・全部やる・忘れ厳禁★）
正本 spec = `docs/superpowers/specs/2026-07-08-gig-feasibility-volume-listing-design.md`。★spec の scope は `~/profitable-claude/...` を指すが **live loop は `~/anicca/skills/earn/gig/`**。end-state は profitable-claude(G-PRODUCTIZE)だが当面 anicca live に実装する★。現実装率(2026-07-11 監査):

| spec MUST | 現% | 実装する内容 |
|---|---|---|
| §2 出品(listing)を本命チャネルに | ~20% | 今日 薄B0追加済。下記 playbook で格上げ |
| §50 出品で売れる型 | ~0% | タイトル=結果ベネフィット(検索語前半・50字)/サムネ文字入れ「修正無制限/即日/商用OK」/説明1000字「対象→内容→納品物→流れ→料金→注意」/松竹梅3プラン+有料オプション/実績ゼロは相場60-80%・モニター価格で星5最優先/カテゴリは成果物ベースで競合回避/毎日ログイン+週1更新 |
| §63 応募速度最重要 | ~30% | 新着(sort=new)優先・掲載直後30分以内・数日経過案件は無駄打ち回避を prompt rule 化 |
| §6/§7 50/50 自己改善(status quo + **BP web検索毎pass更新**) | ~0% | B4 に「agent-reach/firecrawl で gig BP を検索し出品/提案の型を更新」を追加。固定せず loop 自身が更新 |
| §6 funnel metrics(カテゴリ別 listings_live/proposals/replies/orders/paid_jpy) | ~30% | gig-funnel.jsonl 拡張・auditor 集計 |
| §3 viable 全件応募・飽和(応募30+)自動skip | ~50% | max_apply 12(済)+ 飽和 skip rule 明記 |
| §4 占い再分類(skip→listing 1カテゴリ) | 0% | strategy.json skip から「霊感/占い」除去→listing 対象へ |
| §5 never-refuse 明記 | ~30% | 「合法・実行可能な依頼は絶対断らない、断るのは feasibility不可 or 違法/scam のみ」を prompt に |
| §1 feasibility gate(可=browser完結/不可=電話SMS実地資格録音物理) | ~60% | 可/不可の明示定義を prompt に(skip列挙だけでなく) |
| §67 DM 30分返信 nurture | 0% | §3.1を実装。現liveは誤URL `/mypage/messages` の404を `inquiries:0` success扱いするため未返信を検知できない |
| §73 個別作文(テンプレ一斉禁止) | ~70% | 依頼固有の一文必須を強化 |
| §69 最初の1件hack | ~10% | ニッチ絞る/競合上位10分析/プロフィール100%/本人確認/出品直後の露出ブースト期に即応募+通知者に即DM |

**全体 ~30-40% → 目標 100%。** 各項目 done = 私が結果画面 or loop出力で実装を実確認。

## §7 reality-verifier 詳細契約（§6 #5に従って実装）
目的: main sessionの手動navigate→screenshot→判定を、**provider-independent runnerが必要時に起動するfresh verifier**へ置換する。GPT-onlyのdefaultは Luna high、Claude-onlyではClaude adapterを使う。auditorがcoreのjsonlを信じず、実画面でreport-skeptical判定する。正常routineは決定論gateだけで完了し、fresh LLM verifierは異常・高価値side effect・日次sampleに限定する。
触るファイル(live `~/anicca/skills/earn/gig/`):
1. **gig_judge.py**（新規・`scratchpad/judge_bu.py`=browser-use/benchmark judge.py 198L を copy+tweak）: `JudgementResult{reasoning,verdict:bool,failure_reason,impossible_task,reached_captcha}` + `build_verifier_prompt(claims, ground_truth)`。system prompt は judge.py L79-163 を踏襲（report-skeptical: L148「be initially doubtful of self reported success」/L101「報告完了でも画面が未完了なら false」/L76「ground_truth 不一致なら必ず false」）。ground_truth = /mypage/services_lists・/received_orders/open・売上 の実DOM。
2. **gig_reality_verify.sh**（新規・runner）: 直近 N の shuppin.jsonl/applied.jsonl/earnings.jsonl の claim を読む → 共通agent-runnerを `MODEL_FAMILY=gpt / task_class=verifier`（Luna high default）でfresh spawnし、「結果ページにnavigate → cdp_snapshotでscreenshot → 実DOMを読む → claimが実画面に実在するか二値判定しJudgementResult JSONを出せ」と指示 → verdictをparse → `~/gig/audit-reality.jsonl` に追記 → verdict=falseなら `~/.openclaw/state/.gig-core-selfheal-request.json{reason,failure_reason,ts,failure_fingerprint}` を書く。Claude-only smokeでは同じprompt/schemaをClaude adapterで実行する。
3. **auditor.sh**: launchd :45 毎時にまず決定論で「未検証side effect・異常・日次sample」の有無を判定し、対象がある時だけgig_reality_verify.shを呼ぶ。正常な空キューではmodel call 0、新規jobは作らない。
4. **self-heal**: selfheal-request を次 core pass が冒頭で読む（既存フック）+ self-fix.sh がコード修正。
検証(RED/GREEN): gig_judge.py が import/parse OK・gig_reality_verify.sh bash -n・**実 claim(現 live 3出品)→PASS / 偽 claim→FAIL** を実走で確認（=私の手動検証と同じ結論を loop が自力で出すこと）。
※判断=agent（画面を見て真偽）/決定論=起動・記帳・selfheal-request 書込のみ。regex 判定禁止。

## §8 既に作った物 / 状態
- ✅ `~/anicca/skills/earn/gig/scripts/cdp_snapshot.py` — trajectory capture。**実 :9222 で screenshot 実撮影・成功確認済**（1920×854 PNG + trajectory.jsonl 生成、URL/title 記録）。
- ✅ `docs/loop-engineering/25-...bp.md` — 検証+自己改善BP（judge.py 実物裏取り）。
- ✅ 段#1 B0 capability: STARTUP に B0 SHUPPIN + trajectory + cron idempotent + max_apply 5→12 追加、commit+push、restart 活性化。
- ✅ **B0 実発火(2026-07-11 23:57)**: loop 自己申告で 下書き2件公開(業務AI活用診断¥8000/id4302213・SEO診断¥10000/id4244912) + 新規1件(見やすいパワポ¥8000/id4308502)。★未検証(reports lie)★ + typo「作りますます」残 + trajectory PNG 0枚(cdp_snapshot 未呼出=配線未効)。
- ✅ **増分1(出品playbook格上げ) = 完了・merge・live・活性化(2026-07-12)**: adversary PASS(0 blocking, 6/6 REQ)、verify 11/11 VERIFIED実行。main へ fast-forward merge、live `~/gig/strategy.json` の占い削除(20→19)、bash -n OK、restart 済(ALIVE)、push 済、worktree掃除済。gig-cli.sh に LISTING PLAYBOOK/APPLY SPEED RULE/NEVER-REFUSE/FEASIBILITY GATE の4ブロック live。
- 現行の実行順は§6だけを正本とする。過去のB0発火claim（下書き2公開 4302213/4244912、新規1件 4308502）、typo修正、playbook反映、trajectory PNGは未検証debtとして§6 #4/#5で実画面確認する。
- copy元 judge.py: scratchpad/judge_bu.py（raw main 198L, VERIFIED）。
