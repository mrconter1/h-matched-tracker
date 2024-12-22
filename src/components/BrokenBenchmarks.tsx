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
import { ArrowUpDown, ExternalLink, FileText, Mail, Globe, HelpCircle } from 'lucide-react';
import { Button } from "@/components/ui/button";
import { benchmarkData, type Benchmark, type BenchmarkSolved } from '@/data/benchmarks';
import { ComposedChart, Scatter, XAxis, YAxis, CartesianGrid, ResponsiveContainer, Line } from 'recharts';
import {
  Tooltip as RadixTooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip"
import { Props as RechartsScatterProps } from 'recharts/types/component/DefaultLegendContent';

const DATE_TAG_CLASS = "inline-block min-w-[110px] text-center bg-muted/50 px-2 py-1 rounded-md text-sm";

const formatDate = (dateString: string) => {
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

const getDecimalYear = (dateString: string) => {
  const date = new Date(dateString);
  return date.getFullYear() + (date.getMonth() / 12) + (date.getDate() / 365);
};

const calculateTimeToSolve = (releaseDate: string, solved: BenchmarkSolved): number => {
  const release = new Date(releaseDate);
  const solvedDate = new Date(solved.date);
  const diffTime = Math.abs(solvedDate.getTime() - release.getTime());
  const diffYears = diffTime / (1000 * 60 * 60 * 24 * 365.25); // Using 365.25 to account for leap years
  return Number(diffYears.toFixed(2));
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
    .sort((a, b) => new Date(a.release).getTime() - new Date(b.release).getTime())
    .map(item => ({
      name: item.benchmark,
      released: Number(getDecimalYear(item.release).toFixed(2)),
      solved: item.solved,
      timeToSolve: calculateTimeToSolve(item.release, item.solved),
      solvedDate: formatDate(item.solved.date),
      releaseDate: formatDate(item.release),
      color: generatePastelColor(item.benchmark),
    }));
};

const calculateTrendLine = (data: typeof benchmarkData) => {
  const n = data.length;
  const sumX = data.reduce((acc, item) => acc + getDecimalYear(item.release), 0);
  const sumY = data.reduce((acc, item) => acc + calculateTimeToSolve(item.release, item.solved), 0);
  const sumXY = data.reduce((acc, item) => acc + getDecimalYear(item.release) * calculateTimeToSolve(item.release, item.solved), 0);
  const sumXX = data.reduce((acc, item) => acc + Math.pow(getDecimalYear(item.release), 2), 0);
  
  const slope = (n * sumXY - sumX * sumY) / (n * sumXX - sumX * sumX);
  const intercept = (sumY - slope * sumX) / n;
  
  return data.map(item => ({
    released: getDecimalYear(item.release),
    trend: slope * getDecimalYear(item.release) + intercept,
  }));
};

type ScatterProps = RechartsScatterProps & {
  cx?: number;
  cy?: number;
  payload: {
    color: string;
  };
};

export default function BrokenBenchmarks() {
  const [mounted, setMounted] = useState(false);
  const [formattedDates, setFormattedDates] = useState<{[key: string]: string}>({});
  const [sortConfig, setSortConfig] = useState<SortConfig>(null);
  const [currentDate, setCurrentDate] = useState("");

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
        const dateA = new Date(a[sortConfig.key].date).getTime();
        const dateB = new Date(b[sortConfig.key].date).getTime();
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

  const sortedData = sortData(benchmarkData);
  const trendLineData = calculateTrendLine(benchmarkData);

  return (
    <div className="min-h-screen bg-gradient-to-b from-background via-background to-muted/50">
      <div className="mx-auto w-[90%] max-w-[1400px] pt-16 pb-8">
        {/* Hero Section */}
        <div className="text-center space-y-8 mb-16">
          <div className="space-y-2">
            <h1 className="text-4xl sm:text-6xl lg:text-7xl font-bold tracking-tight">
              h-matched <span className="text-primary">Tracker</span>
            </h1>
            <p className="text-sm text-muted-foreground">
              h = human-level performance | Tracking time from release to h-matched
            </p>
          </div>
          
          <div className="grid md:grid-cols-2 gap-6 max-w-4xl mx-auto">
            <Card className="text-left p-6 card-hover">
              <CardTitle className="text-lg mb-3">What is this?</CardTitle>
              <p className="text-muted-foreground">
                A tracker measuring the duration between a benchmark&apos;s release and when it becomes h-matched (reached by AI at human-level performance). As this duration approaches zero, it suggests we&apos;re nearing a point where AI systems match human performance almost immediately.
              </p>
            </Card>
            
            <Card className="text-left p-6 card-hover">
              <CardTitle className="text-lg mb-3">Why track this?</CardTitle>
              <p className="text-muted-foreground">
                By monitoring how quickly benchmarks become h-matched, we can observe the accelerating pace of AI capabilities. If this time reaches zero, it would indicate a critical milestone where creating benchmarks that humans can outperform AI systems becomes virtually impossible.
              </p>
            </Card>
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
          <CardContent className="h-[400px]">
            <ResponsiveContainer width="100%" height="100%">
              <ComposedChart
                margin={{
                  top: 20,
                  right: 30,
                  left: 20,
                  bottom: 20,
                }}
              >
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis
                  type="number"
                  dataKey="released"
                  name="Release Year"
                  domain={['auto', 'auto']}
                  tickCount={7}
                  label={{ 
                    value: 'Benchmark Release Date',
                    position: 'bottom',
                    offset: 0
                  }}
                />
                <YAxis
                  type="number"
                  dataKey="timeToSolve"
                  name="Time to Human Level"
                  label={{ 
                    value: 'Time to Human Level (Years)', 
                    angle: -90, 
                    position: 'insideLeft',
                    offset: 15,
                    style: { 
                      textAnchor: 'middle',
                      dominantBaseline: 'middle'
                    },
                    dy: 'middle'
                  }}
                />
                <Line 
                  type="linear" 
                  dataKey="trend" 
                  data={trendLineData} 
                  stroke="red" 
                  strokeWidth={2}
                  strokeDasharray="5 5" 
                  dot={false} 
                />
                <Scatter
                  data={prepareGraphData(benchmarkData)}
                  fill="#000"
                  stroke="#000"
                  strokeWidth={2}
                  r={6}
                  dataKey="timeToSolve"
                  cx="released"
                  cy="timeToSolve"
                  name="Benchmark"
                  label={{ 
                    dataKey: "name",
                    position: "top",
                    offset: 15,
                    fill: "currentColor",
                    fontSize: 11,
                    fontWeight: 500
                  }}
                  shape={(props: RechartsScatterProps) => {
                    const { cx, cy, payload } = props as ScatterProps;
                    return (
                      <circle 
                        cx={cx} 
                        cy={cy} 
                        r={6} 
                        fill={payload.color} 
                        stroke={payload.color}
                      />
                    );
                  }}
                />
              </ComposedChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* Main Content */}
        <Card className="shadow-md hover:shadow-lg transition-shadow">
          <CardHeader className="space-y-1">
            <CardTitle>Benchmark Timeline</CardTitle>
            <p className="text-sm text-muted-foreground">
              Chronological list of AI benchmarks and their completion dates
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
                    <TableHead>
                      <Button
                        variant="ghost"
                        onClick={() => requestSort('timeToSolve')}
                        className="hover:bg-muted/50 -ml-4 h-8 data-[state=open]:bg-accent"
                      >
                        Time to Human Level
                        <ArrowUpDown className="ml-2 h-4 w-4" />
                      </Button>
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
                          {item.solved && (item.solved.source || item.solved.humanPerformance || item.solved.achievementSource) && (
                            <TooltipProvider>
                              <RadixTooltip>
                                <TooltipTrigger className="cursor-help inline-flex">
                                  <HelpCircle className="h-4 w-4 text-muted-foreground hover:text-primary transition-colors" />
                                </TooltipTrigger>
                                <TooltipContent 
                                  side="top"
                                  className="bg-background border-border" 
                                  sideOffset={5}
                                >
                                  <div className="space-y-2">
                                    <div>
                                      <p className="font-semibold">Achievement Details</p>
                                      <p className="text-sm text-muted-foreground">
                                        Score: {item.solved.score}
                                        {item.solved.source && (
                                          <> • <a href={item.solved.source} target="_blank" rel="noopener noreferrer" className="underline">
                                            Source
                                          </a></>
                                        )}
                                      </p>
                                    </div>
                                    {item.solved.humanPerformance && (
                                      <div>
                                        <p className="font-semibold">Human Performance</p>
                                        <p className="text-sm text-muted-foreground">
                                          Score: {item.solved.humanPerformance.score} • <a href={item.solved.humanPerformance.source} target="_blank" rel="noopener noreferrer" className="underline">
                                            Source
                                          </a>
                                        </p>
                                      </div>
                                    )}
                                  </div>
                                </TooltipContent>
                              </RadixTooltip>
                            </TooltipProvider>
                          )}
                        </div>
                      </TableCell>
                      <TableCell className="font-mono">
                        <span className="inline-flex items-center justify-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-primary/10 text-primary">
                          {calculateTimeToSolve(item.release, item.solved)} years
                        </span>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          </CardContent>
        </Card>

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

        <div className="mt-2 flex flex-col items-center">
          <footer className="text-center text-sm text-muted-foreground">
            <p suppressHydrationWarning>
              Data last updated {currentDate} • Created by <a href="https://lindahl.works" className="hover:text-primary transition-colors">Rasmus Lindahl</a>
            </p>
          </footer>
        </div>
      </div>
    </div>
  );
}