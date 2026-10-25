import type { FactoryAction } from '../../lib/monk-factory-client.mjs';

export type FactoryCapability = 'generation' | 'social' | 'checkout';
export type FactoryCapabilityState = { ready?: boolean; reason?: string | null; name?: FactoryCapability };
export type FactoryQuota = { known: boolean; available: boolean; exhausted: boolean };
export type FactoryAllowance = {
  hasAccess?: boolean;
  quotaKnown?: boolean;
  videosRemaining?: number | null;
  attemptsRemaining?: number | null;
  pendingVideo?: boolean;
  completedVideoReady?: boolean;
};

export function factoryQuotaState(usage?: { videosRemaining?: number | null; attemptsRemaining?: number | null } | null): FactoryQuota;
export function factoryCapabilityUnavailable(capability?: FactoryCapabilityState | null): string;
export function requestFactoryAction(
  action: FactoryAction,
  readiness: Partial<Record<FactoryCapability, FactoryCapabilityState>>,
  avatarReady: boolean,
  perform: (action: FactoryAction) => unknown,
  notify: (message: string) => void,
  allowance?: FactoryAllowance,
): boolean;
