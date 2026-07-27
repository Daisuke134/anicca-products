# Cloud-agent workload class inventory

## Result

TODO #6 assigns every current parent loop to exactly one of the five queue
contracts in the migration spec. The parent SSOT is
`cloud-agent-loop-inventory.tsv`, the reviewed-effect input is
`cloud-agent-external-effect-inventory.tsv`, and the generated artifact is
`cloud-agent-workload-class-inventory.tsv`.

| Queue | Rows | Isolation | Concurrency key | Assignment evidence |
|---|---:|---|---|---|
| `life-events` | 2 | shared deterministic worker | `tenant_id` | reviewed call/mail bindings |
| `personal-ceo` | 386 | isolated agent session | `tenant_id` | conservative default where specialized evidence is absent |
| `media-cpu` | 1 | ephemeral container | `tenant_id` | reviewed render binding |
| `browser-action` | 3 | Steel session and general planner | `tenant_id+account_id` | reviewed publish/post bindings |
| `financial-read` | 1 | read-only worker | `tenant_id` | reviewed x402 revenue/cost ledger parent role |
| **Total** | **393** |  |  | exactly one row per current parent |

The default is intentionally conservative. An unverified loop is not inferred
from its name, entrypoint text, owner, or schedule. It is assigned to the
isolated `personal-ceo` queue until reviewed evidence supports a narrower
runtime. This classification is an inventory decision, not a claim that the
loop is already cloud-ready.

## Evidence

| Source | URL | Core statement |
|---|---|---|
| Inngest, “Concurrency” | https://www.inngest.com/docs/guides/concurrency | “Concurrency keys are great for creating fair, multi-tenant systems” and help prevent one user from consuming resources that slow other users. |
| Temporal, “Worker performance” | https://docs.temporal.io/develop/worker-performance | Worker task slots represent capacity to execute concurrent tasks; available slots determine whether a worker polls and executes a task type. |
| Celery, “Routing Tasks” | https://docs.celeryq.dev/en/stable/userguide/routing.html | Named task routes send workload classes such as feed and media tasks to distinct queues and workers. |

## Inference

The five queue names, isolation modes, and concurrency keys are the architecture
contract in the migration spec. The cited systems support separating workloads
and applying concurrency controls, but they do not prove a particular Anicca
loop belongs to a queue. That assignment comes only from the current,
parent-revision-bound inventory and independently reviewed external-effect
bindings. The x402 ledger is the sole explicit financial-read parent.

`call` and direct `mail` bindings use the deterministic life-event worker;
`render` uses the CPU-isolated media worker; `post`/publish uses the browser
action planner. If one loop receives reviewed bindings that imply different
specialized queues, generation fails before writing output instead of choosing
one silently.

## Privacy and failure behavior

The output contains opaque loop references and parent metadata digests. It does
not copy raw launchd labels, OpenClaw job IDs, account identifiers, filesystem
paths, or credentials. Unknown effect loop references, stale parent digests,
duplicate effect edge IDs, unsupported specialized categories, and conflicting
queue evidence all fail closed before the output file is written.

## Reproduction

```sh
python3 scripts/generate-cloud-agent-workload-class-inventory.py \
  --parent docs/reference/cloud-agent-loop-inventory.tsv \
  --effects docs/reference/cloud-agent-external-effect-inventory.tsv \
  --output /tmp/cloud-agent-workload-class-inventory.tsv
cmp /tmp/cloud-agent-workload-class-inventory.tsv \
  docs/reference/cloud-agent-workload-class-inventory.tsv
python3 -m unittest tests.test_cloud_agent_workload_class_inventory
```
