import React from 'react';
import { Alert } from 'react-native';
import { render, fireEvent, waitFor } from '@testing-library/react-native';
import PaywallScreen from '../app/paywall';
import { t } from '../utils/i18n';

const mockReplace = jest.fn();
const mockPurchase = jest.fn();
const mockRestore = jest.fn();
const mockTrackPaywallEvent = jest.fn();
const mockNotify = jest.fn();
const pkg = { identifier: '$rc_annual', product: { identifier: 'premium.yearly', price: 47.99, priceString: '$47.99', currencyCode: 'USD' } };

jest.mock('expo-router', () => ({
  useRouter: () => ({ replace: mockReplace, canGoBack: () => false, back: jest.fn() }),
  useLocalSearchParams: () => ({ source: 'onboarding' }),
}));
jest.mock('react-native-safe-area-context', () => ({ useSafeAreaInsets: () => ({ top: 0, bottom: 0 }) }));
jest.mock('expo-haptics', () => ({
  ImpactFeedbackStyle: { Medium: 'medium', Light: 'light' },
  NotificationFeedbackType: { Success: 'success' },
  impactAsync: jest.fn(),
  notificationAsync: (...args: unknown[]) => mockNotify(...args),
}));
jest.mock('../providers/RevenueCatProvider', () => ({ useRevenueCat: () => ({
  isConfigured: true,
  customerInfo: { entitlements: { active: {} } },
  currentOffering: { availablePackages: [pkg] },
  isLoadingOfferings: false,
  purchasePackage: mockPurchase,
  restorePurchases: mockRestore,
  isPurchasing: false,
  isRestoring: false,
}) }));
jest.mock('../utils/useTrialEligibility', () => ({ useTrialEligibility: () => undefined }));
jest.mock('../utils/analytics', () => ({ trackPaywallShown: jest.fn(), trackScreenViewed: jest.fn() }));
jest.mock('react-native-purchases', () => ({
  __esModule: true,
  default: { setAttributes: jest.fn().mockResolvedValue(undefined) },
  INTRO_ELIGIBILITY_STATUS: { INTRO_ELIGIBILITY_STATUS_ELIGIBLE: 2 },
  PURCHASES_ERROR_CODE: { PURCHASE_CANCELLED_ERROR: '1' },
}));
jest.mock('../utils/paywallUtils', () => ({
  ...jest.requireActual('../utils/paywallUtils'),
  trackPaywallEvent: (...args: unknown[]) => mockTrackPaywallEvent(...args),
}));

beforeEach(() => {
  jest.clearAllMocks();
  jest.spyOn(Alert, 'alert').mockImplementation(() => {});
});
afterEach(() => jest.restoreAllMocks());

async function pressPurchase() {
  const screen = render(React.createElement(PaywallScreen));
  fireEvent.press(screen.getByTestId('paywall_cta'));
  await waitFor(() => expect(mockPurchase).toHaveBeenCalledWith(pkg));
  return screen;
}

test('a resolved purchase without Premium stays on the paywall and offers restore, not false success', async () => {
  mockPurchase.mockResolvedValue({ entitlements: { active: {} } });
  await pressPurchase();
  await waitFor(() => expect(Alert.alert).toHaveBeenCalled());
  expect(mockReplace).not.toHaveBeenCalled();
  expect(mockNotify).not.toHaveBeenCalled();
  expect(mockTrackPaywallEvent).not.toHaveBeenCalledWith('purchase', 'onboarding');
  expect(mockTrackPaywallEvent).not.toHaveBeenCalledWith('trial_started', 'onboarding');
  expect(Alert.alert).toHaveBeenCalledWith(t('paywall.alert.accessPending.title'), t('paywall.alert.accessPending.msg'));
});

for (const periodType of ['NORMAL', 'TRIAL']) {
  test(`confirmed ${periodType} entitlement records success and opens home`, async () => {
    mockPurchase.mockResolvedValue({ entitlements: { active: { premium: { periodType } } } });
    await pressPurchase();
    await waitFor(() => expect(mockReplace).toHaveBeenCalledWith('/'));
    expect(mockNotify).toHaveBeenCalledWith('success');
    expect(mockTrackPaywallEvent).toHaveBeenCalledWith(periodType === 'TRIAL' ? 'trial_started' : 'purchase', 'onboarding');
    expect(Alert.alert).not.toHaveBeenCalled();
  });
}

for (const error of [
  { code: '1', message: '購入がキャンセルされました' },
  { userCancelled: true, message: 'Purchase canceled' },
]) {
  test(`SDK cancellation ${JSON.stringify(error)} is silent regardless of message language`, async () => {
    mockPurchase.mockRejectedValue(error);
    await pressPurchase();
    expect(Alert.alert).not.toHaveBeenCalled();
    expect(mockReplace).not.toHaveBeenCalled();
    expect(mockNotify).not.toHaveBeenCalled();
  });
}

test('a non-cancellation failure remains visible and does not open home', async () => {
  mockPurchase.mockRejectedValue({ code: '2', message: 'Network error' });
  await pressPurchase();
  await waitFor(() => expect(Alert.alert).toHaveBeenCalledWith(t('paywall.alert.purchaseFailed.title'), t('paywall.alert.purchaseFailed.msg')));
  expect(mockReplace).not.toHaveBeenCalled();
  expect(mockNotify).not.toHaveBeenCalled();
});


test('a purchase without access can recover through the existing restore action', async () => {
  mockPurchase.mockResolvedValue({ entitlements: { active: {} } });
  mockRestore.mockResolvedValue({ entitlements: { active: { premium: { periodType: 'NORMAL' } } } });
  const screen = await pressPurchase();
  await waitFor(() => expect(Alert.alert).toHaveBeenCalled());
  expect(mockReplace).not.toHaveBeenCalled();
  fireEvent.press(screen.getByTestId('paywall_restore'));
  await waitFor(() => expect(mockReplace).toHaveBeenCalledWith('/'));
  expect(mockRestore).toHaveBeenCalledTimes(1);
  expect(mockPurchase).toHaveBeenCalledTimes(1);
});
