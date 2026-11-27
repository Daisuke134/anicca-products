import AsyncStorage from '@react-native-async-storage/async-storage';
import { Linking } from 'react-native';

/**
 * Review prompt after value — 1.2.2.
 *
 * Finding: `expo-store-review` is NOT a dependency of this app (checked
 * package.json on 2026-11-27), so the native SKStoreReviewController sheet
 * (StoreReview.requestReview()) cannot be used without adding a new native
 * dependency blind. Closest safe equivalent using only packages already in
 * the dependency set: AsyncStorage (already used by AppProvider) to persist
 * the view counter + once-only flag, and React Native `Linking` (already
 * used by app/paywall.tsx) to open the App Store write-review page.
 *
 * Fires only after the daily verse has been viewed on at least 2 distinct
 * days (distinct occasions — never on first launch / first view), and at
 * most once ever.
 */
const STORAGE_KEY = 'daily_dharma_review_prompt_v1';
const APP_STORE_WRITE_REVIEW_URL =
  'https://apps.apple.com/app/id6757726663?action=write-review';
export const REVIEW_PROMPT_MIN_DISTINCT_DAYS = 2;

interface ReviewPromptState {
  verseViewDays: string[];
  requested: boolean;
}

function localDayKey(date: Date): string {
  const m = String(date.getMonth() + 1).padStart(2, '0');
  const d = String(date.getDate()).padStart(2, '0');
  return `${date.getFullYear()}-${m}-${d}`;
}

export async function recordVerseViewAndMaybeRequestReview(): Promise<void> {
  try {
    const raw = await AsyncStorage.getItem(STORAGE_KEY);
    const state: ReviewPromptState = raw
      ? (JSON.parse(raw) as ReviewPromptState)
      : { verseViewDays: [], requested: false };
    if (state.requested) return;

    const today = localDayKey(new Date());
    if (!state.verseViewDays.includes(today)) {
      state.verseViewDays = [...state.verseViewDays, today];
      await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(state));
    }
    if (state.verseViewDays.length < REVIEW_PROMPT_MIN_DISTINCT_DAYS) return;

    // Set the once-only flag before opening, so a failure cannot re-prompt.
    state.requested = true;
    await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(state));
    await Linking.openURL(APP_STORE_WRITE_REVIEW_URL);
  } catch (e) {
    console.warn('[ReviewPrompt] failed:', e);
  }
}
