export function withIncomingCampaign(appStoreHref, incomingCt) {
  const trimmed = typeof incomingCt === 'string' ? incomingCt.trim() : '';
  if (!trimmed) return appStoreHref;

  const url = new URL(appStoreHref);
  url.searchParams.set('ct', trimmed);
  return url.toString();
}

export function withLocaleCampaignQuery(targetPath, incomingCt) {
  const trimmed = typeof incomingCt === 'string' ? incomingCt.trim() : '';
  if (!trimmed) return targetPath;

  const url = new URL(targetPath, 'https://aniccaai.com');
  url.searchParams.set('ct', trimmed);
  return `${url.pathname}${url.search}`;
}
