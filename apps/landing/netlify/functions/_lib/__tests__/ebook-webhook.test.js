const test = require('node:test');
const assert = require('node:assert/strict');
const crypto = require('node:crypto');
const fs = require('node:fs');
const path = require('node:path');

const { webhookHandler } = require('../../webhook.js');

const ebookWebhookMigration = fs.readFileSync(path.join(
  __dirname,
  '../../_migrations/2026-10-05-ebook-webhook-receipts.sql',
), 'utf8');

function migrationFunction(name) {
  const start = ebookWebhookMigration.indexOf(`CREATE OR REPLACE FUNCTION public.${name}(`);
  assert.notEqual(start, -1, `missing migration function ${name}`);
  const bodyStart = ebookWebhookMigration.indexOf('AS $$', start);
  const end = ebookWebhookMigration.indexOf('$$;', bodyStart);
  assert.ok(bodyStart > start && end > bodyStart, `invalid migration function ${name}`);
  return ebookWebhookMigration.slice(start, end + 3);
}

const SECRET = 'whsec_ebook_test';
const NOW = 1785642000;
const SUPABASE_URL = 'https://supabase.example.test';
// Golden vectors from Life Manager attribution.py for creative.contract.1.
const TOKEN_EN = 'ee_hcp4v5pifa2ovj47rsir';
const TOKEN_JP = 'ej_cs6k5hu42kvx65x66imw';

function signedEvent(payload, { signature, timestamp = NOW } = {}) {
  const body = JSON.stringify(payload);
  const digest = crypto.createHmac('sha256', SECRET).update(`${timestamp}.${body}`).digest('hex');
  return {
    httpMethod: 'POST',
    body,
    headers: { 'stripe-signature': `t=${timestamp},v1=${signature || digest}` },
  };
}

function response(status, value) {
  return {
    ok: status >= 200 && status < 300,
    status,
    json: async () => value,
    text: async () => JSON.stringify(value),
  };
}

function fakeGateway({
  receiptStatus = 201,
  buyerStatus = 201,
  resendStatus = 200,
  resendErrorName = 'resend_unavailable',
  resendResponses = [],
  stripeSubscriptionResponses = [],
  stripeCustomerSubscriptionPages = [],
  staleSubscriptionStateIds = [],
  beforeStripeSubscriptionResponse = async () => {},
  legacySubscribers = [],
  failEventReceiptWrites = 0,
} = {}) {
  const receiptsBySession = new Map();
  const receiptsByEvent = new Map();
  const buyerRows = [];
  const subscriberRows = [];
  const subscribersById = new Map();
  const subscribersByEmail = new Map();
  const subscriberIdsByEmail = new Map();
  const subscriptionStates = new Map();
  const subscriptionReadbackReservations = [];
  const stripeCustomerSubscriptionListRequests = [];
  const stripeCustomerSubscriptionById = new Map();
  for (const page of stripeCustomerSubscriptionPages) {
    for (const subscription of page.body?.data || []) {
      if (subscription && typeof subscription.id === 'string') {
        stripeCustomerSubscriptionById.set(subscription.id, subscription);
      }
    }
  }
  const legacySubscriptionFinalizations = [];
  const reconciliationOperations = [];
  const emailRequests = [];
  let eventReceiptFailuresRemaining = failEventReceiptWrites;
  let resendAttempts = 0;
  let stripeSubscriptionReads = 0;

  for (const seed of legacySubscribers) {
    const email = seed.email.trim().toLowerCase();
    const subscriber = {
      ...seed,
      id: seed.id || `subscriber_${subscriberIdsByEmail.size + 1}`,
      email,
      stripe_subscription_created_at: seed.stripe_subscription_created_at || null,
      stripe_legacy_paid_pending_readback: seed.stripe_legacy_paid_pending_readback
        ?? (seed.tier === 'paid' && !seed.stripe_subscription_id),
    };
    const subscriberId = subscriber.id;
    subscriberIdsByEmail.set(email, subscriberId);
    subscribersByEmail.set(email, subscriber);
    if (seed.stripe_subscription_id) {
      subscriptionStates.set(seed.stripe_subscription_id, {
        readbackAt: 0,
        generation: 0,
        status: seed.tier === 'paid' ? 'legacy_paid_pending_readback' : 'legacy_inactive_pending_readback',
        eventId: 'migration_backfill',
        email,
        subscriberId,
        createdAt: subscriber.stripe_subscription_created_at ? Date.parse(subscriber.stripe_subscription_created_at) : null,
        customerId: seed.stripe_customer_id,
        lang: seed.lang,
      });
      subscribersById.set(seed.stripe_subscription_id, subscriber);
    }
  }

  async function fetchImpl(url, options = {}) {
    const method = options.method || 'GET';
    const body = options.body ? JSON.parse(options.body) : null;

    if (url.includes('/rest/v1/ebook_webhook_receipts')) {
      if (method === 'POST') {
        if (receiptStatus >= 400) return response(receiptStatus, { message: 'receipt store unavailable' });
        const keyedBySession = url.includes('on_conflict=stripe_session_id');
        if (!keyedBySession && eventReceiptFailuresRemaining > 0) {
          eventReceiptFailuresRemaining -= 1;
          return response(503, { message: 'event receipt store unavailable' });
        }
        const key = keyedBySession ? body.stripe_session_id : body.stripe_event_id;
        const table = keyedBySession ? receiptsBySession : receiptsByEvent;
        if (table.has(key)) return response(201, []);
        const row = { ...body };
        table.set(key, row);
        if (keyedBySession) receiptsByEvent.set(body.stripe_event_id, row);
        return response(201, [{ ...row }]);
      }
      if (method === 'GET') {
        const sessionMatch = url.match(/stripe_session_id=eq\.([^&]+)/);
        const eventMatch = url.match(/stripe_event_id=eq\.([^&]+)/);
        const row = sessionMatch
          ? receiptsBySession.get(decodeURIComponent(sessionMatch[1]))
          : receiptsByEvent.get(decodeURIComponent(eventMatch?.[1] || ''));
        return response(200, row ? [{ ...row }] : []);
      }
      if (method === 'PATCH') {
        const sessionMatch = url.match(/stripe_session_id=eq\.([^&]+)/);
        const eventMatch = url.match(/stripe_event_id=eq\.([^&]+)/);
        const table = sessionMatch ? receiptsBySession : receiptsByEvent;
        const key = decodeURIComponent((sessionMatch || eventMatch)[1]);
        const row = table.get(key);
        if (!row) return response(200, []);
        Object.assign(row, body);
        return response(200, [{ ...row }]);
      }
    }

    if (url.includes('/rest/v1/rpc/reserve_ebook_subscription_readback')) {
      const subscriptionId = body.p_stripe_subscription_id;
      let state = subscriptionStates.get(subscriptionId);
      const email = (body.p_email || state?.email || '').trim().toLowerCase();
      let subscriber = email ? subscribersByEmail.get(email) : subscribersById.get(subscriptionId);
      if (!subscriber && !email && body.p_stripe_customer_id) {
        subscriber = [...subscribersByEmail.values()].find(
          (row) => row.stripe_customer_id === body.p_stripe_customer_id,
        );
      }
      if (email && !subscriber) {
        subscriber = {
          id: `subscriber_${subscriberIdsByEmail.size + 1}`,
          email,
          tier: 'expired',
          stripe_subscription_id: null,
          stripe_subscription_created_at: null,
          stripe_legacy_paid_pending_readback: false,
        };
        subscriberIdsByEmail.set(email, subscriber.id);
        subscribersByEmail.set(email, subscriber);
      }
      if (!subscriber) return response(500, { message: 'subscriber mapping missing' });
      if (state && state.subscriberId !== subscriber.id) return response(500, { message: 'subscriber mismatch' });
      if (subscriber.stripe_legacy_paid_pending_readback === true
          && (!body.p_stripe_customer_id
            || subscriber.stripe_customer_id !== body.p_stripe_customer_id)) {
        return response(200, {
          outcome: 'legacy_customer_mismatch',
          subscriber_id: subscriber.id,
          stripe_customer_id: subscriber.stripe_customer_id || null,
          stripe_legacy_paid_pending_readback: true,
        });
      }
      const mappedCustomerMismatch = body.p_stripe_customer_id
        && state?.customerId
        && state.customerId !== body.p_stripe_customer_id;
      if (mappedCustomerMismatch) return response(200, { outcome: 'customer_mismatch' });
      if (!state) {
        state = {
          readbackAt: 0,
          generation: 0,
          status: 'unknown',
          eventId: '',
          email: subscriber.email,
          subscriberId: subscriber.id,
          createdAt: null,
        };
        subscriptionStates.set(subscriptionId, state);
      }
      state.generation += 1;
      state.email = subscriber.email;
      state.subscriberId = subscriber.id;
      if (body.p_stripe_customer_id) state.customerId = body.p_stripe_customer_id;
      if (body.p_lang) state.lang = body.p_lang;
      subscriptionReadbackReservations.push({ subscriptionId, generation: state.generation, subscriberId: subscriber.id });
      reconciliationOperations.push({ type: 'reserve', subscriptionId });
      return response(200, {
        outcome: 'reserved',
        generation: state.generation,
        subscriber_id: subscriber.id,
        pointer_subscription_id: subscriber.stripe_subscription_id,
        stripe_customer_id: subscriber.stripe_customer_id || null,
        stripe_legacy_paid_pending_readback: subscriber.stripe_legacy_paid_pending_readback === true,
      });
    }

    if (url.includes('/rest/v1/rpc/finalize_ebook_legacy_subscription_readback')) {
      legacySubscriptionFinalizations.push(body);
      reconciliationOperations.push({ type: 'finalize', subscriberId: body.p_subscriber_id });
      const subscriber = [...subscribersByEmail.values()].find((row) => row.id === body.p_subscriber_id);
      if (!subscriber || subscriber.stripe_customer_id !== body.p_stripe_customer_id) {
        return response(409, { outcome: 'conflict' });
      }
      const letterIds = new Set(body.p_letter_subscription_ids || []);
      const relatedStates = [...subscriptionStates.values()].filter(
        (state) => state.subscriberId === subscriber.id && state.customerId === body.p_stripe_customer_id,
      );
      for (const state of relatedStates) {
        if (!letterIds.has([...subscriptionStates.entries()].find(([, value]) => value === state)?.[0])) {
          state.status = 'canceled';
        }
      }
      subscriber.stripe_legacy_paid_pending_readback = false;
      subscriber.tier = [...subscriptionStates.values()].some((state) =>
        state.subscriberId === subscriber.id && ['active', 'trialing'].includes(state.status))
        ? 'paid'
        : 'expired';
      return response(200, { outcome: 'reconciled', status: subscriber.tier });
    }

    if (url.includes('/rest/v1/rpc/apply_ebook_subscription_state')) {
      const subscriptionId = body.p_stripe_subscription_id;
      const readbackAt = body.p_readback_at ? Date.parse(body.p_readback_at) : Date.now();
      const existing = subscriptionStates.get(subscriptionId);
      reconciliationOperations.push({ type: 'apply', subscriptionId });
      if (existing && staleSubscriptionStateIds.includes(subscriptionId)) existing.generation += 1;
      const usesGeneration = body.p_readback_generation !== undefined;
      if (usesGeneration && existing?.generation !== body.p_readback_generation) {
        return response(200, { outcome: 'stale', status: existing?.status || 'unknown' });
      }
      if (existing && existing.customerId && body.p_stripe_customer_id
          && existing.customerId !== body.p_stripe_customer_id) {
        return response(200, { outcome: 'customer_mismatch', status: existing.status });
      }
      if (!usesGeneration && existing && readbackAt < existing.readbackAt) {
        return response(200, { outcome: 'stale', status: existing.status, readback_at: new Date(existing.readbackAt).toISOString() });
      }
      if (!usesGeneration && existing && readbackAt === existing.readbackAt) {
        return existing.status === body.p_subscription_status
          ? response(200, { outcome: 'duplicate', status: existing.status, readback_at: new Date(existing.readbackAt).toISOString() })
          : response(200, { outcome: 'conflict', status: existing.status, readback_at: new Date(existing.readbackAt).toISOString() });
      }
      const email = (body.p_email || existing?.email || '').trim().toLowerCase();
      if (!email) return response(500, { message: 'subscriber mapping missing' });
      const subscriberId = body.p_subscriber_id || existing?.subscriberId || subscriberIdsByEmail.get(email) || `subscriber_${subscriberIdsByEmail.size + 1}`;
      subscriberIdsByEmail.set(email, subscriberId);
      let subscriber = subscribersByEmail.get(email);
      if (!subscriber) {
        subscriber = {
          id: subscriberId,
          email,
          tier: 'expired',
          stripe_subscription_id: null,
          stripe_subscription_created_at: null,
          stripe_legacy_paid_pending_readback: false,
        };
        subscribersByEmail.set(email, subscriber);
      }
      subscriptionStates.set(subscriptionId, {
        readbackAt,
        generation: existing?.generation || 0,
        status: body.p_subscription_status,
        eventId: body.p_event_id,
        email,
        subscriberId,
        createdAt: body.p_subscription_created_at ? Date.parse(body.p_subscription_created_at) : existing?.createdAt || null,
        customerId: body.p_stripe_customer_id || existing?.customerId || null,
        lang: body.p_lang || existing?.lang || null,
      });
      const hasAccess = [...subscriptionStates.values()].some((state) =>
        state.subscriberId === subscriberId && ['active', 'trialing', 'legacy_paid_pending_readback'].includes(state.status))
        || subscriber.stripe_legacy_paid_pending_readback;
      subscriber.tier = hasAccess ? 'paid' : 'expired';
      subscriber.unsubscribed_at = hasAccess ? null : body.p_subscription_status === 'canceled' ? 'canceled_at' : subscriber.unsubscribed_at;
      const pointerCreatedAt = subscriber.stripe_subscription_created_at
        ? Date.parse(subscriber.stripe_subscription_created_at)
        : null;
      const canReselectPointer = subscriber.stripe_subscription_id === null
        || subscriber.stripe_subscription_id === subscriptionId
        || pointerCreatedAt !== null;
      if (canReselectPointer) {
        const candidate = [...subscriptionStates.entries()]
          .filter(([, state]) => state.subscriberId === subscriberId && state.createdAt !== null)
          .sort(([idA, stateA], [idB, stateB]) => stateB.createdAt - stateA.createdAt || idB.localeCompare(idA))[0];
        if (candidate) {
          const [candidateId, candidateState] = candidate;
          const movesPointer = subscriber.stripe_subscription_id === null
            || subscriber.stripe_subscription_id === subscriptionId
            || candidateState.createdAt > pointerCreatedAt
            || (candidateState.createdAt === pointerCreatedAt && candidateId.localeCompare(subscriber.stripe_subscription_id) > 0);
          if (movesPointer) {
            subscriber.stripe_subscription_id = candidateId;
            subscriber.stripe_subscription_created_at = new Date(candidateState.createdAt).toISOString();
            subscriber.stripe_customer_id = candidateState.customerId || subscriber.stripe_customer_id;
            subscriber.lang = candidateState.lang || subscriber.lang;
          }
        }
      }
      subscribersById.set(subscriptionId, subscriber);
      return response(200, { outcome: 'applied', status: body.p_subscription_status, readback_at: body.p_readback_at });
    }

    if (url.includes('/rest/v1/buyers')) {
      if (buyerStatus >= 400) return response(buyerStatus, { message: 'buyer store unavailable' });
      buyerRows.push(body);
      return response(201, [body]);
    }
    if (url.includes('/rest/v1/subscribers')) {
      subscriberRows.push({ url, method, body });
      if (method === 'POST') {
        subscribersById.set(body.stripe_subscription_id, { ...body });
        return response(201, [{ ...body }]);
      }
      const subscriptionMatch = url.match(/stripe_subscription_id=eq\.([^&]+)/);
      const id = decodeURIComponent(subscriptionMatch?.[1] || '');
      const existing = subscribersById.get(id);
      if (!existing) return response(200, []);
      Object.assign(existing, body);
      return response(200, [{ ...existing }]);
    }
    if (url === 'https://api.resend.com/emails') {
      emailRequests.push({ headers: options.headers, body });
      const spec = resendResponses[resendAttempts++] || {
        status: resendStatus,
        body: resendStatus < 300 ? { id: `email_${emailRequests.length}` } : { name: resendErrorName },
      };
      return response(spec.status, spec.body);
    }
    if (url.startsWith('https://api.stripe.com/v1/subscriptions?')) {
      const readIndex = stripeCustomerSubscriptionListRequests.length;
      stripeCustomerSubscriptionListRequests.push(url);
      reconciliationOperations.push({ type: 'stripe_list', url });
      const spec = stripeCustomerSubscriptionPages[readIndex] || {
        status: 200,
        body: { object: 'list', data: [], has_more: false },
      };
      return response(spec.status, spec.body);
    }
    if (url.startsWith('https://api.stripe.com/v1/subscriptions/')) {
      const readIndex = stripeSubscriptionReads++;
      const subscriptionId = decodeURIComponent(url.split('/').at(-1));
      const listed = stripeCustomerSubscriptionById.get(subscriptionId);
      const spec = stripeSubscriptionResponses[readIndex] || {
        status: 200,
        body: listed || { id: subscriptionId, status: 'active', created: 1780600000 },
      };
      await beforeStripeSubscriptionResponse(readIndex, spec);
      reconciliationOperations.push({ type: 'stripe_read', subscriptionId });
      return response(spec.status, { ...listed, created: 1780600000, ...spec.body });
    }
    throw new Error(`unexpected request: ${method} ${url}`);
  }

  return {
    fetchImpl, receiptsBySession, receiptsByEvent, buyerRows, subscriberRows, subscribersById, subscribersByEmail, subscriptionStates, subscriptionReadbackReservations, stripeCustomerSubscriptionListRequests, legacySubscriptionFinalizations, reconciliationOperations, emailRequests,
    get stripeSubscriptionReads() { return stripeSubscriptionReads; },
  };
}

function dependencies(gateway, overrides = {}) {
  return {
    env: {
      STRIPE_WEBHOOK_SECRET: SECRET,
      STRIPE_SECRET_KEY: 'sk_test_redacted',
      RESEND_API_KEY: 're_test_redacted',
      RESEND_FROM_EMAIL: 'Anicca <hello@example.test>',
      SUPABASE_URL,
      SUPABASE_SERVICE_ROLE_KEY: 'service_role_redacted',
    },
    nowSeconds: NOW,
    fetchImpl: gateway.fetchImpl,
    logFailure: () => {},
    ...overrides,
  };
}

function ebookCheckout({ id = 'cs_ebook_en', eventId = 'evt_ebook_en', lang = 'en', token = TOKEN_EN } = {}) {
  return {
    id: eventId,
    type: 'checkout.session.completed',
    data: { object: {
      id,
      mode: 'payment',
      payment_status: 'paid',
      customer: 'cus_ebook',
      metadata: { product: 'ebook', lang, attribution_token: token },
      customer_details: { email: 'buyer@example.com' },
      amount_total: lang === 'jp' ? 1580 : 1099,
      currency: lang === 'jp' ? 'jpy' : 'usd',
    } },
  };
}

test('bad Stripe signature causes no database or email effects', async () => {
  const gateway = fakeGateway();
  const payload = ebookCheckout();
  const result = await webhookHandler(
    signedEvent(payload, { signature: '0'.repeat(64) }),
    dependencies(gateway),
  );

  assert.equal(result.statusCode, 400);
  assert.equal(gateway.receiptsBySession.size, 0);
  assert.equal(gateway.emailRequests.length, 0);
});

test('paid English ebook stores its campaign receipt and sends the matching PDF plus Letter CTA', async () => {
  const gateway = fakeGateway();
  const result = await webhookHandler(signedEvent(ebookCheckout()), dependencies(gateway));
  const receipt = gateway.receiptsBySession.get('cs_ebook_en');
  const email = gateway.emailRequests[0];

  assert.equal(result.statusCode, 200);
  assert.equal(receipt.attribution_token, TOKEN_EN);
  assert.equal(receipt.payment_status, 'paid');
  assert.equal(receipt.delivery_status, 'delivered');
  assert.equal(receipt.resend_id, 'email_1');
  assert.equal(gateway.buyerRows[0].stripe_session_id, 'cs_ebook_en');
  assert.equal(email.headers['Idempotency-Key'], 'ebook-delivery-cs_ebook_en');
  assert.equal(email.body.from, 'Anicca <hello@example.test>');
  assert.match(email.body.html, /anicca-reset-en\.pdf/);
  assert.match(email.body.html, new RegExp(`/letter\\?utm_campaign=${TOKEN_EN}`));
});

test('paid Japanese ebook keeps locale-specific receipt, PDF, and Tegami CTA', async () => {
  const gateway = fakeGateway();
  const result = await webhookHandler(
    signedEvent(ebookCheckout({ id: 'cs_ebook_jp', eventId: 'evt_ebook_jp', lang: 'jp', token: TOKEN_JP })),
    dependencies(gateway),
  );
  const receipt = gateway.receiptsBySession.get('cs_ebook_jp');
  const email = gateway.emailRequests[0];

  assert.equal(result.statusCode, 200);
  assert.equal(receipt.lang, 'jp');
  assert.equal(receipt.attribution_token, TOKEN_JP);
  assert.match(email.body.html, /anicca-reset-jp\.pdf/);
  assert.match(email.body.html, new RegExp(`/tegami\\?utm_campaign=${TOKEN_JP}`));
});

test('same Stripe event or Checkout session replay never sends a second ebook email', async () => {
  const gateway = fakeGateway();
  const deps = dependencies(gateway);
  const first = ebookCheckout();
  const differentEventSameSession = ebookCheckout({ id: 'cs_ebook_en', eventId: 'evt_second_delivery' });

  await webhookHandler(signedEvent(first), deps);
  const replay = await webhookHandler(signedEvent(first), deps);
  const duplicateSession = await webhookHandler(signedEvent(differentEventSameSession), deps);

  assert.equal(replay.statusCode, 200);
  assert.equal(duplicateSession.statusCode, 200);
  assert.equal(gateway.emailRequests.length, 1);
  assert.equal(gateway.receiptsBySession.size, 1);
});

test('buyer receipt persistence failure returns retryable error before sending email', async () => {
  const gateway = fakeGateway({ buyerStatus: 503 });
  const result = await webhookHandler(signedEvent(ebookCheckout()), dependencies(gateway));

  assert.ok(result.statusCode >= 500);
  assert.equal(gateway.emailRequests.length, 0);
  assert.equal(gateway.receiptsBySession.get('cs_ebook_en').delivery_status, 'retryable_failure');
});

test('missing checkout email is durably surfaced without sending or replaying delivery', async () => {
  const gateway = fakeGateway();
  const payload = ebookCheckout();
  delete payload.data.object.customer_details;
  delete payload.data.object.customer_email;

  const first = await webhookHandler(signedEvent(payload), dependencies(gateway));
  const replay = await webhookHandler(signedEvent(payload), dependencies(gateway));
  const receipt = gateway.receiptsBySession.get('cs_ebook_en');

  assert.ok(first.statusCode >= 500);
  assert.equal(replay.statusCode, 200);
  assert.equal(receipt.delivery_status, 'needs_email');
  assert.equal(receipt.next_action, 'buyer_email_reconciliation');
  assert.equal(gateway.emailRequests.length, 0);
});

test('missing verified sender configuration retries before calling Resend', async () => {
  const gateway = fakeGateway();
  const deps = dependencies(gateway);
  delete deps.env.RESEND_FROM_EMAIL;

  const result = await webhookHandler(signedEvent(ebookCheckout()), deps);

  assert.ok(result.statusCode >= 500);
  assert.equal(gateway.emailRequests.length, 0);
  assert.equal(gateway.receiptsBySession.get('cs_ebook_en').delivery_status, 'retryable_failure');
  assert.equal(gateway.receiptsBySession.get('cs_ebook_en').next_action, 'configure_verified_resend_sender');
});

test('Resend failure is surfaced and its ambiguous delivery receipt fences replay', async () => {
  const gateway = fakeGateway({ resendStatus: 503 });
  const deps = dependencies(gateway);
  const event = signedEvent(ebookCheckout());

  const first = await webhookHandler(event, deps);
  const replay = await webhookHandler(event, deps);

  assert.ok(first.statusCode >= 500);
  assert.ok(replay.statusCode >= 500);
  assert.equal(gateway.emailRequests.length, 1);
  assert.equal(gateway.receiptsBySession.get('cs_ebook_en').delivery_status, 'effect_unknown');
});

test('Resend invalid_idempotent_request 409 fences delivery instead of retrying a different payload', async () => {
  const gateway = fakeGateway({ resendStatus: 409, resendErrorName: 'invalid_idempotent_request' });
  const deps = dependencies(gateway);
  const event = signedEvent(ebookCheckout());

  const first = await webhookHandler(event, deps);
  const replay = await webhookHandler(event, deps);

  assert.ok(first.statusCode >= 500);
  assert.ok(replay.statusCode >= 500);
  assert.equal(gateway.emailRequests.length, 1);
  assert.equal(gateway.receiptsBySession.get('cs_ebook_en').delivery_status, 'effect_unknown');
});

test('Resend concurrent_idempotent_requests 409 retries the identical request safely', async () => {
  const gateway = fakeGateway({ resendResponses: [
    { status: 409, body: { name: 'concurrent_idempotent_requests' } },
    { status: 200, body: { id: 'email_recovered' } },
  ] });
  const deps = dependencies(gateway);
  const event = signedEvent(ebookCheckout());

  const first = await webhookHandler(event, deps);
  const replay = await webhookHandler(event, deps);

  assert.ok(first.statusCode >= 500);
  assert.equal(replay.statusCode, 200);
  assert.equal(gateway.emailRequests.length, 2);
  assert.equal(gateway.emailRequests[0].headers['Idempotency-Key'], gateway.emailRequests[1].headers['Idempotency-Key']);
  assert.equal(gateway.receiptsBySession.get('cs_ebook_en').delivery_status, 'delivered');
});

test('Letter trial and paid invoice receipts preserve attribution without ebook delivery', async () => {
  const gateway = fakeGateway({ stripeSubscriptionResponses: [
    { status: 200, body: { id: 'sub_letter', status: 'trialing' } },
    { status: 200, body: { id: 'sub_letter', status: 'active' } },
  ] });
  const deps = dependencies(gateway);
  const trial = {
    id: 'evt_letter_trial',
    type: 'checkout.session.completed',
    data: { object: {
      id: 'cs_letter_trial', mode: 'subscription', payment_status: 'no_payment_required',
      customer: 'cus_letter', subscription: 'sub_letter',
      metadata: { product: 'letter', lang: 'en', attribution_token: TOKEN_EN },
      customer_details: { email: 'reader@example.com' },
    } },
  };
  const invoice = {
    id: 'evt_letter_paid',
    type: 'invoice.paid',
    data: { object: {
      id: 'in_letter_paid', customer: 'cus_letter', subscription: 'sub_letter',
      amount_paid: 999, currency: 'usd', status: 'paid',
      parent: { subscription_details: { metadata: { product: 'letter', lang: 'en', attribution_token: TOKEN_EN } } },
    } },
  };
  const active = {
    id: 'evt_letter_active',
    type: 'customer.subscription.updated',
    data: { object: {
      id: 'sub_letter', customer: 'cus_letter', status: 'active',
      metadata: { product: 'letter', lang: 'en', attribution_token: TOKEN_EN },
    } },
  };

  await webhookHandler(signedEvent(trial), deps);
  await webhookHandler(signedEvent(invoice), deps);
  await webhookHandler(signedEvent(active), deps);

  const trialReceipt = gateway.receiptsBySession.get('cs_letter_trial');
  const paidReceipt = gateway.receiptsByEvent.get('evt_letter_paid');
  const activeReceipt = gateway.receiptsByEvent.get('evt_letter_active');
  assert.equal(trialReceipt.attribution_token, TOKEN_EN);
  assert.equal(trialReceipt.payment_status, 'no_payment_required');
  assert.equal(trialReceipt.subscription_status, 'trialing');
  assert.equal(paidReceipt.payment_status, 'paid');
  assert.equal(paidReceipt.attribution_token, TOKEN_EN);
  assert.equal(activeReceipt.subscription_status, 'active');
  assert.equal(gateway.emailRequests.length, 1);
  assert.match(gateway.emailRequests[0].body.html, /first 14 days are free/);
  assert.doesNotMatch(gateway.emailRequests[0].body.html, /anicca-reset-en\.pdf/);
});

test('subscription state update replays safely if its event receipt insert fails', async () => {
  const gateway = fakeGateway({
    failEventReceiptWrites: 1,
    stripeSubscriptionResponses: [
      { status: 200, body: { id: 'sub_letter', status: 'trialing' } },
      { status: 200, body: { id: 'sub_letter', status: 'past_due' } },
      { status: 200, body: { id: 'sub_letter', status: 'past_due' } },
    ],
  });
  const deps = dependencies(gateway);
  const trial = {
    id: 'evt_letter_trial_for_retry',
    type: 'checkout.session.completed',
    data: { object: {
      id: 'cs_letter_retry', mode: 'subscription', payment_status: 'no_payment_required',
      customer: 'cus_letter', subscription: 'sub_letter',
      metadata: { product: 'letter', lang: 'en', attribution_token: TOKEN_EN },
      customer_details: { email: 'reader@example.com' },
    } },
  };
  const pastDue = {
    id: 'evt_letter_past_due',
    type: 'customer.subscription.updated',
    data: { object: {
      id: 'sub_letter', customer: 'cus_letter', status: 'past_due',
      metadata: { product: 'letter', lang: 'en', attribution_token: TOKEN_EN },
    } },
  };

  await webhookHandler(signedEvent(trial), deps);
  const first = await webhookHandler(signedEvent(pastDue), deps);
  const replay = await webhookHandler(signedEvent(pastDue), deps);
  const receipt = gateway.receiptsByEvent.get('evt_letter_past_due');
  const subscriber = gateway.subscribersById.get('sub_letter');

  assert.ok(first.statusCode >= 500);
  assert.equal(replay.statusCode, 200);
  assert.equal(receipt.delivery_status, 'not_required');
  assert.equal(subscriber.tier, 'expired');
  assert.equal(gateway.emailRequests.length, 1);
});

test('replaying an old active event after cancellation does not restore paid access', async () => {
  const gateway = fakeGateway({ stripeSubscriptionResponses: [
    { status: 200, body: { id: 'sub_letter', status: 'trialing' } },
    { status: 200, body: { id: 'sub_letter', status: 'active' } },
    { status: 200, body: { id: 'sub_letter', status: 'canceled' } },
  ] });
  const deps = dependencies(gateway);
  const trial = {
    id: 'evt_letter_trial_stale',
    type: 'checkout.session.completed',
    data: { object: {
      id: 'cs_letter_stale', mode: 'subscription', payment_status: 'no_payment_required',
      customer: 'cus_letter', subscription: 'sub_letter',
      metadata: { product: 'letter', lang: 'en', attribution_token: TOKEN_EN },
      customer_details: { email: 'reader@example.com' },
    } },
  };
  const active = {
    id: 'evt_letter_active_old',
    type: 'customer.subscription.updated',
    data: { object: {
      id: 'sub_letter', customer: 'cus_letter', status: 'active',
      metadata: { product: 'letter', lang: 'en', attribution_token: TOKEN_EN },
    } },
  };
  const canceled = {
    id: 'evt_letter_canceled_new',
    type: 'customer.subscription.deleted',
    data: { object: {
      id: 'sub_letter', customer: 'cus_letter', status: 'canceled',
      metadata: { product: 'letter', lang: 'en', attribution_token: TOKEN_EN },
    } },
  };

  await webhookHandler(signedEvent(trial), deps);
  await webhookHandler(signedEvent(active), deps);
  await webhookHandler(signedEvent(canceled), deps);
  const replay = await webhookHandler(signedEvent(active), deps);

  assert.equal(replay.statusCode, 200);
  assert.equal(gateway.subscribersById.get('sub_letter').tier, 'expired');
  assert.equal(gateway.stripeSubscriptionReads, 3);
});

test('retrying a failed Letter welcome after cancellation does not restore paid access', async () => {
  const gateway = fakeGateway({
    stripeSubscriptionResponses: [
      { status: 200, body: { id: 'sub_letter', status: 'trialing' } },
      { status: 200, body: { id: 'sub_letter', status: 'canceled' } },
      { status: 200, body: { id: 'sub_letter', status: 'canceled' } },
    ],
    resendResponses: [{ status: 400, body: { name: 'validation_error' } }],
  });
  const deps = dependencies(gateway);
  const checkout = {
    id: 'evt_letter_welcome_retry',
    type: 'checkout.session.completed',
    data: { object: {
      id: 'cs_letter_welcome_retry', mode: 'subscription', payment_status: 'no_payment_required',
      customer: 'cus_letter', subscription: 'sub_letter',
      metadata: { product: 'letter', lang: 'en', attribution_token: TOKEN_EN },
      customer_details: { email: 'reader@example.com' },
    } },
  };
  const canceled = {
    id: 'evt_letter_welcome_canceled',
    type: 'customer.subscription.deleted',
    data: { object: {
      id: 'sub_letter', customer: 'cus_letter', status: 'canceled',
      metadata: { product: 'letter', lang: 'en', attribution_token: TOKEN_EN },
    } },
  };

  const firstCheckout = await webhookHandler(signedEvent(checkout), deps);
  await webhookHandler(signedEvent(canceled), deps);
  const retriedCheckout = await webhookHandler(signedEvent(checkout), deps);

  assert.ok(firstCheckout.statusCode >= 500);
  assert.equal(retriedCheckout.statusCode, 200);
  assert.equal(gateway.subscribersById.get('sub_letter').tier, 'expired');
  assert.equal(gateway.receiptsBySession.get('cs_letter_welcome_retry').delivery_status, 'not_required');
  assert.equal(gateway.emailRequests.length, 1);
  assert.equal(gateway.stripeSubscriptionReads, 3);
});

test('a replayed active event records the current Stripe cancellation state', async () => {
  const gateway = fakeGateway({ stripeSubscriptionResponses: [
    { status: 200, body: { id: 'sub_letter', status: 'trialing' } },
    { status: 200, body: { id: 'sub_letter', status: 'canceled' } },
    { status: 200, body: { id: 'sub_letter', status: 'canceled' } },
  ] });
  const trial = {
    id: 'evt_letter_trial_cas',
    type: 'checkout.session.completed',
    data: { object: {
      id: 'cs_letter_cas', mode: 'subscription', payment_status: 'no_payment_required',
      customer: 'cus_letter', subscription: 'sub_letter',
      metadata: { product: 'letter', lang: 'en', attribution_token: TOKEN_EN },
      customer_details: { email: 'reader@example.com' },
    } },
  };
  const canceled = {
    id: 'evt_letter_canceled_cas',
    type: 'customer.subscription.deleted',
    data: { object: {
      id: 'sub_letter', customer: 'cus_letter', status: 'canceled',
      metadata: { product: 'letter', lang: 'en', attribution_token: TOKEN_EN },
    } },
  };
  const olderActive = {
    id: 'evt_letter_active_cas',
    type: 'customer.subscription.updated',
    data: { object: {
      id: 'sub_letter', customer: 'cus_letter', status: 'active',
      metadata: { product: 'letter', lang: 'en', attribution_token: TOKEN_EN },
    } },
  };

  const deps = dependencies(gateway);
  await webhookHandler(signedEvent(trial), deps);
  await webhookHandler(signedEvent(canceled), deps);
  await webhookHandler(signedEvent(olderActive), deps);

  assert.equal(gateway.subscribersById.get('sub_letter').tier, 'expired');
  assert.equal(gateway.receiptsByEvent.get('evt_letter_active_cas').subscription_status, 'canceled');
});

test('a later DB reservation wins when its worker clock is behind a delayed older response', async () => {
  let releaseOldReadback;
  let markOldReadbackStarted;
  const oldReadbackStarted = new Promise((resolve) => { markOldReadbackStarted = resolve; });
  const holdOldReadback = new Promise((resolve) => { releaseOldReadback = resolve; });
  const gateway = fakeGateway({
    stripeSubscriptionResponses: [
      { status: 200, body: { id: 'sub_letter', status: 'trialing' } },
      { status: 200, body: { id: 'sub_letter', status: 'active' } },
      { status: 200, body: { id: 'sub_letter', status: 'canceled' } },
    ],
    beforeStripeSubscriptionResponse: async (readIndex) => {
      if (readIndex === 1) {
        markOldReadbackStarted();
        await holdOldReadback;
      }
    },
  });
  const clockValues = [
    Date.parse('2026-10-05T13:00:00.100Z'),
    Date.parse('2026-10-05T13:00:00.300Z'),
    Date.parse('2026-10-05T13:00:00.200Z'),
  ];
  const deps = dependencies(gateway, { now: () => clockValues.shift() });
  const trial = {
    id: 'evt_letter_trial_delayed',
    type: 'checkout.session.completed',
    data: { object: {
      id: 'cs_letter_delayed', mode: 'subscription', payment_status: 'no_payment_required',
      customer: 'cus_letter', subscription: 'sub_letter',
      metadata: { product: 'letter', lang: 'en', attribution_token: TOKEN_EN },
      customer_details: { email: 'reader@example.com' },
    } },
  };
  const active = {
    id: 'evt_letter_active_delayed',
    type: 'customer.subscription.updated',
    data: { object: {
      id: 'sub_letter', customer: 'cus_letter', status: 'active',
      metadata: { product: 'letter', lang: 'en', attribution_token: TOKEN_EN },
    } },
  };
  const canceled = {
    id: 'evt_letter_canceled_delayed',
    type: 'customer.subscription.deleted',
    data: { object: {
      id: 'sub_letter', customer: 'cus_letter', status: 'canceled',
      metadata: { product: 'letter', lang: 'en', attribution_token: TOKEN_EN },
    } },
  };

  await webhookHandler(signedEvent(trial), deps);
  const oldActive = webhookHandler(signedEvent(active), deps);
  await oldReadbackStarted;
  await webhookHandler(signedEvent(canceled), deps);
  releaseOldReadback();
  await oldActive;

  assert.equal(gateway.subscribersById.get('sub_letter').tier, 'expired');
  assert.equal(gateway.subscriptionStates.get('sub_letter').status, 'canceled');
  assert.equal(clockValues.length, 3);
});

test('a delayed older Checkout for the same email cannot take the newer subscription pointer', async () => {
  let releaseOldReadback;
  let markOldReadbackStarted;
  const oldReadbackStarted = new Promise((resolve) => { markOldReadbackStarted = resolve; });
  const holdOldReadback = new Promise((resolve) => { releaseOldReadback = resolve; });
  const gateway = fakeGateway({
    stripeSubscriptionResponses: [
      { status: 200, body: { id: 'sub_letter_old', status: 'canceled', created: 1780600100 } },
      { status: 200, body: { id: 'sub_letter_new', status: 'active', created: 1780600200 } },
    ],
    beforeStripeSubscriptionResponse: async (readIndex) => {
      if (readIndex === 0) {
        markOldReadbackStarted();
        await holdOldReadback;
      }
    },
  });
  let clock = Date.parse('2026-10-05T13:10:00.000Z');
  const deps = dependencies(gateway, { now: () => (clock += 100) });
  const checkout = ({ eventId, sessionId, customerId, subscriptionId }) => ({
    id: eventId,
    type: 'checkout.session.completed',
    data: { object: {
      id: sessionId, mode: 'subscription', payment_status: 'no_payment_required',
      customer: customerId, subscription: subscriptionId,
      metadata: { product: 'letter', lang: 'en', attribution_token: TOKEN_EN },
      customer_details: { email: 'reader@example.com' },
    } },
  });

  const oldCheckout = webhookHandler(signedEvent(checkout({
    eventId: 'evt_letter_old_checkout', sessionId: 'cs_letter_old', customerId: 'cus_old', subscriptionId: 'sub_letter_old',
  })), deps);
  await oldReadbackStarted;
  await webhookHandler(signedEvent(checkout({
    eventId: 'evt_letter_new_checkout', sessionId: 'cs_letter_new', customerId: 'cus_new', subscriptionId: 'sub_letter_new',
  })), deps);
  releaseOldReadback();
  await oldCheckout;

  const subscriber = gateway.subscribersByEmail.get('reader@example.com');
  assert.equal(subscriber.stripe_subscription_id, 'sub_letter_new');
  assert.equal(subscriber.tier, 'paid');
  assert.equal(gateway.subscriptionStates.get('sub_letter_old').status, 'canceled');
  assert.equal(gateway.subscriptionStates.get('sub_letter_new').status, 'active');
});

test('a late-delivered old Checkout cannot replace a newer Stripe subscription pointer', async () => {
  const gateway = fakeGateway({ stripeSubscriptionResponses: [
    { status: 200, body: { id: 'sub_letter_new', status: 'active', created: 1780600200 } },
    { status: 200, body: { id: 'sub_letter_old', status: 'canceled', created: 1780600100 } },
  ] });
  const deps = dependencies(gateway);
  const checkout = ({ eventId, sessionId, customerId, subscriptionId }) => ({
    id: eventId,
    type: 'checkout.session.completed',
    data: { object: {
      id: sessionId, mode: 'subscription', payment_status: 'no_payment_required',
      customer: customerId, subscription: subscriptionId,
      metadata: { product: 'letter', lang: 'en', attribution_token: TOKEN_EN },
      customer_details: { email: 'reader@example.com' },
    } },
  });

  await webhookHandler(signedEvent(checkout({
    eventId: 'evt_letter_new_first', sessionId: 'cs_letter_new_first', customerId: 'cus_new', subscriptionId: 'sub_letter_new',
  })), deps);
  await webhookHandler(signedEvent(checkout({
    eventId: 'evt_letter_old_late', sessionId: 'cs_letter_old_late', customerId: 'cus_old', subscriptionId: 'sub_letter_old',
  })), deps);

  const subscriber = gateway.subscribersByEmail.get('reader@example.com');
  assert.equal(subscriber.stripe_subscription_id, 'sub_letter_new');
  assert.equal(subscriber.tier, 'paid');
});

test('a migrated existing subscription reserves its state mapping before Stripe readback', async () => {
  const gateway = fakeGateway({
    legacySubscribers: [{
      id: 'subscriber_legacy',
      email: 'legacy@example.com',
      tier: 'paid',
      stripe_customer_id: 'cus_legacy',
      stripe_subscription_id: 'sub_legacy',
      signed_up_at: '2026-01-01T00:00:00Z',
      unsubscribed_at: null,
    }],
    stripeSubscriptionResponses: [{
      status: 200,
      body: { id: 'sub_legacy', status: 'active', created: 1767225600 },
    }],
  });
  const event = {
    id: 'evt_legacy_subscription_updated',
    type: 'customer.subscription.updated',
    data: { object: {
      id: 'sub_legacy', customer: 'cus_legacy', status: 'active',
      metadata: { product: 'letter', lang: 'en', attribution_token: TOKEN_EN },
    } },
  };

  const result = await webhookHandler(signedEvent(event), dependencies(gateway));

  assert.equal(result.statusCode, 200);
  assert.deepEqual(gateway.subscriptionReadbackReservations.map(({ subscriptionId }) => subscriptionId), ['sub_legacy']);
  assert.equal(gateway.subscribersByEmail.get('legacy@example.com').tier, 'paid');
});

test('migration-carried paid access without a Stripe pointer survives unrelated canceled subscriptions', async () => {
  const gateway = fakeGateway({
    legacySubscribers: [{
      id: 'subscriber_legacy_without_pointer',
      email: 'legacy-no-pointer@example.com',
      tier: 'paid',
      stripe_customer_id: 'cus_legacy_without_pointer',
      stripe_subscription_id: null,
      signed_up_at: '2026-01-01T00:00:00Z',
      unsubscribed_at: null,
    }],
    stripeSubscriptionResponses: [
      { status: 200, body: { id: 'sub_unrelated_one', status: 'canceled', created: 1767225600 } },
      { status: 200, body: { id: 'sub_unrelated_two', status: 'canceled', created: 1767312000 } },
    ],
  });
  const failures = [];
  const deps = dependencies(gateway, { logFailure: (record) => failures.push(record) });
  const checkout = ({ eventId, sessionId, subscriptionId }) => ({
    id: eventId,
    type: 'checkout.session.completed',
    data: { object: {
      id: sessionId, mode: 'subscription', payment_status: 'no_payment_required',
      customer: `cus_${subscriptionId}`, subscription: subscriptionId,
      metadata: { product: 'letter', lang: 'en', attribution_token: TOKEN_EN },
      customer_details: { email: 'legacy-no-pointer@example.com' },
    } },
  });

  const firstResult = await webhookHandler(signedEvent(checkout({
    eventId: 'evt_unrelated_one', sessionId: 'cs_unrelated_one', subscriptionId: 'sub_unrelated_one',
  })), deps);
  const secondResult = await webhookHandler(signedEvent(checkout({
    eventId: 'evt_unrelated_two', sessionId: 'cs_unrelated_two', subscriptionId: 'sub_unrelated_two',
  })), deps);

  assert.equal(firstResult.statusCode, 503);
  assert.equal(secondResult.statusCode, 503);
  assert.equal(gateway.subscribersByEmail.get('legacy-no-pointer@example.com').tier, 'paid');
  assert.equal(gateway.subscribersByEmail.get('legacy-no-pointer@example.com').stripe_legacy_paid_pending_readback, true);
  assert.equal(gateway.subscribersByEmail.get('legacy-no-pointer@example.com').stripe_customer_id, 'cus_legacy_without_pointer');
  assert.equal(gateway.subscribersByEmail.get('legacy-no-pointer@example.com').stripe_subscription_id, null);
  assert.equal(gateway.legacySubscriptionFinalizations.length, 0);
  assert.equal(failures.length, 2);
  assert.deepEqual(failures.map((failure) => failure.error_class), [
    'legacy_customer_mapping_mismatch', 'legacy_customer_mapping_mismatch',
  ]);
  assert.deepEqual(failures.map((failure) => failure.next_action), [
    'manual_legacy_customer_reconciliation', 'manual_legacy_customer_reconciliation',
  ]);
});

test('legacy paid hold clears after complete same-customer multi-page readback with no active Letter subscription', async () => {
  const gateway = fakeGateway({
    legacySubscribers: [{
      id: 'subscriber_legacy_without_pointer',
      email: 'legacy@example.com',
      tier: 'paid',
      stripe_customer_id: 'cus_legacy',
      stripe_subscription_id: null,
      signed_up_at: '2026-01-01T00:00:00Z',
      unsubscribed_at: null,
    }],
    stripeSubscriptionResponses: [{
      status: 200,
      body: { id: 'sub_legacy_cancelled_one', customer: 'cus_legacy', status: 'canceled', created: 1767225600 },
    }],
    stripeCustomerSubscriptionPages: [
      { status: 200, body: { object: 'list', data: [
        { id: 'sub_legacy_cancelled_one', customer: 'cus_legacy', status: 'canceled', created: 1767225600, metadata: { product: 'letter', lang: 'en' } },
      ], has_more: true } },
      { status: 200, body: { object: 'list', data: [
        { id: 'sub_legacy_cancelled_two', customer: 'cus_legacy', status: 'canceled', created: 1767312000, metadata: { product: 'letter', lang: 'en' } },
      ], has_more: false } },
    ],
  });
  const event = {
    id: 'evt_legacy_customer_reconcile',
    type: 'customer.subscription.updated',
    data: { object: {
      id: 'sub_legacy_cancelled_one', customer: 'cus_legacy', status: 'canceled',
      metadata: { product: 'letter', lang: 'en', attribution_token: TOKEN_EN },
    } },
  };

  const result = await webhookHandler(signedEvent(event), dependencies(gateway));

  assert.equal(result.statusCode, 200);
  const subscriber = gateway.subscribersByEmail.get('legacy@example.com');
  assert.equal(subscriber.tier, 'expired');
  assert.equal(subscriber.stripe_legacy_paid_pending_readback, false);
  assert.equal(gateway.stripeCustomerSubscriptionListRequests.length, 2);
  assert.equal(new URL(gateway.stripeCustomerSubscriptionListRequests[1]).searchParams.get('starting_after'), 'sub_legacy_cancelled_one');
  assert.deepEqual(gateway.legacySubscriptionFinalizations[0].p_letter_subscription_ids, [
    'sub_legacy_cancelled_one', 'sub_legacy_cancelled_two',
  ]);
  const finalizeIndex = gateway.reconciliationOperations.findIndex(({ type }) => type === 'finalize');
  assert.ok(finalizeIndex > gateway.reconciliationOperations.findLastIndex(({ type }) => type === 'apply'));
  assert.ok(finalizeIndex > gateway.reconciliationOperations.findLastIndex(({ type }) => type === 'stripe_list'));
});

test('legacy paid hold clears and stays paid when Letter is active', async () => {
  const gateway = fakeGateway({
    legacySubscribers: [{
      id: 'subscriber_legacy_active',
      email: 'legacy-active@example.com',
      tier: 'paid',
      stripe_customer_id: 'cus_legacy_active',
      stripe_subscription_id: null,
      signed_up_at: '2026-01-01T00:00:00Z',
      unsubscribed_at: null,
    }],
    stripeCustomerSubscriptionPages: [{
      status: 200,
      body: { object: 'list', data: [
        { id: 'sub_legacy_active', customer: 'cus_legacy_active', status: 'active', created: 1767225601, metadata: { product: 'letter', lang: 'en' } },
        { id: 'sub_other_product', customer: 'cus_legacy_active', status: 'active', created: 1767225602, metadata: { product: 'writer_archive', lang: 'en' } },
        { id: 'sub_legacy_canceled', customer: 'cus_legacy_active', status: 'canceled', created: 1767225600, metadata: { product: 'letter', lang: 'en' } },
      ], has_more: false },
    }],
  });
  const event = {
    id: 'evt_legacy_customer_active',
    type: 'customer.subscription.updated',
    data: { object: {
      id: 'sub_legacy_canceled', customer: 'cus_legacy_active', status: 'canceled',
      metadata: { product: 'letter', lang: 'en', attribution_token: TOKEN_EN },
    } },
  };

  const failures = [];
  const result = await webhookHandler(signedEvent(event), dependencies(gateway, {
    logFailure: (record) => failures.push(record),
  }));

  assert.equal(result.statusCode, 200);
  assert.deepEqual(failures, []);
  const subscriber = gateway.subscribersByEmail.get('legacy-active@example.com');
  assert.equal(subscriber.tier, 'paid');
  assert.equal(subscriber.stripe_legacy_paid_pending_readback, false);
  assert.deepEqual(gateway.legacySubscriptionFinalizations[0].p_letter_subscription_ids, [
    'sub_legacy_active', 'sub_legacy_canceled',
  ]);
  assert.equal(gateway.subscriptionStates.has('sub_other_product'), false);
});

test('legacy customer inventory re-reads a canceled sibling after reserving it', async () => {
  const gateway = fakeGateway({
    legacySubscribers: [{
      id: 'subscriber_legacy_race',
      email: 'legacy-race@example.com',
      tier: 'paid',
      stripe_customer_id: 'cus_legacy_race',
      stripe_subscription_id: null,
      signed_up_at: '2026-01-01T00:00:00Z',
      unsubscribed_at: null,
    }],
    stripeSubscriptionResponses: [
      { status: 200, body: { id: 'sub_legacy_trigger', customer: 'cus_legacy_race', status: 'canceled', created: 1767225600, metadata: { product: 'letter', lang: 'en' } } },
      { status: 200, body: { id: 'sub_legacy_sibling', customer: 'cus_legacy_race', status: 'canceled', created: 1767312000, metadata: { product: 'letter', lang: 'en' } } },
    ],
    stripeCustomerSubscriptionPages: [{
      status: 200,
      body: { object: 'list', data: [
        { id: 'sub_legacy_trigger', customer: 'cus_legacy_race', status: 'canceled', created: 1767225600, metadata: { product: 'letter', lang: 'en' } },
        { id: 'sub_legacy_sibling', customer: 'cus_legacy_race', status: 'active', created: 1767312000, metadata: { product: 'letter', lang: 'en' } },
      ], has_more: false },
    }],
  });
  const event = {
    id: 'evt_legacy_customer_sibling_canceled',
    type: 'customer.subscription.updated',
    data: { object: {
      id: 'sub_legacy_trigger', customer: 'cus_legacy_race', status: 'canceled',
      metadata: { product: 'letter', lang: 'en', attribution_token: TOKEN_EN },
    } },
  };

  const failures = [];
  const result = await webhookHandler(signedEvent(event), dependencies(gateway, {
    logFailure: (record) => failures.push(record),
  }));

  assert.equal(result.statusCode, 200);
  assert.deepEqual(failures, []);
  const subscriber = gateway.subscribersByEmail.get('legacy-race@example.com');
  assert.equal(subscriber.tier, 'expired');
  assert.equal(subscriber.stripe_legacy_paid_pending_readback, false);
  assert.equal(gateway.stripeSubscriptionReads, 2);
  assert.equal(gateway.subscriptionStates.get('sub_legacy_sibling').status, 'canceled');
  assert.deepEqual(
    gateway.reconciliationOperations
      .filter(({ subscriptionId }) => subscriptionId === 'sub_legacy_sibling')
      .map(({ type }) => type),
    ['reserve', 'stripe_read', 'apply'],
  );
});

test('legacy paid hold is preserved when customer inventory is incomplete or unclassifiable', async () => {
  const cases = [
    {
      customer: 'cus_legacy_incomplete',
      subscriptionId: 'sub_legacy_one',
      pages: [
        { status: 200, body: { object: 'list', data: [{ id: 'sub_legacy_one', customer: 'cus_legacy_incomplete', status: 'active', created: 1767225600, metadata: { product: 'letter', lang: 'en' } }], has_more: true } },
        { status: 503, body: { message: 'Stripe list unavailable' } },
      ],
    },
    {
      customer: 'cus_legacy_unclassified',
      subscriptionId: 'sub_legacy_unknown',
      pages: [
        { status: 200, body: { object: 'list', data: [{ id: 'sub_legacy_unknown', customer: 'cus_legacy_unclassified', status: 'active', created: 1767225600, metadata: {} }], has_more: false } },
      ],
    },
    {
      customer: 'cus_legacy_repeated',
      subscriptionId: 'sub_legacy_repeated',
      pages: [
        { status: 200, body: { object: 'list', data: [{ id: 'sub_legacy_repeated', customer: 'cus_legacy_repeated', status: 'active', created: 1767225600, metadata: { product: 'letter', lang: 'en' } }], has_more: true } },
        { status: 200, body: { object: 'list', data: [{ id: 'sub_legacy_repeated', customer: 'cus_legacy_repeated', status: 'active', created: 1767225600, metadata: { product: 'letter', lang: 'en' } }], has_more: false } },
      ],
    },
    {
      customer: null,
      subscriptionId: 'sub_legacy_no_customer',
      pages: [],
    },
  ];

  for (const [index, testCase] of cases.entries()) {
    const email = `legacy-inventory-${index}@example.com`;
    const subscriptionId = testCase.subscriptionId;
    const gateway = fakeGateway({
      legacySubscribers: [{
        id: `subscriber_legacy_inventory_${index}`,
        email,
        tier: 'paid',
        stripe_customer_id: testCase.customer,
        stripe_subscription_id: null,
        signed_up_at: '2026-01-01T00:00:00Z',
        unsubscribed_at: null,
      }],
      stripeSubscriptionResponses: [{
        status: 200,
        body: { id: subscriptionId, customer: testCase.customer, status: 'active', created: 1767225600 },
      }],
      stripeCustomerSubscriptionPages: testCase.pages,
    });
    const event = {
      id: `evt_legacy_inventory_${index}`,
      type: 'customer.subscription.updated',
      data: { object: {
        id: subscriptionId, customer: testCase.customer, status: 'active',
        metadata: { product: 'letter', lang: 'en', attribution_token: TOKEN_EN },
      } },
    };

    const result = await webhookHandler(signedEvent(event), dependencies(gateway));

    assert.equal(result.statusCode, 503);
    assert.equal(gateway.subscribersByEmail.get(email).stripe_legacy_paid_pending_readback, true);
    assert.equal(gateway.legacySubscriptionFinalizations.length, 0);
    assert.equal(gateway.stripeCustomerSubscriptionListRequests.length, testCase.pages.length);
  }
});

test('legacy paid hold is not cleared when any subscription state apply is stale', async () => {
  const gateway = fakeGateway({
    legacySubscribers: [{
      id: 'subscriber_legacy_stale',
      email: 'legacy-stale@example.com',
      tier: 'paid',
      stripe_customer_id: 'cus_legacy_stale',
      stripe_subscription_id: null,
      signed_up_at: '2026-01-01T00:00:00Z',
      unsubscribed_at: null,
    }],
    stripeSubscriptionResponses: [{
      status: 200,
      body: { id: 'sub_legacy_stale', customer: 'cus_legacy_stale', status: 'active', created: 1767225600 },
    }],
    stripeCustomerSubscriptionPages: [{
      status: 200,
      body: { object: 'list', data: [
        { id: 'sub_legacy_stale', customer: 'cus_legacy_stale', status: 'active', created: 1767225600, metadata: { product: 'letter', lang: 'en' } },
      ], has_more: false },
    }],
    staleSubscriptionStateIds: ['sub_legacy_stale'],
  });
  const event = {
    id: 'evt_legacy_stale',
    type: 'customer.subscription.updated',
    data: { object: {
      id: 'sub_legacy_stale', customer: 'cus_legacy_stale', status: 'active',
      metadata: { product: 'letter', lang: 'en', attribution_token: TOKEN_EN },
    } },
  };

  const result = await webhookHandler(signedEvent(event), dependencies(gateway));

  assert.equal(result.statusCode, 503);
  assert.equal(gateway.subscribersByEmail.get('legacy-stale@example.com').stripe_legacy_paid_pending_readback, true);
  assert.equal(gateway.legacySubscriptionFinalizations.length, 0);
});

test('a superseded Checkout stays retryable until the winning subscription readback finishes', async () => {
  let releaseCheckoutRead;
  let releaseLifecycleRead;
  let markCheckoutReadStarted;
  let markLifecycleReadStarted;
  const checkoutReadStarted = new Promise((resolve) => { markCheckoutReadStarted = resolve; });
  const lifecycleReadStarted = new Promise((resolve) => { markLifecycleReadStarted = resolve; });
  const holdCheckoutRead = new Promise((resolve) => { releaseCheckoutRead = resolve; });
  const holdLifecycleRead = new Promise((resolve) => { releaseLifecycleRead = resolve; });
  const gateway = fakeGateway({
    stripeSubscriptionResponses: [
      { status: 200, body: { id: 'sub_letter_race', status: 'active', created: 1780600200 } },
      { status: 200, body: { id: 'sub_letter_race', status: 'active', created: 1780600200 } },
    ],
    beforeStripeSubscriptionResponse: async (readIndex) => {
      if (readIndex === 0) {
        markCheckoutReadStarted();
        await holdCheckoutRead;
      } else if (readIndex === 1) {
        markLifecycleReadStarted();
        await holdLifecycleRead;
      }
    },
  });
  const deps = dependencies(gateway);
  const checkout = {
    id: 'evt_letter_checkout_race',
    type: 'checkout.session.completed',
    data: { object: {
      id: 'cs_letter_checkout_race', mode: 'subscription', payment_status: 'no_payment_required',
      customer: 'cus_letter_race', subscription: 'sub_letter_race',
      metadata: { product: 'letter', lang: 'en', attribution_token: TOKEN_EN },
      customer_details: { email: 'race@example.com' },
    } },
  };
  const lifecycle = {
    id: 'evt_letter_lifecycle_race',
    type: 'customer.subscription.updated',
    data: { object: {
      id: 'sub_letter_race', customer: 'cus_letter_race', status: 'active',
      metadata: { product: 'letter', lang: 'en', attribution_token: TOKEN_EN },
    } },
  };

  const firstCheckout = webhookHandler(signedEvent(checkout), deps);
  await checkoutReadStarted;
  const lifecycleRead = webhookHandler(signedEvent(lifecycle), deps);
  await lifecycleReadStarted;
  releaseCheckoutRead();
  const superseded = await firstCheckout;
  assert.ok(superseded.statusCode >= 500);
  assert.equal(gateway.receiptsBySession.get('cs_letter_checkout_race').delivery_status, 'retryable_failure');
  assert.equal(gateway.emailRequests.length, 0);

  releaseLifecycleRead();
  await lifecycleRead;
  const retry = await webhookHandler(signedEvent(checkout), deps);

  assert.equal(retry.statusCode, 200);
  assert.equal(gateway.receiptsBySession.get('cs_letter_checkout_race').delivery_status, 'delivered');
  assert.equal(gateway.emailRequests.length, 1);
});

test('legacy pointer reconciliation reselects the latest already-read subscription', async () => {
  const gateway = fakeGateway({
    legacySubscribers: [{
      id: 'subscriber_legacy_pointer',
      email: 'legacy-pointer@example.com',
      tier: 'paid',
      stripe_customer_id: 'cus_legacy_pointer',
      stripe_subscription_id: 'sub_legacy_pointer',
      signed_up_at: '2026-01-01T00:00:00Z',
      unsubscribed_at: null,
    }],
    stripeSubscriptionResponses: [
      { status: 200, body: { id: 'sub_newer', status: 'active', created: 1780600200 } },
      { status: 200, body: { id: 'sub_legacy_pointer', status: 'canceled', created: 1780600100 } },
    ],
  });
  const deps = dependencies(gateway);
  const checkout = {
    id: 'evt_newer_checkout_for_legacy',
    type: 'checkout.session.completed',
    data: { object: {
      id: 'cs_newer_checkout_for_legacy', mode: 'subscription', payment_status: 'no_payment_required',
      customer: 'cus_newer', subscription: 'sub_newer',
      metadata: { product: 'letter', lang: 'en', attribution_token: TOKEN_EN },
      customer_details: { email: 'legacy-pointer@example.com' },
    } },
  };
  const oldCanceled = {
    id: 'evt_legacy_pointer_canceled',
    type: 'customer.subscription.deleted',
    data: { object: {
      id: 'sub_legacy_pointer', customer: 'cus_legacy_pointer', status: 'canceled',
      metadata: { product: 'letter', lang: 'en', attribution_token: TOKEN_EN },
    } },
  };

  await webhookHandler(signedEvent(checkout), deps);
  await webhookHandler(signedEvent(oldCanceled), deps);

  const subscriber = gateway.subscribersByEmail.get('legacy-pointer@example.com');
  assert.equal(subscriber.stripe_subscription_id, 'sub_newer');
  assert.equal(subscriber.stripe_subscription_created_at, new Date(1780600200 * 1000).toISOString());
  assert.equal(subscriber.tier, 'paid');
});

test('Letter Checkout rejects a different Stripe customer for an existing subscription', async () => {
  const gateway = fakeGateway({
    legacySubscribers: [{
      id: 'subscriber_normal_customer_mismatch',
      email: 'normal-mismatch@example.com',
      tier: 'expired',
      stripe_customer_id: 'cus_original',
      stripe_subscription_id: 'sub_wrong_customer',
      stripe_subscription_created_at: '2026-01-01T00:00:00.000Z',
      stripe_legacy_paid_pending_readback: false,
    }],
    stripeSubscriptionResponses: [{
      status: 200,
      body: { id: 'sub_wrong_customer', customer: 'cus_wrong', status: 'active', created: 1767225600 },
    }],
  });
  const failures = [];
  const event = {
    id: 'evt_normal_customer_mismatch',
    type: 'checkout.session.completed',
    data: { object: {
      id: 'cs_normal_customer_mismatch',
      mode: 'subscription',
      payment_status: 'no_payment_required',
      customer: 'cus_wrong',
      subscription: 'sub_wrong_customer',
      metadata: { product: 'letter', lang: 'en', attribution_token: TOKEN_EN },
      customer_details: { email: 'normal-mismatch@example.com' },
    } },
  };

  const result = await webhookHandler(signedEvent(event), dependencies(gateway, {
    logFailure: (record) => failures.push(record),
  }));

  assert.equal(result.statusCode, 503);
  assert.equal(gateway.subscriptionReadbackReservations.length, 0);
  const subscriber = gateway.subscribersByEmail.get('normal-mismatch@example.com');
  const state = gateway.subscriptionStates.get('sub_wrong_customer');
  assert.equal(subscriber.stripe_customer_id, 'cus_original');
  assert.equal(state.customerId, 'cus_original');
  assert.equal(state.generation, 0);
  assert.equal(gateway.emailRequests.length, 0);
  assert.equal(failures[0].error_class, 'stripe_customer_mapping_mismatch');
  assert.equal(failures[0].next_action, 'manual_customer_reconciliation');
});

test('normal Letter apply rejects a customer mapping changed after reservation', async () => {
  let gateway;
  gateway = fakeGateway({
    legacySubscribers: [{
      id: 'subscriber_apply_customer_race',
      email: 'apply-customer-race@example.com',
      tier: 'paid',
      stripe_customer_id: 'cus_stable',
      stripe_subscription_id: 'sub_apply_customer_race',
      stripe_subscription_created_at: '2026-01-01T00:00:00.000Z',
      stripe_legacy_paid_pending_readback: false,
    }],
    stripeSubscriptionResponses: [{
      status: 200,
      body: { id: 'sub_apply_customer_race', customer: 'cus_stable', status: 'canceled', created: 1767225600 },
    }],
    beforeStripeSubscriptionResponse: async () => {
      gateway.subscriptionStates.get('sub_apply_customer_race').customerId = 'cus_raced';
    },
  });
  const failures = [];
  const event = {
    id: 'evt_apply_customer_race',
    type: 'customer.subscription.updated',
    data: { object: {
      id: 'sub_apply_customer_race',
      customer: 'cus_stable',
      status: 'canceled',
      metadata: { product: 'letter', lang: 'en' },
    } },
  };

  const result = await webhookHandler(signedEvent(event), dependencies(gateway, {
    logFailure: (record) => failures.push(record),
  }));

  assert.equal(result.statusCode, 503);
  const subscriber = gateway.subscribersByEmail.get('apply-customer-race@example.com');
  const state = gateway.subscriptionStates.get('sub_apply_customer_race');
  assert.equal(subscriber.stripe_customer_id, 'cus_stable');
  assert.equal(state.customerId, 'cus_raced');
  assert.equal(state.status, 'legacy_paid_pending_readback');
  assert.equal(failures[0].error_class, 'stripe_customer_mapping_mismatch');
  assert.equal(failures[0].next_action, 'manual_customer_reconciliation');
});

test('subscription SQL rejects customer remapping before writes and pins definer search paths', () => {
  const reserve = migrationFunction('reserve_ebook_subscription_readback');
  const reserveGuard = reserve.indexOf("'customer_mismatch'");
  const reserveWrite = reserve.indexOf('INSERT INTO public.ebook_subscription_states');
  assert.ok(reserveGuard >= 0 && reserveGuard < reserveWrite);
  assert.match(reserve, /v_mapped_customer_id IS DISTINCT FROM p_stripe_customer_id/);

  const apply = migrationFunction('apply_ebook_subscription_state');
  const applyGuard = apply.indexOf("'customer_mismatch'");
  const applyWrite = apply.indexOf('UPDATE public.ebook_subscription_states');
  assert.ok(applyGuard >= 0 && applyGuard < applyWrite);
  assert.match(apply, /p_stripe_customer_id IS DISTINCT FROM v_state_customer_id/);

  const functions = [...ebookWebhookMigration.matchAll(/CREATE OR REPLACE FUNCTION public\.[\s\S]*?\n\$\$;/g)]
    .map(([definition]) => definition)
    .filter((definition) => /\bSECURITY DEFINER\b/.test(definition));
  assert.ok(functions.length > 0);
  for (const definition of functions) {
    assert.match(definition, /SECURITY DEFINER\s+SET search_path = pg_catalog, public, pg_temp/);
  }
});
