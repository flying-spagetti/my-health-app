export type DoctorSummaryInput = {
  migraines: any[];
  bpReadings: any[];
  medications: any[];
  schedules: any[];
  medicationLogs: any[];
  meditationLogs: any[];
  rangeStart: number;
  rangeEnd: number;
};

export type SummaryEpisode = {
  id: string;
  startedAt: number | null;
  endedAt?: number | null;
  durationMin?: number | null;
  severity?: number | null;
  onsetSpeed?: string | null;
  timeToPeak?: string | null;
  auraPresent: boolean;
  auraDurationMin?: number | null;
  auraTypes: string[];
  symptoms: string[];
  abortiveTiming?: string | null;
  relief?: string | null;
  functionalImpact: string[];
  sleepRelation: string[];
  sensoryAvoidance: string[];
  note?: string | null;
};

export type RedFlag = {
  id: string;
  startedAt: number | null;
  reasons: string[];
};

export type DoctorSummary = {
  window: {
    startMs: number;
    endMs: number;
    days: number;
  };
  classification: {
    type: 'episodic' | 'chronic' | 'insufficient-data';
    headacheDays: number;
    migraineDays: number;
    criteriaText: string;
  };
  migraineStats: {
    avgSeverity: number | null;
    maxSeverity: number | null;
    avgDurationMin: number | null;
    ongoingPercent: number | null;
    auraRatePercent: number | null;
    topAuraTypes: string[];
    impairmentRatePercent: number | null;
  };
  episodes: SummaryEpisode[];
  redFlags: RedFlag[];
  triggerCounts: Record<string, number>;
  sleepRelationCounts: Record<string, number>;
  sensoryAvoidanceCounts: Record<string, number>;
  timeOfDayCounts: Record<string, number>;
  abortiveTimingCounts: Record<string, number>;
  reliefCounts: Record<string, number>;
  medication: {
    currentPreventives: Array<{
      id: string;
      name: string;
      dosage?: string | null;
      scheduleText?: string | null;
      isActive: boolean;
    }>;
    previousPreventives: string[];
    abortiveUsageByMed: Array<{
      name: string;
      count: number;
      category: 'triptan' | 'nsaid' | 'other';
    }>;
    overuseRisk: {
      triptanDays: number;
      nsaidDays: number;
      triptanThreshold: number;
      nsaidThreshold: number;
      triptanPer30: number;
      nsaidPer30: number;
      hasRisk: boolean;
    };
  };
  bp: {
    avgSystolic: number | null;
    avgDiastolic: number | null;
    minSystolic: number | null;
    maxSystolic: number | null;
    minDiastolic: number | null;
    maxDiastolic: number | null;
    lastReadings: any[];
    migraineDayAvg?: { s: number; d: number } | null;
    nonMigraineDayAvg?: { s: number; d: number } | null;
  };
  meditation: {
    migraineDays: number;
    meditationDays: number;
    overlapDays: number;
  };
};

const TRIPTAN_KEYWORDS = [
  'triptan',
  'sumatriptan',
  'rizatriptan',
  'zolmitriptan',
  'naratriptan',
  'almotriptan',
  'frovatriptan',
  'eletriptan',
];

const NSAID_KEYWORDS = [
  'naxdom',
  'naproxen',
  'ibuprofen',
  'diclofenac',
  'ketorolac',
  'indomethacin',
  'celecoxib',
  'aspirin',
];

const IMPAIRMENT_FLAGS = ['Missed work/school', 'Bed rest required'];

const FOCAL_SYMPTOM_KEYWORDS = [
  'weakness',
  'numbness',
  'speech',
  'vision loss',
  'double vision',
  'facial droop',
  'confusion',
  'seizure',
];

const VOMIT_KEYWORDS = ['vomit', 'vomiting'];

function toDateKey(ms: number) {
  const d = new Date(ms);
  d.setHours(0, 0, 0, 0);
  return d.getTime();
}

function safeNumber(value: any): number | null {
  return typeof value === 'number' && !Number.isNaN(value) ? value : null;
}

function parseList(value: any): string[] {
  if (!value) return [];
  if (Array.isArray(value)) return value.filter(Boolean);
  if (typeof value === 'string') {
    const trimmed = value.trim();
    if (!trimmed) return [];
    try {
      const parsed = JSON.parse(trimmed);
      if (Array.isArray(parsed)) {
        return parsed.filter(Boolean);
      }
    } catch {
      return trimmed.split(',').map((v) => v.trim()).filter(Boolean);
    }
  }
  return [];
}

function getAuraInfo(entry: any) {
  const auraPresent =
    entry?.aura_present === true ||
    Boolean(entry?.aura_type) ||
    Boolean(entry?.aura_types) ||
    safeNumber(entry?.aura_duration_min) !== null ||
    safeNumber(entry?.aura_duration) !== null;

  const auraDurationMin =
    safeNumber(entry?.aura_duration_min) ??
    safeNumber(entry?.aura_duration) ??
    null;

  const auraTypes = [
    ...parseList(entry?.aura_types),
    ...(entry?.aura_type ? [entry?.aura_type] : []),
    ...parseList(entry?.aura_description),
  ].map((t) => t.trim()).filter(Boolean);

  return { auraPresent, auraDurationMin, auraTypes };
}

function isMigraineEpisode(entry: any) {
  const severity = safeNumber(entry?.severity) ?? 0;
  const aura = getAuraInfo(entry).auraPresent;
  return severity >= 5 || aura;
}

function getDurationMin(entry: any): number | null {
  const startedAt = safeNumber(entry?.started_at);
  const endedAt = safeNumber(entry?.ended_at);
  if (!startedAt || !endedAt || endedAt <= startedAt) return null;
  return Math.round((endedAt - startedAt) / (1000 * 60));
}

function countBy(items: string[]) {
  return items.reduce<Record<string, number>>((acc, item) => {
    acc[item] = (acc[item] || 0) + 1;
    return acc;
  }, {});
}

function topKeys(counts: Record<string, number>, limit: number) {
  return Object.entries(counts)
    .sort((a, b) => b[1] - a[1])
    .slice(0, limit)
    .map(([k]) => k);
}

function classifyMedCategory(name: string): 'triptan' | 'nsaid' | 'other' {
  const lower = name.toLowerCase();
  if (TRIPTAN_KEYWORDS.some((k) => lower.includes(k))) return 'triptan';
  if (NSAID_KEYWORDS.some((k) => lower.includes(k))) return 'nsaid';
  return 'other';
}

function formatScheduleText(schedules: any[]) {
  if (!schedules || schedules.length === 0) return null;
  const parts = schedules.map((s) => {
    const days = parseList(s?.days_of_week)
      .map((d) => Number(d))
      .filter((d) => Number.isFinite(d));
    const dayNames = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
    const dayText = days.length > 0
      ? days.map((d) => dayNames[d] || '').filter(Boolean).join(', ')
      : 'Daily';
    const time = s?.time_of_day || 'time';
    return `${dayText} @ ${time}`;
  });
  return parts.join('; ');
}

function formatTimeOfDay(ms: number) {
  const hour = new Date(ms).getHours();
  if (hour >= 5 && hour <= 11) return 'Morning';
  if (hour >= 12 && hour <= 16) return 'Afternoon';
  if (hour >= 17 && hour <= 21) return 'Evening';
  return 'Night';
}

function computeBpAverages(readings: any[]) {
  if (!readings.length) return { s: null, d: null };
  const sValues = readings.map((r) => safeNumber(r?.systolic)).filter((v): v is number => v !== null);
  const dValues = readings.map((r) => safeNumber(r?.diastolic)).filter((v): v is number => v !== null);
  if (!sValues.length || !dValues.length) return { s: null, d: null };
  const avgS = Math.round(sValues.reduce((a, b) => a + b, 0) / sValues.length);
  const avgD = Math.round(dValues.reduce((a, b) => a + b, 0) / dValues.length);
  return { s: avgS, d: avgD };
}

export function computeDoctorSummary(input: DoctorSummaryInput): DoctorSummary {
  const {
    migraines,
    bpReadings,
    medications,
    schedules,
    medicationLogs,
    meditationLogs,
    rangeStart,
    rangeEnd,
  } = input;

  const windowDays = Math.max(1, Math.ceil((rangeEnd - rangeStart) / (1000 * 60 * 60 * 24)));

  const episodes: SummaryEpisode[] = migraines
    .slice()
    .sort((a, b) => (b.started_at || 0) - (a.started_at || 0))
    .map((entry) => {
      const { auraPresent, auraDurationMin, auraTypes } = getAuraInfo(entry);
      return {
        id: entry?.id || String(entry?.started_at || Math.random()),
        startedAt: typeof entry?.started_at === 'number' ? entry.started_at : null,
        endedAt: entry?.ended_at ?? null,
        durationMin: getDurationMin(entry),
        severity: safeNumber(entry?.severity),
        onsetSpeed: entry?.onset_speed || null,
        timeToPeak: entry?.time_to_peak || null,
        auraPresent,
        auraDurationMin,
        auraTypes,
        symptoms: parseList(entry?.symptoms),
        abortiveTiming: entry?.abortive_timing || null,
        relief: entry?.relief || null,
        functionalImpact: parseList(entry?.functional_disability),
        sleepRelation: parseList(entry?.sleep_relation),
        sensoryAvoidance: parseList(entry?.sensory_avoidance),
        note: entry?.note || null,
      };
    });

  const headacheDayKeys = new Set<number>();
  const migraineDayKeys = new Set<number>();
  const severityValues: number[] = [];
  const durationValues: number[] = [];
  let ongoingCount = 0;
  let auraCount = 0;
  const auraTypesAll: string[] = [];
  let impairmentCount = 0;

  episodes.forEach((ep) => {
    if (typeof ep.startedAt === 'number') {
      headacheDayKeys.add(toDateKey(ep.startedAt));
    }
    if (typeof ep.startedAt === 'number' && isMigraineEpisode(ep)) {
      migraineDayKeys.add(toDateKey(ep.startedAt));
    }
    if (typeof ep.severity === 'number') {
      severityValues.push(ep.severity);
    }
    if (ep.durationMin !== null && ep.durationMin !== undefined) {
      durationValues.push(ep.durationMin);
    } else {
      ongoingCount += 1;
    }
    if (ep.auraPresent) {
      auraCount += 1;
      auraTypesAll.push(...ep.auraTypes);
    }
    if (ep.functionalImpact.some((f) => IMPAIRMENT_FLAGS.includes(f))) {
      impairmentCount += 1;
    }
  });

  const headacheDays = headacheDayKeys.size;
  const migraineDays = migraineDayKeys.size;
  const avgSeverity =
    severityValues.length > 0
      ? Math.round(severityValues.reduce((a, b) => a + b, 0) / severityValues.length)
      : null;
  const maxSeverity =
    severityValues.length > 0 ? Math.max(...severityValues) : null;
  const avgDurationMin =
    durationValues.length > 0
      ? Math.round(durationValues.reduce((a, b) => a + b, 0) / durationValues.length)
      : null;
  const ongoingPercent =
    episodes.length > 0 ? Math.round((ongoingCount / episodes.length) * 100) : null;
  const auraRatePercent =
    episodes.length > 0 ? Math.round((auraCount / episodes.length) * 100) : null;
  const impairmentRatePercent =
    episodes.length > 0 ? Math.round((impairmentCount / episodes.length) * 100) : null;

  const classification =
    headacheDays >= 15 && migraineDays >= 8
      ? 'chronic'
      : episodes.length > 0
        ? 'episodic'
        : 'insufficient-data';

  const triggerCountsFromEntries = countBy(
    migraines.flatMap((m) => parseList(m?.triggers))
  );
  const sleepRelationCounts = countBy(
    episodes.flatMap((e) => e.sleepRelation)
  );
  const sensoryAvoidanceCounts = countBy(
    episodes.flatMap((e) => e.sensoryAvoidance)
  );
  const timeOfDayCounts = countBy(
    episodes
      .filter((e) => typeof e.startedAt === 'number')
      .map((e) => formatTimeOfDay(e.startedAt))
  );

  const abortiveTimingCounts = countBy(
    episodes.map((e) => e.abortiveTiming || 'Not recorded')
  );
  const reliefCounts = countBy(
    episodes.map((e) => e.relief || 'Not recorded')
  );

  const redFlags: RedFlag[] = [];
  episodes.forEach((ep) => {
    const reasons: string[] = [];
    if (ep.onsetSpeed?.toLowerCase().includes('sudden') && (ep.severity ?? 0) >= 8) {
      reasons.push('Sudden onset with severe pain (≥8/10).');
    }
    if ((ep.auraDurationMin ?? 0) > 60) {
      reasons.push('Aura duration > 60 minutes.');
    }
    if (
      ep.sleepRelation.some((s) => s.toLowerCase().includes('woke from sleep')) &&
      ep.symptoms.some((s) => VOMIT_KEYWORDS.some((k) => s.toLowerCase().includes(k)))
    ) {
      reasons.push('Woke from sleep with vomiting.');
    }
    if (ep.symptoms.some((s) => FOCAL_SYMPTOM_KEYWORDS.some((k) => s.toLowerCase().includes(k)))) {
      reasons.push('Possible new focal symptoms reported.');
    }
    if (reasons.length > 0) {
      redFlags.push({
        id: ep.id,
        startedAt: ep.startedAt,
        reasons,
      });
    }
  });

  const auraTypeCounts = countBy(auraTypesAll);

  const scheduleMap = new Map<string, any[]>();
  schedules.forEach((s) => {
    if (s?.parent_type !== 'medication') return;
    const list = scheduleMap.get(s.parent_id) || [];
    list.push(s);
    scheduleMap.set(s.parent_id, list);
  });

  const currentPreventives = medications.map((med) => ({
    id: med.id,
    name: med.name,
    dosage: med.dosage || null,
    scheduleText: formatScheduleText(scheduleMap.get(med.id) || []),
    isActive: med.is_active === 1 || med.is_active === true,
  }));

  const abortiveUsageByMedMap = new Map<string, number>();
  let triptanTotal = 0;
  let naxdomTotal = 0;
  medicationLogs.forEach((log) => {
    const name = log?.medication_name || log?.name;
    if (!name) return;
    const key = String(name).trim();
    abortiveUsageByMedMap.set(key, (abortiveUsageByMedMap.get(key) || 0) + 1);
    const category = classifyMedCategory(key);
    if (category === 'triptan') {
      triptanTotal += 1;
    }
    if (key.toLowerCase().includes('naxdom')) {
      naxdomTotal += 1;
    }
  });

  const abortiveUsageByMed = Array.from(abortiveUsageByMedMap.entries())
    .map(([name, count]) => ({
      name,
      count,
      category: classifyMedCategory(name),
    }))
    .sort((a, b) => b.count - a.count);

  if (!abortiveUsageByMed.some((m) => m.name.toLowerCase().includes('triptan'))) {
    abortiveUsageByMed.unshift({
      name: 'Triptans (all)',
      count: triptanTotal,
      category: 'triptan',
    });
  }
  if (!abortiveUsageByMed.some((m) => m.name.toLowerCase().includes('naxdom'))) {
    abortiveUsageByMed.unshift({
      name: 'Naxdom',
      count: naxdomTotal,
      category: 'nsaid',
    });
  }

  const abortiveDays = new Map<'triptan' | 'nsaid', Set<number>>([
    ['triptan', new Set()],
    ['nsaid', new Set()],
  ]);
  medicationLogs.forEach((log) => {
    const name = log?.medication_name || log?.name;
    if (!name || !log?.taken_at) return;
    const category = classifyMedCategory(name);
    if (category === 'triptan' || category === 'nsaid') {
      abortiveDays.get(category)?.add(toDateKey(log.taken_at));
    }
  });
  const triptanDays = abortiveDays.get('triptan')?.size || 0;
  const nsaidDays = abortiveDays.get('nsaid')?.size || 0;
  const triptanThreshold = 10;
  const nsaidThreshold = 15;
  const triptanPer30 = Math.round((triptanDays / windowDays) * 30);
  const nsaidPer30 = Math.round((nsaidDays / windowDays) * 30);

  const bpSorted = bpReadings
    .slice()
    .sort((a, b) => (b.measured_at || 0) - (a.measured_at || 0));
  const sValues = bpReadings.map((r) => safeNumber(r?.systolic)).filter((v): v is number => v !== null);
  const dValues = bpReadings.map((r) => safeNumber(r?.diastolic)).filter((v): v is number => v !== null);
  const avgSystolic = sValues.length ? Math.round(sValues.reduce((a, b) => a + b, 0) / sValues.length) : null;
  const avgDiastolic = dValues.length ? Math.round(dValues.reduce((a, b) => a + b, 0) / dValues.length) : null;
  const minSystolic = sValues.length ? Math.min(...sValues) : null;
  const maxSystolic = sValues.length ? Math.max(...sValues) : null;
  const minDiastolic = dValues.length ? Math.min(...dValues) : null;
  const maxDiastolic = dValues.length ? Math.max(...dValues) : null;

  const migraineDayReadings = bpReadings.filter((r) => migraineDayKeys.has(toDateKey(r.measured_at)));
  const nonMigraineDayReadings = bpReadings.filter((r) => !migraineDayKeys.has(toDateKey(r.measured_at)));
  const migraineDayAvg = computeBpAverages(migraineDayReadings);
  const nonMigraineDayAvg = computeBpAverages(nonMigraineDayReadings);

  const meditationDayKeys = new Set<number>();
  meditationLogs.forEach((m) => {
    const ts = m?.session_date || m?.date || m?.logged_at;
    if (typeof ts === 'number') {
      meditationDayKeys.add(toDateKey(ts));
    }
  });
  const overlapDays = new Set<number>();
  migraineDayKeys.forEach((key) => {
    if (meditationDayKeys.has(key)) overlapDays.add(key);
  });

  return {
    window: {
      startMs: rangeStart,
      endMs: rangeEnd,
      days: windowDays,
    },
    classification: {
      type: classification,
      headacheDays,
      migraineDays,
      criteriaText: 'Chronic if ≥15 headache days AND ≥8 migraine days per 30 days.',
    },
    migraineStats: {
      avgSeverity,
      maxSeverity,
      avgDurationMin,
      ongoingPercent,
      auraRatePercent,
      topAuraTypes: topKeys(auraTypeCounts, 3),
      impairmentRatePercent,
    },
    episodes,
    redFlags,
    triggerCounts: triggerCountsFromEntries,
    sleepRelationCounts,
    sensoryAvoidanceCounts,
    timeOfDayCounts,
    abortiveTimingCounts,
    reliefCounts,
    medication: {
      currentPreventives,
      previousPreventives: ['Propranolol', 'Amitriptyline', 'Tranxiety'],
      abortiveUsageByMed,
      overuseRisk: {
        triptanDays,
        nsaidDays,
        triptanThreshold,
        nsaidThreshold,
        triptanPer30,
        nsaidPer30,
        hasRisk: triptanPer30 >= triptanThreshold || nsaidPer30 >= nsaidThreshold,
      },
    },
    bp: {
      avgSystolic,
      avgDiastolic,
      minSystolic,
      maxSystolic,
      minDiastolic,
      maxDiastolic,
      lastReadings: bpSorted.slice(0, 5),
      migraineDayAvg:
        migraineDayAvg.s !== null && migraineDayAvg.d !== null ? migraineDayAvg : null,
      nonMigraineDayAvg:
        nonMigraineDayAvg.s !== null && nonMigraineDayAvg.d !== null ? nonMigraineDayAvg : null,
    },
    meditation: {
      migraineDays,
      meditationDays: meditationDayKeys.size,
      overlapDays: overlapDays.size,
    },
  };
}

export function formatDoctorSummaryText(summary: DoctorSummary) {
  const { window, classification, migraineStats, medication, bp, meditation } = summary;
  const formatDate = (ms: number) =>
    new Date(ms).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });

  const triggerTop = topKeys(summary.triggerCounts, 5);
  const sleepTop = topKeys(summary.sleepRelationCounts, 3);
  const sensoryTop = topKeys(summary.sensoryAvoidanceCounts, 3);
  const timeOfDayTop = topKeys(summary.timeOfDayCounts, 4);
  const currentPreventives = summary.medication.currentPreventives
    .filter((m) => m.isActive)
    .map((m) => `${m.name}${m.dosage ? ` (${m.dosage})` : ''}`)
    .join(', ');

  const abortiveList = medication.abortiveUsageByMed.length
    ? medication.abortiveUsageByMed.map((m) => `${m.name} (${m.count})`).join(', ')
    : 'No abortive logs in window';

  const bpCompare =
    bp.migraineDayAvg && bp.nonMigraineDayAvg
      ? `Migraine-day avg BP ${bp.migraineDayAvg.s}/${bp.migraineDayAvg.d} vs non-migraine ${bp.nonMigraineDayAvg.s}/${bp.nonMigraineDayAvg.d}`
      : 'Migraine-day vs non-migraine BP comparison unavailable';

  const redFlagsText = summary.redFlags.length
    ? summary.redFlags
        .map((f) => `${new Date(f.startedAt).toLocaleString('en-US')}: ${f.reasons.join(' ')}`)
        .join('\n')
    : 'None detected';

  return [
    'Doctor Visit Summary',
    'Patient: Male, 22, diagnosed migraine with aura and vestibular.',
    `Time window: ${formatDate(window.startMs)} – ${formatDate(window.endMs)} (${window.days} days)`,
    '',
    `Classification: ${classification.type} (${classification.criteriaText})`,
    `Headache days: ${classification.headacheDays}`,
    `Migraine days: ${classification.migraineDays}`,
    `Average severity: ${migraineStats.avgSeverity ?? '—'}; Max: ${migraineStats.maxSeverity ?? '—'}`,
    `Average duration (resolved): ${migraineStats.avgDurationMin ?? '—'} min; Ongoing: ${migraineStats.ongoingPercent ?? '—'}%`,
    `Aura rate: ${migraineStats.auraRatePercent ?? '—'}%; Top aura types: ${migraineStats.topAuraTypes.join(', ') || '—'}`,
    `Impairment rate: ${migraineStats.impairmentRatePercent ?? '—'}%`,
    '',
    `Current preventives: ${currentPreventives || '—'}`,
    `Previous preventives: ${medication.previousPreventives.join(', ') || '—'}`,
    `Abortive meds used: ${abortiveList}`,
    `Abortive timing: ${Object.entries(summary.abortiveTimingCounts)
      .map(([k, v]) => `${k} ${v}`)
      .join(', ') || '—'}`,
    `Relief outcomes: ${Object.entries(summary.reliefCounts)
      .map(([k, v]) => `${k} ${v}`)
      .join(', ') || '—'}`,
    `Medication overuse risk (screening only): triptan ${medication.overuseRisk.triptanPer30}/30 days, NSAID ${medication.overuseRisk.nsaidPer30}/30 days`,
    '',
    `BP summary: Avg ${bp.avgSystolic ?? '—'}/${bp.avgDiastolic ?? '—'}, Min ${bp.minSystolic ?? '—'}/${bp.minDiastolic ?? '—'}, Max ${bp.maxSystolic ?? '—'}/${bp.maxDiastolic ?? '—'}`,
    bpCompare,
    '',
    `Top triggers: ${triggerTop.join(', ') || '—'}`,
    `Sleep relation: ${sleepTop.join(', ') || '—'}`,
    `Sensory avoidance: ${sensoryTop.join(', ') || '—'}`,
    `Time of day pattern: ${timeOfDayTop.join(', ') || '—'}`,
    `Meditation days: ${meditation.meditationDays}; Migraine days: ${meditation.migraineDays}; Overlap: ${meditation.overlapDays}`,
    '',
    `Red flags: ${redFlagsText}`,
    '',
    'Note: Collected via personal diary app; not a diagnosis.',
  ].join('\n');
}
