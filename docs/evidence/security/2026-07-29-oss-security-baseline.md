# OSS security baseline evidence

## Scope and result

| Gate | Before | Current local evidence |
|---|---:|---|
| gitleaks current tree | 36 findings on the force-updated tree | 0 across 93.34 MB |
| gitleaks full history | 768 findings / 752 new unique fingerprints across 13,085 commits | full-history rerun in progress after exact-fingerprint adjudication |
| PII shape gate | 309 findings / 152 unique shapes / 112 paths | 0; 17 exact rule/path/value fingerprints allow only third-party metadata or synthetic fixtures |
| TruffleHog filesystem | prior lineage was clean | fresh pull-request gate pending |
| TruffleHog full history | prior verified Postgres endpoint was rotated and removed | fresh pull-request gate pending |
| Python security contract | stale manifest referenced deleted tests | 7/7 pass with an explicit pure-stdlib security manifest |
| Shell syntax | not measured on the force-updated tree | every tracked `.sh` parses |

No raw secret or matched personal-data value is stored in this evidence.

## Gitleaks adjudication

| Class | Count | Disposition |
|---|---:|---|
| generic-api-key | 757 | 680 vendored/generated-code fragments, 60 source/config public or rejected provider values, 15 documentation values, and 2 synthetic test fixtures |
| jwt | 7 | five Supabase `anon` client tokens and two expired documentation tokens; no `service_role` token |
| gcp-api-key | 1 | historical Maps credential; provider returns `REQUEST_DENIED` |
| curl-auth-user | 1 | historical credential-shaped research command; absent from the current tree |
| private-key | 1 | historical localhost self-signed TLS key; paired certificate is expired |
| sourcegraph-access-token | 1 | generated source-map false positive; no required `sgp_` token prefix |

The 752 newly observed historical fingerprints were merged with the prior
baseline into 1,634 exact entries in `.gitleaksignore`. Historical Exa
authentication returns `401`, Slack returns `invalid_auth`, and the historical
OpenClaw gateway-token fingerprint does not match the current local runtime.
The baseline is fingerprint-specific, so a value added at a new
commit/path/line is not suppressed. A mutation check with a new synthetic AWS
key was rejected by the configured detector.

Gitleaks documents that a long-history repository can use a baseline and that
each finding has a unique fingerprint:
[Gitleaks README](https://github.com/gitleaks/gitleaks#creating-a-baseline) —
“When scanning large repositories or repositories with a long history, it can
be convenient to use a baseline.”

## Active database finding and remediation

The first full-history TruffleHog run found seven verified Postgres occurrences
in old backup/docs commits. They all resolved to one Railway database endpoint.
Direct readback showed:

| Check | Before | After |
|---|---|---|
| `pg_hba_file_rules` | local/IPv4/IPv6 `trust` | local/IPv4/IPv6 `scram-sha-256` |
| wrong password | connection accepted | connection rejected |
| old password | connection accepted | connection rejected |
| new password | n/a | connection accepted before public endpoint removal |
| public TCP proxy | 1 | 0 |
| consumer database route | mixed public/internal | internal Railway hostname only |

The database password was rotated, seven consumer variables across
`life-call`, `API`, `nudge-cron`, `nudge-cronp`, and `x402-agents` were updated,
and those five services were redeployed. Production readback after cutover:

| Service | Deployment | State | Health |
|---|---|---|---:|
| `life-call` | `3356efa6-e565-4f21-967b-d03fe088d739` | SUCCESS | 200 |
| `API` | `243b35b8-6b02-4daa-b800-eb31de31183d` | SUCCESS | 200 |
| `nudge-cron` | `6431065a-cf6d-4614-a714-9c3f61f8838b` | SUCCESS | 200 |
| `nudge-cronp` | `88fbc733-4953-4025-b712-f1a683ee202d` | SUCCESS | private service |
| `x402-agents` | `5ee685de-b623-4b7a-8d57-b12c027837be` | SUCCESS | 200 |

GitHub’s remediation guidance says a committed secret must be treated as
compromised and rotated:
[GitHub secret scanning](https://docs.github.com/en/code-security/secret-scanning/managing-alerts-from-secret-scanning/resolving-alerts) —
“Once a secret has been committed to a repository, you should consider the
secret compromised.”

Railway documents that public networking exposes a service to the internet:
[Railway public networking](https://docs.railway.com/networking/public-networking) —
“Public networking allows you to expose your Railway services to the
internet.” The database no longer has a public TCP proxy.

## Evidence boundary

The local current-tree gates, Python contract, shell parse, and canonical
`apps/life-call` test suite are green. Completion still requires the fresh
pull request to report
gitleaks, PII, TruffleHog, Python, and Shell all green. Until then,
`OSS-SECURITY-BASELINE-1` is not marked done.
