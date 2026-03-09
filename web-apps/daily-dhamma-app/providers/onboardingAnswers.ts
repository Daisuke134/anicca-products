import AsyncStorage from '@react-native-async-storage/async-storage';

export interface OnboardingAnswers {
  goal: 'peace' | 'wisdom' | 'routine' | 'mindfulness' | null;
  preferredTime: 'morning' | 'midday' | 'evening' | 'custom' | null;
}

export const ONBOARDING_ANSWERS_KEY = 'daily_dharma_onboarding_answers';

export const defaultOnboardingAnswers: OnboardingAnswers = {
  goal: null,
  preferredTime: null,
};

export async function loadOnboardingAnswers(): Promise<OnboardingAnswers> {
  try {
    const stored = await AsyncStorage.getItem(ONBOARDING_ANSWERS_KEY);
    if (stored) {
      return JSON.parse(stored) as OnboardingAnswers;
    }
  } catch (error) {
    console.error('[OnboardingAnswers] Failed to load:', error);
  }
  return { ...defaultOnboardingAnswers };
}

export async function saveOnboardingAnswers(answers: OnboardingAnswers): Promise<void> {
  try {
    await AsyncStorage.setItem(ONBOARDING_ANSWERS_KEY, JSON.stringify(answers));
  } catch (error) {
    console.error('[OnboardingAnswers] Failed to save:', error);
  }
}

export function getPaywallTitle(goal: OnboardingAnswers['goal']): string {
  switch (goal) {
    case 'peace':
      return 'paywall.title.personalized.peace';
    case 'wisdom':
      return 'paywall.title.personalized.wisdom';
    case 'routine':
      return 'paywall.title.personalized.routine';
    case 'mindfulness':
      return 'paywall.title.personalized.mindfulness';
    default:
      return 'paywall.title.default';
  }
}
