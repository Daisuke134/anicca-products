/**
 * reviewPrompt Unit Tests (Issue #47)
 *
 * The gate mirrors Anicca iOS ReviewPromptPolicy (the canonical values):
 * at least 3 distinct open days, a 120-day cooldown after each request,
 * and never on first launch.
 */
import AsyncStorage from '@react-native-async-storage/async-storage';
import {
  shouldRequestReview,
  recordReviewOpenDay,
  requestReviewIfAppropriate,
  REVIEW_COOLDOWN_DAYS,
} from '../utils/reviewPrompt';
import { track } from '../utils/analytics';
import * as StoreReview from 'expo-store-review';

// paywallUtils (imported by reviewPrompt for localDateKey) pulls in
// react-native-purchases; mock it the same way paywallUtils.test.ts does.
jest.mock('react-native-purchases', () => ({
  __esModule: true,
  default: { setAttributes: jest.fn(() => Promise.resolve()) },
  INTRO_ELIGIBILITY_STATUS:
    jest.requireActual('@revenuecat/purchases-typescript-internal').INTRO_ELIGIBILITY_STATUS,
}));
jest.mock('@react-native-async-storage/async-storage', () =>
  require('@react-native-async-storage/async-storage/jest/async-storage-mock')
);
jest.mock('../utils/analytics', () => ({ track: jest.fn() }));
jest.mock('expo-store-review', () => ({
  isAvailableAsync: jest.fn(async () => true),
  requestReview: jest.fn(async () => undefined),
}));

const DAY_MS = 24 * 60 * 60 * 1000;
const now = Date.UTC(2026, 10, 12, 12, 0, 0);

describe('shouldRequestReview (pure gate)', () => {
  test('false below 3 distinct open days (first launch included)', () => {
    expect(shouldRequestReview(0, null, now)).toBe(false);
    expect(shouldRequestReview(1, null, now)).toBe(false);
    expect(shouldRequestReview(2, null, now)).toBe(false);
  });

  test('true at 3 distinct open days with no prior request', () => {
    expect(shouldRequestReview(3, null, now)).toBe(true);
  });

  test('false inside the 120-day cooldown, true after it', () => {
    const last = now - (REVIEW_COOLDOWN_DAYS - 1) * DAY_MS;
    expect(shouldRequestReview(10, last, now)).toBe(false);
    const lastOk = now - REVIEW_COOLDOWN_DAYS * DAY_MS;
    expect(shouldRequestReview(10, lastOk, now)).toBe(true);
  });
});

describe('recordReviewOpenDay + requestReviewIfAppropriate', () => {
  beforeEach(async () => {
    await AsyncStorage.clear();
    jest.clearAllMocks();
    (StoreReview.isAvailableAsync as jest.Mock).mockResolvedValue(true);
  });

  test('recording the same day twice counts once', async () => {
    await recordReviewOpenDay();
    await recordReviewOpenDay();
    const raw = await AsyncStorage.getItem('dhamma_review_open_days');
    expect(JSON.parse(raw ?? '[]')).toHaveLength(1);
  });

  test('does not ask before 3 distinct open days are recorded', async () => {
    await recordReviewOpenDay();
    await expect(requestReviewIfAppropriate()).resolves.toBe(false);
    expect(StoreReview.requestReview).not.toHaveBeenCalled();
  });

  test('asks once at 3 open days, tracks rating_prompt_shown, then cooldown blocks', async () => {
    await AsyncStorage.setItem(
      'dhamma_review_open_days',
      JSON.stringify(['2026-11-10', '2026-11-11', '2026-11-12'])
    );
    await expect(requestReviewIfAppropriate()).resolves.toBe(true);
    expect(track).toHaveBeenCalledWith('rating_prompt_shown');
    expect(StoreReview.requestReview).toHaveBeenCalledTimes(1);

    // Immediate second attempt is inside the cooldown.
    await expect(requestReviewIfAppropriate()).resolves.toBe(false);
    expect(StoreReview.requestReview).toHaveBeenCalledTimes(1);
  });
});
