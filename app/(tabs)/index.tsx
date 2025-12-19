import React, { useCallback, useEffect, useState } from 'react';
import { RefreshControl, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { useFocusEffect } from '@react-navigation/native';
import { useThemePreference } from '@/hooks/use-theme-preference';
import { getThemeTokens } from '@/constants/theme';
import { IconSymbol } from '@/components/ui/icon-symbol';
import StreakCard from '@/components/StreakCard';
import ActivityFilterTabs from '@/components/ActivityFilterTabs';
import ActivityBarChart from '@/components/ActivityBarChart';
import ActivityCard from '@/components/ActivityCard';
import CurrentActivityCard from '@/components/CurrentActivityCard';
import { getActivityAggregates, getWorkouts, getSteps } from '@/services/db';
import { getDueItemsToday, DueItem } from '@/services/tracking';
import { createTrackingEvent } from '@/services/db';

type FilterPeriod = 'week' | 'month' | 'year' | 'all';

export default function ActivitiesScreen() {
  const router = useRouter();
  const [selectedPeriod, setSelectedPeriod] = useState<FilterPeriod>('week');
  const [activityData, setActivityData] = useState<Array<{ day: string; value: number; date: number }>>([]);
  const [latestActivities, setLatestActivities] = useState<any[]>([]);
  const [currentActivity, setCurrentActivity] = useState<any | null>(null);
  const [streak, setStreak] = useState(24);
  const [showStreakCard, setShowStreakCard] = useState(true);
  const [isLoading, setIsLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const { colorScheme } = useThemePreference();
  const tokens = getThemeTokens(colorScheme);

  const loadData = useCallback(async () => {
    try {
      const [aggregates, workouts, steps] = await Promise.all([
        getActivityAggregates(selectedPeriod),
        getWorkouts(),
        getSteps(),
      ]);

      setActivityData(aggregates);

      // Get latest activities
      const recentWorkouts = workouts.slice(0, 2);
      const recentSteps = steps.slice(0, 1);
      setLatestActivities([...recentWorkouts, ...recentSteps]);

      // Check for current/active workout (started but not ended)
      const activeWorkout = workouts.find(
        (w: any) => w.started_at && !w.ended_at && (Date.now() - w.started_at < 24 * 60 * 60 * 1000)
      );
      setCurrentActivity(activeWorkout || null);

      // Calculate streak from tracking data
      const dueItems = await getDueItemsToday();
      const completedToday = dueItems.filter((item) => item.status === 'done').length;
      if (completedToday > 0) {
        // In a real app, you'd calculate this from historical data
        setStreak(24);
      }
    } catch (error) {
      console.error('Error loading activities:', error);
    } finally {
      setIsLoading(false);
      setRefreshing(false);
    }
  }, [selectedPeriod]);

  useFocusEffect(
    useCallback(() => {
      loadData();
    }, [loadData])
  );

  const onRefresh = useCallback(() => {
    setRefreshing(true);
    loadData();
  }, [loadData]);

  const formatDistance = (meters: number): string => {
    if (meters >= 1000) {
      return `${(meters / 1000).toFixed(1)} km`;
    }
    return `${meters} m`;
  };

  const formatDate = (timestamp: number): string => {
    const date = new Date(timestamp);
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
  };

  const getActivityIcon = (type: string): string => {
    const iconMap: Record<string, string> = {
      cycling: 'bicycle',
      running: 'figure.run',
      walking: 'figure.walk',
      swimming: 'figure.pool.swim',
      yoga: 'figure.yoga',
      workout: 'dumbbell.fill',
      default: 'figure.run',
    };
    // Map to available icon names
    const mapped = iconMap[type.toLowerCase()] || iconMap.default;
    // For Android/web, use Material Icons names that are mapped
    return mapped;
  };

  const getActivityColor = (type: string): string => {
    const colorMap: Record<string, string> = {
      cycling: '#3B82F6',
      running: '#EF4444',
      walking: '#10B981',
      swimming: '#06B6D4',
      yoga: '#8B5CF6',
      workout: '#F59E0B',
      default: '#3B82F6',
    };
    return colorMap[type.toLowerCase()] || colorMap.default;
  };

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: tokens.colors.background }} edges={['top']}>
      {/* Header */}
      <View style={[styles.header, { backgroundColor: tokens.colors.background }]}>
        <View style={styles.headerLeft}>
          <View style={[styles.profileIcon, { backgroundColor: tokens.colors.primary }]}>
            <IconSymbol name="person.fill" size={20} color="#FFFFFF" />
          </View>
          <View>
            <Text style={[styles.welcomeText, { color: tokens.colors.text }]}>Welcome back,</Text>
            <Text style={[styles.userName, { color: tokens.colors.text }]}>User</Text>
          </View>
        </View>
        <View style={styles.headerRight}>
          <TouchableOpacity style={styles.iconButton}>
            <IconSymbol name="gearshape.fill" size={24} color={tokens.colors.text} />
          </TouchableOpacity>
          <TouchableOpacity
            style={styles.iconButton}
            onPress={() => router.push('/add-medication')}
          >
            <IconSymbol name="plus" size={24} color={tokens.colors.text} />
          </TouchableOpacity>
        </View>
      </View>

      <ScrollView
        contentContainerStyle={[styles.content, { backgroundColor: tokens.colors.background }]}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={tokens.colors.primary} />}
      >
        {/* Streak Card */}
        {showStreakCard && (
          <StreakCard
            streak={streak}
            message="You're on a roll with your streak"
            reminder="Remember, while your sleep counted towards it, don't forget to hit your daily goals too"
            onDismiss={() => setShowStreakCard(false)}
          />
        )}

        {/* Activity Filter Tabs */}
        <ActivityFilterTabs selected={selectedPeriod} onSelect={setSelectedPeriod} />

        {/* Activity Bar Chart */}
        {activityData.length > 0 && (
          <ActivityBarChart data={activityData} period={selectedPeriod} />
        )}

        {/* Latest Data Section */}
        <View style={styles.latestDataSection}>
          <TouchableOpacity style={styles.allActivitiesLink}>
            <Text style={[styles.allActivitiesText, { color: tokens.colors.primary }]}>
              ALL ACTIVITIES
            </Text>
          </TouchableOpacity>

          <View style={styles.activityCardsRow}>
            {latestActivities.length > 0 ? (
              latestActivities.slice(0, 2).map((activity, index) => {
                if (activity.workout_type) {
                  // Workout activity
                  return (
                    <ActivityCard
                      key={activity.id || index}
                      title="TODAY"
                      value={formatDistance((activity.duration || 0) * 100)} // Approximate distance
                      icon={getActivityIcon(activity.workout_type)}
                      iconColor={getActivityColor(activity.workout_type)}
                      subtitle={activity.workout_type}
                    />
                  );
                } else if (activity.steps) {
                  // Steps activity
                  return (
                    <ActivityCard
                      key={activity.id || index}
                      title="TODAY"
                      value={formatDistance(activity.steps * 0.7)} // Approximate distance from steps
                      icon="figure.walk"
                      iconColor="#10B981"
                      subtitle="Walking"
                    />
                  );
                } else {
                  // Default activity card
                  return (
                    <ActivityCard
                      key={activity.id || index}
                      title={formatDate(activity.date || Date.now()).toUpperCase()}
                      value="0.00 km"
                      icon="moon.fill"
                      iconColor="#6B7280"
                      subtitle="No activities"
                    />
                  );
                }
                return null;
              })
            ) : (
              <>
                <ActivityCard
                  title="TODAY"
                  value="0.00 km"
                  icon="bicycle"
                  iconColor="#3B82F6"
                  subtitle="No activities"
                />
                <ActivityCard
                  title={formatDate(Date.now()).toUpperCase()}
                  value="0.00 km"
                  icon="moon.fill"
                  iconColor="#6B7280"
                  subtitle="No activities"
                />
              </>
            )}
          </View>
        </View>

        {/* Current Activity Card */}
        {currentActivity && (
          <CurrentActivityCard
            activityName={currentActivity.workout_type || 'Activity'}
            icon={getActivityIcon(currentActivity.workout_type)}
            timeRange={`${new Date(currentActivity.started_at).toLocaleTimeString('en-US', {
              hour: '2-digit',
              minute: '2-digit',
            })} - Now`}
            calories={currentActivity.calories_burned}
            distance={formatDistance((currentActivity.duration || 0) * 100)}
          />
        )}

        {/* Due Items Section (simplified) */}
        <View style={styles.dueItemsSection}>
          <Text style={[styles.sectionTitle, { color: tokens.colors.text }]}>Due Today</Text>
          <DueItemsList />
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

// Simplified Due Items Component
function DueItemsList() {
  const router = useRouter();
  const [dueItems, setDueItems] = useState<DueItem[]>([]);
  const { colorScheme } = useThemePreference();
  const tokens = getThemeTokens(colorScheme);

  useEffect(() => {
    loadDueItems();
  }, []);

  const loadDueItems = async () => {
    try {
      const items = await getDueItemsToday();
      setDueItems(items.slice(0, 5)); // Show only first 5
    } catch (error) {
      console.error('Error loading due items:', error);
    }
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
      await loadDueItems();
    } catch (error) {
      console.error('Error marking item done:', error);
    }
  };

  if (dueItems.length === 0) {
    return (
      <View style={styles.emptyDueItems}>
        <Text style={[styles.emptyText, { color: tokens.colors.textMuted }]}>
          Nothing due today
        </Text>
      </View>
    );
  }

  return (
    <View style={styles.dueItemsList}>
      {dueItems.map((item) => (
        <TouchableOpacity
          key={`${item.id}-${item.scheduleId || ''}`}
          style={[styles.dueItem, { backgroundColor: tokens.colors.elevatedSurface, borderColor: tokens.colors.border }]}
          onPress={() => {
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
        >
          <View style={styles.dueItemContent}>
            <Text style={[styles.dueItemName, { color: tokens.colors.text }]}>{item.name}</Text>
            {item.timeOfDay && (
              <Text style={[styles.dueItemTime, { color: tokens.colors.textMuted }]}>
                {item.timeOfDay}
              </Text>
            )}
          </View>
          {item.status !== 'done' && (
            <TouchableOpacity
              style={[styles.markDoneButton, { backgroundColor: tokens.colors.primary }]}
              onPress={() => handleMarkDone(item)}
            >
              <Text style={styles.markDoneText}>✓</Text>
            </TouchableOpacity>
          )}
        </TouchableOpacity>
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 24,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  profileIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
  },
  welcomeText: {
    fontSize: 12,
    fontWeight: '500',
  },
  userName: {
    fontSize: 18,
    fontWeight: '700',
  },
  headerRight: {
    flexDirection: 'row',
    gap: 16,
  },
  iconButton: {
    padding: 4,
  },
  content: {
    padding: 24,
    paddingBottom: 32,
  },
  latestDataSection: {
    marginTop: 8,
    marginBottom: 24,
  },
  allActivitiesLink: {
    marginBottom: 12,
  },
  allActivitiesText: {
    fontSize: 12,
    fontWeight: '700',
    letterSpacing: 0.5,
  },
  activityCardsRow: {
    flexDirection: 'row',
    gap: 8,
  },
  dueItemsSection: {
    marginTop: 24,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '700',
    marginBottom: 16,
  },
  dueItemsList: {
    gap: 12,
  },
  dueItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    borderRadius: 16,
    borderWidth: 1,
  },
  dueItemContent: {
    flex: 1,
  },
  dueItemName: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 4,
  },
  dueItemTime: {
    fontSize: 14,
  },
  markDoneButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    justifyContent: 'center',
    alignItems: 'center',
  },
  markDoneText: {
    color: '#FFFFFF',
    fontSize: 18,
    fontWeight: '700',
  },
  emptyDueItems: {
    paddingVertical: 24,
    alignItems: 'center',
  },
  emptyText: {
    fontSize: 14,
  },
});
