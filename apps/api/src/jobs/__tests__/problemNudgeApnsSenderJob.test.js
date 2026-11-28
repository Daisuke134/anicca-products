import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

vi.mock('../../services/subscriptionStore.js', () => ({
  getEntitlementState: vi.fn(async () => ({ plan: 'pro', status: 'active', currentPeriodEnd: null })),
}));

import { prismaMock } from '../../test/setup.js';

import { isSlotDue, effectiveDeliveryDayLocal, ymdFromDateOnly, selectFreeDailySlots, runProblemNudgeApnsSender } from '../problemNudgeApnsSenderJob.js';
import { ApnsError } from '../../services/apns/apnsClient.js';
import { getEntitlementState } from '../../services/subscriptionStore.js';

const PROFILE_ID = '00000000-0000-0000-0000-000000000001';
const ENV_KEYS = [
  'PUSH_ENV',
  'APNS_ENV',
  'APNS_ENDPOINT',
  'RAILWAY_ENVIRONMENT',
  'RAILWAY_ENVIRONMENT_NAME',
  'MANAGER_PRODUCT_URL',
  'MANAGER_SENDER_TOKEN',
  'POSTHOG_API_KEY',
  'POSTHOG_HOST',
];
const ORIGINAL_ENV = Object.fromEntries(ENV_KEYS.map(key => [key, process.env[key]]));

function restoreEnv() {
  for (const key of ENV_KEYS) {
    if (ORIGINAL_ENV[key] === undefined) delete process.env[key];
    else process.env[key] = ORIGINAL_ENV[key];
  }
}

function managerDecisionResponse(requestBody, patch) {
  const requested = JSON.parse(requestBody).decisions[0];
  return {
    decisions: [{
      delivery_id: requested.delivery_id,
      backend: 'manager-v1',
      policy_version: 'manager-generated-v1',
      send: true,
      assigned_probability: 0.5,
      chosen: { text: 'A short line.', kind: 'reflection' },
      ...patch,
    }],
  };
}

describe('problemNudgeApnsSenderJob helpers', () => {
  it('isSlotDue is true only at the exact scheduled minute', () => {
    const nowUtc = new Date('2026-02-13T07:30:00.000Z');
    expect(isSlotDue({ nowUtc, timezone: 'UTC', scheduledTime: '07:30' })).toBe(true);
    expect(isSlotDue({ nowUtc, timezone: 'UTC', scheduledTime: '07:29' })).toBe(false);
    expect(isSlotDue({ nowUtc, timezone: 'UTC', scheduledTime: '07:31' })).toBe(false);
    const later = new Date('2026-02-13T07:35:00.000Z');
    expect(isSlotDue({ nowUtc: later, timezone: 'UTC', scheduledTime: '07:30' })).toBe(false);
  });

  it('isSlotDue does not backfill a previous-day slot after midnight', () => {
    const nowUtc = new Date('2026-02-13T00:05:00.000Z');
    expect(isSlotDue({ nowUtc, timezone: 'UTC', scheduledTime: '00:05' })).toBe(true);
    expect(isSlotDue({ nowUtc, timezone: 'UTC', scheduledTime: '23:45' })).toBe(false);
    expect(isSlotDue({ nowUtc, timezone: 'UTC', scheduledTime: '00:00' })).toBe(false);
  });

  it('effectiveDeliveryDayLocal uses previous local date for staying_up_late 00:00/01:00', () => {
    const nowUtc = new Date('2026-02-13T08:05:00.000Z'); // 00:05 in America/Los_Angeles (PST)
    const tz = 'America/Los_Angeles';
    const a = effectiveDeliveryDayLocal({ nowUtc, timezone: tz, problemType: 'staying_up_late', scheduledTime: '00:00' });
    const b = effectiveDeliveryDayLocal({ nowUtc, timezone: tz, problemType: 'staying_up_late', scheduledTime: '22:00' });
    expect(a).not.toBe(b);
  });

  it('ymdFromDateOnly does not shift date-only values for non-UTC timezones', () => {
    // Regression test: previously we ran DATE through toLocalDateString(Date, timezone),
    // which shifted (e.g. America/Los_Angeles) and broke dayIndex.
    expect(ymdFromDateOnly(new Date('2026-02-13T00:00:00.000Z'))).toBe('2026-02-13');
  });

  it('selectFreeDailySlots picks 3 stable slots closest to 09:00/14:00/20:00', () => {
    const out = selectFreeDailySlots(['obsessive', 'rumination', 'staying_up_late']);
    expect(out).toHaveLength(3);
    expect(out).toEqual(
      expect.arrayContaining([
        expect.objectContaining({ problemType: 'obsessive', scheduledTime: '09:00' }),
        expect.objectContaining({ problemType: 'rumination', scheduledTime: '14:00' }),
        expect.objectContaining({ problemType: 'staying_up_late', scheduledTime: '20:00' }),
      ])
    );
  });
});

describe('runProblemNudgeApnsSender', () => {
  let fetchUrls;
  let decisionPatch;
  let posthogImpl;
  let fetchSpy;

  beforeEach(() => {
    vi.clearAllMocks();
    restoreEnv();
    process.env.PUSH_ENV = 'dev';
    process.env.APNS_ENDPOINT = 'development';
    process.env.MANAGER_PRODUCT_URL = 'http://manager.test';
    process.env.MANAGER_SENDER_TOKEN = 'synthetic-manager-token';
    delete process.env.POSTHOG_API_KEY;

    decisionPatch = {};
    posthogImpl = async () => ({ ok: true, status: 200 });
    fetchUrls = [];
    fetchSpy = vi.spyOn(globalThis, 'fetch').mockImplementation(async (url, options) => {
      const href = String(url);
      fetchUrls.push(href);
      if (href.includes('/manager/push-decisions')) {
        return new Response(JSON.stringify(managerDecisionResponse(options.body, decisionPatch)), { status: 200 });
      }
      if (href.includes('posthog.com')) return posthogImpl(href, options);
      throw new Error(`unexpected fetch ${href}`);
    });

    getEntitlementState.mockResolvedValue({ plan: 'pro', status: 'active', currentPeriodEnd: null });

    prismaMock.$executeRaw.mockResolvedValue(0);
    prismaMock.$transaction.mockImplementation(async fn => fn(prismaMock));
    prismaMock.pushToken.findMany.mockResolvedValue([
      { id: 'ptok-1', profileId: PROFILE_ID, deviceId: 'device-1', token: 'a'.repeat(64) },
    ]);
    prismaMock.userSetting.findUnique.mockResolvedValue({
      notificationsEnabled: true,
      timezone: 'UTC',
      language: 'en',
    });
    prismaMock.profile.findUnique.mockResolvedValue({ createdAt: new Date('2026-02-01T00:00:00.000Z'), metadata: {} });
    prismaMock.nudgeOutcome.findMany.mockResolvedValue([]);
    prismaMock.nudgeDelivery.findFirst.mockResolvedValue(null);
    prismaMock.nudgeDelivery.count.mockResolvedValue(0);
    prismaMock.nudgeDelivery.create.mockResolvedValue({ id: '11111111-1111-1111-1111-111111111111' });
    prismaMock.nudgeDelivery.updateMany.mockResolvedValue({ count: 1 });
    prismaMock.nudgeDelivery.update.mockResolvedValue({});
    prismaMock.nudgeDeliverySend.findUnique.mockResolvedValue(null);
    prismaMock.nudgeDeliverySend.create.mockResolvedValue({ id: 'send-1', status: 'queued', nextAttemptAt: null, attemptCount: 0 });
    prismaMock.nudgeDeliverySend.updateMany.mockResolvedValue({ count: 1 });
    prismaMock.nudgeDeliverySend.update.mockResolvedValue({});
    prismaMock.pushToken.update.mockResolvedValue({});
  });

  afterEach(() => {
    fetchSpy.mockRestore();
    restoreEnv();
  });

  function acceptedClient() {
    return { sendAlert: vi.fn().mockResolvedValue({ ok: true, apnsId: 'apns-1' }) };
  }

  function posthogUrls() {
    return fetchUrls.filter(href => href.includes('posthog.com'));
  }

  it('sends one affirmation at the exact pro slot and does not send off-minute', async () => {
    const apnsClient = acceptedClient();
    const due = new Date('2026-02-13T08:00:00.000Z');
    const out = await runProblemNudgeApnsSender(due, { apnsClient });
    expect(out).toMatchObject({ ok: true, sent: 1, failed: 0, queued: 1 });
    expect(apnsClient.sendAlert).toHaveBeenCalledTimes(1);
    const sent = apnsClient.sendAlert.mock.calls[0][0];
    expect(sent.deviceToken).toBe('a'.repeat(64));
    expect(sent.payload.scheduledTime).toBe('08:00');
    expect(sent.payload.aps.category).toBe('AFFIRMATION');
    expect(sent.payload.problemType).toBeUndefined();
    expect(prismaMock.nudgeDelivery.create).toHaveBeenCalledTimes(1);
    expect(prismaMock.nudgeDeliverySend.create).toHaveBeenCalledTimes(1);

    apnsClient.sendAlert.mockClear();
    const missed = await runProblemNudgeApnsSender(new Date('2026-02-13T08:01:00.000Z'), { apnsClient });
    expect(missed).toMatchObject({ ok: true, sent: 0, failed: 0 });
    expect(apnsClient.sendAlert).not.toHaveBeenCalled();
  });

  it('does not call the provider a second time for a delivery already marked sent', async () => {
    const { sends } = useDurableSendState();
    const apnsClient = acceptedClient();
    const nowUtc = new Date('2026-02-13T08:00:00.000Z');

    const first = await runProblemNudgeApnsSender(nowUtc, { apnsClient });
    expect(first.sent).toBe(1);
    expect(apnsClient.sendAlert).toHaveBeenCalledTimes(1);
    expect([...sends.values()].some(row => row.status === 'sent')).toBe(true);

    const second = await runProblemNudgeApnsSender(nowUtc, { apnsClient });
    expect(second.sent).toBe(0);
    expect(apnsClient.sendAlert).toHaveBeenCalledTimes(1);
  });

  it('does not call the provider when the per-device claim loses', async () => {
    prismaMock.nudgeDeliverySend.updateMany.mockResolvedValue({ count: 0 });
    const apnsClient = acceptedClient();
    const out = await runProblemNudgeApnsSender(new Date('2026-02-13T08:00:00.000Z'), { apnsClient });
    expect(out).toMatchObject({ ok: true, sent: 0, failed: 0 });
    expect(apnsClient.sendAlert).not.toHaveBeenCalled();
    expect(posthogUrls()).toEqual([]);
  });

  it('claims the parent delivery once, so a second device does not get a second provider call', async () => {
    prismaMock.pushToken.findMany.mockResolvedValue([
      { id: 'ptok-1', profileId: PROFILE_ID, deviceId: 'device-1', token: 'a'.repeat(64) },
      { id: 'ptok-2', profileId: PROFILE_ID, deviceId: 'device-2', token: 'b'.repeat(64) },
    ]);
    useDurableSendState();
    const apnsClient = acceptedClient();
    const out = await runProblemNudgeApnsSender(new Date('2026-02-13T08:00:00.000Z'), { apnsClient });
    expect(out).toMatchObject({ ok: true, sent: 1, failed: 0 });
    expect(apnsClient.sendAlert).toHaveBeenCalledTimes(1);

    const again = await runProblemNudgeApnsSender(new Date('2026-02-13T08:00:00.000Z'), { apnsClient });
    expect(again.sent).toBe(0);
    expect(apnsClient.sendAlert).toHaveBeenCalledTimes(1);
  });

  it('free plan sends the fixed 14:00 slot once and does not send a pro-only slot', async () => {
    getEntitlementState.mockResolvedValue({ plan: 'free', status: 'active', currentPeriodEnd: null });
    const apnsClient = acceptedClient();
    const out = await runProblemNudgeApnsSender(new Date('2026-02-13T14:00:00.000Z'), { apnsClient });
    expect(out).toMatchObject({ ok: true, sent: 1, failed: 0 });
    expect(apnsClient.sendAlert).toHaveBeenCalledTimes(1);
    expect(apnsClient.sendAlert.mock.calls[0][0].payload.scheduledTime).toBe('14:00');

    apnsClient.sendAlert.mockClear();
    const proOnly = await runProblemNudgeApnsSender(new Date('2026-02-13T08:00:00.000Z'), { apnsClient });
    expect(proOnly.sent).toBe(0);
    expect(apnsClient.sendAlert).not.toHaveBeenCalled();
  });

  it('does not create a fourth free delivery when the daily cap is already full', async () => {
    getEntitlementState.mockResolvedValue({ plan: 'free', status: 'active', currentPeriodEnd: null });
    prismaMock.nudgeDelivery.count.mockResolvedValue(3);
    const apnsClient = acceptedClient();
    const out = await runProblemNudgeApnsSender(new Date('2026-02-13T09:00:00.000Z'), { apnsClient });
    expect(out).toMatchObject({ ok: true, sent: 0, queued: 0, failed: 0 });
    expect(prismaMock.nudgeDelivery.create).not.toHaveBeenCalled();
    expect(apnsClient.sendAlert).not.toHaveBeenCalled();
  });

  it('keeps the free cap across the three fixed slots and does not resend them', async () => {
    getEntitlementState.mockResolvedValue({ plan: 'free', status: 'active', currentPeriodEnd: null });
    const { deliveries } = useDurableSendState();
    const apnsClient = acceptedClient();
    for (const stamp of ['2026-02-13T09:00:00.000Z', '2026-02-13T14:00:00.000Z', '2026-02-13T20:00:00.000Z']) {
      await runProblemNudgeApnsSender(new Date(stamp), { apnsClient });
    }
    expect(deliveries.size).toBe(3);
    expect(apnsClient.sendAlert).toHaveBeenCalledTimes(3);

    await runProblemNudgeApnsSender(new Date('2026-02-13T09:00:00.000Z'), { apnsClient });
    await runProblemNudgeApnsSender(new Date('2026-02-13T12:30:00.000Z'), { apnsClient });
    expect(deliveries.size).toBe(3);
    expect(apnsClient.sendAlert).toHaveBeenCalledTimes(3);
  });

  it('still sends the free slot when entitlement lookup fails, and does not send extra slots', async () => {
    getEntitlementState.mockRejectedValue(new Error('db down'));
    const apnsClient = acceptedClient();
    const out = await runProblemNudgeApnsSender(new Date('2026-02-13T14:00:00.000Z'), { apnsClient });
    expect(out).toMatchObject({ ok: true, sent: 1, failed: 0 });
    expect(apnsClient.sendAlert).toHaveBeenCalledTimes(1);

    apnsClient.sendAlert.mockClear();
    const extra = await runProblemNudgeApnsSender(new Date('2026-02-13T12:30:00.000Z'), { apnsClient });
    expect(extra.sent).toBe(0);
    expect(apnsClient.sendAlert).not.toHaveBeenCalled();
  });

  it('records one provider failure and does not hammer APNs inside the backoff window', async () => {
    const apnsClient = {
      sendAlert: vi.fn().mockRejectedValue(new ApnsError({ status: 403, reason: 'BadTopic' })),
    };
    const nowUtc = new Date('2026-02-13T08:00:00.000Z');
    const out = await runProblemNudgeApnsSender(nowUtc, { apnsClient });
    expect(out).toMatchObject({ ok: true, sent: 0, failed: 1 });
    expect(apnsClient.sendAlert).toHaveBeenCalledTimes(1);
    expect(prismaMock.nudgeDeliverySend.update).toHaveBeenCalledWith(
      expect.objectContaining({ data: expect.objectContaining({ status: 'failed' }) })
    );
    expect(posthogUrls()).toEqual([]);

    apnsClient.sendAlert.mockClear();
    prismaMock.nudgeDeliverySend.findUnique.mockResolvedValue({
      id: 'send-1',
      status: 'failed',
      nextAttemptAt: new Date(nowUtc.getTime() + 5 * 60 * 1000),
      attemptCount: 1,
    });
    const retry = await runProblemNudgeApnsSender(nowUtc, { apnsClient });
    expect(retry).toMatchObject({ ok: true, sent: 0, failed: 0 });
    expect(apnsClient.sendAlert).not.toHaveBeenCalled();
    expect(posthogUrls()).toEqual([]);
  });

  it('does not send when notifications are off or Manager declines', async () => {
    const apnsClient = acceptedClient();
    prismaMock.userSetting.findUnique.mockResolvedValueOnce({
      notificationsEnabled: false,
      timezone: 'UTC',
      language: 'en',
    });
    const disabled = await runProblemNudgeApnsSender(new Date('2026-02-13T08:00:00.000Z'), { apnsClient });
    expect(disabled.sent).toBe(0);
    expect(apnsClient.sendAlert).not.toHaveBeenCalled();

    decisionPatch = { send: false };
    const declined = await runProblemNudgeApnsSender(new Date('2026-02-13T08:00:00.000Z'), { apnsClient });
    expect(declined.sent).toBe(0);
    expect(apnsClient.sendAlert).not.toHaveBeenCalled();
    expect(posthogUrls()).toEqual([]);
  });

  it('emits notification_sent only after the provider call and both sent journal writes', async () => {
    process.env.POSTHOG_API_KEY = 'phc_synthetic';
    const events = [];
    prismaMock.nudgeDeliverySend.update.mockImplementation(async ({ data }) => {
      events.push(`send-journal:${data.status}`);
      return {};
    });
    prismaMock.nudgeDelivery.update.mockImplementation(async ({ data }) => {
      events.push(`parent-journal:${data.status}`);
      return {};
    });
    let captured;
    posthogImpl = async (_href, options) => {
      events.push('telemetry');
      captured = JSON.parse(options.body);
      return { ok: true, status: 200 };
    };
    const apnsClient = {
      sendAlert: vi.fn().mockImplementation(async () => {
        events.push('provider');
        return { ok: true, apnsId: 'apns-1' };
      }),
    };

    const out = await runProblemNudgeApnsSender(new Date('2026-02-13T08:00:00.000Z'), { apnsClient });
    expect(out).toMatchObject({ ok: true, sent: 1, failed: 0 });
    expect(events).toEqual(['provider', 'send-journal:sent', 'parent-journal:sent', 'telemetry']);
    expect(captured.event).toBe('notification_sent');
    expect(captured.distinct_id).toBe(PROFILE_ID);
    expect(captured.properties.event_scope).toBe('APNS_PROVIDER_ACCEPTED');
    expect(captured.properties.$process_person_profile).toBe(false);
    expect(captured.properties.device_token).toBeUndefined();
    expect(captured.properties.opened).toBeUndefined();
    expect(apnsClient.sendAlert).toHaveBeenCalledTimes(1);
  });

  it('makes no PostHog HTTP request when POSTHOG_API_KEY is missing', async () => {
    delete process.env.POSTHOG_API_KEY;
    posthogImpl = async () => {
      throw new Error('posthog must not be called');
    };
    const apnsClient = acceptedClient();
    const out = await runProblemNudgeApnsSender(new Date('2026-02-13T08:00:00.000Z'), { apnsClient });
    expect(out).toMatchObject({ ok: true, sent: 1, failed: 0 });
    expect(apnsClient.sendAlert).toHaveBeenCalledTimes(1);
    expect(posthogUrls()).toEqual([]);
  });

  it('swallows analytics transport failure without a second provider call', async () => {
    process.env.POSTHOG_API_KEY = 'phc_synthetic';
    posthogImpl = async () => {
      throw new Error('posthog offline');
    };
    const apnsClient = acceptedClient();
    const out = await runProblemNudgeApnsSender(new Date('2026-02-13T08:00:00.000Z'), { apnsClient });
    expect(out).toMatchObject({ ok: true, sent: 1, failed: 0 });
    expect(apnsClient.sendAlert).toHaveBeenCalledTimes(1);
    expect(prismaMock.nudgeDeliverySend.update).toHaveBeenCalledWith(
      expect.objectContaining({ data: expect.objectContaining({ status: 'sent' }) })
    );
    expect(prismaMock.nudgeDelivery.update).toHaveBeenCalledWith(
      expect.objectContaining({ data: expect.objectContaining({ status: 'sent' }) })
    );
  });

  it('does not emit telemetry when a journal write fails after APNs acceptance', async () => {
    process.env.POSTHOG_API_KEY = 'phc_synthetic';
    posthogImpl = async () => {
      throw new Error('posthog must not be called');
    };
    prismaMock.nudgeDelivery.update
      .mockRejectedValueOnce(new Error('parent journal down'))
      .mockResolvedValue({});
    const apnsClient = acceptedClient();
    const out = await runProblemNudgeApnsSender(new Date('2026-02-13T08:00:00.000Z'), { apnsClient });
    expect(out).toMatchObject({ ok: true, sent: 1, failed: 1 });
    expect(apnsClient.sendAlert).toHaveBeenCalledTimes(1);
    expect(posthogUrls()).toEqual([]);
  });

  it('skips the provider when Manager is unavailable', async () => {
    delete process.env.MANAGER_PRODUCT_URL;
    delete process.env.MANAGER_SENDER_TOKEN;
    const apnsClient = acceptedClient();
    const out = await runProblemNudgeApnsSender(new Date('2026-02-13T08:00:00.000Z'), { apnsClient });
    expect(out).toMatchObject({ ok: true, sent: 0, failed: 0 });
    expect(apnsClient.sendAlert).not.toHaveBeenCalled();
    expect(fetchUrls).toEqual([]);
    expect(posthogUrls()).toEqual([]);
  });

  function useDurableSendState() {
    const deliveries = new Map();
    const sends = new Map();
    let sendSeq = 0;

    prismaMock.nudgeDelivery.findFirst.mockImplementation(async ({ where }) => {
      const key = deliveryKey(where);
      const row = deliveries.get(key);
      return row ? { ...row } : null;
    });
    prismaMock.nudgeDelivery.create.mockImplementation(async ({ data }) => {
      const row = { status: 'queued', ...data };
      deliveries.set(deliveryKey(data), row);
      return { id: row.id };
    });
    prismaMock.nudgeDelivery.count.mockImplementation(async ({ where }) => {
      let count = 0;
      for (const row of deliveries.values()) {
        if (row.profileId === where.profileId && row.problemType === where.problemType
          && row.deliveryDayLocal.getTime() === where.deliveryDayLocal.getTime()) count += 1;
      }
      return count;
    });
    prismaMock.nudgeDelivery.updateMany.mockImplementation(async ({ where, data }) => {
      const row = [...deliveries.values()].find(item => item.id === where.id && item.status === where.status);
      if (!row) return { count: 0 };
      Object.assign(row, data);
      return { count: 1 };
    });
    prismaMock.nudgeDelivery.update.mockImplementation(async ({ where, data }) => {
      const row = [...deliveries.values()].find(item => item.id === where.id);
      if (row) Object.assign(row, data);
      return {};
    });
    prismaMock.nudgeDeliverySend.findUnique.mockImplementation(async ({ where }) => {
      const id = where.deliveryId_pushTokenId;
      const row = sends.get(`${id.deliveryId}|${id.pushTokenId}`);
      return row ? { ...row } : null;
    });
    prismaMock.nudgeDeliverySend.create.mockImplementation(async ({ data }) => {
      const row = { id: `send-${++sendSeq}`, status: 'queued', nextAttemptAt: null, attemptCount: 0, ...data };
      sends.set(`${data.deliveryId}|${data.pushTokenId}`, row);
      return { ...row };
    });
    prismaMock.nudgeDeliverySend.updateMany.mockImplementation(async ({ where, data }) => {
      const row = [...sends.values()].find(item => item.id === where.id);
      if (!row || row.status !== 'queued') return { count: 0 };
      row.status = data.status;
      row.nextAttemptAt = data.nextAttemptAt;
      row.error = data.error;
      if (data.attemptCount?.increment) row.attemptCount += data.attemptCount.increment;
      return { count: 1 };
    });
    prismaMock.nudgeDeliverySend.update.mockImplementation(async ({ where, data }) => {
      const row = [...sends.values()].find(item => item.id === where.id);
      if (row) Object.assign(row, data);
      return {};
    });
    return { deliveries, sends };
  }
});

function deliveryKey(row) {
  return `${row.profileId}|${row.problemType}|${row.scheduledTime}|${row.deliveryDayLocal.toISOString()}`;
}
