import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  ActivityIndicator,
  Alert,
  Linking,
  Animated,
} from 'react-native';
import { useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { X, Check, Flower2, Calendar, Bell, CreditCard } from 'lucide-react-native';
import * as Haptics from 'expo-haptics';
import Colors from '@/constants/colors';
import { useRevenueCat } from '@/providers/RevenueCatProvider';
import { useApp } from '@/providers/AppProvider';
import { PurchasesPackage } from 'react-native-purchases';
import { t, TranslationKey } from '@/utils/i18n';
import { findMonthlyPackage, findYearlyPackage, formatPackagePrice } from '@/utils/paywallUtils';
import { getPaywallTitle } from '@/providers/onboardingAnswers';
import { scheduleTrialReminder } from '@/utils/notifications';

const PRIVACY_POLICY_URL = 'https://aniccaai.com/dailydharma/privacy';
const TERMS_URL = 'https://www.apple.com/legal/internet-services/itunes/dev/stdeula/';

type PaywallStep = 'risk-free' | 'transparency' | 'hard-close';
const PAYWALL_STEPS: PaywallStep[] = ['risk-free', 'transparency', 'hard-close'];

export default function PaywallScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const colors = Colors.light;
  const { onboardingAnswers } = useApp();
  const [currentStep, setCurrentStep] = useState<PaywallStep>('risk-free');
  const [selectedPlan, setSelectedPlan] = useState<'yearly' | 'monthly'>('yearly');
  const [showClose, setShowClose] = useState(false);

  // Animations
  const fadeAnim = useRef(new Animated.Value(1)).current;
  const slideAnim = useRef(new Animated.Value(0)).current;

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

  // X button 3-second delay (only on hard-close step)
  useEffect(() => {
    if (currentStep === 'hard-close') {
      const timer = setTimeout(() => setShowClose(true), 3000);
      return () => clearTimeout(timer);
    }
    setShowClose(false);
  }, [currentStep]);

  const animateTransition = (callback: () => void) => {
    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 0,
        duration: 150,
        useNativeDriver: true,
      }),
      Animated.timing(slideAnim, {
        toValue: -30,
        duration: 150,
        useNativeDriver: true,
      }),
    ]).start(() => {
      callback();
      slideAnim.setValue(30);
      Animated.parallel([
        Animated.timing(fadeAnim, {
          toValue: 1,
          duration: 200,
          useNativeDriver: true,
        }),
        Animated.timing(slideAnim, {
          toValue: 0,
          duration: 200,
          useNativeDriver: true,
        }),
      ]).start();
    });
  };

  const goToNextStep = () => {
    const currentIndex = PAYWALL_STEPS.indexOf(currentStep);
    if (currentIndex < PAYWALL_STEPS.length - 1) {
      animateTransition(() => {
        setCurrentStep(PAYWALL_STEPS[currentIndex + 1]);
      });
    }
  };

  const handlePurchase = async () => {
    const pkg = selectedPlan === 'yearly' ? yearlyPackage : monthlyPackage;
    if (!pkg) {
      Alert.alert(t('paywall.alert.error.title'), t('paywall.alert.error.unavailable'));
      return;
    }

    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);

    try {
      await purchasePackage(pkg);
      // Schedule trial reminder for Day 5
      await scheduleTrialReminder();
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

  const handleSkip = () => {
    router.replace('/');
  };

  const formatPrice = (pkg: PurchasesPackage | undefined) => formatPackagePrice(pkg);

  const isLoading = isPurchasing || isRestoring;

  // Calculate yearly savings percentage
  const getSavePercent = (): number => {
    if (!monthlyPackage || !yearlyPackage) return 0;
    const monthlyAnnual = monthlyPackage.product.price * 12;
    const yearlyPrice = yearlyPackage.product.price;
    if (monthlyAnnual <= 0) return 0;
    return Math.round(((monthlyAnnual - yearlyPrice) / monthlyAnnual) * 100);
  };

  // Step indicator dots
  const renderStepDots = () => (
    <View style={styles.stepDotsContainer}>
      {PAYWALL_STEPS.map((step, index) => (
        <View
          key={step}
          style={[
            styles.stepDot,
            currentStep === step ? styles.stepDotActive : styles.stepDotInactive,
          ]}
        />
      ))}
    </View>
  );

  // Personalized title
  const titleKey = getPaywallTitle(onboardingAnswers.goal) as TranslationKey;

  // Step 1: Risk-Free Primer
  const renderRiskFree = () => (
    <View style={styles.stepContainer}>
      <View style={styles.heroSection}>
        <View style={[styles.iconCircle, { backgroundColor: colors.backgroundSecondary }]}>
          <Flower2 size={48} color={colors.gold} strokeWidth={1.2} />
        </View>
        <Text style={[styles.stepTitle, { color: colors.text }]}>
          {t('paywall.step1.title')}
        </Text>
        <Text style={[styles.stepSubtitle, { color: colors.textSecondary }]}>
          {t('paywall.step1.subtitle')}
        </Text>
      </View>

      <TouchableOpacity
        testID="paywall_step1_cta"
        style={[styles.ctaButton, { backgroundColor: colors.text }]}
        onPress={goToNextStep}
        activeOpacity={0.8}
      >
        <Text style={[styles.ctaButtonText, { color: colors.background }]}>
          {t('paywall.step1.cta')}
        </Text>
      </TouchableOpacity>

      {renderStepDots()}
    </View>
  );

  // Step 2: Transparency Promise
  const renderTransparency = () => (
    <View style={styles.stepContainer}>
      <View style={styles.heroSection}>
        <View style={[styles.iconCircle, { backgroundColor: colors.backgroundSecondary }]}>
          <Calendar size={48} color={colors.gold} strokeWidth={1.2} />
        </View>
        <Text style={[styles.stepTitle, { color: colors.text }]}>
          {t('paywall.step2.title')}
        </Text>
      </View>

      <View style={styles.timelineContainer}>
        <View style={styles.timelineItem}>
          <View style={[styles.timelineIcon, { backgroundColor: colors.accent }]}>
            <Check size={16} color={colors.background} />
          </View>
          <Text style={[styles.timelineText, { color: colors.text }]}>
            {t('paywall.step2.timeline.day1')}
          </Text>
        </View>
        <View style={[styles.timelineLine, { backgroundColor: colors.border }]} />
        <View style={styles.timelineItem}>
          <View style={[styles.timelineIcon, { backgroundColor: colors.gold }]}>
            <Bell size={16} color={colors.background} />
          </View>
          <Text style={[styles.timelineText, { color: colors.text }]}>
            {t('paywall.step2.timeline.day5')}
          </Text>
        </View>
        <View style={[styles.timelineLine, { backgroundColor: colors.border }]} />
        <View style={styles.timelineItem}>
          <View style={[styles.timelineIcon, { backgroundColor: colors.textMuted }]}>
            <CreditCard size={16} color={colors.background} />
          </View>
          <Text style={[styles.timelineText, { color: colors.text }]}>
            {t('paywall.step2.timeline.day7')}
          </Text>
        </View>
      </View>

      <TouchableOpacity
        testID="paywall_step2_cta"
        style={[styles.ctaButton, { backgroundColor: colors.text }]}
        onPress={goToNextStep}
        activeOpacity={0.8}
      >
        <Text style={[styles.ctaButtonText, { color: colors.background }]}>
          {t('paywall.step2.cta')}
        </Text>
      </TouchableOpacity>

      {renderStepDots()}
    </View>
  );

  // Step 3: Hard Close
  const renderHardClose = () => {
    const savePercent = getSavePercent();

    return (
      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={[styles.hardCloseContent, { paddingBottom: insets.bottom + 24 }]}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.heroSection}>
          <View style={[styles.iconCircle, { backgroundColor: colors.backgroundSecondary }]}>
            <Flower2 size={48} color={colors.gold} strokeWidth={1.2} />
          </View>
          <Text style={[styles.stepTitle, { color: colors.text }]}>
            {t(titleKey)}
          </Text>
          <Text style={[styles.socialProofText, { color: colors.textSecondary }]}>
            {t('paywall.socialProof')}
          </Text>
        </View>

        {/* Free vs Premium comparison */}
        <View style={[styles.compareTable, { borderColor: colors.border }]}>
          <View style={[styles.compareHeader, { borderBottomColor: colors.border }]}>
            <View style={styles.compareHeaderCell} />
            <Text style={[styles.compareHeaderLabel, { color: colors.textMuted }]}>
              {t('paywall.compare.free')}
            </Text>
            <Text style={[styles.compareHeaderLabel, styles.compareHeaderPremium, { color: colors.gold }]}>
              {t('paywall.compare.premium')}
            </Text>
          </View>
          {/* Verses */}
          <View style={[styles.compareRow, { borderBottomColor: colors.border }]}>
            <Text style={[styles.compareRowLabel, { color: colors.text }]}>📜</Text>
            <Text style={[styles.compareRowValue, { color: colors.textMuted }]}>
              {t('paywall.compare.verses.free')}
            </Text>
            <Text style={[styles.compareRowValue, styles.compareRowPremium, { color: colors.text }]}>
              {t('paywall.compare.verses.premium')}
            </Text>
          </View>
          {/* Reminders */}
          <View style={[styles.compareRow, { borderBottomColor: colors.border }]}>
            <Text style={[styles.compareRowLabel, { color: colors.text }]}>🔔</Text>
            <Text style={[styles.compareRowValue, { color: colors.textMuted }]}>
              {t('paywall.compare.reminders.free')}
            </Text>
            <Text style={[styles.compareRowValue, styles.compareRowPremium, { color: colors.text }]}>
              {t('paywall.compare.reminders.premium')}
            </Text>
          </View>
          {/* Bookmarks */}
          <View style={styles.compareRow}>
            <Text style={[styles.compareRowLabel, { color: colors.text }]}>🔖</Text>
            <Text style={[styles.compareRowValue, { color: colors.textMuted }]}>
              {t('paywall.compare.bookmark.free')}
            </Text>
            <Text style={[styles.compareRowValue, styles.compareRowPremium, { color: colors.text }]}>
              {t('paywall.compare.bookmark.premium')}
            </Text>
          </View>
        </View>

        {/* Plan cards */}
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
              {/* Monthly */}
              <TouchableOpacity
                testID="paywall_plan_monthly"
                style={[
                  styles.planCard,
                  selectedPlan === 'monthly' && styles.planCardSelected,
                  { borderColor: selectedPlan === 'monthly' ? colors.gold : colors.border },
                ]}
                onPress={() => handleSelectPlan('monthly')}
                activeOpacity={0.8}
              >
                <View style={styles.planCardHeader}>
                  <Text style={[styles.planCardTitle, { color: colors.text }]}>
                    {t('paywall.plan.monthly')}
                  </Text>
                  <View
                    style={[
                      styles.radioCircle,
                      { borderColor: selectedPlan === 'monthly' ? colors.gold : colors.border },
                    ]}
                  >
                    {selectedPlan === 'monthly' && (
                      <View style={[styles.radioSelected, { backgroundColor: colors.gold }]} />
                    )}
                  </View>
                </View>
                <Text style={[styles.planCardPrice, { color: colors.text }]}>
                  {formatPrice(monthlyPackage)}
                  <Text style={[styles.planCardPeriod, { color: colors.textMuted }]}>
                    {t('paywall.plan.perMonth')}
                  </Text>
                </Text>
              </TouchableOpacity>

              {/* Yearly */}
              <TouchableOpacity
                testID="paywall_plan_yearly"
                style={[
                  styles.planCard,
                  selectedPlan === 'yearly' && styles.planCardSelected,
                  {
                    borderColor: selectedPlan === 'yearly' ? colors.gold : colors.border,
                    borderWidth: selectedPlan === 'yearly' ? 3 : 2,
                  },
                ]}
                onPress={() => handleSelectPlan('yearly')}
                activeOpacity={0.8}
              >
                <View style={styles.planCardHeader}>
                  <View style={styles.planCardTitleRow}>
                    <Text style={[styles.planCardTitle, { color: colors.text }]}>
                      {t('paywall.plan.yearly')}
                    </Text>
                    <View style={[styles.bestValueBadge, { backgroundColor: colors.gold }]}>
                      <Text style={styles.bestValueText}>
                        {t('paywall.plan.bestValue')}
                      </Text>
                    </View>
                  </View>
                  <View
                    style={[
                      styles.radioCircle,
                      { borderColor: selectedPlan === 'yearly' ? colors.gold : colors.border },
                    ]}
                  >
                    {selectedPlan === 'yearly' && (
                      <View style={[styles.radioSelected, { backgroundColor: colors.gold }]} />
                    )}
                  </View>
                </View>
                <Text style={[styles.planCardPrice, { color: colors.text }]}>
                  {formatPrice(yearlyPackage)}
                  <Text style={[styles.planCardPeriod, { color: colors.textMuted }]}>
                    {t('paywall.plan.perYear')}
                  </Text>
                </Text>
                {savePercent > 0 && (
                  <Text style={[styles.saveText, { color: colors.accent }]}>
                    {t('paywall.plan.savePercent').replace('{percent}', String(savePercent))}
                  </Text>
                )}
              </TouchableOpacity>
            </View>

            {/* CTA */}
            <TouchableOpacity
              testID="paywall_cta"
              style={[styles.purchaseButton, { backgroundColor: colors.gold }]}
              onPress={handlePurchase}
              activeOpacity={0.8}
              disabled={isLoading}
            >
              {isPurchasing ? (
                <ActivityIndicator size="small" color={colors.background} />
              ) : (
                <Text style={styles.purchaseButtonText}>
                  {t('paywall.cta')}
                </Text>
              )}
            </TouchableOpacity>
          </>
        )}

        {/* Maybe later */}
        <TouchableOpacity
          testID="paywall_skip"
          style={styles.skipButton}
          onPress={handleSkip}
          disabled={isLoading}
        >
          <Text style={[styles.skipText, { color: colors.textMuted }]}>
            {t('paywall.free')}
          </Text>
        </TouchableOpacity>

        {/* Restore + Legal */}
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

        {renderStepDots()}
      </ScrollView>
    );
  };

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      {/* Header: X button only on hard-close, 3s delay */}
      <View style={[styles.header, { paddingTop: insets.top + 8 }]}>
        {showClose && currentStep === 'hard-close' ? (
          <TouchableOpacity
            testID="paywall_close"
            style={[styles.closeButton, { backgroundColor: colors.backgroundSecondary }]}
            onPress={handleSkip}
            activeOpacity={0.7}
            disabled={isLoading}
          >
            <X size={20} color={colors.textSecondary} />
          </TouchableOpacity>
        ) : (
          <View style={styles.closeButtonPlaceholder} />
        )}
      </View>

      {/* Animated content */}
      <Animated.View
        style={[
          styles.animatedContent,
          {
            opacity: fadeAnim,
            transform: [{ translateX: slideAnim }],
          },
        ]}
      >
        {currentStep === 'risk-free' && renderRiskFree()}
        {currentStep === 'transparency' && renderTransparency()}
        {currentStep === 'hard-close' && renderHardClose()}
      </Animated.View>
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
  closeButtonPlaceholder: {
    width: 36,
    height: 36,
  },
  animatedContent: {
    flex: 1,
  },
  scrollView: {
    flex: 1,
  },
  stepContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
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
  stepTitle: {
    fontSize: 30,
    fontWeight: '300',
    textAlign: 'center',
    lineHeight: 40,
    marginBottom: 12,
  },
  stepSubtitle: {
    fontSize: 17,
    textAlign: 'center',
    lineHeight: 26,
    paddingHorizontal: 16,
  },
  socialProofText: {
    fontSize: 16,
    textAlign: 'center',
    lineHeight: 24,
  },
  // Timeline
  timelineContainer: {
    width: '100%',
    paddingHorizontal: 24,
    marginBottom: 40,
  },
  timelineItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
    paddingVertical: 4,
  },
  timelineIcon: {
    width: 32,
    height: 32,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  timelineText: {
    fontSize: 16,
    fontWeight: '500',
    flex: 1,
  },
  timelineLine: {
    width: 2,
    height: 20,
    marginLeft: 15,
    marginVertical: 2,
  },
  // Step dots
  stepDotsContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    gap: 8,
    marginTop: 24,
    marginBottom: 16,
  },
  stepDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  stepDotActive: {
    backgroundColor: Colors.light.gold,
    width: 20,
    borderRadius: 4,
  },
  stepDotInactive: {
    backgroundColor: Colors.light.border,
  },
  // CTA
  ctaButton: {
    width: '100%',
    paddingVertical: 18,
    borderRadius: 16,
    alignItems: 'center',
  },
  ctaButtonText: {
    fontSize: 17,
    fontWeight: '600',
  },
  // Hard Close
  hardCloseContent: {
    paddingHorizontal: 24,
  },
  // Compare table
  compareTable: {
    borderWidth: 1,
    borderRadius: 12,
    marginBottom: 24,
    overflow: 'hidden',
  },
  compareHeader: {
    flexDirection: 'row',
    borderBottomWidth: 1,
    paddingVertical: 12,
    paddingHorizontal: 12,
  },
  compareHeaderCell: {
    flex: 1,
  },
  compareHeaderLabel: {
    flex: 1,
    fontSize: 14,
    fontWeight: '600',
    textAlign: 'center',
  },
  compareHeaderPremium: {
    fontWeight: '700',
  },
  compareRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 14,
    paddingHorizontal: 12,
    borderBottomWidth: 1,
  },
  compareRowLabel: {
    flex: 1,
    fontSize: 20,
  },
  compareRowValue: {
    flex: 1,
    fontSize: 14,
    textAlign: 'center',
  },
  compareRowPremium: {
    fontWeight: '600',
  },
  // Pricing
  pricingSection: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 16,
  },
  planCard: {
    flex: 1,
    padding: 16,
    borderRadius: 12,
    borderWidth: 2,
    backgroundColor: Colors.light.card,
  },
  planCardSelected: {
    backgroundColor: Colors.light.backgroundSecondary,
  },
  planCardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  planCardTitleRow: {
    flexDirection: 'column',
    gap: 4,
  },
  planCardTitle: {
    fontSize: 16,
    fontWeight: '600',
  },
  bestValueBadge: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
    alignSelf: 'flex-start',
  },
  bestValueText: {
    color: Colors.light.background,
    fontSize: 10,
    fontWeight: '800',
    letterSpacing: 0.5,
  },
  planCardPrice: {
    fontSize: 20,
    fontWeight: '700',
  },
  planCardPeriod: {
    fontSize: 14,
    fontWeight: '400',
  },
  saveText: {
    fontSize: 13,
    fontWeight: '600',
    marginTop: 4,
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
    fontWeight: '600',
    color: Colors.light.background,
  },
  loadingContainer: {
    alignItems: 'center',
    paddingVertical: 40,
    gap: 12,
  },
  loadingText: {
    fontSize: 15,
  },
  skipButton: {
    alignItems: 'center',
    paddingVertical: 16,
  },
  skipText: {
    fontSize: 16,
    fontWeight: '500',
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
