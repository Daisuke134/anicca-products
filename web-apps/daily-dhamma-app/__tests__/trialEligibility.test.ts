import React from 'react';
import { act, renderHook, waitFor } from '@testing-library/react-native';
import { notifyManager, QueryClient, QueryClientProvider } from '@tanstack/react-query';
import Purchases, { INTRO_ELIGIBILITY_STATUS } from 'react-native-purchases';
import type { CustomerInfo, PurchasesPackage } from 'react-native-purchases';
import { getFreeTrial } from '../utils/paywallUtils';
import { useTrialEligibility } from '../utils/useTrialEligibility';

jest.mock('react-native-purchases', () => ({
  __esModule: true,
  INTRO_ELIGIBILITY_STATUS: jest.requireActual('@revenuecat/purchases-typescript-internal').INTRO_ELIGIBILITY_STATUS,
  LOG_LEVEL: { DEBUG: 'DEBUG' },
  PURCHASES_ERROR_CODE: { PURCHASE_CANCELLED_ERROR: '1' },
  default: {
    configure: jest.fn(),
    setLogLevel: jest.fn(),
    getCustomerInfo: jest.fn(),
    getOfferings: jest.fn(),
    checkTrialOrIntroductoryPriceEligibility: jest.fn(),
    addCustomerInfoUpdateListener: jest.fn(),
    removeCustomerInfoUpdateListener: jest.fn(),
  },
}));

process.env.EXPO_PUBLIC_REVENUECAT_TEST_API_KEY = 'test_fixture';
const { RevenueCatProvider, useRevenueCat } = require('../providers/RevenueCatProvider');

const productId = 'test.premium.yearly';
const yearly = {
  identifier: 'annual',
  product: { identifier: productId, introPrice: { price: 0, periodUnit: 'DAY', periodNumberOfUnits: 3 } },
} as PurchasesPackage;

function customer(user: string): CustomerInfo {
  return {
    originalAppUserId: user,
    requestDate: '2026-01-01T00:00:00Z',
    entitlements: { active: {}, all: {}, verification: 'NOT_REQUESTED' },
    activeSubscriptions: [], allPurchasedProductIdentifiers: [],
    latestExpirationDate: null, firstSeen: '2026-01-01T00:00:00Z',
    originalApplicationVersion: null, originalPurchaseDate: null,
    allExpirationDates: {}, allPurchaseDates: {}, nonSubscriptionTransactions: [],
    managementURL: null, subscriptionsByProductIdentifier: {},
  } as CustomerInfo;
}

const eligible = { [productId]: { status: INTRO_ELIGIBILITY_STATUS.INTRO_ELIGIBILITY_STATUS_ELIGIBLE, description: 'eligible' } };
let client: QueryClient;

beforeAll(() => notifyManager.setNotifyFunction((callback) => { act(callback); }));
afterAll(() => notifyManager.setNotifyFunction((callback) => callback()));

function mount() {
  return renderHook(() => {
    const state = useRevenueCat();
    const pkg = state.currentOffering?.availablePackages[0];
    const eligibility = useTrialEligibility(pkg?.product.identifier, state.isConfigured, state.customerInfo);
    return {
      user: state.customerInfo?.originalAppUserId,
      eligibility,
      trial: getFreeTrial(pkg, eligibility),
    };
  }, {
    wrapper: ({ children }: { children: React.ReactNode }) => React.createElement(
      QueryClientProvider, { client }, React.createElement(RevenueCatProvider, null, children)
    ),
  });
}

beforeEach(() => {
  jest.clearAllMocks();
  client = new QueryClient({ defaultOptions: { queries: { retry: false, gcTime: Infinity } } });
  jest.mocked(Purchases.getCustomerInfo).mockResolvedValue(customer('first'));
  jest.mocked(Purchases.getOfferings).mockResolvedValue({ current: { availablePackages: [yearly] } } as never);
});

afterEach(() => client.clear());

test('offers the free trial after the SDK confirms this customer is eligible', async () => {
  jest.mocked(Purchases.checkTrialOrIntroductoryPriceEligibility).mockResolvedValue(eligible);
  const { result } = mount();
  await waitFor(() => expect(result.current.trial).toEqual({ unit: 'DAY', count: 3 }));
  expect(Purchases.checkTrialOrIntroductoryPriceEligibility).toHaveBeenCalledWith([productId]);
});

test.each([
  INTRO_ELIGIBILITY_STATUS.INTRO_ELIGIBILITY_STATUS_UNKNOWN,
  INTRO_ELIGIBILITY_STATUS.INTRO_ELIGIBILITY_STATUS_INELIGIBLE,
  INTRO_ELIGIBILITY_STATUS.INTRO_ELIGIBILITY_STATUS_NO_INTRO_OFFER_EXISTS,
])('keeps the ordinary purchase display for SDK eligibility status %s', async (status) => {
  jest.mocked(Purchases.checkTrialOrIntroductoryPriceEligibility).mockResolvedValue({ [productId]: { status, description: 'not eligible' } });
  const { result } = mount();
  await waitFor(() => expect(result.current.eligibility).toBe(status));
  expect(result.current.trial).toBeNull();
});

test('does not promise a free trial when the SDK rejects the eligibility check', async () => {
  jest.mocked(Purchases.checkTrialOrIntroductoryPriceEligibility).mockRejectedValue(new Error('unavailable'));
  const { result } = mount();
  await waitFor(() => expect(result.current.user).toBe('first'));
  await waitFor(() => expect(Purchases.checkTrialOrIntroductoryPriceEligibility).toHaveBeenCalled());
  await waitFor(() => expect(client.isFetching({ queryKey: ['trial-eligibility'] })).toBe(0));
  expect(result.current.trial).toBeNull();
});

test('clears the previous customer eligibility while the next check is pending or fails', async () => {
  let rejectNext!: (error: Error) => void;
  jest.mocked(Purchases.checkTrialOrIntroductoryPriceEligibility)
    .mockResolvedValueOnce(eligible)
    .mockImplementationOnce(() => new Promise((_, reject) => { rejectNext = reject; }));
  const { result } = mount();
  await waitFor(() => expect(result.current.trial).toEqual({ unit: 'DAY', count: 3 }));
  const listener = jest.mocked(Purchases.addCustomerInfoUpdateListener).mock.calls[0][0];
  act(() => listener(customer('second')));
  await waitFor(() => expect(result.current.user).toBe('second'));
  expect(result.current.trial).toBeNull();
  await waitFor(() => expect(rejectNext).toBeDefined());
  await act(async () => rejectNext(new Error('unavailable')));
  await waitFor(() => expect(client.isFetching({ queryKey: ['trial-eligibility'] })).toBe(0));
  expect(result.current.trial).toBeNull();
});

test('hides cached eligibility while checking again when the paywall reopens', async () => {
  let rejectNext!: (error: Error) => void;
  jest.mocked(Purchases.checkTrialOrIntroductoryPriceEligibility)
    .mockResolvedValueOnce(eligible)
    .mockImplementationOnce(() => new Promise((_, reject) => { rejectNext = reject; }));
  const first = mount();
  await waitFor(() => expect(first.result.current.trial).toEqual({ unit: 'DAY', count: 3 }));
  first.unmount();
  const next = mount();
  expect(next.result.current.trial).toBeNull();
  await waitFor(() => expect(rejectNext).toBeDefined());
  await act(async () => rejectNext(new Error('unavailable')));
  await waitFor(() => expect(client.isFetching({ queryKey: ['trial-eligibility'] })).toBe(0));
  expect(next.result.current.trial).toBeNull();
});
