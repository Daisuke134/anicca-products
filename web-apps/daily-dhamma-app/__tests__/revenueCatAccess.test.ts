import React from 'react';
import { Text } from 'react-native';
import { act, render, waitFor } from '@testing-library/react-native';
import { notifyManager, QueryClient, QueryClientProvider } from '@tanstack/react-query';
import Purchases, { CustomerInfo, PurchasesPackage } from 'react-native-purchases';

jest.mock('react-native-purchases', () => ({
  __esModule: true,
  LOG_LEVEL: { DEBUG: 'DEBUG' },
  PURCHASES_ERROR_CODE: { PURCHASE_CANCELLED_ERROR: '1' },
  default: {
    configure: jest.fn(), setLogLevel: jest.fn(), getCustomerInfo: jest.fn(),
    getOfferings: jest.fn(), purchasePackage: jest.fn(), restorePurchases: jest.fn(),
    addCustomerInfoUpdateListener: jest.fn(), removeCustomerInfoUpdateListener: jest.fn(),
    setAttributes: jest.fn().mockResolvedValue(undefined),
  },
}));
jest.mock('../utils/analytics', () => ({
  getMixpanelDistinctId: jest.fn().mockResolvedValue('test-fixture'),
  trackPurchaseStarted: jest.fn(), trackPurchaseCompleted: jest.fn(),
  trackPurchaseCancelled: jest.fn(), trackPurchaseFailed: jest.fn(), trackTrialStarted: jest.fn(),
}));
process.env.EXPO_PUBLIC_REVENUECAT_TEST_API_KEY = 'test_fixture';
const { RevenueCatProvider, useRevenueCat } = require('../providers/RevenueCatProvider');
const freeInfo = { entitlements: { active: {} } } as CustomerInfo;
const paidInfo = { entitlements: { active: { premium: { periodType: 'NORMAL' } } } } as unknown as CustomerInfo;
const yearly = { identifier: '$rc_annual', packageType: 'ANNUAL', product: { identifier: 'premium.yearly', price: 47.99, currencyCode: 'USD' } } as PurchasesPackage;
let client: QueryClient;
let access: ReturnType<typeof useRevenueCat>;
function Consumer() {
  access = useRevenueCat();
  return React.createElement(Text, { testID: 'access' }, access.isPremium ? 'premium' : 'free');
}
function mount() {
  return render(React.createElement(QueryClientProvider, { client },
    React.createElement(RevenueCatProvider, null, React.createElement(Consumer))));
}
beforeAll(() => notifyManager.setNotifyFunction(callback => { act(callback); }));
afterAll(() => notifyManager.setNotifyFunction(callback => callback()));
beforeEach(() => {
  jest.clearAllMocks();
  client = new QueryClient({ defaultOptions: { queries: { retry: false, gcTime: Infinity }, mutations: { gcTime: Infinity } } });
  jest.mocked(Purchases.getOfferings).mockResolvedValue({ current: null } as never);
  jest.mocked(Purchases.getCustomerInfo).mockResolvedValue(freeInfo);
  jest.mocked(Purchases.purchasePackage).mockResolvedValue({ customerInfo: paidInfo } as never);
  jest.mocked(Purchases.restorePurchases).mockResolvedValue(paidInfo);
});
afterEach(() => client.clear());

test('cached Premium access is preserved when the provider mounts again', () => {
  client.setQueryData(['revenuecat-customer-info', true], paidInfo);
  const screen = mount();
  expect(screen.getByTestId('access')).toHaveTextContent('premium');
});

test.each(['purchase', 'restore', 'listener'] as const)(
  '%s access is not revoked by an older in-flight customer lookup', async (operation) => {
    let finishOldLookup!: (info: CustomerInfo) => void;
    jest.mocked(Purchases.getCustomerInfo).mockImplementationOnce(() => new Promise(resolve => { finishOldLookup = resolve; }));
    const screen = mount();
    await waitFor(() => expect(Purchases.getCustomerInfo).toHaveBeenCalledTimes(1));
    await act(async () => {
      if (operation === 'purchase') await access.purchasePackage(yearly);
      else if (operation === 'restore') await access.restorePurchases();
      else jest.mocked(Purchases.addCustomerInfoUpdateListener).mock.calls[0][0](paidInfo);
    });
    await waitFor(() => expect(screen.getByTestId('access')).toHaveTextContent('premium'));
    await act(async () => finishOldLookup(freeInfo));
    expect(screen.getByTestId('access')).toHaveTextContent('premium');
    expect(access.customerInfo.entitlements.active.premium).toBeDefined();
  }
);

test('a new SDK update removing the entitlement still revokes Premium', async () => {
  jest.mocked(Purchases.getCustomerInfo).mockResolvedValue(paidInfo);
  const screen = mount();
  await waitFor(() => expect(screen.getByTestId('access')).toHaveTextContent('premium'));
  await act(async () => jest.mocked(Purchases.addCustomerInfoUpdateListener).mock.calls[0][0](freeInfo));
  await waitFor(() => expect(screen.getByTestId('access')).toHaveTextContent('free'));
});

test('an older Premium lookup cannot undo a newer SDK entitlement revocation', async () => {
  let finishOldLookup!: (info: CustomerInfo) => void;
  jest.mocked(Purchases.getCustomerInfo).mockImplementationOnce(() => new Promise(resolve => { finishOldLookup = resolve; }));
  const screen = mount();
  await waitFor(() => expect(Purchases.getCustomerInfo).toHaveBeenCalledTimes(1));
  await act(async () => jest.mocked(Purchases.addCustomerInfoUpdateListener).mock.calls[0][0](freeInfo));
  await act(async () => finishOldLookup(paidInfo));
  expect(screen.getByTestId('access')).toHaveTextContent('free');
  expect(access.customerInfo.entitlements.active.premium).toBeUndefined();
});
