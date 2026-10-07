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
  const RESEND_FROM_EMAIL = typeof env.RESEND_FROM_EMAIL === 'string' ? env.RESEND_FROM_EMAIL.trim() : '';
  const fetchImpl = dependencies.fetchImpl || fetch;
  const sendEmail = dependencies.sendEmail
    || ((key, email, subject, html, idempotencyKey) => sendResend(
      key, email, subject, html, fetchImpl, idempotencyKey, RESEND_FROM_EMAIL,
    ));

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
    let currentLetterSubscription = null;
    if (isLetter) {
      const stripeKey = env.STRIPE_SECRET_KEY;
      const subscriptionId = stripeId(session.subscription);
      if (!stripeKey || !subscriptionId) {
        await bestEffortReceiptUpdate({
          claim, fetchImpl, supabaseUrl: SUPABASE_URL, serviceKey: SUPABASE_SERVICE_ROLE_KEY,
          patch: { delivery_status: 'retryable_failure', error_class: 'stripe_readback_config_missing', next_action: 'restore_stripe_config' },
        });
        return webhookFailure(payload, dependencies, 'preflight', 'stripe_readback_config_missing', 'none', true, 'restore_stripe_config');
      }
      let reservation;
      try {
        reservation = await reserveSubscriptionReadback({
          subscriptionId,
          email,
          lang,
          customerId: stripeId(session.customer),
          fetchImpl,
          supabaseUrl: SUPABASE_URL,
          serviceKey: SUPABASE_SERVICE_ROLE_KEY,
        });
      } catch (error) {
        const errorClass = error && error.code || 'subscription_state_reserve_failed';
        const nextAction = error && error.nextAction || 'stripe_retry';
        await bestEffortReceiptUpdate({
          claim, fetchImpl, supabaseUrl: SUPABASE_URL, serviceKey: SUPABASE_SERVICE_ROLE_KEY,
          patch: { delivery_status: 'retryable_failure', error_class: errorClass, next_action: nextAction },
        });
        return webhookFailure(payload, dependencies, 'subscription_state_reserve', errorClass, 'none', true, nextAction);
      }
      try {
        if (reservation.stripe_legacy_paid_pending_readback) {
          currentLetterSubscription = await reconcileLegacyCustomerSubscriptions({
            reservation,
            currentSubscriptionId: subscriptionId,
            eventId: payload.id,
            customerId: stripeId(session.customer),
            stripeKey,
            env,
            fetchImpl,
            supabaseUrl: SUPABASE_URL,
            serviceKey: SUPABASE_SERVICE_ROLE_KEY,
          });
        } else {
          const subscriptionReadback = await retrieveStripeSubscription(subscriptionId, stripeKey, fetchImpl);
          const state = await applySubscriptionState({
            subscriptionId,
            subscriberId: reservation.subscriber_id,
            generation: reservation.generation,
            status: subscriptionReadback.status,
            subscriptionCreatedAt: new Date(subscriptionReadback.created * 1000).toISOString(),
            eventId: payload.id,
            lang,
            customerId: stripeId(session.customer),
            fetchImpl,
            supabaseUrl: SUPABASE_URL,
            serviceKey: SUPABASE_SERVICE_ROLE_KEY,
          });
          if (state.outcome === 'stale') throw legacyReadbackError('subscription_state_superseded');
          currentLetterSubscription = { ...subscriptionReadback, status: state.status };
        }
        receipt.subscription_status = currentLetterSubscription.status;
        await updateClaimedReceipt({
          claim, fetchImpl, supabaseUrl: SUPABASE_URL, serviceKey: SUPABASE_SERVICE_ROLE_KEY,
          patch: { subscription_status: currentLetterSubscription.status, updated_at: new Date().toISOString() },
        });
      } catch (error) {
        const errorClass = error && error.code || 'subscription_state_readback_failed';
        const nextAction = error && error.nextAction || 'stripe_retry';
        await bestEffortReceiptUpdate({
          claim, fetchImpl, supabaseUrl: SUPABASE_URL, serviceKey: SUPABASE_SERVICE_ROLE_KEY,
          patch: { delivery_status: 'retryable_failure', error_class: errorClass, next_action: nextAction },
        });
        return webhookFailure(payload, dependencies, 'subscription_state_update', errorClass, 'none', true, nextAction);
      }
    }

    try {
      if (isEbook) {
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

    if (isLetter && currentLetterSubscription.status !== 'active' && currentLetterSubscription.status !== 'trialing') {
      try {
        await updateClaimedReceipt({
          claim, fetchImpl, supabaseUrl: SUPABASE_URL, serviceKey: SUPABASE_SERVICE_ROLE_KEY,
          patch: { delivery_status: 'not_required', error_class: null, next_action: null, updated_at: new Date().toISOString() },
        });
      } catch {
        await bestEffortReceiptUpdate({
          claim, fetchImpl, supabaseUrl: SUPABASE_URL, serviceKey: SUPABASE_SERVICE_ROLE_KEY,
          patch: { delivery_status: 'retryable_failure', error_class: 'receipt_finalize_failed', next_action: 'stripe_retry' },
        });
        return webhookFailure(payload, dependencies, 'receipt_finalize', 'receipt_finalize_failed', 'none', true, 'stripe_retry');
      }
      return { statusCode: 200, body: 'subscription inactive' };
    }

    if (!RESEND_API_KEY || !RESEND_FROM_EMAIL) {
      const senderMissing = Boolean(RESEND_API_KEY && !RESEND_FROM_EMAIL);
      const errorClass = senderMissing ? 'resend_sender_config_missing' : 'resend_config_missing';
      const nextAction = senderMissing ? 'configure_verified_resend_sender' : 'restore_resend_config';
      await bestEffortReceiptUpdate({
        claim, fetchImpl, supabaseUrl: SUPABASE_URL, serviceKey: SUPABASE_SERVICE_ROLE_KEY,
        patch: { delivery_status: 'retryable_failure', error_class: errorClass, next_action: nextAction },
      });
      return webhookFailure(payload, dependencies, 'preflight', errorClass, 'none', true, nextAction);
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
      const errorClass = error && error.idempotencyPayloadMismatch
        ? 'resend_idempotency_payload_mismatch'
        : effectUnknown ? 'resend_effect_unknown' : 'resend_rejected';
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
  let currentSubscription = null;
  const updatesAccessState = payload.type === 'customer.subscription.updated'
    || payload.type === 'customer.subscription.deleted';
  if (updatesAccessState) {
    const stripeKey = env.STRIPE_SECRET_KEY;
    if (!stripeKey) {
      return webhookFailure(payload, dependencies, 'preflight', 'stripe_readback_config_missing', 'none', true, 'restore_stripe_config');
    }
    let previousReceipt;
    try {
      previousReceipt = await readEventReceipt({
        eventId: payload.id,
        fetchImpl,
        supabaseUrl: SUPABASE_URL,
        serviceKey: SUPABASE_SERVICE_ROLE_KEY,
      });
    } catch {
      return webhookFailure(payload, dependencies, 'subscription_receipt_read', 'receipt_store_failed', 'none', true, 'stripe_retry');
    }
    if (previousReceipt && previousReceipt.delivery_status === 'not_required') {
      return { statusCode: 200, body: 'duplicate complete' };
    }
    if (previousReceipt) {
      return webhookFailure(payload, dependencies, 'subscription_receipt_read', 'event_receipt_unresolved', 'unknown', false, 'official_readback_required');
    }
    let reservation;
    try {
      reservation = await reserveSubscriptionReadback({
        subscriptionId,
        email: null,
        lang,
        customerId: stripeId(object.customer),
        fetchImpl,
        supabaseUrl: SUPABASE_URL,
        serviceKey: SUPABASE_SERVICE_ROLE_KEY,
      });
    } catch (error) {
      const errorClass = error && error.code || 'subscription_state_reserve_failed';
      const nextAction = error && error.nextAction || 'stripe_retry';
      return webhookFailure(payload, dependencies, 'subscription_state_reserve', errorClass, 'none', true, nextAction);
    }
    try {
      if (reservation.stripe_legacy_paid_pending_readback) {
        currentSubscription = await reconcileLegacyCustomerSubscriptions({
          reservation,
          currentSubscriptionId: subscriptionId,
          eventId: payload.id,
          customerId: stripeId(object.customer),
          stripeKey,
          env,
          fetchImpl,
          supabaseUrl: SUPABASE_URL,
          serviceKey: SUPABASE_SERVICE_ROLE_KEY,
        });
      } else {
        currentSubscription = await retrieveStripeSubscription(subscriptionId, stripeKey, fetchImpl);
        const state = await applySubscriptionState({
          subscriptionId,
          subscriberId: reservation.subscriber_id,
          generation: reservation.generation,
          status: currentSubscription.status,
          subscriptionCreatedAt: new Date(currentSubscription.created * 1000).toISOString(),
          eventId: payload.id,
          lang,
          customerId: stripeId(object.customer),
          fetchImpl,
          supabaseUrl: SUPABASE_URL,
          serviceKey: SUPABASE_SERVICE_ROLE_KEY,
        });
        if (state.outcome === 'stale') throw legacyReadbackError('subscription_state_superseded');
        currentSubscription = { ...currentSubscription, status: state.status };
      }
    } catch (error) {
      const errorClass = error && error.code || 'subscription_state_update_failed';
      const nextAction = error && error.nextAction || 'stripe_retry';
      return webhookFailure(payload, dependencies, 'subscription_state_update', errorClass, 'none', true, nextAction);
    }
  }
  const receipt = {
    stripe_event_id: payload.id,
    stripe_session_id: null,
    stripe_customer_id: stripeId(object.customer),
    stripe_subscription_id: subscriptionId,
    product: 'letter',
    lang,
    attribution_token: validAttributionToken(metadata.attribution_token, lang),
    payment_status: payload.type === 'invoice.paid' ? 'paid' : null,
    subscription_status: currentSubscription
      ? currentSubscription.status
      : payload.type.startsWith('customer.subscription.')
        ? (payload.type === 'customer.subscription.deleted' ? 'canceled' : object.status || 'unknown')
      : null,
    amount_total: null,
    amount_paid: payload.type === 'invoice.paid' && Number.isFinite(object.amount_paid) ? object.amount_paid : null,
    currency: object.currency || null,
    delivery_status: 'not_required',
    error_class: null,
    next_action: null,
  };
  try {
    const result = await recordEventReceipt({
      receipt,
      fetchImpl,
      supabaseUrl: SUPABASE_URL,
      serviceKey: SUPABASE_SERVICE_ROLE_KEY,
    });
    if (result.completed) return { statusCode: 200, body: 'duplicate complete' };
  } catch {
    return webhookFailure(payload, dependencies, 'subscription_receipt', 'receipt_store_failed', 'none', true, 'stripe_retry');
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

async function recordEventReceipt({ receipt, fetchImpl, supabaseUrl, serviceKey }) {
  const table = `${supabaseUrl}/rest/v1/ebook_webhook_receipts`;
  const insert = await fetchImpl(`${table}?on_conflict=stripe_event_id`, {
    method: 'POST',
    headers: dbHeaders(serviceKey, 'resolution=ignore-duplicates,return=representation'),
    body: JSON.stringify(receipt),
  });
  if (!insert.ok) throw new Error('event_receipt_insert_failed');
  if ((await readRows(insert)).length > 0) return { recorded: true };

  const existingResponse = await fetchImpl(
    `${table}?stripe_event_id=eq.${encodeURIComponent(receipt.stripe_event_id)}&select=*`,
    { headers: dbHeaders(serviceKey) },
  );
  if (!existingResponse.ok) throw new Error('event_receipt_read_failed');
  const existing = (await readRows(existingResponse))[0];
  if (existing && existing.delivery_status === 'not_required') return { completed: true };
  throw new Error('event_receipt_unresolved');
}

async function readEventReceipt({ eventId, fetchImpl, supabaseUrl, serviceKey }) {
  const response = await fetchImpl(
    `${supabaseUrl}/rest/v1/ebook_webhook_receipts?stripe_event_id=eq.${encodeURIComponent(eventId)}&select=*`,
    { headers: dbHeaders(serviceKey) },
  );
  if (!response.ok) throw new Error('event_receipt_read_failed');
  return (await readRows(response))[0] || null;
}

async function retrieveStripeSubscription(subscriptionId, stripeKey, fetchImpl) {
  const response = await fetchImpl(`https://api.stripe.com/v1/subscriptions/${encodeURIComponent(subscriptionId)}`, {
    headers: { Authorization: `Bearer ${stripeKey}` },
  });
  if (!response.ok) throw new Error('stripe_subscription_read_failed');
  const subscription = await response.json();
  if (!subscription || subscription.id !== subscriptionId || typeof subscription.status !== 'string'
      || !Number.isSafeInteger(subscription.created) || subscription.created <= 0) {
    throw new Error('stripe_subscription_readback_invalid');
  }
  return subscription;
}

async function reserveSubscriptionReadback({
  subscriptionId,
  email,
  lang,
  customerId,
  fetchImpl,
  supabaseUrl,
  serviceKey,
}) {
  const response = await fetchImpl(`${supabaseUrl}/rest/v1/rpc/reserve_ebook_subscription_readback`, {
    method: 'POST',
    headers: dbHeaders(serviceKey),
    body: JSON.stringify({
      p_stripe_subscription_id: subscriptionId,
      p_email: email || null,
      p_lang: email ? lang : null,
      p_stripe_customer_id: customerId || null,
    }),
  });
  if (!response.ok) throw new Error('subscription_state_reservation_failed');
  const result = await response.json();
  if (result && result.outcome === 'legacy_customer_mismatch') {
    const error = new Error('legacy_customer_mapping_mismatch');
    error.code = 'legacy_customer_mapping_mismatch';
    error.nextAction = 'manual_legacy_customer_reconciliation';
    throw error;
  }
  if (!result || result.outcome !== 'reserved'
      || !Number.isSafeInteger(result.generation) || result.generation < 1
      || typeof result.subscriber_id !== 'string' || !result.subscriber_id
      || typeof result.stripe_legacy_paid_pending_readback !== 'boolean'
      || (result.stripe_customer_id !== null && typeof result.stripe_customer_id !== 'string')) {
    throw new Error('subscription_state_reservation_invalid');
  }
  return result;
}

async function applySubscriptionState({
  subscriptionId,
  subscriberId,
  generation,
  status,
  subscriptionCreatedAt,
  eventId,
  lang,
  customerId,
  fetchImpl,
  supabaseUrl,
  serviceKey,
}) {
  const response = await fetchImpl(`${supabaseUrl}/rest/v1/rpc/apply_ebook_subscription_state`, {
    method: 'POST',
    headers: dbHeaders(serviceKey),
    body: JSON.stringify({
      p_stripe_subscription_id: subscriptionId,
      p_subscriber_id: subscriberId,
      p_readback_generation: generation,
      p_subscription_status: status,
      p_subscription_created_at: subscriptionCreatedAt,
      p_event_id: eventId,
      p_lang: lang || null,
      p_stripe_customer_id: customerId || null,
    }),
  });
  if (!response.ok) throw new Error('subscription_state_rpc_failed');
  const result = await response.json();
  if (result && result.outcome === 'legacy_customer_mismatch') {
    const error = new Error('legacy_customer_mapping_mismatch');
    error.code = 'legacy_customer_mapping_mismatch';
    error.nextAction = 'manual_legacy_customer_reconciliation';
    throw error;
  }
  if (!result || !['applied', 'stale', 'duplicate', 'conflict'].includes(result.outcome)) {
    throw new Error('subscription_state_rpc_invalid');
  }
  if (result.outcome === 'conflict') throw new Error('subscription_state_readback_conflict');
  return result;
}

const STRIPE_SUBSCRIPTION_STATUSES = new Set([
  'active', 'trialing', 'past_due', 'canceled', 'unpaid', 'incomplete', 'incomplete_expired', 'paused',
]);

function legacyReadbackError(code, nextAction = 'stripe_retry') {
  const error = new Error(code);
  error.code = code;
  error.nextAction = nextAction;
  return error;
}

async function listStripeCustomerSubscriptions(customerId, stripeKey, fetchImpl) {
  if (!customerId || !stripeKey) {
    throw legacyReadbackError('legacy_customer_mapping_mismatch', 'manual_legacy_customer_reconciliation');
  }
  const snapshotAt = new Date().toISOString();
  const subscriptions = [];
  const seen = new Set();
  let startingAfter = null;
  let pages = 0;
  while (true) {
    const query = new URLSearchParams({ customer: customerId, status: 'all', limit: '100' });
    if (startingAfter) query.set('starting_after', startingAfter);
    let response;
    try {
      response = await fetchImpl(`https://api.stripe.com/v1/subscriptions?${query.toString()}`, {
        headers: { Authorization: `Bearer ${stripeKey}` },
      });
    } catch {
      throw legacyReadbackError('stripe_customer_subscription_list_failed');
    }
    if (!response.ok) throw legacyReadbackError('stripe_customer_subscription_list_failed');
    let page;
    try { page = await response.json(); } catch {
      throw legacyReadbackError('stripe_customer_subscription_list_invalid');
    }
    if (!page || (page.object && page.object !== 'list') || !Array.isArray(page.data)
        || typeof page.has_more !== 'boolean') {
      throw legacyReadbackError('stripe_customer_subscription_list_invalid');
    }
    if (page.has_more && page.data.length === 0) {
      throw legacyReadbackError('stripe_customer_subscription_cursor_invalid');
    }
    for (const subscription of page.data) {
      const id = stripeId(subscription && subscription.id);
      const subscriptionCustomerId = stripeId(subscription && subscription.customer);
      if (!id || seen.has(id) || subscriptionCustomerId !== customerId
          || !STRIPE_SUBSCRIPTION_STATUSES.has(subscription.status)
          || !Number.isSafeInteger(subscription.created) || subscription.created <= 0) {
        throw legacyReadbackError('stripe_customer_subscription_list_invalid');
      }
      seen.add(id);
      subscriptions.push(subscription);
    }
    if (!page.has_more) break;
    const nextCursor = page.data[page.data.length - 1].id;
    if (typeof nextCursor !== 'string' || !nextCursor || nextCursor === startingAfter) {
      throw legacyReadbackError('stripe_customer_subscription_cursor_invalid');
    }
    startingAfter = nextCursor;
    pages += 1;
    if (pages > 100) throw legacyReadbackError('stripe_customer_subscription_page_limit');
  }
  return { snapshotAt, subscriptions };
}

function classifyLetterSubscription(subscription, env) {
  const metadata = subscription && subscription.metadata && typeof subscription.metadata === 'object'
    ? subscription.metadata
    : {};
  const metadataProduct = typeof metadata.product === 'string' ? metadata.product.trim() : '';
  const priceLanguage = new Map();
  if (env.STRIPE_LETTER_EN_PRICE) priceLanguage.set(env.STRIPE_LETTER_EN_PRICE, 'en');
  if (env.STRIPE_LETTER_JP_PRICE) priceLanguage.set(env.STRIPE_LETTER_JP_PRICE, 'jp');
  const items = subscription.items && Array.isArray(subscription.items.data) ? subscription.items.data : [];
  const matchingLanguages = new Set(items.map((item) => {
    const price = item && (item.price || item.plan);
    const priceId = stripeId(price);
    return priceId ? priceLanguage.get(priceId) : null;
  }).filter(Boolean));

  if (metadataProduct && metadataProduct !== 'letter') {
    if (matchingLanguages.size > 0) {
      throw legacyReadbackError('legacy_subscription_product_conflict', 'manual_legacy_subscription_reconciliation');
    }
    return null;
  }
  if (matchingLanguages.size > 1) {
    throw legacyReadbackError('legacy_subscription_product_unclassifiable', 'manual_legacy_subscription_reconciliation');
  }
  const metadataLanguage = metadata.lang === 'en' || metadata.lang === 'jp' ? metadata.lang : null;
  const priceLang = matchingLanguages.size === 1 ? [...matchingLanguages][0] : null;
  if (metadataLanguage && priceLang && metadataLanguage !== priceLang) {
    throw legacyReadbackError('legacy_subscription_product_conflict', 'manual_legacy_subscription_reconciliation');
  }
  const lang = metadataLanguage || priceLang;
  if (metadataProduct !== 'letter' && !priceLang) {
    throw legacyReadbackError('legacy_subscription_product_unclassifiable', 'manual_legacy_subscription_reconciliation');
  }
  if (!lang) {
    throw legacyReadbackError('legacy_subscription_product_unclassifiable', 'manual_legacy_subscription_reconciliation');
  }
  return { lang };
}

async function finalizeLegacySubscriptionReadback({
  subscriberId,
  customerId,
  snapshotAt,
  subscriptionIds,
  fetchImpl,
  supabaseUrl,
  serviceKey,
}) {
  const response = await fetchImpl(`${supabaseUrl}/rest/v1/rpc/finalize_ebook_legacy_subscription_readback`, {
    method: 'POST',
    headers: dbHeaders(serviceKey),
    body: JSON.stringify({
      p_subscriber_id: subscriberId,
      p_stripe_customer_id: customerId,
      p_snapshot_at: snapshotAt,
      p_letter_subscription_ids: subscriptionIds,
    }),
  });
  if (!response.ok) throw legacyReadbackError('legacy_subscription_finalization_failed');
  let result;
  try { result = await response.json(); } catch {
    throw legacyReadbackError('legacy_subscription_finalization_invalid');
  }
  if (!result || !['reconciled', 'not_pending'].includes(result.outcome)) {
    const outcome = result && result.outcome;
    const code = outcome === 'stale'
      ? 'legacy_subscription_readback_stale'
      : outcome === 'customer_mismatch' || outcome === 'customer_state_ambiguous'
        ? 'legacy_customer_mapping_mismatch'
        : 'legacy_subscription_finalization_invalid';
    throw legacyReadbackError(code, code === 'legacy_customer_mapping_mismatch'
      ? 'manual_legacy_customer_reconciliation' : 'stripe_retry');
  }
  return result;
}

async function reconcileLegacyCustomerSubscriptions({
  reservation,
  currentSubscriptionId,
  eventId,
  customerId,
  stripeKey,
  env,
  fetchImpl,
  supabaseUrl,
  serviceKey,
}) {
  if (!reservation || reservation.stripe_legacy_paid_pending_readback !== true) {
    throw new Error('legacy subscription reconciliation was not requested');
  }
  if (!customerId || !reservation.stripe_customer_id || reservation.stripe_customer_id !== customerId) {
    throw legacyReadbackError('legacy_customer_mapping_mismatch', 'manual_legacy_customer_reconciliation');
  }

  const inventory = await listStripeCustomerSubscriptions(customerId, stripeKey, fetchImpl);
  const letterSubscriptions = [];
  for (const subscription of inventory.subscriptions) {
    const classification = classifyLetterSubscription(subscription, env);
    if (classification) letterSubscriptions.push({ ...subscription, letter_lang: classification.lang });
  }
  const currentSubscription = letterSubscriptions.find((subscription) => subscription.id === currentSubscriptionId);
  if (!currentSubscription) {
    throw legacyReadbackError('legacy_subscription_inventory_missing_trigger', 'stripe_retry');
  }

  for (const subscription of letterSubscriptions) {
    const subscriptionId = subscription.id;
    const stateReservation = subscriptionId === currentSubscriptionId
      ? reservation
      : await reserveSubscriptionReadback({
        subscriptionId,
        email: null,
        lang: subscription.letter_lang,
        customerId,
        fetchImpl,
        supabaseUrl,
        serviceKey,
      });
    if (stateReservation.subscriber_id !== reservation.subscriber_id
        || stateReservation.stripe_customer_id !== customerId) {
      throw legacyReadbackError('legacy_customer_mapping_mismatch', 'manual_legacy_customer_reconciliation');
    }
    const applied = await applySubscriptionState({
      subscriptionId,
      subscriberId: stateReservation.subscriber_id,
      generation: stateReservation.generation,
      status: subscription.status,
      subscriptionCreatedAt: new Date(subscription.created * 1000).toISOString(),
      eventId: subscriptionId === currentSubscriptionId
        ? eventId
        : `legacy_customer_readback:${inventory.snapshotAt}:${subscriptionId}`,
      lang: subscription.letter_lang,
      customerId,
      fetchImpl,
      supabaseUrl,
      serviceKey,
    });
    if (!['applied', 'duplicate'].includes(applied.outcome)) {
      throw legacyReadbackError('legacy_subscription_readback_stale');
    }
  }

  await finalizeLegacySubscriptionReadback({
    subscriberId: reservation.subscriber_id,
    customerId,
    snapshotAt: inventory.snapshotAt,
    subscriptionIds: letterSubscriptions.map((subscription) => subscription.id),
    fetchImpl,
    supabaseUrl,
    serviceKey,
  });
  return currentSubscription;
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
    loaded_env_names: ['STRIPE_WEBHOOK_SECRET', 'SUPABASE_URL', 'SUPABASE_SERVICE_ROLE_KEY', 'RESEND_API_KEY', 'RESEND_FROM_EMAIL'],
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

async function sendResend(key, email, subject, html, fetchImpl = fetch, idempotencyKey, from) {
  let response;
  try {
    response = await fetchImpl('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${key}`,
        'Content-Type': 'application/json',
        'Idempotency-Key': idempotencyKey,
      },
      body: JSON.stringify({ from, to: email, subject, html }),
    });
  } catch {
    const error = new Error('resend_network_error');
    error.effectUnknown = true;
    throw error;
  }
  let result = null;
  try { result = await response.json(); } catch { /* provider response body is optional */ }
  if (!response.ok) {
    const errorName = result && (result.name || result.error);
    const isConcurrentIdempotentRequest = response.status === 409 && errorName === 'concurrent_idempotent_requests';
    const isIdempotencyPayloadMismatch = response.status === 409 && errorName === 'invalid_idempotent_request';
    const error = new Error(`resend_http_${response.status}`);
    error.providerErrorName = typeof errorName === 'string' ? errorName : null;
    error.idempotencyPayloadMismatch = isIdempotencyPayloadMismatch;
    error.effectUnknown = response.status >= 500 || (response.status === 409 && !isConcurrentIdempotentRequest);
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
