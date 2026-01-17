/**
 * Home Tab - Dashboard with Mixed Content
 * 
 * Features:
 * - Welcome header with avatar
 * - Mood history (7-day calendar)
 * - Stress/Energy mini cards
 * - Due items for today
 * - Activity summary
 * - Quick actions
 */

import { useFocusEffect } from '@react-navigation/native';
import { Image } from 'expo-image';
import { useRouter } from 'expo-router';
import React, { useCallback, useState } from 'react';
import {
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { IconSymbol } from '@/components/ui/icon-symbol';
import {
  borderRadius,
  getMoodColor,
  getScreenBackground,
  getThemeTokens,
  shadows,
  spacing,
} from '@/constants/theme';
import { useThemePreference } from '@/hooks/use-theme-preference';
import {
  createTrackingEvent,
  getJournalEntries,
  getMigraineReadings,
  getSteps,
  getWorkouts
} from '@/services/db';
import { DueItem, getDueItemsToday } from '@/services/tracking';

export default function HomeScreen() {
  const router = useRouter();
  const { colorScheme } = useThemePreference();
  const tokens = getThemeTokens(colorScheme);
  const backgroundColor = getScreenBackground('home', colorScheme);
  
  const [refreshing, setRefreshing] = useState(false);
  const [dueItems, setDueItems] = useState<DueItem[]>([]);
  const [moodHistory, setMoodHistory] = useState<any[]>([]);
  const [todayStats, setTodayStats] = useState({
    avgMood: 0,
    avgStress: 0,
    avgEnergy: 0,
  });
  const [activityMinutes, setActivityMinutes] = useState(0);
  const [steps, setSteps] = useState(0);
  const [migraineStats, setMigraineStats] = useState({
    thisMonth: 0,
    lastMigraine: null as Date | null,
  });

  const loadData = useCallback(async () => {
    try {
      // Load journal entries for mood history
      const journalEntries = await getJournalEntries();
      
      // Get last 7 days mood data
      const last7Days = getLast7DaysMood(journalEntries);
      setMoodHistory(last7Days);
      
      // Calculate averages from recent entries
      const recentEntries = journalEntries.slice(0, 7);
      if (recentEntries.length > 0) {
        const moodSum = recentEntries.reduce((sum: number, e: any) => sum + (e.mood_intensity || 0), 0);
        const stressSum = recentEntries.reduce((sum: number, e: any) => sum + (e.stress_level || 0), 0);
        const energySum = recentEntries.reduce((sum: number, e: any) => sum + (e.energy_level || 0), 0);
        
        const moodCount = recentEntries.filter((e: any) => e.mood_intensity).length || 1;
        const stressCount = recentEntries.filter((e: any) => e.stress_level).length || 1;
        const energyCount = recentEntries.filter((e: any) => e.energy_level).length || 1;
        
        setTodayStats({
          avgMood: moodSum / moodCount,
          avgStress: stressSum / stressCount,
          avgEnergy: energySum / energyCount,
        });
      }

      // Load due items
      const items = await getDueItemsToday();
      setDueItems(items.slice(0, 4));

      // Load activity data and migraines
      const [workouts, stepsData, migraines] = await Promise.all([
        getWorkouts(),
        getSteps(),
        getMigraineReadings(),
      ]);
      
      // Calculate migraine stats
      const monthAgo = Date.now() - 30 * 24 * 60 * 60 * 1000;
      const migrainesThisMonth = migraines.filter((m: any) => m.started_at >= monthAgo);
      setMigraineStats({
        thisMonth: migrainesThisMonth.length,
        lastMigraine: migraines.length > 0 ? new Date(migraines[0].started_at) : null,
      });
      
      // Calculate today's activity minutes
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      const todayWorkouts = workouts.filter((w: any) => 
        new Date(w.started_at).setHours(0, 0, 0, 0) === today.getTime()
      );
      const totalMinutes = todayWorkouts.reduce((sum: number, w: any) => sum + (w.duration || 0), 0);
      setActivityMinutes(totalMinutes);
      
      // Get today's steps
      const todaySteps = stepsData.find((s: any) => 
        new Date(s.date).setHours(0, 0, 0, 0) === today.getTime()
      );
      setSteps(todaySteps?.steps || 0);

    } catch (error) {
      console.error('Error loading home data:', error);
    } finally {
      setRefreshing(false);
    }
  }, []);

  useFocusEffect(
    useCallback(() => {
      loadData();
    }, [loadData])
  );

  const onRefresh = useCallback(() => {
    setRefreshing(true);
    loadData();
  }, [loadData]);

  // Get mood data for last 7 days
  const getLast7DaysMood = (entries: any[]) => {
    const days = [];
    const today = new Date();
    
    for (let i = 6; i >= 0; i--) {
      const date = new Date(today);
      date.setDate(date.getDate() - i);
      date.setHours(0, 0, 0, 0);
      
      const dayEntry = entries.find((e: any) => {
        const entryDate = new Date(e.entry_date);
        entryDate.setHours(0, 0, 0, 0);
        return entryDate.getTime() === date.getTime();
      });

      days.push({
        date,
        dayLabel: ['S', 'M', 'T', 'W', 'T', 'F', 'S'][date.getDay()],
        dayNumber: date.getDate(),
        mood: dayEntry?.mood || null,
        hasEntry: !!dayEntry,
        isToday: i === 0,
        isFuture: i < 0,
      });
    }
    
    return days;
  };

  const handleMarkDone = async (item: DueItem) => {
    try {
      const eventType = item.type === 'medication' || item.type === 'supplement' ? 'taken' : 'done';
      await createTrackingEvent({
        parent_type: item.type,
        parent_id: item.id,
        schedule_id: item.scheduleId,
        event_type: eventType,
        event_date: Date.now(),
        event_time: Date.now(),
      });
      // Reload data
      loadData();
    } catch (error) {
      console.error('Error marking item done:', error);
    }
  };

  const getGreeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return 'Good morning';
    if (hour < 17) return 'Good afternoon';
    return 'Good evening';
  };

  const formatLastMigraine = (date: Date) => {
    const now = new Date();
    const diff = now.getTime() - date.getTime();
    const days = Math.floor(diff / (1000 * 60 * 60 * 24));
    
    if (days === 0) return 'Today';
    if (days === 1) return 'Yesterday';
    if (days < 7) return `${days} days ago`;
    if (days < 30) return `${Math.floor(days / 7)} week${Math.floor(days / 7) > 1 ? 's' : ''} ago`;
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
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
        {/* Welcome Header */}
        <View style={styles.header}>
          <View style={styles.headerLeft}>
            <View style={[styles.avatar, { backgroundColor: tokens.colors.primary }]}>
              {/* TODO: Add profile-image.png to assets/images/ to display user avatar */}
              {/* For now, showing icon placeholder. To add your image:
                  1. Add profile-image.png to assets/images/
                  2. Uncomment the Image component below and remove the IconSymbol
                  
                  <Image 
                    source={require('@/assets/images/profile-image.png')} 
                    style={{ width: 36, height: 36, borderRadius: 18 }} 
                    resizeMode="cover" 
                  />
              */}
              <Image 
                    source={require('@/assets/images/profile-image.jpg')} 
                    style={{ width: 36, height: 36, borderRadius: 18 }} 
                    resizeMode="cover" 
                  />
            </View>
            <View>
              <Text style={[styles.greeting, { color: tokens.colors.textSecondary }]}>
                {getGreeting()},
              </Text>
              <Text style={[styles.userName, { color: tokens.colors.text }]}>
                Gnaneswar
              </Text>
            </View>
          </View>
          <View style={styles.headerCenter}>
            <TouchableOpacity
              activeOpacity={0.7}
              delayLongPress={2000}
              onLongPress={() => router.push('/journal')}
            >
              <Text style={[styles.ailyTitle, { color: tokens.colors.textHandwritten }]}>
                AILY
              </Text>
            </TouchableOpacity>
          </View>
          <TouchableOpacity style={styles.notificationButton}>
            <IconSymbol name="bell" size={24} color={tokens.colors.text} />
          </TouchableOpacity>
        </View>

        {/* Mood History Card */}
        <TouchableOpacity 
          style={[styles.card, { backgroundColor: tokens.colors.card }, shadows.low]}
          onPress={() => router.push('/(tabs)/mood')}
          activeOpacity={0.8}
        >
          <View style={styles.cardHeader}>
            <Text style={[styles.cardTitle, { color: tokens.colors.text }]}>
              Mood history
            </Text>
            <View style={styles.dropdown}>
              <Text style={[styles.dropdownText, { color: tokens.colors.textMuted }]}>
                Week
              </Text>
              <IconSymbol name="chevron.right" size={14} color={tokens.colors.textMuted} />
            </View>
          </View>
          
          <View style={styles.weekCalendar}>
            {moodHistory.map((day, index) => (
              <View key={index} style={styles.dayColumn}>
                <Text style={[styles.dayLabel, { color: tokens.colors.textMuted }]}>
                  {day.dayLabel}
                </Text>
                <View
                  style={[
                    styles.dayCircle,
                    day.hasEntry && { backgroundColor: getMoodColor(day.mood || 'calm') },
                    !day.hasEntry && !day.isFuture && { backgroundColor: tokens.colors.border },
                    day.isFuture && { backgroundColor: tokens.colors.coral },
                    day.isToday && styles.todayRing,
                    day.isToday && { borderColor: tokens.colors.primary },
                  ]}
                >
                  <Text
                    style={[
                      styles.dayNumber,
                      { color: (day.hasEntry || day.isFuture) ? tokens.colors.textOnDark : tokens.colors.textMuted },
                    ]}
                  >
                    {day.dayNumber}
                  </Text>
                </View>
              </View>
            ))}
          </View>
        </TouchableOpacity>

        {/* Stats Grid */}
        <View style={styles.statsGrid}>
          {/* Stress Level Card */}
          <TouchableOpacity 
            style={[styles.statCard, { backgroundColor: tokens.colors.card }, shadows.low]}
            onPress={() => router.push('/(tabs)/mood')}
            activeOpacity={0.7}
          >
            <Text style={[styles.statTitle, { color: tokens.colors.text }]}>
              Stress level
            </Text>
            <View style={styles.statChart}>
              <View style={[styles.chartBar, { backgroundColor: tokens.colors.teal, height: '60%' }]} />
              <View style={[styles.chartBar, { backgroundColor: tokens.colors.teal, height: '40%' }]} />
              <View style={[styles.chartBar, { backgroundColor: tokens.colors.teal, height: '80%' }]} />
              <View style={[styles.chartBar, { backgroundColor: tokens.colors.teal, height: '50%' }]} />
              <View style={[styles.chartBar, { backgroundColor: tokens.colors.teal, height: '70%' }]} />
            </View>
            <Text style={[styles.statFooter, { color: tokens.colors.textMuted }]}>
              Avg: {todayStats.avgStress > 0 ? todayStats.avgStress.toFixed(1) : '—'}/10
            </Text>
          </TouchableOpacity>

          {/* Health Diary Card */}
          <TouchableOpacity 
            style={[styles.statCard, { backgroundColor: tokens.colors.card }, shadows.low]}
            onPress={() => router.push('/(tabs)/mood')}
            activeOpacity={0.7}
          >
            <Text style={[styles.statTitle, { color: tokens.colors.text }]}>
              Health diary
            </Text>
            <View style={styles.dotGrid}>
              {[...Array(21)].map((_, i) => (
                <View
                  key={i}
                  style={[
                    styles.dot,
                    { backgroundColor: i < 14 ? tokens.colors.accent : tokens.colors.accentLight },
                  ]}
                />
              ))}
            </View>
            <Text style={[styles.statFooter, { color: tokens.colors.textMuted }]}>
              Your entries help you see your progress
            </Text>
          </TouchableOpacity>
        </View>

        {/* Due Today Section */}
        <Text style={[styles.sectionTitle, { color: tokens.colors.textHandwritten }]}>
          Due today
        </Text>
        
        {dueItems.length > 0 ? (
          <View style={[styles.card, { backgroundColor: tokens.colors.card }, shadows.low]}>
            {dueItems.map((item, index) => (
              <TouchableOpacity
                key={`${item.id}-${item.scheduleId || ''}`}
                style={[
                  styles.dueItem,
                  index < dueItems.length - 1 && {
                    borderBottomWidth: 1,
                    borderBottomColor: tokens.colors.border,
                  },
                ]}
                onPress={() => {
                  // Navigate to the appropriate tracker page
                  if (item.type === 'medication') {
                    router.push(`/med-tracker?id=${item.id}`);
                  } else if (item.type === 'supplement') {
                    router.push(`/supplement-tracker?id=${item.id}`);
                  } else if (item.type === 'meditation') {
                    router.push(`/meditation-tracker?id=${item.id}`);
                  } else if (item.type === 'appointment') {
                    router.push(`/appointment-tracker?id=${item.id}`);
                  }
                }}
                activeOpacity={0.7}
              >
                <View style={styles.dueItemContent}>
                  <Text style={[styles.dueItemName, { color: tokens.colors.text }]}>
                    {item.name}
                  </Text>
                  {item.timeOfDay && (
                    <Text style={[styles.dueItemTime, { color: tokens.colors.textMuted }]}>
                      {item.timeOfDay}
                    </Text>
                  )}
                </View>
                {item.status !== 'done' ? (
                  <TouchableOpacity
                    style={[styles.checkButton, { backgroundColor: tokens.colors.primary }]}
                    onPress={(e) => {
                      e.stopPropagation();
                      handleMarkDone(item);
                    }}
                  >
                    <IconSymbol name="checkmark" size={16} color="#FFFFFF" />
                  </TouchableOpacity>
                ) : (
                  <View style={[styles.checkButton, { backgroundColor: tokens.colors.success }]}>
                    <IconSymbol name="checkmark" size={16} color="#FFFFFF" />
                  </View>
                )}
              </TouchableOpacity>
            ))}
          </View>
        ) : (
          <View style={[styles.emptyCard, { backgroundColor: tokens.colors.card }, shadows.low]}>
            <IconSymbol name="checkmark.circle" size={32} color={tokens.colors.success} />
            <Text style={[styles.emptyText, { color: tokens.colors.textMuted }]}>
              All caught up for today!
            </Text>
          </View>
        )}

        {/* Activity & Health Summary */}
        <Text style={[styles.sectionTitle, { color: tokens.colors.textHandwritten }]}>
          Today's activity
        </Text>
        
        <View style={[styles.activityCard, { backgroundColor: tokens.colors.card }, shadows.low]}>
          <View style={styles.activityRow}>
            <View style={styles.activityItem}>
              <IconSymbol name="figure.walk" size={24} color={tokens.colors.primary} />
              <View>
                <Text style={[styles.activityValue, { color: tokens.colors.text }]}>
                  {steps.toLocaleString()}
                </Text>
                <Text style={[styles.activityLabel, { color: tokens.colors.textMuted }]}>
                  steps
                </Text>
              </View>
            </View>
            <View style={styles.activityDivider} />
            <View style={styles.activityItem}>
              <IconSymbol name="flame.fill" size={24} color={tokens.colors.coral} />
              <View>
                <Text style={[styles.activityValue, { color: tokens.colors.text }]}>
                  {activityMinutes}
                </Text>
                <Text style={[styles.activityLabel, { color: tokens.colors.textMuted }]}>
                  min active
                </Text>
              </View>
            </View>
          </View>
        </View>

        {/* Migraine Tracker Card */}
        <TouchableOpacity
          style={[styles.migraineCard, { backgroundColor: tokens.colors.card }, shadows.low]}
          onPress={() => router.push('/migraine-tracker')}
          activeOpacity={0.7}
        >
          <View style={styles.migraineHeader}>
            <View style={[styles.migraineIconContainer, { backgroundColor: tokens.colors.warning + '20' }]}>
              <IconSymbol name="bolt.fill" size={20} color={tokens.colors.warning} />
            </View>
            <View style={styles.migraineInfo}>
              <Text style={[styles.migraineTitle, { color: tokens.colors.text }]}>
                Migraine Tracker
              </Text>
              <Text style={[styles.migraineSubtitle, { color: tokens.colors.textMuted }]}>
                {migraineStats.thisMonth === 0 
                  ? 'No migraines this month 🎉' 
                  : `${migraineStats.thisMonth} migraine${migraineStats.thisMonth === 1 ? '' : 's'} this month`}
              </Text>
            </View>
            <IconSymbol name="chevron.right" size={18} color={tokens.colors.textMuted} />
          </View>
          {migraineStats.lastMigraine && (
            <View style={[styles.migraineLastEntry, { borderTopColor: tokens.colors.border }]}>
              <Text style={[styles.migraineLastLabel, { color: tokens.colors.textMuted }]}>
                Last migraine:
              </Text>
              <Text style={[styles.migraineLastDate, { color: tokens.colors.text }]}>
                {formatLastMigraine(migraineStats.lastMigraine)}
              </Text>
            </View>
          )}
        </TouchableOpacity>

        {/* Quick Actions */}
        <View style={styles.quickActionsGrid}>
          <TouchableOpacity
            style={[styles.quickActionSmall, { backgroundColor: tokens.colors.primary }]}
            onPress={() => router.push('/add-journal')}
            activeOpacity={0.8}
          >
            <IconSymbol name="book.fill" size={18} color="#FFFFFF" />
            <Text style={styles.quickActionSmallText}>Journal</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.quickActionSmall, { backgroundColor: tokens.colors.teal }]}
            onPress={() => router.push('/add-meditation')}
            activeOpacity={0.8}
          >
            <IconSymbol name="leaf.fill" size={18} color="#FFFFFF" />
            <Text style={styles.quickActionSmallText}>Meditate</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.quickActionSmall, { backgroundColor: tokens.colors.coral }]}
            onPress={() => router.push('/add-bp')}
            activeOpacity={0.8}
          >
            <IconSymbol name="heart.fill" size={18} color="#FFFFFF" />
            <Text style={styles.quickActionSmallText}>Log BP</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.quickActionSmall, { backgroundColor: tokens.colors.warning }]}
            onPress={() => router.push('/add-migraine')}
            activeOpacity={0.8}
          >
            <IconSymbol name="bolt.fill" size={18} color="#FFFFFF" />
            <Text style={styles.quickActionSmallText}>Migraine</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  content: {
    padding: spacing.lg,
    paddingBottom: spacing.huge,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.xl,
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  headerCenter: {
    flex: 1,
    alignItems: 'center',
  },
  avatar: {
    width: 44,
    height: 44,
    borderRadius: 22,
    justifyContent: 'center',
    alignItems: 'center',
  },
  greeting: {
    fontSize: 13,
    fontFamily: 'Nunito-Regular',
  },
  userName: {
    fontSize: 18,
    fontFamily: 'Nunito-Bold',
  },
  ailyTitle: {
    fontSize: 22,
    fontFamily: 'Caveat-SemiBold',
    letterSpacing: 0.5,
  },
  notificationButton: {
    padding: spacing.xs,
  },
  card: {
    borderRadius: borderRadius.xl,
    padding: spacing.md,
    marginBottom: spacing.md,
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.md,
  },
  cardTitle: {
    fontSize: 17,
    fontFamily: 'Nunito-SemiBold',
  },
  dropdown: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xxs,
  },
  dropdownText: {
    fontSize: 13,
    fontFamily: 'Nunito-Regular',
  },
  weekCalendar: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingHorizontal: spacing.xs,
  },
  dayColumn: {
    alignItems: 'center',
    gap: spacing.xs,
  },
  dayLabel: {
    fontSize: 12,
    fontFamily: 'Nunito-Medium',
  },
  dayCircle: {
    width: 36,
    height: 36,
    borderRadius: 18,
    justifyContent: 'center',
    alignItems: 'center',
  },
  todayRing: {
    borderWidth: 2,
  },
  dayNumber: {
    fontSize: 14,
    fontFamily: 'Nunito-SemiBold',
  },
  statsGrid: {
    flexDirection: 'row',
    gap: spacing.sm,
    marginBottom: spacing.lg,
  },
  statCard: {
    flex: 1,
    borderRadius: borderRadius.xl,
    padding: spacing.md,
  },
  statTitle: {
    fontSize: 15,
    fontFamily: 'Nunito-SemiBold',
    marginBottom: spacing.sm,
  },
  statChart: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    gap: 4,
    height: 50,
    marginBottom: spacing.sm,
  },
  chartBar: {
    flex: 1,
    borderRadius: 4,
    minHeight: 8,
  },
  dotGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 4,
    marginBottom: spacing.sm,
  },
  dot: {
    width: 10,
    height: 10,
    borderRadius: 5,
  },
  statFooter: {
    fontSize: 11,
    fontFamily: 'Nunito-Regular',
  },
  sectionTitle: {
    fontSize: 24,
    fontFamily: 'Caveat-SemiBold',
    marginBottom: spacing.md,
    marginTop: spacing.sm,
  },
  dueItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: spacing.sm,
  },
  dueItemContent: {
    flex: 1,
  },
  dueItemName: {
    fontSize: 15,
    fontFamily: 'Nunito-SemiBold',
    marginBottom: 2,
  },
  dueItemTime: {
    fontSize: 13,
    fontFamily: 'Nunito-Regular',
  },
  checkButton: {
    width: 32,
    height: 32,
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
  },
  emptyCard: {
    borderRadius: borderRadius.xl,
    padding: spacing.lg,
    alignItems: 'center',
    gap: spacing.sm,
  },
  emptyText: {
    fontSize: 14,
    fontFamily: 'Nunito-Regular',
  },
  activityCard: {
    borderRadius: borderRadius.xl,
    padding: spacing.md,
    marginBottom: spacing.lg,
  },
  activityRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  activityItem: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    justifyContent: 'center',
  },
  activityDivider: {
    width: 1,
    height: 40,
    backgroundColor: 'rgba(0,0,0,0.1)',
  },
  activityValue: {
    fontSize: 20,
    fontFamily: 'Nunito-Bold',
  },
  activityLabel: {
    fontSize: 12,
    fontFamily: 'Nunito-Regular',
  },
  migraineCard: {
    borderRadius: borderRadius.xl,
    padding: spacing.md,
    marginBottom: spacing.lg,
  },
  migraineHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
  },
  migraineIconContainer: {
    width: 40,
    height: 40,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
  },
  migraineInfo: {
    flex: 1,
  },
  migraineTitle: {
    fontSize: 16,
    fontFamily: 'Nunito-SemiBold',
    marginBottom: 2,
  },
  migraineSubtitle: {
    fontSize: 13,
    fontFamily: 'Nunito-Regular',
  },
  migraineLastEntry: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: spacing.sm,
    paddingTop: spacing.sm,
    borderTopWidth: 1,
  },
  migraineLastLabel: {
    fontSize: 12,
    fontFamily: 'Nunito-Regular',
  },
  migraineLastDate: {
    fontSize: 13,
    fontFamily: 'Nunito-SemiBold',
  },
  quickActionsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.sm,
  },
  quickActionSmall: {
    width: '48%',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.xs,
    paddingVertical: spacing.md,
    borderRadius: borderRadius.xl,
  },
  quickActionSmallText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontFamily: 'Nunito-SemiBold',
  },
});
