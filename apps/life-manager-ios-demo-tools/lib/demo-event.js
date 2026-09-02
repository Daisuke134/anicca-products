import { spawnSync } from "node:child_process";

export const CALENDAR_ID = "primary";
export const DEMO_LOCATION = "Tokyo Tower, 4 Chome-2-8 Shibakoen, Minato City, Tokyo";
export const DEMO_SUMMARY = "Life Manager demo: Tokyo Tower";
export const ORIGIN_LOCATION = "Roppongi Hills, 6 Chome-10-1 Roppongi, Minato City, Tokyo";
export const ORIGIN_SUMMARY = "Shipathon demo origin: Roppongi";
export const EVENT_TIME_ZONE = "Asia/Tokyo";
export const LEAD_MINUTES = 45;
export const DURATION_MINUTES = 30;
export const RECEIPT_KIND = "life-manager-ios-demo-calendar-event";
export const ORIGIN_LOOKBACK_MINUTES = 6 * 60;
export const ORIGIN_LOOKAHEAD_MINUTES = 6 * 60;

const TOKYO_OFFSET_MINUTES = 9 * 60;
const EVENT_ID_PATTERN = /^[A-Za-z0-9_-]{1,512}$/;

function asDate(value) {
  const date = value instanceof Date ? new Date(value.getTime()) : new Date(value ?? Date.now());
  if (!Number.isFinite(date.getTime())) throw new Error("now must be a valid date");
  return date;
}

function formatTokyo(ms) {
  const local = new Date(ms + TOKYO_OFFSET_MINUTES * 60 * 1000);
  return `${local.toISOString().slice(0, 19)}+09:00`;
}

function assertSpec(spec) {
  if (!spec || spec.calendarId !== CALENDAR_ID) throw new Error("demo event must target the primary calendar");
  if (spec.timeZone !== EVENT_TIME_ZONE) throw new Error("demo event must use Asia/Tokyo");
  if (!spec.location || !spec.summary || !spec.start || !spec.end) throw new Error("demo event spec is incomplete");
  return spec;
}

function assertResult(result, operation) {
  if (!result || result.status !== 0) throw new Error(`gog_${operation}_failed`);
  return result;
}

function safeObservedAt(value) {
  return asDate(value).toISOString();
}

export function buildEventSpec({ now = new Date() } = {}) {
  const nowMs = asDate(now).getTime();
  const startMs = nowMs + LEAD_MINUTES * 60 * 1000;
  const endMs = startMs + DURATION_MINUTES * 60 * 1000;
  return Object.freeze({
    calendarId: CALENDAR_ID,
    summary: DEMO_SUMMARY,
    location: DEMO_LOCATION,
    timeZone: EVENT_TIME_ZONE,
    leadMinutes: LEAD_MINUTES,
    durationMinutes: DURATION_MINUTES,
    start: formatTokyo(startMs),
    end: formatTokyo(endMs),
  });
}

function buildOriginEventSpec(now) {
  const nowMs = asDate(now).getTime();
  return Object.freeze({
    calendarId: CALENDAR_ID,
    summary: ORIGIN_SUMMARY,
    location: ORIGIN_LOCATION,
    timeZone: EVENT_TIME_ZONE,
    start: formatTokyo(nowMs - 30 * 60 * 1000),
    end: formatTokyo(nowMs + 20 * 60 * 1000),
  });
}

export function buildCreateArgs(spec) {
  assertSpec(spec);
  return [
    "calendar",
    "create",
    CALENDAR_ID,
    "--summary",
    spec.summary,
    "--from",
    spec.start,
    "--to",
    spec.end,
    "--start-timezone",
    EVENT_TIME_ZONE,
    "--end-timezone",
    EVENT_TIME_ZONE,
    "--location",
    spec.location,
    "--json",
    "--results-only",
    "--no-input",
  ];
}

export function buildOriginSearchArgs(now) {
  const nowMs = asDate(now).getTime();
  return [
    "calendar",
    "events",
    CALENDAR_ID,
    "--json",
    "--results-only",
    "--no-input",
    "--from",
    formatTokyo(nowMs - ORIGIN_LOOKBACK_MINUTES * 60 * 1000),
    "--to",
    formatTokyo(nowMs + ORIGIN_LOOKAHEAD_MINUTES * 60 * 1000),
    "--query",
    "Shipathon",
    "--max",
    "100",
  ];
}

function buildReadbackArgs(calendarId, eventId) {
  return ["calendar", "event", calendarId, eventId, "--json", "--results-only", "--no-input"];
}

export function buildCleanupArgs(receipt) {
  const valid = validateReceipt(receipt);
  return ["calendar", "delete", valid.calendarId, valid.eventId, "--json", "--results-only", "--no-input", "-y"];
}

export function parseProviderEvent(raw) {
  let parsed;
  try {
    parsed = JSON.parse(String(raw || ""));
  } catch {
    throw new Error("provider response was not JSON");
  }
  const event = parsed && parsed.event && typeof parsed.event === "object" ? parsed.event : parsed;
  if (!event || typeof event.id !== "string" || !event.id) throw new Error("provider event id is missing");
  return event;
}

export function parseProviderEvents(raw) {
  let parsed;
  try {
    parsed = JSON.parse(String(raw || ""));
  } catch {
    throw new Error("provider events response was not JSON");
  }
  const events = Array.isArray(parsed) ? parsed : parsed?.events;
  if (!Array.isArray(events)) throw new Error("provider events response is missing events");
  return events;
}

export function findActiveShipathonEvent(events, now) {
  const nowMs = asDate(now).getTime();
  const candidates = events
    .filter((event) => {
      const start = Date.parse(event?.start?.dateTime || "");
      const end = Date.parse(event?.end?.dateTime || "");
      const title = String(event?.summary || "");
      const location = String(event?.location || "");
      return typeof event?.id === "string"
        && event.id.length > 0
        && /shipathon/i.test(title)
        && /(roppongi|六本木)/i.test(location)
        && Number.isFinite(start)
        && Number.isFinite(end)
        && start <= nowMs
        && nowMs < end;
    })
    .sort((left, right) => {
      const startDelta = Date.parse(left.start.dateTime) - Date.parse(right.start.dateTime);
      return startDelta || left.id.localeCompare(right.id);
    });
  if (!candidates[0]) throw new Error("origin_event_missing");
  return candidates[0];
}

function sameInstant(actual, expected) {
  return typeof actual === "string" && Number.isFinite(Date.parse(actual)) && Date.parse(actual) === Date.parse(expected);
}

function providerMatches(event, spec) {
  return event.summary === spec.summary
    && event.location === spec.location
    && sameInstant(event.start?.dateTime, spec.start)
    && sameInstant(event.end?.dateTime, spec.end);
}

function receiptFor({ spec, event, originEvent, originCreatedByTool, createdEventIds, observedAt, verified, readbackError }) {
  return {
    receiptVersion: 1,
    kind: RECEIPT_KIND,
    status: verified ? "created" : "created_unverified",
    verified,
    source: "gog",
    calendarId: spec.calendarId,
    eventId: event.id,
    summary: spec.summary,
    location: spec.location,
    timeZone: spec.timeZone,
    start: spec.start,
    end: spec.end,
    leadMinutes: spec.leadMinutes,
    durationMinutes: spec.durationMinutes,
    originCreatedByTool,
    createdEventIds,
    originEvent: {
      eventId: originEvent.id,
      summary: String(originEvent.summary || ""),
      location: String(originEvent.location || ""),
      start: originEvent.start.dateTime,
      end: originEvent.end.dateTime,
    },
    observedAt,
    ...(readbackError ? { readbackError } : {}),
  };
}

export function runGog(args, { gogBinary = process.env.GOG_BIN || "/opt/homebrew/bin/gog", env = process.env } = {}) {
  const result = spawnSync(gogBinary, args, {
    encoding: "utf8",
    env,
    stdio: ["ignore", "pipe", "pipe"],
  });
  return {
    status: result.error ? null : result.status,
    stdout: result.stdout || "",
    stderr: result.stderr || "",
    errorCode: result.error?.code || null,
  };
}

export function createDemoEvent({ now = new Date(), live = false, observedAt = now, runGog = runGogDefault, gogBinary } = {}) {
  const spec = buildEventSpec({ now });
  if (!live) {
    return {
      receiptVersion: 1,
      kind: RECEIPT_KIND,
      status: "not_created",
      reason: "live_confirmation_required",
      calendarId: spec.calendarId,
      summary: spec.summary,
      location: spec.location,
      timeZone: spec.timeZone,
      start: spec.start,
      end: spec.end,
      leadMinutes: spec.leadMinutes,
      durationMinutes: spec.durationMinutes,
    };
  }

  const invoke = (args) => runGog(args, { gogBinary });
  assertResult(runGog(["auth", "list", "--json", "--results-only", "--no-input"], { gogBinary }), "auth");
  const originSearch = assertResult(invoke(buildOriginSearchArgs(now)), "origin_search");
  let originEvent;
  let originCreatedByTool = false;
  try {
    originEvent = findActiveShipathonEvent(parseProviderEvents(originSearch.stdout), now);
  } catch (error) {
    if (error.message !== "origin_event_missing") throw error;
    const originSpec = buildOriginEventSpec(now);
    const originCreated = assertResult(invoke(buildCreateArgs(originSpec)), "origin_create");
    const originProviderEvent = parseProviderEvent(originCreated.stdout);
    let verifiedOrigin;
    try {
      const originReadback = assertResult(invoke(buildReadbackArgs(originSpec.calendarId, originProviderEvent.id)), "origin_readback");
      verifiedOrigin = parseProviderEvent(originReadback.stdout);
      if (!providerMatches(verifiedOrigin, originSpec)) throw new Error("origin_provider_fields_mismatch");
    } catch {
      const errorWithReceipt = new Error("gog_origin_created_but_unverified");
      errorWithReceipt.receipt = {
        receiptVersion: 1,
        kind: RECEIPT_KIND,
        status: "created_unverified",
        verified: false,
        source: "gog",
        calendarId: originSpec.calendarId,
        eventId: originProviderEvent.id,
        summary: originSpec.summary,
        location: originSpec.location,
        timeZone: originSpec.timeZone,
        start: originSpec.start,
        end: originSpec.end,
        originCreatedByTool: false,
        createdEventIds: [originProviderEvent.id],
        observedAt: safeObservedAt(observedAt),
        readbackError: "origin_provider_readback_failed",
      };
      throw errorWithReceipt;
    }
    originEvent = verifiedOrigin;
    originCreatedByTool = true;
  }
  const created = assertResult(invoke(buildCreateArgs(spec)), "create");
  const event = parseProviderEvent(created.stdout);
  let readbackEvent;
  let readbackError;
  const readback = invoke(buildReadbackArgs(spec.calendarId, event.id));
  if (readback.status === 0) {
    try {
      readbackEvent = parseProviderEvent(readback.stdout);
      if (!providerMatches(readbackEvent, spec)) readbackError = "provider_fields_mismatch";
    } catch {
      readbackError = "provider_readback_invalid";
    }
  } else {
    readbackError = "provider_readback_failed";
  }
  const receipt = receiptFor({
    spec,
    event: readbackEvent || event,
    originEvent,
    originCreatedByTool,
    createdEventIds: originCreatedByTool ? [readbackEvent?.id || event.id, originEvent.id] : [readbackEvent?.id || event.id],
    observedAt: safeObservedAt(observedAt),
    verified: !readbackError,
    readbackError,
  });
  if (readbackError) {
    const error = new Error("gog_event_created_but_unverified");
    error.receipt = receipt;
    throw error;
  }
  return receipt;
}

function runGogDefault(args, options) {
  return runGog(args, options);
}

export function validateReceipt(receipt) {
  if (!receipt || receipt.receiptVersion !== 1) throw new Error("receiptVersion is invalid");
  if (receipt.kind !== RECEIPT_KIND) throw new Error("receipt kind is invalid");
  if (!['created', 'created_unverified'].includes(receipt.status)) throw new Error("receipt status is invalid");
  if (receipt.calendarId !== CALENDAR_ID) throw new Error("receipt calendarId is invalid");
  if (typeof receipt.eventId !== "string" || !EVENT_ID_PATTERN.test(receipt.eventId)) throw new Error("receipt eventId is invalid");
  if (receipt.originCreatedByTool === true) {
    if (!receipt.originEvent || typeof receipt.originEvent.eventId !== "string" || !EVENT_ID_PATTERN.test(receipt.originEvent.eventId)) {
      throw new Error("receipt originEvent.eventId is invalid");
    }
  }
  return receipt;
}

export function cleanupDemoEvent({ receipt, deletedAt = new Date(), runGog = runGogDefault, gogBinary } = {}) {
  const valid = validateReceipt(receipt);
  const eventIds = [valid.eventId];
  if (valid.originCreatedByTool === true) eventIds.push(valid.originEvent.eventId);
  for (const eventId of eventIds) {
    const result = runGog(buildCleanupArgs({ ...valid, eventId }), { gogBinary });
    assertResult(result, "delete");
  }
  return {
    receiptVersion: 1,
    kind: RECEIPT_KIND,
    status: "deleted",
    source: "gog",
    calendarId: valid.calendarId,
    eventId: valid.eventId,
    deletedEventIds: eventIds,
    deletedAt: safeObservedAt(deletedAt),
  };
}
