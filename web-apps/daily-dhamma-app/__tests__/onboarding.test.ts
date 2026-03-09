/**
 * Onboarding Unit Tests (TDD)
 *
 * T1: AppProvider onboardingAnswers state
 * T2-T8: Onboarding 7-step flow
 * T9: EN/JA localization
 */

jest.mock('@react-native-async-storage/async-storage', () => ({
  __esModule: true,
  default: {
    getItem: jest.fn(() => Promise.resolve(null)),
    setItem: jest.fn(() => Promise.resolve()),
    removeItem: jest.fn(() => Promise.resolve()),
  },
}));

import {
  OnboardingAnswers,
  getPaywallTitle,
  ONBOARDING_ANSWERS_KEY,
} from '../providers/onboardingAnswers';

// T1: OnboardingAnswers interface and getPaywallTitle
describe('OnboardingAnswers', () => {
  test('T1-1: default answers have null goal and preferredTime', () => {
    const defaults: OnboardingAnswers = { goal: null, preferredTime: null };
    expect(defaults.goal).toBeNull();
    expect(defaults.preferredTime).toBeNull();
  });

  test('T1-2: goal accepts valid values', () => {
    const goals: OnboardingAnswers['goal'][] = ['peace', 'wisdom', 'routine', 'mindfulness', null];
    for (const goal of goals) {
      const answers: OnboardingAnswers = { goal, preferredTime: null };
      expect(answers.goal).toBe(goal);
    }
  });

  test('T1-3: preferredTime accepts valid values', () => {
    const times: OnboardingAnswers['preferredTime'][] = ['morning', 'midday', 'evening', 'custom', null];
    for (const time of times) {
      const answers: OnboardingAnswers = { goal: null, preferredTime: time };
      expect(answers.preferredTime).toBe(time);
    }
  });

  test('T1-4: ONBOARDING_ANSWERS_KEY is defined', () => {
    expect(ONBOARDING_ANSWERS_KEY).toBe('daily_dharma_onboarding_answers');
  });
});

// T1-5: getPaywallTitle personalization
describe('getPaywallTitle', () => {
  test('returns peace title for peace goal', () => {
    expect(getPaywallTitle('peace')).toBe('paywall.title.personalized.peace');
  });

  test('returns wisdom title for wisdom goal', () => {
    expect(getPaywallTitle('wisdom')).toBe('paywall.title.personalized.wisdom');
  });

  test('returns routine title for routine goal', () => {
    expect(getPaywallTitle('routine')).toBe('paywall.title.personalized.routine');
  });

  test('returns mindfulness title for mindfulness goal', () => {
    expect(getPaywallTitle('mindfulness')).toBe('paywall.title.personalized.mindfulness');
  });

  test('returns default title for null goal', () => {
    expect(getPaywallTitle(null)).toBe('paywall.title.default');
  });
});
