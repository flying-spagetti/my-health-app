import DateTimePicker from '@/components/DateTimePicker';
import { borderRadius, getThemeTokens, shadows, spacing } from '@/constants/theme';
import { useThemePreference } from '@/hooks/use-theme-preference';
import { getMigraineReadings } from '@/services/db';
import * as Clipboard from 'expo-clipboard';
import React, { useCallback, useEffect, useMemo, useState } from 'react';
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
   TYPES & INTERFACES
====================================================== */

type RangePreset = '7' | '30' | '90' | 'custom';

interface MigraineAnalysis {
  // Summary Statistics
  totalEpisodes: number;
  avgSeverity: number;
  headacheDays30: number;
  chronicStatus: 'episodic' | 'at-risk' | 'chronic';
  
  // ICHD-3 Compliance
  episodesWithAura: number;
  meetsICHD3Count: number;
  ichd3ComplianceRate: number;
  
  // MIDAS Assessment
  latestMidasScore: number | null;
  latestMidasGrade: string | null;
  
  // Trigger Analysis
  triggerCorrelations: Array<{
    trigger: string;
    count: number;
    avgSeverity: number;
    percentage: number;
  }>;
  
  // Medication Analysis
  medicationEffectiveness: Array<{
    name: string;
    timesUsed: number;
    successRate: number;
    avgTimingMin: number;
    avgSeverityBefore: number;
    avgSeverityAfter: number;
  }>;
  
  // Sleep Patterns
  sleepAnalysis: {
    avgHoursOnMigraineDay: number;
    poorSleepEpisodes: number;
    poorSleepPercentage: number;
  };
  
  // Time Patterns
  timePatterns: {
    mostCommonHour: number;
    mostCommonDay: string;
    hourDistribution: Map<number, number>;
    dayDistribution: Map<string, number>;
  };
  
  // Safety Alerts
  medicationOveruseRisk: boolean;
  rescueMedsCount30Days: number;
  
  // Functional Impact
  avgBedBoundHours: number;
  couldNotWorkCount: number;
  couldNotWorkPercentage: number;
}

const PRESETS: Array<{ key: RangePreset; label: string; days?: number }> = [
  { key: '7', label: 'Last 7 days', days: 7 },
  { key: '30', label: 'Last 30 days', days: 30 },
  { key: '90', label: 'Last 90 days', days: 90 },
  { key: 'custom', label: 'Custom Range' },
];

/* ======================================================
   ANALYTICS ENGINE
====================================================== */

function analyzeMigraineData(migraines: any[]): MigraineAnalysis {
  const totalEpisodes = migraines.length;
  
  if (totalEpisodes === 0) {
    return {
      totalEpisodes: 0,
      avgSeverity: 0,
      headacheDays30: 0,
      chronicStatus: 'episodic',
      episodesWithAura: 0,
      meetsICHD3Count: 0,
      ichd3ComplianceRate: 0,
      latestMidasScore: null,
      latestMidasGrade: null,
      triggerCorrelations: [],
      medicationEffectiveness: [],
      sleepAnalysis: { avgHoursOnMigraineDay: 0, poorSleepEpisodes: 0, poorSleepPercentage: 0 },
      timePatterns: { mostCommonHour: 0, mostCommonDay: 'Unknown', hourDistribution: new Map(), dayDistribution: new Map() },
      medicationOveruseRisk: false,
      rescueMedsCount30Days: 0,
      avgBedBoundHours: 0,
      couldNotWorkCount: 0,
      couldNotWorkPercentage: 0,
    };
  }
  
  // Calculate average severity
  const avgSeverity = Math.round(
    migraines.reduce((sum, m) => sum + (m.severity || 0), 0) / totalEpisodes
  );
  
  // Headache days (last 30)
  const now = Date.now();
  const last30Days = migraines.filter(m => m.started_at >= now - 30 * 24 * 60 * 60 * 1000);
  const headacheDays30 = new Set(
    last30Days.map(m => new Date(m.started_at).toDateString())
  ).size;
  
  // Chronic status determination
  let chronicStatus: 'episodic' | 'at-risk' | 'chronic' = 'episodic';
  if (headacheDays30 >= 15) {
    chronicStatus = 'chronic';
  } else if (headacheDays30 >= 10) {
    chronicStatus = 'at-risk';
  }
  
  // ICHD-3 compliance
  const episodesWithAura = migraines.filter(m => m.aura_present === 1).length;
  const meetsICHD3Count = migraines.filter(m => m.meets_ichd3_criteria === 1).length;
  const ichd3ComplianceRate = totalEpisodes > 0 
    ? Math.round((meetsICHD3Count / totalEpisodes) * 100)
    : 0;
  
  // MIDAS data
  const episodesWithMidas = migraines.filter(m => m.midas_score != null);
  const latestMidas = episodesWithMidas.length > 0 
    ? episodesWithMidas[episodesWithMidas.length - 1]
    : null;
  const latestMidasScore = latestMidas?.midas_score || null;
  const latestMidasGrade = latestMidas?.midas_grade || null;
  
  // Trigger correlation analysis
  const triggerMap = new Map<string, { count: number; totalSeverity: number }>();
  
  migraines.forEach(m => {
    const triggers = JSON.parse(m.triggers || '[]');
    const foodTriggers = JSON.parse(m.food_triggers || '[]');
    [...triggers, ...foodTriggers].forEach(trigger => {
      const existing = triggerMap.get(trigger) || { count: 0, totalSeverity: 0 };
      triggerMap.set(trigger, {
        count: existing.count + 1,
        totalSeverity: existing.totalSeverity + (m.severity || 0),
      });
    });
  });
  
  const triggerCorrelations = Array.from(triggerMap.entries())
    .map(([trigger, data]) => ({
      trigger,
      count: data.count,
      avgSeverity: Math.round(data.totalSeverity / data.count),
      percentage: Math.round((data.count / totalEpisodes) * 100),
    }))
    .sort((a, b) => b.count - a.count)
    .slice(0, 10);
  
  // Medication effectiveness analysis
  const medMap = new Map<string, {
    count: number;
    successCount: number;
    totalTiming: number;
    severityBefore: number;
    severityAfter: number;
  }>();
  
  migraines.forEach(m => {
    if (m.took_medication && m.medications) {
      try {
        const meds = JSON.parse(m.medications);
        meds.forEach((med: any) => {
          const existing = medMap.get(med.name) || {
            count: 0,
            successCount: 0,
            totalTiming: 0,
            severityBefore: 0,
            severityAfter: 0,
          };
          
          const hadGoodRelief = m.relief_at_2hr?.includes('Good') || 
                                m.relief_at_2hr?.includes('Complete');
          
          medMap.set(med.name, {
            count: existing.count + 1,
            successCount: existing.successCount + (hadGoodRelief ? 1 : 0),
            totalTiming: existing.totalTiming + (parseInt(med.minutesFromOnset) || 0),
            severityBefore: existing.severityBefore + (m.severity || 0),
            severityAfter: existing.severityAfter + (hadGoodRelief ? (m.severity || 0) / 2 : (m.severity || 0)),
          });
        });
      } catch (e) {
        // Error parsing medications
      }
    }
  });
  
  const medicationEffectiveness = Array.from(medMap.entries())
    .map(([name, data]) => ({
      name,
      timesUsed: data.count,
      successRate: Math.round((data.successCount / data.count) * 100),
      avgTimingMin: Math.round(data.totalTiming / data.count),
      avgSeverityBefore: Math.round(data.severityBefore / data.count),
      avgSeverityAfter: Math.round(data.severityAfter / data.count),
    }))
    .sort((a, b) => b.successRate - a.successRate);
  
  // Sleep pattern analysis
  const migrainesWithSleep = migraines.filter(m => m.sleep_hours);
  const avgHoursOnMigraineDay = migrainesWithSleep.length > 0
    ? migrainesWithSleep.reduce((sum, m) => sum + parseFloat(m.sleep_hours || '0'), 0) / migrainesWithSleep.length
    : 0;
  
  const poorSleepEpisodes = migraines.filter(m => 
    m.sleep_quality?.includes('Poor') || m.sleep_quality?.includes('Very poor')
  ).length;
  const poorSleepPercentage = totalEpisodes > 0
    ? Math.round((poorSleepEpisodes / totalEpisodes) * 100)
    : 0;
  
  // Time pattern analysis
  const hourDistribution = new Map<number, number>();
  const dayDistribution = new Map<string, number>();
  const days = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
  
  migraines.forEach(m => {
    const date = new Date(m.started_at);
    const hour = date.getHours();
    const day = days[date.getDay()];
    
    hourDistribution.set(hour, (hourDistribution.get(hour) || 0) + 1);
    dayDistribution.set(day, (dayDistribution.get(day) || 0) + 1);
  });
  
  const mostCommonHour = Array.from(hourDistribution.entries())
    .sort((a, b) => b[1] - a[1])[0]?.[0] || 0;
  
  const mostCommonDay = Array.from(dayDistribution.entries())
    .sort((a, b) => b[1] - a[1])[0]?.[0] || 'Unknown';
  
  // Medication overuse check
  const rescueMedsCount30Days = last30Days.filter(m => {
    if (!m.medications) return false;
    try {
      const meds = JSON.parse(m.medications);
      return meds.some((med: any) => med.type === 'Rescue/Abortive');
    } catch {
      return false;
    }
  }).length;
  
  const medicationOveruseRisk = rescueMedsCount30Days > 10;
  
  // Functional impact
  const migrainesWithBedBound = migraines.filter(m => m.bed_bound_hours);
  const avgBedBoundHours = migrainesWithBedBound.length > 0
    ? migrainesWithBedBound.reduce((sum, m) => sum + parseFloat(m.bed_bound_hours || '0'), 0) / migrainesWithBedBound.length
    : 0;
  
  const couldNotWorkCount = migraines.filter(m => m.could_work === 0).length;
  const couldNotWorkPercentage = totalEpisodes > 0
    ? Math.round((couldNotWorkCount / totalEpisodes) * 100)
    : 0;
  
  return {
    totalEpisodes,
    avgSeverity,
    headacheDays30,
    chronicStatus,
    episodesWithAura,
    meetsICHD3Count,
    ichd3ComplianceRate,
    latestMidasScore,
    latestMidasGrade,
    triggerCorrelations,
    medicationEffectiveness,
    sleepAnalysis: {
      avgHoursOnMigraineDay,
      poorSleepEpisodes,
      poorSleepPercentage,
    },
    timePatterns: {
      mostCommonHour,
      mostCommonDay,
      hourDistribution,
      dayDistribution,
    },
    medicationOveruseRisk,
    rescueMedsCount30Days,
    avgBedBoundHours,
    couldNotWorkCount,
    couldNotWorkPercentage,
  };
}

/* ======================================================
   MEDICAL REPORT GENERATOR
====================================================== */

function generateMedicalReport(
  analysis: MigraineAnalysis,
  migraines: any[],
  dateRange: { start: number; end: number }
): string {
  const startDate = new Date(dateRange.start).toLocaleDateString();
  const endDate = new Date(dateRange.end).toLocaleDateString();
  
  let report = `━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
MIGRAINE TRACKER - MEDICAL REPORT
Doctor Visit Summary
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

Generated: ${new Date().toLocaleString()}
Report Period: ${startDate} to ${endDate}
Patient: Gnaneswar Lopinti

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
SUMMARY STATISTICS
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

Total Episodes: ${analysis.totalEpisodes}
Average Severity: ${analysis.avgSeverity}/10
Headache Days (Last 30): ${analysis.headacheDays30} days

CLASSIFICATION:
`;

  if (analysis.chronicStatus === 'chronic') {
    report += `⚠️ CHRONIC MIGRAINE (≥15 headache days/month)
   → Preventive medication strongly indicated
   → Consider advanced therapies (Botox, CGRP inhibitors)
`;
  } else if (analysis.chronicStatus === 'at-risk') {
    report += `⚠️ AT RISK FOR CHRONIC (10-14 headache days/month)
   → Early intervention window
   → Consider preventive medication trial
`;
  } else {
    report += `✓ EPISODIC MIGRAINE (<10 headache days/month)
   → Current status manageable
   → Continue monitoring frequency
`;
  }

  report += `
ICHD-3 DIAGNOSTIC COMPLIANCE:
- Episodes with Aura: ${analysis.episodesWithAura} (${Math.round((analysis.episodesWithAura/analysis.totalEpisodes)*100)}%)
- Meets ICHD-3 Criteria: ${analysis.meetsICHD3Count} (${analysis.ichd3ComplianceRate}%)
- Diagnostic Certainty: ${analysis.ichd3ComplianceRate >= 80 ? 'HIGH' : analysis.ichd3ComplianceRate >= 60 ? 'MODERATE' : 'REQUIRES FURTHER EVALUATION'}

`;

  if (analysis.latestMidasScore !== null) {
    report += `DISABILITY ASSESSMENT (MIDAS):
Score: ${analysis.latestMidasScore}
Grade: ${analysis.latestMidasGrade}
${analysis.latestMidasScore >= 21 ? '⚠️ Severe disability - Qualifies for advanced treatments' :
  analysis.latestMidasScore >= 11 ? '⚠️ Moderate disability - Treatment escalation recommended' :
  '✓ Mild to no disability'}

`;
  }

  report += `━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
TRIGGER ANALYSIS
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

Top Identified Triggers:
${analysis.triggerCorrelations.length > 0 
  ? analysis.triggerCorrelations.slice(0, 5).map((t, i) => 
      `${i + 1}. ${t.trigger}
   - Frequency: ${t.count} episodes (${t.percentage}% of total)
   - Average Severity: ${t.avgSeverity}/10
   - Clinical Impact: ${t.percentage >= 50 ? 'HIGH - Primary intervention target' :
                        t.percentage >= 30 ? 'MODERATE - Address in treatment plan' :
                        'LOW - Monitor for patterns'}`
    ).join('\n\n')
  : 'Insufficient data - Continue tracking triggers'}

${analysis.sleepAnalysis.poorSleepPercentage > 0 ? `
SLEEP CORRELATION:
- Poor sleep quality: ${analysis.sleepAnalysis.poorSleepEpisodes} episodes (${analysis.sleepAnalysis.poorSleepPercentage}%)
${analysis.sleepAnalysis.avgHoursOnMigraineDay > 0 
  ? `- Average sleep on migraine days: ${analysis.sleepAnalysis.avgHoursOnMigraineDay.toFixed(1)} hours` 
  : ''}
${analysis.sleepAnalysis.poorSleepPercentage >= 50 
  ? `\n⚠️ CRITICAL: Sleep hygiene intervention urgently needed
   → Recommend sleep study referral
   → Primary modifiable risk factor` 
  : analysis.sleepAnalysis.poorSleepPercentage >= 30 
  ? `\n⚠️ Sleep management recommended as part of treatment plan` 
  : ''}
` : ''}

TIME PATTERNS:
- Most common onset time: ${analysis.timePatterns.mostCommonHour}:00 (${String(analysis.timePatterns.mostCommonHour % 12 || 12).padStart(2, '0')}:00 ${analysis.timePatterns.mostCommonHour >= 12 ? 'PM' : 'AM'})
- Most common day: ${analysis.timePatterns.mostCommonDay}
${analysis.timePatterns.mostCommonHour >= 14 && analysis.timePatterns.mostCommonHour <= 18 
  ? '   → Afternoon pattern suggests stress/fatigue trigger' 
  : analysis.timePatterns.mostCommonHour >= 6 && analysis.timePatterns.mostCommonHour <= 10 
  ? '   → Morning pattern may indicate sleep issues or fasting' 
  : ''}

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
MEDICATION EFFECTIVENESS
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

${analysis.medicationEffectiveness.length > 0 
  ? analysis.medicationEffectiveness.map((med, i) => 
      `${i + 1}. ${med.name}
   - Times Used: ${med.timesUsed}
   - Success Rate: ${med.successRate}% ${med.successRate >= 70 ? '✓ EFFECTIVE' : 
                                        med.successRate >= 50 ? '⚠️ MODERATE' : 
                                        '❌ INEFFECTIVE - Consider alternative'}
   - Average Treatment Delay: ${med.avgTimingMin} minutes from onset
     ${med.avgTimingMin > 120 ? '⚠️ Often delayed >2hrs - Effectiveness compromised' : 
       med.avgTimingMin <= 60 ? '✓ Good timing compliance' : 
       '→ Earlier treatment may improve outcomes'}
   - Pain Reduction: ${med.avgSeverityBefore}/10 → ${med.avgSeverityAfter}/10
     (${Math.round(((med.avgSeverityBefore - med.avgSeverityAfter) / med.avgSeverityBefore) * 100)}% reduction)`
    ).join('\n\n')
  : 'No medication data available - Consider tracking medication use'}

${analysis.medicationOveruseRisk ? `
🚨 MEDICATION OVERUSE ALERT 🚨
- Rescue medications used ${analysis.rescueMedsCount30Days} times in last 30 days
- Risk Level: ${analysis.rescueMedsCount30Days >= 15 ? 'HIGH' : 'MODERATE'}

IMMEDIATE ACTION REQUIRED:
✓ Discuss medication overuse headache (MOH) risk
✓ Consider preventive medication to reduce rescue use
✓ May need supervised medication holiday
✓ Evaluate for rebound headache component

This finding should be addressed at this visit.
` : analysis.rescueMedsCount30Days >= 8 ? `
⚠️ MEDICATION USE WARNING
- Rescue medications used ${analysis.rescueMedsCount30Days} times in last 30 days
- Approaching overuse threshold (>10/month)
- Recommend preventive medication consideration
` : ''}

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
FUNCTIONAL IMPACT
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

Work/Life Impact:
- Unable to work/study: ${analysis.couldNotWorkCount} episodes (${analysis.couldNotWorkPercentage}%)
${analysis.avgBedBoundHours > 0 
  ? `- Average bed-bound duration: ${analysis.avgBedBoundHours.toFixed(1)} hours/episode` 
  : ''}

${analysis.couldNotWorkPercentage >= 50 
  ? `⚠️ SEVERE FUNCTIONAL IMPAIRMENT
   → Significant work/life disruption documented
   → Qualifies for disability accommodations
   → Aggressive treatment warranted` 
  : analysis.couldNotWorkPercentage >= 25 
  ? `⚠️ MODERATE FUNCTIONAL IMPAIRMENT
   → Notable work/life impact
   → Treatment optimization recommended` 
  : ''}

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
CLINICAL RECOMMENDATIONS
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

Based on the data analysis:

`;

  // Generate personalized recommendations
  const recommendations: string[] = [];
  
  if (analysis.chronicStatus === 'chronic') {
    recommendations.push('1. PREVENTIVE MEDICATION TRIAL\n   → Daily preventive to reduce frequency\n   → Options: Beta-blockers, anticonvulsants, CGRP inhibitors\n   → Goal: Reduce to <10 headache days/month');
  }
  
  if (analysis.latestMidasScore && analysis.latestMidasScore >= 11) {
    recommendations.push('2. CONSIDER ADVANCED THERAPIES\n   → MIDAS score qualifies for CGRP inhibitors\n   → Botox consideration if ≥15 days/month\n   → Insurance pre-authorization supported by data');
  }
  
  if (analysis.medicationOveruseRisk) {
    recommendations.push('3. MEDICATION OVERUSE MANAGEMENT - URGENT\n   → Supervised medication holiday\n   → Transition to preventive therapy\n   → Break rebound cycle');
  }
  
  if (analysis.sleepAnalysis.poorSleepPercentage >= 40) {
    recommendations.push(`4. SLEEP INTERVENTION PRIORITY\n   → ${analysis.sleepAnalysis.poorSleepPercentage}% of migraines associated with poor sleep\n   → Sleep hygiene education\n   → Consider sleep study if OSA suspected`);
  }
  
  if (analysis.triggerCorrelations.length > 0 && analysis.triggerCorrelations[0].percentage >= 40) {
    recommendations.push(`5. PRIMARY TRIGGER MANAGEMENT\n   → Focus on: ${analysis.triggerCorrelations[0].trigger}\n   → Present in ${analysis.triggerCorrelations[0].percentage}% of episodes\n   → Targeted intervention may significantly reduce frequency`);
  }
  
  if (recommendations.length === 0) {
    recommendations.push('1. CONTINUE CURRENT MANAGEMENT\n   → Episodic migraine under reasonable control\n   → Maintain trigger tracking\n   → Optimize rescue medication timing');
  }
  
  report += recommendations.join('\n\n');

  report += `

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
RECENT EPISODES (Last 10)
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

${migraines.slice(0, 10).map((m, i) => {
  const date = new Date(m.started_at).toLocaleDateString();
  const time = new Date(m.started_at).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' });
  const duration = m.ended_at 
    ? Math.round((m.ended_at - m.started_at) / (1000 * 60 * 60)) + 'h'
    : m.is_ongoing ? 'Ongoing' : 'N/A';
  
  let episodeReport = `Episode ${i + 1} - ${date} ${time}
  Severity: ${m.severity}/10 | Duration: ${duration}
  ${m.aura_present ? '✓ Aura present' : ''}
  ${m.pain_laterality ? `Location: ${m.pain_laterality}` : ''}
  ${m.took_medication 
    ? `Medication: Yes (${m.relief_at_2hr || 'Relief data incomplete'})` 
    : 'Medication: No (natural resolution)'}`;
  
  const triggers = [...JSON.parse(m.triggers || '[]'), ...JSON.parse(m.food_triggers || '[]')];
  if (triggers.length > 0) {
    episodeReport += `\n  Triggers: ${triggers.slice(0, 3).join(', ')}${triggers.length > 3 ? ` +${triggers.length - 3} more` : ''}`;
  }
  
  return episodeReport;
}).join('\n\n')}

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
DOCUMENTATION NOTES
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

This report is generated from patient self-tracking data using
ICHD-3 compliant criteria and validated assessment tools (MIDAS).

Data Quality: ${analysis.ichd3ComplianceRate >= 80 ? 'HIGH - Reliable for clinical decisions' :
                analysis.ichd3ComplianceRate >= 60 ? 'GOOD - Suitable for treatment planning' :
                'MODERATE - Continue improving documentation'}

For insurance authorization or disability documentation, this
report provides:
✓ Frequency documentation (headache days/month)
✓ MIDAS disability scores
✓ Treatment response data
✓ Functional impact evidence

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

Report generated by Medical-Grade Migraine Tracker
Review with healthcare provider
`;

  return report;
}

/* ======================================================
   MAIN COMPONENT
====================================================== */

export default function DoctorVisitSummaryScreen() {
  const { colorScheme } = useThemePreference();
  const tokens = getThemeTokens(colorScheme);

  const [preset, setPreset] = useState<RangePreset>('30');
  const [customStart, setCustomStart] = useState(new Date(Date.now() - 29 * 24 * 60 * 60 * 1000));
  const [customEnd, setCustomEnd] = useState(new Date());
  const [rangeStart, setRangeStart] = useState<number>(Date.now() - 29 * 24 * 60 * 60 * 1000);
  const [rangeEnd, setRangeEnd] = useState<number>(Date.now());

  const [loading, setLoading] = useState(true);
  const [migraines, setMigraines] = useState<any[]>([]);
  const [showFullReport, setShowFullReport] = useState(false);

  useEffect(() => {
    const now = Date.now();
    if (preset === 'custom') return;
    const days = PRESETS.find((p) => p.key === preset)?.days ?? 30;
    setRangeStart(now - (days - 1) * 24 * 60 * 60 * 1000);
    setRangeEnd(now);
  }, [preset]);

  useEffect(() => {
    if (preset !== 'custom') return;
    let start = customStart.getTime();
    let end = customEnd.getTime();
    if (end < start) {
      end = start;
      setCustomEnd(new Date(start));
    }
    setRangeStart(start);
    setRangeEnd(end);
  }, [preset, customStart, customEnd]);

  const loadData = useCallback(async () => {
    try {
      setLoading(true);
      const allMigraines = await getMigraineReadings();
      const filtered = allMigraines.filter(
        m => m.started_at >= rangeStart && m.started_at <= rangeEnd
      );
      setMigraines(filtered);
    } catch (error) {
      Alert.alert('Error', 'Could not load migraine data');
    } finally {
      setLoading(false);
    }
  }, [rangeStart, rangeEnd]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const analysis = useMemo(() => analyzeMigraineData(migraines), [migraines]);

  const medicalReport = useMemo(
    () => generateMedicalReport(analysis, migraines, { start: rangeStart, end: rangeEnd }),
    [analysis, migraines, rangeStart, rangeEnd]
  );

  const handleCopyFull = async () => {
    await Clipboard.setStringAsync(medicalReport);
    Alert.alert('✓ Copied', 'Full medical report copied to clipboard');
  };

  const handleCopySummary = async () => {
    const summary = `MIGRAINE SUMMARY (${new Date(rangeStart).toLocaleDateString()} - ${new Date(rangeEnd).toLocaleDateString()})

Total Episodes: ${analysis.totalEpisodes}
Average Severity: ${analysis.avgSeverity}/10
Headache Days (30d): ${analysis.headacheDays30}
Status: ${analysis.chronicStatus === 'chronic' ? 'CHRONIC MIGRAINE' : analysis.chronicStatus === 'at-risk' ? 'AT RISK' : 'EPISODIC'}

ICHD-3 Compliance: ${analysis.ichd3ComplianceRate}%
Episodes with Aura: ${analysis.episodesWithAura}
${analysis.latestMidasScore !== null ? `MIDAS: ${analysis.latestMidasScore} - ${analysis.latestMidasGrade}` : ''}

${analysis.medicationOveruseRisk ? '⚠️ MEDICATION OVERUSE RISK' : ''}
${analysis.chronicStatus === 'chronic' ? '⚠️ PREVENTIVE TREATMENT INDICATED' : ''}`;
    
    await Clipboard.setStringAsync(summary);
    Alert.alert('✓ Copied', 'Summary copied to clipboard');
  };

  const handleShare = async () => {
    await Share.share({
      title: 'Migraine Medical Report',
      message: medicalReport,
    });
  };

  const getSeverityColor = (severity: number) => {
    if (severity <= 3) return tokens.colors.success;
    if (severity <= 6) return tokens.colors.warning;
    return tokens.colors.danger;
  };

  const getChronicStatusColor = (status: string) => {
    if (status === 'chronic') return tokens.colors.danger;
    if (status === 'at-risk') return tokens.colors.warning;
    return tokens.colors.success;
  };

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: tokens.colors.background }]}>
      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        {/* Header */}
        <View style={styles.header}>
          <Text style={[styles.title, { color: tokens.colors.text }]}>
            Doctor Visit Summary
          </Text>
          <Text style={[styles.subtitle, { color: tokens.colors.textMuted }]}>
            Medical-Grade Clinical Report
          </Text>
        </View>

        {/* Date Range Selector */}
        <View style={styles.presetRow}>
          {PRESETS.map((item) => (
            <TouchableOpacity
              key={item.key}
              style={[
                styles.presetChip,
                {
                  backgroundColor: preset === item.key ? tokens.colors.primary : tokens.colors.card,
                  borderColor: preset === item.key ? tokens.colors.primary : tokens.colors.border,
                },
              ]}
              onPress={() => setPreset(item.key)}
            >
              <Text
                style={[
                  styles.presetText,
                  { color: preset === item.key ? '#FFFFFF' : tokens.colors.text },
                ]}
              >
                {item.label}
              </Text>
            </TouchableOpacity>
          ))}
        </View>

        {preset === 'custom' && (
          <View style={styles.customRangeRow}>
            <View style={{ flex: 1 }}>
              <DateTimePicker
                label="Start Date"
                value={customStart}
                onChange={setCustomStart}
                mode="date"
              />
            </View>
            <View style={{ flex: 1 }}>
              <DateTimePicker
                label="End Date"
                value={customEnd}
                onChange={setCustomEnd}
                mode="date"
              />
            </View>
          </View>
        )}

        {/* Export Actions */}
        <View style={styles.actionRow}>
          <TouchableOpacity
            style={[styles.exportButton, { backgroundColor: tokens.colors.primary }]}
            onPress={handleShare}
          >
            <Text style={styles.exportButtonText}>📤 Share Report</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.copyButton, { borderColor: tokens.colors.border }]}
            onPress={handleCopySummary}
          >
            <Text style={[styles.copyButtonText, { color: tokens.colors.text }]}>
              📋 Copy Summary
            </Text>
          </TouchableOpacity>
        </View>

        {loading ? (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color={tokens.colors.primary} />
            <Text style={[styles.loadingText, { color: tokens.colors.textMuted }]}>
              Analyzing migraine data...
            </Text>
          </View>
        ) : migraines.length === 0 ? (
          <View style={[styles.emptyCard, { backgroundColor: tokens.colors.card }, shadows.low]}>
            <Text style={[styles.emptyTitle, { color: tokens.colors.text }]}>
              No Data in Selected Period
            </Text>
            <Text style={[styles.emptyText, { color: tokens.colors.textMuted }]}>
              No migraine episodes recorded in this timeframe. Try selecting a different date range.
            </Text>
          </View>
        ) : (
          <>
            {/* Summary Statistics */}
            <View style={styles.section}>
              <Text style={[styles.sectionTitle, { color: tokens.colors.text }]}>
                Summary Statistics
              </Text>
              <View style={styles.statsGrid}>
                <View style={[styles.statCard, { backgroundColor: tokens.colors.card }, shadows.low]}>
                  <Text style={[styles.statValue, { color: tokens.colors.text }]}>
                    {analysis.totalEpisodes}
                  </Text>
                  <Text style={[styles.statLabel, { color: tokens.colors.textMuted }]}>
                    Total Episodes
                  </Text>
                </View>
                <View style={[styles.statCard, { backgroundColor: tokens.colors.card }, shadows.low]}>
                  <Text style={[styles.statValue, { color: getSeverityColor(analysis.avgSeverity) }]}>
                    {analysis.avgSeverity}/10
                  </Text>
                  <Text style={[styles.statLabel, { color: tokens.colors.textMuted }]}>
                    Avg Severity
                  </Text>
                </View>
                <View style={[styles.statCard, { backgroundColor: tokens.colors.card }, shadows.low]}>
                  <Text style={[styles.statValue, { 
                    color: getChronicStatusColor(analysis.chronicStatus)
                  }]}>
                    {analysis.headacheDays30}
                  </Text>
                  <Text style={[styles.statLabel, { color: tokens.colors.textMuted }]}>
                    Days/30d
                  </Text>
                </View>
              </View>
            </View>

            {/* Classification Alert */}
            {(analysis.chronicStatus === 'chronic' || analysis.chronicStatus === 'at-risk') && (
              <View style={[
                styles.alertBox,
                { backgroundColor: analysis.chronicStatus === 'chronic' 
                  ? tokens.colors.danger + '15' 
                  : tokens.colors.warning + '15' 
                },
                shadows.low
              ]}>
                <Text style={[
                  styles.alertTitle,
                  { color: analysis.chronicStatus === 'chronic' 
                    ? tokens.colors.danger 
                    : tokens.colors.warning 
                  }
                ]}>
                  {analysis.chronicStatus === 'chronic' 
                    ? '🚨 Chronic Migraine Status' 
                    : '⚠️ At Risk for Chronic Migraine'}
                </Text>
                <Text style={[styles.alertText, { color: tokens.colors.textMuted }]}>
                  {analysis.chronicStatus === 'chronic'
                    ? 'Preventive medication strongly indicated. Discuss advanced treatment options.'
                    : 'Early intervention window. Consider preventive medication to prevent progression.'}
                </Text>
              </View>
            )}

            {/* Medication Overuse Alert */}
            {analysis.medicationOveruseRisk && (
              <View style={[
                styles.alertBox,
                { backgroundColor: tokens.colors.danger + '15' },
                shadows.low
              ]}>
                <Text style={[styles.alertTitle, { color: tokens.colors.danger }]}>
                  🚨 Medication Overuse Risk
                </Text>
                <Text style={[styles.alertText, { color: tokens.colors.textMuted }]}>
                  {analysis.rescueMedsCount30Days} rescue medications in 30 days. Risk of rebound headaches. 
                  Discuss with doctor immediately.
                </Text>
              </View>
            )}

            {/* ICHD-3 & MIDAS */}
            <View style={styles.section}>
              <Text style={[styles.sectionTitle, { color: tokens.colors.text }]}>
                Clinical Assessments
              </Text>
              
              <View style={[styles.card, { backgroundColor: tokens.colors.card }, shadows.low]}>
                <View style={styles.cardRow}>
                  <Text style={[styles.cardLabel, { color: tokens.colors.textMuted }]}>
                    ICHD-3 Compliance
                  </Text>
                  <Text style={[styles.cardValue, { color: tokens.colors.primary }]}>
                    {analysis.ichd3ComplianceRate}%
                  </Text>
                </View>
                <View style={styles.cardRow}>
                  <Text style={[styles.cardLabel, { color: tokens.colors.textMuted }]}>
                    Episodes with Aura
                  </Text>
                  <Text style={[styles.cardValue, { color: tokens.colors.text }]}>
                    {analysis.episodesWithAura} ({Math.round((analysis.episodesWithAura/analysis.totalEpisodes)*100)}%)
                  </Text>
                </View>
                
                {analysis.latestMidasScore !== null && (
                  <>
                    <View style={styles.divider} />
                    <View style={styles.cardRow}>
                      <Text style={[styles.cardLabel, { color: tokens.colors.textMuted }]}>
                        MIDAS Score
                      </Text>
                      <Text style={[styles.cardValue, { 
                        color: analysis.latestMidasScore >= 21 ? tokens.colors.danger :
                               analysis.latestMidasScore >= 11 ? tokens.colors.warning :
                               tokens.colors.success
                      }]}>
                        {analysis.latestMidasScore}
                      </Text>
                    </View>
                    <Text style={[styles.cardSubtext, { color: tokens.colors.textMuted }]}>
                      {analysis.latestMidasGrade}
                    </Text>
                  </>
                )}
              </View>
            </View>

            {/* Top Triggers */}
            {analysis.triggerCorrelations.length > 0 && (
              <View style={styles.section}>
                <Text style={[styles.sectionTitle, { color: tokens.colors.text }]}>
                  Top Triggers
                </Text>
                {analysis.triggerCorrelations.slice(0, 5).map((trigger, index) => (
                  <View key={index} style={[styles.triggerCard, { backgroundColor: tokens.colors.card }, shadows.low]}>
                    <View style={styles.triggerHeader}>
                      <Text style={[styles.triggerName, { color: tokens.colors.text }]}>
                        {index + 1}. {trigger.trigger}
                      </Text>
                      <Text style={[styles.triggerBadge, { 
                        color: trigger.percentage >= 50 ? tokens.colors.danger :
                               trigger.percentage >= 30 ? tokens.colors.warning :
                               tokens.colors.primary
                      }]}>
                        {trigger.percentage}%
                      </Text>
                    </View>
                    <Text style={[styles.triggerStats, { color: tokens.colors.textMuted }]}>
                      {trigger.count} episodes • Avg severity: {trigger.avgSeverity}/10
                    </Text>
                  </View>
                ))}
              </View>
            )}

            {/* Medication Effectiveness */}
            {analysis.medicationEffectiveness.length > 0 && (
              <View style={styles.section}>
                <Text style={[styles.sectionTitle, { color: tokens.colors.text }]}>
                  Medication Effectiveness
                </Text>
                {analysis.medicationEffectiveness.map((med, index) => (
                  <View key={index} style={[styles.medCard, { backgroundColor: tokens.colors.card }, shadows.low]}>
                    <View style={styles.medHeader}>
                      <Text style={[styles.medName, { color: tokens.colors.text }]}>
                        {med.name}
                      </Text>
                      <View style={[
                        styles.successBadge,
                        { backgroundColor: med.successRate >= 70 ? tokens.colors.success + '20' :
                                           med.successRate >= 50 ? tokens.colors.warning + '20' :
                                           tokens.colors.danger + '20' }
                      ]}>
                        <Text style={[
                          styles.successText,
                          { color: med.successRate >= 70 ? tokens.colors.success :
                                   med.successRate >= 50 ? tokens.colors.warning :
                                   tokens.colors.danger }
                        ]}>
                          {med.successRate}%
                        </Text>
                      </View>
                    </View>
                    <Text style={[styles.medStats, { color: tokens.colors.textMuted }]}>
                      Used {med.timesUsed}x • Avg delay: {med.avgTimingMin} min
                    </Text>
                    <Text style={[styles.medStats, { color: tokens.colors.textMuted }]}>
                      Pain reduction: {med.avgSeverityBefore}/10 → {med.avgSeverityAfter}/10
                    </Text>
                  </View>
                ))}
              </View>
            )}

            {/* Sleep & Time Patterns */}
            {(analysis.sleepAnalysis.poorSleepPercentage > 0 || 
              analysis.timePatterns.mostCommonHour !== 0) && (
              <View style={styles.section}>
                <Text style={[styles.sectionTitle, { color: tokens.colors.text }]}>
                  Pattern Insights
                </Text>
                <View style={[styles.card, { backgroundColor: tokens.colors.card }, shadows.low]}>
                  {analysis.sleepAnalysis.poorSleepPercentage > 0 && (
                    <>
                      <View style={styles.cardRow}>
                        <Text style={[styles.cardLabel, { color: tokens.colors.textMuted }]}>
                          Poor sleep correlation
                        </Text>
                        <Text style={[styles.cardValue, { color: tokens.colors.warning }]}>
                          {analysis.sleepAnalysis.poorSleepPercentage}%
                        </Text>
                      </View>
                      {analysis.sleepAnalysis.avgHoursOnMigraineDay > 0 && (
                        <Text style={[styles.cardSubtext, { color: tokens.colors.textMuted }]}>
                          Avg {analysis.sleepAnalysis.avgHoursOnMigraineDay.toFixed(1)} hrs on migraine days
                        </Text>
                      )}
                    </>
                  )}
                  
                  <View style={styles.divider} />
                  
                  <View style={styles.cardRow}>
                    <Text style={[styles.cardLabel, { color: tokens.colors.textMuted }]}>
                      Most common onset time
                    </Text>
                    <Text style={[styles.cardValue, { color: tokens.colors.text }]}>
                      {String(analysis.timePatterns.mostCommonHour % 12 || 12).padStart(2, '0')}:00 
                      {analysis.timePatterns.mostCommonHour >= 12 ? ' PM' : ' AM'}
                    </Text>
                  </View>
                  <View style={styles.cardRow}>
                    <Text style={[styles.cardLabel, { color: tokens.colors.textMuted }]}>
                      Most common day
                    </Text>
                    <Text style={[styles.cardValue, { color: tokens.colors.text }]}>
                      {analysis.timePatterns.mostCommonDay}
                    </Text>
                  </View>
                </View>
              </View>
            )}

            {/* Functional Impact */}
            {(analysis.couldNotWorkCount > 0 || analysis.avgBedBoundHours > 0) && (
              <View style={styles.section}>
                <Text style={[styles.sectionTitle, { color: tokens.colors.text }]}>
                  Functional Impact
                </Text>
                <View style={[styles.card, { backgroundColor: tokens.colors.card }, shadows.low]}>
                  <View style={styles.cardRow}>
                    <Text style={[styles.cardLabel, { color: tokens.colors.textMuted }]}>
                      Unable to work/study
                    </Text>
                    <Text style={[styles.cardValue, { color: tokens.colors.danger }]}>
                      {analysis.couldNotWorkPercentage}%
                    </Text>
                  </View>
                  {analysis.avgBedBoundHours > 0 && (
                    <View style={styles.cardRow}>
                      <Text style={[styles.cardLabel, { color: tokens.colors.textMuted }]}>
                        Avg bed-bound hours
                      </Text>
                      <Text style={[styles.cardValue, { color: tokens.colors.text }]}>
                        {analysis.avgBedBoundHours.toFixed(1)}h
                      </Text>
                    </View>
                  )}
                </View>
              </View>
            )}

            {/* Quick Summary Card */}
            <View style={styles.section}>
              <View style={styles.summaryHeader}>
                <Text style={[styles.sectionTitle, { color: tokens.colors.text }]}>
                  Quick Summary
                </Text>
                <TouchableOpacity onPress={handleCopySummary}>
                  <Text style={[styles.copyLink, { color: tokens.colors.primary }]}>
                    📋 Copy Summary
                  </Text>
                </TouchableOpacity>
              </View>
              
              <View style={[styles.summaryCard, { backgroundColor: tokens.colors.card }, shadows.low]}>
                <View style={styles.summaryRow}>
                  <Text style={[styles.summaryLabel, { color: tokens.colors.textMuted }]}>
                    Report Period:
                  </Text>
                  <Text style={[styles.summaryValue, { color: tokens.colors.text }]}>
                    {new Date(rangeStart).toLocaleDateString()} - {new Date(rangeEnd).toLocaleDateString()}
                  </Text>
                </View>
                
                <View style={styles.summaryDivider} />
                
                <View style={styles.summaryRow}>
                  <Text style={[styles.summaryLabel, { color: tokens.colors.textMuted }]}>
                    Total Episodes:
                  </Text>
                  <Text style={[styles.summaryValue, { color: tokens.colors.text }]}>
                    {analysis.totalEpisodes}
                  </Text>
                </View>
                
                <View style={styles.summaryRow}>
                  <Text style={[styles.summaryLabel, { color: tokens.colors.textMuted }]}>
                    Average Severity:
                  </Text>
                  <Text style={[styles.summaryValue, { color: getSeverityColor(analysis.avgSeverity) }]}>
                    {analysis.avgSeverity}/10
                  </Text>
                </View>
                
                <View style={styles.summaryRow}>
                  <Text style={[styles.summaryLabel, { color: tokens.colors.textMuted }]}>
                    Headache Days (30d):
                  </Text>
                  <Text style={[styles.summaryValue, { color: getChronicStatusColor(analysis.chronicStatus) }]}>
                    {analysis.headacheDays30} days
                  </Text>
                </View>
                
                <View style={styles.summaryRow}>
                  <Text style={[styles.summaryLabel, { color: tokens.colors.textMuted }]}>
                    Classification:
                  </Text>
                  <Text style={[styles.summaryValue, { color: getChronicStatusColor(analysis.chronicStatus) }]}>
                    {analysis.chronicStatus === 'chronic' ? 'Chronic' : 
                     analysis.chronicStatus === 'at-risk' ? 'At Risk' : 'Episodic'}
                  </Text>
                </View>
                
                <View style={styles.summaryDivider} />
                
                <View style={styles.summaryRow}>
                  <Text style={[styles.summaryLabel, { color: tokens.colors.textMuted }]}>
                    ICHD-3 Compliance:
                  </Text>
                  <Text style={[styles.summaryValue, { color: tokens.colors.primary }]}>
                    {analysis.ichd3ComplianceRate}%
                  </Text>
                </View>
                
                {analysis.latestMidasScore !== null && (
                  <View style={styles.summaryRow}>
                    <Text style={[styles.summaryLabel, { color: tokens.colors.textMuted }]}>
                      MIDAS Score:
                    </Text>
                    <Text style={[styles.summaryValue, { 
                      color: analysis.latestMidasScore >= 21 ? tokens.colors.danger :
                             analysis.latestMidasScore >= 11 ? tokens.colors.warning :
                             tokens.colors.success
                    }]}>
                      {analysis.latestMidasScore} - {analysis.latestMidasGrade?.split(':')[0]}
                    </Text>
                  </View>
                )}
                
                {(analysis.medicationOveruseRisk || analysis.chronicStatus === 'chronic' || analysis.chronicStatus === 'at-risk') && (
                  <>
                    <View style={styles.summaryDivider} />
                    <View style={styles.alertsSection}>
                      <Text style={[styles.summaryLabel, { color: tokens.colors.textMuted, marginBottom: spacing.xs }]}>
                        Clinical Alerts:
                      </Text>
                      {analysis.chronicStatus === 'chronic' && (
                        <Text style={[styles.alertItem, { color: tokens.colors.danger }]}>
                          • Preventive treatment indicated
                        </Text>
                      )}
                      {analysis.chronicStatus === 'at-risk' && (
                        <Text style={[styles.alertItem, { color: tokens.colors.warning }]}>
                          • At risk for chronic migraine
                        </Text>
                      )}
                      {analysis.medicationOveruseRisk && (
                        <Text style={[styles.alertItem, { color: tokens.colors.danger }]}>
                          • Medication overuse risk detected
                        </Text>
                      )}
                    </View>
                  </>
                )}
              </View>
            </View>

            {/* Full Medical Report */}
            <View style={styles.section}>
              <TouchableOpacity 
                style={styles.summaryHeader}
                onPress={() => setShowFullReport(!showFullReport)}
              >
                <Text style={[styles.sectionTitle, { color: tokens.colors.text }]}>
                  {showFullReport ? '▼' : '▶'} Full Medical Report
                </Text>
                {showFullReport && (
                  <TouchableOpacity onPress={handleCopyFull}>
                    <Text style={[styles.copyLink, { color: tokens.colors.primary }]}>
                      📋 Copy Report
                    </Text>
                  </TouchableOpacity>
                )}
              </TouchableOpacity>
              
              {showFullReport ? (
                <View style={[styles.fullReportContainer, { backgroundColor: tokens.colors.card }, shadows.low]}>
                  <ScrollView 
                    style={styles.fullReportScroll}
                    nestedScrollEnabled={true}
                  >
                    <Text style={[styles.fullReportText, { color: tokens.colors.textMuted }]}>
                      {medicalReport}
                    </Text>
                  </ScrollView>
                  
                  <View style={styles.reportActionsBottom}>
                    <TouchableOpacity
                      style={[styles.reportActionButton, { backgroundColor: tokens.colors.primary }]}
                      onPress={handleShare}
                    >
                      <Text style={styles.reportActionButtonText}>📤 Share Report</Text>
                    </TouchableOpacity>
                    <TouchableOpacity
                      style={[styles.reportActionButton, { 
                        backgroundColor: 'transparent',
                        borderWidth: 1,
                        borderColor: tokens.colors.border
                      }]}
                      onPress={handleCopyFull}
                    >
                      <Text style={[styles.reportActionButtonText, { color: tokens.colors.text }]}>
                        📋 Copy All
                      </Text>
                    </TouchableOpacity>
                  </View>
                </View>
              ) : (
                <TouchableOpacity 
                  style={[styles.expandPrompt, { backgroundColor: tokens.colors.card }, shadows.low]}
                  onPress={() => setShowFullReport(true)}
                >
                  <Text style={[styles.expandPromptText, { color: tokens.colors.primary }]}>
                    Tap to view complete clinical report with detailed analysis
                  </Text>
                </TouchableOpacity>
              )}
            </View>
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
  container: {
    flex: 1,
  },
  content: {
    padding: spacing.lg,
    paddingBottom: spacing.huge,
  },
  header: {
    marginBottom: spacing.lg,
  },
  title: {
    fontSize: 28,
    fontFamily: 'Nunito-Bold',
    fontWeight: '700',
  },
  subtitle: {
    fontSize: 13,
    fontFamily: 'Nunito-Regular',
    marginTop: spacing.xxs,
  },
  
  presetRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.xs,
    marginBottom: spacing.md,
  },
  presetChip: {
    paddingVertical: spacing.xs,
    paddingHorizontal: spacing.md,
    borderRadius: borderRadius.full,
    borderWidth: 1,
  },
  presetText: {
    fontSize: 13,
    fontFamily: 'Nunito-SemiBold',
    fontWeight: '600',
  },
  
  customRangeRow: {
    flexDirection: 'row',
    gap: spacing.sm,
    marginBottom: spacing.md,
  },
  
  actionRow: {
    flexDirection: 'row',
    gap: spacing.sm,
    marginBottom: spacing.lg,
  },
  exportButton: {
    flex: 1,
    paddingVertical: spacing.sm,
    borderRadius: borderRadius.full,
    alignItems: 'center',
  },
  exportButtonText: {
    fontSize: 14,
    fontFamily: 'Nunito-SemiBold',
    fontWeight: '600',
    color: '#FFFFFF',
  },
  copyButton: {
    flex: 1,
    paddingVertical: spacing.sm,
    borderRadius: borderRadius.full,
    borderWidth: 1,
    alignItems: 'center',
  },
  copyButtonText: {
    fontSize: 14,
    fontFamily: 'Nunito-SemiBold',
    fontWeight: '600',
  },
  
  loadingContainer: {
    paddingVertical: spacing.huge,
    alignItems: 'center',
  },
  loadingText: {
    marginTop: spacing.sm,
    fontSize: 14,
    fontFamily: 'Nunito-Regular',
  },
  
  emptyCard: {
    borderRadius: borderRadius.xl,
    padding: spacing.xl,
    alignItems: 'center',
  },
  emptyTitle: {
    fontSize: 18,
    fontFamily: 'Nunito-Bold',
    fontWeight: '700',
    marginBottom: spacing.xs,
  },
  emptyText: {
    fontSize: 14,
    fontFamily: 'Nunito-Regular',
    textAlign: 'center',
  },
  
  section: {
    marginBottom: spacing.xl,
  },
  sectionTitle: {
    fontSize: 18,
    fontFamily: 'Nunito-Bold',
    fontWeight: '700',
    marginBottom: spacing.sm,
  },
  
  statsGrid: {
    flexDirection: 'row',
    gap: spacing.sm,
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
    borderRadius: borderRadius.lg,
    padding: spacing.md,
    marginBottom: spacing.md,
  },
  alertTitle: {
    fontSize: 15,
    fontFamily: 'Nunito-Bold',
    fontWeight: '700',
    marginBottom: spacing.xs,
  },
  alertText: {
    fontSize: 13,
    fontFamily: 'Nunito-Regular',
    lineHeight: 18,
  },
  
  card: {
    borderRadius: borderRadius.lg,
    padding: spacing.md,
  },
  cardRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: spacing.xs,
  },
  cardLabel: {
    fontSize: 13,
    fontFamily: 'Nunito-Regular',
    flex: 1,
  },
  cardValue: {
    fontSize: 15,
    fontFamily: 'Nunito-Bold',
    fontWeight: '700',
  },
  cardSubtext: {
    fontSize: 12,
    fontFamily: 'Nunito-Regular',
    marginTop: spacing.xxs,
  },
  divider: {
    height: 1,
    backgroundColor: 'rgba(0,0,0,0.05)',
    marginVertical: spacing.sm,
  },
  
  triggerCard: {
    borderRadius: borderRadius.lg,
    padding: spacing.md,
    marginBottom: spacing.sm,
  },
  triggerHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.xxs,
  },
  triggerName: {
    fontSize: 14,
    fontFamily: 'Nunito-SemiBold',
    fontWeight: '600',
    flex: 1,
  },
  triggerBadge: {
    fontSize: 15,
    fontFamily: 'Nunito-Bold',
    fontWeight: '700',
  },
  triggerStats: {
    fontSize: 12,
    fontFamily: 'Nunito-Regular',
  },
  
  medCard: {
    borderRadius: borderRadius.lg,
    padding: spacing.md,
    marginBottom: spacing.sm,
  },
  medHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.xs,
  },
  medName: {
    fontSize: 14,
    fontFamily: 'Nunito-SemiBold',
    fontWeight: '600',
    flex: 1,
  },
  successBadge: {
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xxs,
    borderRadius: borderRadius.md,
  },
  successText: {
    fontSize: 14,
    fontFamily: 'Nunito-Bold',
    fontWeight: '700',
  },
  medStats: {
    fontSize: 12,
    fontFamily: 'Nunito-Regular',
    lineHeight: 16,
  },
  
  summaryHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.sm,
  },
  copyLink: {
    fontSize: 13,
    fontFamily: 'Nunito-SemiBold',
    fontWeight: '600',
  },
  
  summaryCard: {
    borderRadius: borderRadius.lg,
    padding: spacing.md,
  },
  summaryRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: spacing.xs,
  },
  summaryLabel: {
    fontSize: 13,
    fontFamily: 'Nunito-Regular',
    flex: 1,
  },
  summaryValue: {
    fontSize: 14,
    fontFamily: 'Nunito-Bold',
    fontWeight: '700',
    textAlign: 'right',
  },
  summaryDivider: {
    height: 1,
    backgroundColor: 'rgba(0,0,0,0.05)',
    marginVertical: spacing.sm,
  },
  alertsSection: {
    paddingTop: spacing.xs,
  },
  alertItem: {
    fontSize: 13,
    fontFamily: 'Nunito-SemiBold',
    fontWeight: '600',
    lineHeight: 20,
  },
  
  expandPrompt: {
    borderRadius: borderRadius.lg,
    padding: spacing.lg,
    alignItems: 'center',
  },
  expandPromptText: {
    fontSize: 14,
    fontFamily: 'Nunito-SemiBold',
    fontWeight: '600',
    textAlign: 'center',
  },
  
  fullReportContainer: {
    borderRadius: borderRadius.lg,
    overflow: 'hidden',
  },
  fullReportScroll: {
    maxHeight: 400,
    padding: spacing.md,
  },
  fullReportText: {
    fontSize: 11,
    fontFamily: 'Courier',
    lineHeight: 16,
  },
  reportActionsBottom: {
    flexDirection: 'row',
    gap: spacing.sm,
    padding: spacing.md,
    borderTopWidth: 1,
    borderTopColor: 'rgba(0,0,0,0.05)',
  },
  reportActionButton: {
    flex: 1,
    paddingVertical: spacing.sm,
    borderRadius: borderRadius.lg,
    alignItems: 'center',
  },
  reportActionButtonText: {
    fontSize: 13,
    fontFamily: 'Nunito-SemiBold',
    fontWeight: '600',
    color: '#FFFFFF',
  },
});