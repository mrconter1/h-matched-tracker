import { calculateTimeToSolve, getStatus, type Benchmark } from '@/data/benchmarks';
import { kaplanMeier } from '@/lib/survival';

const YEAR_MS = 365.25 * 24 * 60 * 60 * 1000;

export const formatDate = (iso: string | null) => {
  if (iso === null) return 'Unsolved';
  return new Intl.DateTimeFormat('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    timeZone: 'UTC',
  }).format(new Date(iso));
};

export const formatYears = (years: number) => `${years.toFixed(2)} years`;

export const formatPercent = (fraction: number) => `${(fraction * 100).toFixed(1)}%`;

export const getDecimalYear = (iso: string) => {
  const date = new Date(iso);
  return date.getUTCFullYear() + date.getUTCMonth() / 12 + date.getUTCDate() / 365;
};

export type Duration = {
  wholeYears: number;
  months: number;
  days: number;
  isNegative: boolean;
  isUnsolved: boolean;
};

export const toDuration = (years: number): Duration => {
  if (!isFinite(years)) {
    return { wholeYears: 0, months: 0, days: 0, isNegative: false, isUnsolved: true };
  }
  const isNegative = years < 0;
  const absYears = Math.abs(years);
  const totalDays = absYears * 365.25;
  const wholeYears = Math.floor(absYears);
  const remainingDays = totalDays - wholeYears * 365.25;
  const months = Math.floor(remainingDays / 30.44);
  const days = Math.round(remainingDays % 30.44);
  return { wholeYears, months, days, isNegative, isUnsolved: false };
};

/** "1y 10m", "8m 4d", "-23d" - compact form for tight spaces. */
export const formatDurationShort = (years: number) => {
  const d = toDuration(years);
  if (d.isUnsolved) return '-';
  const parts: string[] = [];
  if (d.wholeYears > 0) parts.push(`${d.wholeYears}y`);
  if (d.months > 0) parts.push(`${d.months}m`);
  if (parts.length < 2 && d.days > 0) parts.push(`${d.days}d`);
  if (parts.length === 0) parts.push('0d');
  return `${d.isNegative ? '-' : ''}${parts.join(' ')}`;
};

export type GlobalStats = {
  total: number;
  solvedCount: number;
  openCount: number;
  unreportedCount: number;
  solvedFraction: number;
  avgTimeToSolveYears: number;
  avgTimeToSolveLast3Years: number | null;
  medianTimeToSolveYears: number;
  minTimeToSolveYears: number;
  maxTimeToSolveYears: number;
  solvedWithin1yFraction: number;
  solvedWithin2yFraction: number;
  solvedWithin3yFraction: number;
  /** Over open benchmarks only - unreported ones are a reporting gap, not evidence. */
  longestOpenYears: number | null;
  /** Kaplan-Meier median over every benchmark; open/unreported rows are censored, not dropped. */
  survivalMedianYears: number | null;
};

export const calculateGlobalStats = (data: Benchmark[], now: Date = new Date()): GlobalStats => {
  const solved = data.filter(item => item.solved.date !== null);
  const open = data.filter(item => getStatus(item) === 'open');
  const unreported = data.filter(item => getStatus(item) === 'unreported');
  const solvedCount = solved.length;

  const empty: GlobalStats = {
    total: data.length,
    solvedCount,
    openCount: open.length,
    unreportedCount: unreported.length,
    solvedFraction: 0,
    avgTimeToSolveYears: 0,
    avgTimeToSolveLast3Years: null,
    medianTimeToSolveYears: 0,
    minTimeToSolveYears: 0,
    maxTimeToSolveYears: 0,
    solvedWithin1yFraction: 0,
    solvedWithin2yFraction: 0,
    solvedWithin3yFraction: 0,
    longestOpenYears: null,
    survivalMedianYears: null,
  };
  if (solvedCount === 0) return empty;

  const times = solved.map(item => calculateTimeToSolve(item.release, item.solved));
  const sorted = [...times].sort((a, b) => a - b);
  const mid = Math.floor(sorted.length / 2);

  const threeYearsAgo = new Date(now.getTime() - 3 * YEAR_MS);
  const recent = solved.filter(item => new Date(item.release) >= threeYearsAgo);

  return {
    ...empty,
    solvedFraction: solvedCount / data.length,
    avgTimeToSolveYears: times.reduce((a, b) => a + b, 0) / solvedCount,
    avgTimeToSolveLast3Years:
      recent.length > 0
        ? recent.reduce((acc, item) => acc + calculateTimeToSolve(item.release, item.solved), 0) / recent.length
        : null,
    medianTimeToSolveYears: sorted.length % 2 === 0 ? (sorted[mid - 1] + sorted[mid]) / 2 : sorted[mid],
    minTimeToSolveYears: Math.min(...times),
    maxTimeToSolveYears: Math.max(...times),
    solvedWithin1yFraction: times.filter(t => t <= 1).length / solvedCount,
    solvedWithin2yFraction: times.filter(t => t <= 2).length / solvedCount,
    solvedWithin3yFraction: times.filter(t => t <= 3).length / solvedCount,
    longestOpenYears:
      open.length > 0
        ? Math.max(...open.map(item => (now.getTime() - new Date(item.release).getTime()) / YEAR_MS))
        : null,
    survivalMedianYears: kaplanMeier(data, now).median,
  };
};

export type ScatterPoint = {
  name: string;
  released: number;
  timeToSolve: number;
  releaseDate: string;
  solvedDate: string;
  model?: string;
  contested?: boolean;
  isLatest: boolean;
};

/** Newest h-match by solved date - the thing worth calling out at the top of the page. */
export const latestSolved = (data: Benchmark[]): Benchmark | null =>
  data
    .filter(item => item.solved.date !== null)
    .sort((a, b) => new Date(b.solved.date as string).getTime() - new Date(a.solved.date as string).getTime())[0] ?? null;

export const prepareScatterData = (data: Benchmark[]): ScatterPoint[] => {
  const latest = latestSolved(data);
  return data
    .filter(item => item.solved.date !== null)
    .sort((a, b) => new Date(a.release).getTime() - new Date(b.release).getTime())
    .map(item => ({
      name: item.benchmark,
      released: Number(getDecimalYear(item.release).toFixed(2)),
      timeToSolve: calculateTimeToSolve(item.release, item.solved),
      releaseDate: formatDate(item.release),
      solvedDate: formatDate(item.solved.date),
      model: item.solved.model,
      contested: item.solved.contested,
      isLatest: latest?.benchmark === item.benchmark,
    }));
};

/**
 * Least-squares line through the solved points, clipped to the plot area.
 * It is drawn for continuity with the original chart; the survival curves
 * are the honest trend, because this fit ignores censoring.
 */
export const calculateTrendLine = (
  points: ScatterPoint[],
  bounds: { minX: number; maxX: number; minY: number; maxY: number }
) => {
  if (points.length < 2) return [];
  const n = points.length;
  const sumX = points.reduce((acc, p) => acc + p.released, 0);
  const sumY = points.reduce((acc, p) => acc + p.timeToSolve, 0);
  const sumXY = points.reduce((acc, p) => acc + p.released * p.timeToSolve, 0);
  const sumXX = points.reduce((acc, p) => acc + p.released ** 2, 0);
  const denom = n * sumXX - sumX * sumX;
  if (denom === 0) return [];
  const slope = (n * sumXY - sumX * sumY) / denom;
  const intercept = (sumY - slope * sumX) / n;

  const clampY = (y: number) => Math.min(bounds.maxY, Math.max(bounds.minY, y));
  const yAt = (x: number) => slope * x + intercept;

  let startX = bounds.minX;
  let endX = bounds.maxX;
  // If the line leaves the plot vertically, stop it at the edge instead of overshooting.
  if (slope !== 0) {
    const xAtMinY = (bounds.minY - intercept) / slope;
    const xAtMaxY = (bounds.maxY - intercept) / slope;
    const [xLo, xHi] = slope < 0 ? [xAtMaxY, xAtMinY] : [xAtMinY, xAtMaxY];
    startX = Math.max(startX, xLo);
    endX = Math.min(endX, xHi);
  }
  if (endX <= startX) return [];
  return [
    { released: startX, trend: clampY(yAt(startX)) },
    { released: endX, trend: clampY(yAt(endX)) },
  ];
};
