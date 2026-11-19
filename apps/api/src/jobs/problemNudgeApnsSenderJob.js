import { createHash } from 'node:crypto';
import baseLogger from '../utils/logger.js';
import { prisma } from '../lib/prisma.js';
import { SCHEDULE_MAP } from '../agents/scheduleMap.js';
import { getVariantIndex } from '../agents/dayCycling.js';
import { toLocalDateString, toLocalTimeHHMM } from '../utils/timezone.js';
import { normalizeCatalogLang } from '../modules/problem_nudges/catalogLoader.js';
import { appName } from '../modules/affirmations/affirmationsLoader.js';
import ApnsClient, { ApnsError } from '../services/apns/apnsClient.js';
import { getEntitlementState } from '../services/subscriptionStore.js';
import { getRawPushEnv, parsePushEnv } from '../utils/pushEnv.js';

const logger = baseLogger.withContext('AffirmationApnsSenderJob');

// 2026-05-23: this sender now delivers daily AFFIRMATIONS (not problem nudges).
// title = brand name (appName by lang), body = affirmation text, payload carries
// quoteId so the app deep-links to the matching Feed card. Local notifications are
// removed app-side, so this remote path is the single source of notifications.
const AFFIRMATION_SENTINEL = 'affirmation';
const AFFIRMATION_FREE_SLOTS = ['09:00', '14:00', '20:00'];
const AFFIRMATION_PRO_SLOTS = ['08:00', '12:30', '17:30', '21:30'];

// Stable per-user/day/slot UUID; also joins the Manager decision journal.
function pushDecisionId(profileId, day, slot) {
  const hex = createHash('sha256').update(JSON.stringify([profileId, day, slot])).digest('hex');
  return `${hex.slice(0,8)}-${hex.slice(8,12)}-4${hex.slice(13,16)}-a${hex.slice(17,20)}-${hex.slice(20,32)}`;
}

async function managerPushDecision({ profileId, deliveryDayLocal, scheduledTime, lang }) {
  const url = process.env.MANAGER_PRODUCT_URL;
  const token = process.env.MANAGER_SENDER_TOKEN;
  if (!url || !token) throw new Error('Manager sender unavailable');
  const profile = await prisma.profile.findUnique({ where: { id: profileId }, select: { metadata: true } });
  const reactions = await prisma.nudgeOutcome.findMany({
    where: { event: { userId: profileId } }, orderBy: { createdAt: 'desc' }, take: 20,
    select: { signals: true, reward: true, createdAt: true },
  });
  const hour = Number(scheduledTime.slice(0, 2));
  const delivery_id = pushDecisionId(profileId, deliveryDayLocal, scheduledTime);
  const response = await fetch(`${url.replace(/\/$/, '')}/manager/push-decisions`, {
    method: 'POST', signal: AbortSignal.timeout(15000),
    headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
    body: JSON.stringify({ decisions: [{ subject: profileId, delivery_id,
      context: { source: 'notification', language: lang, desired_state: 'unknown',
        time_band: hour < 12 ? 'morning' : hour < 17 ? 'day' : hour < 21 ? 'evening' : 'night' },
      push_state: { profile: profile?.metadata || {}, recent_reactions: reactions,
        local_day: deliveryDayLocal, slot: scheduledTime },
    }] }),
  });
  if (!response.ok) throw new Error('Manager decision unavailable');
  const decision = (await response.json()).decisions?.[0];
  if (decision?.delivery_id !== delivery_id || decision.backend !== 'manager-v1' ||
      decision.policy_version !== 'manager-generated-v1' || typeof decision.send !== 'boolean' ||
      !Number.isFinite(decision.assigned_probability) || decision.assigned_probability <= 0 ||
      decision.assigned_probability > 1 || typeof decision.chosen?.text !== 'string' ||
      decision.chosen.text.length > 500 || (decision.send && !decision.chosen.text.trim())) {
    throw new Error('Invalid Manager decision');
  }
  return decision;
}

function parseHHMM(s) {
  const [h, m] = String(s).split(':').map(Number);
  return { hour: h, minute: m };
}

function minutesOfDay(hhmm) {
  const { hour, minute } = typeof hhmm === 'string' ? parseHHMM(hhmm) : hhmm;
  return hour * 60 + minute;
}

const FREE_TARGET_TIMES = ['09:00', '14:00', '20:00'];

/**
 * Select exactly 3 daily slots for free users from their selected problem types.
 * Deterministic and stable; does NOT depend on "now".
 *
 * Returns entries with slotIndex within the specific problem schedule (needed for variantIndex calc).
 */
export function selectFreeDailySlots(problemTypes, scheduleMap = SCHEDULE_MAP) {
  const pts = Array.isArray(problemTypes) ? problemTypes.map(String).map(s => s.trim()).filter(Boolean) : [];
  const allSlots = [];
  for (const pt of pts) {
    const times = scheduleMap[pt];
    if (!Array.isArray(times)) continue;
    for (let i = 0; i < times.length; i += 1) {
      const scheduledTime = times[i];
      allSlots.push({
        problemType: pt,
        scheduledTime,
        slotIndex: i,
        slotsPerDay: times.length,
        _minute: minutesOfDay(scheduledTime),
      });
    }
  }
  if (!allSlots.length) return [];

  const picked = [];
  const usedKey = new Set();

  function keyOf(s) {
    return `${s.problemType}#${s.scheduledTime}`;
  }

  for (const target of FREE_TARGET_TIMES) {
    const targetMin = minutesOfDay(target);
    const candidates = [...allSlots].sort((a, b) => {
      const da = Math.abs(a._minute - targetMin);
      const db = Math.abs(b._minute - targetMin);
      if (da !== db) return da - db;
      if (a._minute !== b._minute) return a._minute - b._minute;
      return a.problemType.localeCompare(b.problemType);
    });
    for (const c of candidates) {
      const k = keyOf(c);
      if (usedKey.has(k)) continue;
      usedKey.add(k);
      picked.push(c);
      break;
    }
  }

  if (picked.length < 3) {
    const filler = [...allSlots].sort((a, b) => {
      if (a._minute !== b._minute) return a._minute - b._minute;
      return a.problemType.localeCompare(b.problemType);
    });
    for (const c of filler) {
      if (picked.length >= 3) break;
      const k = keyOf(c);
      if (usedKey.has(k)) continue;
      usedKey.add(k);
      picked.push(c);
    }
  }

  return picked.slice(0, 3).map(({ _minute, ...rest }) => rest);
}

/**
 * Slot is "due" ONLY at the scheduled minute (HH:MM).
 *
 * Rationale (product requirement):
 * - Never backfill past slots (no "18:30 slot sent at 18:55" behavior).
 * - Avoid burst delivery when a token is registered late in the day.
 *
 * Note: The server loop is aligned to wall-clock minute boundaries in server.js.
 */
export function isSlotDue({ nowUtc, timezone, scheduledTime }) {
  const nowHm = toLocalTimeHHMM(nowUtc, timezone); // HH:MM
  const nowMin = minutesOfDay(nowHm);
  const slotMin = minutesOfDay(scheduledTime);
  return nowMin === slotMin;
}

export function effectiveDeliveryDayLocal({ nowUtc, timezone, problemType, scheduledTime }) {
  const isDeepNight = problemType === 'staying_up_late' && (scheduledTime === '00:00' || scheduledTime === '01:00');
  const base = isDeepNight ? new Date(nowUtc.getTime() - 24 * 60 * 60 * 1000) : nowUtc;
  return toLocalDateString(base, timezone);
}

// deliveryDayLocal is part of the idempotency key. It must match the "logical day" of the slot,
// not simply "now's local date". If the job runs shortly after midnight, a late-night slot
// (e.g. 23:45) may still be due for the previous day. In that case we must attribute it to
// the previous local day to avoid blocking the actual slot later that same day.
export function computeDeliveryDayLocal({ nowUtc, timezone, problemType, scheduledTime }) {
  // Keep the explicit deep-night rule (staying_up_late 00:00/01:00 => previous day) as-is.
  const isDeepNight = problemType === 'staying_up_late' && (scheduledTime === '00:00' || scheduledTime === '01:00');
  if (isDeepNight) return effectiveDeliveryDayLocal({ nowUtc, timezone, problemType, scheduledTime });

  // With strict "exact-minute" delivery, deliveryDayLocal is simply the effective local day.
  return effectiveDeliveryDayLocal({ nowUtc, timezone, problemType, scheduledTime });
}

function dayDiff(aYmd, bYmd) {
  const a = new Date(`${aYmd}T00:00:00.000Z`).getTime();
  const b = new Date(`${bYmd}T00:00:00.000Z`).getTime();
  return Math.floor((a - b) / (24 * 60 * 60 * 1000));
}

export function ymdFromDateOnly(dateValue) {
  // DB DATE is a "date-only" concept. Never reinterpret it via timezone conversion.
  // We store as UTC midnight for convenience; this returns the intended YYYY-MM-DD.
  if (!dateValue) return null;
  const d = dateValue instanceof Date ? dateValue : new Date(dateValue);
  if (Number.isNaN(d.getTime())) return null;
  return d.toISOString().slice(0, 10);
}

async function ensureDay0({ profileId, timezone, timezoneIsFallback }) {
  const s = await prisma.userSetting.findUnique({
    where: { userId: profileId },
    select: { nudgeDay0LocalDate: true, timezone: true, nudgeDay0Source: true },
  });
  if (s?.nudgeDay0LocalDate) return s;

  const tz = timezone || s?.timezone || 'UTC';
  const profile = await prisma.profile.findUnique({ where: { id: profileId }, select: { createdAt: true } });
  const createdAt = profile?.createdAt ? new Date(profile.createdAt) : new Date();
  const localDate = toLocalDateString(createdAt, tz);
  const stored = await prisma.userSetting.upsert({
    where: { userId: profileId },
    update: {
      nudgeDay0LocalDate: new Date(`${localDate}T00:00:00.000Z`),
      // utc_fallback is ONLY when we had no explicit timezone and had to default to UTC.
      nudgeDay0Source: timezoneIsFallback ? 'utc_fallback' : (s?.nudgeDay0Source || 'profile_created_at'),
      updatedAt: new Date(),
    },
    create: {
      userId: profileId,
      timezone: tz,
      nudgeDay0LocalDate: new Date(`${localDate}T00:00:00.000Z`),
      nudgeDay0Source: timezoneIsFallback ? 'utc_fallback' : 'profile_created_at',
    },
    select: { nudgeDay0LocalDate: true, timezone: true, nudgeDay0Source: true },
  });
  return stored;
}

function extractStruggles(profileJson) {
  const p = profileJson && typeof profileJson === 'object' ? profileJson : {};
  const s = p.struggles || p.problems;
  if (!Array.isArray(s)) return [];
  return s.map(String).map(x => x.trim()).filter(Boolean);
}

function normalizeStruggles(values) {
  if (!Array.isArray(values)) return [];
  return values.map(String).map(v => v.trim()).filter(Boolean);
}

export async function runProblemNudgeApnsSender(nowUtc = new Date(), { apnsClient } = {}) {
  const rawEnv = getRawPushEnv();
  if (!rawEnv) {
    logger.error('PUSH_ENV/APNS_ENV/RAILWAY_ENVIRONMENT is required. Skipping APNs send (fail-closed).');
    return { ok: false, env: 'unknown', queued: 0, sent: 0, failed: 0 };
  }
  const env = parsePushEnv(rawEnv);
  const expectedApnsEndpoint = env === 'prod' ? 'production' : 'development';
  const configuredEndpoint = String(process.env.APNS_ENDPOINT || '').toLowerCase();
  if (!configuredEndpoint) {
    logger.error('APNS_ENDPOINT is required (development|production). Skipping APNs send.');
    return { ok: false, env, queued: 0, sent: 0, failed: 0 };
  }
  if (configuredEndpoint !== expectedApnsEndpoint) {
    logger.error(
      `APNs endpoint mismatch: env=${env} expects APNS_ENDPOINT=${expectedApnsEndpoint} but got ${configuredEndpoint}. Skipping send to avoid disabling tokens.`
    );
    return { ok: false, env, queued: 0, sent: 0, failed: 0 };
  }

  let client;
  try {
    client = apnsClient || ApnsClient.fromEnv();
  } catch (e) {
    logger.error(`APNs client init failed: ${String(e?.message || e)}`);
    return { ok: false, env, queued: 0, sent: 0, failed: 0 };
  }

  // IMPORTANT: Do not use session-level advisory locks here.
  // In a pooled-connection environment, lock/unlock can occur on different sessions,
  // causing a stuck lock and a complete delivery outage.
  // Idempotency is guaranteed by DB uniqueness + per-send atomic claiming.

  const tokens = await prisma.pushToken.findMany({
    where: { env, disabledAt: null },
    select: { id: true, profileId: true, deviceId: true, token: true },
  });

  let sent = 0;
  let queued = 0;
  let failed = 0;

  // Group by profileId so that free cap selection is enforced per-profile (not per-device).
  const tokensByProfileId = new Map();
  for (const t of tokens) {
    if (!tokensByProfileId.has(t.profileId)) tokensByProfileId.set(t.profileId, []);
    tokensByProfileId.get(t.profileId).push(t);
  }

  mainLoop: for (const [profileId, profileTokens] of tokensByProfileId.entries()) {
    const settings = await prisma.userSetting.findUnique({
      where: { userId: profileId },
      select: { notificationsEnabled: true, timezone: true, language: true },
    });
    if (settings && settings.notificationsEnabled === false) continue;

    // Subscription policy is enforced server-side:
    // - free: 3 total problem nudges per day (picked deterministically) per profileId
    // - pro: all selected problem slots per profileId
    // Fail-safe: if entitlement lookup fails, treat as free (no over-send; notifications still flow).
    let plan = 'free';
    try {
      const entitlement = await getEntitlementState(profileId);
      plan = entitlement?.plan || 'free';
    } catch (e) {
      logger.warn(`Entitlement lookup failed; defaulting to free cap for profileId=${profileId}: ${String(e?.message || e)}`);
      plan = 'free';
    }

    const timezone = settings?.timezone || 'UTC';
    const lang = normalizeCatalogLang(settings?.language || 'en');

    // Affirmations are universal: every user with a token receives them, regardless
    // of selected struggles. Slots are fixed (free=3/day, pro=4/day).
    const affirmationSlots = plan === 'free' ? AFFIRMATION_FREE_SLOTS : AFFIRMATION_PRO_SLOTS;

    for (const t of profileTokens) {
      const sendOne = async ({ scheduledTime, slotIndex, slotsPerDay }) => {
        if (!isSlotDue({ nowUtc, timezone, scheduledTime })) return;

        // Affirmation delivery: brand title + affirmation body + quoteId deep-link.
        // problemType is a fixed sentinel so the (profileId, problemType, scheduledTime,
        // deliveryDayLocal) uniqueness yields one affirmation per slot per day.
        const problemType = AFFIRMATION_SENTINEL;
        const deliveryDayLocal = toLocalDateString(nowUtc, timezone);
        const variantIndex = slotIndex;

        // Reuse the persisted assignment before reading mutable user state.
        const snapshot = await prisma.nudgeDelivery.findFirst({ where: {
          profileId, problemType, scheduledTime,
          deliveryDayLocal: new Date(`${deliveryDayLocal}T00:00:00.000Z`),
        } });
        let decision;
        try {
          decision = snapshot ? JSON.parse(snapshot.messageDetail || '{}') :
            await managerPushDecision({ profileId, deliveryDayLocal, scheduledTime, lang });
        } catch {
          logger.warn('Manager unavailable; push suppressed (no catalogue fallback)');
          return;
        }
        // Old catalogue rows must never be silently re-sent as model decisions.
        if (decision.backend !== 'manager-v1' || !decision.send) return;
        const quoteId = null;
        const title = snapshot?.messageTitle || appName(lang);
        const hook = snapshot?.messageBody || decision.chosen.text;
        const detail = JSON.stringify(decision);

        const deliveryDayDate = new Date(`${deliveryDayLocal}T00:00:00.000Z`);

        // Idempotency key: (profileId, problemType, scheduledTime, deliveryDayLocal)
        // This creates an immutable snapshot. Actual sends are tracked per push token.
        let deliveryId = null;
        let existing = await prisma.nudgeDelivery.findFirst({
          where: { profileId, problemType, scheduledTime, deliveryDayLocal: deliveryDayDate },
          select: { id: true },
        });
        deliveryId = existing?.id || null;
        if (!deliveryId) {
          if (plan === 'free') {
            // Hard cap (atomic): max 3 deliveries per profileId per deliveryDayLocal.
            // We must guard against concurrent workers; use a per-(profileId, deliveryDayLocal) advisory lock.
            const lockKey = `free_problem:${profileId}:${deliveryDayLocal}`;
            const out = await prisma.$transaction(async tx => {
              await tx.$executeRaw`SELECT pg_advisory_xact_lock(hashtext(${lockKey})::bigint)`;

              const already = await tx.nudgeDelivery.findFirst({
                where: { profileId, problemType, scheduledTime, deliveryDayLocal: deliveryDayDate },
                select: { id: true },
              });
              if (already?.id) return { deliveryId: already.id, created: false };

              // Count only affirmation deliveries against the free cap so leftover
              // problem-nudge rows from a transition day cannot suppress affirmations.
              const used = await tx.nudgeDelivery.count({
                where: { profileId, problemType, deliveryDayLocal: deliveryDayDate },
              });
              if (used >= 3) return { deliveryId: null, created: false };

              try {
                const created = await tx.nudgeDelivery.create({
                  data: {
                    id: decision.delivery_id,
                    profileId,
                    problemType,
                    scheduledTime,
                    deliveryDayLocal: deliveryDayDate,
                    timezone,
                    lang,
                    variantIndex,
                    quoteId,
                    messageTitle: title,
                    messageBody: hook,
                    messageDetail: detail,
                    status: 'queued',
                  },
                  select: { id: true },
                });
                return { deliveryId: created.id, created: true };
              } catch (e) {
                if (String(e?.code || '') === 'P2002') {
                  const again = await tx.nudgeDelivery.findFirst({
                    where: { profileId, problemType, scheduledTime, deliveryDayLocal: deliveryDayDate },
                    select: { id: true },
                  });
                  return { deliveryId: again?.id || null, created: false };
                }
                throw e;
              }
            });

            deliveryId = out?.deliveryId || null;
            if (!deliveryId) return;
            if (out?.created) queued += 1;
          } else {
            try {
              const created = await prisma.nudgeDelivery.create({
                data: {
                  id: decision.delivery_id,
                  profileId,
                  problemType,
                  scheduledTime,
                  deliveryDayLocal: deliveryDayDate,
                  timezone,
                  lang,
                  variantIndex,
                  quoteId,
                  messageTitle: title,
                  messageBody: hook,
                  messageDetail: detail,
                  status: 'queued',
                },
                select: { id: true },
              });
              deliveryId = created.id;
              queued += 1;
            } catch (e) {
              if (String(e?.code || '') === 'P2002') {
                existing = await prisma.nudgeDelivery.findFirst({
                  where: { profileId, problemType, scheduledTime, deliveryDayLocal: deliveryDayDate },
                  select: { id: true },
                });
                deliveryId = existing?.id || null;
                if (!deliveryId) return;
              } else {
                logger.error('Failed to insert nudge_delivery', e);
                return;
              }
            }
          }
        }

        // Per-device send row (multi-device safe).
        let sendRow = await prisma.nudgeDeliverySend.findUnique({
          where: { deliveryId_pushTokenId: { deliveryId, pushTokenId: t.id } },
          select: { id: true, status: true, nextAttemptAt: true, attemptCount: true },
        });
        if (!sendRow) {
          try {
            sendRow = await prisma.nudgeDeliverySend.create({
              data: { deliveryId, pushTokenId: t.id, status: 'queued' },
              select: { id: true, status: true, nextAttemptAt: true, attemptCount: true },
            });
          } catch (e) {
            if (String(e?.code || '') === 'P2002') {
              sendRow = await prisma.nudgeDeliverySend.findUnique({
                where: { deliveryId_pushTokenId: { deliveryId, pushTokenId: t.id } },
                select: { id: true, status: true, nextAttemptAt: true, attemptCount: true },
              });
            } else {
              logger.error('Failed to insert nudge_delivery_send', e);
              return;
            }
          }
        }
        if (!sendRow) return;
        if (sendRow.status === 'sent') return;
        if (sendRow.nextAttemptAt && sendRow.nextAttemptAt.getTime() > nowUtc.getTime()) return;

        const payload = {
          aps: {
            alert: { title, body: hook },
            category: 'AFFIRMATION',
            sound: 'default',
          },
          messageId: deliveryId,
          deliveryId,
          quoteId,
          scheduledTime,
          deliveryDayLocal,
        };

        try {
          // Claim this send atomically to avoid double-send across replicas.
          const staleCutoff = new Date(nowUtc.getTime() - 5 * 60 * 1000);
          const claimed = await prisma.nudgeDeliverySend.updateMany({
            where: {
              id: sendRow.id,
              OR: [
                {
                  status: 'queued',
                  OR: [{ nextAttemptAt: null }, { nextAttemptAt: { lte: nowUtc } }],
                },

              ],
            },
            data: {
              status: 'sending',
              attemptCount: { increment: 1 },
              lastAttemptAt: nowUtc,
              nextAttemptAt: null,
              error: null,
            },
          });
          if ((claimed?.count || 0) !== 1) return;

          const parentClaim = await prisma.nudgeDelivery.updateMany({
            where: { id: deliveryId, status: 'queued' }, data: { status: 'sending' },
          });
          if (parentClaim.count !== 1) return;

          const out = await client.sendAlert({
            deviceToken: t.token,
            payload,
            apnsIdempotencyKey: `${t.id}:${problemType}:${scheduledTime}:${deliveryDayLocal}`,
          });
          sent += 1;
          await prisma.nudgeDeliverySend.update({
            where: { id: sendRow.id },
            data: { status: 'sent', apnsId: out.apnsId || null, sentAt: new Date() },
          });
          // Update parent delivery for operator visibility (sends table remains the SSOT).
          await prisma.nudgeDelivery.update({
            where: { id: deliveryId },
            data: { status: 'sent', sentAt: new Date(), apnsId: out.apnsId || null, error: null },
          });
        } catch (e) {
          failed += 1;
          let reason = null;
          let status = null;
          if (e instanceof ApnsError) {
            reason = e.reason;
            status = e.status;
          }

          const attemptCount = Math.max(1, Number(sendRow.attemptCount ?? 1));
          const isGlobalConfigOrAuthError =
            status === 403 ||
            reason === 'BadTopic' ||
            reason === 'InvalidProviderToken' ||
            reason === 'ExpiredProviderToken';
          const isPermanentTokenError = reason === 'Unregistered' || reason === 'BadDeviceToken';

          const backoffSec = isGlobalConfigOrAuthError
            ? 5 * 60
            : Math.min(60 * Math.pow(2, Math.min(attemptCount, 4)), 15 * 60);
          const nextAttemptAt = isPermanentTokenError ? null : new Date(nowUtc.getTime() + backoffSec * 1000);

          await prisma.nudgeDeliverySend.update({
            where: { id: sendRow.id },
            data: {
              status: 'failed',
              error: reason ? `${reason}` : String(e?.message || e),
              nextAttemptAt,
            },
          });

          // Disable token only on truly permanent, user-specific errors.
          if (isPermanentTokenError) {
            await prisma.pushToken.update({
              where: { id: t.id },
              data: { disabledAt: new Date(), lastError: reason, updatedAt: new Date() },
            });
          } else {
            await prisma.pushToken.update({
              where: { id: t.id },
              data: { lastError: reason ? `${reason}` : (status ? `http_${status}` : 'unknown'), updatedAt: new Date() },
            });
          }

          if (isGlobalConfigOrAuthError) {
            logger.error(`APNs send failed (config/auth): ${reason || `http_${status}` || e?.message || e}`);
            throw e;
          } else {
            logger.warn(`APNs send failed: ${reason || e?.message || e}`);
          }
        }
      };

      try {
        for (let slotIndex = 0; slotIndex < affirmationSlots.length; slotIndex += 1) {
          await sendOne({
            scheduledTime: affirmationSlots[slotIndex],
            slotIndex,
            slotsPerDay: affirmationSlots.length,
          });
        }
      } catch (e) {
        // Global config/auth errors should stop this run early.
        if (e instanceof ApnsError) {
          const reason = e.reason;
          const status = e.status;
          const isGlobalConfigOrAuthError =
            status === 403 ||
            reason === 'BadTopic' ||
            reason === 'InvalidProviderToken' ||
            reason === 'ExpiredProviderToken';
          if (isGlobalConfigOrAuthError) break mainLoop;
        }
      }
    }
  }

  return { ok: true, env, queued, sent, failed };
}
