const { createFactoryStore } = require('./_lib/monk-factory-store.js');
const { createFactoryProviders } = require('./_lib/monk-factory-providers.js');

function callbackResult(event, dependencies = {}) {
  if (event.httpMethod !== 'GET') return { statusCode: 405, headers: { Allow: 'GET', 'Cache-Control': 'no-store' }, body: '' };
  const env = dependencies.env || process.env;
  let returnUrl;
  try {
    const callback = new URL(env.MONK_FACTORY_META_REDIRECT_URI);
    if (callback.protocol !== 'https:' || callback.username || callback.password || callback.search || callback.hash) throw new Error();
    returnUrl = new URL('/ai-monk-factory', callback.origin);
  } catch { return { statusCode: 503, headers: { 'Cache-Control': 'no-store' }, body: '' }; }

  const params = event.queryStringParameters || {};
  const redirect = outcome => {
    const location = new URL(returnUrl);
    location.searchParams.set('instagram_oauth', outcome);
    return { statusCode: 302, headers: { Location: location.toString(), 'Cache-Control': 'no-store' }, body: '' };
  };
  if (params.error) return redirect('cancelled');
  if (typeof params.code !== 'string' || typeof params.state !== 'string') return redirect('failed');
  try {
    const store = dependencies.store || createFactoryStore({ env });
    const providers = dependencies.providers || createFactoryProviders({ env, socialStore: store });
    return Promise.resolve(providers.completeInstagramOAuth({ code: params.code, state: params.state }))
      .then(() => redirect('connected'))
      .catch(() => redirect('failed'));
  } catch { return redirect('failed'); }
}

exports.callbackResult = callbackResult;
exports.handler = event => callbackResult(event);
