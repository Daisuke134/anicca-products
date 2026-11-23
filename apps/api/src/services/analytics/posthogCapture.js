// Minimal PostHog legacy capture transport and APNs-accepted evidence contract.
// This is NOT evidence of delivery to device, an app open, or causal impact.
// https://posthog.com/docs/api/capture-v1 (legacy endpoints are supported)
const DEFAULT_HOST = 'https://us.i.posthog.com';
const CAPTURE_TIMEOUT_MS = 3000;
const HHMM = /^([01][0-9]|2[0-3]):[0-5][0-9]$/;

function nonempty(value) {
  return typeof value === 'string' && value.trim().length > 0;
}

export function notificationSentEvent({
  profileId, deliveryId, sendRowId, scheduledTime, lang, decision, apnsResult,
} = {}) {
  if (apnsResult?.ok !== true ||
      !nonempty(profileId) || !nonempty(deliveryId) || !nonempty(sendRowId) ||
      typeof scheduledTime !== 'string' || !HHMM.test(scheduledTime) ||
      decision?.backend !== 'manager-v1') return null;

  const probability = decision?.assigned_probability;
  return {
    event: 'notification_sent',
    distinctId: profileId,
    properties: {
      nudge_id: deliveryId,
      delivery_id: deliveryId,
      send_row_id: sendRowId,
      variant: nonempty(decision?.chosen?.kind) ? decision.chosen.kind : null,
      local_hour: Number(scheduledTime.slice(0, 2)),
      slot: scheduledTime,
      lang: nonempty(lang) ? lang : null,
      decision_source: 'manager',
      assigned_probability: Number.isFinite(probability) && probability > 0 && probability <= 1 ? probability : null,
      event_scope: 'APNS_PROVIDER_ACCEPTED',
      // This event does not create an identifiable PostHog person profile.
      $process_person_profile: false,
    },
  };
}

// true = transport HTTP 2xx only. It DOES NOT prove event ingestion or dashboard visibility.
export async function captureEvent({ event, distinctId, properties, fetchImpl = globalThis.fetch } = {}) {
  const apiKey = process.env.POSTHOG_API_KEY;
  if (!nonempty(apiKey) || !nonempty(event) || !nonempty(distinctId) ||
      !properties || typeof properties !== 'object' || typeof fetchImpl !== 'function') {
    return false;
  }
  const host = process.env.POSTHOG_HOST || DEFAULT_HOST;
  if (!/^https:\/\/[^/\s]+\/?$/.test(host)) return false;
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), CAPTURE_TIMEOUT_MS);
  try {
    const response = await fetchImpl(`${host.replace(/\/$/, '')}/i/v0/e/`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        api_key: apiKey,
        event,
        distinct_id: distinctId,
        properties,
        timestamp: new Date().toISOString(),
      }),
      signal: controller.signal,
    });
    return response?.ok === true;
  } catch {
    return false;
  } finally {
    clearTimeout(timer);
  }
}
