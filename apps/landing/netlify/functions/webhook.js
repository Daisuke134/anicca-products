// Stripe webhook: persist signed eBook/Letter events before fulfillment and keep provider receipts.
const crypto = require('crypto');

const WRITER_EVENT_TYPES = new Set([
  'checkout.session.completed',
  'checkout.session.async_payment_succeeded',
  'customer.subscription.created',
  'customer.subscription.updated',
  'customer.subscription.deleted',
  'invoice.paid',
  'charge.refunded',
]);

function validStripeSignature(body, header, secret, nowSeconds) {
  if (typeof body !== 'string' || typeof header !== 'string' || typeof secret !== 'string') return false;
  let timestamp = null;
  const signatures = [];
  for (const part of header.split(',')) {
    const index = part.indexOf('=');
    if (index < 0) continue;
    const key = part.slice(0, index).trim();
    const value = part.slice(index + 1).trim();
    if (key === 't' && /^\d+$/.test(value)) timestamp = Number(value);
    if (key === 'v1' && /^[a-f0-9]{64}$/.test(value)) signatures.push(value);
  }
  if (!Number.isSafeInteger(timestamp) || Math.abs(nowSeconds - timestamp) > 300 || signatures.length === 0) return false;
  const expected = crypto.createHmac('sha256', secret).update(`${timestamp}.${body}`).digest();
  return signatures.some((value) => {
    const actual = Buffer.from(value, 'hex');
    return actual.length === expected.length && crypto.timingSafeEqual(actual, expected);
  });
}

function writerMetadata(payload) {
  const object = payload && payload.data && payload.data.object;
  if (!object) return null;
  const candidates = [
    object.metadata,
    object.subscription_details && object.subscription_details.metadata,
    object.parent && object.parent.subscription_details && object.parent.subscription_details.metadata,
  ];
  return candidates.find((metadata) => metadata && Object.keys(metadata).length > 0)
    || candidates.find(Boolean)
    || null;
}

function isWriterEvent(payload) {
  if (payload && typeof payload.type === 'string' && payload.type.startsWith('payout.')) return true;
  if (!payload || !WRITER_EVENT_TYPES.has(payload.type)) return false;
  const metadata = writerMetadata(payload);
  return metadata && (metadata.product === 'writer_article' || metadata.product === 'writer_archive');
}

async function webhookHandler(event, dependencies = {}) {
  const env = dependencies.env || process.env;
  const WEBHOOK_SECRET = env.STRIPE_WEBHOOK_SECRET;

  if (!WEBHOOK_SECRET) {
    return { statusCode: 500, body: 'missing config' };
  }

  // Verify Stripe signature
  const headers = event.headers || {};
  const sigHeader = headers['stripe-signature'] || headers['Stripe-Signature'];
  if (!sigHeader) return { statusCode: 400, body: 'no sig' };
  const nowSeconds = dependencies.nowSeconds || Math.floor(Date.now() / 1000);
  if (!validStripeSignature(event.body, sigHeader, WEBHOOK_SECRET, nowSeconds)) {
    return { statusCode: 400, body: 'bad sig' };
  }

  let payload;
  try { payload = JSON.parse(event.body); } catch { return { statusCode: 400, body: 'bad json' }; }

  // Writer fulfillment is the signed Checkout entitlement itself. Do not run
  // ebook/Letter email or buyer-store side effects; the read-only collector
  // independently turns Stripe objects into accounting receipts.
  if (isWriterEvent(payload)) return { statusCode: 200, body: 'ok writer' };

  const RESEND_API_KEY = env.RESEND_API_KEY;
  const fetchImpl = dependencies.fetchImpl || fetch;
  const sendEmail = dependencies.sendEmail
    || ((key, email, subject, html, idempotencyKey) => sendResend(key, email, subject, html, fetchImpl, idempotencyKey));

  const SUPABASE_URL = (env.SUPABASE_URL || '').replace(/\/$/, '');
  const SUPABASE_SERVICE_ROLE_KEY = env.SUPABASE_SERVICE_ROLE_KEY;
  const sessionEvent = payload.type === 'checkout.session.completed'
    || payload.type === 'checkout.session.async_payment_succeeded';

  if (sessionEvent) {
    const session = payload.data.object;
    const metadata = session.metadata || {};
    const lang = (session.metadata?.lang === 'jp') ? 'jp' : 'en';
    const product = metadata.product || 'ebook';
    const mode = session.mode || 'payment';
    const isLetter = mode === 'subscription' && product === 'letter';
    const isEbook = mode === 'payment' && product === 'ebook';
    if (!isLetter && !isEbook) return { statusCode: 200, body: 'ignored' };
    if (!SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY) {
      return webhookFailure(payload, dependencies, 'preflight', 'receipt_store_config_missing', 'none', true, 'restore_receipt_store');
    }

    const email = session.customer_details?.email || session.customer_email;
    if (isEbook && session.payment_status !== 'paid') {
      return { statusCode: 200, body: 'payment pending' };
    }

    const attributionToken = validAttributionToken(metadata.attribution_token, lang);
    const subscriptionStatus = isLetter
      ? (session.payment_status === 'no_payment_required' ? 'trialing'
        : session.payment_status === 'paid' ? 'active' : 'incomplete')
      : null;
    const receipt = {
      stripe_event_id: payload.id,
      stripe_session_id: session.id,
      stripe_customer_id: stripeId(session.customer),
      stripe_subscription_id: stripeId(session.subscription),
      product,
      lang,
      attribution_token: attributionToken,
      payment_status: session.payment_status || 'unknown',
      subscription_status: subscriptionStatus,
      amount_total: Number.isFinite(session.amount_total) ? session.amount_total : null,
      currency: session.currency || null,
      delivery_status: 'processing',
      error_class: null,
      next_action: null,
    };
    let claim;
    try {
      claim = await claimReceipt({
        receipt,
        conflictColumn: 'stripe_session_id',
        lookupColumn: 'stripe_session_id',
        lookupValue: session.id,
        fetchImpl,
        supabaseUrl: SUPABASE_URL,
        serviceKey: SUPABASE_SERVICE_ROLE_KEY,
      });
    } catch {
      return webhookFailure(payload, dependencies, 'receipt_claim', 'receipt_store_failed', 'none', true, 'stripe_retry');
    }
    if (claim.completed) return { statusCode: 200, body: 'duplicate complete' };
    if (!claim.claimed) {
      return webhookFailure(payload, dependencies, 'receipt_claim', 'delivery_already_in_flight', 'unknown', false, 'official_readback_required');
    }
    if (!email) {
      try {
        await updateClaimedReceipt({
          claim, fetchImpl, supabaseUrl: SUPABASE_URL, serviceKey: SUPABASE_SERVICE_ROLE_KEY,
          patch: { delivery_status: 'needs_email', error_class: 'checkout_email_missing', next_action: 'buyer_email_reconciliation' },
        });
      } catch {
        return webhookFailure(payload, dependencies, 'receipt_finalize', 'missing_email_receipt_unstored', 'none', true, 'stripe_retry');
      }
      return webhookFailure(payload, dependencies, 'buyer_email', 'checkout_email_missing', 'none', false, 'buyer_email_reconciliation');
    }
    if (!RESEND_API_KEY) {
      await bestEffortReceiptUpdate({
        claim, fetchImpl, supabaseUrl: SUPABASE_URL, serviceKey: SUPABASE_SERVICE_ROLE_KEY,
        patch: { delivery_status: 'retryable_failure', error_class: 'resend_config_missing', next_action: 'restore_resend_config' },
      });
      return webhookFailure(payload, dependencies, 'preflight', 'resend_config_missing', 'none', true, 'restore_resend_config');
    }

    try {
      if (isLetter) {
        await supabaseMutation(fetchImpl, `${SUPABASE_URL}/rest/v1/subscribers`, SUPABASE_SERVICE_ROLE_KEY, 'POST', {
          email,
          lang,
          tier: 'paid', // Access includes the 14-day trial; revenue eligibility is recorded separately below.
          stripe_customer_id: stripeId(session.customer),
          stripe_subscription_id: stripeId(session.subscription),
          signed_up_at: new Date().toISOString(),
        }, 'resolution=merge-duplicates,return=representation');
      } else {
        await supabaseMutation(fetchImpl, `${SUPABASE_URL}/rest/v1/buyers`, SUPABASE_SERVICE_ROLE_KEY, 'POST', {
          email,
          lang,
          stripe_session_id: session.id,
          amount_paid: session.amount_total,
          currency: session.currency,
          purchased_at: new Date().toISOString(),
        }, 'resolution=merge-duplicates,return=representation');
      }
    } catch {
      await bestEffortReceiptUpdate({
        claim, fetchImpl, supabaseUrl: SUPABASE_URL, serviceKey: SUPABASE_SERVICE_ROLE_KEY,
        patch: { delivery_status: 'retryable_failure', error_class: 'buyer_store_failed', next_action: 'stripe_retry' },
      });
      return webhookFailure(payload, dependencies, 'buyer_receipt', 'buyer_store_failed', 'none', true, 'stripe_retry');
    }

    const pdfUrl = lang === 'jp'
      ? 'https://aniccaai.com/ebooks/anicca-reset-jp.pdf'
      : 'https://aniccaai.com/ebooks/anicca-reset-en.pdf';
    const subject = isLetter
      ? (lang === 'jp' ? '無常の手紙へようこそ' : 'Welcome to the Daily Anicca Letter')
      : (lang === 'jp' ? '『アニッチャ・リセット』お届けします' : 'Your copy of The Anicca Reset');
    const html = isLetter
      ? (lang === 'jp' ? jpLetterWelcomeHtml(stripeId(session.customer)) : enLetterWelcomeHtml(stripeId(session.customer)))
      : (lang === 'jp'
        ? jpDeliverHtml(pdfUrl, subscriptionUrl('jp', attributionToken))
        : enDeliverHtml(pdfUrl, subscriptionUrl('en', attributionToken)));
    const idempotencyKey = `${isLetter ? 'letter-welcome' : 'ebook-delivery'}-${session.id}`;
    let emailReceipt;
    try {
      emailReceipt = await sendEmail(RESEND_API_KEY, email, subject, html, idempotencyKey);
    } catch (error) {
      const effectUnknown = Boolean(error && error.effectUnknown);
      const errorClass = effectUnknown ? 'resend_effect_unknown' : 'resend_rejected';
      await bestEffortReceiptUpdate({
        claim, fetchImpl, supabaseUrl: SUPABASE_URL, serviceKey: SUPABASE_SERVICE_ROLE_KEY,
        patch: {
          delivery_status: effectUnknown ? 'effect_unknown' : 'retryable_failure',
          error_class: errorClass,
          next_action: effectUnknown ? 'official_readback_required' : 'stripe_retry',
        },
      });
      return webhookFailure(payload, dependencies, 'email_send', errorClass, effectUnknown ? 'unknown' : 'none', !effectUnknown, effectUnknown ? 'official_readback_required' : 'stripe_retry');
    }

    try {
      await updateClaimedReceipt({
        claim, fetchImpl, supabaseUrl: SUPABASE_URL, serviceKey: SUPABASE_SERVICE_ROLE_KEY,
        patch: {
          delivery_status: 'delivered',
          resend_id: emailReceipt && emailReceipt.id || null,
          error_class: null,
          next_action: null,
        },
      });
    } catch {
      return webhookFailure(payload, dependencies, 'receipt_finalize', 'provider_sent_receipt_unstored', 'unknown', false, 'official_readback_required', emailReceipt && emailReceipt.id || null);
    }
    return { statusCode: 200, body: isLetter ? 'ok subscription' : 'ok ebook' };
  }

  const subscriptionEvent = payload.type === 'invoice.paid'
    || payload.type === 'customer.subscription.created'
    || payload.type === 'customer.subscription.updated'
    || payload.type === 'customer.subscription.deleted';
  if (!subscriptionEvent) return { statusCode: 200, body: 'ignored' };
  const metadata = writerMetadata(payload) || {};
  if (metadata.product !== 'letter') return { statusCode: 200, body: 'ignored' };
  if (!SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY) {
    return webhookFailure(payload, dependencies, 'preflight', 'receipt_store_config_missing', 'none', true, 'restore_receipt_store');
  }

  const object = payload.data.object;
  const subscriptionId = payload.type.startsWith('customer.subscription.')
    ? stripeId(object.id)
    : stripeId(object.subscription || (object.parent && object.parent.subscription_details && object.parent.subscription_details.subscription));
  const lang = metadata.lang === 'jp' ? 'jp' : 'en';
  const receipt = {
    stripe_event_id: payload.id,
    stripe_session_id: null,
    stripe_customer_id: stripeId(object.customer),
    stripe_subscription_id: subscriptionId,
    product: 'letter',
    lang,
    attribution_token: validAttributionToken(metadata.attribution_token, lang),
    payment_status: payload.type === 'invoice.paid' ? 'paid' : null,
    subscription_status: payload.type.startsWith('customer.subscription.')
      ? (payload.type === 'customer.subscription.deleted' ? 'canceled' : object.status || 'unknown')
      : null,
    amount_total: null,
    amount_paid: payload.type === 'invoice.paid' && Number.isFinite(object.amount_paid) ? object.amount_paid : null,
    currency: object.currency || null,
    delivery_status: 'processing',
    error_class: null,
    next_action: null,
  };
  let claim;
  try {
    claim = await claimReceipt({
      receipt,
      conflictColumn: 'stripe_event_id',
      lookupColumn: 'stripe_event_id',
      lookupValue: payload.id,
      fetchImpl,
      supabaseUrl: SUPABASE_URL,
      serviceKey: SUPABASE_SERVICE_ROLE_KEY,
    });
  } catch {
    return webhookFailure(payload, dependencies, 'subscription_receipt', 'receipt_store_failed', 'none', true, 'stripe_retry');
  }
  if (claim.completed) return { statusCode: 200, body: 'duplicate complete' };
  if (!claim.claimed) {
    return webhookFailure(payload, dependencies, 'subscription_receipt', 'event_already_in_flight', 'unknown', false, 'official_readback_required');
  }

  try {
    if (payload.type === 'customer.subscription.deleted') {
      await supabaseMutation(fetchImpl,
        `${SUPABASE_URL}/rest/v1/subscribers?stripe_subscription_id=eq.${encodeURIComponent(subscriptionId)}`,
        SUPABASE_SERVICE_ROLE_KEY, 'PATCH', { tier: 'expired', unsubscribed_at: new Date().toISOString() }, 'return=representation');
    } else if (payload.type === 'customer.subscription.updated') {
      const tier = (object.status === 'active' || object.status === 'trialing') ? 'paid' : 'expired';
      await supabaseMutation(fetchImpl,
        `${SUPABASE_URL}/rest/v1/subscribers?stripe_subscription_id=eq.${encodeURIComponent(subscriptionId)}`,
        SUPABASE_SERVICE_ROLE_KEY, 'PATCH', { tier }, 'return=representation');
    }
  } catch {
    await bestEffortReceiptUpdate({
      claim, fetchImpl, supabaseUrl: SUPABASE_URL, serviceKey: SUPABASE_SERVICE_ROLE_KEY,
      patch: { delivery_status: 'retryable_failure', error_class: 'subscriber_store_failed', next_action: 'stripe_retry' },
    });
    return webhookFailure(payload, dependencies, 'subscriber_update', 'subscriber_store_failed', 'none', true, 'stripe_retry');
  }

  try {
    await updateClaimedReceipt({
      claim, fetchImpl, supabaseUrl: SUPABASE_URL, serviceKey: SUPABASE_SERVICE_ROLE_KEY,
      patch: { delivery_status: 'not_required', error_class: null, next_action: null },
    });
  } catch {
    return webhookFailure(payload, dependencies, 'subscription_finalize', 'receipt_finalize_failed', 'none', true, 'stripe_retry');
  }
  return { statusCode: 200, body: 'ok subscription state' };
}

function validAttributionToken(value, lang) {
  const prefix = lang === 'jp' ? 'ej_' : 'ee_';
  return typeof value === 'string' && new RegExp(`^${prefix}[a-z2-7]{20}$`).test(value) ? value : null;
}

function subscriptionUrl(lang, token) {
  const path = lang === 'jp' ? '/tegami' : '/letter';
  const query = token ? `?utm_campaign=${encodeURIComponent(token)}` : '';
  return `https://aniccaai.com${path}${query}`;
}

function stripeId(value) {
  return typeof value === 'string' ? value : value && typeof value.id === 'string' ? value.id : null;
}

function dbHeaders(serviceKey, prefer) {
  return {
    apikey: serviceKey,
    Authorization: `Bearer ${serviceKey}`,
    'Content-Type': 'application/json',
    ...(prefer ? { Prefer: prefer } : {}),
  };
}

async function readRows(response) {
  try {
    const value = await response.json();
    return Array.isArray(value) ? value : [];
  } catch {
    return [];
  }
}

async function claimReceipt({ receipt, conflictColumn, lookupColumn, lookupValue, fetchImpl, supabaseUrl, serviceKey }) {
  const table = `${supabaseUrl}/rest/v1/ebook_webhook_receipts`;
  const insert = await fetchImpl(`${table}?on_conflict=${conflictColumn}`, {
    method: 'POST',
    headers: dbHeaders(serviceKey, 'resolution=ignore-duplicates,return=representation'),
    body: JSON.stringify(receipt),
  });
  if (!insert.ok) throw new Error('receipt_insert_failed');
  const inserted = await readRows(insert);
  if (inserted.length > 0) return { claimed: true, row: inserted[0], lookupColumn, lookupValue };

  const existingResponse = await fetchImpl(
    `${table}?${lookupColumn}=eq.${encodeURIComponent(lookupValue)}&select=*`,
    { headers: dbHeaders(serviceKey) },
  );
  if (!existingResponse.ok) throw new Error('receipt_read_failed');
  const existingRows = await readRows(existingResponse);
  const existing = existingRows[0];
  if (!existing) throw new Error('receipt_conflict_without_row');
  if (existing.delivery_status === 'delivered' || existing.delivery_status === 'not_required' || existing.delivery_status === 'needs_email') {
    return { completed: true, row: existing, lookupColumn, lookupValue };
  }
  if (existing.delivery_status === 'retryable_failure') {
    const reclaimed = await updateReceipt({
      row: existing,
      fetchImpl,
      supabaseUrl,
      serviceKey,
      expectedStatus: 'retryable_failure',
      patch: { delivery_status: 'processing', error_class: null, next_action: null, updated_at: new Date().toISOString() },
    });
    if (reclaimed) return { claimed: true, row: reclaimed, lookupColumn, lookupValue };
    const latestResponse = await fetchImpl(
      `${table}?${lookupColumn}=eq.${encodeURIComponent(lookupValue)}&select=*`,
      { headers: dbHeaders(serviceKey) },
    );
    if (!latestResponse.ok) throw new Error('receipt_reread_failed');
    const latest = (await readRows(latestResponse))[0];
    if (latest && (latest.delivery_status === 'delivered' || latest.delivery_status === 'not_required')) {
      return { completed: true, row: latest, lookupColumn, lookupValue };
    }
  }
  return { claimed: false, row: existing, lookupColumn, lookupValue };
}

async function updateReceipt({ row, fetchImpl, supabaseUrl, serviceKey, expectedStatus, patch }) {
  const filter = row.stripe_event_id
    ? `stripe_event_id=eq.${encodeURIComponent(row.stripe_event_id)}`
    : `stripe_session_id=eq.${encodeURIComponent(row.stripe_session_id)}`;
  const expected = expectedStatus ? `&delivery_status=eq.${encodeURIComponent(expectedStatus)}` : '';
  const response = await fetchImpl(`${supabaseUrl}/rest/v1/ebook_webhook_receipts?${filter}${expected}`, {
    method: 'PATCH',
    headers: dbHeaders(serviceKey, 'return=representation'),
    body: JSON.stringify(patch),
  });
  if (!response.ok) throw new Error('receipt_update_failed');
  return (await readRows(response))[0] || null;
}

async function updateClaimedReceipt({ claim, fetchImpl, supabaseUrl, serviceKey, patch }) {
  const row = await updateReceipt({ row: claim.row, fetchImpl, supabaseUrl, serviceKey, patch });
  if (!row) throw new Error('receipt_update_missing');
  return row;
}

async function bestEffortReceiptUpdate({ claim, fetchImpl, supabaseUrl, serviceKey, patch }) {
  try {
    await updateClaimedReceipt({ claim, fetchImpl, supabaseUrl, serviceKey, patch: { ...patch, updated_at: new Date().toISOString() } });
  } catch {
    // Keep the original processing row fenced; a later webhook will not resend an uncertain email.
  }
}

async function supabaseMutation(fetchImpl, url, serviceKey, method, body, prefer) {
  const response = await fetchImpl(url, {
    method,
    headers: dbHeaders(serviceKey, prefer),
    body: JSON.stringify(body),
  });
  if (!response.ok) throw new Error('supabase_mutation_failed');
  if (prefer && prefer.includes('return=representation') && (await readRows(response)).length === 0) {
    throw new Error('supabase_mutation_missing_row');
  }
  return response;
}

function webhookFailure(payload, dependencies, phase, errorClass, effect, retryable, nextAction, providerReceiptId = null) {
  const eventId = payload && payload.id || null;
  const log = dependencies.logFailure || ((record) => console.error(JSON.stringify(record)));
  log({
    schema_version: 'ebook-webhook-event.v1',
    kind: 'webhook_failure',
    run_id: eventId ? `stripe:${eventId}` : null,
    owner_id: 'anicca-products-ebook-webhook',
    occurrence_id: eventId,
    release_sha: process.env.COMMIT_REF || process.env.GITHUB_SHA || null,
    loaded_argv: [],
    loaded_env_names: ['STRIPE_WEBHOOK_SECRET', 'SUPABASE_URL', 'SUPABASE_SERVICE_ROLE_KEY', 'RESEND_API_KEY'],
    phase,
    command: 'netlify-function:webhook',
    exit_code: 503,
    effect,
    readback: null,
    provider_receipt_id: providerReceiptId,
    evidence_refs: [],
    error_class: errorClass,
    retryable,
    next_action: nextAction,
  });
  return { statusCode: 503, body: 'retry' };
}

exports.webhookHandler = webhookHandler;
exports.handler = (event) => webhookHandler(event);

async function sendResend(key, email, subject, html, fetchImpl = fetch, idempotencyKey) {
  let response;
  try {
    response = await fetchImpl('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${key}`,
        'Content-Type': 'application/json',
        'Idempotency-Key': idempotencyKey,
      },
      body: JSON.stringify({ from: 'Anicca <onboarding@resend.dev>', to: email, subject, html }),
    });
  } catch {
    const error = new Error('resend_network_error');
    error.effectUnknown = true;
    throw error;
  }
  let result = null;
  try { result = await response.json(); } catch { /* provider response body is optional */ }
  if (!response.ok) {
    const error = new Error(`resend_http_${response.status}`);
    error.effectUnknown = response.status >= 500;
    throw error;
  }
  if (!result || typeof result.id !== 'string' || result.id.length === 0) {
    const error = new Error('resend_receipt_missing');
    error.effectUnknown = true;
    throw error;
  }
  return result;
}

function enLetterWelcomeHtml(customerId) {
  const manageUrl = customerId ? `https://aniccaai.com/account?cid=${customerId}` : 'https://aniccaai.com/account';
  return `
  <div style="font-family: Georgia, serif; max-width: 560px; margin: 0 auto; padding: 24px; color: #2A2520; line-height: 1.7;">
    <h1 style="font-weight: 300;">Welcome.</h1>
    <p>Your daily letters on impermanence start tomorrow morning.</p>
    <p>You've subscribed to the <em>Daily Anicca Letter</em>. One short meditation, every morning, on the body's emotional weather. The first 14 days are free. After that, $9.99/month.</p>
    <p>Read each letter slowly. Let it settle. The teaching is in the noticing, not in the rushing.</p>
    <p>— Anicca</p>
    <hr style="border:none; border-top: 1px solid #E5DCC9; margin: 32px 0;" />
    <p style="font-size:13px; color:#8B7355;">If you'd like the full 49-lesson book: <a href="https://aniccaai.com/monk" style="color:#2A2520;">The Anicca Reset — $10.99</a></p>
    <p style="text-align:center; margin: 24px 0 8px 0;">
      <a href="${manageUrl}" style="display:inline-block; border:1px solid #8B7355; color:#8B7355; padding: 10px 22px; text-decoration:none; letter-spacing:2px; font-size:11px; text-transform:uppercase;">Manage subscription</a>
    </p>
  </div>`;
}
function jpLetterWelcomeHtml(customerId) {
  const manageUrl = customerId ? `https://aniccaai.com/account?cid=${customerId}` : 'https://aniccaai.com/account';
  return `
  <div style="font-family: 'Hiragino Mincho ProN', serif; max-width: 560px; margin: 0 auto; padding: 24px; color: #2A2520; line-height: 1.9;">
    <h1 style="font-weight: 300;">ようこそ。</h1>
    <p>明日の朝から、無常をめぐる短い手紙を毎日お届けします。</p>
    <p>『無常の手紙』をご購読いただきありがとうございます。一通あたり約2分。365通、毎日1通ずつ。最初の14日間は無料、以後は月¥980。</p>
    <p>急がず、ゆっくり読んでください。気づくこと、それが教えです。</p>
    <p>— アニッチャ</p>
    <hr style="border:none; border-top: 1px solid #E5DCC9; margin: 32px 0;" />
    <p style="font-size:13px; color:#8B7355;">49章すべて読みたい方は: <a href="https://aniccaai.com/achan" style="color:#2A2520;">『アニッチャ・リセット』 — ¥1,580</a></p>
    <p style="text-align:center; margin: 24px 0 8px 0;">
      <a href="${manageUrl}" style="display:inline-block; border:1px solid #8B7355; color:#8B7355; padding: 10px 22px; text-decoration:none; letter-spacing:2px; font-size:11px;">サブスクリプションを管理</a>
    </p>
  </div>`;
}

function enDeliverHtml(url, subscriptionLink) {
  return `
  <div style="font-family: Georgia, serif; max-width: 560px; margin: 0 auto; padding: 24px; color: #2A2520; line-height: 1.7;">
    <h1 style="font-weight: 300;">Welcome.</h1>
    <p>Your copy of <em>The Anicca Reset</em> is ready. 49 short chapters on impermanence — read them slowly.</p>
    <p style="text-align:center; margin: 32px 0;">
      <a href="${url}" style="display:inline-block; background:#2A2520; color:#FBF7EF; padding: 14px 28px; text-decoration:none; letter-spacing:2px; font-size:13px;">Download the PDF →</a>
    </p>
    <p>Lifetime access. Read it on any device. Re-read it when you need to be reminded that the thing you're holding is already moving.</p>
    <p>— Anicca</p>
    <hr style="border:none; border-top: 1px solid #E5DCC9; margin: 32px 0;" />
    <p style="font-size:13px; color:#8B7355;">Want a short daily practice? <a href="${subscriptionLink}" style="color:#2A2520;">Try the Daily Anicca Letter free for 14 days</a>.</p>
  </div>`;
}

function jpDeliverHtml(url, subscriptionLink) {
  return `
  <div style="font-family: 'Hiragino Mincho ProN', serif; max-width: 560px; margin: 0 auto; padding: 24px; color: #2A2520; line-height: 1.9;">
    <h1 style="font-weight: 300;">ようこそ。</h1>
    <p>『アニッチャ・リセット』のPDFをお送りします。49の短い章、ゆっくりお読みください。</p>
    <p style="text-align:center; margin: 32px 0;">
      <a href="${url}" style="display:inline-block; background:#2A2520; color:#FBF7EF; padding: 14px 28px; text-decoration:none; letter-spacing:2px; font-size:13px;">PDFをダウンロード →</a>
    </p>
    <p>永久アクセス。いつでも、どの端末でも読めます。あなたが今抱えているものが、すでに動いていることを思い出したいときに、何度でも戻ってきてください。</p>
    <p>— アニッチャ</p>
    <hr style="border:none; border-top: 1px solid #E5DCC9; margin: 32px 0;" />
    <p style="font-size:13px; color:#8B7355;">毎日の短い実践をお求めなら、<a href="${subscriptionLink}" style="color:#2A2520;">『無常の手紙』を14日間無料でお試しください</a>。</p>
  </div>`;
}
