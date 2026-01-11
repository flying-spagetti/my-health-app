/**
 * Profile Tab - Settings and User Information
 * 
 * Features:
 * - Theme preferences
 * - Data & Privacy settings
 * - Health stats overview
 * - App info
 */

import React, { useState, useEffect } from 'react';
import { 
  Alert, 
  ScrollView, 
  StyleSheet, 
  Text, 
  TouchableOpacity, 
  View 
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';

import { useThemePreference } from '@/hooks/use-theme-preference';
import { 
  getThemeTokens, 
  getScreenBackground,
  spacing,
  borderRadius,
  shadows,
} from '@/constants/theme';
import { IconSymbol } from '@/components/ui/icon-symbol';
import { 
  getBPReadings, 
  getMedications, 
  getJournalEntries,
} from '@/services/db';

export default function ProfileScreen() {
  const router = useRouter();
  const { colorScheme, preference, setPreference } = useThemePreference();
  const tokens = getThemeTokens(colorScheme);
  const backgroundColor = getScreenBackground('profile', colorScheme);

  const [stats, setStats] = useState({
    bpReadings: 0,
    medications: 0,
    journalEntries: 0,
    daysTracked: 0,
  });

  useEffect(() => {
    loadStats();
  }, []);

  const loadStats = async () => {
    try {
      const [bp, meds, journals] = await Promise.all([
        getBPReadings(),
        getMedications(),
        getJournalEntries(),
      ]);
      
      // Calculate days tracked (unique days with any entry)
      const allDates = new Set<string>();
      journals.forEach((j: any) => {
        allDates.add(new Date(j.entry_date).toDateString());
      });
      
      setStats({
        bpReadings: bp.length,
        medications: meds.length,
        journalEntries: journals.length,
        daysTracked: allDates.size,
      });
    } catch (error) {
      console.error('Error loading stats:', error);
    }
  };

  const handleExportData = () => {
    Alert.alert(
      'Coming Soon',
      'Data export (CSV/JSON) will be available in a future version.',
    );
  };

  const handleBiometricSettings = () => {
    Alert.alert(
      'Coming Soon',
      'Biometric lock will let you secure the app with Face ID or fingerprint in a future update.',
    );
  };

  const handleAbout = () => {
    Alert.alert(
      'About',
      'Version 1.0.0\nBuilt with care for your health journey.\n\nThis app is not a medical device and does not provide medical advice.',
    );
  };

  const themeOptions = [
    { id: 'system', label: 'System' },
    { id: 'light', label: 'Light' },
    { id: 'dark', label: 'Dark' },
  ] as const;

  return (
    <SafeAreaView 
      style={[styles.container, { backgroundColor }]} 
      edges={['top']}
    >
      <ScrollView 
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
      >
        {/* Header */}
        <View style={styles.header}>
          <Text style={[styles.title, { color: tokens.colors.textHandwritten }]}>
            Profile
          </Text>
          <Text style={[styles.subtitle, { color: tokens.colors.textSecondary }]}>
            Manage your settings
          </Text>
        </View>

        {/* User Card */}
        <View style={[styles.userCard, { backgroundColor: tokens.colors.card }, shadows.low]}>
          <View style={[styles.userAvatar, { backgroundColor: tokens.colors.primary }]}>
            <IconSymbol name="person.fill" size={32} color="#FFFFFF" />
          </View>
          <View style={styles.userInfo}>
            <Text style={[styles.userName, { color: tokens.colors.text }]}>
              User
            </Text>
            <Text style={[styles.userEmail, { color: tokens.colors.textMuted }]}>
              Your health journey
            </Text>
          </View>
        </View>

        {/* Appearance Section */}
        <View style={styles.section}>
          <Text style={[styles.sectionTitle, { color: tokens.colors.textHandwritten }]}>
            Appearance
          </Text>
          <View style={styles.themeOptions}>
            {themeOptions.map((option) => (
              <TouchableOpacity
                key={option.id}
                style={[
                  styles.themeChip,
                  { borderColor: tokens.colors.border },
                  preference === option.id && { 
                    backgroundColor: tokens.colors.primary,
                    borderColor: tokens.colors.primary,
                  },
                ]}
                onPress={() => setPreference(option.id)}
              >
                <Text
                  style={[
                    styles.themeChipText,
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

        {/* Stats Section */}
        <View style={styles.section}>
          <Text style={[styles.sectionTitle, { color: tokens.colors.textHandwritten }]}>
            Your Stats
          </Text>
          <View style={styles.statsGrid}>
            <View style={[styles.statCard, { backgroundColor: tokens.colors.card }, shadows.subtle]}>
              <Text style={[styles.statNumber, { color: tokens.colors.primary }]}>
                {stats.bpReadings}
              </Text>
              <Text style={[styles.statLabel, { color: tokens.colors.textMuted }]}>
                BP Readings
              </Text>
            </View>
            <View style={[styles.statCard, { backgroundColor: tokens.colors.card }, shadows.subtle]}>
              <Text style={[styles.statNumber, { color: tokens.colors.primary }]}>
                {stats.medications}
              </Text>
              <Text style={[styles.statLabel, { color: tokens.colors.textMuted }]}>
                Medications
              </Text>
            </View>
            <View style={[styles.statCard, { backgroundColor: tokens.colors.card }, shadows.subtle]}>
              <Text style={[styles.statNumber, { color: tokens.colors.primary }]}>
                {stats.journalEntries}
              </Text>
              <Text style={[styles.statLabel, { color: tokens.colors.textMuted }]}>
                Journal Entries
              </Text>
            </View>
            <View style={[styles.statCard, { backgroundColor: tokens.colors.card }, shadows.subtle]}>
              <Text style={[styles.statNumber, { color: tokens.colors.primary }]}>
                {stats.daysTracked}
              </Text>
              <Text style={[styles.statLabel, { color: tokens.colors.textMuted }]}>
                Days Tracked
              </Text>
            </View>
          </View>
        </View>

        {/* Data & Privacy Section */}
        <View style={styles.section}>
          <Text style={[styles.sectionTitle, { color: tokens.colors.textHandwritten }]}>
            Data & Privacy
          </Text>
          
          <TouchableOpacity 
            style={[styles.settingItem, { backgroundColor: tokens.colors.card }, shadows.subtle]} 
            onPress={handleExportData}
          >
            <View style={styles.settingContent}>
              <IconSymbol name="square.and.arrow.up" size={20} color={tokens.colors.primary} />
              <View style={styles.settingText}>
                <Text style={[styles.settingTitle, { color: tokens.colors.text }]}>
                  Export Data
                </Text>
                <Text style={[styles.settingSubtitle, { color: tokens.colors.textMuted }]}>
                  Download your health data
                </Text>
              </View>
            </View>
            <IconSymbol name="chevron.right" size={18} color={tokens.colors.textMuted} />
          </TouchableOpacity>

          <TouchableOpacity 
            style={[styles.settingItem, { backgroundColor: tokens.colors.card }, shadows.subtle]} 
            onPress={handleBiometricSettings}
          >
            <View style={styles.settingContent}>
              <IconSymbol name="faceid" size={20} color={tokens.colors.primary} />
              <View style={styles.settingText}>
                <Text style={[styles.settingTitle, { color: tokens.colors.text }]}>
                  Biometric Lock
                </Text>
                <Text style={[styles.settingSubtitle, { color: tokens.colors.textMuted }]}>
                  Secure with fingerprint/Face ID
                </Text>
              </View>
            </View>
            <IconSymbol name="chevron.right" size={18} color={tokens.colors.textMuted} />
          </TouchableOpacity>
        </View>

        {/* App Section */}
        <View style={styles.section}>
          <Text style={[styles.sectionTitle, { color: tokens.colors.textHandwritten }]}>
            App
          </Text>
          
          <TouchableOpacity 
            style={[styles.settingItem, { backgroundColor: tokens.colors.card }, shadows.subtle]} 
            onPress={handleAbout}
          >
            <View style={styles.settingContent}>
              <IconSymbol name="info.circle" size={20} color={tokens.colors.primary} />
              <View style={styles.settingText}>
                <Text style={[styles.settingTitle, { color: tokens.colors.text }]}>
                  About
                </Text>
                <Text style={[styles.settingSubtitle, { color: tokens.colors.textMuted }]}>
                  Version 1.0.0
                </Text>
              </View>
            </View>
            <IconSymbol name="chevron.right" size={18} color={tokens.colors.textMuted} />
          </TouchableOpacity>
        </View>

        {/* Disclaimer */}
        <Text style={[styles.disclaimer, { color: tokens.colors.textMuted }]}>
          This app helps you track your health data but cannot diagnose, treat, or prevent any
          disease. Always consult a healthcare professional with any concerns.
        </Text>
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
    marginBottom: spacing.xl,
  },
  title: {
    fontSize: 32,
    fontFamily: 'Caveat-SemiBold',
    marginBottom: spacing.xxs,
  },
  subtitle: {
    fontSize: 14,
    fontFamily: 'Nunito-Regular',
  },
  userCard: {
    borderRadius: borderRadius.xl,
    padding: spacing.md,
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    marginBottom: spacing.xl,
  },
  userAvatar: {
    width: 60,
    height: 60,
    borderRadius: 30,
    justifyContent: 'center',
    alignItems: 'center',
  },
  userInfo: {
    flex: 1,
  },
  userName: {
    fontSize: 20,
    fontFamily: 'Nunito-Bold',
    marginBottom: spacing.xxs,
  },
  userEmail: {
    fontSize: 14,
    fontFamily: 'Nunito-Regular',
  },
  section: {
    marginBottom: spacing.xl,
  },
  sectionTitle: {
    fontSize: 24,
    fontFamily: 'Caveat-SemiBold',
    marginBottom: spacing.md,
  },
  themeOptions: {
    flexDirection: 'row',
    gap: spacing.sm,
  },
  themeChip: {
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.sm,
    borderRadius: borderRadius.full,
    borderWidth: 1,
  },
  themeChipText: {
    fontSize: 14,
    fontFamily: 'Nunito-SemiBold',
  },
  statsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.sm,
  },
  statCard: {
    width: '48%',
    borderRadius: borderRadius.xl,
    padding: spacing.md,
    alignItems: 'center',
  },
  statNumber: {
    fontSize: 28,
    fontFamily: 'Nunito-Bold',
    marginBottom: spacing.xxs,
  },
  statLabel: {
    fontSize: 12,
    fontFamily: 'Nunito-Regular',
    textAlign: 'center',
  },
  settingItem: {
    borderRadius: borderRadius.xl,
    padding: spacing.md,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: spacing.sm,
  },
  settingContent: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    flex: 1,
  },
  settingText: {
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
  disclaimer: {
    fontSize: 12,
    fontFamily: 'Nunito-Regular',
    lineHeight: 18,
    textAlign: 'center',
    marginTop: spacing.lg,
  },
});
