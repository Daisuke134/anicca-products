# Cloud-agent external-effect inventory

This TODO #4 inventory separates reusable effect objects from opaque loop-to-effect edges. It is revision-bound to the ordered 393-row parent loop inventory and covers exactly five required categories for every loop: `call`, `post`, `mail`, `render`, and `wallet`.

The tracked approved inventory contains 1,965 category-coverage edges plus six evidence-backed bindings, for 1,971 edges and 12 reusable objects. Coverage resolution is one of `discovered`, `none`, or `unverified`; absence of evidence remains `unverified`. Targets are classes, never recipient identifiers, account handles, phone numbers, wallet addresses, provider payloads, prompt bodies, or message bodies.

## Evidence-backed effects

| Category | Object behavior | Binding status | Policy |
|---|---|---|---|
| call | configured guidance voice call | one opaque loop | allowed classification |
| post | managed social carousel publish | one shared object, two opaque loops | allowed classification |
| post | Zenn retry source-control publish | one opaque loop | allowed classification |
| post | Orca finalizer source-control publish | catalog-only, no current loop binding | allowed classification |
| mail | subscribed-recipient newsletter send | one opaque loop | allowed classification |
| render | generated vertical-media render | one opaque loop | allowed classification |
| wallet | on-chain stake mutation | catalog-only, no loop binding | blocked |

The wallet entry proves that mutation behavior exists in a reviewed source. It does not prove a parent-loop mapping and therefore remains unbound. Wallet mutation cannot be marked allowed by the validator. The removed Orca parent is handled the same way: the reviewed source behavior remains catalogued, but it is not inferred onto another loop.

The current Zenn retry worker is bound only to its reviewed, revision-pinned `git push` mutation. Its source revision changed after the 334-parent approval and is rebound to the current verified digest. The HF gig-pass loop and newly observed Life Manager x402 ledger loop have no verified external mutation binding; all five category-coverage rows for each remain `unverified`. Internal state or artifact writes remain part of TODO #3 and are not counted here.

## Review boundary

`cloud-agent-external-effect-discovery-manifest.json` is the builder-authored manifest and remains `review_required / pending_independent_external_effect_review`. Only the separate `cloud-agent-external-effect-discovery-review.json` transitions to exact `approved / todo4_393_rebind_independent_review_approved_v1 / independent_fresh_external_effect_reviewer`. It binds manifest digest `sha256:35ee32b0:ef8e2b1a:6fae6025:6c0eb92b:4135bfe4:d5e13818:e22fe01f:9cdd6930`, the current parent digest, and the exact seven source revisions. The legacy 334 and 392 tuples are rejected. An approved review with a pending basis, placeholder reviewer role, stale parent, stale manifest, or stale source revision fails closed.

Approved regeneration:

```sh
python3 scripts/collect-cloud-agent-external-effect-metadata.py
python3 scripts/generate-cloud-agent-external-effect-inventory.py
```

Synthetic pending reviews remain candidate-only: normal mode exits nonzero without stdout or output, while explicit `--candidate` produces isolated `candidate_pending_review` artifacts. Approval validates this metadata inventory; it does not authorize execution of any listed effect.
