const test = require('node:test');
const assert = require('node:assert/strict');
const crypto = require('node:crypto');

const { webhookHandler } = require('../../webhook.js');

const SECRET = 'whsec_ebook_test';
const NOW = 1785642000;
const SUPABASE_URL = 'https://supabase.example.test';
const TOKEN_EN = 'ee_abcdefghijklmnopqrst';
const TOKEN_JP = 'ej_abcdefghijklmnopqrst';

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

function fakeGateway({ receiptStatus = 201, buyerStatus = 201, resendStatus = 200 } = {}) {
  const receiptsBySession = new Map();
  const receiptsByEvent = new Map();
  const buyerRows = [];
  const subscriberRows = [];
  const subscribersById = new Map();
  const emailRequests = [];

  async function fetchImpl(url, options = {}) {
    const method = options.method || 'GET';
    const body = options.body ? JSON.parse(options.body) : null;

    if (url.includes('/rest/v1/ebook_webhook_receipts')) {
      if (method === 'POST') {
        if (receiptStatus >= 400) return response(receiptStatus, { message: 'receipt store unavailable' });
        const keyedBySession = url.includes('on_conflict=stripe_session_id');
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
      return response(resendStatus, resendStatus < 300 ? { id: `email_${emailRequests.length}` } : { message: 'resend unavailable' });
    }
    throw new Error(`unexpected request: ${method} ${url}`);
  }

  return { fetchImpl, receiptsBySession, receiptsByEvent, buyerRows, subscriberRows, emailRequests };
}

function dependencies(gateway, overrides = {}) {
  return {
    env: {
      STRIPE_WEBHOOK_SECRET: SECRET,
      STRIPE_SECRET_KEY: 'sk_test_redacted',
      RESEND_API_KEY: 're_test_redacted',
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

test('Letter trial and paid invoice receipts preserve attribution without ebook delivery', async () => {
  const gateway = fakeGateway();
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
