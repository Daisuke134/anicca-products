import React from 'react';
import { Alert } from 'react-native';
import { act, fireEvent, render, waitFor } from '@testing-library/react-native';
import { notifyManager, QueryClient, QueryClientProvider } from '@tanstack/react-query';
import Purchases from 'react-native-purchases';

const mockReplace = jest.fn();
jest.mock('expo-router', () => ({
  useRouter: () => ({ replace: mockReplace, canGoBack: () => false, back: jest.fn() }),
  useLocalSearchParams: () => ({ source: 'onboarding' }),
}));
jest.mock('react-native-safe-area-context', () => ({ useSafeAreaInsets: () => ({ top: 0, bottom: 0 }) }));
jest.mock('expo-haptics', () => ({
  ImpactFeedbackStyle: { Medium: 'medium', Light: 'light' },
  NotificationFeedbackType: { Success: 'success' },
  impactAsync: jest.fn(), notificationAsync: jest.fn(),
}));
jest.mock('react-native-purchases', () => ({
  __esModule: true,
  INTRO_ELIGIBILITY_STATUS: { INTRO_ELIGIBILITY_STATUS_ELIGIBLE: 2 },
  LOG_LEVEL: { DEBUG: 'DEBUG' },
  PURCHASES_ERROR_CODE: { PURCHASE_CANCELLED_ERROR: '1' },
  default: {
    configure: jest.fn(), setLogLevel: jest.fn(),
    getCustomerInfo: jest.fn(), getOfferings: jest.fn(), purchasePackage: jest.fn(),
    restorePurchases: jest.fn(),
    checkTrialOrIntroductoryPriceEligibility: jest.fn().mockResolvedValue({}),
    addCustomerInfoUpdateListener: jest.fn(), removeCustomerInfoUpdateListener: jest.fn(),
    setAttributes: jest.fn().mockResolvedValue(undefined),
  },
}));
jest.mock('../utils/analytics', () => ({
  getMixpanelDistinctId: jest.fn().mockResolvedValue('test-fixture'),
  trackPaywallShown: jest.fn(), trackScreenViewed: jest.fn(),
  trackPurchaseStarted: jest.fn(), trackPurchaseCompleted: jest.fn(),
  trackPurchaseCancelled: jest.fn(), trackPurchaseFailed: jest.fn(), trackTrialStarted: jest.fn(),
}));

process.env.EXPO_PUBLIC_REVENUECAT_TEST_API_KEY = 'test_fixture';
const { RevenueCatProvider } = require('../providers/RevenueCatProvider');
const PaywallScreen = require('../app/paywall').default;
const yearly = { identifier: '$rc_annual', packageType: 'ANNUAL', product: { identifier: 'premium.yearly', price: 47.99, priceString: '$47.99', currencyCode: 'USD' } };
const monthly = { identifier: '$rc_monthly', packageType: 'MONTHLY', product: { identifier: 'premium.monthly', price: 11.99, priceString: '$11.99', currencyCode: 'USD' } };
const info = { entitlements: { active: {} } };
const offering = (availablePackages: unknown[]) => ({ current: { identifier: 'default', availablePackages } });
let client: QueryClient;

beforeAll(() => notifyManager.setNotifyFunction(callback => { act(callback); }));
afterAll(() => notifyManager.setNotifyFunction(callback => callback()));
beforeEach(() => {
  jest.clearAllMocks();
  client = new QueryClient({ defaultOptions: { queries: { retry: false, gcTime: Infinity }, mutations: { gcTime: Infinity } } });
  jest.mocked(Purchases.getCustomerInfo).mockResolvedValue(info as never);
  jest.spyOn(Alert, 'alert').mockImplementation(() => {});
});
afterEach(() => { client.clear(); jest.restoreAllMocks(); });

function mount() {
  return render(React.createElement(QueryClientProvider, { client },
    React.createElement(RevenueCatProvider, null, React.createElement(PaywallScreen))));
}

test('failed pricing load can be retried and recovered without restarting or purchasing', async () => {
  jest.mocked(Purchases.getOfferings)
    .mockRejectedValueOnce(new Error('offline'))
    .mockResolvedValueOnce(offering([yearly, monthly]) as never);
  const screen = mount();
  await waitFor(() => expect(screen.getByTestId('paywall_offerings_retry')).toBeTruthy());
  expect(screen.queryByTestId('paywall_cta')).toBeNull();
  expect(screen.getByTestId('paywall_restore')).toBeTruthy();
  fireEvent.press(screen.getByTestId('paywall_offerings_retry'));
  await waitFor(() => expect(screen.getByTestId('paywall_cta')).toBeTruthy());
  expect(screen.getByText(/^\$47\.99/)).toBeTruthy();
  expect(Purchases.getOfferings).toHaveBeenCalledTimes(2);
  expect(Purchases.purchasePackage).not.toHaveBeenCalled();
  expect(Alert.alert).not.toHaveBeenCalled();
});

test('empty offerings stay recoverable and never render a price-less purchase button', async () => {
  jest.mocked(Purchases.getOfferings).mockResolvedValue(offering([]) as never);
  const screen = mount();
  await waitFor(() => expect(screen.getByTestId('paywall_offerings_retry')).toBeTruthy());
  expect(screen.queryByTestId('paywall_cta')).toBeNull();
  expect(screen.queryByTestId('paywall_plan_yearly')).toBeNull();
  expect(screen.queryByTestId('paywall_plan_monthly')).toBeNull();
  fireEvent.press(screen.getByTestId('paywall_offerings_retry'));
  await waitFor(() => expect(Purchases.getOfferings).toHaveBeenCalledTimes(2));
  expect(screen.queryByTestId('paywall_cta')).toBeNull();
  expect(Purchases.purchasePackage).not.toHaveBeenCalled();
});

test('a monthly-only offering selects its available plan and submits that exact package', async () => {
  jest.mocked(Purchases.getOfferings).mockResolvedValue(offering([monthly]) as never);
  jest.mocked(Purchases.purchasePackage).mockResolvedValue({ customerInfo: { entitlements: { active: { premium: { periodType: 'NORMAL' } } } } } as never);
  const screen = mount();
  await waitFor(() => expect(screen.getByTestId('paywall_cta')).toBeTruthy());
  expect(screen.queryByTestId('paywall_plan_yearly')).toBeNull();
  expect(screen.getByText(/^\$11\.99/)).toBeTruthy();
  fireEvent.press(screen.getByTestId('paywall_cta'));
  await waitFor(() => expect(Purchases.purchasePackage).toHaveBeenCalledWith(monthly));
  expect(mockReplace).toHaveBeenCalledWith('/');
});


test('repeated retry taps share one pending pricing request', async () => {
  let finish!: (value: unknown) => void;
  jest.mocked(Purchases.getOfferings)
    .mockResolvedValueOnce(offering([]) as never)
    .mockImplementationOnce(() => new Promise(resolve => { finish = resolve as never; }));
  const screen = mount();
  await waitFor(() => expect(screen.getByTestId('paywall_offerings_retry')).toBeTruthy());
  fireEvent.press(screen.getByTestId('paywall_offerings_retry'));
  await waitFor(() => expect(Purchases.getOfferings).toHaveBeenCalledTimes(2));
  await waitFor(() => expect(screen.getByTestId('paywall_offerings_retry')).toBeDisabled());
  fireEvent.press(screen.getByTestId('paywall_offerings_retry'));
  expect(Purchases.getOfferings).toHaveBeenCalledTimes(2);
  await act(async () => finish(offering([yearly])));
  await waitFor(() => expect(screen.getByTestId('paywall_cta')).toBeTruthy());
});

test('a later refresh does not silently switch a monthly customer to yearly', async () => {
  jest.mocked(Purchases.getOfferings).mockResolvedValue(offering([monthly]) as never);
  jest.mocked(Purchases.purchasePackage).mockResolvedValue({ customerInfo: { entitlements: { active: { premium: { periodType: 'NORMAL' } } } } } as never);
  const screen = mount();
  await waitFor(() => expect(screen.getByTestId('paywall_cta')).toBeEnabled());
  act(() => client.setQueryData(['revenuecat-offerings', true], offering([yearly, monthly])));
  await waitFor(() => expect(screen.getByTestId('paywall_plan_yearly')).toBeTruthy());
  fireEvent.press(screen.getByTestId('paywall_cta'));
  await waitFor(() => expect(Purchases.purchasePackage).toHaveBeenCalledWith(monthly));
});
