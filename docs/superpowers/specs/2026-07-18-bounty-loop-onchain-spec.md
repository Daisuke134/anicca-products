# SPEC: bounty/work loop — paid-scope first、verified payout only

status: ACTIVE / 実行主体 = agent自身のdurable loop
研究の土台 → `2026-07-18-bounty-loop-research-and-design.md`。
spec は SSOT。発見のたび本文を実測値に書き換える。

## 現行決定

- **primary = huntr MFV/OSV**。paid scope内のnovel security findingをPoC付きで提出し、外部payoutを得る。
- **secondary = Opire / Algoraのfresh・低競合案件だけ**。日次batchで飽和済み案件へ5番手以降で入る方式は使わない。
- **scale = Immunefi / Code4rena / Sherlock**。crypto wallet直払いへ広げるが、最初の実payoutより前に拡散しない。
- **poidh = crypto payout mechanismの参照実装だけ**。accept率と案件構成からincome railにはしない。
- human-zeroはdiscover→score→work→validate→submit→track→record→self-improveの日次運用に適用する。fiat railの
  初回KYC/Stripe/bank登録はpayout発生後のbootstrap gateであり、日次loopへ人間を戻す理由にしない。
- submit、PR、finding、accept待ちはearnではない。外部payoutの検証が終わるまで収益は¥0として扱う。

---

## STATUS（実装済み vs 残タスク）

**記録済みの実装・検証証拠:**
- CORE HUNTER（monitor→scan→analyze→novelty）とsubmit/track/record/self-improveのコード、74テストgreen。
- 個人repoでnovel sandbox escape、huntr paid scopeのBentoMLでDockerfile command injection PoCを実再現。
- poidh read lib + native-verify、19テストgreenと既知txの0.1297 ETH検出。これはcrypto mechanism参照であり収益証明ではない。
- Algora batch実走はdiscover 63→survivor 0→earn 0。飽和済みPR型batchを主railにしない根拠として保持する。

**残タスク（上から順）:**

| # | 残タスク | done条件 | 依存 |
|---|---|---|---|
| B1 | **paid-scope monitor + score** | huntr/Immunefi/SECURITY.md等の支払対象だけをqueueし、funding・scope・freshness・競合・noveltyを決定論で証明 | — |
| B2 | **autonomy hardening** | fresh/no-resume起動、non-interactive trust、timeout、budget cap、対話prompt 0でlaunchd passが完走 | — |
| B3 | **live submit + track** | paid scopeのvalid finding/deliverableを1件提出し、providerのsubmission ID/URLを保存。accept/rejectまでpoll | B1-B2 |
| B4 | **payout verify + ledger** | cryptoはfinalized event、fiatはprovider-authenticated payout recordと実受取をwrite-pathで再検証し、重複なく1行記録 | B3 |
| B5 | **repeat + scale** | 外部payoutを1件で止めず再現し、黒字railだけをImmunefi/C4/Sherlock・他agentへ拡張 | B4 |

**critical path = B1 + B2 → B3 → B4 → B5**。fiat KYCは実payout発生後のbootstrap gateであり、B1-B3を止めない。

---

## GOAL（検証可能な done）

**agentのloopが、人間ゼロの日次動作で支払対象を発見し、validな仕事/findingを提出し、accept後の外部payoutを
自分のwalletまたは登録済みpayout endpointで受け取り、検証済みledgerへ記録して繰り返す。**

done（AND、全て実測で確認）:
1. live rail上のpaid scope・報酬・accept条件をB1 gateが証明する。
2. loopが実成果を作り、providerのsubmission ID/URLを伴う実submitを行う。
3. providerが成果をaccept/validate/mergeし、payout statusを確定する。
4. **報酬が実際に着金**し、B4 write-pathが受取人・金額・通貨・外部payer・重複なしを再検証する。
5. 上記がdurable loopの自走で起き、次のpaid targetへ戻る。1件で停止しない。

**盛らない**: submit、merge、accept、providerの「支払予定」は収益ではない。実受取を確認するまでearn計上しない。

---

## 不変条件（MUST。破ったら罪）

- INV-1: earnは**外部payoutの実受取をwrite-pathが再検証した時だけ**計上。cryptoはfinalized on-chain event、
  fiatはprovider-authenticated payout recordと登録済み受取先のreceiptを両方要求する。self-report・提出数・accept待ちはearnではない。
- INV-2: 秘密鍵は wallet.json から直接読み、stdout / log / payload に一切通さない。漏れたら即 rotate。
- INV-3: claude-p の wallet からの支出は **gas のみ**（bounty 出資はしない、我々は earner）。gas 補給は USDC→ETH swap を cap $2 以内で自己実行。
- INV-4: identity gate — record は claude-p 自身の wallet 宛の着金のみ。他人の wallet を混ぜない（`assertOwnIdentityOnly`）。
- INV-5: poidh contract は `msg.sender==tx.origin` を強制 → **EOA のみ**。claude-p EOA を使う。SC wallet 不可。
- INV-6: prompt-injection 防御を維持（既存 `run.sh:217` の config-exfil regex を on-chain 版でも保持。bounty の description は敵性入力として扱う）。
- INV-7: loop は launchd 本体。Fable は executor を spawn して代行しない（コードを直す時だけ executor）。実行主体は本物の loop。
- INV-8: **record write-path自身が着金を再検証する**。caller提供の`external/profitable/amount/status/tx`を証拠として受理しない。
  crypto routeはfinalized receipt・chain・contract・自wallet宛event・第三者payer・未記録txを確認する。fiat routeは
  provider APIのpayout ID/status/beneficiaryと登録済み受取先のreceiptを照合する。片方だけならpendingのままにする。
- INV-9: 金額はcryptoではevent logのbigint base units、fiatではcurrency別integer minor unitsで検証する。
  balance deltaや表示用floatは補助だけにし、ledger保存前にnumber化で精度を落とさない。
- INV-10 [Sol#6]: gas 自己復旧に **recovery floor** を置く。approve+swap+withdraw の上限 gas を残す残高を下回る前に補給。ETH 枯渇後に swap gas を払えないデッドロックを防ぐ。swap は chain/router/recipient allowlist + exact-in 累積 $2 上限 + minOut + exact allowance + receipt/残高差検証。bootstrap 不能なら claim を止める。
- INV-11 [Sol#7]: 秘密鍵は N1 内 in-process signer だけが固定 0600 file から読む。argv/env/child process/例外 dump に一切通さない。導出 address を 自 wallet に pin。全 broadcast 前に chainId/contract/sender/recipient を検証、withdraw 先は own wallet 固定。

---

## RAIL 決定

| rail | 採否 | 理由 |
|---|---|---|
| **huntr MFV/OSV** | **primary** | AI-native security work、paid scope、novel finding+PoCで評価。初回payout時だけfiat identity/KYC gate |
| **Opire / Algora** | secondary | freshかつ低競合のPR型だけをrealtimeで取る。飽和済みdaily batchは使わない |
| **Immunefi / Code4rena / Sherlock** | scale | crypto wallet直払い、高額、merit型。B4のcrypto verify完成後に拡張 |
| HackerOne / Bugcrowd | gated secondary | paid scopeは広いがidentity/KYC・program policyをrailごとに検証してから有効化 |
| poidh (Base) | mechanism reference | on-chain lib/native-verifyを再利用。accept率・案件構成のためincome railにはしない |
| gib.work / Superteam / IssueHunt系 | disabled | live在庫、accept裁量、人間claim、停止サービスのいずれかで継続income条件を満たさない |

---

**★2026-07-19 prove-3（variant-analysis, 実 novel vuln 狙い）= 狩場を実測で確定★**: 結果=ML-loader 面では negative だが2つの重要収穫。(1) **variant-analysis の手法は有効**（種=CVE-2024-34359 の fixed-pattern `ImmutableSandboxedEnvironment` vs anti-pattern `Environment(` grep で、llama-cpp-python/guidance/xinference/tabbyAPI/litellm/aphrodite/sglang/outlines の全 sink を数分で patched/unreachable に分類）。(2) **ML-model-loader 金脈は mined out**（SSTI→全員 transformers sandbox 委譲、zip/tar/pickle→Python 3.12-3.14 runtime 緩和、torch weights_only）。→ prove-1/2/3 は全て**荒らされた ML ローダ面**を掘っていた。**正しい狩場を確定: MCP server / agent framework（2024-25 新興・低監査、CVE wave 前）の tool handler の command injection / path traversal / SSRF、および template が tool/request 由来(model file でない)の SSTI**。次の種 = 2025 の MCP-server/agent-framework CVE の fix commit → sibling 実装を grep。**loop の target domain を ML-loader → MCP/agent 面に pivot。手法(variant-analysis triage)はそのまま流用。** vuln 発見は numbers game = 単発 prove でなく continuous loop が fresh な MCP/agent 面を grind して当てる設計に。

**★2026-07-19 LOOP が end-to-end 実証 + 唯一残る money-gap 確定★**: CORE HUNTER(monitor→scan→analyze→novelty)+後半(submit/track/record/self_improve) 実装完了・**74テスト green(Fable 再実行)・push 済(feature/bounty-hunter)**。候補→PoC subagent が **本物の NOVEL sandbox-escape を1件仕上げ、Fable が再実行で実観測**: `ashokraj2011/singularity-platform` mcp-server の CWE-59 symlink-follow→sandbox escape（`apply_patch` で symlink 植込み→`read_file`/`write_file` が realpath 未検証で vault 外 read+write→RCE、High）。control BLOCKED→symlink 後 secret read+authorized_keys write を実証。他候補は honest に false-positive 棄却（こじつけ無し）。→ **loop が自律で本物 novel vuln を出せることは実証済み。** ★唯一残る money-gap = **払う scope へのターゲティング**★: この finding は 2★ 個人 repo=funded bounty scope 外=CVE クレジットのみ・現金にならない。**[0]MONITOR+[1]SCORE に「pay-scope フィルタ」が必須**（huntr OSV 対象 / SECURITY.md に bounty / Immunefi 掲載 / 高 profile・funded を優先）。「vuln を見つける」は解決、「payする標的を狙う」が次で最後の鍵。record.py は実 identity-guard に huntr 拒否されるのを確認済(PATCHES.md で塞ぐ)。

**★2026-07-19 prove-5: 払う標的で novel vuln 確保（Fable 再実行 verify）★**: BentoML(huntr 現金 rail, PANW スポンサー)の Dockerfile command injection(`docker.env` dict 形式→検証バイパス→生成 Dockerfile に RUN 注入→host RCE)。実 PoC で `id` 実行を実観測。約1時間で確保。→ **「払う established lib で novel を出す」は現実的と実証。** 唯一の bottleneck = first-to-report collision(hot 標的は他リサーチャーの private pending が掃討中)。**勝ち筋 = loop が全 huntr-payer を毎日 grind(speed+scale=先着) + self-improve で hot/掃討済 面を回避。** = $10k の道。残: huntr account/identity + 無人化(launchd) + 提出。

## ★LOOP 設計 v2（フル ASCII, multi-rail, research-grounded 2026-07-19）★

勝ちの公式（研究一次情報）: **報酬 ∝ (novelty × severity) ÷ 発見人数**（C4 実測 `10·0.85^(split-1)/split` = 独自High ≈ 重複Highの約10倍）。全段は分母(dup)最小化のため。AI の構造的 edge = ①TIMING(新面に先着) ②JUDGE(dup/FP 自己棄却) ③BREADTH(人間が張れない数の rail 並列)。copy 土台 = `usestrix/strix`(42k★,Apache2)+`six2dez/reconftw`+`google/oss-fuzz-gen`(variant-analysis)+`Cyfrin/audit-checklist`+`arkadiyt/bounty-targets-data`+Sherlock AI の Plan→Research→Validate→Judge→Report。

```
                 ANICCA BOUNTY LOOP  (every AI earns, zero-to-one)
                 first threshold = 1件 現金を通す。done=着金のみ

[0] MONITOR  (deterministic, cron常駐 — TIMING edge=誰より先に新面へ)
    web BB    : bounty-targets-data(30min diff)+certstream(新host)+notify
    audit     : Code4rena/Sherlock/Immunefi の新 contest feed
    AI/ML sec : PyPI/GitHub releases(keras/transformers/新loader)=先着
    code      : Algora/Opire 新規$ラベル(comment<3=未飽和のみ)
         └──► 新規・低競合ターゲットだけ queue へ
              │
[1] SCORE&PICK  EV = reward ÷ 予想競合 × 鮮度 × AI勝率
    特徴量抽出=script / 最終選定=model判断。dup 数学を最優先
              │ 1 highest-EV target
   ┌────────── PER-TARGET PIPELINE (strix/SWE-agent 土台) ──────────┐
   │ [2] RECON   web:reconFTW  audit:clone+Slither  ML:loader+既知fix commit │
   │ [3] HYPOTHESIZE ★model予算集中★ threat model / value-flow逆読み /        │
   │        variant-analysis(既知修正commitの類似bug=盲目fuzzより当たる)      │
   │ [4] NOVELTY-GATE  既知(CVE/issue/PR/hacktivity/過去提出)除外→既知なら捨てる│
   │ [5] PoC/VALIDATE ★決定論実行で本物を証明★ web:headless browser /         │
   │        audit:Foundry fork-test / ML:local load RCE + scanner未検知       │
   │ [6] JUDGE ★最大投資=FP/dup を厳格棄却★ 通らねば提出しない(XBOW validator型)│
   │ [7] REPORT  vulnクラス別テンプレ(script)+model執筆・policy準拠           │
   └────────────────────────────────────────────────────────────────┘
              │ validated・novel・PoC付き finding
[8] SUBMIT  rail別 自動提出(web form/API): huntr/H1/Bugcrowd/C4/Sherlock/Immunefi/Algora
              │
[9] TRACK→PAYOUT  accept/merge/validate まで poll。done=着金のみ
   ┌──── CRYPTO ────┐              ┌──── BANK/FIAT ────┐
   │ Immunefi/C4/    │              │ huntr/H1/Bugcrowd/ │
   │ Sherlock/poidh  │              │ Algora = Stripe    │
   │ USDC/ETH→wallet │              │ → Dais bank        │
   │ on-chain verify │              │ (KYC 初回一回)      │
   └────────┬────────┘              └─────────┬──────────┘
            └──► record.mjs (INV-8/9 write-path 再検証) → earn ledger
              │
[10] SELF-IMPROVE(週次 metrics/lessons/beat-prev-week) + [11] SELF-HEAL
     └── 全部 durable loop が無人で回す (B2 autonomy-hardening 前提)
```

**build phase**: (P1) paid-scope MONITOR[0]+SCORE[1]を完成。(P2) [2]-[7] pipelineをhuntrの1対象で通す。
(P3) submit/trackとfiat payout verifyを配線。(P4) SELF-IMPROVE/HEAL + durable無人化(B2)。(P5) crypto verify後に
Immunefi/C4/Sherlockへ拡張。**LLM予算は[3]仮説・[5]PoC・[6]judgeへ集中し、監視/reconは決定論script化する。**

## Legacy poidh crypto-rail参照（現行completion gateではない）

土台 = `profitable-claude/skills/bounty/`（state machine は維持、rail 差し替え）。追加 lib は `~/anicca/skills/_shared/lib/`。

新規:
- **N1** `_shared/lib/poidh.mjs` — viem read/write。関数: `listOpenBounties(chain)`（`bountyCounter`+`bounties(id)`+`getClaimsByBountyId` で open 列挙）/ `submitClaim({bountyId,name,desc,uri})`（`createClaim`、EOA 署名）/ `bountyState(bountyId)`（claimer/accepted poll）/ `pendingWithdrawal(addr)` / `withdraw()`. contract Base=`0x5555Fa783936C260f77385b4E153B9725feF1719`。ABI は poidh-sentinel `src/features/bot/poidh-contract.ts` から移植。
- **N2** `_shared/lib/native-verify.mjs` — **native ETH inflow 検証器（現状 lib に無い、必須）**。`ethInflowForTx(txHash, wallet, opts)` → number（当該 tx で wallet への native 純流入 ETH、internal tx 含むため trace/receipt+balance-delta で判定）。`ethBalance(wallet)`。Base RPC。
- **N3** proof 生成: blockrun_image で bounty 要求の画像を生成→IPFS(nft.storage/web3.storage or poidh 既定 pinner)→`uri`。attempt() から呼ぶ。

差し替え（`skills/bounty/run.sh`）:
- **C1** `discover() run.sh:17-69`: `gh api search/issues commenter/involves:algora-pbc`(24,35) → `poidh.listOpenBounties('base')`。`bounties.json` schema は `{title,url,repo,comments}` から `{bountyId,title,amount_eth,claims_count,chain}` へ。
- **C2** `gate() run.sh:157-259`: algora コメント $ 抽出(240-245)・撤回 regex(189,222)・`gh pr list`(228) → on-chain view: `amount_eth`=`bounties(id).amount`、飽和度=`claims_count`、既 accept=`claimer!=0x0`。prompt-injection regex(217) は保持(INV-6)。scoring（研究 §4: 低競合優先、scam フィルタ）を移植。
- **C3** `attempt() run.sh:75-101`: PR artifact → N3 で proof 生成 → `poidh.submitClaim`。`attempts.jsonl` schema: `pr` → `{bountyId,claimId,tx,uri}`。
- **C4** `track() run.sh:103-151`: `gh pr view`(134) → `poidh.bountyState` で accepted poll。accepted→`poidh.pendingWithdrawal`>0→`poidh.withdraw()`→tx。
- **C5** settle `run.sh:146-149`: `founder-loop/record-earn.mjs`（Base USDC ERC20 のみ検知）→ **N2 native-verify で ETH 着金確認** → `earn/lib/record.mjs` で計上。
- **C6** `identity-guard.mjs:30-67` の `ALLOWED_EARN_SOURCES` に **`poidh` 追加**（無いと record 拒否）。`assertOwnEarnSource('poidh')` を通す。

loop 配線:
- **C7** claude-p の実行系に bounty slot を追加。現状 `ANICCA_SLOT_ALLOWLIST=x402_sell`（plist）→ bounty を許可 slot に追加、または bounty 専用 tmux core（`bounty-cli.sh`）を healthcheck plist で常駐。gate=`registry-enforce.sh`。
- self-improve/heal は既存（evaluator.py / bounty-healthcheck.sh / lessons.jsonl）を流用、rail 差し替えに追随。

---

## Legacy poidh mechanism TEST MATRIX

| # | シナリオ | 判定（実測） |
|---|---|---|
| T1 | `poidh.listOpenBounties('base')` | Base の実 open bounty 配列が返る（≥1件、amount_eth>0） |
| T2 | proof 生成 N3 | blockrun_image→画像→IPFS uri が実在（gateway で開ける） |
| T3 | gas 前提 | claude-p Base ETH ≥ createClaim+withdraw 見積 gas。不足なら USDC→ETH swap（cap $2）を実行し残高増を確認 |
| T4 | `submitClaim` | createClaim tx が `status=0x1` で確定（Basescan tx hash） |
| T5 | native-verify N2 | 既知の ETH 着金 tx で `ethInflowForTx` が正の ETH を返す（既存 basescan tx で逆算検証） |
| T6 | accepted→withdraw | accept 発生時 `withdraw()` tx 確定→wallet ETH 残高が増える（before/after delta>0） |
| T7 | record | `record.mjs` が `external:true profitable:true` で ledger に1行。source=poidh が identity gate を通過 |
| T8 | loop 自走 | `launchctl kickstart` 発火→loop 単独で T1→T7 を回す（人間介入ログ 0） |
| T9 | negative | scam bounty（実体なし/撤回済）を gate が落とす。prompt-injection を含む description を弾く（INV-6） |

T1-T9はpoidh mechanismだけを検証する。現行bounty/work loopのdoneや外部収益には数えない。

---

## 現行PHASE（各phaseにexit proof。greenまで次へ進まない）

- **Phase 0 — rail/spec確定**: primary=huntr、secondary=fresh Opire/Algora、scale=crypto audit、poidh=mechanism参照。
  exit proof = 本文・GOAL・TODO・RAILにAlgora-primary/poidh-incomeの矛盾が0。
- **Phase 1 — paid-scope + autonomy**: B1/B2をTDDで完成。exit proof = funded target fixtureとlive targetの両方で
  scope/freshness/novelty gateが通り、非対話passがtimeout/budget内で完走。
- **Phase 2 — live submit**: B3を実行。exit proof = provider submission ID/URL + 保存artifact + track state。
- **Phase 3 — external payout**: accept後にB4を通す。exit proof = provider payout evidenceまたはtx hash + 実受取 +
  write-path再検証log + 重複なしledger行。ここまでearnは¥0。
- **Phase 4 — repeat + scale**: B5。exit proof = 2件目の外部payoutまたは黒字期間の再現後、crypto audit/他agentへ展開。

---

## 実測ログ（発見を書き足す。古い記述は消して是正）

- 2026-07-18: claude-p Base gas = **0.0000089 ETH ≈ $0.026**（USDC $10.10 は gas 不可）。→ Phase 0 の1-3 tx には足りるが loop 継続に gas 補給(T3)が必須。
- 2026-07-18: `_shared/lib` に **native ETH inflow 検証器は存在しない**（EVM は USDC ERC20 専用）。→ N2 が Phase 0 の必須実装。
- 2026-07-18: `identity-guard.mjs ALLOWED_EARN_SOURCES` に poidh/bounty 無し → C6 必須。
- 2026-07-18: `skills/bounty/` に SKILL.md は存在しない。self-improve/heal は evaluator.py + healthcheck + lessons.jsonl の3要素で実装済。
- 2026-07-18: poidh 成果物は**画像 proof**（コード PR ではない）。AI 自己生成は blockrun_image で可能。gib.work がコード bounty 寄りだが API 未文書化。
- 2026-07-18 [Phase0 read side 完了, commit b971d51 未push]: poidh Base **LIVE = 307件中 71 open**（実測）。ABI 実名確定: `bountyCounter()`（`bountyCount` は revert）/ `getClaimsByBountyId(uint256,uint256)` 2引数 / `bounties(id)` / `pendingWithdrawals(address)` / `createClaim(bountyId,name,uri,description)`。**罠**: `getBounties(offset)` は paginate せず同じ10件を返す → `bounties(id)` を Multicall3 で個別 scan（307 calls ~280ms）。RPC: llamarpc down、`base.publicnode.com`/`base.meowrpc.com`/`1rpc.io/base` が生存。
- 2026-07-18: **native-verify N2 実装済・T5 green**。手法 = balance-delta before/after block + self-pay 時の gas 足し戻し（`debug_traceTransaction` は Base 公開 RPC 全滅 -32601、Basescan V2 は API key 不在）。実 tx `0xba7792…78b4` で `ethInflowForTx`=0.1297 ETH を検出。19 テスト green。
- 2026-07-18: **blockrun_image ツールは grep で発見できず** → proof-gen N3 の画像生成 API は未確定（要 MCP 確認）。
- 2026-07-18 [gib.work 実地検証]: **③使えない**。payout=wallet-native/USDC/no-KYC で human-zero 適合だが、`api.gib.work/explore` total=426 中 **isOpen=true 4件・dev は1件のみ**（板の実態は Social Media 213/Misc 87）。accept=funder 裁量（PR merge 自動払いでない）。認証=Solana wallet 署名（OAuth/email 不要）。→ scale income rail にならず却下。primary を audit contest に確定。
- 2026-07-18 [rail 収束]: 全 rail 実測で確定 = human-zero+crypto+merit+実弾を同時に満たすのは **security audit（Immunefi always-on + Code4rena/Sherlock/CodeHawks contest）のみ**。loop の正体=自律 AI セキュリティ研究者。ゲート=valid finding 実力。scope 転換につき Dais 判断待ち。
- 2026-07-18 [Sol review verdict = **STOP-AND-REVISIT-RAIL**]: 7 blocking。#1 poidh 攻略前提破綻（proof=現地/original、AI 画像不可、sentinel は発注者側）#2 accept 8.6%・open の 55/71 が30日超で墓場・収益性ゲート不在 #3 Phase0 が rail を証明しない #4 record.mjs が caller 提供値を盲信＝done 捏造可 #5 balance-delta は偽陰陽性→event log を bigint wei で #6 gas 自己復旧デッドロック #7 鍵 broadcast 前防御。→ INV-8〜11 に昇格・rail 降格・Phase0 再定義で反映済。
- 2026-07-18 [71 open 全 dump・カテゴリ精査, Fable 実測]: AI が human-zero で勝てるのは **~10件のみ**（残りは現実世界/特定人物 proog）。AI 勝機案件: #263 "ship a real build"(0.0138ETH,claims2,純コード) / #107 "Farcaster Movie Trailer, Use AI"(0.0125ETH,claims3) / #237系 "tweet about \$Space proof=tweet URL"(claims0 多数, 0.001ETH) / #304 poem(claims9飽和) / #283 one question(claims1) / #301 NFT mint / #250 token split。→ **判定: poidh は mechanism 実証には最適だが income rail としては薄い**（大半 \$3〜40、accept は funder 依存）。zero-to-one の初ドルは取れる。scale($10k/月)は gib.work(コード/USDC)+audit へ pivot 必須。前提依存: tweet系は X/Farcaster account が要る（claude-p は未保有→要確認）。

## OPEN RISK / honest gap

- ★2026-07-18 最大リスク: poidh の open bounty の多くが**現実世界/社会的 proof 型**（"Interview a Politician", "Be A Freedom Fighter", "tattoos"）で、自律 AI が勝てない。71 open のうち **AI が human-zero で勝てる digital/creative 系（meme/art/generative）が何件あるか未精査**。ここが薄いと poidh は income rail として死ぬ（mechanism は実証できても金にならない）。→ Sol review + カテゴリ精査で判定。薄ければ rail を gib.work/audit に前倒し。
- poidh accept は funder 依存 = 着金タイミングを loop が制御できない。→ 「submit 完了」を earn と誤報告しない。多数の open bounty に低コストで claim し accept 率を稼ぐ設計にする。
- poidh 小額 = $10k/月には遠い。zero-to-one 用。volume は Phase 3 の audit/gig.work。
- gib.work API 未文書化 = Phase 2 で reverse-engineer 別タスク。
- gas 枯渇で loop 停止のリスク → T3 の自動 gas 補給を Phase 2 で必須化。
