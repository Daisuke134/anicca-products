const normalize = (value) => String(value ?? '').trim().toLowerCase();

function languageLabels(account) {
  return (account.languages ?? []).map((language) =>
    typeof language === 'string' ? language : language.label
  ).filter(Boolean);
}

function regionLabel(account) {
  return account.region_evidence?.label ?? '';
}

function searchableText(account) {
  return [
    account.display_name,
    ...(account.aliases ?? []),
    account.creator?.name,
    account.creator?.public_profile_url,
    ...languageLabels(account),
    regionLabel(account),
    ...(account.platforms ?? []).flatMap(({ platform, handle }) => [platform, handle]),
    ...(account.offers ?? []).flatMap(({ name, type }) => [name, type]),
    ...(account.creative_samples ?? []).map(({ title }) => title),
  ].filter(Boolean).join(' ').toLowerCase();
}

function matchesKnownOrUnknown(values, filter) {
  if (normalize(filter) === 'all') return true;
  if (normalize(filter) === 'unknown') return values.length === 0;
  return values.some((value) => normalize(value) === normalize(filter));
}

export function getAiMonkAvatarAccounts(accounts) {
  return accounts.filter(account => account.directory_scope?.status !== 'excluded');
}

export function filterAiMonkAccounts(accounts, filters = {}) {
  const query = normalize(filters.query);
  const status = filters.status ?? 'all';
  const language = filters.language ?? 'all';
  const platform = filters.platform ?? 'all';
  const region = filters.region ?? 'all';

  return getAiMonkAvatarAccounts(accounts).filter((account) => {
    const languages = languageLabels(account);
    const platforms = (account.platforms ?? []).map(({ platform: name }) => name).filter(Boolean);
    const regions = regionLabel(account) ? [regionLabel(account)] : [];

    return (!query || searchableText(account).includes(query))
      && matchesKnownOrUnknown([account.ai_status].filter(Boolean), status)
      && matchesKnownOrUnknown(languages, language)
      && matchesKnownOrUnknown(platforms, platform)
      && matchesKnownOrUnknown(regions, region);
  });
}


export function rankAiMonkAccounts(accounts, platform = 'all') {
  const audience = (account) => Math.max(-1, ...(account.platforms ?? [])
    .filter((entry) => normalize(platform) === 'all' || normalize(entry.platform) === normalize(platform))
    .map((entry) => (entry.snapshots ?? [])
      .filter(({ metric, value }) => ['followers', 'subscribers'].includes(normalize(metric))
        && typeof value === 'number' && Number.isFinite(value) && value >= 0)
      .sort((a, b) => (Date.parse(b.as_of) || 0) - (Date.parse(a.as_of) || 0))[0]?.value ?? -1));

  return accounts.map((account, index) => ({ account, index, audience: audience(account) }))
    .sort((a, b) => b.audience - a.audience || a.index - b.index)
    .map(({ account }) => account);
}
