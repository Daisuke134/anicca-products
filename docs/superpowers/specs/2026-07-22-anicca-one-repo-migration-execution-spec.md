# Anicca One-Repo Migration Execution Spec

## 0. Status / SSOT

- 本ファイルは4 repoを既存`Daisuke134/anicca`へ収斂する**実行順とlive状態の唯一の正本**である。
- mission・product名・完全TO-BE tree・repo境界は`2026-07-19-anicca-one-repo-consolidation-spec.md` §1/§2を参照する。
- **one-repoが先、runtime場所は後**。このspecはlocal/cloud移行を完了条件にしない。
- Mac Mini loopのmulti-tenant cloud移行は`2026-07-21-life-manager-cloud-agent-platform-migration-spec.md`の74 TODOだけを正本とする。
- 実装先repoは`https://github.com/Daisuke134/anicca`、local canonical rootは`/Users/anicca/anicca`。
- TODOは下表を上から実行し、実測で状態が変わるturn内に更新する。意味のある編集ごとに対象限定commit/pushする。

## 1. Decided outcome

```text
GitHub write SSOT:  Daisuke134/anicca
local root:         /Users/anicca/anicca
cloud/VPS checkout: <sandbox>/anicca              # 必要になった時だけ
paid product:       apps/life-manager
all loops:          packages/runtime + engine + skills
local execution:    packages/runtime/src/local    # first and required
cloud execution:    packages/runtime/src/cloud    # deferred interface; provider未決定
```

`life-manager`をrepo名にしない。Life Managerは人が使うproductの顔だが、agent economy、installer、wallet-native engineまで
`life-manager` repoの従属物にするとmissionの器が狭すぎる。repo名は`anicca`、product folderは`apps/life-manager`にする。

## 2. Measured source inventory

| Source | Default | Measured tracked | Migration treatment |
|---|---:|---:|---|
| `Daisuke134/anicca` / `/Users/anicca/anicca` | `main` | 2,734 | parent history /唯一のwrite正本 |
| `Daisuke134/anicca-products` / `/Users/anicca/anicca-project` | `main` | 8,919 | public filtered-history import: Life Manager paths only |
| `Daisuke134/profitable-claude` / `/Users/anicca/profitable-claude` | `main` | 917 | private historyは持ち込まずsanitized current snapshot |
| `Daisuke134/life-manager` / `/Users/anicca/Projects/life-manager` | `main` | 35 | frozen public treeを差分reviewしunique history/pathだけimport |

`anicca-products`全体は約15GBで、Life Manager以外のiOS/web/media/generated assetを含む。repo丸ごとのmergeは禁止する。
production Life Managerのsourceは`apps/life-call`と`apps/landing/app/life-manager`であり、旧35-file repoを優先しない。

## 3. Scope boundary

### This migration completes when

1. source code、spec、tests、loop launchersのwrite正本が`Daisuke134/anicca`だけになる。
2. Life Manager web/APIが`apps/life-manager`からbuild/test/deployできる。
3. 現在localで動く全loopが同じrepoのroot commandから起動・停止・status確認できる。
4. earn loopがLife Manager financial organから同じengine contractで呼べる。
5. old repo/pathへのruntime参照が0になり、旧repoはread-only/archiveになる。

### Explicitly deferred

- loopをDocker/containerへ変えること
- loopをVPS/DigitalOcean/Railway/Akashのどこで動かすか
- Mac Miniをproduction dependencyから外すこと
- 1,000 tenant、cloud queue、browser sandbox、Mac-off E2E

これらはone-repo後にcloud migration specで決める。local/cloudはいずれも`packages/runtime`の同じloop contractを使い、
execution adapterだけを差し替える。

## 4. Invariants

1. one repo = one Git history + one canonical clone。taskごとの一時worktreeは許可するが、別project cloneとして育てない。
2. submodule、永続subtree、vendor copy、双方向sync、monorepo内mirror source copyを作らない。
3. 同名実装はproduction behavior + test + deployment hashで裁定する。mtimeやfolder名で選ばない。
4. private sourceの履歴をpublic canonicalへimportしない。sanitized current snapshot + source commit/tree digestでprovenanceを保持する。
5. credential、wallet key、OAuth token、cookie、browser profile、runtime state、logs、media、cacheはsnapshotにも履歴にも入れない。
6. filtered-history candidateはcurrent treeだけでなく全reachable path/blobをdeny policyで検査する。
7. `apps/*`と`packages/*`の直下だけをworkspaceにする。各direct childは`package.json`を持ち、nested moduleは持たない。
8. Life Manager APIは`apps/life-manager`内に置く。loopは`packages/runtime`から起動し、deployment方式をsource構造へ埋め込まない。
9. write freeze後に4 remote HEADを再照合し、差分があればreimportする。差分0になる前にcutoverしない。
10. old repo archiveとdisk cleanupはproduction/local parity、rollback window、release bundle verificationの後だけ行う。

## 5. Migration flow

```text
4 changing repos
    │
    ▼
pin heads + import policy + baseline + deny scan
    │
    ▼
existing Daisuke134/anicca worktree
    │
    ├── monorepo foundation
    ├── Life Manager product import
    ├── existing Anicca runtime in-place move
    └── profitable-claude sanitized snapshot import
    │
    ▼
Life Manager local/staging parity + all local loops from one root
    │
    ▼
write freeze → final diff/reimport → product deploy + local launcher cutover
    │
    ▼
old repos read-only/archive
    │
    ▼
separate decision: keep loop runtime local OR add cloud adapter
```

## 6. Atomic TODO table — remaining work SSOT

| # | Phase | TODO | Done evidence | State |
|---:|---|---|---|---|
| 1 | Freeze | `anicca/origin/main`からmigration worktreeを作る | path、branch、start/upstream HEAD、clean status | done — `/Users/anicca/anicca/.worktrees/one-repo-migration`、`feat/one-repo-migration`、`bfbcb915cbf7ed08da2d44c498bd82b9a5f07ae4`、0 dirty path |
| 2 | Freeze | 4 sourceのremote/default/import commit/tree digestをpinする | machine-readable manifestにexact 4 tuple、取得時刻、operator | pending |
| 3 | Freeze | current Life Manager production deployment sourceをpinする | Railway service/deploy hash = exact source commit。不一致なら停止 | pending |
| 4 | Freeze | source別import方式を固定する | anicca=in-place、products=filtered history、profitable=snapshot、legacy=reviewed filtered history | pending |
| 5 | Freeze | current tracked pathをimport/deny/reviewへexact分類する | 4 source全tracked path、unclassified 0、class重複0 | pending |
| 6 | Freeze | filtered-history candidateの全reachable path/blobをscanする | historical secret/state/log/media/cache/gitlink/LFS/oversize finding 0 | pending |
| 7 | Freeze | private profitable snapshotをverified-fd相当で生成・scanする | source commit/tree digest bind、current tracked allowlist exact、secret/state 0 | pending |
| 8 | Freeze | 4 sourceのbaseline test/build/start/statusをfresh実行する | command、exit、test count、known failure、artifact digestをmanifest化 | pending |
| 8a | Freeze | current local loop expected setをpinする | source commitにbindしたloop ID/owner/launcher/scheduler/enabled state/countのmachine-readable manifest | pending |
| 9 | Freeze | duplicate capability mapを作る | canonical/reconcile/retireを全Life Manager module/loopへ一意指定 | pending |
| 10 | Freeze | rollback + actual write-freeze手順をdry-runする | freeze対象、再照合、unfreeze、old deploy/local launcher復帰を再現 | pending |
| 11 | Foundation | root pnpm workspace/Turborepoを導入する | fresh install、workspace discovery、root build/test PASS | pending |
| 12 | Foundation | `apps/life-manager` boundaryを作る | direct child package 1、nested package 0、placeholder test PASS | pending |
| 13 | Foundation | `packages/contracts|runtime|engine|skills|connectors|policy|evidence|installer|observability|config` boundaryを作る | 全direct childにpackage.json、nested package 0、TO-BE treeとの差分0 | pending |
| 14 | Foundation | existing schema/contractsをbehavior変更なしで`packages/contracts`へ移す | before/after contract suite同数PASS、semantic diff 0 | pending |
| 15 | Foundation | affected CI/cache graphを実装する | direct change + downstream change + unrelated changeの3 fixture PASS | pending |
| 16 | Foundation | repo/import secret・state・gitlink gateを実装する | current/history/snapshot各negative fixtureをreject | pending |
| 17 | Foundation | portable loop runner interfaceとlocal adapter contractを固定する | fake loopでstart/stop/status/resume/idempotency tests PASS | pending |
| 18 | Life Manager | frozen products commitの`apps/life-call`をfiltered history importする | source→target commit map、reachable deny scan 0、baseline同数PASS | pending |
| 19 | Life Manager | frozen products commitのLife Manager web surface閉包をfiltered history importする | page/components/assets/config/deps/testsのclosure、commit map、render PASS | pending |
| 20 | Life Manager | frozen legacy Life Manager treeをproductionと比較する | 35 current paths全件にsame/unique/retire判定、working tree非参照 | pending |
| 21 | Life Manager | legacy unique behaviorを履歴付きで選択importする | imported path commit map。またはretire rationale + archive permalink | pending |
| 22 | Life Manager | API routes/webhooks/authを`src/api`へ整理する | route inventory exact、API contract tests before/after同数PASS | pending |
| 23 | Life Manager | Telegram/email/phone/web-panelを`src/channels`へ整理する | channel別test、external side-effect mock contract PASS | pending |
| 24 | Life Manager | scheduler/router/tenant/policy/reportを`src/control-plane`へ整理する | current behavior parity tests PASS。新cloud behaviorは追加しない | pending |
| 25 | Life Manager | existing context/intent/memory/planningを`src/brain`へ整理する | current call graph parity、cross-tenant fixture PASS | pending |
| 26 | Life Manager | DAILY/PHYSICAL/MENTAL/FINANCIAL codeを`src/organs`へ整理する | current module/test mapping exact、unowned source 0 | pending |
| 27 | Life Manager | migrations/eval/testsをnew pathへrebindする | unit/integration/eval PASS、old absolute repo path 0 | pending |
| 28 | Life Manager | one app build/serve entrypointへ統一する | duplicate HTTP app 0、health/webhooks/panelがsame artifactから起動 | pending |
| 29 | Life Manager | local product E2Eを通す | web/API/TG fixture/calendar fixture/panel mobile viewport PASS | pending |
| 30 | Anicca | existing loop scheduler/registryを`packages/runtime`へin-place moveする | current local launch behavior parity、old import path 0 | pending |
| 31 | Anicca | earn/capital/economic logicを`packages/engine`へin-place moveする | engine unit tests parity、runtime→engine public exportsだけ | pending |
| 32 | Anicca | services/adaptersを`packages/connectors`へmoveする | provider contract tests parity、engineからprovider direct import 0 | pending |
| 33 | Anicca | identity/walletをengine economic-runtimeへmoveする | address/key-ref/tenant ownership/idempotency tests PASS | pending |
| 34 | Anicca | ledger/accounting/budget/riskをengine/policy/evidenceへmoveする | cost/profit/spend-cap/self-pay exclusion tests PASS | pending |
| 35 | Anicca | current control-roomをLife Manager financial/agent panelへ統合する | duplicate dashboard 0、same ledger/authをmobile browserで確認 | pending |
| 36 | Anicca | installer/start/status/stopをnew workspaceへrebindする | clean Mac sandboxでinstall→start→status→stop PASS | pending |
| 37 | Profitable | sanitized profitable snapshotをtarget packagesへimportする | source commit/tree digest、path provenance map、secret/state 0 | pending |
| 38 | Profitable | skillを`core`/`gated/bootstrap`/`gated/delegation`へ分類する | unclassified 0、gateなしgated execution reject | pending |
| 39 | Profitable | duplicate loop/skillをcanonical implementationへ統合する | 1 capability=1 module、old/new launcher equivalence PASS | pending |
| 40 | Profitable | CEO/registry/cadence/validatorをruntime/evidenceへ統合する | current start-all/status/budget/evidence behavior parity | pending |
| 41 | Integration | financial organ→engine invocation contractを実装する | tenant/mandate/budgetを渡し、result/evidenceがsame ledgerへ戻る | pending |
| 42 | Integration | root local commandsを統一する | `life-manager:start`、`loops:start`、`status`、`stop`を1 rootから実行 | pending |
| 43 | Integration | #8aのcurrent local loop inventoryをcanonical commandsで全部起動確認する | pinned ID/count全件 start/status/stop、missing/extra 0、old source path process 0 | pending |
| 44 | Docs | relevant specs/runbooksを`anicca/docs`へimportしtopic indexを作る | topicごとにcanonical 1 file、duplicate TODO 0、link check PASS | pending |
| 45 | Docs | local/cloud selection ADRをdeferred状態で作る | local=current、cloud=undecided、decision criteriaだけ固定 | pending |
| 46 | Cutover | `anicca-products`へactual write freezeを実施する | branch protection/read-only window、freeze HEAD、unfreeze手順 | pending |
| 47 | Cutover | `profitable-claude`へactual write freezeを実施する | private remote write停止、freeze HEAD、unfreeze手順 | pending |
| 48 | Cutover | legacy `life-manager`へactual write freezeを実施する | branch protection/read-only window、freeze HEAD、unfreeze手順 | pending |
| 49 | Cutover | frozen manifestと3 source remote HEADを再照合し差分をreimportする | diff 0。差分ありなら#5–#43のaffected gatesを再実行 | pending |
| 50 | Cutover | current `anicca/origin/main`を再取得しmigration branchへreconcileする | start HEAD以後のtarget commit欠落0、conflict裁定記録、affected gates再実行 | pending |
| 51 | Cutover | reconcile後canonicalの全reachable historyをscanする | parent+all importsのsecret/state/log/media/cache/gitlink/LFS finding 0 | pending |
| 52 | Cutover | Life Manager stagingをexact migration commitからdeployする | repo/deploy/runtime hash一致、product staging smoke PASS | pending |
| 53 | Cutover | reviewed migration branchを`anicca` default branchへmerge/pushする | protected merge、remote `main` HEAD = reviewed final commit、CI green | pending |
| 54 | Cutover | Life Manager production sourceを`anicca/main`へ切り替える | remote main = deploy/runtime hash、health/panel/webhooks smoke、rollback ready | pending |
| 55 | Cutover | local launchd/cron/tmux entrypointをcanonical rootへ1件ずつ切り替える | per-loop before/after/rollback、#8a全ID green | pending |
| 56 | Distribution | `profitable-claude` release bundleをcanonicalから生成する | source marker、bundle install/dry-run PASS、secret/state/deny path 0 | pending |
| 57 | Cutover | old repo/path dependency 0を証明する | process/cwd/launch config/deploy config/docs link scan 0 | pending |
| 58 | Cutover | rollback windowを運用する | product/local loopsのerror budget green、product rollback drill成功 | pending |
| 59 | Archive | `anicca-products`をarchiveしredirectする | GitHub archived、README exact target、issue destination更新 | pending |
| 60 | Archive | legacy `life-manager`をarchiveしredirectする | GitHub archived、README exact target、issue destination更新 | pending |
| 61 | Archive | private `profitable-claude`をaudit archiveへ固定する | private維持、GitHub archived、frozen HEAD/bundle digestをcanonicalへ記録 | pending |
| 62 | Cleanup | old local clones/cache/mediaをmanifest付きcleanupする | backup/archive digest後だけ削除、canonical clone + ephemeral worktreesのみ | pending |
| 63 | Closure | final fresh adversarial reviewを行う | 全preceding TODO done、tests/build/product E2E/local loop E2E、blocking 0 | pending |

## 7. Phase progress

| Phase | Rows | State |
|---|---:|---|
| Freeze | 1–10（8a含む） | in progress — 1/11 done |
| Foundation | 11–17 | pending |
| Life Manager | 18–29 | pending |
| Anicca | 30–36 | pending |
| Profitable Claude | 37–40 | pending |
| Integration / Docs | 41–45 | pending |
| Cutover / Archive / Closure | 46–63 | pending |

次に実行するrowは**#2**。cloud runtimeの実装は本表の後であり、cloud migration specのstateを本表から変更しない。

## 8. Research basis

- Turborepo, “Structuring a repository”: https://turborepo.com/docs/crafting-your-repository/structuring-a-repository
  核心の引用: “every directory with a `package.json` in the `apps` or `packages` directories will be considered a package” / “does not support nested packages like `apps/**` or `packages/**`”.
- pnpm, “Workspace”: https://pnpm.io/workspaces
  核心の引用: “You can create a workspace to unite multiple projects inside a single repository.”
- GitHub Docs, “About Git subtree merges”: https://docs.github.com/en/get-started/using-git/about-git-subtree-merges
  核心の引用: “The ‘subrepository’ is stored in a folder of the main repository.”
