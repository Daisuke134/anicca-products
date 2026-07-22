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
- B2 image resaleは`POST /image`、sale $0.05、fixed upstream `zai/cogview-4`、live quote $0.017751、gross margin $0.032249/request。buyer決済gate→agent wallet上流決済→URL納品、quote cap/float/daily cap/secret isolationを実装し164/164 green（anicca `ab659d36`,`8a82cec6`）。
- B3 distributionは3店すべてのimage server配置を完了。各image launchdがrunning、既存Funnelの`/`・`/mcp`を維持して`/image`を追加し、public `POST /image`が402・50,000 atomic USDC・各agent固有payTo/resourceを返す。directory listingとtelemetry保存は未完（anicca `1fc1e445`,`ccc5cd8c`,`054589f9`,`923b65d5`,`2290cb36`、test 171/171 green）。

**残タスク（上から順）:**

| # | 残タスク | done条件 | 依存 |
|---|---|---|---|
| B3 | **distribute + observe（3/3配置済）** | 3店public 402 ✅。`POST /image`をBazaar/MCP directoryへ掲載し、listing URLとアクセス/402 telemetryを保存 | B2 ✅ |
| B4 | **external payout verify + ledger** | 第三者payerのfinalized USDC transferをwrite-pathで再検証し、重複なく1行記録。現状は3 walletとも48h external inflow = $0 | B3 |
| B5 | **repeat + bounty monitor** | x402の外部着金を再現して黒字化し、同時に全gateを通るbounty railが出た時だけsecurity pipelineを有効化 | B4 |

**critical path = B3 → B4 → B5**。B1/B2は完了。human identity/KYC/owner credentialが必要なrailは、このstrict laneから分離する。

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
| **x402 sell** | **primary / GO** | x402scanで直近30日15.87M tx・$741.58K・36.05K buyers・75K sellersを確認。wallet直接settlement。現在のAnicca external inflowは3 walletとも48h $0なのでproduct/distribution改善が次 |
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
- **Phase 2 — product + distribution（ACTIVE: B2 COMPLETE / B3 DEPLOY 3/3）**: image productの需要・unit margin・171/171 greenを確認。3店すべてlaunchd runningかつlocal/public 402。exit proof残り = listing URL、request telemetry。
- **Phase 3 — external payout**: B4。exit proof = tx hash + finalized receipt + external payer + write-path再検証log + 重複なしledger行。ここまでearnは¥0。
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
- B2 live verify: paid image competitorは$0.55・96 calls・66 payer signals。BlockRun direct quoteはCogView 1024x1024で402/$0.017751。Anicca一時serverの未決済POSTは402、buyer amount=50000、resource=`/image`。`serve-v2.mjs`は無変更。
- B3 franklin1 live verify: `launchctl print gui/501/ai.anicca.image-franklin1`はrunning。`https://aniccanomac-mini-1.tail7a0ba4.ts.net/image`への未決済POSTはpublic 402、amount=50000、resourceは同URL。Funnel `443`の既存`/`=200・`/mcp`=400も維持する。Tailscale公式仕様はFunnel公開ポートを443/8443/10000だけに限定するため、構成表示だけ残る10001は不採用（https://tailscale.com/docs/features/tailscale-funnel#limitations-and-restrictions）。
- B3 franklin2 live verify: `launchctl print gui/501/ai.anicca.image-franklin2`はrunning。`https://aniccanomac-mini-1.tail7a0ba4.ts.net:10000/image`へのlocal/public未決済POSTは402、amount=50000、payTo=`0xe7747Fd899D8987821Bb4CB3D6aDf22565F87ce9`、resourceは同URL。Funnel `10000`の既存`/`=200・`/mcp`=400を維持し、stderrは空。
- B3 claude-p live verify: `launchctl print gui/501/ai.anicca.image-claude-p`はrunning。`https://aniccanomac-mini-1.tail7a0ba4.ts.net:8443/image`へのlocal/public未決済POSTは402、amount=50000、payTo=`0x810F6D61F7606dEEE2657d3083E150a222Bc29C5`、resourceは同URL。Funnel `8443`の既存`/`=200・`/mcp`=400を維持し、stderrは空。
- 2026-07-18 [Sol review verdict = **STOP-AND-REVISIT-RAIL**]: 7 blocking。#1 poidh 攻略前提破綻（proof=現地/original、AI 画像不可、sentinel は発注者側）#2 accept 8.6%・open の 55/71 が30日超で墓場・収益性ゲート不在 #3 Phase0 が rail を証明しない #4 record.mjs が caller 提供値を盲信＝done 捏造可 #5 balance-delta は偽陰陽性→event log を bigint wei で #6 gas 自己復旧デッドロック #7 鍵 broadcast 前防御。→ INV-8〜11 に昇格・rail 降格・Phase0 再定義で反映済。
- 2026-07-18 [71 open 全 dump・カテゴリ精査, Fable 実測]: AI が human-zero で勝てるのは **~10件のみ**（残りは現実世界/特定人物 proof）。AI 勝機案件: #263 "ship a real build"(0.0138ETH,claims2,純コード) / #107 "Farcaster Movie Trailer, Use AI"(0.0125ETH,claims3) / #237系 "tweet about \$Space proof=tweet URL"(claims0 多数, 0.001ETH) / #304 poem(claims9飽和) / #283 one question(claims1) / #301 NFT mint / #250 token split。→ **判定: poidh は mechanism 実証には適するがincome railとして薄い**（大半 \$3〜40、acceptはfunder依存）。

## OPEN RISK / honest gap

- x402市場の総需要とbuyer/category/supplyはscoutへ入るが、Anicca 3 walletの48h external inflowは$0。次はcategory集計から個別buyer jobへ掘り、商品別conversionを証明する。
- x402scanの集計は市場全体であり、Anicca商品のaddressable demandを直接証明しない。商品ごとの402、paid purchase、repeat buyerを別に計測する。
- x402の取引には極小額が多い。gross revenueではなくcompute/gas/listing cost差引後のmarginをhard gateにする。
- bounty railは報酬額だけでGOにしない。automation policy、KYC/owner gate、current open supply、wallet settlementを毎回再検証する。
- poidh/native-verifyはmechanism参照として残るが、現行critical pathには入れない。
