import { useQuery } from '@tanstack/react-query';
import Purchases, { CustomerInfo } from 'react-native-purchases';

/** ペイウォールを開くたびに現在の顧客・商品の資格を確認する。未確認中は無料表示をしない。 */
export function useTrialEligibility(
  productId: string | undefined,
  isConfigured: boolean,
  customerInfo: CustomerInfo | null
) {
  const enabled = isConfigured && !!productId && !!customerInfo;
  const query = useQuery({
    queryKey: ['trial-eligibility', productId, customerInfo?.originalAppUserId, customerInfo?.requestDate],
    queryFn: async () => {
      if (!productId) return null;
      const eligibility = await Purchases.checkTrialOrIntroductoryPriceEligibility([productId]);
      return eligibility[productId]?.status ?? null;
    },
    enabled,
    staleTime: 0,
    retry: false,
  });

  return !enabled || query.isFetching || query.isError ? undefined : query.data ?? undefined;
}
