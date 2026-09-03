"use client"

import React, { useEffect, useState } from 'react';
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { ArrowUpDown, ExternalLink, FileText, Mail, Globe, HelpCircle, ChevronDown } from 'lucide-react';
import { Button } from "@/components/ui/button";
import { benchmarkData, calculateTimeToSolve, getStatus, formatScore, BASELINE_LABELS, type Benchmark } from '@/data/benchmarks';
import { ABOUT_SECTIONS, SITE_TAGLINE } from '@/data/siteCopy';
import { MarkdownExport } from '@/components/MarkdownExport';
import { buildBenchmarksMarkdown } from '@/lib/markdown';
import { kaplanMeier, survivalByCohort, survivalGrid } from '@/lib/survival';
import { ComposedChart, Scatter, XAxis, YAxis, CartesianGrid, ResponsiveContainer, Line, Tooltip, TooltipProps, ReferenceLine, Legend } from 'recharts';
import {
  Tooltip as RadixTooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip"
import { Props as RechartsScatterProps } from 'recharts/types/component/DefaultLegendContent';

const DATE_TAG_CLASS = "inline-block min-w-[110px] text-center bg-muted/50 px-2 py-1 rounded-md text-sm";

const formatDate = (dateString: string | null) => {
  if (dateString === null) {
    return 'Unsolved';
  }
  const date = new Date(dateString);
  const options: Intl.DateTimeFormatOptions = { 
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    timeZone: 'UTC'
  };
  return new Intl.DateTimeFormat('en-US', options).format(date);
};

type SortableKeys = keyof Benchmark | 'timeToSolve';

type SortConfig = {
  key: SortableKeys;
  direction: 'asc' | 'desc';
} | null;

const getDecimalYear = (dateString: string | null) => {
  if (dateString === null) {
    // Return current year + 10 for unsolved benchmarks
    const now = new Date();
    return now.getFullYear() + 10 + (now.getMonth() / 12) + (now.getDate() / 365);
  }
  const date = new Date(dateString);
  return date.getFullYear() + (date.getMonth() / 12) + (date.getDate() / 365);
};

const hashString = (str: string) => {
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    const char = str.charCodeAt(i);
    hash = ((hash << 5) - hash) + char;
    hash = hash & hash;
  }
  return hash;
};

const generatePastelColor = (seed: string) => {
  const hash = hashString(seed);
  
  // Generate HSL values with more variation
  const hue = Math.abs(hash % 360); // 0-360
  const saturation = 55 + (Math.abs((hash >> 8) % 30)); // 55-85%
  const lightness = 55 + (Math.abs((hash >> 16) % 20)); // 55-75%
  
  // Add a slight rotation to hue based on seed length to increase variation
  const hueRotation = (seed.length * 37) % 360;
  const finalHue = (hue + hueRotation) % 360;
  
  return `hsl(${finalHue}, ${saturation}%, ${lightness}%)`;
};

const prepareGraphData = (data: typeof benchmarkData) => {
  return data
    .filter(item => item.solved.date !== null) // Filter out unsolved benchmarks
    .sort((a, b) => new Date(a.release).getTime() - new Date(b.release).getTime())
    .map(item => {
      const timeToSolveValue = calculateTimeToSolve(item.release, item.solved);
      const formattedTimeToSolve = formatTimeToSolve(timeToSolveValue);
      
      return {
        name: item.benchmark,
        released: Number(getDecimalYear(item.release).toFixed(2)),
        solved: item.solved,
        timeToSolve: timeToSolveValue,
        solvedDate: formatDate(item.solved.date),
        releaseDate: formatDate(item.release),
        color: generatePastelColor(item.benchmark),
        isUnsolved: formattedTimeToSolve.isUnsolved
      };
    });
};

const calculateTrendLine = (data: typeof benchmarkData) => {
  // Filter out unsolved benchmarks
  const solvedData = data.filter(item => item.solved.date !== null);
  
  if (solvedData.length < 2) {
    return [];
  }
  
  const n = solvedData.length;
  const sumX = solvedData.reduce((acc, item) => acc + getDecimalYear(item.release), 0);
  const sumY = solvedData.reduce((acc, item) => acc + calculateTimeToSolve(item.release, item.solved), 0);
  const sumXY = solvedData.reduce((acc, item) => acc + getDecimalYear(item.release) * calculateTimeToSolve(item.release, item.solved), 0);
  const sumXX = solvedData.reduce((acc, item) => acc + Math.pow(getDecimalYear(item.release), 2), 0);
  
  const slope = (n * sumXY - sumX * sumY) / (n * sumXX - sumX * sumX);
  const intercept = (sumY - slope * sumX) / n;
  
  // Define the visible graph boundaries
  const minX = 2005;
  const maxX = 2035;
  const minY = -1;
  const maxY = 10;
  
  // Calculate where the trend line intersects the graph boundaries
  // For y = minY (bottom boundary)
  const xAtMinY = (minY - intercept) / slope;
  // For y = maxY (top boundary)
  const xAtMaxY = (maxY - intercept) / slope;
  // For x = minX (left boundary)
  const yAtMinX = slope * minX + intercept;
  // For x = maxX (right boundary)
  const yAtMaxX = slope * maxX + intercept;
  
  // Determine the actual start and end points within the visible area
  let startX = minX;
  let startY = yAtMinX;
  let endX = maxX;
  let endY = yAtMaxX;
  
  // Adjust if the line intersects the top or bottom boundaries
  if (xAtMinY >= minX && xAtMinY <= maxX) {
    if (slope < 0) { // Line is decreasing
      endX = xAtMinY;
      endY = minY;
    } else { // Line is increasing
      startX = xAtMinY;
      startY = minY;
    }
  }
  
  if (xAtMaxY >= minX && xAtMaxY <= maxX) {
    if (slope < 0) { // Line is decreasing
      startX = xAtMaxY;
      startY = maxY;
    } else { // Line is increasing
      endX = xAtMaxY;
      endY = maxY;
    }
  }
  
  // Generate points for the trend line
  const trendLinePoints = [];
  
  // Add just two points for a straight line
  trendLinePoints.push({
    released: startX,
    trend: startY
  });
  
  trendLinePoints.push({
    released: endX,
    trend: endY
  });
  
  return trendLinePoints;
};

type GlobalStats = {
  solvedCount: number;
  unsolvedCount: number;
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
  longestUnsolvedYears: number | null;
  /** Kaplan-Meier median: open/unreported benchmarks count as censored instead of being dropped. */
  survivalMedianYears: number | null;
};

const calculateGlobalStats = (data: typeof benchmarkData): GlobalStats => {
  const solved = data.filter(item => item.solved.date !== null);
  const solvedCount = solved.length;
  const unsolvedCount = data.length - solvedCount;
  const unreportedCount = data.filter(item => getStatus(item) === 'unreported').length;

  if (solvedCount === 0) {
    return {
      solvedCount,
      unsolvedCount,
      unreportedCount,
      solvedFraction: 0,
      avgTimeToSolveLast3Years: null,
      avgTimeToSolveYears: 0,
      medianTimeToSolveYears: 0,
      minTimeToSolveYears: 0,
      maxTimeToSolveYears: 0,
      solvedWithin1yFraction: 0,
      solvedWithin2yFraction: 0,
      solvedWithin3yFraction: 0,
      longestUnsolvedYears: unsolvedCount > 0 ? 0 : null,
      survivalMedianYears: null,
    };
  }

  const times = solved.map(item => calculateTimeToSolve(item.release, item.solved));
  const solvedFraction = solvedCount / data.length;

  const sumTimes = times.reduce((acc, t) => acc + t, 0);
  const avgTimeToSolveYears = sumTimes / solvedCount;

  const now = new Date();
  const yearMs = 365.25 * 24 * 60 * 60 * 1000;
  const threeYearsAgo = new Date(now.getTime() - 3 * yearMs);
  const recentSolved = solved.filter(item => new Date(item.release) >= threeYearsAgo);
  const avgTimeToSolveLast3Years =
    recentSolved.length > 0
      ? recentSolved.reduce((acc, item) => acc + calculateTimeToSolve(item.release, item.solved), 0) / recentSolved.length
      : null;

  const longestUnsolvedYears =
    unsolvedCount > 0
      ? data
          .filter(item => getStatus(item) === 'open')
          .reduce((max, item) => {
            const rel = new Date(item.release);
            const diffYears = (now.getTime() - rel.getTime()) / yearMs;
            return Math.max(max, diffYears);
          }, 0)
      : null;

  const sortedTimes = [...times].sort((a, b) => a - b);
  const mid = Math.floor(sortedTimes.length / 2);
  const medianTimeToSolveYears =
    sortedTimes.length % 2 === 0
      ? (sortedTimes[mid - 1] + sortedTimes[mid]) / 2
      : sortedTimes[mid];

  const minTimeToSolveYears = Math.min(...times);
  const maxTimeToSolveYears = Math.max(...times);

  const solvedWithin1yFraction = times.filter(t => t <= 1).length / solvedCount;
  const solvedWithin2yFraction = times.filter(t => t <= 2).length / solvedCount;
  const solvedWithin3yFraction = times.filter(t => t <= 3).length / solvedCount;

  const survivalMedianYears = kaplanMeier(data, now).median;

  return {
    solvedCount,
    unsolvedCount,
    unreportedCount,
    solvedFraction,
    avgTimeToSolveLast3Years,
    avgTimeToSolveYears,
    medianTimeToSolveYears,
    minTimeToSolveYears,
    maxTimeToSolveYears,
    solvedWithin1yFraction,
    solvedWithin2yFraction,
    solvedWithin3yFraction,
    longestUnsolvedYears,
    survivalMedianYears,
  };
};

type ScatterProps = RechartsScatterProps & {
  cx?: number;
  cy?: number;
  payload: {
    color: string;
  };
};

const GradientBackground = () => (
  <div className="absolute inset-0 -z-10 h-full w-full">
    <div className="absolute h-full w-full bg-[linear-gradient(to_right,#80808008_1px,transparent_1px),linear-gradient(to_bottom,#80808008_1px,transparent_1px)] bg-[size:48px_48px]" />
  </div>
);

const formatTimeToSolve = (years: number) => {
  // Handle Infinity (unsolved benchmarks)
  if (!isFinite(years)) {
    return { wholeYears: 0, months: 0, days: 0, isNegative: false, isUnsolved: true };
  }
  
  const isNegative = years < 0;
  const absYears = Math.abs(years);
  const totalDays = absYears * 365.25;
  const wholeYears = Math.floor(absYears);
  const remainingDays = totalDays - (wholeYears * 365.25);
  const months = Math.floor(remainingDays / 30.44);
  const days = Math.round(remainingDays % 30.44);
  
  return { wholeYears, months, days, isNegative, isUnsolved: false };
};

type CustomTooltipPayload = {
  payload: {
    name: string;
    releaseDate: string;
    solvedDate: string;
    timeToSolve: number;
    isUnsolved?: boolean;
  };
};

const CustomTooltip = ({ 
  active, 
  payload 
}: TooltipProps<number, string> & { payload?: CustomTooltipPayload[] }) => {
  if (active && payload && payload.length) {
    const scatterPoint = payload.find((p) => p.payload.name);
    if (scatterPoint) {
      const data = scatterPoint.payload;
      const timeToSolve = formatTimeToSolve(data.timeToSolve);
      
      return (
        <div className="bg-background border border-border rounded-lg shadow-lg p-3 space-y-2">
          <p className="font-medium text-sm">{data.name}</p>
          <div className="space-y-1 text-sm text-muted-foreground">
            <p>Released: {data.releaseDate}</p>
            <p>Solved: {data.solvedDate}</p>
            <p className="font-medium text-primary">
              Time to Human Level:{' '}
              {timeToSolve.isUnsolved ? (
                '-'
              ) : (
                <>
                  {timeToSolve.isNegative && '-'}
                  {timeToSolve.wholeYears > 0 && `${timeToSolve.wholeYears} years `}
                  {timeToSolve.months > 0 && `${timeToSolve.months} months `}
                  {timeToSolve.days > 0 && `${timeToSolve.days} days`}
                </>
              )}
            </p>
          </div>
        </div>
      );
    }
  }
  return null;
};

export default function BrokenBenchmarks() {
  const [mounted, setMounted] = useState(false);
  const [formattedDates, setFormattedDates] = useState<{[key: string]: string}>({});
  const [sortConfig, setSortConfig] = useState<SortConfig>(null);
  const [currentDate, setCurrentDate] = useState("");
  const [isExpanded, setIsExpanded] = useState(false);

  const isMobile = typeof window !== 'undefined' ? window.innerWidth < 768 : false;

  useEffect(() => {
    setMounted(true);
    const dates: {[key: string]: string} = {};
    benchmarkData.forEach(item => {
      dates[`${item.benchmark}-release`] = formatDate(item.release);
      dates[`${item.benchmark}-solved`] = formatDate(item.solved.date);
    });
    setFormattedDates(dates);
    setCurrentDate(formatDate(new Date().toISOString()));
  }, []);

  const sortData = (data: typeof benchmarkData) => {
    if (!sortConfig) return data;

    return [...data].sort((a, b) => {
      if (sortConfig.key === 'benchmark') {
        return sortConfig.direction === 'asc' 
          ? a[sortConfig.key].localeCompare(b[sortConfig.key])
          : b[sortConfig.key].localeCompare(a[sortConfig.key]);
      }
      
      if (sortConfig.key === 'release') {
        const dateA = new Date(a[sortConfig.key]).getTime();
        const dateB = new Date(b[sortConfig.key]).getTime();
        return sortConfig.direction === 'asc' ? dateA - dateB : dateB - dateA;
      }

      if (sortConfig.key === 'solved') {
        // Handle null dates - put unsolved benchmarks at the end
        if (a[sortConfig.key].date === null && b[sortConfig.key].date === null) {
          return 0;
        }
        if (a[sortConfig.key].date === null) {
          return sortConfig.direction === 'asc' ? 1 : -1;
        }
        if (b[sortConfig.key].date === null) {
          return sortConfig.direction === 'asc' ? -1 : 1;
        }
        
        const dateA = new Date(a[sortConfig.key].date as string).getTime();
        const dateB = new Date(b[sortConfig.key].date as string).getTime();
        return sortConfig.direction === 'asc' ? dateA - dateB : dateB - dateA;
      }
      
      // For timeToSolve
      const timeToSolveA = calculateTimeToSolve(a.release, a.solved);
      const timeToSolveB = calculateTimeToSolve(b.release, b.solved);
      return sortConfig.direction === 'asc' 
        ? timeToSolveA - timeToSolveB
        : timeToSolveB - timeToSolveA;
    });
  };

  const requestSort = (key: SortableKeys) => {
    let direction: 'asc' | 'desc' = 'asc';
    if (sortConfig && sortConfig.key === key && sortConfig.direction === 'asc') {
      direction = 'desc';
    }
    setSortConfig({ key, direction });
  };

  if (!mounted) {
    return null;
  }

  // Filter out unsolved benchmarks for the main table
  const solvedBenchmarks = benchmarkData.filter(item => item.solved.date !== null);
  const sortedData = sortData(solvedBenchmarks);
  const trendLineData = calculateTrendLine(benchmarkData);
  const globalStats = calculateGlobalStats(benchmarkData);
  const cohortSurvival = survivalByCohort(benchmarkData);
  const survivalRows = survivalGrid(cohortSurvival);
  const cohortColors = ['hsl(210, 70%, 55%)', 'hsl(150, 60%, 45%)', 'hsl(35, 85%, 55%)', 'hsl(340, 70%, 60%)'];

  const newestFirst = (a: Benchmark, b: Benchmark) =>
    new Date(b.release).getTime() - new Date(a.release).getTime();
  const unsolvedGroups = [
    {
      status: 'open' as const,
      title: 'Unsolved Benchmarks',
      blurb: 'Benchmarks where AI has not yet reached human-level performance',
      items: benchmarkData.filter(item => getStatus(item) === 'open').sort(newestFirst),
    },
    {
      status: 'unreported' as const,
      title: 'Unreported Benchmarks',
      blurb: 'No lab has published a frontier-model score on these for about two years. Their true status is unknown: this is a reporting gap, not evidence that they are hard.',
      items: benchmarkData.filter(item => getStatus(item) === 'unreported').sort(newestFirst),
    },
  ].filter(group => group.items.length > 0);

  const formatYears = (years: number) => `${years.toFixed(2)} years`;
  const formatPercent = (value: number) => `${(value * 100).toFixed(1)}%`;

  return (
    <div className="min-h-screen bg-background">
      {/* Hero Section */}
      <div className="relative isolate">
        <GradientBackground />
        
        <div className="mx-auto w-[90%] max-w-[1400px] pt-24 pb-16">
          <div className="text-center space-y-12 mb-24">
            {/* Title Section */}
            <div className="space-y-4">
              <h1 className="text-3xl sm:text-5xl lg:text-7xl font-bold tracking-tight flex items-center justify-center gap-2 sm:gap-3">
                <span className="bg-primary/5 border border-primary/10 px-3 sm:px-6 py-2 sm:py-3 rounded-xl">
                  h-matched
                </span>
                <span>Tracker</span>
              </h1>
              
              <p className="text-sm sm:text-base text-muted-foreground max-w-[600px] mx-auto">
                {SITE_TAGLINE}
              </p>
            </div>

            {/* Stats Cards */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 max-w-4xl mx-auto">
              <Card className="border-border/40 card-hover">
                <CardContent className="pt-6">
                  <div className="space-y-2">
                    <div className="flex items-center justify-center w-12 h-12 rounded-full bg-primary/10 mx-auto mb-4">
                      <FileText className="w-6 h-6 text-primary" />
                    </div>
                    <h3 className="text-xl font-semibold text-center">Benchmarks Tracked</h3>
                    <p className="text-3xl font-bold text-center text-primary">
                      {benchmarkData.length}
                    </p>
                  </div>
                </CardContent>
              </Card>

              <Card className="border-border/40 card-hover">
                <CardContent className="pt-6">
                  <div className="space-y-2">
                    <div className="flex items-center justify-center w-12 h-12 rounded-full bg-primary/10 mx-auto mb-4">
                      <HelpCircle className="w-6 h-6 text-primary" />
                    </div>
                    <h3 className="text-xl font-semibold text-center">What is h-matched?</h3>
                    <p className="text-sm text-muted-foreground text-center">
                      When AI reaches human-level performance on a benchmark
                    </p>
                  </div>
                </CardContent>
              </Card>

              <Card className="border-border/40 card-hover">
                <CardContent className="pt-6">
                  <div className="space-y-2">
                    <div className="flex items-center justify-center w-12 h-12 rounded-full bg-primary/10 mx-auto mb-4">
                      <Globe className="w-6 h-6 text-primary" />
                    </div>
                    <h3 className="text-xl font-semibold text-center">Why Track This?</h3>
                    <p className="text-sm text-muted-foreground text-center">
                      To visualize the accelerating pace of AI capabilities
                    </p>
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* New expandable section */}
            <div className="max-w-4xl mx-auto">
              <Button
                variant="ghost"
                onClick={() => setIsExpanded(!isExpanded)}
                className="flex items-center gap-2 mx-auto"
              >
                <span className="text-muted-foreground">Learn more</span>
                <ChevronDown className={`h-4 w-4 transition-transform ${isExpanded ? 'rotate-180' : ''}`} />
              </Button>
              
              {isExpanded && (
                <div className="mt-6 space-y-6 text-left animate-in fade-in slide-in-from-top-4 duration-300">
                  <Card className="p-6">
                    <div className="space-y-4">
                      {ABOUT_SECTIONS.map((section) => (
                        <div key={section.heading}>
                          <h3 className="text-lg font-semibold mb-2">{section.heading}</h3>
                          <p className="text-muted-foreground">{section.body}</p>
                        </div>
                      ))}
                    </div>
                  </Card>
                </div>
              )}
            </div>
          </div>

          {/* Graph Card */}
          <Card className="mb-16 shadow-md hover:shadow-lg transition-shadow">
            <CardHeader className="space-y-1">
              <CardTitle>Time to Human Level Trend</CardTitle>
              <p className="text-sm text-muted-foreground">
                Visualization of duration between benchmark release and becoming Human Level
              </p>
            </CardHeader>
            <CardContent className="h-[400px] md:h-[400px] sm:aspect-square sm:max-h-[500px] sm:min-h-[300px] md:aspect-auto">
              <ResponsiveContainer
                width="100%"
                height="100%"
                aspect={isMobile ? 1 : undefined}
              >
                <ComposedChart
                  margin={{
                    top: 20,
                    right: 30,
                    left: isMobile ? 10 : 20,
                    bottom: 20,
                  }}
                >
                  <CartesianGrid strokeDasharray="3 3" />
                  <ReferenceLine 
                    y={0} 
                    stroke="red" 
                    strokeDasharray="3 3"
                    label={{
                      value: "y=0",
                      position: "right",
                      fill: "red",
                      fontSize: 12
                    }}
                  />
                  <XAxis
                    type="number"
                    dataKey="released"
                    name="Release Year"
                    domain={[2005, 2035]}
                    tickCount={10}
                    ticks={[2005, 2010, 2015, 2020, 2025, 2030, 2035]}
                    label={{ 
                      value: 'Benchmark Release Date',
                      position: 'bottom',
                      offset: 0,
                      style: {
                        fontSize: isMobile ? 10 : 12
                      }
                    }}
                  />
                  <YAxis
                    type="number"
                    dataKey="timeToSolve"
                    name="Time to Human Level"
                    domain={[-1, 10]}
                    ticks={[-1, 0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10]}
                    label={{ 
                      value: 'Time to Human Level (Years)', 
                      angle: -90, 
                      position: 'insideLeft',
                      offset: isMobile ? 0 : 15,
                      style: { 
                        textAnchor: 'middle',
                        dominantBaseline: 'middle',
                        fontSize: isMobile ? 10 : 12
                      },
                      dy: 'middle'
                    }}
                  />
                  <Tooltip 
                    content={<CustomTooltip />}
                    cursor={false}
                  />
                  <Line 
                    type="linear" 
                    dataKey="trend" 
                    data={trendLineData} 
                    stroke="red" 
                    strokeWidth={2}
                    strokeDasharray="5 5" 
                    dot={false}
                    activeDot={false}
                    isAnimationActive={false}
                  />
                  <Scatter
                    data={prepareGraphData(benchmarkData)}
                    fill="#000"
                    stroke="#000"
                    strokeWidth={2}
                    r={isMobile ? 4 : 6}
                    dataKey="timeToSolve"
                    cx="released"
                    cy="timeToSolve"
                    name="Benchmark"
                    label={{ 
                      dataKey: "name",
                      position: "top",
                      offset: isMobile ? 8 : 15,
                      fill: "currentColor",
                      fontSize: isMobile ? 8 : 11,
                      fontWeight: 500
                    }}
                    shape={(props: RechartsScatterProps) => {
                      const { cx, cy, payload } = props as ScatterProps;
                      return (
                        <circle 
                          cx={cx} 
                          cy={cy} 
                          r={isMobile ? 4 : 6} 
                          fill={payload.color} 
                          stroke={payload.color}
                          className="cursor-pointer hover:opacity-80 transition-opacity"
                        />
                      );
                    }}
                  />
                </ComposedChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>

          {/* Survival Curves */}
          <Card className="mb-16 shadow-md hover:shadow-lg transition-shadow">
            <CardHeader className="space-y-1">
              <CardTitle>Share Still Unsolved, by Release Cohort</CardTitle>
              <p className="text-sm text-muted-foreground">
                Kaplan-Meier survival curves. Each line is the share of a cohort&apos;s benchmarks not yet h-matched at a
                given age. Open benchmarks are censored today and unreported ones at their last published score, so a
                line stops where the evidence stops instead of pretending the recent cohorts are finished.
              </p>
            </CardHeader>
            <CardContent className="h-[400px]">
              <ResponsiveContainer width="100%" height="100%">
                <ComposedChart
                  data={survivalRows}
                  margin={{ top: 20, right: 30, left: isMobile ? 10 : 20, bottom: 20 }}
                >
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis
                    type="number"
                    dataKey="t"
                    domain={[0, 'dataMax']}
                    tickCount={11}
                    tickFormatter={(value: number) => value.toFixed(0)}
                    label={{
                      value: 'Years since benchmark release',
                      position: 'bottom',
                      offset: 0,
                      style: { fontSize: isMobile ? 10 : 12 }
                    }}
                  />
                  <YAxis
                    type="number"
                    domain={[0, 1]}
                    ticks={[0, 0.25, 0.5, 0.75, 1]}
                    tickFormatter={(value: number) => `${Math.round(value * 100)}%`}
                    label={{
                      value: 'Still not h-matched',
                      angle: -90,
                      position: 'insideLeft',
                      offset: isMobile ? 0 : 15,
                      style: { textAnchor: 'middle', fontSize: isMobile ? 10 : 12 }
                    }}
                  />
                  <ReferenceLine y={0.5} stroke="currentColor" strokeOpacity={0.3} strokeDasharray="3 3" />
                  <Tooltip
                    formatter={(value: number) => `${Math.round(value * 100)}%`}
                    labelFormatter={(value: number) => `${value.toFixed(1)} years after release`}
                    contentStyle={{ backgroundColor: 'hsl(var(--background))', borderColor: 'hsl(var(--border))' }}
                  />
                  <Legend verticalAlign="top" height={36} />
                  {cohortSurvival.map((cohort, index) => (
                    <Line
                      key={cohort.key}
                      type="stepAfter"
                      dataKey={cohort.key}
                      name={`${cohort.label} (n=${cohort.curve.n}, ${cohort.curve.events} solved)`}
                      stroke={cohortColors[index % cohortColors.length]}
                      strokeWidth={2}
                      dot={false}
                      activeDot={{ r: 4 }}
                      connectNulls={false}
                      isAnimationActive={false}
                    />
                  ))}
                </ComposedChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>

          {/* Global Stats Across Benchmarks */}
          <Card className="mb-16 shadow-md hover:shadow-lg transition-shadow">
            <CardHeader className="space-y-1">
              <CardTitle>Across-Benchmark Statistics</CardTitle>
              <p className="text-sm text-muted-foreground">
                Aggregate metrics computed over all solved benchmarks
              </p>
            </CardHeader>
            <CardContent>
              <div className="grid gap-4 md:grid-cols-3">
                <div className="space-y-1">
                  <p className="text-xs uppercase tracking-wide text-muted-foreground">Average time to solve (released last 3 years, solved only)</p>
                  <p className="text-lg font-semibold">
                    {globalStats.avgTimeToSolveLast3Years !== null
                      ? formatYears(globalStats.avgTimeToSolveLast3Years)
                      : 'N/A'}
                  </p>
                </div>
                <div className="space-y-1">
                  <p className="text-xs uppercase tracking-wide text-muted-foreground">Average time to solve (solved only)</p>
                  <p className="text-lg font-semibold">{formatYears(globalStats.avgTimeToSolveYears)}</p>
                </div>
                <div className="space-y-1">
                  <p className="text-xs uppercase tracking-wide text-muted-foreground">Median time to solve (survival estimate)</p>
                  <p className="text-lg font-semibold">
                    {globalStats.survivalMedianYears !== null
                      ? formatYears(globalStats.survivalMedianYears)
                      : 'Not reached'}
                  </p>
                </div>
              </div>
              <div className="grid gap-4 md:grid-cols-3 mt-6">
                <div className="space-y-1">
                  <p className="text-xs uppercase tracking-wide text-muted-foreground">Shortest time to solve</p>
                  <p className="text-lg font-semibold">{formatYears(globalStats.minTimeToSolveYears)}</p>
                </div>
                <div className="space-y-1">
                  <p className="text-xs uppercase tracking-wide text-muted-foreground">Longest time to solve</p>
                  <p className="text-lg font-semibold">{formatYears(globalStats.maxTimeToSolveYears)}</p>
                </div>
                <div className="space-y-1">
                  <p className="text-xs uppercase tracking-wide text-muted-foreground">Solved within 3 years</p>
                  <p className="text-lg font-semibold">
                    {formatPercent(globalStats.solvedWithin3yFraction)}{' '}
                    <span className="text-sm text-muted-foreground">of solved benchmarks</span>
                  </p>
                </div>
                <div className="space-y-1">
                  <p className="text-xs uppercase tracking-wide text-muted-foreground">Longest open (since release)</p>
                  <p className="text-lg font-semibold">
                    {globalStats.longestUnsolvedYears !== null
                      ? formatYears(globalStats.longestUnsolvedYears)
                      : 'N/A'}
                  </p>
                </div>
              </div>
              <div className="mt-6 text-xs text-muted-foreground">
                <p>
                  &quot;Solved only&quot; averages are biased low: a recent benchmark that will take years to solve
                  cannot be in the solved set yet. The median is a Kaplan-Meier estimate over all {benchmarkData.length} benchmarks,
                  with open ones censored today and unreported ones at their last published score.
                </p>
              </div>
            </CardContent>
          </Card>

          {/* Main Content */}
          <Card className="shadow-md hover:shadow-lg transition-shadow">
            <CardHeader className="space-y-1">
              <CardTitle>Solved Benchmarks</CardTitle>
              <p className="text-sm text-muted-foreground">
                Chronological list of AI benchmarks where human-level performance has been achieved
              </p>
            </CardHeader>
            <CardContent>
              <div className="rounded-md border">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>
                        <Button
                          variant="ghost"
                          onClick={() => requestSort('benchmark')}
                          className="hover:bg-primary/10 -ml-4 h-8 data-[state=open]:bg-accent font-medium"
                        >
                          <span className="text-primary">Benchmark</span>
                          <ArrowUpDown className="ml-2 h-4 w-4 text-muted-foreground" />
                        </Button>
                      </TableHead>
                      <TableHead>
                        <Button
                          variant="ghost"
                          onClick={() => requestSort('release')}
                          className="hover:bg-muted/50 -ml-4 h-8 data-[state=open]:bg-accent"
                        >
                          Released
                          <ArrowUpDown className="ml-2 h-4 w-4" />
                        </Button>
                      </TableHead>
                      <TableHead>
                        <Button
                          variant="ghost"
                          onClick={() => requestSort('solved')}
                          className="hover:bg-muted/50 -ml-4 h-8 data-[state=open]:bg-accent"
                        >
                          Solved
                          <ArrowUpDown className="ml-2 h-4 w-4" />
                        </Button>
                      </TableHead>
                      <TableHead>H-matched by</TableHead>
                      <TableHead>
                        <div className="flex items-center">
                          <Button
                            variant="ghost"
                            onClick={() => requestSort('timeToSolve')}
                            className="hover:bg-muted/50 -ml-4 h-8 data-[state=open]:bg-accent flex items-center"
                          >
                            <span>Time to Human Level</span>
                            <ArrowUpDown className="ml-2 h-4 w-4" />
                          </Button>
                          
                          <TooltipProvider>
                            <RadixTooltip>
                              <TooltipTrigger>
                                <div className="inline-flex h-4 w-4 p-0 ml-1 cursor-help">
                                  <HelpCircle className="h-4 w-4 text-muted-foreground hover:text-primary transition-colors" />
                                </div>
                              </TooltipTrigger>
                              <TooltipContent 
                                side="top" 
                                className="max-w-[400px] p-3 whitespace-normal"
                              >
                                <p className="text-sm">
                                  Time from release until AI surpassed human performance, verified by official reports or benchmark scores
                                </p>
                              </TooltipContent>
                            </RadixTooltip>
                          </TooltipProvider>
                        </div>
                      </TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {sortedData.map((item) => (
                      <TableRow key={item.benchmark}>
                        <TableCell className="font-medium">
                          <div className="flex items-center gap-3">
                            <span className="min-w-[200px]">{item.benchmark}</span>
                            <div className="flex items-center gap-2">
                              {item.url && (
                                <a 
                                  href={item.url}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  className="inline-flex items-center rounded-full bg-muted p-1.5 hover:bg-primary/10 transition-colors"
                                  title="Visit website"
                                >
                                  <ExternalLink className="w-4 h-4 text-muted-foreground hover:text-primary" />
                                  <span className="sr-only">Visit {item.benchmark} website</span>
                                </a>
                              )}
                              {item.paperUrl && (
                                <a 
                                  href={item.paperUrl}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  className="inline-flex items-center rounded-full bg-muted p-1.5 hover:bg-primary/10 transition-colors"
                                  title="Read paper"
                                >
                                  <FileText className="w-4 h-4 text-muted-foreground hover:text-primary" />
                                  <span className="sr-only">Read {item.benchmark} paper</span>
                                </a>
                              )}
                            </div>
                          </div>
                        </TableCell>
                        <TableCell className="font-mono text-muted-foreground">
                          <span className={DATE_TAG_CLASS}>
                            {formattedDates[`${item.benchmark}-release`] || ''}
                          </span>
                        </TableCell>
                        <TableCell className="font-mono text-muted-foreground">
                          <div className="flex items-center gap-2">
                            <span className={DATE_TAG_CLASS}>
                              {formattedDates[`${item.benchmark}-solved`] || ''}
                            </span>
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="flex flex-col gap-1 min-w-[180px]">
                            <span className="text-sm font-medium">
                              {item.solved.model ?? <span className="text-muted-foreground">Unattributed</span>}
                              {item.solved.contested && (
                                <span
                                  className="ml-2 inline-flex items-center px-1.5 py-0.5 rounded-md text-[10px] font-medium uppercase tracking-wide bg-amber-500/15 text-amber-600 dark:text-amber-400"
                                  title="The h-match is disputed or the bar was unusually lenient - see the note"
                                >
                                  contested
                                </span>
                              )}
                            </span>
                            <span className="text-xs text-muted-foreground font-mono">
                              {item.solved.score !== undefined && item.human
                                ? `${formatScore(item.solved.score, item.human.unit)} vs human ${formatScore(item.human.score, item.human.unit)}`
                                : item.human
                                  ? `human ${formatScore(item.human.score, item.human.unit)}`
                                  : ''}
                              {item.human && (
                                <span className="ml-1.5 text-[10px] uppercase tracking-wide opacity-70">
                                  {BASELINE_LABELS[item.human.baselineType]}{item.human.n ? ` n=${item.human.n}` : ''}
                                </span>
                              )}
                            </span>
                            {item.solved.conditions && (
                              <span className="text-[11px] text-muted-foreground">{item.solved.conditions}</span>
                            )}
                          </div>
                        </TableCell>
                        <TableCell className="font-mono">
                          <div className="flex items-center gap-1.5">
                            {formatTimeToSolve(calculateTimeToSolve(item.release, item.solved)).isUnsolved ? (
                              <span className="inline-flex items-center px-2 py-0.5 rounded-md text-xs font-medium bg-muted text-muted-foreground">
                                -
                              </span>
                            ) : formatTimeToSolve(calculateTimeToSolve(item.release, item.solved)).isNegative ? (
                              <div className="flex items-center gap-1.5 bg-red-500/10 px-2 py-1 rounded-md">
                                <span className="text-xs font-medium text-red-500">-</span>
                                {formatTimeToSolve(calculateTimeToSolve(item.release, item.solved)).days}
                                <span className="text-xs font-medium text-red-500">days</span>
                              </div>
                            ) : (
                              <>
                                {formatTimeToSolve(calculateTimeToSolve(item.release, item.solved)).wholeYears > 0 && (
                                  <span className="inline-flex items-center px-2 py-0.5 rounded-md text-xs font-medium bg-primary/10 text-primary">
                                    {formatTimeToSolve(calculateTimeToSolve(item.release, item.solved)).wholeYears}
                                    {' '}
                                    {formatTimeToSolve(calculateTimeToSolve(item.release, item.solved)).wholeYears === 1 ? 'year' : 'years'}
                                  </span>
                                )}
                                {formatTimeToSolve(calculateTimeToSolve(item.release, item.solved)).months > 0 && (
                                  <span className="inline-flex items-center px-2 py-0.5 rounded-md text-xs font-medium bg-primary/5 text-primary/90">
                                    {formatTimeToSolve(calculateTimeToSolve(item.release, item.solved)).months}
                                    {' '}
                                    {formatTimeToSolve(calculateTimeToSolve(item.release, item.solved)).months === 1 ? 'month' : 'months'}
                                  </span>
                                )}
                                {formatTimeToSolve(calculateTimeToSolve(item.release, item.solved)).days > 0 && (
                                  <span className="inline-flex items-center px-2 py-0.5 rounded-md text-xs font-medium bg-primary/[0.03] text-primary/80">
                                    {formatTimeToSolve(calculateTimeToSolve(item.release, item.solved)).days}
                                    {' '}
                                    {formatTimeToSolve(calculateTimeToSolve(item.release, item.solved)).days === 1 ? 'day' : 'days'}
                                  </span>
                                )}
                              </>
                            )}
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            </CardContent>
          </Card>

          {/* Unsolved Benchmarks Tables - one card per status */}
          {unsolvedGroups.map((group) => (
            <Card key={group.status} className="mt-6 shadow-md hover:shadow-lg transition-shadow">
              <CardHeader className="space-y-1">
                <CardTitle>{group.title}</CardTitle>
                <p className="text-sm text-muted-foreground">{group.blurb}</p>
              </CardHeader>
              <CardContent>
                <div className="rounded-md border">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Benchmark</TableHead>
                        <TableHead>Released</TableHead>
                        {group.status === 'unreported' && <TableHead>Last reported</TableHead>}
                        <TableHead>Human Level Performance</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {group.items
                        .map((item) => (
                          <TableRow key={item.benchmark}>
                            <TableCell className="font-medium">
                              <div className="flex items-center gap-3">
                                <span className="min-w-[200px]">{item.benchmark}</span>
                                <div className="flex items-center gap-2">
                                  {item.url && (
                                    <a 
                                      href={item.url}
                                      target="_blank"
                                      rel="noopener noreferrer"
                                      className="inline-flex items-center rounded-full bg-muted p-1.5 hover:bg-primary/10 transition-colors"
                                      title="Visit website"
                                    >
                                      <ExternalLink className="w-4 h-4 text-muted-foreground hover:text-primary" />
                                      <span className="sr-only">Visit {item.benchmark} website</span>
                                    </a>
                                  )}
                                  {item.paperUrl && (
                                    <a 
                                      href={item.paperUrl}
                                      target="_blank"
                                      rel="noopener noreferrer"
                                      className="inline-flex items-center rounded-full bg-muted p-1.5 hover:bg-primary/10 transition-colors"
                                      title="Read paper"
                                    >
                                      <FileText className="w-4 h-4 text-muted-foreground hover:text-primary" />
                                      <span className="sr-only">Read {item.benchmark} paper</span>
                                    </a>
                                  )}
                                </div>
                              </div>
                            </TableCell>
                            <TableCell className="font-mono text-muted-foreground">
                              <span className={DATE_TAG_CLASS}>
                                {formattedDates[`${item.benchmark}-release`] || ''}
                              </span>
                            </TableCell>
                            {group.status === 'unreported' && (
                              <TableCell className="font-mono text-muted-foreground">
                                <span className={DATE_TAG_CLASS}>
                                  {item.lastReported ? formatDate(item.lastReported) : 'unknown'}
                                </span>
                              </TableCell>
                            )}
                            <TableCell>
                              {item.solved && item.solved.source && (
                                <TooltipProvider>
                                  <RadixTooltip>
                                    <TooltipTrigger className="cursor-help inline-flex items-center">
                                      <span className="inline-flex items-center px-2 py-0.5 rounded-md text-xs font-medium bg-primary/10 text-primary">
                                        {item.human ? formatScore(item.human.score, item.human.unit) : 'N/A'}
                                      </span>
                                      {item.human && (
                                        <span className="ml-2 text-[10px] uppercase tracking-wide text-muted-foreground">
                                          {BASELINE_LABELS[item.human.baselineType]}{item.human.n ? ` n=${item.human.n}` : ''}
                                        </span>
                                      )}
                                      <HelpCircle className="ml-2 h-4 w-4 text-muted-foreground hover:text-primary transition-colors" />
                                    </TooltipTrigger>
                                    <TooltipContent 
                                      side="top"
                                      className="bg-background border-border max-w-[400px]" 
                                      sideOffset={5}
                                    >
                                      <div className="space-y-4">
                                        <p className="font-semibold">Performance Details</p>
                                        <div 
                                          className="text-sm"
                                          dangerouslySetInnerHTML={{ __html: item.solved.source.text }}
                                        />
                                        
                                        <div className="border-t border-border/40 pt-2 mt-4 space-y-1.5">
                                          <p className="text-xs text-muted-foreground font-medium">Sources:</p>
                                          {item.solved.source.references.map((ref, index) => (
                                            <div key={index} className="flex gap-2">
                                              <span className="text-xs text-muted-foreground">[{index + 1}]</span>
                                              <a 
                                                href={ref.url}
                                                target="_blank"
                                                rel="noopener noreferrer"
                                                className="text-xs text-primary hover:underline inline-flex items-center gap-1"
                                              >
                                                {new URL(ref.url).hostname.replace('www.', '')}
                                                <ExternalLink className="h-3 w-3" />
                                              </a>
                                            </div>
                                          ))}
                                        </div>
                                      </div>
                                    </TooltipContent>
                                  </RadixTooltip>
                                </TooltipProvider>
                              )}
                            </TableCell>
                          </TableRow>
                        ))}
                    </TableBody>
                  </Table>
                </div>
              </CardContent>
            </Card>
          ))}

          {/* Contribution Box */}
          <Card className="mt-6 shadow-md hover:shadow-lg transition-shadow">
            <CardHeader>
              <CardTitle className="text-2xl">Contribute</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-6">
                <p className="text-muted-foreground text-lg leading-relaxed">
                  Notice something missing or have suggestions for improvement? Get in touch:
                </p>
                
                <div className="flex flex-col sm:flex-row gap-3">
                  <Button
                    asChild
                    className="flex-1"
                    variant="default"
                  >
                    <a
                      href="https://github.com/mrconter1/broken-benchmarks/issues"
                      target="_blank"
                      rel="noopener noreferrer"
                    >
                      <FileText className="mr-2 h-4 w-4" />
                      Open GitHub Issue
                    </a>
                  </Button>
                  
                  <Button
                    asChild
                    className="flex-1"
                    variant="outline"
                  >
                    <a
                      href="mailto:rasmus.lindahl1996@gmail.com"
                    >
                      <Mail className="mr-2 h-4 w-4" />
                      Send Email
                    </a>
                  </Button>
                  
                  <Button
                    asChild
                    className="flex-1"
                    variant="outline"
                  >
                    <a
                      href="https://lindahl.works"
                      target="_blank"
                      rel="noopener noreferrer"
                    >
                      <Globe className="mr-2 h-4 w-4" />
                      Visit Portfolio
                    </a>
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>

          <MarkdownExport
            getMarkdown={() => buildBenchmarksMarkdown(benchmarkData, globalStats)}
          />

          <div className="mt-2 flex flex-col items-center">
            <footer className="text-center text-sm text-muted-foreground">
              <p suppressHydrationWarning>
                Data last updated {currentDate}  Created by <a href="https://lindahl.works" className="hover:text-primary transition-colors">Rasmus Lindahl</a>
              </p>
            </footer>
          </div>
        </div>
      </div>
    </div>
  );
}