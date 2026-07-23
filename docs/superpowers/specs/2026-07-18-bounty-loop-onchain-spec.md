# SPEC: bounty/work loop — paid-scope first、verified payout only

status: ACTIVE / 実行主体 = agent自身のdurable loop
研究の土台 → `2026-07-18-bounty-loop-research-and-design.md`。
spec は SSOT。発見のたび本文を実測値に書き換える。

## 現行決定

- **strict human-zero primary = x402 sell**。直近30日の実決済需要、wallet直接決済、agent側KYC不要を同時に確認できる唯一のrailとして扱う。
- **bounty loop = research/PoC engine + rail monitor**。脆弱性発見能力は維持するが、利用規約・KYC・live在庫・wallet受取の全gateを通るrailが現れるまで自動提出しない。
- **Immunefi = NO-GO**。実需要とno-KYC programはあるが、Websiteへのrobot等による自動accessをTermsが禁止する。書面許可なしに無人submitしない。
- **Sherlock / CodeHawks / 0xWork = monitor**。報酬実績はあるが、現在のeligible open supplyが継続loopを支えるほどない。
- **Dealwork = training only**。agent APIは使えるがowner要件があり、agent accountのwithdrawal APIも禁止されるため、strict human-zero crypto railに数えない。
- submit、PR、finding、accept待ちはearnではない。第三者からagent walletへの実着金を再検証するまで収益は¥0として扱う。

---

## STATUS（実装済み vs 残タスク）

**記録済みの実装・検証証拠:**
- CORE HUNTER（monitor→scan→analyze→novelty）とsubmit/track/record/self-improveのコード、74テストgreen。
- 個人repoでnovel sandbox escape、huntr paid scopeのBentoMLでDockerfile command injection PoCを実再現。
- poidh read lib + native-verify、19テストgreenと既知txの0.1297 ETH検出。これはcrypto mechanism参照であり収益証明ではない。
- Algora batch実走はdiscover 63→survivor 0→earn 0。飽和済みPR型batchを主railにしない根拠として保持する。
- B1 demand scoutはpayer signalがないcallを需要から除外し、`calls × median price ÷ listings`で供給調整する。live CDP Bazaar 24,802 listingsで340,350 calls・40,084 payer signals・8 paid-demand categories、test 155/155 green（anicca `c35afe2b`）。
- B2 image resaleは`POST /image`、sale $0.03、fixed upstream `zai/cogview-4`、live quote $0.017751、gross margin $0.012249/request。buyer決済gate→agent wallet上流決済→URL納品、quote cap/float/daily cap/secret isolationを維持する（anicca `a60ba2df`）。
- B3 distributionは完了。3店のimage launchd/public 402に加え、x402scanの公開listingへ`POST /image`・$0.03を掲載し、wallet別`attempts-*.jsonl`へprompt/headerを含まない402 telemetryを保存する。全x402 suiteはfresh 185/185 green。

**残タスク（上から1件ずつ実装）:**

| # | 残タスク | done条件 | 依存 |
|---|---|---|---|
| B4-I | **multi-channel sale observer + payout recorder実装** | image sales telemetry、the402、ClawMerchantsを自動pollし、販売候補を正規化する。候補txをBase finalized receiptから再検証し、第三者USDC売上だけをwallet別ledgerへexactly-once記録できる。実buyerを待つ前に実装・自動起動まで完了する | B3 ✅ |
| B4-V | **first external sale E2E verify** | SELF_WALLETS以外のbuyerが購入し、納品、finalized USDC着金、販売telemetry照合、ledger 1行、positive net marginを実測する | B4-I |
| B5 | **repeat + scale + bounty monitor** | 別の第三者buyerによる2件目の黒字payoutを記録し、first settle後のBazaar indexを確認する。全gateを通るbounty railが出た時だけsecurity pipelineを有効化する | B4-V |

**critical path = B4-I → B4-V → B5**。待機を作業にしない。B4-Iを先に完成し、その後はdurable observerを動かしながらbuyer acquisitionを1施策ずつ進める。B1/B2/B3は完了。human identity/KYC/owner credentialが必要なrailは、このstrict laneから分離する。

---

## GOAL（検証可能な done）

**agentのloopが、人間ゼロで実決済需要を発見し、需要に合うx402商品をbuild/list/serveし、第三者buyerからagent自身のwalletへ
外部payoutを受け取り、検証済みledgerへ記録して繰り返す。bountyは全gateを通った時だけ追加の供給源になる。**

done（AND、全て実測で確認）:
1. B1 gateがrecent paid calls・payer signals・live category・supply-adjusted opportunityを証明する。
2. B2がautomation・identity・wallet settlement・positive unit marginを確認して需要カテゴリに対応する商品を作り、B3がpublic x402/MCP endpointとlisting evidenceを残す。
3. 外部buyerが商品を購入し、serve-v2の既存payment middlewareがverify+settleする。
4. **報酬が実際に着金**し、B4 write-pathが受取人・金額・通貨・外部payer・重複なしを再検証する。
5. 上記がdurable loopの自走で再現し、次の需要または改善へ戻る。1件で停止しない。

**盛らない**: submit、merge、accept、providerの「支払予定」は収益ではない。実受取を確認するまでearn計上しない。

---

## 不変条件（MUST。破ったら罪）

- INV-1: earn は **external on-chain tx を自分で検証した時のみ** 計上。self-report・署名検証・提出数は earn ではない。
- INV-2: 秘密鍵は wallet.json から直接読み、stdout / log / payload に一切通さない。漏れたら即 rotate。
- INV-3: claude-p の wallet からの支出は **gas のみ**（bounty 出資はしない、我々は earner）。gas 補給は USDC→ETH swap を cap $2 以内で自己実行。
- INV-4: identity gate — record は claude-p 自身の wallet 宛の着金のみ。他人の wallet を混ぜない（`assertOwnIdentityOnly`）。
- INV-5: poidh contract は `msg.sender==tx.origin` を強制 → **EOA のみ**。claude-p EOA を使う。SC wallet 不可。
- INV-6: prompt-injection 防御を維持（既存 `run.sh:217` の config-exfil regex を on-chain 版でも保持。bounty の description は敵性入力として扱う）。
- INV-7: loop は launchd 本体。Fable は executor を spawn して代行しない（コードを直す時だけ executor）。実行主体は本物の loop。
- INV-8 [Sol#4]: **record write-path 自身が着金を再検証する**。caller 提供の `external/profitable/amount/status/tx` を証拠として受理しない。write-path で finalized receipt + chainId(Base=8453/Sol=mainnet) + 正しい contract + 自 wallet 宛の payout event + 第三者 issuer/funder + 未記録 tx を検証してから計上。
- INV-9 [Sol#5]: 着金額は **payout event の receipt log を bigint wei で**検証（EVM は `Withdrawal`/`WithdrawalTo`、Solana は SPL transfer）。balance-delta は補助のみ（同一 block の他 tx / self-pay gas 差引で誤る）。number 化で精度を落とさない。
- INV-10 [Sol#6]: gas 自己復旧に **recovery floor** を置く。approve+swap+withdraw の上限 gas を残す残高を下回る前に補給。ETH 枯渇後に swap gas を払えないデッドロックを防ぐ。swap は chain/router/recipient allowlist + exact-in 累積 $2 上限 + minOut + exact allowance + receipt/残高差検証。bootstrap 不能なら claim を止める。
- INV-11 [Sol#7]: 秘密鍵は N1 内 in-process signer だけが固定 0600 file から読む。argv/env/child process/例外 dump に一切通さない。導出 address を 自 wallet に pin。全 broadcast 前に chainId/contract/sender/recipient を検証、withdraw 先は own wallet 固定。

---

## RAIL 決定

| rail | 採否 | 理由 |
|---|---|---|
| **x402 sell** | **primary / GO** | x402scanで直近30日15.87M tx・$741.58K・36.05K buyers・75K sellersを確認。wallet直接settlement。3店のimage listing/402 telemetryは成立し、external paid conversionの検証が次 |
| **Immunefi** | **NO-GO for automation** | 190 programs、82 no-KYC、paid実績はある。一方Termsがrobot等によるWebsite accessを禁止するため、書面許可なしの自動submitはしない |
| **Sherlock / CodeHawks** | monitor | payout実績はあるが、Sherlockのrecent finished 20件は全KYC、CodeHawksのlive public contestはjudging中でopen supply 0 |
| **0xWork** | monitor | 累計510 tasks / 369 completed / $8,014.23 paidだが、current openは2件・$100だけで継続供給不足 |
| **Dealwork** | training only | public jobsは低単価・高競合でowner要件あり。agent wallet withdrawal APIは403でstrict wallet-direct条件を満たさない |
| **huntr / Opire / Algora / H1 / Bugcrowd** | gated research | policy、KYC、live paid scope、受取経路をrailごとに再実測し、全gateがtrueの時だけ有効化 |
| poidh (Base) | mechanism reference | on-chain lib/native-verifyを再利用。accept率・案件構成のためincome railにはしない |
| gib.work / Superteam / IssueHunt系 | disabled | live在庫、accept裁量、人間claim、停止サービスのいずれかで継続income条件を満たさない |

### Demand gate（AND。1つでもfalseならbuild/submitしない）

1. recentに第三者の実決済または実payoutがある。
2. 現在購入されるproduct category、またはagentがclaim可能なlive workがある。
3. Terms/APIがautomationを許可する。
4. human credential・owner操作・KYCを日次loopに要求しない。
5. agent自身のwalletへ直接settleでき、write-pathで検証できる。
6. 予想収益がcompute・gas・listing costを上回る。

根拠: [x402scan](https://www.x402scan.com/) は30日集計とcategory別merchantを表示する。[Immunefi programs](https://immunefi.com/bug-bounty/) はprogram・KYC・paid statusを公開する一方、[Immunefi Terms](https://immunefi.com/terms-of-use/) はrobot等によるWebsite accessを禁止する。[Sherlock contests](https://audits.sherlock.xyz/contests) と [CodeHawks contests](https://codehawks.cyfrin.io/contests) はcontest状態を公開する。[0xWork stats](https://api.0xwork.org/stats) はtask/payout集計を返す。[Dealwork Terms](https://dealwork.ai/terms) はagentにresponsible human/legal-entity ownerを要求する。

---

**★2026-07-19 prove-3（variant-analysis, 実 novel vuln 狙い）= 狩場を実測で確定★**: 結果=ML-loader 面では negative だが2つの重要収穫。(1) **variant-analysis の手法は有効**（種=CVE-2024-34359 の fixed-pattern `ImmutableSandboxedEnvironment` vs anti-pattern `Environment(` grep で、llama-cpp-python/guidance/xinference/tabbyAPI/litellm/aphrodite/sglang/outlines の全 sink を数分で patched/unreachable に分類）。(2) **ML-model-loader 金脈は mined out**（SSTI→全員 transformers sandbox 委譲、zip/tar/pickle→Python 3.12-3.14 runtime 緩和、torch weights_only）。→ prove-1/2/3 は全て**荒らされた ML ローダ面**を掘っていた。**正しい狩場を確定: MCP server / agent framework（2024-25 新興・低監査、CVE wave 前）の tool handler の command injection / path traversal / SSRF、および template が tool/request 由来(model file でない)の SSTI**。次の種 = 2025 の MCP-server/agent-framework CVE の fix commit → sibling 実装を grep。**loop の target domain を ML-loader → MCP/agent 面に pivot。手法(variant-analysis triage)はそのまま流用。** vuln 発見は numbers game = 単発 prove でなく continuous loop が fresh な MCP/agent 面を grind して当てる設計に。

**★2026-07-19 LOOP が end-to-end 実証 + 唯一残る money-gap 確定★**: CORE HUNTER(monitor→scan→analyze→novelty)+後半(submit/track/record/self_improve) 実装完了・**74テスト green(Fable 再実行)・push 済(feature/bounty-hunter)**。候補→PoC subagent が **本物の NOVEL sandbox-escape を1件仕上げ、Fable が再実行で実観測**: `ashokraj2011/singularity-platform` mcp-server の CWE-59 symlink-follow→sandbox escape（`apply_patch` で symlink 植込み→`read_file`/`write_file` が realpath 未検証で vault 外 read+write→RCE、High）。control BLOCKED→symlink 後 secret read+authorized_keys write を実証。他候補は honest に false-positive 棄却（こじつけ無し）。→ **loop が自律で本物 novel vuln を出せることは実証済み。** ★唯一残る money-gap = **払う scope へのターゲティング**★: この finding は 2★ 個人 repo=funded bounty scope 外=CVE クレジットのみ・現金にならない。**[0]MONITOR+[1]SCORE に「pay-scope フィルタ」が必須**（huntr OSV 対象 / SECURITY.md に bounty / Immunefi 掲載 / 高 profile・funded を優先）。「vuln を見つける」は解決、「payする標的を狙う」が次で最後の鍵。record.py は実 identity-guard に huntr 拒否されるのを確認済(PATCHES.md で塞ぐ)。

**★2026-07-19 prove-5: 払う標的で novel vuln 確保（Fable 再実行 verify）★**: BentoML(huntr 現金 rail, PANW スポンサー)の Dockerfile command injection(`docker.env` dict 形式→検証バイパス→生成 Dockerfile に RUN 注入→host RCE)。実 PoC で `id` 実行を実観測。約1時間で確保。→ **「払う established lib で novel を出す」は現実的と実証。** 唯一の bottleneck = first-to-report collision(hot 標的は他リサーチャーの private pending が掃討中)。**勝ち筋 = loop が全 huntr-payer を毎日 grind(speed+scale=先着) + self-improve で hot/掃討済 面を回避。** = $10k の道。残: huntr account/identity + 無人化(launchd) + 提出。

## ★LOOP 設計 v3（demand-first、human-zero hard gate）★

勝ちの公式は **外部収益 = 実需要 × discoverability × conversion × margin**。securityのnoveltyはbounty branch内の品質指標であり、rail適格性の代わりにならない。

```
                 ANICCA EXTERNAL-INCOME LOOP
                 first threshold = 第三者からagent walletへ $1。done=着金のみ

[0] DEMAND SCOUT  x402scan paid volume/buyers/categories + eligible bounty inventory
         └──► recent paid demandだけ queue へ
              │
[1] HARD GATE  paid? live? automation allowed? no KYC? wallet direct? margin positive?
       │ true                                      │ false
       v                                           └──► monitor only / compute $0
[2] BUILD  x402 product: copy+tweak proven category → deterministic test → serve-v2
       │     bounty: research/PoC only; eligible railがある時だけsubmit branchを開く
[3] DISTRIBUTE  MCP/direct endpointを需要のあるdirectoryへ掲載
              │
[4] SERVE→SETTLE  buyer X-PAYMENT → serve-v2 verify+settle once → agent wallet
              │
[5] VERIFY  finalized tx + external payer + amount + dedupe → earn ledger
       │
[6] SELF-IMPROVE  demand/conversion/revenue/computeを比較 → product/price/listing更新 → [0]
```

**build phase**: (P1) demand scout完了。(P2) image resale build完了。
(P3) public MCP/direct listingを増やし、402→purchase conversionを計測。(P4) external inflowをwrite-pathで検証。
(P5) 黒字商品だけ複製し、bountyはDemand gateを全通過したrailだけ有効化する。

## B4-I / B4-V / B5 implementation-first specification

### 1. Overview（What & Why）

外部buyerは同期的に制御できないため、購入を待ってから検知・検証系を作るとloopが停止する。先に全販売チャネルのsale observer、Base settlement verifier、exactly-once ledger、継続acquisition controllerを完成・常駐させる。その後の待ち時間はobserverが所有し、agent本体は新規requestへの入札とbounded acquisitionを1施策ずつ続ける。

### 2. Acceptance Criteria

1. observerはimage telemetry、the402 jobs/threads/earnings/product、ClawMerchants asset/transactionsを人間操作なしで定期pollする。
2. 各sourceの販売候補を`source / source_sale_id / offer_id / tx / expected_pay_to / expected_usdc_atomic / observed_at`へ正規化し、秘密鍵、prompt、payment header、buyer briefを保存しない。
3. marketplaceの`paid`、`delivered`、`amount`自己申告だけではledgerへ書かない。B4 write-path自身がBase chainId 8453、finalized block、成功receipt、USDC contract、Transfer event、payTo、atomic amount、external payer、sales provenanceを再検証する。
4. source sale IDとtxの両方でdedupeし、再起動・API重複・同一tx再取得でもwallet別ledgerは1行だけ増える。
5. 新規the402 postingは既存hard gateに一致する時だけ自動入札し、既存Moltbook postへの重複宣伝は行わない。売上0の間もobserverとacquisition controllerが独立して動く。
6. 1件目の実売上で納品、着金、ledger、net margin、Bazaar index checkを実行し、別buyerの2件目でrepeatを証明する。

### 3. As-Is / To-Be（3 implementation ideas、上から1件ずつ）

```text
TO-BE x402 SALES SYSTEM
├── IDEA-1 Sale Observer（COMPLETE）
│   ├── image sales telemetry adapter
│   ├── the402 jobs / threads / earnings / product adapter
│   ├── ClawMerchants asset / transactions adapter
│   ├── normalized sale candidate store（0600・秘密情報なし）
│   └── launchd polling + first-sale notification
│
├── IDEA-2 Finalized Settlement Recorder（COMPLETE）
│   ├── source sale ID / offer ID / tx provenance match
│   ├── Base finalized receipt verification
│   ├── USDC Transfer / payTo / atomic amount verification
│   ├── SELF_WALLETS / protocol return rejection
│   ├── wallet ledger exactly-once append
│   └── revenue - compute - gas - platform cost = net margin
│
└── IDEA-3 Acquisition + Repeat Controller（COMPLETE）
    ├── eligible the402 request auto-bid
    ├── product / listing / comment conversion poll
    ├── no-sale時は1 cycle 1 acquisition action
    ├── 1回につきprice・copy・channelの1要因だけ変更
    ├── first external sale後にBazaar index確認
    └── second independent buyerまでloop継続
```

実装フォルダーツリー:

```text
skills/earn/x402-sell/
├── IDEA-1 Sale Observer
│   ├── sale-observer.mjs
│   ├── sale-observer-boot.sh
│   ├── lib/sale-observer.mjs
│   ├── launchd/ai.anicca.x402-sale-observer.plist
│   └── __tests__/{sale-observer,sale-observer-wiring}.test.mjs
├── IDEA-2 Finalized Settlement Recorder
│   ├── settlement-recorder.mjs
│   ├── settlement-recorder-boot.sh
│   ├── lib/external-inflow-recorder.mjs
│   ├── launchd/ai.anicca.x402-settlement-recorder.plist
│   └── __tests__/{external-inflow-recorder,settlement-recorder-wiring}.test.mjs
└── IDEA-3 Acquisition + Repeat Controller
    ├── acquisition-controller.mjs
    ├── acquisition-controller-boot.sh
    ├── lib/{acquisition-controller,the402-bidder,the402-inbox,the402-worker}.mjs
    ├── launchd/{ai.anicca.x402-acquisition-controller,ai.anicca.the402-worker}.plist
    └── __tests__/{acquisition-controller,acquisition-controller-wiring,the402-bidder,the402-inbox,the402-worker}.test.mjs
```

IDEA-1〜3はCOMPLETE。3 sourceを5分間隔でpollし、許可済みfieldだけのcandidateを0600 storeへsource sale ID + txでdedupeする。独立recorderはcandidateをBase finalized receipt、成功status、USDC Transfer、own payTo、atomic amount、external senderと再照合し、wallet ledgerもsource sale ID + txでexactly-onceにする。acquisition controllerは新規eligible postingを1 cycle最大1件だけdurable inboxへ投入し、既存workerがidempotent bidを実行する。残作業はExecution Steps 4–5の実第三者E2Eだけ。

### 4. Test Matrix

| # | To-Be | Test | Cover |
|---|---|---|---|
| I1 | 3 source adapter | 各公式responseから許可済みfieldだけを正規化し、無関係sale・別asset・欠損txを棄却 | OK必須 |
| I2 | secret isolation | credential/prompt/payment header/buyer briefがcandidate・stdout・logへ出ない | OK必須 |
| I3 | finalized verifier | failed/unfinalized/wrong chain/wrong contract/wrong payTo/wrong amount/self senderを全棄却 | OK必須 |
| I4 | exactly-once | 同じsource sale/txの再取得、再起動、競合writerでもledger 1行 | OK必須 |
| I5 | durable polling | launchd再起動後もcursorを失わず、新規saleだけを処理 | OK必須 |
| I6 | acquisition guard | 重複post、budget外、無関係request、expired/awarded requestへ副作用なし | OK必須 |
| E1 | first real buyer | 実第三者購入→納品→Base finalized USDC→ledger→positive margin | 実E2E必須 |
| E2 | repeat | 別buyerの2件目→別tx→2行目→positive margin | 実E2E必須 |
| E3 | distribution amplification | first settle後のBazaar/agentic.market index/search結果または外部blocker | 実E2E必須 |

### 5. Boundaries

- DO NOT self-pay、wallet間送金、wash trade、購入依頼、報酬付きbuyer誘導でE1/E2を作る。
- DO NOT marketplace status、listing、bid、award、escrow、未finalized txを収益に数える。
- DO NOT `serve-v2.mjs`、既存Funnel mount、private key運用を変更する。
- bountyは現行critical pathへ戻さず、Demand gate全通過までmonitorだけにする。

### 6. Execution Steps

1. ✅ IDEA-1を実装し、3 sourceのlive readとdurable pollを起動する。
2. ✅ IDEA-2を既存image recorderへ接続し、全negative gateとexactly-onceをgreenにする。
3. ✅ IDEA-3を既存the402 workerへ接続し、売上0でも新規需要の探索・入札・conversion計測を継続する。
4. E1の実buyerをobserverが検出したら、納品・finalized settlement・ledger・marginを実測する。
5. E2の別buyerまで継続し、E3のBazaar indexを確認してB5を閉じる。

| Item | Value |
|---|---|
| UI変更 | なし |
| E2E判断 | Maestro不要。実API、launchd、Base finalized receipt、ledgerを本番E2Eで判定する |

## 実装（旧: poidh crypto-rail 用参照。crypto payout phase で再利用）

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

## TEST MATRIX（E2E judgment。各行 real side-effect を自分の目で）

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

E2E green = T1-T9 全通過 + done 1-4 の on-chain 着金を Fable が Basescan で確認。

---

## PHASE（各 phase に exit proof。green まで次に進まない）

- **Phase 0 — rail/spec確定**: primary=x402、bounty=research/monitor、Immunefi automation=NO-GO。
  exit proof = 本文・GOAL・TODO・RAIL・ASCIIにsecurity-audit-primaryの現行主張が0。
- **Phase 1 — demand scout（COMPLETE）**: fixtureのpayer 0をNO-GO、live x402 dataをGOと判定。supply-adjusted score、live served category整合、155/155 green、commit `c35afe2b`。
- **Phase 2 — product + distribution（COMPLETE）**: image productの需要・unit margin・185/185 green、3店のlaunchd/public 402、x402scan listing URL、wallet別request telemetryを確認。
- **Phase 3 — external payout（ACTIVE: B4-V real-buyer verification）**: B4-Iのmulti-channel observer、finalized recorder、acquisition controllerは完成・常駐済み。durable loopでB4-Vを待受する。exit proof = 実buyerのtx hash + finalized receipt + external payer + write-path再検証log + 重複なしledger行。ここまでearnは¥0。
- **Phase 4 — repeat + scale**: B5。exit proof = 2件目の外部payoutまたは黒字期間の再現。eligible bounty railがなければx402だけを拡張する。

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
- 2026-07-18 [gib.work 実地検証]: **③使えない**。payout=wallet-native/USDC/no-KYC で human-zero 適合だが、`api.gib.work/explore` total=426 中 **isOpen=true 4件・dev は1件のみ**（板の実態は Social Media 213/Misc 87）。accept=funder 裁量（PR merge 自動払いでない）。認証=Solana wallet 署名（OAuth/email 不要）。→ 継続income railにならずdisabled。
- 旧rail仮説の訂正: security auditがhuman-zero+crypto+実需要を同時に満たすという判断はfalse。Immunefiのautomation禁止、Sherlockのrecent KYC、CodeHawksのopen供給不足を後続実測で確認する。strict laneのprimaryはx402 sell。
- live market実測: x402scanは直近30日15.87M tx・$741.58K volume・36.05K buyers・75K sellers、24h active merchants 2,778を表示する。需要はmodel routing、social data、enrichment/search、RPC/onchain data、voice、trading dataへ集中する。一方、Aniccaのclaude-p/franklin1/franklin2は48h external USDC inflowがすべて$0。市場不在ではなくproduct/distribution未成立として扱う。
- B1 live verify: CDP Bazaar 24,802 listingsを全page取得し、30d 340,350 calls・40,084 payer signals・8 paid-demand categoriesでgate=true。served=`search,data,llm`。供給調整後の未提供候補はdefi 0.092695、audio 0.073828、image 0.04527。payer signal 0は候補から除外する。
- B2 live verify: paid image competitorには実buyer signalがあり、BlockRun direct quoteはCogView 1024x1024で402/$0.017751。Aniccaの未決済POSTは3店とも402、buyer amount=30000、正本resource=`/image`。sale $0.03からupstream $0.017751を差し引くunit marginは$0.012249で正、`serve-v2.mjs`は無変更。
- B3 franklin1 live verify: `launchctl print gui/501/ai.anicca.image-franklin1`はrunning。`https://aniccanomac-mini-1.tail7a0ba4.ts.net/image`への未決済POSTはpublic 402、amount=30000、payTo=`0x3EcCAD24794ca298D25378E9902A251322ea8749`、resourceは同URL。Funnel `443`の既存`/mcp`=400も維持する。Tailscale公式仕様はFunnel公開ポートを443/8443/10000だけに限定するため、構成表示だけ残る10001は不採用（https://tailscale.com/docs/features/tailscale-funnel#limitations-and-restrictions）。
- B3 franklin2 live verify: `launchctl print gui/501/ai.anicca.image-franklin2`はrunning。`https://aniccanomac-mini-1.tail7a0ba4.ts.net:10000/image`へのpublic未決済POSTは402、amount=30000、payTo=`0xe7747Fd899D8987821Bb4CB3D6aDf22565F87ce9`、resourceは同URL。Funnel `10000`の既存`/mcp`=400を維持する。
- B3 claude-p live verify: `launchctl print gui/501/ai.anicca.image-claude-p`はrunning。`https://aniccanomac-mini-1.tail7a0ba4.ts.net:8443/image`へのpublic未決済POSTは402、amount=30000、payTo=`0x810F6D61F7606dEEE2657d3083E150a222Bc29C5`、resourceは同URL。Funnel `8443`の既存`/mcp`=400を維持する。
- B3 directory verify: x402scan公開listingで3店すべての`POST /image`・`$0.03`とAgentCash CTAを確認する（[franklin1](https://www.x402scan.com/server/7e8ebdc1-7c3d-419f-b76b-e41bab7bb86c)、[franklin2](https://www.x402scan.com/server/af9283bc-b1f8-4e50-b474-abb1f5d082e0)、[claude-p](https://www.x402scan.com/server/439753c7-81e9-4c3e-b383-3be9c7377d9e)）。SIWX署名による無料再登録であり購入・送金なし。
- B3 telemetry verify: 3 image LaunchAgentはrunning。各公開URLへの未決済POSTは3/3で402を返し、各agent固有walletの`attempts-<payTo>.jsonl`へ`route=/image, price=$0.03, payer=null, settled=false, status=402`を保存する。prompt/payment headerは保存しない。未決済attemptなので売上は$0 / ¥0。
- B4 recorder ready: imageの成功settlementはx402 `SettleResponse.transaction`をwallet別sales telemetryへ残す。recorderはそのtxとの一致を必須にし、Baseの`finalized` head、receipt `status=0x1`、USDC contract、ERC-20 `Transfer(from,to,value)`、正確なpayTo、SELF_WALLETS/protocol return除外をRPCから再検証して`external-inflows-<payTo>.jsonl`へcase-insensitive tx dedupeで記録する。任意の外部depositと未決済402 attemptは記録できない（anicca `111eda0f`,`6e4477e9`、fresh test状態は下記）。
- B4 primary-source basis: [Ethereum Execution APIs — eth_getBlockByNumber](https://github.com/ethereum/execution-apis/blob/main/docs-api/api/methods/eth_getBlockByNumber.mdx) は`finalized`を通常reorgされないcrypto-economically secure blockと定義し、[eth_getTransactionReceipt](https://github.com/ethereum/execution-apis/blob/main/docs-api/api/methods/eth_getTransactionReceipt.mdx) は`status=1`をsuccessと定義する。[ERC-20](https://eips.ethereum.org/EIPS/eip-20#events) はtoken transferをindexed `from/to`と`value`を持つ`Transfer` eventで規定する。
- B4 live verify: 3 walletを48h scanし、blocks `48896974..48983374`で全て`inflows=0, selfPay=0, EXTERNAL=0, externalUsdc=0`。6つのimage/MCP LaunchAgentはrunning、public imageは3/3で402、public MCP no-sessionは3/3で400。実収益は$0 / ¥0であり、B4は未完。
- REGRESSION RESOLVED: credential isolation testがdefault spend stateを共有し、反復実行で日次capへ達してpaid fetch前に503となるtest汚染をRED再現する。image/LLM両testはstateを隔離し、受信Authorization/Cookie/X-API-Keyを与えた上で上流headerが`Content-Type`/`PAYMENT-SIGNATURE`/`User-Agent`だけであることを検証する。productionと`serve-v2.mjs`は無変更（anicca `f63cbda8`）。全x402 suiteはfresh 185/185 PASS。
- B4 discovery verify: Agentic Market APIはAniccaを自動掲載済み（同一hostnameの13 endpoint、franklin1別名の3 endpoint）。imageの正本URLは443 `/image`、`:10000/image`、`:8443/image`であり、3本とも公式validatorでHTTPS・HTTP 402・x402 v2・Bazaar extensionがgreen。ただし全て`found=false`で、公式UIの説明どおり最初のverify+settle後までBazaar検索には出ない。`franklin1/franklin2/claude-p.tail7a0ba4.ts.net/image`はimage Funnel mountを持たず404なのでdistribution URLに使わない。自己決済でindexを作らない。
- B4 acquisition baseline: AgentCashの`search`/`--broad`で`generate image`・`image generation`・`create an image`を各top50まで実行しても3店は0件だが、origin直接`discover`は3/3で`POST /image`・変更前`0.05 USD`を返す。Agent402の`POST /api/route`では`generate image`が同score=14・health=1の価格順で22–24位、他2 queryはtop25外。ソース: [AgentCash — Discovering endpoints](https://agentcash.dev/docs/discovering-endpoints) / 核心の引用: 「When you don’t know which origin to use, start with `search`.」
- B4 acquisition experiment A1: actual buyer demandを持つimage検索面でdefault top20へ入れるため、単一要因をsale priceだけに限定して`$0.05 → $0.03`へ変更する。Agent402はcrawler refresh後に3店をrank 18–20、price=0.03、score=14、health=1で返し、default top20へ3/3入る。x402scan 3 listingとAgentCash direct discoveryも$0.03へ更新済みで、live cost差引後marginは+$0.012249/request。観測窓はBase finalized blocks `48982816..49026016`（約24h）に固定し、この間はprice/metadata/listingを追加変更しない。判定値はexternal finalized settlement、wallet別ledger、unit marginであり、crawler由来を含む未決済402 probeはbuyer demandや売上に数えない。ソース: [Agent402 x402-index.js](https://github.com/MikeyPetrillo/Agent402/blob/main/src/x402-index.js#L1232-L1242) / 核心の引用: 「Highest score first; healthier seller wins on ties; then cheapest KNOWN price」
- B4 acquisition experiment A1 checkpoint/pivot: finalized head `48983771`（窓の955/43,200 blocks、残り42,245 blocks）時点で、A1開始後の3店telemetryは合計753 attempts（うち`/image`は46）だが`settled=true=0, payer=0, tx=0`。3 walletのfresh recorderも全て`settledTelemetry=0, verified=0, recorded=0`で、売上ではなくcrawler probeだけを観測する。第三者決済を待つだけの運用を打ち切ってA2を直ちに開始するため、未完の24h窓は単一要因実験としての因果判定には使わない。image価格・metadata・listing自体は変更しない。
- B4 acquisition A2 live registration/listing/bid: fail-closed guardで`POST /v1/register`の`x402Version=1`、`exact`、Base、10,000 atomic USDC、resource、外部recipientを完全一致検証して実決済する。最初の成功responseを旧docsどおり`webhook_secret`必須としてparserが棄却し、idempotent再試行にも$0.01が発生するため登録費は合計$0.02、participantは`p_aba065d426a745d4`。再試行responseは`Wallet already registered`として既存API keyを返し、profileを`type=both`、専用webhookへ更新する。research service `svc_1c7ca3dd9de841b1`をprovider net `$3.00`（agent `$3.15`、fee 5%）、`automated_service`、delivery `10m`で公開し、open research posting `post_4031e5a29523480d`へ`$3 / 1h`で実入札する（`bid_59943a1581de430d`、公開bid count 9→10）。writing service `svc_128b02a7f3464be4`をprovider net `$2.00`（agent `$2.10`）、同じく10mで公開し、open HTTP 402 explainer posting `post_32714ee36ddb4e6b`へ`$2 / 1h`で実入札する（`bid_ad4356885ad34346`、公開bid count 10→11）。両serviceは`webhook_healthy=true`、両bidは`pending`。research+writing `$1–25`通知は`active`、`consecutive_failures=0`。登録費は外部platform支出であり収益ではなく、bid/award/escrowも収益に数えない。[the402 Provider Guide](https://the402.ai/docs/providers/#bidding-on-requests) / 核心の引用: 「201 = new bid, 200 = replaced or identical (idempotent)」
- B4 acquisition A2 competitive bid: 競合がresearch 10 bid / writing 11 bidのままawardされていないため、変更要因をbid priceだけに限定し、同じ2 bid IDを各requestの下限`$1 / 1h`へ実更新する。公式APIは両方`HTTP 200`、同じbid ID、`status=pending`を返す。catalog listing価格は`$3/$2`のまま変えない。自動bidderも新規一致案件をbase `$1`（request minが高ければmin）で入札し、workerを新codeでrunningにする。`$1` settlementのfee控除後は最大`$0.95`だが、実compute/gasを差し引いたfinalized settlementが無い限りmargin・収益には数えない。[the402 Provider Guide](https://the402.ai/docs/providers/#bidding-on-requests) / 核心の引用: 「200 = replaced or identical (idempotent).」
- B4 acquisition A2 instant product: open writing requestと同じ実需要をfulfillment待ちなしで買えるよう、881語・4 section・RFC/IANA参照付きTXT `HTTP 402 Payment Required: Beginner Field Guide`をdigital product `prod_653429e9dd234895`として実uploadする。provider price `$0.50`、公開buyer price `$0.525`、category `guide`、`HTTP 402` product searchは1件中rank 1、`total_purchases=0`。asset checksumは`aa5877d51c2992d50838a7835d55be00c0846d63fb764cb3e445fd56a59acaf6`。product listingは収益でなく、第三者購入とsettlementが出るまで売上は`$0 / ¥0`。[the402 Digital Products](https://the402.ai/docs/providers/#digital-products) / 核心の引用: 「Agents purchase via x402 or pre-funded balance and download the file.」
- B4 acquisition A2 current live verify: image/MCP/the402 receiver/workerのLaunchAgentは8/8 running、public imageは3/3=`402`、public MCPは3/3=`400`、the402両serviceは`webhook_healthy=true`。provider APIはjobs=0、threads=0、settled/held/pending=`0/0/0`、product purchases=0。3 walletのBase USDCをblocks `48947365..48990568`で24h scanし、全て`inflows=0, selfPay=0, EXTERNAL=0, externalUsdc=0`、recorderも`settledTelemetry=0, verified=0, recorded=0`。したがって実収益は`$0 / ¥0`のまま。
- B4 acquisition A3 agent-community distribution: `moltbook`の既存agent identity `anicca-wisdom`で、digital productの内容・価格・detail/purchase APIを明示した単発post [0e6b4bbc-d7a3-4172-9a8e-1a941edf0b6e](https://www.moltbook.com/post/0e6b4bbc-d7a3-4172-9a8e-1a941edf0b6e) をgeneralへ実公開する。ClawMerchants公開後は同じpostのcomment `dfedae0e-2a5e-406b-b154-4d16e3e39b3c`へ、無料3回・以後`$0.03` Base USDCのlive callable endpointを追記する。さらにbuyer discoveryを議論するagentfinance thread [e2a41994-6e1f-448f-bbc2-90bd39e28a75](https://www.moltbook.com/post/e2a41994-6e1f-448f-bbc2-90bd39e28a75)へ、live `$0.03` image endpointとexternal purchases=0を明記した関連comment `e80e59aa-eaf2-4920-9465-a6f2ee6fccc4`を1件だけ公開する。投票依頼・誇張・human loginを含めず、同一postへの重複宣伝をしない。product purchasesとprovider earningsが増えない限り売上は`$0 / ¥0`。
- B4 acquisition A4 ClawMerchants: 公式`POST /api/v1/providers`でagent provider `anicca-http402`をfranklin1 walletへ人間loginなしで実登録し、skill asset [54a0fabf-a95a-47bd-b2cc-81f3189430cb](https://clawmerchants.com/assets/54a0fabf-a95a-47bd-b2cc-81f3189430cb) を`per-query / $0.03`でactive公開する。881語assetを`PUT /v1/provider-data/:id`へ投入し、GETでbytes=5,674、sha256=`aa5877d51c2992d50838a7835d55be00c0846d63fb764cb3e445fd56a59acaf6`を一致確認する。exact searchは1件中rank 1。実APIはclientごとに1日3 free callsを返し、call 4で`HTTP 402`、price=`0.03`、currency=`USDC`、chain=`base`、chainId=`8453`、recipient=`0x3EcCAD24794ca298D25378E9902A251322ea8749`を返す。current `discoveryCount=5, totalPurchases=0, totalSales=0, totalEarned=0`。関連Moltbook comparison postへ売上0を明記したcomment `3ee91561-c81d-47c3-9e6f-a87861d9cc94`でlive assetを共有し、default one-timeからper-queryへ修正した事実をcomment `a37f9b99-5139-4a12-9468-3ed67e92eb9f`で訂正する。市場全体の公式実測は`17,236` probes、5 transactions、volume `$0.11`で、需要は小さいが非ゼロ。[ClawMerchants Agent Instructions](https://clawmerchants.com/agent-instructions.md) / 核心の引用: 「Payments are verified on-chain before delivery」。listing/probeは売上でなく、外部purchaseまでは`$0 / ¥0`。
- B4 acquisition rejected WasiAI: provider募集と90% shareは実在するが、公式説明はAvalanche C-Chain settlement + custodial earningsであり、Base finalized USDCというDone gateを満たさない。さらにWasiAIがbuyer paymentを先に受けて既存x402-protected endpointを呼ぶ構成は二重決済になるため応募しない。
- B4 acquisition A2 live webhook/fulfillment: 専用Funnel route `https://aniccanomac-mini-1.tail7a0ba4.ts.net/webhooks/the402`、receiver LaunchAgent、job worker LaunchAgentはrunning。現行の[provider integration guide](https://api.the402.ai/docs/provider-guide.md)はregistration responseを`participant_id/api_key/type/registered_at`として示し、receiver例は「`X-Platform-Secret` !== `THE402_API_KEY`なら401」とする一方、別のprovider pageはHMAC secretを記載し、実`/services/:id/test`は`X-Platform-Secret`を送らず取得不能のsecretで署名する。production eventはAPI-key完全一致を認証し、header不在時だけHMAC+timestampをfail-closed検証する。公式のunsigned `test:true` probeは期待service ID配列内のtest jobだけ無作用で200にし、durable inboxへ入れない。両serviceの公式testは`success=true, status_code=200, warnings=[]`。実jobだけSQLiteへACK前enqueueし、type-filtered lease workerが固定`https://api.the402.ai/v1/threads/<thread>/update`へ`in_progress/completed`を送る。buyer briefはlogへ出さず、許可済みserviceだけをtoolを持たないlocalhost OpenAI互換free-model ladderとservice別primary-source packetで生成する。researchは800–1200語、writingは600–900語・4 level-2 section・特定product/current eventなしをfail-closed検証する。writing実生成はRFC/IANAの該当sectionを抽出したpacketで833語・4 section・3 standards sourceがgreen。全x402-sell testはfresh 203/203 PASS。Node v25.6.1の`node:sqlite` ExperimentalWarningは継続する。[RFC 9110 §15.5.3](https://www.rfc-editor.org/rfc/rfc9110.html#section-15.5.3) / 核心の引用: 「The 402 (Payment Required) status code is reserved for future use.」
- B4 acquisition A2 repeatability: 同じworkerがdurable `request.created`をtype別leaseで処理し、detailを公式APIから再取得する。`research`かつx402/machine-payment/agent-payment一致、または`writing`かつHTTP 402/Payment Required一致だけを対象にし、budget ceiling `$25`、service ID、base `$1`またはrequest minのprice/ETAをfail-closed検証してidempotent bid endpointへ送る。無関係、expired/awarded、budget外は副作用なしでcompletedにするため、buyer briefをlogせず新規案件への発見→選別→入札を反復できる。[the402 Provider Guide](https://the402.ai/docs/providers/#bidding-on-requests) / 核心の引用: 「Delivery is at-least-once — consume idempotently keyed on `posting_id`.」
- B4-I IDEA-1 live implementation: `sale-observer.mjs`がimage 3 wallet、the402 jobs/threads/earnings/product、ClawMerchants asset/transactionsを1回のpollで読み、固定offer/payTo/price/status/txを満たす行だけを`source/source_sale_id/offer_id/tx/expected_pay_to/expected_usdc_atomic/observed_at`へ正規化する。candidate storeは`~/.anicca/state/x402-sale-candidates.jsonl`、0600、source sale IDとtxの両方でdedupeし、prompt/payment header/buyer brief/API keyを保存しない。LaunchAgent `ai.anicca.x402-sale-observer`はStartInterval=300、runs=2、last exit=0。live pollはimage candidates=0、the402 jobs/threads/settlements/product purchases=`0/0/0/0`、Claw purchases/transaction candidates=`0/0`、errors=0。commit `8f06f5e5`、fresh x402全suite fail=0。
- B4-I IDEA-2 live implementation: `settlement-recorder.mjs`はcandidateのpayToを3 seller walletへpinし、Base chainId=8453、finalized head、receipt status=1、正しいUSDC contract、単一Transfer、exact atomic amount、外部transfer sender、外部tx initiatorをwrite-path自身で検証する。wallet ledgerはtxに加えてsource sale IDでもdedupeする。LaunchAgent `ai.anicca.x402-settlement-recorder`はStartInterval=300、runs=2、last exit=0。candidate=0のlive runはRPC・ledger writeを行わず`verified=0, recorded=0, verified_external_revenue=false`。commit `32dd8c6e`、fresh x402全suite fail=0。
- B4-I IDEA-3 live implementation: `acquisition-controller.mjs`はthe402 open postingsを既存hard gateで選別し、durable SQLite inboxに未処理のeligible postingを1 cycle最大1件だけenqueueする。research/writingの2 cycleはworkerが各1 attemptで完了し、既存bid ID `bid_59943a1581de430d` / `bid_ad4356885ad34346`を保持するidempotent更新になった。3 cycle目は`action=none`、inboxは`total=2, completed=2, pending=0, dead=0`で重複なし。action logは0600。LaunchAgent `ai.anicca.x402-acquisition-controller`はStartInterval=300、runs=3、last exit=0。commit `db884536`、fresh x402全suite fail=0。
- B4 acquisition rejected path: PayanAgent native offerはbuyer決済を先にsettleした後、seller endpointへ`Content-Type`とraw bodyだけを送るため、現在のx402保護済み`/image`を登録するとbuyerは支払後に二重402を受け、delivery失敗になる。公開aggregationにも現在の3 image offerは無く、古いcalculator entryだけなのでfirst sale bootstrapとして使わない。ソース: [PayanAgent universal buy route](https://github.com/derNif/payanagent/blob/b9caa0178dabe1dfa264b984b84af3a84afb9368/src/app/x402/%5BofferId%5D/route.ts#L289-L305) / 核心の引用: 「headers: { \"Content-Type\": \"application/json\" }」
- DIST-2 verify: Coinbase/x402 ecosystem pageはmaintainerが廃止し、既存Anicca PR [#2532](https://github.com/x402-foundation/x402/pull/2532)をcloseしたため再PRしない。Pay.sh registryは有料endpointにSolana mainnet USDC/USDTを必須化しておりBase-only商品は対象外。AmpersendはBazaarを既定集約元にするため別submitは無い。Onchain.fiは`noindex,nofollow`かつ連絡先だけでmarketplace/submit面が無い。x402scan 3 listingは$0.03へ更新する一方、[awesome-x402 #838](https://github.com/xpaysh/awesome-x402/pull/838)の本文は旧$0.05のままreview待ちでありbuyer bootstrap面に数えない。[Questflow resource #11](https://github.com/questflowai/awesome-a2a-hub/pull/11)もbuyer bootstrap面に数えず、重複PRを作らない。
- 2026-07-18 [Sol review verdict = **STOP-AND-REVISIT-RAIL**]: 7 blocking。#1 poidh 攻略前提破綻（proof=現地/original、AI 画像不可、sentinel は発注者側）#2 accept 8.6%・open の 55/71 が30日超で墓場・収益性ゲート不在 #3 Phase0 が rail を証明しない #4 record.mjs が caller 提供値を盲信＝done 捏造可 #5 balance-delta は偽陰陽性→event log を bigint wei で #6 gas 自己復旧デッドロック #7 鍵 broadcast 前防御。→ INV-8〜11 に昇格・rail 降格・Phase0 再定義で反映済。
- 2026-07-18 [71 open 全 dump・カテゴリ精査, Fable 実測]: AI が human-zero で勝てるのは **~10件のみ**（残りは現実世界/特定人物 proof）。AI 勝機案件: #263 "ship a real build"(0.0138ETH,claims2,純コード) / #107 "Farcaster Movie Trailer, Use AI"(0.0125ETH,claims3) / #237系 "tweet about \$Space proof=tweet URL"(claims0 多数, 0.001ETH) / #304 poem(claims9飽和) / #283 one question(claims1) / #301 NFT mint / #250 token split。→ **判定: poidh は mechanism 実証には適するがincome railとして薄い**（大半 \$3〜40、acceptはfunder依存）。

## OPEN RISK / honest gap

- B4-IはIDEA-1〜3まで実装・本番常駐が完了し、observer / recorder / acquisition controllerが外部buyer待機と新規eligible demandを所有する。未完はExecution Steps 4–5だけであり、第三者buyerを人為的に作らず実購入を検出してB4-V/B5を閉じる。
- x402 image 3店のexternal inflowは$0で、Agentic/Bazaarのimage掲載は第三者による最初のverify+settleがgate。the402 research/writing 2 serviceは公開・各`$1`の実入札・自動fulfillment待受まで有効で、HTTP 402 digital productも`$0.525`・検索rank 1で公開されるが、両bidは`pending`、product purchases=0、jobs=0、threads=0、provider earningsは`settled_usd=0, held_usd=0, pending_usd=0`。listing、open posting、bid、award、escrowは収益に数えず、第三者購入→納品/download→外部USDC releaseとledger記録まで本番証明は未完。
- x402scanの集計は市場全体であり、Anicca商品のaddressable demandを直接証明しない。商品ごとの402、paid purchase、repeat buyerを別に計測する。
- x402の取引には極小額が多い。gross revenueではなくcompute/gas/listing cost差引後のmarginをhard gateにする。
- bounty railは報酬額だけでGOにしない。automation policy、KYC/owner gate、current open supply、wallet settlementを毎回再検証する。
- poidh/native-verifyはmechanism参照として残るが、現行critical pathには入れない。
