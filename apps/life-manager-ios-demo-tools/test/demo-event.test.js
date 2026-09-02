import test from "node:test";
import assert from "node:assert/strict";

import {
  CALENDAR_ID,
  DEMO_LOCATION,
  DEMO_SUMMARY,
  ORIGIN_LOCATION,
  ORIGIN_SUMMARY,
  EVENT_TIME_ZONE,
  buildCleanupArgs,
  buildCreateArgs,
  buildEventSpec,
  buildOriginSearchArgs,
  createDemoEvent,
  cleanupDemoEvent,
  findActiveShipathonEvent,
  parseProviderEvent,
  parseProviderEvents,
  validateReceipt,
} from "../lib/demo-event.js";

const FIXED_NOW = new Date("2026-08-08T00:00:00.000Z");

test("buildEventSpec schedules exactly 45 minutes later in Asia/Tokyo", () => {
  const spec = buildEventSpec({ now: FIXED_NOW });

  assert.equal(spec.calendarId, CALENDAR_ID);
  assert.equal(spec.summary, DEMO_SUMMARY);
  assert.equal(spec.location, DEMO_LOCATION);
  assert.equal(spec.timeZone, EVENT_TIME_ZONE);
  assert.equal(spec.start, "2026-08-08T09:45:00+09:00");
  assert.equal(spec.end, "2026-08-08T10:15:00+09:00");
});

test("buildEventSpec handles a local-date rollover without changing the JST offset", () => {
  const spec = buildEventSpec({ now: new Date("2026-08-08T14:30:00.000Z") });

  assert.equal(spec.start, "2026-08-09T00:15:00+09:00");
  assert.equal(spec.end, "2026-08-09T00:45:00+09:00");
});

test("buildCreateArgs uses the installed gog calendar create contract", () => {
  const args = buildCreateArgs(buildEventSpec({ now: FIXED_NOW }));

  assert.deepEqual(args, [
    "calendar",
    "create",
    "primary",
    "--summary",
    DEMO_SUMMARY,
    "--from",
    "2026-08-08T09:45:00+09:00",
    "--to",
    "2026-08-08T10:15:00+09:00",
    "--start-timezone",
    EVENT_TIME_ZONE,
    "--end-timezone",
    EVENT_TIME_ZONE,
    "--location",
    DEMO_LOCATION,
    "--json",
    "--results-only",
    "--no-input",
  ]);
  assert.equal(args.some((arg) => /token|secret|password|refresh/i.test(arg)), false);
});

test("buildOriginSearchArgs bounds the read-only current-event search in JST", () => {
  assert.deepEqual(buildOriginSearchArgs(FIXED_NOW), [
    "calendar",
    "events",
    "primary",
    "--json",
    "--results-only",
    "--no-input",
    "--from",
    "2026-08-08T03:00:00+09:00",
    "--to",
    "2026-08-08T15:00:00+09:00",
    "--query",
    "Shipathon",
    "--max",
    "100",
  ]);
});

test("findActiveShipathonEvent selects the current Roppongi event only", () => {
  const events = parseProviderEvents(JSON.stringify({ events: [
    {
      id: "not-active",
      summary: "Shipathon afterparty",
      location: "Roppongi venue",
      start: { dateTime: "2026-08-07T22:00:00Z" },
      end: { dateTime: "2026-08-07T23:00:00Z" },
    },
    {
      id: "origin-123",
      summary: "Shipathon build session",
      location: "Roppongi venue, Tokyo",
      start: { dateTime: "2026-08-08T00:00:00Z" },
      end: { dateTime: "2026-08-08T02:00:00Z" },
    },
    {
      id: "wrong-place",
      summary: "Shipathon build session",
      location: "Shibuya venue",
      start: { dateTime: "2026-08-08T00:00:00Z" },
      end: { dateTime: "2026-08-08T02:00:00Z" },
    },
  ] }));

  const event = findActiveShipathonEvent(events, FIXED_NOW);
  assert.equal(event.id, "origin-123");
});

test("createDemoEvent is preview-only until explicit live confirmation", () => {
  const calls = [];
  const result = createDemoEvent({
    now: FIXED_NOW,
    live: false,
    runGog: (args) => calls.push(args),
  });

  assert.equal(result.status, "not_created");
  assert.equal(result.reason, "live_confirmation_required");
  assert.deepEqual(calls, []);
});

test("createDemoEvent reuses the active Shipathon origin before creating and reading back the destination", () => {
  const calls = [];
  const result = createDemoEvent({
    now: FIXED_NOW,
    live: true,
    runGog: (args) => {
      calls.push(args);
      if (args[0] === "auth") return { status: 0, stdout: "{}", stderr: "" };
      if (args[0] === "calendar" && args[1] === "events") {
        return {
          status: 0,
          stdout: JSON.stringify({ events: [{
            id: "origin-123",
            summary: "Shipathon build session",
            location: "Roppongi venue, Tokyo",
            start: { dateTime: "2026-08-08T00:00:00Z" },
            end: { dateTime: "2026-08-08T02:00:00Z" },
          }] }),
          stderr: "",
        };
      }
      if (args[0] === "calendar" && args[1] === "create") {
        return {
          status: 0,
          stdout: JSON.stringify({ event: { id: "demo-event-123", htmlLink: "https://calendar.google.com/event?eid=redacted" } }),
          stderr: "",
        };
      }
      return {
        status: 0,
        stdout: JSON.stringify({
          id: "demo-event-123",
          summary: DEMO_SUMMARY,
          location: DEMO_LOCATION,
          start: { dateTime: "2026-08-08T09:45:00+09:00", timeZone: EVENT_TIME_ZONE },
          end: { dateTime: "2026-08-08T10:15:00+09:00", timeZone: EVENT_TIME_ZONE },
        }),
        stderr: "",
      };
    },
  });

  assert.equal(result.status, "created");
  assert.equal(result.verified, true);
  assert.equal(result.eventId, "demo-event-123");
  assert.equal(result.location, DEMO_LOCATION);
  assert.deepEqual(result.originEvent, {
    eventId: "origin-123",
    summary: "Shipathon build session",
    location: "Roppongi venue, Tokyo",
    start: "2026-08-08T00:00:00Z",
    end: "2026-08-08T02:00:00Z",
  });
  assert.equal(result.originCreatedByTool, false);
  assert.deepEqual(result.createdEventIds, ["demo-event-123"]);
  assert.equal(calls[0][0], "auth");
  assert.equal(calls[1][0], "calendar");
  assert.equal(calls[1][1], "events");
  assert.deepEqual(calls[2], buildCreateArgs(buildEventSpec({ now: FIXED_NOW })));
  assert.deepEqual(calls[3], ["calendar", "event", CALENDAR_ID, "demo-event-123", "--json", "--results-only", "--no-input"]);
  assert.equal(JSON.stringify(calls).match(/token|secret|password|refresh/i), null);
});

test("createDemoEvent creates a real controlled origin when no active Shipathon origin exists", () => {
  const calls = [];
  const result = createDemoEvent({
    now: FIXED_NOW,
    live: true,
    runGog: (args) => {
      calls.push(args);
      if (args[0] === "auth") return { status: 0, stdout: "{}", stderr: "" };
      if (args[1] === "events") return { status: 0, stdout: JSON.stringify({ events: [] }), stderr: "" };
      if (args[1] === "create" && args.includes(ORIGIN_SUMMARY)) {
        return { status: 0, stdout: JSON.stringify({ event: { id: "origin-created-1" } }), stderr: "" };
      }
      if (args[1] === "create") {
        return { status: 0, stdout: JSON.stringify({ event: { id: "demo-event-123" } }), stderr: "" };
      }
      if (args[1] === "event" && args[3] === "origin-created-1") {
        return {
          status: 0,
          stdout: JSON.stringify({
            id: "origin-created-1",
            summary: ORIGIN_SUMMARY,
            location: ORIGIN_LOCATION,
            start: { dateTime: "2026-08-08T08:30:00+09:00" },
            end: { dateTime: "2026-08-08T09:20:00+09:00" },
          }),
          stderr: "",
        };
      }
      return {
        status: 0,
        stdout: JSON.stringify({
          id: "demo-event-123",
          summary: DEMO_SUMMARY,
          location: DEMO_LOCATION,
          start: { dateTime: "2026-08-08T09:45:00+09:00" },
          end: { dateTime: "2026-08-08T10:15:00+09:00" },
        }),
        stderr: "",
      };
    },
  });

  assert.equal(result.status, "created");
  assert.equal(result.originCreatedByTool, true);
  assert.equal(result.originEvent.eventId, "origin-created-1");
  assert.deepEqual(result.createdEventIds, ["demo-event-123", "origin-created-1"]);
  assert.equal(calls.some((args) => args[1] === "create" && args.includes(ORIGIN_SUMMARY)), true);
});

test("createDemoEvent returns a cleanup-capable unverified receipt when destination readback fails", () => {
  const calls = [];
  let caught;
  try {
    createDemoEvent({
      now: FIXED_NOW,
      live: true,
      runGog: (args) => {
        calls.push(args);
        if (args[0] === "auth") return { status: 0, stdout: "{}", stderr: "" };
        if (args[1] === "events") return { status: 0, stdout: JSON.stringify({ events: [{
          id: "origin-123",
          summary: "Shipathon build session",
          location: "Roppongi venue, Tokyo",
          start: { dateTime: "2026-08-08T00:00:00Z" },
          end: { dateTime: "2026-08-08T02:00:00Z" },
        }] }), stderr: "" };
        if (args[1] === "create") return { status: 0, stdout: JSON.stringify({ event: { id: "demo-event-123" } }), stderr: "" };
        return { status: 1, stdout: "", stderr: "provider unavailable" };
      },
    });
  } catch (error) {
    caught = error;
  }

  assert.equal(caught?.message, "gog_event_created_but_unverified");
  assert.equal(caught?.receipt?.status, "created_unverified");
  assert.equal(caught?.receipt?.eventId, "demo-event-123");
  assert.equal(calls.some((args) => args[1] === "create"), true);
});

test("createDemoEvent stops before any Calendar mutation when gog auth is unavailable", () => {
  const calls = [];
  assert.throws(
    () => createDemoEvent({
      now: FIXED_NOW,
      live: true,
      runGog: (args) => {
        calls.push(args);
        return { status: 1, stdout: "", stderr: "auth details omitted" };
      },
    }),
    /gog_auth_failed/,
  );
  assert.equal(calls.length, 1);
  assert.equal(calls[0][0], "auth");
});

test("cleanupDemoEvent deletes only the receipt's exact calendar event", () => {
  const calls = [];
  const result = cleanupDemoEvent({
    receipt: {
      receiptVersion: 1,
      kind: "life-manager-ios-demo-calendar-event",
      status: "created",
      eventId: "demo-event-123",
      calendarId: CALENDAR_ID,
    },
    runGog: (args) => {
      calls.push(args);
      return { status: 0, stdout: "{}", stderr: "" };
    },
  });

  assert.equal(result.status, "deleted");
  assert.equal(result.eventId, "demo-event-123");
  assert.deepEqual(calls, [["calendar", "delete", CALENDAR_ID, "demo-event-123", "--json", "--results-only", "--no-input", "-y"]]);
});

test("cleanupDemoEvent deletes a tool-created origin and destination, but never a reused origin", () => {
  const calls = [];
  const result = cleanupDemoEvent({
    receipt: {
      receiptVersion: 1,
      kind: "life-manager-ios-demo-calendar-event",
      status: "created",
      eventId: "demo-event-123",
      calendarId: CALENDAR_ID,
      originCreatedByTool: true,
      originEvent: { eventId: "origin-created-1" },
    },
    runGog: (args) => {
      calls.push(args);
      return { status: 0, stdout: "{}", stderr: "" };
    },
  });

  assert.equal(result.status, "deleted");
  assert.deepEqual(result.deletedEventIds, ["demo-event-123", "origin-created-1"]);
  assert.deepEqual(calls, [
    ["calendar", "delete", CALENDAR_ID, "demo-event-123", "--json", "--results-only", "--no-input", "-y"],
    ["calendar", "delete", CALENDAR_ID, "origin-created-1", "--json", "--results-only", "--no-input", "-y"],
  ]);
});

test("cleanup rejects a receipt without an opaque provider event id", () => {
  assert.throws(
    () => validateReceipt({ receiptVersion: 1, kind: "life-manager-ios-demo-calendar-event", status: "created", calendarId: CALENDAR_ID }),
    /eventId/,
  );
});

test("provider event parsing requires the actual event id and location", () => {
  const event = parseProviderEvent(JSON.stringify({ event: { id: "abc", location: DEMO_LOCATION } }));
  assert.equal(event.id, "abc");
  assert.equal(event.location, DEMO_LOCATION);
  assert.throws(() => parseProviderEvent(JSON.stringify({ event: { location: DEMO_LOCATION } })), /event id/);
});
