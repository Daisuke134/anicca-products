# Cloud-agent macOS dependency inventory

TODO #5 classifies every current loop without stopping or modifying it. The parent SSOT is `cloud-agent-loop-inventory.tsv`; the tracked output is `cloud-agent-macos-dependency-inventory.tsv`. Output rows use only an opaque `loop_ref` and the exact parent metadata digest. Raw launchd labels, cron job IDs, account identifiers, and paths are not copied into this artifact.

## Classification contract

| Migration class | Meaning | Current rule |
|---|---|---|
| `linux_ready` | Scheduler/runtime is already a Linux or managed-cloud execution surface | Railway entrypoint only |
| `replacement_required` | Current scheduler/gateway or missing runtime binding must be replaced before Mac removal | launchd, Mac-hosted OpenClaw cron, and repository-only entrypoints |
| `retire` | Explicit evidence proves the loop should be removed | No current loop; disabled, parse-error, or unknown never implies retirement |

`migration_class` and `payload_portability` are separate. A launchd row is always `replacement_required` because launchd is the macOS scheduler boundary, while its payload remains `unverified` until a later source-level portability check. OpenClaw cron is also `replacement_required` because the parent SSOT places its gateway on the Mac Mini; its target is a cloud OpenClaw gateway and its payload remains `unverified`. This prevents “move the scheduler/gateway” from being misreported as “rewrite the payload,” and prevents an unverified payload from being silently retired.

## Measured inventory

| Measure | Count |
|---|---:|
| Parent rows covered | 396 / 396 |
| `linux_ready` | 1 |
| `replacement_required` | 395 |
| `retire` | 0 |
| launchd scheduler replacements | 169 |
| OpenClaw gateway migrations | 222 |
| repository runtime bindings required | 4 |

## Evidence

Apple documents launchd as the preferred mechanism for OS X daemons and user agents and states that it can start jobs at timed intervals: [Apple Daemons and Services Programming Guide](https://developer.apple.com/library/archive/documentation/MacOSX/Conceptual/BPSystemStartup/Chapters/CreatingLaunchdJobs.html).

Linux systemd defines timer units with activation-relative and boot-relative scheduling such as `OnActiveSec` and `OnBootSec`: [systemd.timer](https://www.freedesktop.org/software/systemd/man/latest/systemd.timer.html).

Kubernetes defines a CronJob as creating Jobs on a repeating schedule and explicitly compares one CronJob object to one crontab line: [Kubernetes CronJob](https://kubernetes.io/docs/concepts/workloads/controllers/cron-jobs/).

These sources establish scheduler replacement targets; they do not establish payload portability. Payload portability therefore remains an independent, conservative field.

## Reproduce

```bash
python3 scripts/generate-cloud-agent-macos-dependency-inventory.py \
  --parent docs/reference/cloud-agent-loop-inventory.tsv \
  --output /tmp/cloud-agent-macos-dependency-inventory.tsv
cmp /tmp/cloud-agent-macos-dependency-inventory.tsv \
  docs/reference/cloud-agent-macos-dependency-inventory.tsv
python3 -m unittest tests.test_cloud_agent_macos_dependency_inventory
gitleaks detect --no-git --redact \
  --source docs/reference/cloud-agent-macos-dependency-inventory.tsv
gitleaks detect --no-git --redact \
  --source docs/reference/cloud-agent-macos-dependency-inventory.md
```
