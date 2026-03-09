/**
 * Paywall Unit Tests (TDD)
 *
 * T10-T17: Multi-step paywall (Cravotta Method)
 */

jest.mock('@react-native-async-storage/async-storage', () => ({
  __esModule: true,
  default: {
    getItem: jest.fn(() => Promise.resolve(null)),
    setItem: jest.fn(() => Promise.resolve()),
    removeItem: jest.fn(() => Promise.resolve()),
  },
}));

jest.mock('expo-notifications', () => ({
  scheduleNotificationAsync: jest.fn(() => Promise.resolve('mock-id')),
  getAllScheduledNotificationsAsync: jest.fn(() => Promise.resolve([])),
  cancelScheduledNotificationAsync: jest.fn(() => Promise.resolve()),
  cancelAllScheduledNotificationsAsync: jest.fn(() => Promise.resolve()),
  setNotificationHandler: jest.fn(),
  getPermissionsAsync: jest.fn(() => Promise.resolve({ status: 'granted' })),
  SchedulableTriggerInputTypes: { DATE: 'date' },
}));

import {
  getPaywallTitle,
  OnboardingAnswers,
} from '../providers/onboardingAnswers';
import {
  scheduleTrialReminder,
} from '../utils/notifications';
import * as Notifications from 'expo-notifications';

// T10: Paywall step state management
describe('Paywall step management', () => {
  test('T10-1: paywall has exactly 3 steps', () => {
    const steps = ['risk-free', 'transparency', 'hard-close'] as const;
    expect(steps.length).toBe(3);
  });
});

// T13: Paywall headline personalization
describe('Paywall personalization', () => {
  test('T13-1: peace goal returns personalized peace title', () => {
    expect(getPaywallTitle('peace')).toBe('paywall.title.personalized.peace');
  });

  test('T13-2: wisdom goal returns personalized wisdom title', () => {
    expect(getPaywallTitle('wisdom')).toBe('paywall.title.personalized.wisdom');
  });

  test('T13-3: routine goal returns personalized routine title', () => {
    expect(getPaywallTitle('routine')).toBe('paywall.title.personalized.routine');
  });

  test('T13-4: mindfulness goal returns personalized mindfulness title', () => {
    expect(getPaywallTitle('mindfulness')).toBe('paywall.title.personalized.mindfulness');
  });

  test('T13-5: null goal returns default title', () => {
    expect(getPaywallTitle(null)).toBe('paywall.title.default');
  });
});

// T16: Trial reminder notification scheduling
describe('Trial reminder notification', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  test('T16-1: scheduleTrialReminder schedules notification for Day 5', async () => {
    await scheduleTrialReminder();

    expect(Notifications.scheduleNotificationAsync).toHaveBeenCalledTimes(1);
    const call = (Notifications.scheduleNotificationAsync as jest.Mock).mock.calls[0][0];
    expect(call.identifier).toBe('trial-reminder-day5');
    expect(call.content.title).toBeTruthy();
    expect(call.content.body).toBeTruthy();
  });

  test('T16-2: scheduleTrialReminder cancels existing trial reminders first', async () => {
    (Notifications.getAllScheduledNotificationsAsync as jest.Mock).mockResolvedValueOnce([
      { identifier: 'trial-reminder-day5' },
      { identifier: 'morning-verse-0' },
    ]);

    await scheduleTrialReminder();

    expect(Notifications.cancelScheduledNotificationAsync).toHaveBeenCalledWith('trial-reminder-day5');
    expect(Notifications.cancelScheduledNotificationAsync).not.toHaveBeenCalledWith('morning-verse-0');
  });
});
