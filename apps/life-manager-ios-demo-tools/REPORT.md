# Implementation report: Life Manager iOS real Calendar demo tool

## Status

Code slice is complete and locally green. The real provider create remains intentionally pending until the primary integration/video run.

## RED

Command:

```text
rtk node --test apps/life-manager-ios-demo-tools/test/demo-event.test.js
```

Observed result: fail with `ERR_MODULE_NOT_FOUND` for the not-yet-created `lib/demo-event.js`. No `gog` command ran.

## GREEN

Command:

```text
rtk npm test --prefix apps/life-manager-ios-demo-tools
```

Observed result: 14 tests passed, 0 failed. Coverage includes:

- fixed-clock `+45` minute scheduling and Asia/Tokyo date rollover;
- exact `gog` create, events search, event readback, and delete argv;
- preview no-side-effect guard;
- active Shipathon/Roppongi origin reuse;
- controlled origin creation when no matching active origin exists;
- actual provider ID/location/time readback contract;
- deterministic cleanup for destination and tool-created origin, without deleting a reused origin;
- invalid receipt rejection.

## Read-only provider observations

- `/opt/homebrew/bin/gog` version: `0.17.0 (Homebrew 2026-05-15T18:03:28Z)`.
- `gog calendar calendars -j --no-input` exit `0`.
- `gog auth list --no-input -j` exit `0`.
- Current read-only search exit `0`; at the observation time there was no active Shipathon/Roppongi match, so no live event was created in this worker run. A broader bounded read-only list returned 2 events and 1 active event, with 0 Shipathon and 0 Roppongi matches.

## Primary integration command

Run only when the iOS app is ready to observe the real Calendar:

```bash
cd apps/life-manager-ios-demo-tools
node bin/life-manager-demo-calendar.js create --live \
  --receipt /tmp/life-manager-ios-demo-calendar-receipt.json
```

Capture the JSON receipt and show the native app detecting the resulting real event. After the demo, run:

```bash
node bin/life-manager-demo-calendar.js cleanup \
  --receipt /tmp/life-manager-ios-demo-calendar-receipt.json
```

Expected live receipt: `status=created`, `verified=true`, destination `eventId`, Tokyo Tower location, start approximately 45 minutes after invocation, and origin details with `originCreatedByTool` truthfully set. If readback fails, the command emits `created_unverified` and the receipt remains cleanup-capable; it must not be reported as a successful demo.

## Known external gate

This worker did not run external Calendar creation, native app detection, or cleanup. Those are primary integration actions and require the real device/app observation window. No credentials, tokens, or provider account fields were written to the repository or receipt schema.
