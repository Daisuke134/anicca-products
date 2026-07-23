# x402 External Income Loop — User Directive

## Non-negotiable interpretation

- The objective is not a collection of one-shot sales tasks. Every stage must participate in one durable closed loop:
  `Demand Scout → Hard Gate → Build → Distribute → Serve/Settle → Verify → Self-Improve → Demand Scout`.
- Pending bids, marketplace review, buyer arrival, and settlement finality are asynchronous external events. Human/Codex polling or waiting is never counted as work. Durable services own waiting.
- While external events are pending, the loop continues non-time-dependent work: new paid-demand discovery, rail gating, bounded product creation, idempotent distribution, conversion experiments, portfolio decisions, and self-healing.
- Observer, settlement recorder, and the402 acquisition controller are completed components only. Do not describe them as the completed external-income loop.
- Prefer implementation and real execution first. Use proportional verification after implementation; do not spend cycles on excessive TDD, dry runs, or repeated unchanged checks.
- Revenue is counted only after a third-party finalized on-chain settlement is independently reverified and recorded exactly once. Until then report `$0 / ¥0`.

## Current implementation order

1. Master durable state machine.
2. Periodic demand + rail scout and opportunity queue.
3. Bounded Product Factory.
4. Distribution Factory and dynamic adapter registry.
5. Conversion experiment, portfolio, and resource-recovery loops.
6. First external sale loop proof.
7. Different-buyer repeat and post-settlement indexing proof.
