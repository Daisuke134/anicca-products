import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Dimensions,
  TouchableOpacity,
  Platform,
  Animated,
  ActivityIndicator,
} from 'react-native';
import { useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import * as Notifications from 'expo-notifications';
import { Flower2, Bell, Users, Clock, Sun, Moon, Sunrise, Timer } from 'lucide-react-native';
import Colors from '@/constants/colors';
import { useApp } from '@/providers/AppProvider';
import { t, TranslationKey } from '@/utils/i18n';

const { width } = Dimensions.get('window');

type OnboardingStep = 'welcome' | 'q1' | 'value' | 'q2' | 'building' | 'notif';
type Goal = 'peace' | 'wisdom' | 'routine' | 'mindfulness';
type PreferredTime = 'morning' | 'midday' | 'evening' | 'custom';

const STEPS: OnboardingStep[] = ['welcome', 'q1', 'value', 'q2', 'building', 'notif'];
const TOTAL_STEPS = STEPS.length;

interface QuestionOption<T extends string> {
  value: T;
  labelKey: TranslationKey;
  emoji: string;
}

const goalOptions: QuestionOption<Goal>[] = [
  { value: 'peace', labelKey: 'onboarding.q1.option.peace', emoji: '🧘' },
  { value: 'wisdom', labelKey: 'onboarding.q1.option.wisdom', emoji: '📚' },
  { value: 'routine', labelKey: 'onboarding.q1.option.routine', emoji: '🌅' },
  { value: 'mindfulness', labelKey: 'onboarding.q1.option.mindfulness', emoji: '💭' },
];

const timeOptions: QuestionOption<PreferredTime>[] = [
  { value: 'morning', labelKey: 'onboarding.q2.option.morning', emoji: '🌅' },
  { value: 'midday', labelKey: 'onboarding.q2.option.midday', emoji: '☀️' },
  { value: 'evening', labelKey: 'onboarding.q2.option.evening', emoji: '🌙' },
  { value: 'custom', labelKey: 'onboarding.q2.option.custom', emoji: '⏰' },
];

export default function OnboardingScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { completeOnboarding, setOnboardingAnswer } = useApp();
  const [currentStepIndex, setCurrentStepIndex] = useState(0);
  const [selectedGoal, setSelectedGoal] = useState<Goal | null>(null);
  const [selectedTime, setSelectedTime] = useState<PreferredTime | null>(null);

  // Animation refs
  const fadeAnim = useRef(new Animated.Value(1)).current;
  const slideAnim = useRef(new Animated.Value(0)).current;
  const buildingProgress = useRef(new Animated.Value(0)).current;
  const spinAnim = useRef(new Animated.Value(0)).current;

  const currentStep = STEPS[currentStepIndex];

  // Building step: auto-advance after 1.5s
  useEffect(() => {
    if (currentStep === 'building') {
      // Start spinning animation
      Animated.loop(
        Animated.timing(spinAnim, {
          toValue: 1,
          duration: 2000,
          useNativeDriver: true,
        })
      ).start();

      // Progress bar animation
      Animated.timing(buildingProgress, {
        toValue: 1,
        duration: 1500,
        useNativeDriver: false,
      }).start();

      const timer = setTimeout(() => {
        goToNext();
      }, 1500);
      return () => clearTimeout(timer);
    }
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

  const goToNext = () => {
    if (currentStepIndex < TOTAL_STEPS - 1) {
      animateTransition(() => {
        setCurrentStepIndex(currentStepIndex + 1);
      });
    } else {
      // Last step done -> go to paywall
      completeOnboarding();
      router.replace('/paywall');
    }
  };

  const handleGoalSelect = (goal: Goal) => {
    setSelectedGoal(goal);
    setOnboardingAnswer('goal', goal);
  };

  const handleTimeSelect = (time: PreferredTime) => {
    setSelectedTime(time);
    setOnboardingAnswer('preferredTime', time);
  };

  const handleNotificationPermission = async () => {
    if (Platform.OS !== 'web') {
      await Notifications.requestPermissionsAsync();
    }
    goToNext();
  };

  const handleSkip = () => {
    completeOnboarding();
    router.replace('/');
  };

  const handleContinue = () => {
    if (currentStep === 'q1' && !selectedGoal) return;
    if (currentStep === 'q2' && !selectedTime) return;
    if (currentStep === 'notif') {
      handleNotificationPermission();
      return;
    }
    goToNext();
  };

  const spin = spinAnim.interpolate({
    inputRange: [0, 1],
    outputRange: ['0deg', '360deg'],
  });

  const progressWidth = buildingProgress.interpolate({
    inputRange: [0, 1],
    outputRange: ['0%', '100%'],
  });

  // Progress bar component
  const renderProgressBar = () => (
    <View style={styles.progressContainer}>
      {STEPS.map((_, index) => (
        <View
          key={index}
          style={[
            styles.progressDot,
            index <= currentStepIndex
              ? styles.progressDotActive
              : styles.progressDotInactive,
          ]}
        />
      ))}
    </View>
  );

  // Render step content
  const renderStepContent = () => {
    switch (currentStep) {
      case 'welcome':
        return (
          <View style={styles.stepContent}>
            <View style={styles.iconCircle}>
              <Flower2 size={64} color={Colors.light.gold} strokeWidth={1.2} />
            </View>
            <Text style={styles.title}>{t('onboarding.welcome.title')}</Text>
            <Text style={styles.subtitle}>{t('onboarding.welcome.subtitle')}</Text>
          </View>
        );

      case 'q1':
        return (
          <View style={styles.stepContent}>
            <Text style={styles.questionTitle}>{t('onboarding.q1.title')}</Text>
            <View style={styles.optionsContainer}>
              {goalOptions.map((option) => (
                <TouchableOpacity
                  key={option.value}
                  testID={`onboarding_q1_${option.value}`}
                  style={[
                    styles.optionButton,
                    selectedGoal === option.value && styles.optionButtonSelected,
                  ]}
                  onPress={() => handleGoalSelect(option.value)}
                  activeOpacity={0.7}
                >
                  <Text style={styles.optionEmoji}>{option.emoji}</Text>
                  <Text
                    style={[
                      styles.optionLabel,
                      selectedGoal === option.value && styles.optionLabelSelected,
                    ]}
                  >
                    {t(option.labelKey)}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>
        );

      case 'value':
        return (
          <View style={styles.stepContent}>
            <View style={styles.iconCircle}>
              <Users size={64} color={Colors.light.gold} strokeWidth={1.2} />
            </View>
            <Text style={styles.title}>{t('onboarding.value.title')}</Text>
            <Text style={styles.socialProofText}>{t('onboarding.value.stat')}</Text>
          </View>
        );

      case 'q2':
        return (
          <View style={styles.stepContent}>
            <Text style={styles.questionTitle}>{t('onboarding.q2.title')}</Text>
            <View style={styles.optionsContainer}>
              {timeOptions.map((option) => (
                <TouchableOpacity
                  key={option.value}
                  testID={`onboarding_q2_${option.value}`}
                  style={[
                    styles.optionButton,
                    selectedTime === option.value && styles.optionButtonSelected,
                  ]}
                  onPress={() => handleTimeSelect(option.value)}
                  activeOpacity={0.7}
                >
                  <Text style={styles.optionEmoji}>{option.emoji}</Text>
                  <Text
                    style={[
                      styles.optionLabel,
                      selectedTime === option.value && styles.optionLabelSelected,
                    ]}
                  >
                    {t(option.labelKey)}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>
        );

      case 'building':
        return (
          <View style={styles.stepContent}>
            <Animated.View style={{ transform: [{ rotate: spin }] }}>
              <View style={styles.iconCircle}>
                <Flower2 size={64} color={Colors.light.gold} strokeWidth={1.2} />
              </View>
            </Animated.View>
            <Text style={styles.title}>{t('onboarding.building.title')}</Text>
            <Text style={styles.subtitle}>{t('onboarding.building.subtitle')}</Text>
            <View style={styles.buildingProgressBar}>
              <Animated.View
                style={[styles.buildingProgressFill, { width: progressWidth }]}
              />
            </View>
          </View>
        );

      case 'notif':
        return (
          <View style={styles.stepContent}>
            <View style={styles.iconCircle}>
              <Bell size={64} color={Colors.light.gold} strokeWidth={1.2} />
            </View>
            <Text style={styles.title}>{t('onboarding.notif.title')}</Text>
            <Text style={styles.subtitle}>{t('onboarding.notif.subtitle')}</Text>
          </View>
        );

      default:
        return null;
    }
  };

  const getButtonText = (): string => {
    if (currentStep === 'notif') {
      return t('onboarding.enableNotifications');
    }
    return t('onboarding.continue');
  };

  const isButtonDisabled = (): boolean => {
    if (currentStep === 'q1' && !selectedGoal) return true;
    if (currentStep === 'q2' && !selectedTime) return true;
    return false;
  };

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      {/* Header with skip + progress */}
      <View style={styles.header}>
        <View style={styles.headerLeft} />
        {renderProgressBar()}
        <TouchableOpacity
          testID="onboarding_skip"
          onPress={handleSkip}
          style={styles.skipButton}
        >
          <Text style={styles.skipText}>{t('onboarding.skip')}</Text>
        </TouchableOpacity>
      </View>

      {/* Step content with animation */}
      <Animated.View
        style={[
          styles.contentContainer,
          {
            opacity: fadeAnim,
            transform: [{ translateX: slideAnim }],
          },
        ]}
      >
        {renderStepContent()}
      </Animated.View>

      {/* Footer with CTA button (hidden for building step) */}
      {currentStep !== 'building' && (
        <View style={[styles.footer, { paddingBottom: insets.bottom + 20 }]}>
          <TouchableOpacity
            testID="onboarding_cta"
            style={[
              styles.ctaButton,
              isButtonDisabled() && styles.ctaButtonDisabled,
            ]}
            onPress={handleContinue}
            activeOpacity={0.8}
            disabled={isButtonDisabled()}
          >
            <Text style={styles.ctaButtonText}>{getButtonText()}</Text>
          </TouchableOpacity>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.light.background,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 16,
  },
  headerLeft: {
    width: 50,
  },
  skipButton: {
    padding: 8,
    width: 50,
    alignItems: 'flex-end',
  },
  skipText: {
    fontSize: 16,
    color: Colors.light.textMuted,
    fontWeight: '500',
  },
  progressContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    gap: 6,
    flex: 1,
  },
  progressDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  progressDotActive: {
    backgroundColor: Colors.light.gold,
    width: 20,
    borderRadius: 4,
  },
  progressDotInactive: {
    backgroundColor: Colors.light.border,
  },
  contentContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 24,
  },
  stepContent: {
    alignItems: 'center',
    width: '100%',
  },
  iconCircle: {
    width: 140,
    height: 140,
    borderRadius: 70,
    backgroundColor: Colors.light.backgroundSecondary,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: Colors.light.border,
    marginBottom: 32,
  },
  title: {
    fontSize: 32,
    fontWeight: '300',
    color: Colors.light.text,
    textAlign: 'center',
    lineHeight: 42,
    letterSpacing: -0.5,
    marginBottom: 12,
  },
  subtitle: {
    fontSize: 17,
    color: Colors.light.textSecondary,
    textAlign: 'center',
    lineHeight: 26,
  },
  questionTitle: {
    fontSize: 28,
    fontWeight: '300',
    color: Colors.light.text,
    textAlign: 'center',
    lineHeight: 38,
    letterSpacing: -0.3,
    marginBottom: 32,
  },
  optionsContainer: {
    width: '100%',
    gap: 12,
  },
  optionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 18,
    borderRadius: 16,
    borderWidth: 2,
    borderColor: Colors.light.border,
    backgroundColor: Colors.light.card,
    gap: 14,
  },
  optionButtonSelected: {
    borderColor: Colors.light.gold,
    backgroundColor: Colors.light.backgroundSecondary,
  },
  optionEmoji: {
    fontSize: 28,
  },
  optionLabel: {
    fontSize: 18,
    fontWeight: '500',
    color: Colors.light.text,
  },
  optionLabelSelected: {
    color: Colors.light.text,
    fontWeight: '600',
  },
  socialProofText: {
    fontSize: 20,
    color: Colors.light.textSecondary,
    textAlign: 'center',
    lineHeight: 30,
    fontWeight: '400',
  },
  buildingProgressBar: {
    width: '80%',
    height: 4,
    backgroundColor: Colors.light.border,
    borderRadius: 2,
    marginTop: 24,
    overflow: 'hidden',
  },
  buildingProgressFill: {
    height: '100%',
    backgroundColor: Colors.light.gold,
    borderRadius: 2,
  },
  footer: {
    paddingHorizontal: 24,
  },
  ctaButton: {
    backgroundColor: Colors.light.text,
    paddingVertical: 18,
    borderRadius: 16,
    alignItems: 'center',
  },
  ctaButtonDisabled: {
    opacity: 0.4,
  },
  ctaButtonText: {
    color: Colors.light.background,
    fontSize: 17,
    fontWeight: '600',
  },
});
