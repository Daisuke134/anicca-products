const EBOOK_TOKEN = /^(?:ee|ej)_[a-z2-7]{20}$/;

export function isAttributionTokenForLang(token, lang) {
  if (typeof token !== 'string' || !EBOOK_TOKEN.test(token)) return false;
  return token.startsWith(lang === 'jp' ? 'ej_' : 'ee_');
}

export function buildCheckoutRequest({ search = '', lang, product, mode }) {
  const request = { lang, product, mode };
  const token = new URLSearchParams(search).get('utm_campaign');
  if (isAttributionTokenForLang(token, lang)) request.attribution_token = token;
  return request;
}
