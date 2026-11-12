import { Platform } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import Constants from 'expo-constants';
import * as Localization from 'expo-localization';
import { Mixpanel } from 'mixpanel-react-native';

/**
 * Mixpanel instrumentation for Daily Dhamma.
 * Event taxonomy and required properties follow the shared spec
 * `kpi-churn-event-spec-2026-11-11.md` §3.2 / §3.3 — the same ruler as the
 * native apps (Anicca iOS etc.): events go to the shared Mixpanel project
 * and carry app_id / app_environment / app_version / build / platform /
 * os_version / language / country as super properties.
 * Purchase / trial / churn ground truth is RevenueCat's server-side
 * Mixpanel integration (rc_* events, spec §3.5); the client purchase
 * events here are auxiliary records with full attribution properties.
 *
 * Token comes from EXPO_PUBLIC_MIXPANEL_TOKEN (eas.json env, the same
 * plaintext env convention as EXPO_PUBLIC_REVENUECAT_IOS_API_KEY).
 * Web is a no-op: this app's funnel is measured on iOS/Android.
 */
const APP_ID = 'com.dailydhamma.app';

type Props = Record<string, string | number | boolean>;

let mixpanel: Mixpanel | null = null;
let configured = false;
let onboardingStartedAt: number | null = null;

export async function initAnalytics(): Promise<void> {
  if (configured || Platform.OS === 'web') return;
  const token = process.env.EXPO_PUBLIC_MIXPANEL_TOKEN;
  if (!token) {
    console.log('[Analytics] EXPO_PUBLIC_MIXPANEL_TOKEN not set; analytics disabled');
    return;
  }
  try {
    const mp = new Mixpanel(token, false);
    await mp.init();
    mp.registerSuperProperties({
      app_id: APP_ID,
      // Environment separation (funnel spec TODO 4): the EAS build profile
      // declares EXPO_PUBLIC_APP_ENV (development/preview = 'sandbox',
      // production = 'production'); __DEV__ always means sandbox.
      // Residual limitation: a TestFlight build produced by the production
      // profile still labels itself 'production' — JS cannot read the
      // App Store receipt, so TestFlight separation relies on the profile.
      app_environment:
        __DEV__ || process.env.EXPO_PUBLIC_APP_ENV === 'sandbox'
          ? 'sandbox'
          : 'production',
      app_version: Constants.expoConfig?.version ?? 'unknown',
      build:
        Platform.OS === 'ios'
          ? (Constants.expoConfig?.ios?.buildNumber ?? 'unknown')
          : String(Constants.expoConfig?.android?.versionCode ?? 'unknown'),
      platform: Platform.OS,
      os_version: String(Platform.Version),
      language: Localization.getLocales()[0]?.languageTag ?? 'unknown',
      country: Localization.getLocales()[0]?.regionCode ?? 'unknown',
    });
    mixpanel = mp;
    configured = true;
    console.log('[Analytics] Mixpanel initialized');
  } catch (error) {
    console.warn('[Analytics] Mixpanel init failed:', error);
  }
}

export function track(event: string, properties: Props = {}): void {
  if (!mixpanel) return;
  try {
    mixpanel.track(event, {
      ...properties,
      event_id: `${Date.now()}-${Math.random().toString(36).slice(2, 10)}`,
      event_timestamp: Date.now(),
    });
  } catch {
    // Analytics must never break the product.
  }
}

export async function trackAppOpened(): Promise<void> {
  const key = 'analytics_has_launched_before';
  let firstLaunch = false;
  try {
    firstLaunch = (await AsyncStorage.getItem(key)) !== '1';
    if (firstLaunch) await AsyncStorage.setItem(key, '1');
  } catch {
    // Treat storage failures as a normal launch.
  }
  track('app_opened', { first_launch: firstLaunch });
}

/** Per-screen funnel measurement (shared spec §3.3, funnel spec TODO 4). */
export function trackScreenViewed(screenName: string): void {
  track('screen_viewed', { screen_name: screenName });
}

export function trackOnboardingStarted(): void {
  if (onboardingStartedAt === null) onboardingStartedAt = Date.now();
  track('onboarding_started');
}

export function trackOnboardingCompleted(): void {
  const durationSec =
    onboardingStartedAt === null
      ? 0
      : Math.round((Date.now() - onboardingStartedAt) / 1000);
  track('onboarding_completed', { duration_sec: durationSec });
}

export function trackNotificationPermissionResult(
  result: 'granted' | 'denied' | 'skipped',
  source: string
): void {
  track('notification_permission_result', { result, source });
}

export function trackPaywallShown(placement: string): void {
  track('paywall_shown', { paywall_id: 'dhamma_paywall_v1', placement });
}

export function trackCoreResultViewed(resultType: string): void {
  track('core_result_viewed', { result_type: resultType });
}

export function trackPurchaseStarted(properties: {
  productId: string;
  price: number;
  currency: string;
  period: string;
  trialEligible: boolean;
}): void {
  track('purchase_started', {
    product_id: properties.productId,
    price: properties.price,
    currency: properties.currency,
    period: properties.period,
    trial_eligible: properties.trialEligible,
  });
}

export function trackPurchaseCancelled(productId: string): void {
  track('purchase_cancelled', { product_id: productId });
}

export function trackPurchaseFailed(productId: string, errorCode: string): void {
  track('purchase_failed', { product_id: productId, error_code: errorCode });
}

export function trackPurchaseCompleted(productId: string): void {
  track('purchase_completed', { product_id: productId });
}

export function trackTrialStarted(productId: string, trialDays: number): void {
  track('trial_started', { product_id: productId, trial_days: trialDays });
}

/** Distinct ID used to link client events with RevenueCat's rc_* events. */
export async function getMixpanelDistinctId(): Promise<string | null> {
  if (!mixpanel) return null;
  try {
    return (await mixpanel.getDistinctId()) ?? null;
  } catch {
    return null;
  }
}
