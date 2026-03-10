import { useState, useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, ActivityIndicator, Alert, Linking, Animated } from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { X, Flower2, Check } from 'lucide-react-native';
import * as Haptics from 'expo-haptics';
import Colors from '@/constants/colors';
import { useRevenueCat } from '@/providers/RevenueCatProvider';
import { PurchasesPackage, PURCHASES_ERROR_CODE } from 'react-native-purchases';
import { t, TranslationKey } from '@/utils/i18n';
import { findMonthlyPackage, findYearlyPackage, formatPackagePrice } from '@/utils/paywallUtils';
import { scheduleTrialReminder } from '@/utils/notifications';

const PRIVACY_POLICY_URL = 'https://aniccaai.com/dailydharma/privacy';
const TERMS_URL = 'https://www.apple.com/legal/internet-services/itunes/dev/stdeula/';

type PaywallStep = 'risk-free' | 'transparency' | 'hard-close';

function StepDots({ current, colors }: { current: PaywallStep; colors: typeof Colors.light }) {
  const steps: PaywallStep[] = ['risk-free', 'transparency', 'hard-close'];
  return (
    <View style={stepDotStyles.container}>
      {steps.map((step) => (
        <View
          key={step}
          style={[
            stepDotStyles.dot,
            { backgroundColor: step === current ? colors.gold : colors.border },
          ]}
        />
      ))}
    </View>
  );
}

const stepDotStyles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 8,
    marginTop: 24,
  },
  dot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
});

const COMPARE_ROWS: Array<{ labelKey: TranslationKey; freeKey: TranslationKey; premiumKey: TranslationKey }> = [
  { labelKey: 'paywall.compare.verses.label', freeKey: 'paywall.compare.verses.free', premiumKey: 'paywall.compare.verses.premium' },
  { labelKey: 'paywall.compare.reminders.label', freeKey: 'paywall.compare.reminders.free', premiumKey: 'paywall.compare.reminders.premium' },
  { labelKey: 'paywall.compare.bookmarks.label', freeKey: 'paywall.compare.bookmarks.free', premiumKey: 'paywall.compare.bookmarks.premium' },
];

export default function PaywallScreen() {
  const router = useRouter();
  const { source } = useLocalSearchParams<{ source?: string }>();
  const isOnboarding = source === 'onboarding';
  const insets = useSafeAreaInsets();
  const colors = Colors.light;

  const initialStep: PaywallStep = isOnboarding ? 'risk-free' : 'hard-close';
  const [step, setStep] = useState<PaywallStep>(initialStep);
  const [selectedPlan, setSelectedPlan] = useState<'yearly' | 'monthly'>('yearly');
  const [showClose, setShowClose] = useState(!isOnboarding);

  useEffect(() => {
    if (step !== 'hard-close') return;
    if (!isOnboarding) {
      setShowClose(true);
      return;
    }
    const timer = setTimeout(() => setShowClose(true), 3000);
    return () => clearTimeout(timer);
  }, [step, isOnboarding]);

  const {
    currentOffering,
    isLoadingOfferings,
    purchasePackage,
    restorePurchases,
    isPurchasing,
    isRestoring,
  } = useRevenueCat();

  const monthlyPackage = findMonthlyPackage(currentOffering?.availablePackages ?? []);
  const yearlyPackage = findYearlyPackage(currentOffering?.availablePackages ?? []);

  const handlePurchase = async () => {
    const pkg = selectedPlan === 'yearly' ? yearlyPackage : monthlyPackage;
    if (!pkg) {
      Alert.alert(t('paywall.alert.error.title'), t('paywall.alert.error.unavailable'));
      return;
    }

    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);

    try {
      await purchasePackage(pkg);
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      scheduleTrialReminder().catch(() => {});
      router.replace('/');
    } catch (error: unknown) {
      const purchaseError = error as Error & { code?: string };
      if (purchaseError.code !== PURCHASES_ERROR_CODE.PURCHASE_CANCELLED_ERROR) {
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

  const handleSkip = () => {
    router.replace('/');
  };

  const handleNext = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    if (step === 'risk-free') {
      setStep('transparency');
    } else if (step === 'transparency') {
      setStep('hard-close');
    }
  };

  const formatPrice = (pkg: PurchasesPackage | undefined) => formatPackagePrice(pkg);
  const isLoading = isPurchasing || isRestoring;

  // Step 1: Risk-Free Primer
  if (step === 'risk-free') {
    return (
      <View style={[styles.container, { backgroundColor: colors.background }]}>
        <View style={[styles.header, { paddingTop: insets.top + 8 }]} />
        <View style={[styles.centeredContent, { paddingBottom: insets.bottom + 24 }]}>
          <View style={[styles.iconCircle, { backgroundColor: colors.backgroundSecondary }]}>
            <Text style={styles.emoji}>🌸</Text>
          </View>
          <Text style={[styles.title, { color: colors.text }]}>
            {t('paywall.step1.title')}
          </Text>
          <Text style={[styles.subtitle, { color: colors.textSecondary }]}>
            {t('paywall.step1.subtitle')}
          </Text>

          <View style={styles.ctaArea}>
            <TouchableOpacity
              testID="paywall_step1_cta"
              style={[styles.purchaseButton, { backgroundColor: colors.gold }]}
              onPress={handleNext}
              activeOpacity={0.8}
            >
              <Text style={styles.purchaseButtonText}>
                {t('paywall.ctaContinue')}
              </Text>
            </TouchableOpacity>
          </View>

          {isOnboarding && <StepDots current="risk-free" colors={colors} />}
        </View>
      </View>
    );
  }

  // Step 2: Transparency Promise
  if (step === 'transparency') {
    const timeline = [
      { icon: '✅', key: 'paywall.step2.timeline.today' as TranslationKey },
      { icon: '🔔', key: 'paywall.step2.timeline.day5' as TranslationKey },
      { icon: '💳', key: 'paywall.step2.timeline.day7' as TranslationKey },
    ];

    return (
      <View style={[styles.container, { backgroundColor: colors.background }]}>
        <View style={[styles.header, { paddingTop: insets.top + 8 }]} />
        <View style={[styles.centeredContent, { paddingBottom: insets.bottom + 24 }]}>
          <View style={[styles.iconCircle, { backgroundColor: colors.backgroundSecondary }]}>
            <Text style={styles.emoji}>📅</Text>
          </View>
          <Text style={[styles.title, { color: colors.text }]}>
            {t('paywall.step2.title')}
          </Text>

          <View style={styles.timelineSection}>
            {timeline.map((item, index) => (
              <View key={index} style={styles.timelineRow}>
                <Text style={styles.timelineIcon}>{item.icon}</Text>
                <Text style={[styles.timelineText, { color: colors.text }]}>
                  {t(item.key)}
                </Text>
              </View>
            ))}
          </View>

          <View style={styles.ctaArea}>
            <TouchableOpacity
              testID="paywall_step2_cta"
              style={[styles.purchaseButton, { backgroundColor: colors.gold }]}
              onPress={handleNext}
              activeOpacity={0.8}
            >
              <Text style={styles.purchaseButtonText}>
                {t('paywall.ctaGotIt')}
              </Text>
            </TouchableOpacity>
          </View>

          {isOnboarding && <StepDots current="transparency" colors={colors} />}
        </View>
      </View>
    );
  }

  // Step 3: Hard Close
  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <View style={[styles.header, { paddingTop: insets.top + 8 }]}>
        {showClose && (
          <TouchableOpacity
            style={[styles.closeButton, { backgroundColor: colors.backgroundSecondary }]}
            onPress={handleSkip}
            activeOpacity={0.7}
            disabled={isLoading}
          >
            <X size={20} color={colors.textSecondary} />
          </TouchableOpacity>
        )}
      </View>

      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={[styles.content, { paddingBottom: insets.bottom + 24 }]}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.heroSection}>
          <View style={[styles.iconCircle, { backgroundColor: colors.backgroundSecondary }]}>
            <Text style={styles.emoji}>🌸</Text>
          </View>
          <Text style={[styles.title, { color: colors.text }]}>
            {t('paywall.step3.title')}
          </Text>
          <Text style={[styles.socialProof, { color: colors.textSecondary }]}>
            {t('paywall.step3.socialProof')}
          </Text>
        </View>

        {/* Comparison Table */}
        <View style={[styles.compareTable, { borderColor: colors.border }]}>
          <View style={[styles.compareHeaderRow, { backgroundColor: colors.backgroundSecondary }]}>
            <Text style={[styles.compareHeaderLabel, { color: colors.textMuted }]} />
            <Text style={[styles.compareHeaderCell, { color: colors.textMuted }]}>
              {t('paywall.compare.header.free')}
            </Text>
            <Text style={[styles.compareHeaderCell, { color: colors.gold, fontWeight: '700' }]}>
              {t('paywall.compare.header.premium')}
            </Text>
          </View>
          {COMPARE_ROWS.map((row, index) => (
            <View
              key={index}
              style={[styles.compareRow, { borderTopColor: colors.border }]}
            >
              <Text style={[styles.compareLabel, { color: colors.text }]}>
                {t(row.labelKey)}
              </Text>
              <Text style={[styles.compareCell, { color: colors.textMuted }]}>
                {t(row.freeKey)}
              </Text>
              <Text style={[styles.compareCell, { color: colors.text, fontWeight: '600' }]}>
                {t(row.premiumKey)}
              </Text>
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
                  { borderColor: selectedPlan === 'monthly' ? colors.gold : colors.border },
                ]}
                onPress={() => handleSelectPlan('monthly')}
                activeOpacity={0.8}
              >
                <View style={styles.planOptionHeader}>
                  <Text style={[styles.planOptionTitle, { color: colors.text }]}>
                    {t('paywall.plan.monthly')}
                  </Text>
                  <View style={[
                    styles.radioCircle,
                    { borderColor: selectedPlan === 'monthly' ? colors.gold : colors.border },
                  ]}>
                    {selectedPlan === 'monthly' && (
                      <View style={[styles.radioSelected, { backgroundColor: colors.gold }]} />
                    )}
                  </View>
                </View>
                <Text style={[styles.planOptionPrice, { color: colors.text }]}>
                  {formatPrice(monthlyPackage)}
                  <Text style={[styles.planOptionPeriod, { color: colors.textMuted }]}>
                    {t('paywall.plan.perMonth')}
                  </Text>
                </Text>
              </TouchableOpacity>

              <TouchableOpacity
                testID="paywall_plan_yearly"
                style={[
                  styles.planOption,
                  selectedPlan === 'yearly' && styles.planOptionSelected,
                  { borderColor: selectedPlan === 'yearly' ? colors.gold : colors.border },
                ]}
                onPress={() => handleSelectPlan('yearly')}
                activeOpacity={0.8}
              >
                <View style={styles.planOptionHeader}>
                  <View>
                    <Text style={[styles.planOptionTitle, { color: colors.text }]}>
                      {t('paywall.plan.yearly')}
                    </Text>
                    <Text style={[styles.bestValueBadge, { color: colors.gold }]}>
                      {t('paywall.step3.bestValue')}
                    </Text>
                  </View>
                  <View style={[
                    styles.radioCircle,
                    { borderColor: selectedPlan === 'yearly' ? colors.gold : colors.border },
                  ]}>
                    {selectedPlan === 'yearly' && (
                      <View style={[styles.radioSelected, { backgroundColor: colors.gold }]} />
                    )}
                  </View>
                </View>
                <Text style={[styles.planOptionPrice, { color: colors.text }]}>
                  {formatPrice(yearlyPackage)}
                  <Text style={[styles.planOptionPeriod, { color: colors.textMuted }]}>
                    {t('paywall.plan.perYear')}
                  </Text>
                </Text>
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
                  {t('paywall.cta')}
                </Text>
              )}
            </TouchableOpacity>
          </>
        )}

        <TouchableOpacity testID="paywall_skip" style={styles.skipButton} onPress={handleSkip} disabled={isLoading}>
          <Text style={[styles.skipText, { color: colors.textMuted }]}>
            {t('paywall.free')}
          </Text>
        </TouchableOpacity>

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

        {isOnboarding && <StepDots current="hard-close" colors={colors} />}
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
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
  },
  scrollView: {
    flex: 1,
  },
  content: {
    paddingHorizontal: 24,
  },
  centeredContent: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 32,
  },
  heroSection: {
    alignItems: 'center',
    marginBottom: 24,
  },
  iconCircle: {
    width: 100,
    height: 100,
    borderRadius: 50,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 24,
  },
  emoji: {
    fontSize: 48,
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
    lineHeight: 24,
  },
  socialProof: {
    fontSize: 15,
    textAlign: 'center',
    lineHeight: 22,
    fontStyle: 'italic',
  },
  // Timeline (Step 2)
  timelineSection: {
    width: '100%',
    marginTop: 32,
    gap: 20,
  },
  timelineRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  timelineIcon: {
    fontSize: 24,
    width: 32,
    textAlign: 'center',
  },
  timelineText: {
    fontSize: 16,
    flex: 1,
    lineHeight: 22,
  },
  // Comparison Table (Step 3)
  compareTable: {
    borderWidth: 1,
    borderRadius: 12,
    overflow: 'hidden',
    marginBottom: 24,
  },
  compareHeaderRow: {
    flexDirection: 'row',
    paddingVertical: 10,
    paddingHorizontal: 12,
  },
  compareHeaderLabel: {
    flex: 1.2,
  },
  compareHeaderCell: {
    flex: 1,
    textAlign: 'center',
    fontSize: 13,
    fontWeight: '600' as const,
  },
  compareRow: {
    flexDirection: 'row',
    paddingVertical: 12,
    paddingHorizontal: 12,
    borderTopWidth: 1,
  },
  compareLabel: {
    flex: 1.2,
    fontSize: 14,
  },
  compareCell: {
    flex: 1,
    textAlign: 'center',
    fontSize: 14,
  },
  // CTA area
  ctaArea: {
    width: '100%',
    marginTop: 40,
  },
  // Pricing
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
  planOptionPeriod: {
    fontSize: 14,
    fontWeight: '400' as const,
  },
  bestValueBadge: {
    fontSize: 11,
    fontWeight: '700' as const,
    marginTop: 2,
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
  skipButton: {
    alignItems: 'center',
    paddingVertical: 16,
  },
  skipText: {
    fontSize: 16,
    fontWeight: '500' as const,
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
