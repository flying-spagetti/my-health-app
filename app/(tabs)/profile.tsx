/**
 * Profile Tab - User Profile and Settings
 * 
 * Features:
 * - Hero profile section with avatar and key stats
 * - Streak and achievements
 * - Health journey overview
 * - Theme preferences
 * - Data & Privacy settings
 */

import { useFocusEffect } from '@react-navigation/native';
import { Image } from 'expo-image';
import { useRouter } from 'expo-router';
import React, { useCallback, useState } from 'react';
import {
  Alert,
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
  getScreenBackground,
  getThemeTokens,
  shadows,
  spacing,
} from '@/constants/theme';
import { useThemePreference } from '@/hooks/use-theme-preference';
import {
  getBPReadings,
  getJournalEntries,
  getMedications,
  getMeditationLogs,
  getSupplements,
  getWorkouts,
} from '@/services/db';

export default function ProfileScreen() {
  const router = useRouter();
  const { colorScheme, preference, setPreference } = useThemePreference();
  const tokens = getThemeTokens(colorScheme);
  const backgroundColor = getScreenBackground('profile', colorScheme);

  const [stats, setStats] = useState({
    bpReadings: 0,
    medications: 0,
    supplements: 0,
    journalEntries: 0,
    meditationMinutes: 0,
    workouts: 0,
    daysTracked: 0,
    currentStreak: 0,
    longestStreak: 0,
  });

  useFocusEffect(
    useCallback(() => {
      loadStats();
    }, [])
  );

  const loadStats = async () => {
    try {
      const [bp, meds, supps, journals, meditations, workouts] = await Promise.all([
        getBPReadings(),
        getMedications(),
        getSupplements(),
        getJournalEntries(),
        getMeditationLogs(),
        getWorkouts(),
      ]);
      
      // Calculate total meditation minutes
      const totalMeditationMinutes = meditations.reduce((sum: number, s: any) => sum + (s.duration_minutes || 0), 0);
      
      // Calculate days tracked and streaks (unique days with any journal entry)
      const allDates = new Set<string>();
      const sortedDates: string[] = [];
      
      journals.forEach((j: any) => {
        const dateStr = new Date(j.entry_date).toDateString();
        if (!allDates.has(dateStr)) {
          allDates.add(dateStr);
          sortedDates.push(dateStr);
        }
      });
      
      // Calculate current streak
      let currentStreak = 0;
      let longestStreak = 0;
      let tempStreak = 0;
      
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      
      // Check if there's an entry today or yesterday
      const todayStr = today.toDateString();
      const yesterday = new Date(today);
      yesterday.setDate(yesterday.getDate() - 1);
      const yesterdayStr = yesterday.toDateString();
      
      if (allDates.has(todayStr) || allDates.has(yesterdayStr)) {
        // Count streak backwards from today
        let checkDate = allDates.has(todayStr) ? new Date(today) : new Date(yesterday);
        
        while (allDates.has(checkDate.toDateString())) {
          currentStreak++;
          checkDate.setDate(checkDate.getDate() - 1);
        }
      }
      
      // Calculate longest streak
      sortedDates.sort((a, b) => new Date(a).getTime() - new Date(b).getTime());
      
      for (let i = 0; i < sortedDates.length; i++) {
        if (i === 0) {
          tempStreak = 1;
        } else {
          const prevDate = new Date(sortedDates[i - 1]);
          const currDate = new Date(sortedDates[i]);
          const diffDays = Math.floor((currDate.getTime() - prevDate.getTime()) / (1000 * 60 * 60 * 24));
          
          if (diffDays === 1) {
            tempStreak++;
          } else {
            tempStreak = 1;
          }
        }
        longestStreak = Math.max(longestStreak, tempStreak);
      }
      
      setStats({
        bpReadings: bp.length,
        medications: meds.length,
        supplements: supps.length,
        journalEntries: journals.length,
        meditationMinutes: totalMeditationMinutes,
        workouts: workouts.length,
        daysTracked: allDates.size,
        currentStreak,
        longestStreak,
      });
    } catch (error) {
      // Error loading stats
    }
  };

  const handleExportData = () => {
    router.push('/doctor-visit');
  };

  const handleBiometricSettings = () => {
    Alert.alert(
      'Coming Soon',
      'Biometric lock inka cheyaledhu kada ra.',
    );
  };

  const handleAbout = () => {
    Alert.alert(
      'About',
      'Version 1.0.1\nEe version lo only kontha functionality ae chesam ga',
    );
  };

  const themeOptions = [
    { id: 'system', label: 'System', icon: 'gearshape' },
    { id: 'light', label: 'Light', icon: 'sun.max' },
    { id: 'dark', label: 'Dark', icon: 'moon.fill' },
  ] as const;

  // Health journey stats for display
  const journeyStats = [
    { 
      id: 'journal', 
      icon: 'book.fill', 
      value: stats.journalEntries, 
      label: 'Journal Entries',
      color: tokens.colors.accent,
    },
    { 
      id: 'meditation', 
      icon: 'leaf.fill', 
      value: stats.meditationMinutes, 
      label: 'Meditation Mins',
      color: tokens.colors.teal,
    },
    { 
      id: 'bp', 
      icon: 'heart.fill', 
      value: stats.bpReadings, 
      label: 'BP Readings',
      color: tokens.colors.coral,
    },
    { 
      id: 'workouts', 
      icon: 'figure.walk', 
      value: stats.workouts, 
      label: 'Workouts',
      color: tokens.colors.primary,
    },
  ];

  return (
    <SafeAreaView 
      style={[styles.container, { backgroundColor }]} 
      edges={['top']}
    >
      <ScrollView 
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
      >
        {/* Hero Profile Section */}
        <View style={[styles.heroCard, { backgroundColor: tokens.colors.card }, shadows.medium]}>
          {/* Profile Header */}
          <View style={styles.profileHeader}>
            <View style={[styles.avatarContainer, { borderColor: tokens.colors.primary }]}>
              {/* Profile image - using expo-image for better performance */}
              <Image 
                source={require('@/assets/images/profile-image.jpg')} 
                style={styles.avatarImage}
                contentFit="cover"
                transition={200}
              />
              {/* Online indicator */}
              <View style={[styles.onlineIndicator, { backgroundColor: tokens.colors.success }]} />
            </View>
            
            <View style={styles.profileInfo}>
              <Text style={[styles.profileName, { color: tokens.colors.text }]}>
                Gnaneswar
              </Text>
              <Text style={[styles.profileTagline, { color: tokens.colors.textMuted }]}>
                Trying to be a good human, one day at a time.
              </Text>
              <View style={styles.memberSince}>
                <IconSymbol name="calendar" size={12} color={tokens.colors.textMuted} />
                <Text style={[styles.memberSinceText, { color: tokens.colors.textMuted }]}>
                  Member since Jan 2026
                </Text>
              </View>
            </View>
          </View>

          {/* Streak Banner */}
          <View style={[styles.streakBanner, { backgroundColor: tokens.colors.primary + '15' }]}>
            <View style={styles.streakItem}>
              <Text style={[styles.streakEmoji]}>🔥</Text>
              <View>
                <Text style={[styles.streakValue, { color: tokens.colors.primary }]}>
                  {stats.currentStreak}
                </Text>
                <Text style={[styles.streakLabel, { color: tokens.colors.textMuted }]}>
                  Day Streak
                </Text>
              </View>
            </View>
            
            <View style={[styles.streakDivider, { backgroundColor: tokens.colors.border }]} />
            
            <View style={styles.streakItem}>
              <Text style={[styles.streakEmoji]}>🏆</Text>
              <View>
                <Text style={[styles.streakValue, { color: tokens.colors.accent }]}>
                  {stats.longestStreak}
                </Text>
                <Text style={[styles.streakLabel, { color: tokens.colors.textMuted }]}>
                  Best Streak
                </Text>
              </View>
            </View>
            
            <View style={[styles.streakDivider, { backgroundColor: tokens.colors.border }]} />
            
            <View style={styles.streakItem}>
              <Text style={[styles.streakEmoji]}>🌟</Text>
              <View>
                <Text style={[styles.streakValue, { color: tokens.colors.teal }]}>
                  {stats.daysTracked}
                </Text>
                <Text style={[styles.streakLabel, { color: tokens.colors.textMuted }]}>
                  Days Active
                </Text>
              </View>
            </View>
          </View>
        </View>

        {/* Health Journey Section */}
        <View style={styles.section}>
          <Text style={[styles.sectionTitle, { color: tokens.colors.textHandwritten }]}>
            Your Health Journey
          </Text>
          
          <View style={styles.journeyGrid}>
            {journeyStats.map((stat) => (
              <View 
                key={stat.id}
                style={[styles.journeyCard, { backgroundColor: tokens.colors.card }, shadows.subtle]}
              >
                <View style={[styles.journeyIconContainer, { backgroundColor: stat.color + '20' }]}>
                  <IconSymbol name={stat.icon as any} size={20} color={stat.color} />
                </View>
                <Text style={[styles.journeyValue, { color: tokens.colors.text }]}>
                  {stat.value}
                </Text>
                <Text style={[styles.journeyLabel, { color: tokens.colors.textMuted }]}>
                  {stat.label}
                </Text>
              </View>
            ))}
          </View>
        </View>

        {/* Active Tracking Section */}
        <View style={styles.section}>
          <Text style={[styles.sectionTitle, { color: tokens.colors.textHandwritten }]}>
            Active Tracking
          </Text>
          
          <View style={[styles.trackingCard, { backgroundColor: tokens.colors.card }, shadows.subtle]}>
            <View style={styles.trackingRow}>
              <View style={styles.trackingItem}>
                <IconSymbol name="pills.fill" size={18} color={tokens.colors.primary} />
                <Text style={[styles.trackingValue, { color: tokens.colors.text }]}>
                  {stats.medications}
                </Text>
                <Text style={[styles.trackingLabel, { color: tokens.colors.textMuted }]}>
                  Medications
                </Text>
              </View>
              
              <View style={[styles.trackingDivider, { backgroundColor: tokens.colors.border }]} />
              
              <View style={styles.trackingItem}>
                <IconSymbol name="leaf.fill" size={18} color={tokens.colors.teal} />
                <Text style={[styles.trackingValue, { color: tokens.colors.text }]}>
                  {stats.supplements}
                </Text>
                <Text style={[styles.trackingLabel, { color: tokens.colors.textMuted }]}>
                  Supplements
                </Text>
              </View>
            </View>
          </View>
        </View>

        {/* Appearance Section */}
        <View style={styles.section}>
          <Text style={[styles.sectionTitle, { color: tokens.colors.textHandwritten }]}>
            Appearance
          </Text>
          
          <View style={[styles.themeCard, { backgroundColor: tokens.colors.card }, shadows.subtle]}>
            <View style={styles.themeOptions}>
              {themeOptions.map((option) => (
                <TouchableOpacity
                  key={option.id}
                  style={[
                    styles.themeOption,
                    { borderColor: tokens.colors.border },
                    preference === option.id && { 
                      backgroundColor: tokens.colors.primary,
                      borderColor: tokens.colors.primary,
                    },
                  ]}
                  onPress={() => setPreference(option.id)}
                  activeOpacity={0.7}
                >
                  <IconSymbol 
                    name={option.icon as any} 
                    size={20} 
                    color={preference === option.id ? '#FFFFFF' : tokens.colors.textMuted} 
                  />
                  <Text
                    style={[
                      styles.themeOptionText,
                      { color: tokens.colors.textMuted },
                      preference === option.id && { color: '#FFFFFF' },
                    ]}
                  >
                    {option.label}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>
        </View>

        {/* Settings Section */}
        <View style={styles.section}>
          <Text style={[styles.sectionTitle, { color: tokens.colors.textHandwritten }]}>
            Settings
          </Text>
          
          <TouchableOpacity 
            style={[styles.settingItem, { backgroundColor: tokens.colors.card }, shadows.subtle]} 
            onPress={handleExportData}
            activeOpacity={0.7}
          >
            <View style={[styles.settingIcon, { backgroundColor: tokens.colors.accent + '20' }]}>
              <IconSymbol name="square.and.arrow.up" size={18} color={tokens.colors.accent} />
            </View>
            <View style={styles.settingContent}>
                <Text style={[styles.settingTitle, { color: tokens.colors.text }]} onPress={() => router.push('/doctor-visit')}>
                Export Data
              </Text>
              <Text style={[styles.settingSubtitle, { color: tokens.colors.textMuted }]}>
                Download your health data as CSV/JSON
              </Text>
            </View>
            <IconSymbol name="chevron.right" size={16} color={tokens.colors.textMuted} />
          </TouchableOpacity>

          <TouchableOpacity 
            style={[styles.settingItem, { backgroundColor: tokens.colors.card }, shadows.subtle]} 
            onPress={handleBiometricSettings}
            activeOpacity={0.7}
          >
            <View style={[styles.settingIcon, { backgroundColor: tokens.colors.teal + '20' }]}>
              <IconSymbol name="faceid" size={18} color={tokens.colors.teal} />
            </View>
            <View style={styles.settingContent}>
              <Text style={[styles.settingTitle, { color: tokens.colors.text }]}>
                Biometric Lock
              </Text>
              <Text style={[styles.settingSubtitle, { color: tokens.colors.textMuted }]}>
                Secure with fingerprint or Face ID
              </Text>
            </View>
            <IconSymbol name="chevron.right" size={16} color={tokens.colors.textMuted} />
          </TouchableOpacity>

          <TouchableOpacity 
            style={[styles.settingItem, { backgroundColor: tokens.colors.card }, shadows.subtle]} 
            onPress={handleAbout}
            activeOpacity={0.7}
          >
            <View style={[styles.settingIcon, { backgroundColor: tokens.colors.coral + '20' }]}>
              <IconSymbol name="info.circle" size={18} color={tokens.colors.coral} />
            </View>
            <View style={styles.settingContent}>
              <Text style={[styles.settingTitle, { color: tokens.colors.text }]}>
                About
              </Text>
              <Text style={[styles.settingSubtitle, { color: tokens.colors.textMuted }]}>
                Version 1.0.1 •Developed by Flying-spagetti 
              </Text>
            </View>
            <IconSymbol name="chevron.right" size={16} color={tokens.colors.textMuted} />
          </TouchableOpacity>
        </View>

        {/* Disclaimer */}
        <View style={[styles.disclaimerCard, { backgroundColor: tokens.colors.surface }]}>
          <IconSymbol name="heart.text.square" size={20} color={tokens.colors.textMuted} />
          <Text style={[styles.disclaimer, { color: tokens.colors.textMuted }]}>
            This is app bro, don't expect it to be perfect, afterall manam ae perfect kadhu.
          </Text>
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
  
  // Hero Profile Section
  heroCard: {
    borderRadius: borderRadius.xxl,
    padding: spacing.lg,
    marginBottom: spacing.xl,
  },
  profileHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    marginBottom: spacing.lg,
  },
  avatarContainer: {
    width: 80,
    height: 80,
    borderRadius: 40,
    borderWidth: 3,
    padding: 2,
    position: 'relative',
  },
  avatarImage: {
    width: '100%',
    height: '100%',
    borderRadius: 36,
  },
  onlineIndicator: {
    position: 'absolute',
    bottom: 4,
    right: 4,
    width: 16,
    height: 16,
    borderRadius: 8,
    borderWidth: 2,
    borderColor: '#FFFFFF',
  },
  profileInfo: {
    flex: 1,
  },
  profileName: {
    fontSize: 24,
    fontFamily: 'Nunito-Bold',
    marginBottom: 2,
  },
  profileTagline: {
    fontSize: 14,
    fontFamily: 'Nunito-Regular',
    marginBottom: spacing.xs,
  },
  memberSince: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  memberSinceText: {
    fontSize: 12,
    fontFamily: 'Nunito-Regular',
  },
  
  // Streak Banner
  streakBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-around',
    borderRadius: borderRadius.xl,
    padding: spacing.md,
  },
  streakItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
  },
  streakEmoji: {
    fontSize: 24,
  },
  streakValue: {
    fontSize: 20,
    fontFamily: 'Nunito-Bold',
  },
  streakLabel: {
    fontSize: 11,
    fontFamily: 'Nunito-Regular',
  },
  streakDivider: {
    width: 1,
    height: 36,
  },
  
  // Section
  section: {
    marginBottom: spacing.xl,
  },
  sectionTitle: {
    fontSize: 24,
    fontFamily: 'Caveat-SemiBold',
    marginBottom: spacing.md,
  },
  
  // Health Journey Grid
  journeyGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.sm,
  },
  journeyCard: {
    width: '48%',
    borderRadius: borderRadius.xl,
    padding: spacing.md,
    alignItems: 'center',
  },
  journeyIconContainer: {
    width: 44,
    height: 44,
    borderRadius: 22,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: spacing.sm,
  },
  journeyValue: {
    fontSize: 24,
    fontFamily: 'Nunito-Bold',
    marginBottom: 2,
  },
  journeyLabel: {
    fontSize: 12,
    fontFamily: 'Nunito-Regular',
    textAlign: 'center',
  },
  
  // Active Tracking
  trackingCard: {
    borderRadius: borderRadius.xl,
    padding: spacing.lg,
  },
  trackingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-around',
  },
  trackingItem: {
    alignItems: 'center',
    gap: spacing.xs,
  },
  trackingValue: {
    fontSize: 28,
    fontFamily: 'Nunito-Bold',
  },
  trackingLabel: {
    fontSize: 12,
    fontFamily: 'Nunito-Regular',
  },
  trackingDivider: {
    width: 1,
    height: 50,
  },
  
  // Theme Options
  themeCard: {
    borderRadius: borderRadius.xl,
    padding: spacing.md,
  },
  themeOptions: {
    flexDirection: 'row',
    gap: spacing.sm,
  },
  themeOption: {
    flex: 1,
    flexDirection: 'column',
    alignItems: 'center',
    gap: spacing.xs,
    paddingVertical: spacing.md,
    borderRadius: borderRadius.lg,
    borderWidth: 1,
  },
  themeOptionText: {
    fontSize: 13,
    fontFamily: 'Nunito-SemiBold',
  },
  
  // Settings
  settingItem: {
    borderRadius: borderRadius.xl,
    padding: spacing.md,
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    marginBottom: spacing.sm,
  },
  settingIcon: {
    width: 40,
    height: 40,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
  },
  settingContent: {
    flex: 1,
  },
  settingTitle: {
    fontSize: 15,
    fontFamily: 'Nunito-SemiBold',
    marginBottom: 2,
  },
  settingSubtitle: {
    fontSize: 13,
    fontFamily: 'Nunito-Regular',
  },
  
  // Disclaimer
  disclaimerCard: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: spacing.sm,
    borderRadius: borderRadius.lg,
    padding: spacing.md,
    marginTop: spacing.md,
  },
  disclaimer: {
    flex: 1,
    fontSize: 12,
    fontFamily: 'Nunito-Regular',
    lineHeight: 18,
  },
});
