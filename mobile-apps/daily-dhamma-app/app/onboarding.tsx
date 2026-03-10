import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Platform,
  Animated,
} from 'react-native';
import { useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import * as Notifications from 'expo-notifications';
import * as Haptics from 'expo-haptics';
import Colors from '@/constants/colors';
import { useApp, OnboardingGoal, OnboardingTime } from '@/providers/AppProvider';
import { t, TranslationKey } from '@/utils/i18n';

const TOTAL_SLIDES = 7;

type SlideType = 'info' | 'question' | 'building' | 'result' | 'notification';

interface QuestionOption {
  key: string;
  emoji: string;
  labelKey: TranslationKey;
  subKey?: TranslationKey;
}

export default function OnboardingScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { completeOnboarding, updateSettings } = useApp();
  const [currentSlide, setCurrentSlide] = useState(0);
  const [goal, setGoal] = useState<OnboardingGoal | null>(null);
  const [time, setTime] = useState<OnboardingTime | null>(null);

  // Building plan animation
  const [buildItems, setBuildItems] = useState<boolean[]>([false, false, false]);
  const buildTimersRef = useRef<ReturnType<typeof setTimeout>[]>([]);

  // Slide transition animation
  const slideAnim = useRef(new Animated.Value(0)).current;
  const fadeAnim = useRef(new Animated.Value(1)).current;

  const progressWidth = 0.2 + 0.8 * (currentSlide / (TOTAL_SLIDES - 1));

  const animateToSlide = (nextSlide: number) => {
    Animated.timing(fadeAnim, {
      toValue: 0,
      duration: 150,
      useNativeDriver: true,
    }).start(() => {
      setCurrentSlide(nextSlide);
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 300,
        useNativeDriver: true,
      }).start();
    });
  };

  const handleNext = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    if (currentSlide < TOTAL_SLIDES - 1) {
      animateToSlide(currentSlide + 1);
    }
  };

  const handleSkip = () => {
    completeOnboarding();
    if (goal) updateSettings({ onboardingGoal: goal });
    if (time) updateSettings({ onboardingTime: time });
    router.replace('/');
  };

  const handleGoalSelect = (selected: OnboardingGoal) => {
    setGoal(selected);
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setTimeout(() => animateToSlide(currentSlide + 1), 300);
  };

  const handleTimeSelect = (selected: OnboardingTime) => {
    setTime(selected);
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setTimeout(() => animateToSlide(currentSlide + 1), 300);
  };

  const handleNotificationEnable = async () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    if (Platform.OS !== 'web') {
      await Notifications.requestPermissionsAsync();
    }
    finishOnboarding();
  };

  const handleNotificationSkip = () => {
    finishOnboarding();
  };

  const finishOnboarding = () => {
    completeOnboarding();
    if (goal) updateSettings({ onboardingGoal: goal });
    if (time) updateSettings({ onboardingTime: time });
    router.replace('/paywall?source=onboarding');
  };

  // Building plan: auto-advance after animation
  useEffect(() => {
    if (currentSlide === 4) {
      setBuildItems([false, false, false]);
      const t1 = setTimeout(() => setBuildItems(prev => [true, prev[1], prev[2]]), 500);
      const t2 = setTimeout(() => setBuildItems(prev => [prev[0], true, prev[2]]), 1000);
      const t3 = setTimeout(() => setBuildItems(prev => [prev[0], prev[1], true]), 1500);
      const t4 = setTimeout(() => animateToSlide(5), 2500);
      buildTimersRef.current = [t1, t2, t3, t4];
      return () => buildTimersRef.current.forEach(clearTimeout);
    }
  }, [currentSlide]);

  // --- Slide renderers ---

  const renderSlide1Hook = () => (
    <View style={styles.slideContent}>
      <Text style={styles.emoji}>🌸</Text>
      <Text style={styles.title}>{t('onboarding.slide1.title')}</Text>
      <Text style={styles.subtitle}>{t('onboarding.slide1.subtitle')}</Text>
      <View style={styles.ctaContainer}>
        <TouchableOpacity style={styles.ctaButton} onPress={handleNext} activeOpacity={0.8}>
          <Text style={styles.ctaText}>{t('onboarding.continue')}</Text>
        </TouchableOpacity>
      </View>
    </View>
  );

  const renderSlide2Question = () => {
    const options: QuestionOption[] = [
      { key: 'peace', emoji: '🧘', labelKey: 'onboarding.slide2.option.peace' },
      { key: 'wisdom', emoji: '📚', labelKey: 'onboarding.slide2.option.wisdom' },
      { key: 'routine', emoji: '🌅', labelKey: 'onboarding.slide2.option.routine' },
      { key: 'mindfulness', emoji: '💭', labelKey: 'onboarding.slide2.option.mindfulness' },
    ];
    return (
      <View style={styles.slideContent}>
        <Text style={styles.title}>{t('onboarding.slide2.title')}</Text>
        <View style={styles.optionsContainer}>
          {options.map(opt => (
            <TouchableOpacity
              key={opt.key}
              style={[styles.optionCard, goal === opt.key && styles.optionCardSelected]}
              onPress={() => handleGoalSelect(opt.key as OnboardingGoal)}
              activeOpacity={0.7}
            >
              <Text style={styles.optionEmoji}>{opt.emoji}</Text>
              <Text style={[styles.optionLabel, goal === opt.key && styles.optionLabelSelected]}>
                {t(opt.labelKey)}
              </Text>
            </TouchableOpacity>
          ))}
        </View>
      </View>
    );
  };

  const renderSlide3Value = () => (
    <View style={styles.slideContent}>
      <Text style={styles.title}>{t('onboarding.slide3.title')}</Text>
      <View style={styles.statsContainer}>
        {[
          { emoji: '📖', key: 'onboarding.slide3.stat1' as TranslationKey },
          { emoji: '🌍', key: 'onboarding.slide3.stat2' as TranslationKey },
          { emoji: '🧘', key: 'onboarding.slide3.stat3' as TranslationKey },
        ].map((stat, i) => (
          <View key={i} style={styles.statRow}>
            <Text style={styles.statEmoji}>{stat.emoji}</Text>
            <Text style={styles.statText}>{t(stat.key)}</Text>
          </View>
        ))}
      </View>
      <View style={styles.ctaContainer}>
        <TouchableOpacity style={styles.ctaButton} onPress={handleNext} activeOpacity={0.8}>
          <Text style={styles.ctaText}>{t('onboarding.continue')}</Text>
        </TouchableOpacity>
      </View>
    </View>
  );

  const renderSlide4Time = () => {
    const options: { key: OnboardingTime; emoji: string; labelKey: TranslationKey; rec?: boolean }[] = [
      { key: 'morning', emoji: '🌅', labelKey: 'onboarding.slide4.option.morning', rec: true },
      { key: 'midday', emoji: '☀️', labelKey: 'onboarding.slide4.option.midday' },
      { key: 'evening', emoji: '🌙', labelKey: 'onboarding.slide4.option.evening' },
    ];
    return (
      <View style={styles.slideContent}>
        <Text style={styles.title}>{t('onboarding.slide4.title')}</Text>
        <View style={styles.optionsContainer}>
          {options.map(opt => (
            <TouchableOpacity
              key={opt.key}
              style={[styles.optionCard, time === opt.key && styles.optionCardSelected]}
              onPress={() => handleTimeSelect(opt.key)}
              activeOpacity={0.7}
            >
              <Text style={styles.optionEmoji}>{opt.emoji}</Text>
              <View style={styles.optionLabelRow}>
                <Text style={[styles.optionLabel, time === opt.key && styles.optionLabelSelected]}>
                  {t(opt.labelKey)}
                </Text>
                {opt.rec && (
                  <Text style={styles.recBadge}>{t('onboarding.slide4.option.morningRec')}</Text>
                )}
              </View>
            </TouchableOpacity>
          ))}
        </View>
      </View>
    );
  };

  const renderSlide5Building = () => {
    const items: { key: TranslationKey }[] = [
      { key: 'onboarding.slide5.item1' },
      { key: 'onboarding.slide5.item2' },
      { key: 'onboarding.slide5.item3' },
    ];
    return (
      <View style={styles.slideContent}>
        <Text style={styles.title}>{t('onboarding.slide5.title')}</Text>
        <View style={styles.buildContainer}>
          {items.map((item, i) => (
            <Animated.View
              key={i}
              style={[
                styles.buildRow,
                { opacity: buildItems[i] ? 1 : 0.3 },
              ]}
            >
              <Text style={styles.buildCheck}>{buildItems[i] ? '✅' : '⏳'}</Text>
              <Text style={styles.buildText}>{t(item.key)}</Text>
            </Animated.View>
          ))}
        </View>
      </View>
    );
  };

  const renderSlide6Result = () => {
    const goalKey = goal ? `onboarding.result.${goal}` as TranslationKey : null;
    const timeKey = time ? `onboarding.result.${time}` as TranslationKey : null;
    return (
      <View style={styles.slideContent}>
        <Text style={styles.title}>{t('onboarding.slide6.title')}</Text>
        <View style={styles.resultContainer}>
          {goalKey && (
            <View style={styles.resultRow}>
              <Text style={styles.resultEmoji}>🎯</Text>
              <View>
                <Text style={styles.resultLabel}>{t('onboarding.slide6.goal')}</Text>
                <Text style={styles.resultValue}>{t(goalKey)}</Text>
              </View>
            </View>
          )}
          {timeKey && (
            <View style={styles.resultRow}>
              <Text style={styles.resultEmoji}>⏰</Text>
              <View>
                <Text style={styles.resultLabel}>{t('onboarding.slide6.schedule')}</Text>
                <Text style={styles.resultValue}>{t(timeKey)}</Text>
              </View>
            </View>
          )}
          <View style={styles.resultRow}>
            <Text style={styles.resultEmoji}>📖</Text>
            <View>
              <Text style={styles.resultValue}>{t('onboarding.slide6.verses')}</Text>
            </View>
          </View>
        </View>
        <View style={styles.ctaContainer}>
          <TouchableOpacity style={styles.ctaButton} onPress={handleNext} activeOpacity={0.8}>
            <Text style={styles.ctaText}>{t('onboarding.slide6.cta')}</Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  };

  const renderSlide7Notification = () => {
    const subtitleKey = time
      ? `onboarding.slide7.subtitle.${time}` as TranslationKey
      : 'onboarding.slide7.subtitle.morning' as TranslationKey;
    return (
      <View style={styles.slideContent}>
        <Text style={styles.emoji}>🔔</Text>
        <Text style={styles.title}>{t('onboarding.slide7.title')}</Text>
        <Text style={styles.subtitle}>{t(subtitleKey)}</Text>
        <View style={styles.ctaContainer}>
          <TouchableOpacity style={styles.ctaButton} onPress={handleNotificationEnable} activeOpacity={0.8}>
            <Text style={styles.ctaText}>{t('onboarding.enableNotifications')}</Text>
          </TouchableOpacity>
          <TouchableOpacity onPress={handleNotificationSkip} style={styles.skipCtaButton}>
            <Text style={styles.skipCtaText}>{t('onboarding.notNow')}</Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  };

  const slides = [
    renderSlide1Hook,
    renderSlide2Question,
    renderSlide3Value,
    renderSlide4Time,
    renderSlide5Building,
    renderSlide6Result,
    renderSlide7Notification,
  ];

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      {/* Header: progress bar + skip */}
      <View style={styles.header}>
        <View style={styles.progressBarContainer}>
          <View style={[styles.progressBarFill, { width: `${progressWidth * 100}%` }]} />
        </View>
        <TouchableOpacity onPress={handleSkip} style={styles.skipButton}>
          <Text style={styles.skipText}>{t('onboarding.skip')}</Text>
        </TouchableOpacity>
      </View>

      {/* Slide content */}
      <Animated.View style={[styles.slideWrapper, { opacity: fadeAnim }]}>
        {slides[currentSlide]()}
      </Animated.View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.light.background,
  },
  header: {
    paddingHorizontal: 20,
    paddingTop: 8,
    gap: 8,
  },
  progressBarContainer: {
    height: 4,
    backgroundColor: Colors.light.border,
    borderRadius: 2,
    overflow: 'hidden',
  },
  progressBarFill: {
    height: '100%',
    backgroundColor: Colors.light.gold,
    borderRadius: 2,
  },
  skipButton: {
    alignSelf: 'flex-end',
    padding: 8,
  },
  skipText: {
    fontSize: 16,
    color: Colors.light.textMuted,
    fontWeight: '500',
  },
  slideWrapper: {
    flex: 1,
  },
  slideContent: {
    flex: 1,
    paddingHorizontal: 32,
    justifyContent: 'center',
    alignItems: 'center',
  },
  emoji: {
    fontSize: 64,
    marginBottom: 32,
  },
  title: {
    fontSize: 28,
    fontWeight: '300',
    color: Colors.light.text,
    textAlign: 'center',
    lineHeight: 38,
    letterSpacing: -0.5,
    marginBottom: 16,
  },
  subtitle: {
    fontSize: 17,
    color: Colors.light.textSecondary,
    textAlign: 'center',
    lineHeight: 26,
    marginBottom: 24,
  },
  ctaContainer: {
    width: '100%',
    marginTop: 32,
    paddingHorizontal: 8,
  },
  ctaButton: {
    backgroundColor: Colors.light.text,
    paddingVertical: 18,
    borderRadius: 16,
    alignItems: 'center',
  },
  ctaText: {
    color: Colors.light.background,
    fontSize: 17,
    fontWeight: '600',
  },
  skipCtaButton: {
    alignItems: 'center',
    paddingVertical: 16,
  },
  skipCtaText: {
    fontSize: 15,
    color: Colors.light.textMuted,
    fontWeight: '500',
  },

  // Question slides
  optionsContainer: {
    width: '100%',
    gap: 12,
    marginTop: 16,
  },
  optionCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.light.card,
    borderWidth: 1.5,
    borderColor: Colors.light.border,
    borderRadius: 16,
    paddingVertical: 18,
    paddingHorizontal: 20,
    gap: 16,
  },
  optionCardSelected: {
    borderColor: Colors.light.gold,
    backgroundColor: '#FBF8F0',
  },
  optionEmoji: {
    fontSize: 28,
  },
  optionLabel: {
    fontSize: 17,
    fontWeight: '500',
    color: Colors.light.text,
  },
  optionLabelSelected: {
    color: Colors.light.text,
    fontWeight: '600',
  },
  optionLabelRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  recBadge: {
    fontSize: 12,
    color: Colors.light.gold,
    fontWeight: '600',
    backgroundColor: '#FBF5E0',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 8,
    overflow: 'hidden',
  },

  // Value slide stats
  statsContainer: {
    width: '100%',
    gap: 20,
    marginTop: 24,
  },
  statRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16,
    paddingHorizontal: 8,
  },
  statEmoji: {
    fontSize: 28,
  },
  statText: {
    fontSize: 17,
    color: Colors.light.textSecondary,
    lineHeight: 24,
    flex: 1,
  },

  // Building plan slide
  buildContainer: {
    width: '100%',
    gap: 24,
    marginTop: 32,
  },
  buildRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16,
    paddingHorizontal: 8,
  },
  buildCheck: {
    fontSize: 24,
  },
  buildText: {
    fontSize: 17,
    color: Colors.light.textSecondary,
    lineHeight: 24,
  },

  // Result slide
  resultContainer: {
    width: '100%',
    gap: 20,
    marginTop: 24,
    backgroundColor: Colors.light.card,
    borderRadius: 20,
    padding: 24,
    borderWidth: 1,
    borderColor: Colors.light.border,
  },
  resultRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16,
  },
  resultEmoji: {
    fontSize: 28,
  },
  resultLabel: {
    fontSize: 13,
    color: Colors.light.textMuted,
    fontWeight: '500',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginBottom: 2,
  },
  resultValue: {
    fontSize: 17,
    color: Colors.light.text,
    fontWeight: '500',
  },
});
