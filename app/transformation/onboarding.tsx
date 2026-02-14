import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
} from 'react-native';
import { useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { getThemeTokens, typography, spacing, borderRadius } from '@/constants/theme';
import { useThemePreference } from '@/hooks/use-theme-preference';
import { SectionHeader } from '@/components/design/SectionHeader';
import { Card } from '@/components/design/Card';
import TransformationCTAButton from '@/components/transformation/TransformationCTAButton';
import {
  getTransformationProfile,
  getTransformationGoals,
  getTransformationRoutines,
  getMealPlan,
  getWorkoutPlan,
  updateTransformationProfile,
} from '@/services/db';
import { useTransformationLayout } from '@/hooks/use-transformation-layout';

const STEPS = ['Profile', 'Goals', 'Routines', 'Meal Plan', 'Workout', 'Complete'];

export default function OnboardingScreen() {
  const router = useRouter();
  const { colorScheme } = useThemePreference();
  const tokens = getThemeTokens(colorScheme);
  const { scrollContentStyle } = useTransformationLayout();

  const [step, setStep] = useState(0);
  const [loading, setLoading] = useState(true);
  const [profile, setProfile] = useState<any>(null);
  const [goals, setGoals] = useState<any>(null);
  const [routines, setRoutines] = useState<any>(null);
  const [mealPlan, setMealPlan] = useState<any>(null);
  const [workoutPlan, setWorkoutPlan] = useState<any>(null);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    setLoading(true);
    try {
      const [p, g, r, m, w] = await Promise.all([
        getTransformationProfile(),
        getTransformationGoals(),
        getTransformationRoutines(),
        getMealPlan(),
        getWorkoutPlan(),
      ]);
      setProfile(p);
      setGoals(g);
      setRoutines(r);
      setMealPlan(m);
      setWorkoutPlan(w);
    } catch (e) {
      // Error loading
    } finally {
      setLoading(false);
    }
  };

  const handleComplete = async () => {
    if (profile?.id) {
      await updateTransformationProfile(profile.id, { onboarding_complete: 1 });
    }
    router.replace('/transformation/today');
  };

  if (loading) {
    return (
      <SafeAreaView style={[styles.container, { backgroundColor: tokens.colors.background }]}>
        <ActivityIndicator size="large" color={tokens.colors.primary} style={styles.loader} />
      </SafeAreaView>
    );
  }

  if (!profile) {
    return (
      <SafeAreaView style={[styles.container, { backgroundColor: tokens.colors.background }]}>
        <Text style={[styles.errorText, { color: tokens.colors.text }]}>
          No profile found. Please restart the app to seed data.
        </Text>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: tokens.colors.background }]} edges={['bottom']}>
      <View style={[styles.steps, { backgroundColor: tokens.colors.elevatedSurface }]}>
        {STEPS.map((s, i) => (
          <View
            key={s}
            style={[
              styles.stepDot,
              {
                backgroundColor: i <= step ? tokens.colors.primary : tokens.colors.border,
              },
            ]}
          />
        ))}
      </View>

      <ScrollView
        style={styles.scroll}
        contentContainerStyle={[styles.scrollContent, scrollContentStyle]}
        showsVerticalScrollIndicator={false}
      >
        {step === 0 && (
          <>
            <SectionHeader title="Your profile" style={styles.stepSectionHeader} />
            <Card>
              <Text style={[styles.hint, { color: tokens.colors.textMuted }]}>
                Age: {profile.age}, {profile.sex}, {profile.height_cm}cm, {profile.weight_kg}kg
              </Text>
              <Text style={[styles.hint, { color: tokens.colors.textMuted }]}>
                Body fat: {profile.body_fat_pct}% | Diet: {profile.diet}
              </Text>
              <Text style={[styles.hint, { color: tokens.colors.textMuted }]}>
                Training: {profile.training_frequency} | Sleep: {profile.sleep_hours}
              </Text>
            </Card>
          </>
        )}

        {step === 1 && goals && (
          <>
            <SectionHeader title="Goals" style={styles.stepSectionHeader} />
            <Card>
              <Text style={[styles.hint, { color: tokens.colors.textMuted }]}>
                Target: {goals.target_weight_min}-{goals.target_weight_max} kg, {goals.target_body_fat_min}-
                {goals.target_body_fat_max}% body fat
              </Text>
              <Text style={[styles.hint, { color: tokens.colors.textMuted }]}>
                Timeline: {goals.timeline_months} months
              </Text>
              <Text style={[styles.hint, { color: tokens.colors.textMuted }]}>
                Macros: {goals.calories_min}-{goals.calories_max} kcal, P: {goals.protein_min}-{goals.protein_max}g
              </Text>
            </Card>
          </>
        )}

        {step === 2 && routines && (
          <>
            <SectionHeader title="Routines" style={styles.stepSectionHeader} />
            <Card>
              <Text style={[styles.hint, { color: tokens.colors.textMuted }]}>
                Skincare AM/PM, Hair, Beard, Supplements configured
              </Text>
            </Card>
          </>
        )}

        {step === 3 && mealPlan && (
          <>
            <SectionHeader title="7-Day Meal Plan" style={styles.stepSectionHeader} />
            <Card>
              <Text style={[styles.hint, { color: tokens.colors.textMuted }]}>
                Rotating plan with macros. Track adherence daily.
              </Text>
            </Card>
          </>
        )}

        {step === 4 && workoutPlan && (
          <>
            <SectionHeader title="5-Day Workout Split" style={styles.stepSectionHeader} />
            <Card>
              <Text style={[styles.hint, { color: tokens.colors.textMuted }]}>
                Push, Pull, Legs, Upper Hypertrophy, Lower + Core
              </Text>
            </Card>
          </>
        )}

        {step === 5 && (
          <>
            <SectionHeader title="You're all set!" style={styles.stepSectionHeader} />
            <Card>
              <Text style={[styles.hint, { color: tokens.colors.textMuted }]}>
                Start tracking your daily checklist, weekly check-ins, and progress.
              </Text>
            </Card>
          </>
        )}
      </ScrollView>

      <View style={[styles.footer, { backgroundColor: tokens.colors.surface }]}>
        {step < STEPS.length - 1 ? (
          <TransformationCTAButton label="Next" onPress={() => setStep((s) => s + 1)} />
        ) : (
          <TransformationCTAButton label="Get Started" onPress={handleComplete} />
        )}
        {step > 0 && (
          <TouchableOpacity
            style={[styles.buttonSecondary, { borderColor: tokens.colors.border }]}
            onPress={() => setStep((s) => s - 1)}
          >
            <Text style={[styles.buttonSecondaryText, { color: tokens.colors.text }]}>Back</Text>
          </TouchableOpacity>
        )}
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  loader: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  errorText: {
    flex: 1,
    textAlign: 'center',
    padding: spacing.xl,
  },
  steps: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 8,
    paddingVertical: spacing.md,
  },
  stepDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  scroll: {
    flex: 1,
  },
  scrollContent: {},
  stepSectionHeader: { marginBottom: spacing.lg },
  hint: {
    ...typography.bodyMedium,
    marginBottom: 4,
  },
  footer: {
    padding: spacing.lg,
    gap: spacing.sm,
  },
  buttonSecondary: {
    paddingVertical: spacing.sm,
    borderRadius: borderRadius.full,
    alignItems: 'center',
    borderWidth: 1,
  },
  buttonSecondaryText: { ...typography.label },
});
