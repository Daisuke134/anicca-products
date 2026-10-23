export type AiMonkLanguage = {
  label: string;
  source_ids?: string[];
};

export type AiMonkPlatform = {
  platform: string;
  handle: string | null;
  profile_url: string | null;
  snapshots?: Array<{
    value: string | number;
    metric: string;
    as_of?: string | null;
    source_id?: string;
    status?: string;
  }>;
  unknown_reason?: string;
};

export type AiMonkRevenueObservation = {
  metric: string;
  amount: number;
  currency: string;
  period_months: number;
  as_of: string;
  comparison: 'greater_than' | 'exact' | 'at_least';
  source_id: string;
  status: string;
  period_note?: string;
};

export type AiMonkAccount = {
  id: string;
  display_name: string;
  persona_type: string;
  ai_status: 'confirmed' | 'reported' | 'unverified';
  directory_scope?: { status: 'excluded'; reason: string; source_ids?: string[] };
  ai_evidence?: Array<{ source_id: string; summary: string }>;
  identity_conflicts?: Array<{ source_id: string; summary: string }>;
  creator?: {
    name: string | null;
    public_profile_url?: string;
    relationship?: string;
  };
  languages?: AiMonkLanguage[];
  region_evidence?: {
    label: string;
    basis: string;
    source_id: string;
  } | null;
  platforms?: AiMonkPlatform[];
  source_urls?: string[];
  offers?: Array<{
    type: string;
    name?: string | null;
    price?: number | null;
    currency?: string | null;
    url?: string | null;
    status?: string;
    source_id?: string;
    as_of?: string;
  }>;
  seller_counters?: Array<{ value: string | number; metric: string; status: string }>;
  creator_claims?: Array<{ claim: string; status: string }>;
  revenue_observations?: AiMonkRevenueObservation[];
  creative_samples?: Array<{
    url: string;
    title: string;
    structure_summary: string;
    views?: number | null;
    views_captured_at?: string | null;
    source_id?: string;
    platform?: string;
  }>;
  unknowns?: string[];
};

export type AiMonkDirectoryFilters = {
  query?: string;
  status?: string;
  language?: string;
  platform?: string;
  region?: string;
};

export function filterAiMonkAccounts(
  accounts: AiMonkAccount[],
  filters?: AiMonkDirectoryFilters
): AiMonkAccount[];

export function getAiMonkAvatarAccounts(accounts: AiMonkAccount[]): AiMonkAccount[];

export function rankAiMonkAccounts(
  accounts: AiMonkAccount[],
  platform?: string,
  metric?: 'audience' | 'views' | 'revenue'
): AiMonkAccount[];

export function getAiMonkTopVideo(account: AiMonkAccount, platform?: string): (NonNullable<AiMonkAccount['creative_samples']>[number] & { platform?: string }) | null;
export function getAiMonkRevenue(account: AiMonkAccount): AiMonkRevenueObservation | null;
