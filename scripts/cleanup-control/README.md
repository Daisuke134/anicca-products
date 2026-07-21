# Cleanup control plane

`cleanup_control.py` is the only production deletion authority used by
`scripts/emergency-disk-guard.sh`. It never discovers deletion targets by glob:
an exact path must exist in the versioned `artifact-lifecycle.json` manifest.

Every manifest entry declares `owner`, `class`, `ttl_seconds`, `quota_bytes`,
`lease`, and `finalizer`. Missing/corrupt manifests, unknown paths, protected
classes, active leases, fresh artifacts, and same-volume quarantine targets are
fail-closed. Only expired, over-quota `ephemeral` entries can move.

Quarantine is reversible and must be mounted on a different filesystem:

```bash
python3 scripts/cleanup-control/cleanup_control.py sweep \
  --manifest scripts/cleanup-control/artifact-lifecycle.json \
  --quarantine-root /Volumes/AniccaQuarantine/anicca-cleanup \
  --ledger ~/.openclaw/state/cleanup-control-ledger.jsonl

python3 scripts/cleanup-control/cleanup_control.py restore \
  --transaction-id TRANSACTION_ID \
  --quarantine-root /Volumes/AniccaQuarantine/anicca-cleanup \
  --ledger ~/.openclaw/state/cleanup-control-ledger.jsonl
```

The source is removed only after the off-volume copy has the same content hash.
Restore refuses to overwrite an existing original path. This follows the
reversible manifest pattern used by
[PyxSara/cleaner](https://github.com/PyxSara/cleaner/blob/fafdf27b96f2a249b260ec5dd45dc670e53087f6/restore_from_manifest.py),
whose restore path explicitly skips conflicts, and the copy-before-remove
quarantine pattern in
[mseo0/Oyster](https://github.com/mseo0/Oyster/blob/8e6e6f5db5206d4fa31b772d44db7bb304dbcfcc/core/quarantine.py).

The legacy `com.anicca.disk-cleaner`, `ai.anicca.disk-janitor`,
`ai.anicca.disk-autoprune`, and OpenClaw hourly disk cleaner stay disabled.
`com.anicca.emergency-disk-guard` remains the single scheduler and delegates
production cleanup decisions to this control plane.
