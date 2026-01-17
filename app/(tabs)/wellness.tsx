/**
 * Wellness Tab - Meditation and Wellness Routines
 * 
 * Features:
 * - Featured meditation/practice
 * - Practice categories
 * - Meditation history
 * - Add meditation button
 */

import React, { useState, useCallback } from 'react';
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
  RefreshControl,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { useFocusEffect } from '@react-navigation/native';

import { useThemePreference } from '@/hooks/use-theme-preference';
import { 
  getThemeTokens, 
  getScreenBackground,
  spacing,
  borderRadius,
  shadows,
} from '@/constants/theme';
import { getMeditationRoutines, getMeditationLogs } from '@/services/db';
import { IconSymbol } from '@/components/ui/icon-symbol';

type MeditationRoutine = {
  id: string;
  name: string;
  target_minutes: number;
  notes?: string;
  is_active: number;
};

type MeditationSession = {
  id: string;
  routine_id?: string;
  duration: number;
  meditation_type?: string;
  note?: string;
  session_date: number;
};

// Practice categories for the list
const practiceCategories = [
  { id: 'sleep', name: 'Better sleep', icon: 'moon' },
  { id: 'anxiety', name: 'For anxiety', icon: 'heart' },
  { id: 'morning', name: 'Morning meditations', icon: 'sun.max' },
  { id: 'focus', name: 'Mindfulness and concentration', icon: 'brain' },
];

export default function WellnessScreen() {
  const router = useRouter();
  const { colorScheme } = useThemePreference();
  const tokens = getThemeTokens(colorScheme);
  const backgroundColor = getScreenBackground('wellness', colorScheme);
  
  const [routines, setRoutines] = useState<MeditationRoutine[]>([]);
  const [sessions, setSessions] = useState<MeditationSession[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const loadData = async () => {
    try {
      const [routinesData, sessionsData] = await Promise.all([
        getMeditationRoutines(true),
        getMeditationLogs(),
      ]);
      setRoutines(routinesData);
      setSessions(sessionsData);
    } catch (error) {
      console.error('Error loading wellness data:', error);
    } finally {
      setIsLoading(false);
      setRefreshing(false);
    }
  };

  useFocusEffect(
    useCallback(() => {
      loadData();
    }, [])
  );

  const onRefresh = useCallback(() => {
    setRefreshing(true);
    loadData();
  }, []);

  // Get total meditation minutes this week
  const getWeeklyMinutes = () => {
    const weekAgo = Date.now() - 7 * 24 * 60 * 60 * 1000;
    return sessions
      .filter(s => s.session_date >= weekAgo)
      .reduce((sum, s) => sum + (s.duration || 0), 0);
  };

  const weeklyMinutes = getWeeklyMinutes();

  const formatDate = (timestamp: number) => {
    const date = new Date(timestamp);
    return date.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: '2-digit',
    });
  };

  return (
    <SafeAreaView 
      style={[styles.container, { backgroundColor }]} 
      edges={['top']}
    >
      <ScrollView
        contentContainerStyle={styles.content}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            tintColor={tokens.colors.primary}
          />
        }
        showsVerticalScrollIndicator={false}
      >
        {/* Header */}
        <View style={styles.header}>
          <Text style={[styles.title, { color: tokens.colors.textHandwritten }]}>
            Wellness
          </Text>
          <Text style={[styles.subtitle, { color: tokens.colors.textSecondary }]}>
            Nurture your mind and body
          </Text>
        </View>

        {/* Weekly Stats */}
        <View style={[styles.statsCard, { backgroundColor: tokens.colors.card }, shadows.low]}>
          <View style={styles.statsContent}>
            <IconSymbol name="sparkles" size={32} color={tokens.colors.primary} />
            <View style={styles.statsText}>
              <Text style={[styles.statsValue, { color: tokens.colors.text }]}>
                {weeklyMinutes} minutes
              </Text>
              <Text style={[styles.statsLabel, { color: tokens.colors.textMuted }]}>
                meditated this week
              </Text>
            </View>
          </View>
        </View>

        {/* Try Today Section */}
        <Text style={[styles.sectionTitle, { color: tokens.colors.textHandwritten }]}>
          Try today
        </Text>
        
        {routines.length > 0 ? (
          <TouchableOpacity
            style={[styles.featuredCard, { backgroundColor: tokens.colors.card }, shadows.low]}
            onPress={() => router.push(`/meditation-tracker?id=${routines[0].id}`)}
            activeOpacity={0.7}
          >
            <View style={[styles.illustrationPlaceholder, { backgroundColor: tokens.colors.primaryLight }]}>
              <IconSymbol name="leaf.fill" size={32} color={tokens.colors.primary} />
            </View>
            <View style={styles.featuredContent}>
              <Text style={[styles.featuredTitle, { color: tokens.colors.text }]}>
                {routines[0].name}
              </Text>
              <Text style={[styles.featuredDescription, { color: tokens.colors.textSecondary }]}>
                {routines[0].notes || 'Start your practice with a moment of calm'}
              </Text>
              <Text style={[styles.featuredDuration, { color: tokens.colors.teal }]}>
                {routines[0].target_minutes} minutes
              </Text>
            </View>
          </TouchableOpacity>
        ) : (
          <TouchableOpacity
            style={[styles.featuredCard, { backgroundColor: tokens.colors.card }, shadows.low]}
            onPress={() => router.push('/add-meditation')}
            activeOpacity={0.7}
          >
            <View style={[styles.illustrationPlaceholder, { backgroundColor: tokens.colors.primaryLight }]}>
              <IconSymbol name="plus" size={32} color={tokens.colors.primary} />
            </View>
            <View style={styles.featuredContent}>
              <Text style={[styles.featuredTitle, { color: tokens.colors.text }]}>
                Create your first routine
              </Text>
              <Text style={[styles.featuredDescription, { color: tokens.colors.textSecondary }]}>
                Set up a daily meditation practice
              </Text>
            </View>
          </TouchableOpacity>
        )}

        {/* Practices Section */}
        <Text style={[styles.sectionTitle, { color: tokens.colors.textHandwritten }]}>
          Practices
        </Text>
        
        <View style={[styles.practicesCard, { backgroundColor: tokens.colors.card }, shadows.low]}>
          {practiceCategories.map((category, index) => (
            <TouchableOpacity
              key={category.id}
              style={[
                styles.practiceItem,
                index < practiceCategories.length - 1 && {
                  borderBottomWidth: 1,
                  borderBottomColor: tokens.colors.border,
                },
              ]}
              activeOpacity={0.6}
            >
              <Text style={[styles.practiceName, { color: tokens.colors.text }]}>
                {category.name}
              </Text>
              <IconSymbol name="chevron.right" size={16} color={tokens.colors.textMuted} />
            </TouchableOpacity>
          ))}
        </View>

        {/* My Routines */}
        {routines.length > 0 && (
          <>
            <Text style={[styles.sectionTitle, { color: tokens.colors.textHandwritten }]}>
              My Routines
            </Text>
            
            {routines.map((routine) => (
              <TouchableOpacity
                key={routine.id}
                style={[styles.routineCard, { backgroundColor: tokens.colors.card }, shadows.low]}
                onPress={() => router.push(`/meditation-tracker?id=${routine.id}`)}
                activeOpacity={0.7}
              >
                <View style={styles.routineInfo}>
                  <Text style={[styles.routineName, { color: tokens.colors.text }]}>
                    {routine.name}
                  </Text>
                  <Text style={[styles.routineTarget, { color: tokens.colors.textMuted }]}>
                    Target: {routine.target_minutes} min/day
                  </Text>
                </View>
                <IconSymbol name="chevron.right" size={20} color={tokens.colors.textMuted} />
              </TouchableOpacity>
            ))}
          </>
        )}

        {/* Meditation History */}
        {sessions.length > 0 && (
          <>
            <Text style={[styles.sectionTitle, { color: tokens.colors.textHandwritten }]}>
              Meditation history
            </Text>
            
            {sessions.slice(0, 5).map((session) => (
              <View
                key={session.id}
                style={[styles.historyItem, { backgroundColor: tokens.colors.card }, shadows.subtle]}
              >
                <View style={[styles.historyIcon, { backgroundColor: tokens.colors.orchid + '30' }]}>
                  <IconSymbol name="sparkles" size={20} color={tokens.colors.orchid} />
                </View>
                <View style={styles.historyContent}>
                  <Text style={[styles.historyTitle, { color: tokens.colors.text }]}>
                    {session.meditation_type || 'Meditation'}
                  </Text>
                  <Text style={[styles.historyDate, { color: tokens.colors.textMuted }]}>
                    {formatDate(session.session_date)} • {session.duration} min
                  </Text>
                </View>
              </View>
            ))}
          </>
        )}
      </ScrollView>

      {/* Floating Action Button */}
      <TouchableOpacity
        style={[styles.fab, { backgroundColor: tokens.colors.buttonPrimary }, shadows.high]}
        onPress={() => router.push('/add-meditation')}
        activeOpacity={0.8}
      >
        <Text style={[styles.fabText, { color: tokens.colors.buttonPrimaryText }]}>
          Log Meditation
        </Text>
      </TouchableOpacity>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  content: {
    padding: spacing.lg,
    paddingBottom: 100,
  },
  header: {
    marginBottom: spacing.xl,
  },
  title: {
    fontSize: 32,
    fontFamily: 'Caveat-SemiBold',
    marginBottom: spacing.xxs,
  },
  subtitle: {
    fontSize: 16,
    fontFamily: 'Nunito-Regular',
  },
  statsCard: {
    borderRadius: borderRadius.xl,
    padding: spacing.md,
    marginBottom: spacing.xl,
  },
  statsContent: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
  },
  statsText: {
    flex: 1,
  },
  statsValue: {
    fontSize: 20,
    fontFamily: 'Nunito-Bold',
  },
  statsLabel: {
    fontSize: 13,
    fontFamily: 'Nunito-Regular',
  },
  sectionTitle: {
    fontSize: 24,
    fontFamily: 'Caveat-SemiBold',
    marginBottom: spacing.md,
    marginTop: spacing.md,
  },
  featuredCard: {
    borderRadius: borderRadius.xl,
    padding: spacing.md,
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    marginBottom: spacing.sm,
  },
  illustrationPlaceholder: {
    width: 64,
    height: 64,
    borderRadius: borderRadius.lg,
    justifyContent: 'center',
    alignItems: 'center',
  },
  featuredContent: {
    flex: 1,
  },
  featuredTitle: {
    fontSize: 16,
    fontFamily: 'Nunito-SemiBold',
    marginBottom: spacing.xxs,
  },
  featuredDescription: {
    fontSize: 13,
    fontFamily: 'Nunito-Regular',
    lineHeight: 18,
    marginBottom: spacing.xs,
  },
  featuredDuration: {
    fontSize: 12,
    fontFamily: 'Nunito-Medium',
  },
  practicesCard: {
    borderRadius: borderRadius.xl,
    overflow: 'hidden',
  },
  practiceItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: spacing.md,
  },
  practiceName: {
    fontSize: 15,
    fontFamily: 'Nunito-Regular',
  },
  routineCard: {
    borderRadius: borderRadius.xl,
    padding: spacing.md,
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: spacing.sm,
  },
  routineInfo: {
    flex: 1,
  },
  routineName: {
    fontSize: 16,
    fontFamily: 'Nunito-SemiBold',
    marginBottom: spacing.xxs,
  },
  routineTarget: {
    fontSize: 13,
    fontFamily: 'Nunito-Regular',
  },
  historyItem: {
    borderRadius: borderRadius.lg,
    padding: spacing.md,
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    marginBottom: spacing.sm,
  },
  historyIcon: {
    width: 40,
    height: 40,
    borderRadius: borderRadius.md,
    justifyContent: 'center',
    alignItems: 'center',
  },
  historyContent: {
    flex: 1,
  },
  historyTitle: {
    fontSize: 15,
    fontFamily: 'Nunito-SemiBold',
  },
  historyDate: {
    fontSize: 12,
    fontFamily: 'Nunito-Regular',
    marginTop: spacing.xxs,
  },
  fab: {
    position: 'absolute',
    bottom: spacing.xl,
    left: spacing.lg,
    right: spacing.lg,
    paddingVertical: spacing.lg,
    borderRadius: borderRadius.full,
    alignItems: 'center',
  },
  fabText: {
    fontSize: 16,
    fontFamily: 'Nunito-SemiBold',
  },
});
