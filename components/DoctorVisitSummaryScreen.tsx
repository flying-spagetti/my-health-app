import DateTimePicker from '@/components/DateTimePicker';
import { borderRadius, getThemeTokens, shadows, spacing } from '@/constants/theme';
import { useThemePreference } from '@/hooks/use-theme-preference';
import {
  getBpReadingsInRange,
  getMedicationsAndSchedules,
  getMedicationLogs,
  getMeditationLogsInRange,
  getMigraineEntriesInRange,
} from '@/services/db';
import {
  computeDoctorSummary,
  formatDoctorSummaryText,
} from '@/analytics/doctorSummary';
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

type RangePreset = '7' | '30' | '90' | 'custom';

const PRESETS: Array<{ key: RangePreset; label: string; days?: number }> = [
  { key: '7', label: 'Last 7 days', days: 7 },
  { key: '30', label: 'Last 30 days', days: 30 },
  { key: '90', label: 'Last 90 days', days: 90 },
  { key: 'custom', label: 'Custom' },
];

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
  const [bpReadings, setBpReadings] = useState<any[]>([]);
  const [medicationLogs, setMedicationLogs] = useState<any[]>([]);
  const [medicationData, setMedicationData] = useState<{ medications: any[]; schedules: any[] }>({
    medications: [],
    schedules: [],
  });
  const [meditationLogs, setMeditationLogs] = useState<any[]>([]);
  const [showAllEpisodes, setShowAllEpisodes] = useState(false);

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
      // #region agent log
      fetch('http://127.0.0.1:7242/ingest/89f73505-7e03-43c0-bf6b-656191ce0c31',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'DoctorVisitSummaryScreen.tsx:84',message:'loadData start',data:{rangeStart,rangeEnd},timestamp:Date.now(),sessionId:'debug-session',runId:'pre-fix',hypothesisId:'A'})}).catch(()=>{});
      // #endregion
      const [
        migraineEntries,
        bpEntries,
        medsAndSchedules,
        meditationEntries,
        allMedLogs,
      ] = await Promise.all([
        getMigraineEntriesInRange(rangeStart, rangeEnd),
        getBpReadingsInRange(rangeStart, rangeEnd),
        getMedicationsAndSchedules(),
        getMeditationLogsInRange(rangeStart, rangeEnd),
        getMedicationLogs(),
      ]);

      setMigraines(migraineEntries || []);
      setBpReadings(bpEntries || []);
      setMedicationData(medsAndSchedules || { medications: [], schedules: [] });
      setMeditationLogs(meditationEntries || []);
      setMedicationLogs(
        (allMedLogs || []).filter(
          (log: any) => log.taken_at >= rangeStart && log.taken_at <= rangeEnd
        )
      );
      // #region agent log
      fetch('http://127.0.0.1:7242/ingest/89f73505-7e03-43c0-bf6b-656191ce0c31',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'DoctorVisitSummaryScreen.tsx:105',message:'loadData success',data:{migraines:(migraineEntries||[]).length,bp:(bpEntries||[]).length,meds:(medsAndSchedules?.medications||[]).length,meditation:(meditationEntries||[]).length,medLogs:(allMedLogs||[]).length},timestamp:Date.now(),sessionId:'debug-session',runId:'pre-fix',hypothesisId:'A'})}).catch(()=>{});
      // #endregion
    } catch (error) {
      console.error('Error loading doctor summary data:', error);
      // #region agent log
      fetch('http://127.0.0.1:7242/ingest/89f73505-7e03-43c0-bf6b-656191ce0c31',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'DoctorVisitSummaryScreen.tsx:109',message:'loadData error',data:{error: String(error)},timestamp:Date.now(),sessionId:'debug-session',runId:'pre-fix',hypothesisId:'A'})}).catch(()=>{});
      // #endregion
    } finally {
      setLoading(false);
    }
  }, [rangeStart, rangeEnd]);

  useEffect(() => {
    // #region agent log
    fetch('http://127.0.0.1:7242/ingest/89f73505-7e03-43c0-bf6b-656191ce0c31',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'DoctorVisitSummaryScreen.tsx:112',message:'DoctorVisitSummaryScreen mounted',data:{preset,rangeStart,rangeEnd},timestamp:Date.now(),sessionId:'debug-session',runId:'pre-fix',hypothesisId:'A'})}).catch(()=>{});
    // #endregion
    loadData();
  }, [loadData]);

  const summary = useMemo(
    () =>
      computeDoctorSummary({
        migraines,
        bpReadings,
        medications: medicationData.medications,
        schedules: medicationData.schedules,
        medicationLogs,
        meditationLogs,
        rangeStart,
        rangeEnd,
      }),
    [
      migraines,
      bpReadings,
      medicationData.medications,
      medicationData.schedules,
      medicationLogs,
      meditationLogs,
      rangeStart,
      rangeEnd,
    ]
  );

  useEffect(() => {
    if (__DEV__) {
      console.log('Doctor visit summary computed:', summary);
    }
  }, [summary]);

  const summaryText = useMemo(() => formatDoctorSummaryText(summary), [summary]);

  const handleCopy = async () => {
    // #region agent log
    fetch('http://127.0.0.1:7242/ingest/89f73505-7e03-43c0-bf6b-656191ce0c31',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'DoctorVisitSummaryScreen.tsx:149',message:'Copy summary pressed',data:{summaryLength:summaryText.length},timestamp:Date.now(),sessionId:'debug-session',runId:'pre-fix',hypothesisId:'B'})}).catch(()=>{});
    // #endregion
    await Clipboard.setStringAsync(summaryText);
    Alert.alert('Copied', 'Doctor summary copied to clipboard.');
  };

  const handleShare = async () => {
    // #region agent log
    fetch('http://127.0.0.1:7242/ingest/89f73505-7e03-43c0-bf6b-656191ce0c31',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'DoctorVisitSummaryScreen.tsx:156',message:'Share summary pressed',data:{summaryLength:summaryText.length},timestamp:Date.now(),sessionId:'debug-session',runId:'pre-fix',hypothesisId:'C'})}).catch(()=>{});
    // #endregion
    await Share.share({
      title: 'Doctor Visit Summary',
      message: summaryText,
    });
  };

  const displayedEpisodes = showAllEpisodes
    ? summary.episodes
    : summary.episodes.slice(0, 10);

  const formatDateTime = (ms?: number) =>
    ms
      ? new Date(ms).toLocaleString('en-US', {
          month: 'short',
          day: 'numeric',
          year: 'numeric',
          hour: 'numeric',
          minute: '2-digit',
        })
      : '—';

  const formatDate = (ms?: number) =>
    ms
      ? new Date(ms).toLocaleDateString('en-US', {
          month: 'short',
          day: 'numeric',
          year: 'numeric',
        })
      : '—';

  const formatPercent = (value: number | null) =>
    typeof value === 'number' ? `${value}%` : '—';

  const formatDuration = (minutes: number | null) =>
    typeof minutes === 'number' ? `${minutes} min` : '—';

  const triggerTop = Object.entries(summary.triggerCounts)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 5);

  const sleepTop = Object.entries(summary.sleepRelationCounts)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 4);

  const sensoryTop = Object.entries(summary.sensoryAvoidanceCounts)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 4);

  const timeOfDayTop = Object.entries(summary.timeOfDayCounts)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 4);

  const abortiveTimingSummary = Object.entries(summary.abortiveTimingCounts)
    .map(([key, count]) => `${key} ${count}`)
    .join(', ');

  const reliefSummary = Object.entries(summary.reliefCounts)
    .map(([key, count]) => `${key} ${count}`)
    .join(', ');

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: tokens.colors.background }]}>
      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        <View style={styles.header}>
          <Text style={[styles.title, { color: tokens.colors.text }]}>Doctor Visit Summary</Text>
          <Text style={[styles.subtitle, { color: tokens.colors.textMuted }]}>
            Clear, export-friendly snapshot for clinical visits
          </Text>
        </View>

        <View style={styles.segmentedRow}>
          {PRESETS.map((item) => (
            <Chip
              key={item.key}
              label={item.label}
              selected={preset === item.key}
              onPress={() => setPreset(item.key)}
              tokens={tokens}
            />
          ))}
        </View>

        {preset === 'custom' && (
          <View style={styles.customRangeRow}>
            <DateTimePicker
              label="Start date"
              value={customStart}
              onChange={setCustomStart}
              mode="date"
            />
            <DateTimePicker
              label="End date"
              value={customEnd}
              onChange={setCustomEnd}
              mode="date"
            />
          </View>
        )}

        <View style={styles.actionRow}>
          <PrimaryButton label="Copy summary" onPress={handleCopy} tokens={tokens} />
          <SecondaryButton label="Share summary" onPress={handleShare} tokens={tokens} />
        </View>

        {loading ? (
          <View style={styles.loadingCard}>
            <ActivityIndicator size="large" color={tokens.colors.primary} />
            <Text style={[styles.loadingText, { color: tokens.colors.textMuted }]}>
              Building summary…
            </Text>
          </View>
        ) : (
          <>
            <Section title="Top summary" tokens={tokens}>
              <View style={styles.summaryGrid}>
                <SummaryCard
                  label="Classification"
                  value={
                    summary.classification.type === 'insufficient-data'
                      ? 'Insufficient data'
                      : summary.classification.type === 'chronic'
                        ? 'Chronic'
                        : 'Episodic'
                  }
                  subtext={summary.classification.criteriaText}
                  tokens={tokens}
                />
                <SummaryCard
                  label="Headache days"
                  value={`${summary.classification.headacheDays}`}
                  subtext={`Migraine days: ${summary.classification.migraineDays}`}
                  tokens={tokens}
                />
                <SummaryCard
                  label="Severity"
                  value={`${summary.migraineStats.avgSeverity ?? '—'} avg`}
                  subtext={`Max: ${summary.migraineStats.maxSeverity ?? '—'}`}
                  tokens={tokens}
                />
                <SummaryCard
                  label="Duration"
                  value={formatDuration(summary.migraineStats.avgDurationMin)}
                  subtext={`Ongoing: ${formatPercent(summary.migraineStats.ongoingPercent)}`}
                  tokens={tokens}
                />
                <SummaryCard
                  label="Aura rate"
                  value={formatPercent(summary.migraineStats.auraRatePercent)}
                  subtext={
                    summary.migraineStats.topAuraTypes.length > 0
                      ? `Top: ${summary.migraineStats.topAuraTypes.join(', ')}`
                      : 'Top: —'
                  }
                  tokens={tokens}
                />
                <SummaryCard
                  label="Impairment"
                  value={formatPercent(summary.migraineStats.impairmentRatePercent)}
                  subtext="Missed work/bed rest"
                  tokens={tokens}
                />
              </View>
            </Section>

            <Section title="Migraine details (last episodes)" tokens={tokens}>
              {displayedEpisodes.length === 0 ? (
                <EmptyState text="No migraine episodes logged in this window." tokens={tokens} />
              ) : (
                displayedEpisodes.map((ep) => (
                  <View key={ep.id} style={[styles.card, { backgroundColor: tokens.colors.card }, shadows.low]}>
                    <View style={styles.cardHeader}>
                      <Text style={[styles.cardTitle, { color: tokens.colors.text }]}>
                        {formatDateTime(ep.startedAt)}
                      </Text>
                      <Text style={[styles.badge, { color: tokens.colors.primary }]}>
                        {ep.severity ?? '—'}/10
                      </Text>
                    </View>
                    <InfoRow label="Duration" value={formatDuration(ep.durationMin ?? null)} tokens={tokens} />
                    <InfoRow label="Onset speed" value={ep.onsetSpeed ?? '—'} tokens={tokens} />
                    <InfoRow label="Time to peak" value={ep.timeToPeak ?? '—'} tokens={tokens} />
                    <InfoRow
                      label="Aura"
                      value={
                        ep.auraPresent
                          ? `Yes${ep.auraDurationMin ? ` (${ep.auraDurationMin} min)` : ''}`
                          : 'No/unknown'
                      }
                      tokens={tokens}
                    />
                    <InfoRow
                      label="Key symptoms"
                      value={ep.symptoms.slice(0, 3).join(', ') || '—'}
                      tokens={tokens}
                    />
                    <InfoRow label="Abortive timing" value={ep.abortiveTiming ?? '—'} tokens={tokens} />
                    <InfoRow label="Relief" value={ep.relief ?? '—'} tokens={tokens} />
                  </View>
                ))
              )}
              {summary.episodes.length > 10 && (
                <TouchableOpacity onPress={() => setShowAllEpisodes((v) => !v)}>
                  <Text style={[styles.linkText, { color: tokens.colors.primary }]}>
                    {showAllEpisodes ? 'Show fewer episodes' : 'Show all episodes'}
                  </Text>
                </TouchableOpacity>
              )}
            </Section>

            <Section title="Red flags detected (screening only)" tokens={tokens}>
              {summary.redFlags.length === 0 ? (
                <EmptyState text="No red flags detected in this window." tokens={tokens} />
              ) : (
                summary.redFlags.map((flag) => (
                  <View key={flag.id} style={[styles.card, { backgroundColor: tokens.colors.card }, shadows.low]}>
                    <Text style={[styles.cardTitle, { color: tokens.colors.text }]}>
                      {formatDateTime(flag.startedAt)}
                    </Text>
                    {flag.reasons.map((reason, idx) => (
                      <Text key={idx} style={[styles.cardBody, { color: tokens.colors.textMuted }]}>
                        • {reason}
                      </Text>
                    ))}
                  </View>
                ))
              )}
            </Section>

            <Section title="Medications" tokens={tokens}>
              <Text style={[styles.sectionSubtitle, { color: tokens.colors.textMuted }]}>
                Current preventives (scheduled if available)
              </Text>
              {summary.medication.currentPreventives.filter((med) => med.isActive).length === 0 ? (
                <EmptyState text="No medications recorded." tokens={tokens} />
              ) : (
                summary.medication.currentPreventives
                  .filter((med) => med.isActive)
                  .map((med) => (
                  <View key={med.id} style={[styles.card, { backgroundColor: tokens.colors.card }, shadows.low]}>
                    <Text style={[styles.cardTitle, { color: tokens.colors.text }]}>
                      {med.name}
                    </Text>
                    <Text style={[styles.cardBody, { color: tokens.colors.textMuted }]}>
                      {med.dosage || 'Dose not recorded'}
                    </Text>
                    <Text style={[styles.cardBody, { color: tokens.colors.textMuted }]}>
                      {med.scheduleText ? `Scheduled: ${med.scheduleText}` : 'Scheduled: —'}
                    </Text>
                  </View>
                ))
              )}

              <View style={styles.inlineRow}>
                <Text style={[styles.sectionSubtitle, { color: tokens.colors.textMuted }]}>
                  Previous preventives:
                </Text>
                <Text style={[styles.sectionSubtitle, { color: tokens.colors.text }]}>
                  {summary.medication.previousPreventives.join(', ')}
                </Text>
              </View>

              <Text style={[styles.sectionSubtitle, { color: tokens.colors.textMuted, marginTop: spacing.md }]}>
                Abortive meds used (from logs)
              </Text>
              {summary.medication.abortiveUsageByMed.length === 0 ? (
                <EmptyState text="No abortive medication logs in this window." tokens={tokens} />
              ) : (
                summary.medication.abortiveUsageByMed.map((med) => (
                  <View key={med.name} style={styles.simpleRow}>
                    <Text style={[styles.rowLabel, { color: tokens.colors.text }]}>{med.name}</Text>
                    <Text style={[styles.rowValue, { color: tokens.colors.textMuted }]}>
                      {med.count} uses
                    </Text>
                  </View>
                ))
              )}

              <View style={[styles.noticeCard, { backgroundColor: tokens.colors.surface }]}>
                <Text style={[styles.noticeText, { color: tokens.colors.text }]}>
                  Abortive timing & relief (from episodes)
                </Text>
                <Text style={[styles.cardBody, { color: tokens.colors.textMuted }]}>
                  Timing: {abortiveTimingSummary || '—'}
                </Text>
                <Text style={[styles.cardBody, { color: tokens.colors.textMuted }]}>
                  Relief: {reliefSummary || '—'}
                </Text>
              </View>

              <View style={[styles.noticeCard, { backgroundColor: tokens.colors.surface }]}>
                <Text style={[styles.noticeText, { color: tokens.colors.text }]}>
                  Medication overuse risk (screening only)
                </Text>
                <Text style={[styles.cardBody, { color: tokens.colors.textMuted }]}>
                  Triptan days (per 30): {summary.medication.overuseRisk.triptanPer30} / {summary.medication.overuseRisk.triptanThreshold}
                </Text>
                <Text style={[styles.cardBody, { color: tokens.colors.textMuted }]}>
                  NSAID days (per 30): {summary.medication.overuseRisk.nsaidPer30} / {summary.medication.overuseRisk.nsaidThreshold}
                </Text>
                {summary.medication.overuseRisk.hasRisk && (
                  <Text style={[styles.noticeWarning, { color: tokens.colors.warning }]}>
                    Screening flag: usage exceeds thresholds.
                  </Text>
                )}
              </View>
            </Section>

            <Section title="Blood pressure" tokens={tokens}>
              <View style={styles.summaryGrid}>
                <SummaryCard
                  label="Average"
                  value={
                    summary.bp.avgSystolic && summary.bp.avgDiastolic
                      ? `${summary.bp.avgSystolic}/${summary.bp.avgDiastolic}`
                      : '—'
                  }
                  subtext="Systolic/Diastolic"
                  tokens={tokens}
                />
                <SummaryCard
                  label="Min / Max"
                  value={
                    summary.bp.minSystolic && summary.bp.maxSystolic
                      ? `${summary.bp.minSystolic}-${summary.bp.maxSystolic}`
                      : '—'
                  }
                  subtext={
                    summary.bp.minDiastolic && summary.bp.maxDiastolic
                      ? `${summary.bp.minDiastolic}-${summary.bp.maxDiastolic} diastolic`
                      : '—'
                  }
                  tokens={tokens}
                />
              </View>

              <Text style={[styles.sectionSubtitle, { color: tokens.colors.textMuted }]}>Last 5 readings</Text>
              {summary.bp.lastReadings.length === 0 ? (
                <EmptyState text="No BP readings in this window." tokens={tokens} />
              ) : (
                summary.bp.lastReadings.map((r) => (
                  <View key={r.id} style={styles.simpleRow}>
                    <Text style={[styles.rowLabel, { color: tokens.colors.text }]}>
                      {formatDate(r.measured_at)}
                    </Text>
                    <Text style={[styles.rowValue, { color: tokens.colors.textMuted }]}>
                      {r.systolic}/{r.diastolic}
                    </Text>
                  </View>
                ))
              )}

              <Text style={[styles.sectionSubtitle, { color: tokens.colors.textMuted, marginTop: spacing.md }]}>
                Migraine day vs non-migraine day BP
              </Text>
              {summary.bp.migraineDayAvg && summary.bp.nonMigraineDayAvg ? (
                <View style={styles.compareRow}>
                  <View style={styles.compareItem}>
                    <Text style={[styles.rowLabel, { color: tokens.colors.text }]}>Migraine days</Text>
                    <Text style={[styles.rowValue, { color: tokens.colors.textMuted }]}>
                      {summary.bp.migraineDayAvg.s}/{summary.bp.migraineDayAvg.d}
                    </Text>
                  </View>
                  <View style={styles.compareItem}>
                    <Text style={[styles.rowLabel, { color: tokens.colors.text }]}>Non-migraine days</Text>
                    <Text style={[styles.rowValue, { color: tokens.colors.textMuted }]}>
                      {summary.bp.nonMigraineDayAvg.s}/{summary.bp.nonMigraineDayAvg.d}
                    </Text>
                  </View>
                </View>
              ) : (
                <Text style={[styles.cardBody, { color: tokens.colors.textMuted }]}>
                  Not enough data to compare.
                </Text>
              )}
            </Section>

            <Section title="Correlations & patterns" tokens={tokens}>
              <InfoList label="Top triggers" items={triggerTop} tokens={tokens} />
              <InfoList label="Sleep relation" items={sleepTop} tokens={tokens} />
              <InfoList label="Sensory avoidance" items={sensoryTop} tokens={tokens} />
              <InfoList label="Time of day" items={timeOfDayTop} tokens={tokens} />
              <View style={[styles.noticeCard, { backgroundColor: tokens.colors.surface }]}>
                <Text style={[styles.noticeText, { color: tokens.colors.text }]}>Meditation correlation</Text>
                <Text style={[styles.cardBody, { color: tokens.colors.textMuted }]}>
                  Migraine days: {summary.meditation.migraineDays} · Meditation days: {summary.meditation.meditationDays} · Overlap: {summary.meditation.overlapDays}
                </Text>
              </View>
            </Section>

            {__DEV__ && (
              <Section title="Dev mode" tokens={tokens}>
                <Text style={[styles.codeBlock, { color: tokens.colors.textMuted }]}>
                  {JSON.stringify(
                    {
                      classification: summary.classification,
                      migraineStats: summary.migraineStats,
                      redFlags: summary.redFlags.length,
                    },
                    null,
                    2
                  )}
                </Text>
              </Section>
            )}
          </>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

function Section({
  title,
  tokens,
  children,
}: {
  title: string;
  tokens: any;
  children: React.ReactNode;
}) {
  return (
    <View style={styles.section}>
      <Text style={[styles.sectionTitle, { color: tokens.colors.text }]}>{title}</Text>
      {children}
    </View>
  );
}

function SummaryCard({
  label,
  value,
  subtext,
  tokens,
}: {
  label: string;
  value: string;
  subtext?: string;
  tokens: any;
}) {
  return (
    <View style={[styles.summaryCard, { backgroundColor: tokens.colors.card }, shadows.low]}>
      <Text style={[styles.cardLabel, { color: tokens.colors.textMuted }]}>{label}</Text>
      <Text style={[styles.cardValue, { color: tokens.colors.text }]}>{value}</Text>
      {subtext ? (
        <Text style={[styles.cardSubtext, { color: tokens.colors.textMuted }]}>{subtext}</Text>
      ) : null}
    </View>
  );
}

function InfoRow({
  label,
  value,
  tokens,
}: {
  label: string;
  value: string;
  tokens: any;
}) {
  return (
    <View style={styles.infoRow}>
      <Text style={[styles.rowLabel, { color: tokens.colors.text }]}>{label}</Text>
      <Text style={[styles.rowValue, { color: tokens.colors.textMuted }]}>{value}</Text>
    </View>
  );
}

function EmptyState({ text, tokens }: { text: string; tokens: any }) {
  return (
    <View style={[styles.emptyCard, { backgroundColor: tokens.colors.card }, shadows.low]}>
      <Text style={[styles.cardBody, { color: tokens.colors.textMuted }]}>{text}</Text>
    </View>
  );
}

function Chip({
  label,
  selected,
  onPress,
  tokens,
}: {
  label: string;
  selected: boolean;
  onPress: () => void;
  tokens: any;
}) {
  return (
    <TouchableOpacity
      style={[
        styles.chip,
        {
          backgroundColor: selected ? tokens.colors.primary : tokens.colors.elevatedSurface,
          borderColor: selected ? tokens.colors.primary : tokens.colors.border,
        },
      ]}
      onPress={onPress}
    >
      <Text style={[styles.chipText, { color: selected ? '#fff' : tokens.colors.text }]}>
        {label}
      </Text>
    </TouchableOpacity>
  );
}

function PrimaryButton({
  label,
  onPress,
  tokens,
}: {
  label: string;
  onPress: () => void;
  tokens: any;
}) {
  return (
    <TouchableOpacity
      style={[styles.primaryButton, { backgroundColor: tokens.colors.primary }]}
      onPress={onPress}
    >
      <Text style={[styles.primaryButtonText, { color: '#fff' }]}>{label}</Text>
    </TouchableOpacity>
  );
}

function SecondaryButton({
  label,
  onPress,
  tokens,
}: {
  label: string;
  onPress: () => void;
  tokens: any;
}) {
  return (
    <TouchableOpacity
      style={[styles.secondaryButton, { borderColor: tokens.colors.border }]}
      onPress={onPress}
    >
      <Text style={[styles.secondaryButtonText, { color: tokens.colors.text }]}>{label}</Text>
    </TouchableOpacity>
  );
}

function InfoList({
  label,
  items,
  tokens,
}: {
  label: string;
  items: Array<[string, number]>;
  tokens: any;
}) {
  return (
    <View style={styles.infoList}>
      <Text style={[styles.sectionSubtitle, { color: tokens.colors.textMuted }]}>{label}</Text>
      {items.length === 0 ? (
        <Text style={[styles.cardBody, { color: tokens.colors.textMuted }]}>—</Text>
      ) : (
        items.map(([item, count]) => (
          <View key={item} style={styles.simpleRow}>
            <Text style={[styles.rowLabel, { color: tokens.colors.text }]}>{item}</Text>
            <Text style={[styles.rowValue, { color: tokens.colors.textMuted }]}>{count}</Text>
          </View>
        ))
      )}
    </View>
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
    marginBottom: spacing.lg,
  },
  title: {
    fontSize: 28,
    fontFamily: 'Nunito-Bold',
  },
  subtitle: {
    fontSize: 14,
    fontFamily: 'Nunito-Regular',
    marginTop: spacing.xs,
  },
  segmentedRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.xs,
    marginBottom: spacing.md,
  },
  customRangeRow: {
    marginBottom: spacing.md,
    gap: spacing.sm,
  },
  actionRow: {
    flexDirection: 'row',
    gap: spacing.sm,
    marginBottom: spacing.lg,
  },
  loadingCard: {
    alignItems: 'center',
    paddingVertical: spacing.huge,
  },
  loadingText: {
    marginTop: spacing.sm,
    fontSize: 14,
    fontFamily: 'Nunito-Regular',
  },
  section: {
    marginBottom: spacing.xl,
  },
  sectionTitle: {
    fontSize: 18,
    fontFamily: 'Nunito-Bold',
    marginBottom: spacing.sm,
  },
  sectionSubtitle: {
    fontSize: 13,
    fontFamily: 'Nunito-Regular',
    marginBottom: spacing.xs,
  },
  summaryGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.sm,
  },
  summaryCard: {
    width: '48%',
    borderRadius: borderRadius.xl,
    padding: spacing.md,
  },
  cardLabel: {
    fontSize: 12,
    fontFamily: 'Nunito-SemiBold',
  },
  cardValue: {
    fontSize: 18,
    fontFamily: 'Nunito-Bold',
    marginTop: spacing.xs,
  },
  cardSubtext: {
    fontSize: 12,
    fontFamily: 'Nunito-Regular',
    marginTop: spacing.xxs,
  },
  card: {
    borderRadius: borderRadius.xl,
    padding: spacing.md,
    marginBottom: spacing.sm,
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.xs,
  },
  cardTitle: {
    fontSize: 15,
    fontFamily: 'Nunito-SemiBold',
  },
  cardBody: {
    fontSize: 13,
    fontFamily: 'Nunito-Regular',
  },
  badge: {
    fontSize: 12,
    fontFamily: 'Nunito-Bold',
  },
  infoRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: spacing.xxs,
  },
  simpleRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: spacing.xs,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(0,0,0,0.05)',
  },
  rowLabel: {
    fontSize: 13,
    fontFamily: 'Nunito-Regular',
  },
  rowValue: {
    fontSize: 13,
    fontFamily: 'Nunito-SemiBold',
  },
  emptyCard: {
    borderRadius: borderRadius.lg,
    padding: spacing.md,
  },
  linkText: {
    fontSize: 14,
    fontFamily: 'Nunito-SemiBold',
    textAlign: 'center',
    marginTop: spacing.sm,
  },
  noticeCard: {
    borderRadius: borderRadius.lg,
    padding: spacing.md,
    marginTop: spacing.sm,
  },
  noticeText: {
    fontSize: 14,
    fontFamily: 'Nunito-SemiBold',
  },
  noticeWarning: {
    marginTop: spacing.xs,
    fontSize: 12,
    fontFamily: 'Nunito-SemiBold',
  },
  chip: {
    paddingVertical: spacing.xs,
    paddingHorizontal: spacing.sm,
    borderRadius: borderRadius.full,
    borderWidth: 1,
  },
  chipText: {
    fontSize: 12,
    fontFamily: 'Nunito-SemiBold',
  },
  primaryButton: {
    flex: 1,
    paddingVertical: spacing.sm,
    borderRadius: borderRadius.full,
    alignItems: 'center',
  },
  primaryButtonText: {
    fontSize: 14,
    fontFamily: 'Nunito-SemiBold',
  },
  secondaryButton: {
    flex: 1,
    paddingVertical: spacing.sm,
    borderRadius: borderRadius.full,
    borderWidth: 1,
    alignItems: 'center',
  },
  secondaryButtonText: {
    fontSize: 14,
    fontFamily: 'Nunito-SemiBold',
  },
  compareRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: spacing.xs,
  },
  compareItem: {
    flex: 1,
  },
  inlineRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.xs,
    marginTop: spacing.sm,
  },
  infoList: {
    marginBottom: spacing.sm,
  },
  codeBlock: {
    fontSize: 12,
    fontFamily: 'Courier',
  },
});
