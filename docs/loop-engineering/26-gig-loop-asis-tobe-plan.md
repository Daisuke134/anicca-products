# 26 — gig ループ AS-IS / TO-BE / 実行計画（compact-proof 正本・忘れ厳禁）

**これは gig ループを「自己検証・自己修復・自己改善する best-practice browser-use loop」に直すための唯一の durable 計画**。会話は compact で揮発する→ここに全部焼く。SSOT(00) の L1 はここを指す。検証BPの詳細は [25-browser-use-verify-selfimprove-bp.md](25-browser-use-verify-selfimprove-bp.md)。

Dais 確定方針(2026-07-11):
- **先に B0/B1/B2 の capability を loop に持たせる**（今は「やれと指示すらされていない」＝当然やらない。特に **B0 出品は harness に存在しない**）→ その上に検証/自己修復を載せる。
- 移動/改名しない・その場で直す。一つずつ・各段階で私(claude-p)が **結果画面を browser で読んで**確認してから次へ。

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
```
        ┌──────────────── gig core (毎 pass) ─────────────────┐
[B0 出品] 自分の店を常時 手入れ・拡張: 下書き2件を完成公開/typo修正/
          公開3件を最適化(タイトル・説明・価格・画像)/AIが勝てるcat追加。
          → 受動 inbound 受注（100人と競合しない・応募2%床を回避）＝金脈
[B1 返信] 購入前DM + 購入後トークルームを5分ごとに検知し、10分以内に返信。
          仮払い後は納品・検収→評価。返信laneはhourly full passから分離する。
[B2 応募] 応募を継続、量↑・範囲↑(category直URL+keyword)・質↑（改善が主眼）
[納品]    成果物作成→納品→検収→高評価→リピート
   各ステップ後 → cdp_snapshot.py で screenshot+action を trajectory に記録
        └──────────────────────────────────────────────────────┘
                              │
     ┌──────────── verifier (report-skeptical, 別context) ──────────┐
     │ ①core報告に依存しない ②結果画面を自分で読む＝ground-truth:      │
     │   出品管理=公開中か / 取引管理=納品済か / 売上=¥立ったか(決め手) │
     │ ③trajectory+screenshot と突合→ 二値 PASS/FAIL + failure_reason  │
     └──────────────────────────────────────────────────────────────┘
                              │ FAIL / ¥0 継続
     ┌──────────── self-heal ────────────┐
     │ 失敗→Reflexion で教訓化→次passに注入 / 成功→AWM で再利用skill化   │
     │ 根が harness/コード → self-fix.sh が Opus で自分で修正→再検証     │
     └──────────────────────────────────────────────────────────────┘
```

---

## §3 B0/B1/B2/納品 の capability 定義（= STARTUP prompt に「何をせよ」を明記する中身。今 B0 は存在しない）
- **B0 出品(SHUPPIN・新規追加)**: 毎pass、`/mypage/services_lists` を読む→(a)下書き2件を完成させ公開 (b)typo・弱いタイトル/説明/価格/カバー画像を改善 (c)公開数が目標(例5-7)未満なら AIが勝てるcat(AI活用支援/資料作成PPT/SNS運用/記事/翻訳/文字起こし/LP/自動化)で `/services/add` から新規出品。成果物サンプルは公式 `pptx`/portfolio skill で作る。
- **B1 返信/納品**: `/message` の購入前DMと `/mypage/received_orders/open` の購入後トークルームを別キューとして sweep する。buyer が最終送信者なら即返信し、仮払い契約は成果物作成→納品、検収済は評価依頼へ進める。返信検知を hourly full pass に埋め込まない。
- **B2 応募(改善)**: `max_apply_per_pass` を上げ(5→10〜15)、scan を category直URL+keyword に拡張、AI禁止/実績必須/物理必須を除外、掲載直後(応募一桁)を優先。**質と量の両方を上げる**。
- 各ステップで **cdp_snapshot.py `<pass_id> <seq> <label>`** を呼び trajectory を残す。

### §3.1 B1 即応SLA（返信速度の正本）

#### 優先順位と時間契約

| priority | queue | 検知目標 | 実質返信目標 | breach |
|---:|---|---:|---:|---:|
| P0 | 購入済み初回連絡・修正依頼・進捗確認 | buyer送信から5分以内 | 検知から10分以内 | buyer送信から30分 |
| P1 | 新規購入前DM・問い合わせ | buyer送信から5分以内 | 検知から10分以内 | buyer送信から30分 |

時刻はplatform表示を取得してISO 8601へ変換し、内部ではUTC、報告ではJSTを使う。30分pollでは最悪30分待ち、hourly pollでは最悪60分待つため採用しない。5分ごとの処理はDOM/APIを読む軽量detectorだけとし、未返信がある時だけ最大2workerを起動する。P0を先に、同一priority内は `buyer_sent_at` が古い順に処理する。応募follow-up、出品、応募、学習はB1 SLA外としてhourly full passに残す。

#### 検知契約

1. 購入前DMは `https://coconala.com/message`、購入後取引は `https://coconala.com/mypage/received_orders/open` から取得する。pagination/infinite scrollを既知checkpointまで走査し、first viewportだけで終了しない。
2. current URL、page title、受信箱container markerを検証する。404、login redirect、error page、container欠落は `collector_unhealthy`。正しいpage identityとcontainerを確認した上でmessage cardが0件なら `queue_empty` とする。
3. `buyer_sent_at / message_id / thread_id / thread_url / observed_at / last_sender / reply_required` を永続化する。`opened/unreadCount` は補助情報であり、既読を返信済みと扱わない。顧客の生メッセージ本文・メール・cookieは保存しない。
4. idempotency key はmessage IDがある場合 `platform + thread_id + message_id`。ない場合は `platform + thread_id + buyer_sent_at + thread内ordinal + normalized_hash` とする。normalizeはUnicode NFC、改行と連続空白の統一、前後空白除去だけを行い、同文の別送信を区別する。
5. `pending -> claimed -> send_intent -> click_started -> verifying -> replied|failed|manual_review` を永続state machineにする。claimはSQLite transactionまたは原子的O_EXCL lockで1workerだけが所有し、単調増加する `fencing_token` を発行する。`send_intent` は `outgoing_hash / owner_id / fencing_token` を送信clickより前にwrite-aheadでcommitする。
6. senderはclick直前のtransactionでowner・lease・fencing token・`click_started_at IS NULL` を再検証して `click_started` をcommitする。claim期限切れだけでは別workerへ送信権を渡さない。期限切れ時はsupervisorが旧owner processと専用browser sessionの停止を確認してtokenを失効させる。`click_started` 前に停止確認できた場合だけ新tokenでpre-send処理を再開できる。`click_started` 後またはclick実行有無が曖昧な場合、新ownerはverify専用とし、自動再送せず `manual_review` + criticalにする。これによりplatform側にidempotency APIがなくても自動送信clickをkeyごとに最大1回へ制限する。
7. lifecycleとして `detected_at / queued_at / started_at / send_intent_at / click_started_at / replied_at / pre_send_attempt_count / send_click_count / last_error / owner_id / claim_expires_at / fencing_token` を永続化する。ACK/seen化は送信後ground-truthが取れた後だけ行う。
8. collector heartbeatまたはsnapshotが10分以上古い、detector exitが非0、pending ageが15分を超える場合、返信laneだけを1回restartしfresh workerを起動する。次の再起動は5分backoff、3連続失敗でcritical。30分超過もcriticalとする。supervisor heartbeatやhourly full passの成否だけで健康判定しない。

#### 返信品質契約

返信は短く、次の4要素を含める。

1. 共有内容を受領したことを伝える。
2. 相手の依頼・質問へ直接答える。thread/order内の検証済み固有情報を1点使う。
3. Web/InstagramのURLがあり2分以内に安全に確認できる場合だけ、外部で実測した固有情報を加える。リンク欠落・block・調査遅延時は「確認した」と主張せず、thread内事実で返信して外部調査を後続taskへ回す。
4. こちらが次に行う具体的作業と最短の正直な予定を示す。
5. 作業開始に本当に必要な未確定事項があれば、質問は1つに絞る。不要なら質問せず着手を宣言する。

「受領しました」「本日連絡します」だけのackは実質返信に数えない。相手の質問・依頼へ具体的に答えるか、調査済みの初期診断と次アクションを示した時だけSLAを満たす。

#### 送信後ground-truth

- 返信成功はagentの自己申告やclick完了では判定しない。同じthreadを再読し、sellerが最終送信者で、送信本文の正規化hashが一致し、送信時刻とthread URLを取得できた時だけ `replied` とする。
- send action後にDOM再読が失敗する曖昧状態では再送しない。fresh verifierがthreadを再読し、同じbuyer messageより後に同じoutgoing hashが存在すれば `replied` とする。`click_started` 済みまたはclick実行有無が不明なら、hashが不在またはthread自体を確認できない場合も自動再試行せず `manual_review` + criticalにする。再試行できるのは、旧owner process/sessionの停止と `click_started_at IS NULL` の両方を確認できたpre-send失敗だけとする。
- browser navigation・selector取得など、`click_started` 前と証明できる失敗だけをpre-send retry対象にする。試行は初回 `t+0`、`t+2分`、`t+5分` の最大3回。3回失敗または初回から5分経過で `failed` + criticalへ遷移し、それ以上は自動再試行しない。各retry前に現owner・lease・fencing tokenをtransactionで再検証する。`send_click_count` はkeyごとに最大1とする。
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
| P0 `/mypage/received_orders/open` | buyer-lastの初回連絡・修正依頼・進捗確認 | `reply_required=true`、5分以内検知、P1より先にclaim |
| P0 `/mypage/received_orders/open` | seller-last | `reply_required=false`、送信0 |
| 同一keyへ2worker同時起動 | claim成功1、送信最大1 |
| claim期限切れで旧ownerが生存 | 旧process/session停止とfence失効まで新ownerの送信0 |
| `send_intent` commit直後にcrash | 停止確認後、新fenceでpre-send再開可能、送信最大1 |
| `click_started` commit直後またはsend後にcrash/DOM timeout | blind retry 0、fresh verify。存在すれば`replied`、確認不能または不在なら`manual_review` + critical |
| 送信前transient failure | `t+0/+2/+5分` の最大3回、以後`failed`、送信click 0 |
| pending 15分 / 30分 | fresh worker / critical |

決定論testはP0/P1それぞれの全caseについてexpected state、`pre_send_attempt_count`、`send_click_count`、fencing token、時刻差をassertする。全crash window（claim後、intent commit後、click_started commit後、click後、verify前）で旧owner停止・takeoverを競合実行し、keyごとのclickが最大1であることを固定clock/barrier testで検証する。clockをfixtureで固定し、`buyer_sent_at -> detected_at <= 5分`、`detected_at -> replied_at <= 10分`、`buyer_sent_at -> replied_at <= 30分` を別々に検証する。live E2Eは専用controlled buyerからP1新規DMを1件、専用controlled orderからP0購入後メッセージを1件送り、両方で同じ3時刻差とseller-last/hash一致を確認する。P0/P1のどちらか一方でも未実施ならB1 doneにしない。既にmanual返信済みの `earth0809` threadはP1 seller-last fixtureとして送信0・二重返信0を確認する。

根拠: ココナラ公式は「購入されたら後回しにせず、すぐに一言トークルームで連絡」「すぐ対応できない場合は一次返信」と案内する（https://mag.coconala.com/articles/knowhow-prevent-48hcancel）。48時間は自動キャンセル上限であり、営業SLAではない。

---

## §4 検証設計（BP=25準拠。★決め手は screenshot でなく結果画面の実データ読返し★）
3層: ①trajectory(action ログ=弱) ②screenshot(中) ③**ground-truth 読返し(強・事実)**=出品管理/取引管理/売上 の実DOMを別途読む。
- 実装: `browser-use/benchmark/judge.py`(実fetch済198L) を copy+tweak した **gig_judge**。`JudgementResult{reasoning, verdict:bool, failure_reason, impossible_task, reached_captcha}`。
- report-**skeptical**: core の summary は渡すが「実際に起きたか screenshot/結果画面で二重確認せよ」と明示（judge.py L148/L143/L101）。ground_truth 不一致なら verdict 必ず false(L76)。二値判定(rubric中間スコア禁止)。
- 金(¥)は **実 売上/検収 画面 or 入金でのみ PASS**（jsonl の自己申告では PASS しない）。
- 別 context の fresh spawn で報告非依存を担保（= auditor が reality-verifier を起動）。

---

## §5 自己修復設計（BP=25準拠）
- verdict=false / ¥0 が N日継続 → **Reflexion**: 「何が違ったか」をテキスト教訓化し次pass prompt / strategy memory に注入。
- 成功 trajectory → **AWM**: 再利用可能 workflow/skill として memory 化（evaluator が correct と認めた物のみ）。
- 根が harness/コード → **self-fix.sh** が Opus で該当スクリプト/STARTUP を修正 → 同じ judge 基準で再検証（fix→verify 反復、上限5=VCSDD既定）。
- 連携ファイル: `~/.openclaw/state/.gig-core-selfheal-request.json`（STARTUP が pass 冒頭で読む既存フック）、`~/anicca/skills/self/self-fix.sh`。

---

## §6 実行順序と done 条件（★Dais順: capability を先に、検証/自己修復を後に★）

| # | 段 | やること | done（私が browser 実読で確認） |
|---|---|---|---|
| **1** | **B0 capability 追加** | STARTUP に B0 出品ステップ明記 + `cdp_shuppin.py`(出品作成/編集/公開) + 下書き2件完成・typo修正 | `/mypage/services_lists` に **公開中の出品が増え/整い**、下書き0、typo無し（実DOM） |
| **2** | **B2 改善** | max_apply↑・scan拡張・質向上を STARTUP に反映 | 1pass で応募数が実際に増え、AI禁止/物理案件を除外している（trajectory+実応募履歴） |
| **3** | **B1 即応lane** | 正しい `/message` と `/mypage/received_orders/open` collector + 5分detector + write-ahead intent/fencing付きreply worker + verify-before-resend + healthcheck を実装 | controlled buyerのP1新規DMとcontrolled orderのP0購入後メッセージで各1件、detect≤5分・reply≤検知後10分・total≤30分、seller-last/hash一致。全crash windowでclick最大1。earth0809既返信threadはsend 0（実DOM） |
| **4** | **検証土台** | `gig_judge`(judge.py copy) + auditor を report-skeptical 化(結果画面読返し) | verifier が出品公開数/納品/売上を独立に読み二値判定を audit.jsonl に出す |
| **5** | **自己修復** | verdict=false/¥0継続 → Reflexion+self-fix.sh 配線 | 壊れた時 次passで自分で直り再検証が回る |
| **6** | **入金** | 出品 inbound か jibieaian 検収で初の実¥ | **売上画面 or 入金 tx を私が実読**で ¥>0 確認（自己申告不可） |

**done 全体**: 出品が手入れされ inbound を受け、応募も増え、納品が完遂し、verifier が結果画面で真偽を出し、失敗が自己修復し、**実¥が結果画面で確認できた**とき。それまで「完了」と言わない。

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

## §8 増分2b 設計 — own-eyes 検証を loop に焼く（reality-verifier を自走化）★実装中★
目的: 「私が main session で navigate→screenshot→判定」した手順を、**loop が毎時 自分で起動する fresh claude** に置換。auditor が core の jsonl を信じるのをやめ、実画面で report-skeptical 判定する。
触るファイル(live `~/anicca/skills/earn/gig/`):
1. **gig_judge.py**（新規・`scratchpad/judge_bu.py`=browser-use/benchmark judge.py 198L を copy+tweak）: `JudgementResult{reasoning,verdict:bool,failure_reason,impossible_task,reached_captcha}` + `build_verifier_prompt(claims, ground_truth)`。system prompt は judge.py L79-163 を踏襲（report-skeptical: L148「be initially doubtful of self reported success」/L101「報告完了でも画面が未完了なら false」/L76「ground_truth 不一致なら必ず false」）。ground_truth = /mypage/services_lists・/received_orders/open・売上 の実DOM。
2. **gig_reality_verify.sh**（新規・runner）: 直近 N の shuppin.jsonl/applied.jsonl/earnings.jsonl の claim を読む → **fresh `claude -p`（sonnet, --add-dir $HOME, :9222 CDP 使用可）を spawn** し、gig_judge prompt で「結果ページに navigate → cdp_snapshot で screenshot → 実DOM 読む → claim が実画面に実在するか二値判定し JudgementResult JSON を出せ」と指示 → verdict を parse → `~/gig/audit-reality.jsonl` に追記 → verdict=false なら `~/.openclaw/state/.gig-core-selfheal-request.json{reason,failure_reason,ts}` を書く。
3. **auditor.sh**: 既存の決定論 verdict の後に gig_reality_verify.sh を呼ぶ（launchd :45 毎時、新規 job 不要）。
4. **self-heal**: selfheal-request を次 core pass が冒頭で読む（既存フック）+ self-fix.sh がコード修正。
検証(RED/GREEN): gig_judge.py が import/parse OK・gig_reality_verify.sh bash -n・**実 claim(現 live 3出品)→PASS / 偽 claim→FAIL** を実走で確認（=私の手動検証と同じ結論を loop が自力で出すこと）。
※判断=agent（画面を見て真偽）/決定論=起動・記帳・selfheal-request 書込のみ。regex 判定禁止。

## §7 既に作った物 / 状態
- ✅ `~/anicca/skills/earn/gig/scripts/cdp_snapshot.py` — trajectory capture。**実 :9222 で screenshot 実撮影・成功確認済**（1920×854 PNG + trajectory.jsonl 生成、URL/title 記録）。
- ✅ `docs/loop-engineering/25-...bp.md` — 検証+自己改善BP（judge.py 実物裏取り）。
- ✅ 段#1 B0 capability: STARTUP に B0 SHUPPIN + trajectory + cron idempotent + max_apply 5→12 追加、commit+push、restart 活性化。
- ✅ **B0 実発火(2026-07-11 23:57)**: loop 自己申告で 下書き2件公開(業務AI活用診断¥8000/id4302213・SEO診断¥10000/id4244912) + 新規1件(見やすいパワポ¥8000/id4308502)。★未検証(reports lie)★ + typo「作りますます」残 + trajectory PNG 0枚(cdp_snapshot 未呼出=配線未効)。
- ✅ **増分1(出品playbook格上げ) = 完了・merge・live・活性化(2026-07-12)**: adversary PASS(0 blocking, 6/6 REQ)、verify 11/11 VERIFIED実行。main へ fast-forward merge、live `~/gig/strategy.json` の占い削除(20→19)、bash -n OK、restart 済(ALIVE)、push 済、worktree掃除済。gig-cli.sh に LISTING PLAYBOOK/APPLY SPEED RULE/NEVER-REFUSE/FEASIBILITY GATE の4ブロック live。
- ⬜ **RESUME(compact後ここから) — 増分1の検証 + 増分2**:
  1. ★私が browser :9222 で own-eyes 確認(未実施)★: /mypage/services_lists で 増分1後の新パスが (a)3サービス公開中か (b)typo「作りますます」を直したか (c)松竹梅/モニター価格/ベネフィットtitle を反映したか / trajectory PNG(~/gig/trajectory/)が出るように なったか。self-report(shuppin.jsonl)でなく実画面で。
  2. B0発火の既確認(23:57): 下書き2公開(4302213/4244912)+新規1(4308502)。※これも browser で live 実在を確認する。
  3. 増分2以降(順に・各VCSDD-lean): funnel metrics(gig-funnel.jsonl+auditor集計) → 50/50 BP web検索自己改善(B4にfirecrawl/agent-reach) → verifier土台(gig_judge=judge.py copy+auditor report-skeptical化) → self-heal配線(Reflexion+self-fix.sh)。tracker=§6.5。
- copy元 judge.py: scratchpad/judge_bu.py（raw main 198L, VERIFIED）。
