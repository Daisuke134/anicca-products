const endpoint = '/.netlify/functions/monk-factory';
const actions = new Set(['checkout', 'portal', 'generate_avatar', 'generate_video', 'connect_instagram', 'autopost', 'stop']);
const uuid = /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

export class FactoryClientError extends Error {
  constructor(code) { super(code); this.name = 'FactoryClientError'; this.code = code; }
}

export async function factoryRequest(token, action, { idempotencyKey, signal, fetchImpl = fetch } = {}) {
  if (!token || /[\r\n]/.test(token)) throw new FactoryClientError('sign_in_required');
  if ((action && !actions.has(action)) || (action === 'generate_video' && !uuid.test(idempotencyKey || ''))) throw new FactoryClientError('invalid_request');
  const headers = { Authorization: `Bearer ${token}` };
  if (action) headers['Content-Type'] = 'application/json';
  if (action === 'generate_video') headers['Idempotency-Key'] = idempotencyKey;
  let response;
  try {
    response = await fetchImpl(endpoint, { method: action ? 'POST' : 'GET', headers, cache: 'no-store', signal, ...(action ? { body: JSON.stringify({ action }) } : {}) });
  } catch (error) {
    if (signal?.aborted) throw error;
    throw new FactoryClientError('connection_interrupted');
  }
  let body;
  try { body = await response.json(); } catch { throw new FactoryClientError('factory_unavailable'); }
  if (!response.ok) throw new FactoryClientError(/^[a-z_]{1,60}$/.test(body?.error || '') ? body.error : 'factory_unavailable');
  if (!body || typeof body !== 'object' || Array.isArray(body)) throw new FactoryClientError('factory_unavailable');
  return body;
}

export function factoryDestination(result, action) {
  if (action === 'checkout' && result.complete === true) return null;
  const hosts = { checkout: 'checkout.stripe.com', portal: 'billing.stripe.com', connect_instagram: 'app.upload-post.com' };
  let url;
  try { url = new URL(result.url); } catch { throw new FactoryClientError('invalid_destination'); }
  if (!hosts[action] || url.protocol !== 'https:' || url.hostname !== hosts[action] || url.username || url.password || url.port || url.hash) throw new FactoryClientError('invalid_destination');
  return url.href;
}
