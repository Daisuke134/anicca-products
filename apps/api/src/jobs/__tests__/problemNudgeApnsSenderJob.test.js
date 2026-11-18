import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

vi.mock('../../services/subscriptionStore.js', () => ({
  getEntitlementState: vi.fn(async () => ({ plan: 'pro', status: 'active', currentPeriodEnd: null })),
}));

import { prismaMock, loggerMock } from '../../test/setup.js';

import { isSlotDue, effectiveDeliveryDayLocal, ymdFromDateOnly, selectFreeDailySlots, runProblemNudgeApnsSender } from '../problemNudgeApnsSenderJob.js';
import { ApnsError } from '../../services/apns/apnsClient.js';
import { getEntitlementState } from '../../services/subscriptionStore.js';

describe('problemNudgeApnsSenderJob helpers', () => {
  it('isSlotDue matches only the scheduled minute', () => {
    const nowUtc = new Date('2026-02-13T07:35:00.000Z');
    expect(isSlotDue({ nowUtc, timezone: 'UTC', scheduledTime: '07:35' })).toBe(true);
    expect(isSlotDue({ nowUtc, timezone: 'UTC', scheduledTime: '07:00' })).toBe(false);
    expect(isSlotDue({ nowUtc, timezone: 'UTC', scheduledTime: '07:36' })).toBe(false);
  });

  it('does not backfill a slot across midnight', () => {
    const nowUtc = new Date('2026-02-13T00:05:00.000Z');
    expect(isSlotDue({ nowUtc, timezone: 'UTC', scheduledTime: '23:45' })).toBe(false);
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

// Model mutable rows and conditional claims, rather than unconditionally granting locks.
function matches(row, where = {}) {
  return Object.entries(where).every(([key, value]) => {
    if (key === 'OR') return value.some(w => matches(row, w));
    if (value && typeof value === 'object' && !(value instanceof Date)) {
      if ('in' in value) return value.in.includes(row[key]);
      if ('lte' in value) return row[key] != null && row[key] <= value.lte;
      if ('lt' in value) return row[key] != null && row[key] < value.lt;
      return matches(row[key], value);
    }
    return value instanceof Date ? row[key]?.getTime() === value.getTime() : row[key] === value;
  });
}
const now = new Date('2026-11-18T08:00:00Z');
const profileId = '00000000-0000-0000-0000-000000000001';
let deliveries, sends, tokens, apnsClient;
function apply(row, data) {
  for (const [key, value] of Object.entries(data)) row[key] = value?.increment ? (row[key] || 0) + value.increment : value;
  return { ...row };
}
function saved(status = 'queued', extra = {}) {
  const decision = { delivery_id: 'saved-id', backend: 'manager-v1', policy_version: 'manager-generated-v1',
    send: true, assigned_probability: 1, chosen: { text: 'Saved text' } };
  const delivery = { id: 'saved-id', profileId, problemType: 'affirmation', scheduledTime: '08:00',
    deliveryDayLocal: new Date('2026-11-18T00:00:00Z'), timezone: 'UTC', lang: 'en', status: 'sending',
    messageTitle: 'Anicca', messageBody: 'Saved text', messageDetail: JSON.stringify(decision) };
  deliveries.push(delivery);
  const row = { id: 'send-1', deliveryId: delivery.id, pushTokenId: tokens[0].id,
    status, attemptCount: 1, nextAttemptAt: null, ...extra };
  sends.push(row); return { delivery, row };
}
const run = (date = now) => runProblemNudgeApnsSender(date, { apnsClient });
describe('runProblemNudgeApnsSender Manager delivery', () => {
  beforeEach(() => {
    vi.stubEnv('PUSH_ENV', 'dev'); vi.stubEnv('APNS_ENDPOINT', 'development');
    vi.stubEnv('MANAGER_PRODUCT_URL', 'https://manager.invalid'); vi.stubEnv('MANAGER_SENDER_TOKEN', 'test-secret');
    getEntitlementState.mockResolvedValue({ plan: 'pro' });
    deliveries = []; sends = []; tokens = [{ id: 'token-1', profileId, token: 'device-one' }];
    apnsClient = { sendAlert: vi.fn().mockResolvedValue({ apnsId: 'receipt' }) };
    vi.stubGlobal('fetch', vi.fn(async (_url, options) => {
      const request = JSON.parse(options.body).decisions[0];
      return { ok: true, json: async () => ({ decisions: [{ delivery_id: request.delivery_id,
        backend: 'manager-v1', policy_version: 'manager-generated-v1', send: true,
        assigned_probability: 1, chosen: { text: 'Manager text' } }] }) };
    }));
    prismaMock.pushToken.findMany.mockImplementation(async () => tokens.filter(t => !t.disabledAt));
    prismaMock.pushToken.update.mockImplementation(async ({ where, data }) => apply(tokens.find(t => t.id === where.id), data));
    prismaMock.userSetting.findUnique.mockResolvedValue({ notificationsEnabled: true, timezone: 'UTC', language: 'en' });
    prismaMock.profile.findUnique.mockResolvedValue({ metadata: {} }); prismaMock.nudgeOutcome.findMany.mockResolvedValue([]);
    prismaMock.$transaction.mockImplementation(async fn => fn(prismaMock));
    prismaMock.nudgeDelivery.count.mockImplementation(async ({ where }) => deliveries.filter(d => matches(d, where)).length);
    prismaMock.nudgeDelivery.findFirst.mockImplementation(async ({ where }) => deliveries.find(d => matches(d, where)) || null);
    prismaMock.nudgeDelivery.findUnique.mockImplementation(async ({ where }) => deliveries.find(d => matches(d, where)) || null);
    prismaMock.nudgeDelivery.create.mockImplementation(async ({ data }) => { deliveries.push({ ...data }); return { ...data }; });
    prismaMock.nudgeDelivery.update.mockImplementation(async ({ where, data }) => apply(deliveries.find(d => matches(d, where)), data));
    prismaMock.nudgeDelivery.updateMany.mockImplementation(async ({ where, data }) => {
      const rows = deliveries.filter(d => matches(d, where)); rows.forEach(d => apply(d, data)); return { count: rows.length };
    });
    prismaMock.nudgeDeliverySend.findMany.mockImplementation(async ({ where }) => sends.filter(s => matches(s, where))
      .map(s => ({ ...s, delivery: deliveries.find(d => d.id === s.deliveryId) })));
    prismaMock.nudgeDeliverySend.findUnique.mockImplementation(async ({ where }) => {
      const row = sends.find(s => matches(s, where.deliveryId_pushTokenId || where)); return row ? { ...row } : null;
    });
    prismaMock.nudgeDeliverySend.create.mockImplementation(async ({ data }) => {
      const row = { id: `send-${sends.length + 1}`, attemptCount: 0, nextAttemptAt: null, ...data };
      sends.push(row); return { ...row };
    });
    prismaMock.nudgeDeliverySend.updateMany.mockImplementation(async ({ where, data }) => {
      const rows = sends.filter(s => matches(s, where)); rows.forEach(s => apply(s, data)); return { count: rows.length };
    });
    prismaMock.nudgeDeliverySend.update.mockImplementation(async ({ where, data }) => apply(sends.find(s => matches(s, where)), data));
  });
  afterEach(() => { vi.unstubAllEnvs(); vi.unstubAllGlobals(); });
  it('sends Manager text and never replays a sent row', async () => {
    expect(await run()).toMatchObject({ ok: true, sent: 1 });
    expect(apnsClient.sendAlert.mock.calls[0][0].payload.aps.alert.body).toBe('Manager text');
    await run(); expect(apnsClient.sendAlert).toHaveBeenCalledTimes(1); expect(fetch).toHaveBeenCalledTimes(1);
  });
  it.each(['missing-url', 'missing-token', '401', '403', '503', 'timeout', 'network', 'json', 'validation'])(
    'surfaces Manager %s failure without APNs or secret leakage', async kind => {
      const expected = kind.startsWith('missing') ? 'config_missing' : ['401', '403'].includes(kind) ? 'auth' :
        ['json', 'validation'].includes(kind) ? 'invalid_response' : 'unreachable';
      if (kind === 'missing-url') vi.stubEnv('MANAGER_PRODUCT_URL', '');
      else if (kind === 'missing-token') vi.stubEnv('MANAGER_SENDER_TOKEN', '');
      else if (/^\d+$/.test(kind)) fetch.mockResolvedValue({ ok: false, status: Number(kind) });
      else if (kind === 'timeout') fetch.mockRejectedValue(new DOMException('test-secret', 'TimeoutError'));
      else if (kind === 'network') fetch.mockRejectedValue(new Error('test-secret'));
      else if (kind === 'json') fetch.mockResolvedValue({ ok: true, json: async () => { throw new Error('test-secret'); } });
      else fetch.mockResolvedValue({ ok: true, json: async () => ({ decisions: [{}] }) });
      expect(await run()).toMatchObject({ ok: false, managerFailed: 1, managerFailures: { [expected]: 1 } });
      expect(apnsClient.sendAlert).not.toHaveBeenCalled();
      expect(JSON.stringify(loggerMock.error.mock.calls)).toContain(expected);
      expect(JSON.stringify(loggerMock.error.mock.calls)).not.toContain('test-secret');
    });
  it('honors Manager no-send', async () => {
    const impl = fetch.getMockImplementation(); fetch.mockImplementation(async (...args) => {
      const response = await impl(...args); const body = await response.json(); body.decisions[0].send = false;
      return { ok: true, json: async () => body };
    });
    expect(await run()).toMatchObject({ ok: true, sent: 0 }); expect(apnsClient.sendAlert).not.toHaveBeenCalled();
  });
  it.each(['queued', 'failed', 'sending'])('rejects old catalog rows (%s) without regeneration', async status => {
    const { delivery } = saved(status, { nextAttemptAt: new Date(now.getTime() - 1000), lastAttemptAt: new Date(now.getTime() - 600000) });
    delivery.messageDetail = 'old catalog detail'; await run(); await run(new Date(now.getTime() + 600000));
    expect(apnsClient.sendAlert).not.toHaveBeenCalled(); expect(fetch).not.toHaveBeenCalled();
  });
  it.each([false, true])('sends both devices despite first device permanent failure=%s', async badFirst => {
    tokens.push({ id: 'token-2', profileId, token: 'device-two' });
    if (badFirst) apnsClient.sendAlert.mockRejectedValueOnce(new ApnsError({ status: 410, reason: 'Unregistered' }));
    await run(); expect(apnsClient.sendAlert).toHaveBeenCalledTimes(2);
    expect(sends.find(s => s.pushTokenId === 'token-2').status).toBe('sent'); expect(fetch).toHaveBeenCalledTimes(1);
  });
  it('reuses saved decision with Manager config absent', async () => {
    saved(); vi.stubEnv('MANAGER_PRODUCT_URL', ''); expect(await run()).toMatchObject({ ok: true, sent: 1 });
    expect(apnsClient.sendAlert.mock.calls[0][0].payload.aps.alert.body).toBe('Saved text'); expect(fetch).not.toHaveBeenCalled();
  });
  it('retries explicit APNs rejection after backoff outside the slot', async () => {
    apnsClient.sendAlert.mockRejectedValueOnce(new ApnsError({ status: 503, reason: 'ServiceUnavailable' }));
    expect(await run()).toMatchObject({ failed: 1 }); expect(sends[0].status).toBe('failed');
    await run(new Date(now.getTime() + 60000)); expect(apnsClient.sendAlert).toHaveBeenCalledTimes(1);
    expect(await run(new Date(now.getTime() + 600000))).toMatchObject({ sent: 1 });
    expect(sends[0]).toMatchObject({ status: 'sent', attemptCount: 2 }); expect(fetch).toHaveBeenCalledTimes(1);
  });
  it('recovers stale pre-send claim using saved text', async () => {
    saved('claimed', { lastAttemptAt: new Date(now.getTime() - 600000) });
    expect(await run(new Date(now.getTime() + 60000))).toMatchObject({ sent: 1 });
    expect(fetch).not.toHaveBeenCalled(); expect(sends[0].status).toBe('sent');
  });
  it('does not steal a fresh claim', async () => {
    saved('claimed', { lastAttemptAt: now }); await run(); expect(apnsClient.sendAlert).not.toHaveBeenCalled();
  });
  it('quarantines stale sending as unknown without replay', async () => {
    saved('sending', { lastAttemptAt: new Date(now.getTime() - 600000) });
    expect(await run(new Date(now.getTime() + 60000))).toMatchObject({ ok: false, outcomeUnknown: 1 });
    expect(sends[0]).toMatchObject({ status: 'outcome_unknown', nextAttemptAt: null });
    await run(new Date(now.getTime() + 120000)); expect(apnsClient.sendAlert).not.toHaveBeenCalled();
  });
  it('does not retry transport failure with unknown APNs outcome', async () => {
    apnsClient.sendAlert.mockRejectedValueOnce(new Error('connection reset'));
    expect(await run()).toMatchObject({ ok: false, outcomeUnknown: 1 }); expect(sends[0].status).toBe('outcome_unknown');
    await run(new Date(now.getTime() + 600000)); expect(apnsClient.sendAlert).toHaveBeenCalledTimes(1);
  });
  it('does not replay APNs acceptance when receipt persistence fails', async () => {
    prismaMock.nudgeDeliverySend.update.mockRejectedValueOnce(new Error('database unavailable'));
    expect(await run()).toMatchObject({ ok: false, outcomeUnknown: 1 });
    await run(new Date(now.getTime() + 600000)); expect(apnsClient.sendAlert).toHaveBeenCalledTimes(1);
  });
  it('does not change an unowned row when the atomic claim fails', async () => {
    saved();
    prismaMock.nudgeDeliverySend.updateMany.mockRejectedValueOnce(new Error('database unavailable'));
    expect(await run(new Date(now.getTime() + 60000))).toMatchObject({ ok: false, failed: 1 });
    expect(sends[0].status).toBe('queued');
    expect(apnsClient.sendAlert).not.toHaveBeenCalled();
  });
  it('retries a definite failure before APNs invocation', async () => {
    saved();
    const update = prismaMock.nudgeDeliverySend.updateMany.getMockImplementation();
    prismaMock.nudgeDeliverySend.updateMany.mockImplementationOnce(update)
      .mockRejectedValueOnce(new Error('database unavailable'));
    expect(await run(new Date(now.getTime() + 60000))).toMatchObject({ ok: false, failed: 1, outcomeUnknown: 0 });
    expect(apnsClient.sendAlert).not.toHaveBeenCalled();
    expect(await run(new Date(now.getTime() + 600000))).toMatchObject({ sent: 1 });
  });
  it('keeps a saved APNs receipt when the parent update fails', async () => {
    prismaMock.nudgeDelivery.update.mockRejectedValueOnce(new Error('database unavailable'));
    expect(await run()).toMatchObject({ ok: false, sent: 1 });
    expect(sends[0]).toMatchObject({ status: 'sent', apnsId: 'receipt' });
    await run(new Date(now.getTime() + 600000));
    expect(apnsClient.sendAlert).toHaveBeenCalledTimes(1);
  });
  it('only one concurrent runner sends a queued device row', async () => {
    saved();
    await Promise.all([run(), run()]);
    expect(apnsClient.sendAlert).toHaveBeenCalledTimes(1);
  });
  it('keeps fresh sending and terminal token failures from replaying', async () => {
    saved('sending', { lastAttemptAt: now }); await run();
    expect(apnsClient.sendAlert).not.toHaveBeenCalled();
    sends[0].status = 'failed'; sends[0].nextAttemptAt = null;
    await run(); expect(apnsClient.sendAlert).not.toHaveBeenCalled();
  });
  it.each(['policy', 'id', 'probability', 'text'])('rejects malformed saved Manager %s', async field => {
    const { delivery } = saved();
    const decision = JSON.parse(delivery.messageDetail);
    if (field === 'policy') decision.policy_version = 'old';
    if (field === 'id') decision.delivery_id = 'another-delivery';
    if (field === 'probability') decision.assigned_probability = 0;
    if (field === 'text') decision.chosen.text = '';
    delivery.messageDetail = JSON.stringify(decision);
    await run(); await run(new Date(now.getTime() + 60000));
    expect(apnsClient.sendAlert).not.toHaveBeenCalled(); expect(fetch).not.toHaveBeenCalled();
  });
  it.each(['missing', 'mismatch'])('fails closed on %s APNs endpoint', async kind => {
    vi.stubEnv('APNS_ENDPOINT', kind === 'missing' ? '' : 'production');
    expect(await run()).toMatchObject({ ok: false, sent: 0 });
    expect(apnsClient.sendAlert).not.toHaveBeenCalled(); expect(fetch).not.toHaveBeenCalled();
  });
  it('surfaces global APNs auth failure once and stops the run', async () => {
    tokens.push({ id: 'token-2', profileId, token: 'device-two' });
    apnsClient.sendAlert.mockRejectedValueOnce(new ApnsError({ status: 403, reason: 'InvalidProviderToken' }));
    expect(await run()).toMatchObject({ ok: false, failed: 1 });
    expect(apnsClient.sendAlert).toHaveBeenCalledTimes(1);
    expect(sends[0]).toMatchObject({ status: 'failed', nextAttemptAt: new Date(now.getTime() + 300000) });
  });
  it('keeps the free cap per profile with two devices', async () => {
    getEntitlementState.mockResolvedValue({ plan: 'free' }); tokens.push({ id: 'token-2', profileId, token: 'device-two' });
    for (const hour of [9, 14, 20]) await run(new Date(`2026-11-18T${hour.toString().padStart(2, '0')}:00:00Z`));
    expect(deliveries).toHaveLength(3); expect(apnsClient.sendAlert).toHaveBeenCalledTimes(6);
  });
});
