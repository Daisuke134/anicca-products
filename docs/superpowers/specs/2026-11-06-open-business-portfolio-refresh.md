# Open dashboard business portfolio and refresh

## Problem

`/open/` reads `data.json` and `capafy.json` once per page load. The public `metrics.json` feed contains the broader business, agent, operating-loop, and metric-gap snapshot, but the dashboard does not load it. The existing Team activity section records a subset of observed work; it is not the complete roster or loop registry. Leaving the page open also leaves every feed at the values from the original load.

## Outcome

Show the existing business/agent/loop snapshot in the same dashboard, with its export time and source observation time shown separately. Keep that registry distinct from verified work receipts and financial data. Refresh `data.json`, `capafy.json`, and `metrics.json` in place every 15 minutes while the page is open, without reloading the page or emitting another pageview.

## Requirements

- Read `/open/metrics.json` with a cache-busting URL and render the business, agent, operating-loop, and metric-gap counts plus their detail rows.
- Show `updated_at` as the export time and `source_updated_at` as the source observation time, each with elapsed age. If `source_updated_at` is absent, say its observation time is unknown; never substitute the export time. Label the feed as a snapshot; do not imply the roster is a live process or that its status is currently running.
- Preserve null values as “no data”; do not convert missing revenue or metrics to zero.
- Keep `metrics.json` financial/portfolio fields separate from `data.json` reconciled/observed financial values and from `by_agent` activity receipts.
- Poll all three existing public JSON feeds in place every 15 minutes. Avoid a full-page reload so pageview telemetry remains one event per visit.
- Keep the dashboard legible on narrow mobile screens and show an explicit unavailable state when the portfolio feed fails.

## Scope boundary

This connects the already-published portfolio snapshot. It does not repair its source collection, establish provider completeness, verify the status of each operating loop, or reconcile company revenue/profit. Those remain in the Life Manager SSOT (`L07-D1c`, `L07-D3`, `L07-D5`, `L07-D6`).

## Acceptance

1. Focused Node tests prove export time and source observation time are labelled separately, missing observation time remains unknown, missing metric values remain unknown, and refresh replaces rendered values without page reload.
2. `data.json`, `capafy.json`, and `metrics.json` each receive an in-place 15-minute refresh schedule.
3. The deployed public UI shows the feed timestamp and the same key values on desktop and mobile; source feeds remain visually separate.

## Progress

- Local implementation and 21 focused tests pass; all three feeds have separate 15-minute refresh handlers and refresh does not reload the page.
- Local desktop and mobile screenshots show the portfolio snapshot, business cards, and agent roster. Mobile operating loops use labelled cards so all six fields are readable without horizontal scrolling.
- The public `metrics.json` read at `2026-11-06 04:31 JST` reports export time `2026-11-06 02:18 JST`, with 11 businesses, 10 agents, 53 loops, and 13 metric gaps. This is registry data, not live loop status.
- The same source snapshot in Ops, `team/metrics/snapshots/latest.json`, was observed at `2026-11-03 12:12 JST`. The public feed has no `source_updated_at`, so its export timestamp currently looks like source freshness in this section.
- PR #873 deployment run `42092867013` completed successfully; fresh desktop and 390px captures show the deployed portfolio counts, but cannot establish source freshness.
- Remaining: label export and source observation times separately, publish the Ops provenance field and push trigger, verify the deployed public JSON and desktop/mobile UI, then resume the upstream collector and provider-coverage TODO in the Life Manager SSOT.
