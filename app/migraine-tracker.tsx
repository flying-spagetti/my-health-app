import { borderRadius, getThemeTokens, shadows, spacing } from '@/constants/theme';
import { useThemePreference } from '@/hooks/use-theme-preference';
import { getMigraineReadings } from '@/services/db';
import { useRouter } from 'expo-router';
import React, { useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  ScrollView,
  Share,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

/* ======================================================
   ANALYTICS & PATTERN RECOGNITION
====================================================== */

interface TriggerCorrelation {
  trigger: string;
  count: number;
  avgSeverity: number;
  attackRate: number;
}

interface MedicationEffectiveness {
  name: string;
  timesUsed: number;
  avgTimeToRelief: number;
  successRate: number;
  avgSeverityBefore: number;
  avgSeverityAfter: number;
}

interface PatternAnalysis {
  triggerCorrelations: TriggerCorrelation[];
  medicationEffectiveness: MedicationEffectiveness[];
  sleepPatterns: {
    avgHoursOnMigraineDay: number;
    avgHoursOnNormalDay: number;
    poorSleepCorrelation: number;
  };
  timePatterns: {
    mostCommonHour: number;
    mostCommonDay: string;
  };
  medicationOveruseRisk: boolean;
  chronicStatus: 'episodic' | 'chronic' | 'at-risk';
}

function analyzePatterns(migraines: any[]): PatternAnalysis {
  const last30Days = migraines.filter(
    m => m.started_at >= Date.now() - 30 * 24 * 60 * 60 * 1000
  );

  // Trigger correlation analysis
  const triggerMap = new Map<string, { count: number; totalSeverity: number }>();
  migraines.forEach(m => {
    const triggers = JSON.parse(m.triggers || '[]');
    const foodTriggers = JSON.parse(m.food_triggers || '[]');
    [...triggers, ...foodTriggers].forEach(trigger => {
      const existing = triggerMap.get(trigger) || { count: 0, totalSeverity: 0 };
      triggerMap.set(trigger, {
        count: existing.count + 1,
        totalSeverity: existing.totalSeverity + m.severity,
      });
    });
  });

  const triggerCorrelations: TriggerCorrelation[] = Array.from(triggerMap.entries())
    .map(([trigger, data]) => ({
      trigger,
      count: data.count,
      avgSeverity: Math.round(data.totalSeverity / data.count),
      attackRate: Math.round((data.count / migraines.length) * 100),
    }))
    .sort((a, b) => b.count - a.count)
    .slice(0, 10);

  // Medication effectiveness analysis
  const medMap = new Map<string, {
    count: number;
    totalRelief: number;
    successful: number;
    severityBefore: number;
    severityAfter: number;
  }>();

  migraines.forEach(m => {
    if (m.took_medication && m.medications) {
      const meds = JSON.parse(m.medications);
      meds.forEach((med: any) => {
        const existing = medMap.get(med.name) || {
          count: 0,
          totalRelief: 0,
          successful: 0,
          severityBefore: 0,
          severityAfter: 0,
        };

        // Determine success based on relief levels
        const hadGoodRelief = m.relief_at_2hr?.includes('Good') || 
                              m.relief_at_2hr?.includes('Complete');
        
        medMap.set(med.name, {
          count: existing.count + 1,
          totalRelief: existing.totalRelief + (parseInt(med.minutesFromOnset) || 0),
          successful: existing.successful + (hadGoodRelief ? 1 : 0),
          severityBefore: existing.severityBefore + m.severity,
          severityAfter: existing.severityAfter + (hadGoodRelief ? m.severity / 2 : m.severity),
        });
      });
    }
  });

  const medicationEffectiveness: MedicationEffectiveness[] = Array.from(medMap.entries())
    .map(([name, data]) => ({
      name,
      timesUsed: data.count,
      avgTimeToRelief: Math.round(data.totalRelief / data.count),
      successRate: Math.round((data.successful / data.count) * 100),
      avgSeverityBefore: Math.round(data.severityBefore / data.count),
      avgSeverityAfter: Math.round(data.severityAfter / data.count),
    }))
    .sort((a, b) => b.successRate - a.successRate);

  // Sleep pattern analysis
  const migrainesWithSleep = migraines.filter(m => m.sleep_hours);
  const avgSleepOnMigraineDay = migrainesWithSleep.length > 0
    ? migrainesWithSleep.reduce((sum, m) => sum + parseFloat(m.sleep_hours || '0'), 0) / migrainesWithSleep.length
    : 0;

  const poorSleepMigraines = migraines.filter(m => 
    m.sleep_quality?.includes('Poor') || m.sleep_quality?.includes('Very poor')
  ).length;
  const poorSleepCorrelation = migraines.length > 0
    ? Math.round((poorSleepMigraines / migraines.length) * 100)
    : 0;

  // Time pattern analysis
  const hourCounts = new Map<number, number>();
  const dayCounts = new Map<string, number>();
  const days = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];

  migraines.forEach(m => {
    const date = new Date(m.started_at);
    const hour = date.getHours();
    const day = days[date.getDay()];

    hourCounts.set(hour, (hourCounts.get(hour) || 0) + 1);
    dayCounts.set(day, (dayCounts.get(day) || 0) + 1);
  });

  const mostCommonHour = Array.from(hourCounts.entries())
    .sort((a, b) => b[1] - a[1])[0]?.[0] || 0;
  
  const mostCommonDay = Array.from(dayCounts.entries())
    .sort((a, b) => b[1] - a[1])[0]?.[0] || 'Unknown';

  // Medication overuse check (>10 rescue medications in 30 days)
  const rescueMedsLast30 = last30Days.filter(m => {
    if (!m.medications) return false;
    const meds = JSON.parse(m.medications);
    return meds.some((med: any) => med.type === 'Rescue/Abortive');
  }).length;

  const medicationOveruseRisk = rescueMedsLast30 > 10;

  // Chronic status
  const headacheDaysLast30 = new Set(
    last30Days.map(m => new Date(m.started_at).toDateString())
  ).size;

  let chronicStatus: 'episodic' | 'chronic' | 'at-risk' = 'episodic';
  if (headacheDaysLast30 >= 15) {
    chronicStatus = 'chronic';
  } else if (headacheDaysLast30 >= 10) {
    chronicStatus = 'at-risk';
  }

  return {
    triggerCorrelations,
    medicationEffectiveness,
    sleepPatterns: {
      avgHoursOnMigraineDay: avgSleepOnMigraineDay,
      avgHoursOnNormalDay: 7.5, // Would need non-migraine data to calculate
      poorSleepCorrelation,
    },
    timePatterns: {
      mostCommonHour,
      mostCommonDay,
    },
    medicationOveruseRisk,
    chronicStatus,
  };
}

/* ======================================================
   PDF EXPORT / MEDICAL REPORT GENERATION
====================================================== */

function generateMedicalReport(
  migraines: any[],
  patterns: PatternAnalysis,
  timeframe: string
): string {
  const totalEpisodes = migraines.length;
  const avgSeverity = totalEpisodes > 0
    ? Math.round(migraines.reduce((sum, m) => sum + m.severity, 0) / totalEpisodes)
    : 0;

  const withAura = migraines.filter(m => m.aura_present).length;
  const meetsICHD3 = migraines.filter(m => m.meets_ichd3_criteria).length;
  
  const last30Days = migraines.filter(
    m => m.started_at >= Date.now() - 30 * 24 * 60 * 60 * 1000
  );
  const headacheDays30 = new Set(
    last30Days.map(m => new Date(m.started_at).toDateString())
  ).size;

  const latestMidas = migraines.find(m => m.midas_score !== null && m.midas_score !== undefined);

  let report = `MIGRAINE TRACKER - MEDICAL REPORT
Generated: ${new Date().toLocaleDateString()}
Timeframe: ${timeframe}

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

SUMMARY STATISTICS

Total Episodes: ${totalEpisodes}
Average Severity: ${avgSeverity}/10
Headache Days (Last 30): ${headacheDays30}
Classification: ${patterns.chronicStatus === 'chronic' ? 'CHRONIC MIGRAINE (≥15 days/month)' : 
                   patterns.chronicStatus === 'at-risk' ? 'AT RISK FOR CHRONIC (10-14 days/month)' :
                   'EPISODIC MIGRAINE (<10 days/month)'}

Episodes with Aura: ${withAura} (${totalEpisodes > 0 ? Math.round((withAura/totalEpisodes)*100) : 0}%)
ICHD-3 Criteria Met: ${meetsICHD3} (${totalEpisodes > 0 ? Math.round((meetsICHD3/totalEpisodes)*100) : 0}%)

${latestMidas ? `MIDAS Score: ${latestMidas.midas_score} - ${latestMidas.midas_grade}` : 'MIDAS: Not completed'}

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

TRIGGER ANALYSIS

Top Triggers (by frequency):
${patterns.triggerCorrelations.slice(0, 5).map((t, i) => 
  `${i + 1}. ${t.trigger}
   - Frequency: ${t.count} episodes (${t.attackRate}%)
   - Avg Severity: ${t.avgSeverity}/10`
).join('\n')}

Sleep Correlation:
- Poor sleep quality linked to ${patterns.sleepPatterns.poorSleepCorrelation}% of migraines
- Avg sleep on migraine day: ${patterns.sleepPatterns.avgHoursOnMigraineDay.toFixed(1)} hours

Time Patterns:
- Most common onset time: ${patterns.timePatterns.mostCommonHour}:00
- Most common day: ${patterns.timePatterns.mostCommonDay}

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

MEDICATION EFFECTIVENESS

${patterns.medicationEffectiveness.length > 0 ? 
  patterns.medicationEffectiveness.map((med, i) => 
    `${i + 1}. ${med.name}
   - Times used: ${med.timesUsed}
   - Success rate: ${med.successRate}%
   - Avg time to medication: ${med.avgTimeToRelief} min from onset
   - Pain reduction: ${med.avgSeverityBefore}/10 → ${med.avgSeverityAfter}/10`
  ).join('\n\n')
  : 'No medication data available'}

${patterns.medicationOveruseRisk ? 
  '\n⚠️ WARNING: Medication Overuse Detected\n   >10 rescue medications in last 30 days\n   Risk of rebound headaches - consult neurologist'
  : ''}

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

CLINICAL RECOMMENDATIONS

${patterns.chronicStatus === 'chronic' ? 
  '• Consider preventive medication trial\n• Evaluate for Botox or CGRP inhibitor eligibility\n' : ''}
${patterns.medicationOveruseRisk ? 
  '• Immediate medication overuse management needed\n• Consider medication holiday with physician supervision\n' : ''}
${patterns.sleepPatterns.poorSleepCorrelation > 40 ? 
  '• Sleep hygiene intervention recommended\n• Consider sleep study referral\n' : ''}
${patterns.triggerCorrelations[0]?.count > totalEpisodes * 0.5 ? 
  `• Primary trigger identified: ${patterns.triggerCorrelations[0].trigger}\n• Focused trigger management may reduce frequency\n` : ''}

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

RECENT EPISODES (Last 10)

${migraines.slice(0, 10).map(m => {
  const date = new Date(m.started_at).toLocaleDateString();
  const time = new Date(m.started_at).toLocaleTimeString();
  const duration = m.ended_at ? 
    Math.round((m.ended_at - m.started_at) / (1000 * 60 * 60)) + 'h' : 
    'Ongoing';
  
  return `${date} ${time}
  Severity: ${m.severity}/10 | Duration: ${duration}
  ${m.aura_present ? '✓ Aura present' : ''}
  ${m.took_medication ? `Medication: Yes (Relief: ${m.relief_at_2hr || 'N/A'})` : 'Medication: No (natural resolution)'}
  Location: ${m.pain_laterality || 'N/A'}`;
}).join('\n\n')}

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

This report is generated from patient self-tracking data.
Please review with healthcare provider.
`;

  return report;
}

async function exportReport(migraines: any[], patterns: PatternAnalysis, timeframe: string) {
  const report = generateMedicalReport(migraines, patterns, timeframe);
  
  try {
    await Share.share({
      message: report,
      title: 'Migraine Medical Report',
    });
  } catch (error) {
    Alert.alert('Error', 'Could not share report');
  }
}

/* ======================================================
   MAIN TRACKER SCREEN
====================================================== */

export default function MigraineTrackerScreen() {
  const router = useRouter();
  const { colorScheme } = useThemePreference();
  const tokens = getThemeTokens(colorScheme);
  
  const [migraines, setMigraines] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [filter, setFilter] = useState<'all' | 'week' | 'month' | 'year'>('month');
  const [showAnalytics, setShowAnalytics] = useState(true);
  
  const [patterns, setPatterns] = useState<PatternAnalysis | null>(null);

  useEffect(() => {
    loadData();
  }, [filter]);

  const loadData = async () => {
    try {
      setIsLoading(true);
      const all = await getMigraineReadings();
      
      const now = Date.now();
      let filtered = all;
      
      if (filter === 'week') {
        const weekAgo = now - 7 * 24 * 60 * 60 * 1000;
        filtered = all.filter(m => m.started_at >= weekAgo);
      } else if (filter === 'month') {
        const monthAgo = now - 30 * 24 * 60 * 60 * 1000;
        filtered = all.filter(m => m.started_at >= monthAgo);
      } else if (filter === 'year') {
        const yearAgo = now - 365 * 24 * 60 * 60 * 1000;
        filtered = all.filter(m => m.started_at >= yearAgo);
      }
      
      setMigraines(filtered);
      
      // Analyze patterns
      if (filtered.length > 0) {
        const analysis = analyzePatterns(filtered);
        setPatterns(analysis);
      } else {
        setPatterns(null);
      }
    } catch (error) {
      // Removed for production.error('Error loading migraine data:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleExport = () => {
    if (migraines.length === 0) {
      Alert.alert('No Data', 'No migraine episodes to export');
      return;
    }

    if (!patterns) return;

    const timeframeText = filter === 'week' ? 'Last 7 Days' :
                          filter === 'month' ? 'Last 30 Days' :
                          filter === 'year' ? 'Last 365 Days' : 'All Time';

    exportReport(migraines, patterns, timeframeText);
  };

  const formatDateTime = (timestamp: number) => {
    return new Date(timestamp).toLocaleString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
      hour: 'numeric',
      minute: '2-digit',
    });
  };

  const getSeverityColor = (severity: number) => {
    if (severity <= 3) return tokens.colors.success;
    if (severity <= 6) return tokens.colors.warning;
    return tokens.colors.danger;
  };

  const parseJson = (str: string) => {
    try {
      return JSON.parse(str);
    } catch {
      return [];
    }
  };

  // Statistics
  const totalCount = migraines.length;
  const avgSeverity = totalCount > 0
    ? Math.round(migraines.reduce((sum, m) => sum + m.severity, 0) / totalCount)
    : 0;
  
  const withAura = migraines.filter(m => m.aura_present).length;
  const meetsICHD3 = migraines.filter(m => m.meets_ichd3_criteria).length;
  const ongoingCount = migraines.filter(m => m.is_ongoing).length;
  const naturalResolution = migraines.filter(m => m.took_medication === false).length;

  const last30Days = migraines.filter(
    m => m.started_at >= Date.now() - 30 * 24 * 60 * 60 * 1000
  );
  const headacheDays30 = new Set(
    last30Days.map(m => new Date(m.started_at).toDateString())
  ).size;

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: tokens.colors.background }}>
      <ScrollView contentContainerStyle={[styles.content, { backgroundColor: tokens.colors.background }]}>
        <View style={styles.header}>
          <View>
            <Text style={[styles.title, { color: tokens.colors.text }]}>Migraine Tracker</Text>
            <Text style={[styles.subtitle, { color: tokens.colors.textMuted }]}>
              Medical-Grade Analytics
            </Text>
          </View>
          <TouchableOpacity
            style={[styles.addButton, { backgroundColor: tokens.colors.primary }]}
            onPress={() => router.push('/add-migraine')}
          >
            <Text style={[styles.addButtonText, { color: '#FFFFFF' }]}>+ Add</Text>
          </TouchableOpacity>
        </View>

        {/* Filter & Export Section */}
        <View style={styles.controlSection}>
          <View style={styles.filterSection}>
            {(['week', 'month', 'year', 'all'] as const).map((f) => (
              <TouchableOpacity
                key={f}
                style={[
                  styles.filterButton,
                  {
                    backgroundColor: filter === f ? tokens.colors.primary : tokens.colors.elevatedSurface,
                    borderColor: filter === f ? tokens.colors.primary : tokens.colors.border,
                  },
                ]}
                onPress={() => setFilter(f)}
              >
                <Text
                  style={[
                    styles.filterText,
                    { color: filter === f ? '#FFFFFF' : tokens.colors.text },
                  ]}
                >
                  {f === 'week' ? '7d' : f === 'month' ? '30d' : f === 'year' ? '1y' : 'All'}
                </Text>
              </TouchableOpacity>
            ))}
          </View>

          <TouchableOpacity
            style={[styles.exportButton, { backgroundColor: tokens.colors.success }]}
            onPress={handleExport}
          >
            <Text style={styles.exportButtonText}>📄 Export Report</Text>
          </TouchableOpacity>
        </View>

        {isLoading ? (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color={tokens.colors.primary} />
          </View>
        ) : (
          <>
            {/* Main Statistics Grid */}
            <View style={styles.statsGrid}>
              <View style={[styles.statCard, { backgroundColor: tokens.colors.card }, shadows.low]}>
                <Text style={[styles.statValue, { color: tokens.colors.text }]}>{totalCount}</Text>
                <Text style={[styles.statLabel, { color: tokens.colors.textMuted }]}>Episodes</Text>
              </View>
              <View style={[styles.statCard, { backgroundColor: tokens.colors.card }, shadows.low]}>
                <Text style={[styles.statValue, { color: getSeverityColor(avgSeverity) }]}>
                  {avgSeverity}/10
                </Text>
                <Text style={[styles.statLabel, { color: tokens.colors.textMuted }]}>Avg Severity</Text>
              </View>
              <View style={[styles.statCard, { backgroundColor: tokens.colors.card }, shadows.low]}>
                <Text style={[styles.statValue, { 
                  color: headacheDays30 >= 15 ? tokens.colors.danger : 
                         headacheDays30 >= 10 ? tokens.colors.warning : 
                         tokens.colors.success 
                }]}>
                  {headacheDays30}
                </Text>
                <Text style={[styles.statLabel, { color: tokens.colors.textMuted }]}>Days/30d</Text>
              </View>
            </View>

            {/* Classification Alert */}
            {patterns && patterns.chronicStatus === 'chronic' && (
              <View style={[styles.alertBox, { backgroundColor: tokens.colors.danger + '15' }]}>
                <Text style={[styles.alertTitle, { color: tokens.colors.danger }]}>
                  ⚠️ Chronic Migraine Detected
                </Text>
                <Text style={[styles.alertText, { color: tokens.colors.textMuted }]}>
                  ≥15 headache days/month. Discuss preventive treatment with your neurologist.
                </Text>
              </View>
            )}

            {patterns && patterns.medicationOveruseRisk && (
              <View style={[styles.alertBox, { backgroundColor: tokens.colors.warning + '15' }]}>
                <Text style={[styles.alertTitle, { color: tokens.colors.warning }]}>
                  ⚠️ Medication Overuse Risk
                </Text>
                <Text style={[styles.alertText, { color: tokens.colors.textMuted }]}>
                  {'>'} 10 rescue medications in 30 days may cause rebound headaches. Consult your doctor.
                </Text>
              </View>
            )}

            {/* Analytics Toggle */}
            <TouchableOpacity
              style={[styles.analyticsToggle, { backgroundColor: tokens.colors.card }, shadows.low]}
              onPress={() => setShowAnalytics(!showAnalytics)}
            >
              <Text style={[styles.analyticsToggleText, { color: tokens.colors.text }]}>
                {showAnalytics ? '▼' : '▶'} Pattern Analytics & Insights
              </Text>
            </TouchableOpacity>

            {/* Pattern Analytics Section */}
            {showAnalytics && patterns && (
              <View style={styles.analyticsSection}>
                {/* Trigger Correlations */}
                {patterns.triggerCorrelations.length > 0 && (
                  <View style={[styles.analyticsCard, { backgroundColor: tokens.colors.card }, shadows.low]}>
                    <Text style={[styles.analyticsTitle, { color: tokens.colors.text }]}>
                      Top Triggers
                    </Text>
                    {patterns.triggerCorrelations.slice(0, 5).map((trigger, index) => (
                      <View key={index} style={styles.triggerRow}>
                        <View style={{ flex: 1 }}>
                          <Text style={[styles.triggerName, { color: tokens.colors.text }]}>
                            {index + 1}. {trigger.trigger}
                          </Text>
                          <Text style={[styles.triggerStats, { color: tokens.colors.textMuted }]}>
                            {trigger.count} episodes ({trigger.attackRate}%) • Avg severity: {trigger.avgSeverity}/10
                          </Text>
                        </View>
                      </View>
                    ))}
                  </View>
                )}

                {/* Medication Effectiveness */}
                {patterns.medicationEffectiveness.length > 0 && (
                  <View style={[styles.analyticsCard, { backgroundColor: tokens.colors.card }, shadows.low]}>
                    <Text style={[styles.analyticsTitle, { color: tokens.colors.text }]}>
                      Medication Effectiveness
                    </Text>
                    {patterns.medicationEffectiveness.map((med, index) => (
                      <View key={index} style={styles.medicationRow}>
                        <View style={{ flex: 1 }}>
                          <Text style={[styles.medicationName, { color: tokens.colors.text }]}>
                            {med.name}
                          </Text>
                          <Text style={[styles.medicationStats, { color: tokens.colors.textMuted }]}>
                            Success rate: {med.successRate}% • Used {med.timesUsed}x
                          </Text>
                          <Text style={[styles.medicationStats, { color: tokens.colors.textMuted }]}>
                            Pain: {med.avgSeverityBefore}/10 → {med.avgSeverityAfter}/10 • 
                            Avg delay: {med.avgTimeToRelief} min
                          </Text>
                        </View>
                        <View style={[
                          styles.successBadge,
                          { backgroundColor: med.successRate >= 70 ? tokens.colors.success + '20' : 
                                             med.successRate >= 50 ? tokens.colors.warning + '20' :
                                             tokens.colors.danger + '20' }
                        ]}>
                          <Text style={[
                            styles.successBadgeText,
                            { color: med.successRate >= 70 ? tokens.colors.success : 
                                     med.successRate >= 50 ? tokens.colors.warning :
                                     tokens.colors.danger }
                          ]}>
                            {med.successRate}%
                          </Text>
                        </View>
                      </View>
                    ))}
                  </View>
                )}

                {/* Sleep & Time Patterns */}
                <View style={[styles.analyticsCard, { backgroundColor: tokens.colors.card }, shadows.low]}>
                  <Text style={[styles.analyticsTitle, { color: tokens.colors.text }]}>
                    Pattern Insights
                  </Text>
                  
                  {patterns.sleepPatterns.avgHoursOnMigraineDay > 0 && (
                    <View style={styles.insightRow}>
                      <Text style={[styles.insightLabel, { color: tokens.colors.textMuted }]}>
                        💤 Sleep on migraine days:
                      </Text>
                      <Text style={[styles.insightValue, { color: tokens.colors.text }]}>
                        {patterns.sleepPatterns.avgHoursOnMigraineDay.toFixed(1)} hrs avg
                      </Text>
                    </View>
                  )}

                  {patterns.sleepPatterns.poorSleepCorrelation > 0 && (
                    <View style={styles.insightRow}>
                      <Text style={[styles.insightLabel, { color: tokens.colors.textMuted }]}>
                        😴 Poor sleep correlation:
                      </Text>
                      <Text style={[styles.insightValue, { color: tokens.colors.text }]}>
                        {patterns.sleepPatterns.poorSleepCorrelation}% of episodes
                      </Text>
                    </View>
                  )}

                  <View style={styles.insightRow}>
                    <Text style={[styles.insightLabel, { color: tokens.colors.textMuted }]}>
                      🕐 Most common onset time:
                    </Text>
                    <Text style={[styles.insightValue, { color: tokens.colors.text }]}>
                      {patterns.timePatterns.mostCommonHour}:00
                    </Text>
                  </View>

                  <View style={styles.insightRow}>
                    <Text style={[styles.insightLabel, { color: tokens.colors.textMuted }]}>
                      📅 Most common day:
                    </Text>
                    <Text style={[styles.insightValue, { color: tokens.colors.text }]}>
                      {patterns.timePatterns.mostCommonDay}
                    </Text>
                  </View>
                </View>
              </View>
            )}

            {/* Additional Stats */}
            <View style={styles.additionalStats}>
              {withAura > 0 && (
                <View style={[styles.miniStatCard, { backgroundColor: tokens.colors.card }, shadows.low]}>
                  <Text style={[styles.miniStatValue, { color: tokens.colors.primary }]}>
                    {Math.round((withAura / totalCount) * 100)}%
                  </Text>
                  <Text style={[styles.miniStatLabel, { color: tokens.colors.textMuted }]}>
                    With Aura
                  </Text>
                </View>
              )}
              {meetsICHD3 > 0 && (
                <View style={[styles.miniStatCard, { backgroundColor: tokens.colors.card }, shadows.low]}>
                  <Text style={[styles.miniStatValue, { color: tokens.colors.primary }]}>
                    {Math.round((meetsICHD3 / totalCount) * 100)}%
                  </Text>
                  <Text style={[styles.miniStatLabel, { color: tokens.colors.textMuted }]}>
                    ICHD-3 ✓
                  </Text>
                </View>
              )}
              {naturalResolution > 0 && (
                <View style={[styles.miniStatCard, { backgroundColor: tokens.colors.card }, shadows.low]}>
                  <Text style={[styles.miniStatValue, { color: tokens.colors.success }]}>
                    {Math.round((naturalResolution / totalCount) * 100)}%
                  </Text>
                  <Text style={[styles.miniStatLabel, { color: tokens.colors.textMuted }]}>
                    Natural Relief
                  </Text>
                </View>
              )}
              {ongoingCount > 0 && (
                <View style={[styles.miniStatCard, { backgroundColor: tokens.colors.warning + '15' }, shadows.low]}>
                  <Text style={[styles.miniStatValue, { color: tokens.colors.warning }]}>
                    {ongoingCount}
                  </Text>
                  <Text style={[styles.miniStatLabel, { color: tokens.colors.textMuted }]}>
                    Ongoing
                  </Text>
                </View>
              )}
            </View>

            {/* Episode List */}
            {migraines.length === 0 ? (
              <View style={styles.emptyState}>
                <Text style={[styles.emptyText, { color: tokens.colors.textMuted }]}>
                  No migraine episodes recorded yet
                </Text>
                <TouchableOpacity
                  style={[styles.emptyButton, { backgroundColor: tokens.colors.primary }]}
                  onPress={() => router.push('/add-migraine')}
                >
                  <Text style={[styles.emptyButtonText, { color: '#FFFFFF' }]}>
                    Add First Episode
                  </Text>
                </TouchableOpacity>
              </View>
            ) : (
              <View style={styles.listSection}>
                <Text style={[styles.listTitle, { color: tokens.colors.text }]}>
                  Recent Episodes
                </Text>
                {migraines.map((migraine) => {
                  const triggers = parseJson(migraine.triggers || '[]');
                  const foodTriggers = parseJson(migraine.food_triggers || '[]');
                  const allTriggers = [...triggers, ...foodTriggers];
                  const medications = parseJson(migraine.medications || '[]');
                  
                  return (
                    <TouchableOpacity
                      key={migraine.id}
                      style={[styles.migraineCard, { backgroundColor: tokens.colors.card }, shadows.low]}
                      onPress={() => router.push(`/add-migraine?episodeId=${migraine.id}`)}
                    >
                      <View style={styles.migraineHeader}>
                        <View style={{ flex: 1 }}>
                          <Text style={[styles.migraineDate, { color: tokens.colors.text }]}>
                            {formatDateTime(migraine.started_at)}
                          </Text>
                          {migraine.is_ongoing ? (
                            <View style={[styles.ongoingBadge, { backgroundColor: tokens.colors.warning + '20' }]}>
                              <Text style={[styles.ongoingText, { color: tokens.colors.warning }]}>
                                ● Ongoing
                              </Text>
                            </View>
                          ) : migraine.ended_at ? (
                            <Text style={[styles.migraineDuration, { color: tokens.colors.textMuted }]}>
                              Duration: {Math.round((migraine.ended_at - migraine.started_at) / (1000 * 60 * 60))}h
                            </Text>
                          ) : null}
                        </View>
                        
                        <View style={[styles.severityBadge, { backgroundColor: getSeverityColor(migraine.severity) + '20' }]}>
                          <Text style={[styles.severityText, { color: getSeverityColor(migraine.severity) }]}>
                            {migraine.severity}/10
                          </Text>
                        </View>
                      </View>

                      {migraine.migraine_type && (
                        <Text style={[styles.migraineType, { color: tokens.colors.textMuted }]}>
                          {migraine.migraine_type}
                        </Text>
                      )}

                      {migraine.pain_laterality && (
                        <Text style={[styles.migraineInfo, { color: tokens.colors.textMuted }]}>
                          Location: {migraine.pain_laterality}
                        </Text>
                      )}

                      {allTriggers.length > 0 && (
                        <View style={styles.tagsContainer}>
                          <Text style={[styles.tagsLabel, { color: tokens.colors.textMuted }]}>
                            Triggers:
                          </Text>
                          {allTriggers.slice(0, 3).map((trigger, idx) => (
                            <View key={idx} style={[styles.tag, { backgroundColor: tokens.colors.primary + '15' }]}>
                              <Text style={[styles.tagText, { color: tokens.colors.primary }]}>
                                {trigger}
                              </Text>
                            </View>
                          ))}
                          {allTriggers.length > 3 && (
                            <Text style={[styles.moreText, { color: tokens.colors.textMuted }]}>
                              +{allTriggers.length - 3} more
                            </Text>
                          )}
                        </View>
                      )}

                      {medications.length > 0 && (
                        <View style={styles.medicationInfo}>
                          <Text style={[styles.medicationLabel, { color: tokens.colors.textMuted }]}>
                            💊 {medications.map((m: any) => m.name).join(', ')}
                          </Text>
                          {migraine.relief_at_2hr && (
                            <Text style={[styles.reliefInfo, { 
                              color: migraine.relief_at_2hr.includes('Good') || migraine.relief_at_2hr.includes('Complete')
                                ? tokens.colors.success
                                : tokens.colors.textMuted
                            }]}>
                              2hr: {migraine.relief_at_2hr}
                            </Text>
                          )}
                        </View>
                      )}

                      {migraine.took_medication === false && (
                        <View style={[styles.naturalBadge, { backgroundColor: tokens.colors.success + '15' }]}>
                          <Text style={[styles.naturalText, { color: tokens.colors.success }]}>
                            ✓ Natural resolution
                          </Text>
                        </View>
                      )}

                      {migraine.note && (
                        <Text style={[styles.migraineNote, { color: tokens.colors.textMuted }]} numberOfLines={2}>
                          {migraine.note}
                        </Text>
                      )}
                    </TouchableOpacity>
                  );
                })}
              </View>
            )}
          </>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

/* ======================================================
   STYLES
====================================================== */

const styles = StyleSheet.create({
  content: {
    padding: spacing.lg,
    paddingBottom: spacing.xxl,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: spacing.lg,
  },
  title: {
    fontSize: 32,
    fontFamily: 'Caveat-SemiBold',
  },
  subtitle: {
    fontSize: 12,
    fontFamily: 'Nunito-Regular',
    marginTop: spacing.xxs,
  },
  addButton: {
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.lg,
    borderRadius: borderRadius.full,
  },
  addButtonText: {
    fontSize: 14,
    fontFamily: 'Nunito-SemiBold',
    fontWeight: '600',
  },
  
  controlSection: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.lg,
    gap: spacing.sm,
  },
  filterSection: {
    flexDirection: 'row',
    gap: spacing.xs,
    flex: 1,
  },
  filterButton: {
    paddingVertical: spacing.xs,
    paddingHorizontal: spacing.md,
    borderRadius: borderRadius.full,
    borderWidth: 1,
  },
  filterText: {
    fontSize: 13,
    fontFamily: 'Nunito-SemiBold',
    fontWeight: '600',
  },
  exportButton: {
    paddingVertical: spacing.xs,
    paddingHorizontal: spacing.md,
    borderRadius: borderRadius.full,
  },
  exportButtonText: {
    fontSize: 13,
    fontFamily: 'Nunito-SemiBold',
    fontWeight: '600',
    color: '#FFFFFF',
  },
  
  loadingContainer: {
    paddingVertical: spacing.huge,
    alignItems: 'center',
  },
  
  statsGrid: {
    flexDirection: 'row',
    gap: spacing.sm,
    marginBottom: spacing.md,
  },
  statCard: {
    flex: 1,
    borderRadius: borderRadius.xl,
    padding: spacing.md,
    alignItems: 'center',
  },
  statValue: {
    fontSize: 24,
    fontFamily: 'Nunito-Bold',
    fontWeight: '700',
    marginBottom: spacing.xxs,
  },
  statLabel: {
    fontSize: 11,
    fontFamily: 'Nunito-Regular',
    textAlign: 'center',
  },

  alertBox: {
    padding: spacing.md,
    borderRadius: borderRadius.lg,
    marginBottom: spacing.md,
  },
  alertTitle: {
    fontSize: 14,
    fontFamily: 'Nunito-Bold',
    fontWeight: '700',
    marginBottom: spacing.xxs,
  },
  alertText: {
    fontSize: 12,
    fontFamily: 'Nunito-Regular',
    lineHeight: 16,
  },

  analyticsToggle: {
    padding: spacing.md,
    borderRadius: borderRadius.lg,
    marginBottom: spacing.md,
  },
  analyticsToggleText: {
    fontSize: 14,
    fontFamily: 'Nunito-SemiBold',
    fontWeight: '600',
  },

  analyticsSection: {
    gap: spacing.md,
    marginBottom: spacing.md,
  },
  analyticsCard: {
    padding: spacing.md,
    borderRadius: borderRadius.lg,
  },
  analyticsTitle: {
    fontSize: 16,
    fontFamily: 'Nunito-Bold',
    fontWeight: '700',
    marginBottom: spacing.sm,
  },

  triggerRow: {
    paddingVertical: spacing.sm,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(0,0,0,0.05)',
  },
  triggerName: {
    fontSize: 14,
    fontFamily: 'Nunito-SemiBold',
    fontWeight: '600',
    marginBottom: spacing.xxs,
  },
  triggerStats: {
    fontSize: 12,
    fontFamily: 'Nunito-Regular',
  },

  medicationRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    paddingVertical: spacing.sm,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(0,0,0,0.05)',
  },
  medicationName: {
    fontSize: 14,
    fontFamily: 'Nunito-SemiBold',
    fontWeight: '600',
    marginBottom: spacing.xxs,
  },
  medicationStats: {
    fontSize: 11,
    fontFamily: 'Nunito-Regular',
    lineHeight: 14,
  },
  successBadge: {
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xs,
    borderRadius: borderRadius.md,
  },
  successBadgeText: {
    fontSize: 14,
    fontFamily: 'Nunito-Bold',
    fontWeight: '700',
  },

  insightRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: spacing.xs,
  },
  insightLabel: {
    fontSize: 13,
    fontFamily: 'Nunito-Regular',
    flex: 1,
  },
  insightValue: {
    fontSize: 13,
    fontFamily: 'Nunito-SemiBold',
    fontWeight: '600',
  },

  additionalStats: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.sm,
    marginBottom: spacing.lg,
  },
  miniStatCard: {
    minWidth: '30%',
    flex: 1,
    borderRadius: borderRadius.lg,
    padding: spacing.sm,
    alignItems: 'center',
  },
  miniStatValue: {
    fontSize: 18,
    fontFamily: 'Nunito-Bold',
    fontWeight: '700',
    marginBottom: spacing.xxs,
  },
  miniStatLabel: {
    fontSize: 10,
    fontFamily: 'Nunito-Regular',
    textAlign: 'center',
  },

  emptyState: {
    alignItems: 'center',
    paddingVertical: spacing.huge,
  },
  emptyText: {
    fontSize: 16,
    fontFamily: 'Nunito-Regular',
    marginBottom: spacing.md,
  },
  emptyButton: {
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.xl,
    borderRadius: borderRadius.full,
  },
  emptyButtonText: {
    fontSize: 16,
    fontFamily: 'Nunito-SemiBold',
    fontWeight: '600',
  },

  listSection: {
    marginTop: spacing.xs,
  },
  listTitle: {
    fontSize: 18,
    fontFamily: 'Nunito-Bold',
    fontWeight: '700',
    marginBottom: spacing.sm,
  },
  migraineCard: {
    borderRadius: borderRadius.lg,
    padding: spacing.md,
    marginBottom: spacing.sm,
  },
  migraineHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: spacing.xs,
  },
  migraineDate: {
    fontSize: 15,
    fontFamily: 'Nunito-SemiBold',
    fontWeight: '600',
  },
  migraineDuration: {
    fontSize: 11,
    fontFamily: 'Nunito-Regular',
    marginTop: spacing.xxs,
  },
  severityBadge: {
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xxs,
    borderRadius: borderRadius.md,
  },
  severityText: {
    fontSize: 13,
    fontFamily: 'Nunito-Bold',
    fontWeight: '700',
  },
  migraineType: {
    fontSize: 12,
    fontFamily: 'Nunito-Regular',
    fontStyle: 'italic',
    marginBottom: spacing.xxs,
  },
  migraineInfo: {
    fontSize: 12,
    fontFamily: 'Nunito-Regular',
    marginBottom: spacing.xxs,
  },
  tagsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    alignItems: 'center',
    marginTop: spacing.xs,
    gap: spacing.xxs,
  },
  tagsLabel: {
    fontSize: 11,
    fontFamily: 'Nunito-SemiBold',
    fontWeight: '600',
  },
  tag: {
    paddingHorizontal: spacing.xs,
    paddingVertical: 2,
    borderRadius: borderRadius.sm,
  },
  tagText: {
    fontSize: 11,
    fontFamily: 'Nunito-Regular',
  },
  moreText: {
    fontSize: 11,
    fontFamily: 'Nunito-Regular',
    fontStyle: 'italic',
  },
  medicationInfo: {
    marginTop: spacing.xs,
  },
  medicationLabel: {
    fontSize: 12,
    fontFamily: 'Nunito-Regular',
    marginBottom: spacing.xxs,
  },
  reliefInfo: {
    fontSize: 11,
    fontFamily: 'Nunito-SemiBold',
    fontWeight: '600',
  },
  naturalBadge: {
    alignSelf: 'flex-start',
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xxs,
    borderRadius: borderRadius.sm,
    marginTop: spacing.xs,
  },
  naturalText: {
    fontSize: 11,
    fontFamily: 'Nunito-SemiBold',
    fontWeight: '600',
  },
  migraineNote: {
    fontSize: 12,
    fontFamily: 'Nunito-Regular',
    lineHeight: 16,
    marginTop: spacing.xs,
  },
  ongoingBadge: {
    alignSelf: 'flex-start',
    paddingHorizontal: spacing.xs,
    paddingVertical: 2,
    borderRadius: borderRadius.sm,
    marginTop: spacing.xxs,
  },
  ongoingText: {
    fontSize: 11,
    fontFamily: 'Nunito-SemiBold',
    fontWeight: '600',
  },
});