import { getThemeTokens, tokens } from '@/constants/theme';
import { useRouter } from 'expo-router';
import React from 'react';
import { Alert, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useThemePreference } from '@/hooks/use-theme-preference';

export default function ProfileScreen() {
  const router = useRouter();
  const { colorScheme, preference, setPreference } = useThemePreference();
  const tokens = getThemeTokens(colorScheme);

  const handleExportData = () => {
    Alert.alert(
      'Coming soon',
      'Data export (CSV/JSON) will be available in a future version. For now, you can view your history in the app.',
    );
  };

  const handleBiometricSettings = () => {
    Alert.alert(
      'Coming soon',
      'Biometric lock will let you secure the app with Face ID or fingerprint in a future update.',
    );
  };

  const handleAbout = () => {
    Alert.alert(
      'About',
      'Version 1.0.0\nBuilt for Gnaneswar Lopinti.\nThis app is not a medical device and does not provide medical advice.',
    );
  };

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: tokens.colors.background }]} edges={['top', 'left', 'right', 'bottom']}>
      <ScrollView contentContainerStyle={[styles.content]}>
        <View style={styles.header}>
          <Text style={[styles.title, { color: tokens.colors.text }]}>Profile</Text>
          <Text style={[styles.subtitle, { color: tokens.colors.textMuted }]}>
            Manage your health data and settings
          </Text>
        </View>

        <View style={styles.section}>
          <Text style={[styles.sectionTitle, { color: tokens.colors.text }]}>
            Appearance
          </Text>
          <View style={{ flexDirection: 'row', gap: 8 }}>
            <TouchableOpacity
              style={[
                styles.chip,
                preference === 'system' && { backgroundColor: tokens.colors.primary },
              ]}
              onPress={() => setPreference('system')}
            >
              <Text
                style={[
                  styles.chipLabel,
                  preference === 'system'
                    ? { color: tokens.colors.background }
                    : { color: tokens.colors.textMuted },
                ]}
              >
                System
              </Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[
                styles.chip,
                preference === 'light' && { backgroundColor: tokens.colors.primary },
              ]}
              onPress={() => setPreference('light')}
            >
              <Text
                style={[
                  styles.chipLabel,
                  preference === 'light'
                    ? { color: tokens.colors.background }
                    : { color: tokens.colors.textMuted },
                ]}
              >
                Light
              </Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[
                styles.chip,
                preference === 'dark' && { backgroundColor: tokens.colors.primary },
              ]}
              onPress={() => setPreference('dark')}
            >
              <Text
                style={[
                  styles.chipLabel,
                  preference === 'dark'
                    ? { color: tokens.colors.background }
                    : { color: tokens.colors.textMuted },
                ]}
              >
                Dark
              </Text>
            </TouchableOpacity>
          </View>
        </View>

        <View style={styles.section}>
          <Text style={[styles.sectionTitle, { color: tokens.colors.text }]}>
            Data & Privacy
          </Text>
          
          <TouchableOpacity style={[styles.settingItem, { backgroundColor: tokens.colors.card }]} onPress={handleExportData}>
            <View style={styles.settingContent}>
              <Text style={[styles.settingTitle, { color: tokens.colors.text }]}>Export Data</Text>
              <Text style={[styles.settingSubtitle, { color: tokens.colors.textMuted }]}>
                Download your health data as CSV/JSON
              </Text>
            </View>
            <Text style={[styles.settingArrow, { color: tokens.colors.textMuted }]}>›</Text>
          </TouchableOpacity>

          <TouchableOpacity style={[styles.settingItem, { backgroundColor: tokens.colors.card }]} onPress={handleBiometricSettings}>
            <View style={styles.settingContent}>
              <Text style={[styles.settingTitle, { color: tokens.colors.text }]}>Biometric Lock</Text>
              <Text style={[styles.settingSubtitle, { color: tokens.colors.textMuted }]}>
                Secure your app with fingerprint/face ID
              </Text>
            </View>
            <Text style={styles.settingArrow}>›</Text>
          </TouchableOpacity>
        </View>

        <View style={styles.section}>
          <Text style={[styles.sectionTitle, { color: tokens.colors.text }]}>
            App
          </Text>
          
          <TouchableOpacity style={[styles.settingItem, { backgroundColor: tokens.colors.card }]} onPress={handleAbout}>
            <View style={styles.settingContent}>
              <Text style={[styles.settingTitle, { color: tokens.colors.text }]}>About</Text>
              <Text style={[styles.settingSubtitle, { color: tokens.colors.textMuted }]}>
                Version 1.0.0 • Built for Gnaneswar Lopinti
              </Text>
            </View>
            <Text style={styles.settingArrow}>›</Text>
          </TouchableOpacity>
        </View>

        <View style={styles.statsSection}>
          <Text style={[styles.sectionTitle, { color: tokens.colors.text }]}>
            Health Stats
          </Text>
          <View style={styles.statsGrid}>
            <View style={[styles.statCard, { backgroundColor: tokens.colors.card }]}>
              <Text style={[styles.statNumber, { color: tokens.colors.primary }]}>0</Text>
              <Text style={[styles.statLabel, { color: tokens.colors.textMuted }]}>BP Readings</Text>
            </View>
            <View style={[styles.statCard, { backgroundColor: tokens.colors.card }]}>
              <Text style={[styles.statNumber, { color: tokens.colors.primary }]}>0</Text>
              <Text style={[styles.statLabel, { color: tokens.colors.textMuted }]}>Medications</Text>
            </View>
            <View style={[styles.statCard, { backgroundColor: tokens.colors.card }]}>
              <Text style={[styles.statNumber, { color: tokens.colors.primary }]}>0</Text>
              <Text style={[styles.statLabel, { color: tokens.colors.textMuted }]}>Journal Entries</Text>
            </View>
            <View style={[styles.statCard, { backgroundColor: tokens.colors.card }]}>
              <Text style={[styles.statNumber, { color: tokens.colors.primary }]}>0</Text>
              <Text style={[styles.statLabel, { color: tokens.colors.textMuted }]}>Days Tracked</Text>
            </View>
          </View>
        </View>

        <View style={styles.section}>
          <Text style={[styles.sectionTitle, { color: tokens.colors.text }]}>
            Coming Soon
          </Text>
          <View style={[styles.settingItem, { backgroundColor: tokens.colors.card }]}>
            <View style={styles.settingContent}>
              <Text style={[styles.settingTitle, { color: tokens.colors.text }]}>
                Analytics & Trends
              </Text>
              <Text style={[styles.settingSubtitle, { color: tokens.colors.textMuted }]}>
                View charts for blood pressure, migraines, mood, and more.
              </Text>
            </View>
          </View>
          <View style={[styles.settingItem, { backgroundColor: tokens.colors.card }]}>
            <View style={styles.settingContent}>
              <Text style={[styles.settingTitle, { color: tokens.colors.text }]}>
                Reminders
              </Text>
              <Text style={[styles.settingSubtitle, { color: tokens.colors.textMuted }]}>
                Get gentle reminders for medications, supplements, and check-ins.
              </Text>
            </View>
          </View>
        </View>

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
    backgroundColor: tokens.colors.bg,
  },
  content: {
    padding: tokens.spacing.lg,
  },
  header: {
    marginBottom: tokens.spacing.xl,
  },
  title: {
    fontSize: tokens.typography.h1,
    fontWeight: '700',
    color: tokens.colors.text,
    marginBottom: tokens.spacing.xs,
  },
  subtitle: {
    fontSize: tokens.typography.body,
    color: tokens.colors.textMuted,
  },
  section: {
    marginBottom: tokens.spacing.xl,
  },
  sectionTitle: {
    fontSize: tokens.typography.h2,
    fontWeight: '600',
    color: tokens.colors.text,
    marginBottom: tokens.spacing.md,
  },
  settingItem: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: tokens.colors.card,
    borderRadius: tokens.borderRadius.md,
    padding: tokens.spacing.md,
    marginBottom: tokens.spacing.sm,
    ...tokens.shadows.sm,
  },
  settingContent: {
    flex: 1,
  },
  settingTitle: {
    fontSize: tokens.typography.body,
    fontWeight: '500',
    color: tokens.colors.text,
    marginBottom: tokens.spacing.xs,
  },
  settingSubtitle: {
    fontSize: tokens.typography.caption,
    color: tokens.colors.textMuted,
  },
  settingArrow: {
    fontSize: 20,
    color: tokens.colors.textMuted,
    marginLeft: tokens.spacing.sm,
  },
  statsSection: {
    marginBottom: tokens.spacing.xl,
  },
  statsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: tokens.spacing.md,
  },
  statCard: {
    backgroundColor: tokens.colors.card,
    borderRadius: tokens.borderRadius.md,
    padding: tokens.spacing.md,
    alignItems: 'center',
    minWidth: '45%',
    flex: 1,
    ...tokens.shadows.sm,
  },
  statNumber: {
    fontSize: tokens.typography.h1,
    fontWeight: '700',
    color: tokens.colors.primary,
    marginBottom: tokens.spacing.xs,
  },
  statLabel: {
    fontSize: tokens.typography.small,
    color: tokens.colors.textMuted,
    textAlign: 'center',
  },
  chip: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 999,
    borderWidth: 1,
    borderColor: tokens.colors.border,
  },
  chipLabel: {
    fontSize: tokens.typography.small,
    fontWeight: '500',
  },
  disclaimer: {
    marginTop: tokens.spacing.lg,
    fontSize: tokens.typography.caption,
    color: tokens.colors.textMuted,
  },
});
