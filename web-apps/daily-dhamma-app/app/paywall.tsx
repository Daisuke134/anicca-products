import { useEffect, useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, ActivityIndicator, Alert, Linking } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { X, Check, Flower2, Sparkles, Bell } from 'lucide-react-native';
import * as Haptics from 'expo-haptics';
import Colors from '@/constants/colors';
import { useRevenueCat } from '@/providers/RevenueCatProvider';
import { PurchasesPackage } from 'react-native-purchases';
import i18n, { t, TranslationKey } from '@/utils/i18n';
import {
  findMonthlyPackage,
  findYearlyPackage,
  formatPackagePrice,
  getFreeTrial,
  perMonthPriceString,
  savingsPercent,
  trackPaywallEvent,
} from '@/utils/paywallUtils';

const PRIVACY_POLICY_URL = 'https://aniccaai.com/dailydharma/privacy';
const TERMS_URL = 'https://www.apple.com/legal/internet-services/itunes/dev/stdeula/';
const CLOSE_DELAY_MS = 3000;

const featureKeys: Array<{ icon: React.ComponentType<{ size: number; color: string }>; titleKey: TranslationKey; descKey: TranslationKey }> = [
  { icon: Sparkles, titleKey: 'paywall.feature.verses.title', descKey: 'paywall.feature.verses.desc' },
  { icon: Bell,     titleKey: 'paywall.feature.reminders.title', descKey: 'paywall.feature.reminders.desc' },
  { icon: Flower2,  titleKey: 'paywall.feature.bookmark.title', descKey: 'paywall.feature.bookmark.desc' },
];

export default function PaywallScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const colors = Colors.light;
  const [selectedPlan, setSelectedPlan] = useState<'yearly' | 'monthly'>('yearly');
  const [showClose, setShowClose] = useState(false);
  // onboarding からはパラメータなしで来る。他の入口はすべて source を付ける
  const { source = 'onboarding' } = useLocalSearchParams<{ source?: string }>();

  const {
    currentOffering,
    isLoadingOfferings,
    purchasePackage,
    restorePurchases,
    isPurchasing,
    isRestoring
  } = useRevenueCat();

  const monthlyPackage = findMonthlyPackage(currentOffering?.availablePackages ?? []);
  const yearlyPackage = findYearlyPackage(currentOffering?.availablePackages ?? []);
  const trial = getFreeTrial(yearlyPackage);
  const savings = savingsPercent(monthlyPackage, yearlyPackage);
  // 月額を選んだらトライアル表記は出さない
  const activeTrial = selectedPlan === 'yearly' ? trial : null;

  useEffect(() => {
    trackPaywallEvent('paywall_shown', source);
    const timer = setTimeout(() => setShowClose(true), CLOSE_DELAY_MS);
    return () => clearTimeout(timer);
  }, [source]);

  const handlePurchase = async () => {
    const pkg = selectedPlan === 'yearly' ? yearlyPackage : monthlyPackage;
    if (!pkg) {
      Alert.alert(t('paywall.alert.error.title'), t('paywall.alert.error.unavailable'));
      return;
    }

    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);

    try {
      const customerInfo = await purchasePackage(pkg);
      const isTrial = customerInfo.entitlements.active['premium']?.periodType === 'TRIAL';
      trackPaywallEvent(isTrial ? 'trial_started' : 'purchase', source);
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      router.replace('/');
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : 'Purchase failed';
      if (!errorMessage.includes('cancelled') && !errorMessage.includes('PURCHASE_CANCELLED')) {
        Alert.alert(t('paywall.alert.purchaseFailed.title'), t('paywall.alert.purchaseFailed.msg'));
      }
    }
  };

  const handleSelectPlan = (plan: 'yearly' | 'monthly') => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setSelectedPlan(plan);
  };

  const handleRestore = async () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);

    try {
      const customerInfo = await restorePurchases();
      const hasAccess = typeof customerInfo?.entitlements?.active['premium'] !== 'undefined';
      if (hasAccess) {
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
        Alert.alert(t('paywall.alert.restoreSuccess.title'), t('paywall.alert.restoreSuccess.msg'));
        router.replace('/');
      } else {
        Alert.alert(t('paywall.alert.restoreNone.title'), t('paywall.alert.restoreNone.msg'));
      }
    } catch {
      Alert.alert(t('paywall.alert.restoreFailed.title'), t('paywall.alert.restoreFailed.msg'));
    }
  };

  const handleClose = () => {
    if (router.canGoBack()) router.back();
    else router.replace('/');
  };

  const formatPrice = (pkg: PurchasesPackage | undefined) => formatPackagePrice(pkg);

  const isLoading = isPurchasing || isRestoring;

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <View style={[styles.header, { paddingTop: insets.top + 8 }]}>
        {showClose ? (
          <TouchableOpacity
            testID="paywall_close"
            style={styles.closeButton}
            onPress={handleClose}
            activeOpacity={0.7}
            disabled={isLoading}
            hitSlop={12}
            accessibilityRole="button"
            accessibilityLabel={t('paywall.close')}
          >
            <X size={14} color={colors.textMuted} />
          </TouchableOpacity>
        ) : (
          <View style={styles.closeButton} />
        )}
      </View>

      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={[styles.content, { paddingBottom: insets.bottom + 24 }]}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.heroSection}>
          <View style={[styles.iconCircle, { backgroundColor: colors.backgroundSecondary }]}>
            <Flower2 size={48} color={colors.gold} strokeWidth={1.2} />
          </View>
          <Text style={[styles.title, { color: colors.text }]}>
            {t('paywall.title')}
          </Text>
          <Text style={[styles.subtitle, { color: colors.textSecondary }]}>
            {t('paywall.subtitle')}
          </Text>
        </View>

        <View style={styles.featuresSection}>
          {featureKeys.map((feature, index) => (
            <View
              key={index}
              style={[styles.featureRow, { borderBottomColor: colors.border }]}
            >
              <View style={[styles.featureIcon, { backgroundColor: colors.backgroundSecondary }]}>
                <feature.icon size={20} color={colors.gold} />
              </View>
              <View style={styles.featureText}>
                <Text style={[styles.featureTitle, { color: colors.text }]}>
                  {t(feature.titleKey)}
                </Text>
                <Text style={[styles.featureDescription, { color: colors.textMuted }]}>
                  {t(feature.descKey)}
                </Text>
              </View>
              <Check size={18} color={colors.accent} />
            </View>
          ))}
        </View>

        {isLoadingOfferings ? (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color={colors.gold} />
            <Text style={[styles.loadingText, { color: colors.textMuted }]}>
              {t('paywall.loading')}
            </Text>
          </View>
        ) : (
          <>
            <View style={styles.pricingSection}>
              <TouchableOpacity
                testID="paywall_plan_monthly"
                style={[
                  styles.planOption,
                  selectedPlan === 'monthly' && styles.planOptionSelected,
                  { borderColor: selectedPlan === 'monthly' ? colors.gold : colors.border }
                ]}
                onPress={() => handleSelectPlan('monthly')}
                activeOpacity={0.8}
              >
                <View style={styles.planOptionHeader}>
                  <Text style={[styles.planOptionTitle, { color: colors.text }]}>{t('paywall.plan.monthly')}</Text>
                  <View style={[
                    styles.radioCircle,
                    { borderColor: selectedPlan === 'monthly' ? colors.gold : colors.border }
                  ]}>
                    {selectedPlan === 'monthly' && (
                      <View style={[styles.radioSelected, { backgroundColor: colors.gold }]} />
                    )}
                  </View>
                </View>
                <Text style={[styles.planOptionPrice, { color: colors.text }]}>
                  {formatPrice(monthlyPackage)}
                  <Text style={[styles.planOptionPeriod, { color: colors.textMuted }]}>{t('paywall.plan.perMonth')}</Text>
                </Text>
              </TouchableOpacity>

              <TouchableOpacity
                testID="paywall_plan_yearly"
                style={[
                  styles.planOption,
                  selectedPlan === 'yearly' && styles.planOptionSelected,
                  { borderColor: selectedPlan === 'yearly' ? colors.gold : colors.border }
                ]}
                onPress={() => handleSelectPlan('yearly')}
                activeOpacity={0.8}
              >
                <View style={styles.badgeRow}>
                  <View style={[styles.badge, { backgroundColor: colors.gold }]}>
                    <Text style={styles.badgeText}>{t('paywall.badge.bestValue')}</Text>
                  </View>
                  {trial && (
                    <View style={[styles.badge, { backgroundColor: colors.accent }]}>
                      <Text style={styles.badgeText}>
                        {i18n.t(`paywall.trial.badge.${trial.unit}`, { count: trial.count })}
                      </Text>
                    </View>
                  )}
                </View>
                <View style={styles.planOptionHeader}>
                  <Text style={[styles.planOptionTitle, { color: colors.text }]}>{t('paywall.plan.yearly')}</Text>
                  <View style={[
                    styles.radioCircle,
                    { borderColor: selectedPlan === 'yearly' ? colors.gold : colors.border }
                  ]}>
                    {selectedPlan === 'yearly' && (
                      <View style={[styles.radioSelected, { backgroundColor: colors.gold }]} />
                    )}
                  </View>
                </View>
                <Text style={[styles.planOptionPrice, { color: colors.text }]}>
                  {formatPrice(yearlyPackage)}
                  <Text style={[styles.planOptionPeriod, { color: colors.textMuted }]}>{t('paywall.plan.perYear')}</Text>
                </Text>
                {yearlyPackage && (
                  <Text style={[styles.planOptionSub, { color: colors.textSecondary }]}>
                    {perMonthPriceString(yearlyPackage)}{t('paywall.plan.perMonth')}
                  </Text>
                )}
                {savings !== null && (
                  <Text style={[styles.planOptionSub, { color: colors.gold }]}>
                    {i18n.t('paywall.plan.savings', { percent: savings })}
                  </Text>
                )}
              </TouchableOpacity>
            </View>

            <TouchableOpacity
              testID="paywall_cta"
              style={[styles.purchaseButton, { backgroundColor: colors.gold }]}
              onPress={handlePurchase}
              activeOpacity={0.8}
              disabled={isLoading}
            >
              {isPurchasing ? (
                <ActivityIndicator size="small" color={Colors.light.background} />
              ) : (
                <Text style={styles.purchaseButtonText}>
                  {activeTrial
                    ? i18n.t(`paywall.trial.cta.${activeTrial.unit}`, { count: activeTrial.count })
                    : t('paywall.cta')}
                </Text>
              )}
            </TouchableOpacity>

            {activeTrial && (
              <Text testID="paywall_trial_terms" style={[styles.trialText, { color: colors.textSecondary }]}>
                {i18n.t(`paywall.trial.after.${activeTrial.unit}`, {
                  count: activeTrial.count,
                  price: formatPrice(yearlyPackage),
                })}
              </Text>
            )}
          </>
        )}

        <TouchableOpacity
          testID="paywall_restore"
          style={styles.restoreButton}
          onPress={handleRestore}
          disabled={isLoading}
        >
          <Text style={[styles.restoreText, { color: colors.textSecondary }]}>
            {isRestoring ? t('paywall.restoring') : t('paywall.restore')}
          </Text>
        </TouchableOpacity>

        <Text style={[styles.termsText, { color: colors.textMuted }]}>
          {t('paywall.terms')}
        </Text>

        <View style={styles.legalLinks}>
          <TouchableOpacity onPress={() => Linking.openURL(TERMS_URL)}>
            <Text style={[styles.legalLinkText, { color: colors.textMuted }]}>
              {t('paywall.termsOfUse')}
            </Text>
          </TouchableOpacity>
          <Text style={[styles.legalSeparator, { color: colors.textMuted }]}> • </Text>
          <TouchableOpacity onPress={() => Linking.openURL(PRIVACY_POLICY_URL)}>
            <Text style={[styles.legalLinkText, { color: colors.textMuted }]}>
              {t('paywall.privacyPolicy')}
            </Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    paddingHorizontal: 20,
    paddingBottom: 8,
  },
  closeButton: {
    width: 24,
    height: 24,
    alignItems: 'center',
    justifyContent: 'center',
    opacity: 0.6,
  },
  scrollView: {
    flex: 1,
  },
  content: {
    paddingHorizontal: 24,
  },
  heroSection: {
    alignItems: 'center',
    marginBottom: 32,
  },
  iconCircle: {
    width: 100,
    height: 100,
    borderRadius: 50,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 24,
  },
  title: {
    fontSize: 34,
    fontWeight: '300' as const,
    textAlign: 'center',
    lineHeight: 42,
    marginBottom: 12,
  },
  subtitle: {
    fontSize: 17,
    textAlign: 'center',
  },
  featuresSection: {
    marginBottom: 32,
  },
  featureRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 16,
    borderBottomWidth: 1,
    gap: 14,
  },
  featureIcon: {
    width: 40,
    height: 40,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  featureText: {
    flex: 1,
  },
  featureTitle: {
    fontSize: 16,
    fontWeight: '500' as const,
    marginBottom: 2,
  },
  featureDescription: {
    fontSize: 14,
  },
  loadingContainer: {
    alignItems: 'center',
    paddingVertical: 40,
    gap: 12,
  },
  loadingText: {
    fontSize: 15,
  },
  pricingSection: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 16,
  },
  planOption: {
    flex: 1,
    padding: 16,
    borderRadius: 12,
    borderWidth: 2,
    backgroundColor: Colors.light.card,
  },
  planOptionSelected: {
    backgroundColor: Colors.light.backgroundSecondary,
  },
  planOptionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  planOptionTitle: {
    fontSize: 16,
    fontWeight: '600' as const,
  },
  planOptionPrice: {
    fontSize: 20,
    fontWeight: '700' as const,
  },
  planOptionSub: {
    fontSize: 13,
    marginTop: 4,
  },
  badgeRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 4,
    marginBottom: 8,
  },
  badge: {
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 6,
  },
  badgeText: {
    fontSize: 10,
    fontWeight: '700' as const,
    color: Colors.light.background,
  },
  planOptionPeriod: {
    fontSize: 14,
    fontWeight: '400' as const,
  },
  radioCircle: {
    width: 22,
    height: 22,
    borderRadius: 11,
    borderWidth: 2,
    alignItems: 'center',
    justifyContent: 'center',
  },
  radioSelected: {
    width: 12,
    height: 12,
    borderRadius: 6,
  },
  purchaseButton: {
    paddingVertical: 16,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
  },
  purchaseButtonText: {
    fontSize: 17,
    fontWeight: '600' as const,
    color: Colors.light.background,
  },
  trialText: {
    fontSize: 13,
    textAlign: 'center',
    marginBottom: 16,
  },
  restoreButton: {
    alignItems: 'center',
    paddingVertical: 8,
  },
  restoreText: {
    fontSize: 14,
    textDecorationLine: 'underline',
  },
  termsText: {
    fontSize: 13,
    textAlign: 'center',
    marginTop: 8,
  },
  legalLinks: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 12,
    marginBottom: 8,
  },
  legalLinkText: {
    fontSize: 12,
    textDecorationLine: 'underline',
  },
  legalSeparator: {
    fontSize: 12,
  },
});
