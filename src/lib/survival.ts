import { getStatus, type Benchmark } from '@/data/benchmarks';

/**
 * Kaplan-Meier survival estimation for "time until a benchmark is h-matched".
 *
 * The naive approach - average the solve times of the solved benchmarks - is
 * biased: a benchmark released two years ago that will take five years to solve
 * cannot be in the solved set yet, so recent cohorts look faster than they are.
 * Survival analysis fixes this by keeping every benchmark in the denominator
 * until we stop observing it:
 *
 *   solved      -> an event at (solved date - release date)
 *   open        -> censored today: still unsolved as far as we know
 *   unreported  -> censored at the last published score, since we know nothing
 *                  about it after that (release date when even that is unknown)
 */

const YEAR_MS = 365.25 * 24 * 60 * 60 * 1000;

type Observation = {
  /** Years since release at which the observation ends. */
  time: number;
  /** true if the benchmark was h-matched at `time`, false if we merely lost sight of it. */
  event: boolean;
};

export type SurvivalPoint = {
  /** Years since release. */
  t: number;
  /** Estimated share of the cohort still not h-matched at age t. */
  s: number;
  /** Benchmarks still under observation just before t. */
  atRisk: number;
};

export type SurvivalCurve = {
  points: SurvivalPoint[];
  /** Smallest t where S(t) <= 0.5, or null if the curve never gets there. */
  median: number | null;
  /** Number of benchmarks that entered the estimate. */
  n: number;
  events: number;
};

const yearsBetween = (from: string, to: Date) => (to.getTime() - new Date(from).getTime()) / YEAR_MS;

const toObservation = (item: Benchmark, now: Date): Observation => {
  const status = getStatus(item);
  if (status === 'solved') {
    // A handful of benchmarks were h-matched before their formal release; treat that as immediate.
    return { time: Math.max(0, yearsBetween(item.release, new Date(item.solved.date as string))), event: true };
  }
  if (status === 'unreported') {
    const lastSeen = item.lastReported ? new Date(item.lastReported) : new Date(item.release);
    return { time: Math.max(0, yearsBetween(item.release, lastSeen)), event: false };
  }
  return { time: Math.max(0, yearsBetween(item.release, now)), event: false };
};

export const kaplanMeier = (items: Benchmark[], now: Date = new Date()): SurvivalCurve => {
  const observations = items.map(item => toObservation(item, now)).sort((a, b) => a.time - b.time);
  const n = observations.length;
  const points: SurvivalPoint[] = [{ t: 0, s: 1, atRisk: n }];

  let survival = 1;
  let atRisk = n;
  let median: number | null = null;
  let events = 0;
  let i = 0;

  while (i < observations.length) {
    const t = observations[i].time;
    let deaths = 0;
    let leaving = 0;
    // Everything ending at exactly this time leaves the risk set together.
    while (i < observations.length && observations[i].time === t) {
      if (observations[i].event) deaths += 1;
      leaving += 1;
      i += 1;
    }
    if (deaths > 0 && atRisk > 0) {
      survival *= 1 - deaths / atRisk;
      events += deaths;
      points.push({ t, s: survival, atRisk });
      if (median === null && survival <= 0.5) median = t;
    }
    atRisk -= leaving;
  }

  // Extend the curve flat to the last observation so it is clear where the evidence stops.
  const lastTime = observations.length > 0 ? observations[observations.length - 1].time : 0;
  const lastPoint = points[points.length - 1];
  if (lastTime > lastPoint.t) {
    points.push({ t: lastTime, s: survival, atRisk: 0 });
  }

  return { points, median, n, events };
};

export type Cohort = {
  key: string;
  label: string;
  /** Inclusive release-year bounds. */
  fromYear: number;
  toYear: number;
};

export const RELEASE_COHORTS: Cohort[] = [
  { key: 'pre2019', label: '2009-2018', fromYear: 2009, toYear: 2018 },
  { key: '2019-2020', label: '2019-2020', fromYear: 2019, toYear: 2020 },
  { key: '2021-2022', label: '2021-2022', fromYear: 2021, toYear: 2022 },
  { key: '2023plus', label: '2023 onwards', fromYear: 2023, toYear: 9999 },
];

export type CohortSurvival = Cohort & { curve: SurvivalCurve };

export const survivalByCohort = (
  items: Benchmark[],
  now: Date = new Date(),
  cohorts: Cohort[] = RELEASE_COHORTS
): CohortSurvival[] =>
  cohorts
    .map(cohort => {
      const members = items.filter(item => {
        const year = new Date(item.release).getUTCFullYear();
        return year >= cohort.fromYear && year <= cohort.toYear;
      });
      return { ...cohort, curve: kaplanMeier(members, now) };
    })
    .filter(cohort => cohort.curve.n > 0);

export type SurvivalGridRow = { t: number } & Record<string, number | null>;

/**
 * Resamples every cohort's step curve onto one shared time grid so a single
 * chart (and its tooltip and legend) can show them together. Beyond a cohort's
 * last observation the value is null, so the line simply stops where the
 * evidence does.
 */
export const survivalGrid = (cohorts: CohortSurvival[], step = 0.05): SurvivalGridRow[] => {
  const horizon = Math.max(0, ...cohorts.map(c => c.curve.points[c.curve.points.length - 1].t));
  const steps = Math.ceil(horizon / step);
  const rows: SurvivalGridRow[] = [];

  for (let k = 0; k <= steps; k++) {
    const t = Number((k * step).toFixed(4));
    const row: SurvivalGridRow = { t };
    for (const cohort of cohorts) {
      const { points } = cohort.curve;
      const last = points[points.length - 1];
      if (t > last.t) {
        row[cohort.key] = null;
        continue;
      }
      let s = 1;
      for (const point of points) {
        if (point.t <= t) s = point.s;
        else break;
      }
      row[cohort.key] = s;
    }
    rows.push(row);
  }
  return rows;
};
