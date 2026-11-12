import AsyncStorage from '@react-native-async-storage/async-storage';
import { localDateKey } from './paywallUtils';
import { track } from './analytics';

/**
 * In-app review prompt, ported from Anicca iOS (`ReviewPromptPolicy` /
 * `ReviewPromptCoordinator`) — the canonical winner-pattern implementation
 * for Issue #47 (spec: anicca-ops `files/four-pillars-status-2026-11-12.md`
 * §0.2):
 *
 * - System dialog only (StoreReview.requestReview → SKStoreReviewController).
 *   No custom rating screen (Guideline 5.6.1).
 * - Fire only right after a value moment — here: a verse was just bookmarked.
 *   Never on first launch, never inside onboarding, never around the paywall
 *   (the onboarding-step pattern was a 5.6.3 rejection cause for Honne).
 * - Gates use Anicca's canonical values: at least 3 distinct open days and a
 *   120-day cooldown after each request (Apple's own 3-per-365-days cap also
 *   applies on top).
 * - Every time StoreKit is asked, `rating_prompt_shown` is tracked. Whether
 *   the dialog actually appears is decided by Apple and is not observable
 *   from the app; read it together with ASC rating counts.
 */

const OPEN_DAYS_KEY = 'dhamma_review_open_days';
const LAST_REQUEST_KEY = 'dhamma_review_last_request_at';

export const REVIEW_MIN_DISTINCT_OPEN_DAYS = 3;
export const REVIEW_COOLDOWN_DAYS = 120;

const COOLDOWN_MS = REVIEW_COOLDOWN_DAYS * 24 * 60 * 60 * 1000;

/** Pure gate (mirrors Anicca's ReviewPromptPolicy.shouldRequestReview). */
export function shouldRequestReview(
  distinctOpenDayCount: number,
  lastRequestAt: number | null,
  now: number = Date.now()
): boolean {
  // First launch has 0–1 distinct days; require sustained return visits.
  if (distinctOpenDayCount < REVIEW_MIN_DISTINCT_OPEN_DAYS) return false;
  if (lastRequestAt !== null && now < lastRequestAt + COOLDOWN_MS) return false;
  return true;
}

async function readOpenDays(): Promise<string[]> {
  try {
    const raw = await AsyncStorage.getItem(OPEN_DAYS_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed.filter((d) => typeof d === 'string') : [];
  } catch {
    return [];
  }
}

/** Call on app activation so distinct open days accumulate (idempotent per day). */
export async function recordReviewOpenDay(): Promise<void> {
  try {
    const days = await readOpenDays();
    const today = localDateKey(new Date());
    if (!days.includes(today)) {
      days.push(today);
      await AsyncStorage.setItem(OPEN_DAYS_KEY, JSON.stringify(days.sort()));
    }
  } catch {
    // Storage failure must never break the product; the gate simply stays closed.
  }
}

async function readLastRequestAt(): Promise<number | null> {
  try {
    const raw = await AsyncStorage.getItem(LAST_REQUEST_KEY);
    if (!raw) return null;
    const value = Number(raw);
    return Number.isFinite(value) && value > 0 ? value : null;
  } catch {
    return null;
  }
}

/**
 * After a value moment (a verse was just bookmarked).
 * Returns whether StoreKit was asked (Apple may still suppress the UI).
 */
export async function requestReviewIfAppropriate(): Promise<boolean> {
  try {
    const days = await readOpenDays();
    const lastRequestAt = await readLastRequestAt();
    const now = Date.now();
    if (!shouldRequestReview(days.length, lastRequestAt, now)) return false;

    // Record before presenting so a suppressed Apple dialog still counts toward cooldown.
    await AsyncStorage.setItem(LAST_REQUEST_KEY, String(now));
    track('rating_prompt_shown');

    const StoreReview = await import('expo-store-review');
    if (!(await StoreReview.isAvailableAsync())) return false;
    await StoreReview.requestReview();
    return true;
  } catch {
    return false;
  }
}
