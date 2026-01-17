/**
 * Health Tab - Medical Tracking (BP, Medications, Migraines, Supplements)
 * 
 * Features:
 * - Quick stats grid (BP, Meds, Migraines, Appointments)
 * - Medications list with quick actions
 * - Supplements list
 * - Quick action buttons
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
import FontAwesome5 from '@expo/vector-icons/FontAwesome5';

import { useThemePreference } from '@/hooks/use-theme-preference';
import { 
  getThemeTokens, 
  getScreenBackground,
  spacing,
  borderRadius,
  shadows,
} from '@/constants/theme';
import { 
  getMedications, 
  getSupplements, 
  getLatestBP,
  getMigraineReadings,
  getAppointments,
} from '@/services/db';
import { IconSymbol } from '@/components/ui/icon-symbol';

export default function HealthScreen() {
  const router = useRouter();
  const { colorScheme } = useThemePreference();
  const tokens = getThemeTokens(colorScheme);
  const backgroundColor = getScreenBackground('health', colorScheme);
  
  const [medications, setMedications] = useState<any[]>([]);
  const [supplements, setSupplements] = useState<any[]>([]);
  const [latestBP, setLatestBP] = useState<any>(null);
  const [migraineCount, setMigraineCount] = useState(0);
  const [upcomingAppointments, setUpcomingAppointments] = useState(0);
  const [isLoading, setIsLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const loadData = async () => {
    try {
      const [medsData, suppsData, bpData, migrainesData, appointmentsData] = await Promise.all([
        getMedications(true),
        getSupplements(true),
        getLatestBP(),
        getMigraineReadings(),
        getAppointments(true),
      ]);
      
      setMedications(medsData);
      setSupplements(suppsData);
      setLatestBP(bpData);
      
      // Count migraines this month
      const monthAgo = Date.now() - 30 * 24 * 60 * 60 * 1000;
      setMigraineCount(migrainesData.filter((m: any) => m.started_at >= monthAgo).length);
      
      setUpcomingAppointments(appointmentsData.length);
    } catch (error) {
      console.error('Error loading health data:', error);
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

  // Quick stat cards data
  const statCards = [
    {
      id: 'bp',
      icon: 'heartbeat',
      iconColor: tokens.colors.danger,
      label: 'Blood Pressure',
      value: latestBP ? `${latestBP.systolic}/${latestBP.diastolic}` : '---',
      onPress: () => router.push('/bp-history'),
    },
    {
      id: 'meds',
      icon: 'pills',
      iconColor: tokens.colors.primary,
      label: 'Medications',
      value: `${medications.length} active`,
      onPress: () => router.push('/add-medication'),
    },
    {
      id: 'migraines',
      icon: 'brain',
      iconColor: tokens.colors.warning,
      label: 'Migraines',
      value: `${migraineCount} this month`,
      onPress: () => router.push('/migraine-tracker'),
    },
    {
      id: 'appointments',
      icon: 'calendar',
      iconColor: tokens.colors.teal,
      label: 'Appointments',
      value: `${upcomingAppointments} upcoming`,
      onPress: () => router.push('/appointment-tracker'),
    },
  ];

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
            Health Tracking
          </Text>
          <Text style={[styles.subtitle, { color: tokens.colors.textSecondary }]}>
            Manage your health data
          </Text>
        </View>

        {/* Quick Stats Grid */}
        <View style={styles.statsGrid}>
          {statCards.map((stat) => (
            <TouchableOpacity
              key={stat.id}
              style={[styles.statCard, { backgroundColor: tokens.colors.card }, shadows.low]}
              onPress={stat.onPress}
              activeOpacity={0.7}
            >
              <FontAwesome5 name={stat.icon} size={24} color={stat.iconColor} />
              <Text style={[styles.statValue, { color: tokens.colors.text }]}>
                {stat.value}
              </Text>
              <Text style={[styles.statLabel, { color: tokens.colors.textMuted }]}>
                {stat.label}
              </Text>
            </TouchableOpacity>
          ))}
        </View>

        {/* Medications Section */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={[styles.sectionTitle, { color: tokens.colors.textHandwritten }]}>
              Medications
            </Text>
            <TouchableOpacity onPress={() => router.push('/add-medication')}>
              <Text style={[styles.addLink, { color: tokens.colors.primary }]}>
                + Add
              </Text>
            </TouchableOpacity>
          </View>
          
          {medications.length > 0 ? (
            medications.map((med) => (
              <TouchableOpacity
                key={med.id}
                style={[styles.itemCard, { backgroundColor: tokens.colors.card }, shadows.low]}
                onPress={() => router.push(`/med-tracker?id=${med.id}`)}
                activeOpacity={0.7}
              >
                <View style={[styles.itemIcon, { backgroundColor: tokens.colors.primary + '20' }]}>
                  <IconSymbol name="pills.fill" size={20} color={tokens.colors.primary} />
                </View>
                <View style={styles.itemContent}>
                  <Text style={[styles.itemName, { color: tokens.colors.text }]}>
                    {med.name}
                  </Text>
                  <Text style={[styles.itemDetail, { color: tokens.colors.textMuted }]}>
                    {med.dosage}
                  </Text>
                </View>
                <IconSymbol name="chevron.right" size={18} color={tokens.colors.textMuted} />
              </TouchableOpacity>
            ))
          ) : (
            <View style={[styles.emptyCard, { backgroundColor: tokens.colors.card }, shadows.low]}>
              <Text style={[styles.emptyText, { color: tokens.colors.textMuted }]}>
                No medications added yet
              </Text>
            </View>
          )}
        </View>

        {/* Supplements Section */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={[styles.sectionTitle, { color: tokens.colors.textHandwritten }]}>
              Supplements
            </Text>
            <TouchableOpacity onPress={() => router.push('/add-supplement')}>
              <Text style={[styles.addLink, { color: tokens.colors.primary }]}>
                + Add
              </Text>
            </TouchableOpacity>
          </View>
          
          {supplements.length > 0 ? (
            supplements.map((supp) => (
              <TouchableOpacity
                key={supp.id}
                style={[styles.itemCard, { backgroundColor: tokens.colors.card }, shadows.low]}
                onPress={() => router.push(`/supplement-tracker?id=${supp.id}`)}
                activeOpacity={0.7}
              >
                <View style={[styles.itemIcon, { backgroundColor: tokens.colors.teal + '20' }]}>
                  <IconSymbol name="leaf.fill" size={20} color={tokens.colors.teal} />
                </View>
                <View style={styles.itemContent}>
                  <Text style={[styles.itemName, { color: tokens.colors.text }]}>
                    {supp.name}
                  </Text>
                  <Text style={[styles.itemDetail, { color: tokens.colors.textMuted }]}>
                    {supp.dosage}
                  </Text>
                </View>
                <IconSymbol name="chevron.right" size={18} color={tokens.colors.textMuted} />
              </TouchableOpacity>
            ))
          ) : (
            <View style={[styles.emptyCard, { backgroundColor: tokens.colors.card }, shadows.low]}>
              <Text style={[styles.emptyText, { color: tokens.colors.textMuted }]}>
                No supplements added yet
              </Text>
            </View>
          )}
        </View>

        {/* Quick Actions */}
        <View style={styles.section}>
          <Text style={[styles.sectionTitle, { color: tokens.colors.textHandwritten }]}>
            Quick Actions
          </Text>
          
          <View style={styles.quickActionsGrid}>
            <TouchableOpacity
              style={[styles.quickAction, { backgroundColor: tokens.colors.card }, shadows.low]}
              onPress={() => router.push('/add-bp')}
              activeOpacity={0.7}
            >
              <FontAwesome5 name="heartbeat" size={24} color={tokens.colors.danger} />
              <Text style={[styles.quickActionText, { color: tokens.colors.text }]}>
                Log BP
              </Text>
            </TouchableOpacity>
            
            <TouchableOpacity
              style={[styles.quickAction, { backgroundColor: tokens.colors.card }, shadows.low]}
              onPress={() => router.push('/add-migraine')}
              activeOpacity={0.7}
            >
              <FontAwesome5 name="brain" size={24} color={tokens.colors.warning} />
              <Text style={[styles.quickActionText, { color: tokens.colors.text }]}>
                Log Migraine
              </Text>
            </TouchableOpacity>
            
            <TouchableOpacity
              style={[styles.quickAction, { backgroundColor: tokens.colors.card }, shadows.low]}
              onPress={() => router.push('/add-appointment')}
              activeOpacity={0.7}
            >
              <FontAwesome5 name="calendar-alt" size={24} color={tokens.colors.teal} />
              <Text style={[styles.quickActionText, { color: tokens.colors.text }]}>
                Add Appt
              </Text>
            </TouchableOpacity>
          </View>
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
  statsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.sm,
    marginBottom: spacing.xl,
  },
  statCard: {
    width: '48%',
    borderRadius: borderRadius.xl,
    padding: spacing.md,
    alignItems: 'flex-start',
    gap: spacing.xs,
  },
  statValue: {
    fontSize: 18,
    fontFamily: 'Nunito-Bold',
    marginTop: spacing.xs,
  },
  statLabel: {
    fontSize: 12,
    fontFamily: 'Nunito-Regular',
  },
  section: {
    marginBottom: spacing.lg,
    
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.md,
  },
  sectionTitle: {
    fontSize: 24,
    fontFamily: 'Caveat-SemiBold',
  },
  addLink: {
    fontSize: 14,
    fontFamily: 'Nunito-SemiBold',
  },
  itemCard: {
    borderRadius: borderRadius.xl,
    padding: spacing.md,
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    marginBottom: spacing.sm,
  },
  itemIcon: {
    width: 40,
    height: 40,
    borderRadius: borderRadius.md,
    justifyContent: 'center',
    alignItems: 'center',
  },
  itemContent: {
    flex: 1,
  },
  itemName: {
    fontSize: 16,
    fontFamily: 'Nunito-SemiBold',
    marginBottom: spacing.xxs,
  },
  itemDetail: {
    fontSize: 13,
    fontFamily: 'Nunito-Regular',
  },
  emptyCard: {
    borderRadius: borderRadius.xl,
    padding: spacing.lg,
    alignItems: 'center',
  },
  emptyText: {
    fontSize: 14,
    fontFamily: 'Nunito-Regular',
    fontStyle: 'italic',
  },
  quickActionsGrid: {
    flexDirection: 'row',
    gap: spacing.sm,
  },
  quickAction: {
    flex: 1,
    borderRadius: borderRadius.xl,
    padding: spacing.md,
    alignItems: 'center',
    gap: spacing.xs,
  },
  quickActionText: {
    fontSize: 12,
    fontFamily: 'Nunito-SemiBold',
    textAlign: 'center',
  },
});
