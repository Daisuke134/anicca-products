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
    ...languageLabels(account),
    regionLabel(account),
    ...(account.platforms ?? []).flatMap(({ platform, handle }) => [platform, handle]),
  ].filter(Boolean).join(' ').toLowerCase();
}

function matchesKnownOrUnknown(values, filter) {
  if (normalize(filter) === 'all') return true;
  if (normalize(filter) === 'unknown') return values.length === 0;
  return values.some((value) => normalize(value) === normalize(filter));
}

export function filterAiMonkAccounts(accounts, filters = {}) {
  const query = normalize(filters.query);
  const status = filters.status ?? 'all';
  const language = filters.language ?? 'all';
  const platform = filters.platform ?? 'all';
  const region = filters.region ?? 'all';

  return accounts.filter((account) => {
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
