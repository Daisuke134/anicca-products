// A fail-closed contract boundary for the P1b engine-selected push schedule.
// This does not generate a schedule, contact Manager or authorize a live send.
const LOCAL_HHMM = /^(?:[01][0-9]|2[0-3]):[0-5][0-9]$/;
const PLAN_CAP = Object.freeze({ free: 3, pro: 4 });

/**
 * Return a frozen, sorted copy of canonical engine slots, or null when the
 * evidence is absent or invalid. [] is a valid explicit "no eligible slots".
 * Never silently coerce, truncate, deduplicate or fall back to fixed slots.
 */
export function normalizeEngineSendSlots(slots, plan) {
  if (!Object.hasOwn(PLAN_CAP, plan) || !Array.isArray(slots)) return null;
  if (slots.length > PLAN_CAP[plan]) return null;
  const seen = new Set();
  for (const slot of slots) {
    if (typeof slot !== 'string' || !LOCAL_HHMM.test(slot) || seen.has(slot)) return null;
    seen.add(slot);
  }
  return Object.freeze([...slots].sort());
}

/**
 * Pure safety gate: a due time is eligible only when the engine explicitly
 * lists it. Caller must additionally bind schedule to subject and local day,
 * verify a decision against the MG owner contract, and enforce idempotency.
 */
export function isEngineSendSlotDue({ schedule, plan, localHHMM }) {
  const canonical = normalizeEngineSendSlots(schedule, plan);
  return canonical !== null && typeof localHHMM === 'string' &&
    LOCAL_HHMM.test(localHHMM) && canonical.includes(localHHMM);
}
