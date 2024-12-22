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

const GradientBackground = () => (
  <div className="absolute inset-0 -z-10 h-full w-full">
    <div className="absolute h-full w-full bg-[linear-gradient(to_right,#80808008_1px,transparent_1px),linear-gradient(to_bottom,#80808008_1px,transparent_1px)] bg-[size:48px_48px]" />
  </div>
);

const formatTimeToSolve = (years: number) => {
  const totalDays = years * 365.25;
  const wholeYears = Math.floor(years);
  const remainingDays = totalDays - (wholeYears * 365.25);
  const months = Math.floor(remainingDays / 30.44);
  const days = Math.round(remainingDays % 30.44);
  
  return { wholeYears, months, days };
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
                Measuring the shrinking gap between AI benchmark release and human-level achievement
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
                      <div>
                        <h3 className="text-lg font-semibold mb-2">What is this?</h3>
                        <p className="text-muted-foreground">
                          A tracker measuring the duration between a benchmark&apos;s release and when it becomes h-matched (reached by AI at human-level performance). As this duration approaches zero, it suggests we&apos;re nearing a point where AI systems match human performance almost immediately.
                        </p>
                      </div>
                      
                      <div>
                        <h3 className="text-lg font-semibold mb-2">Why track this?</h3>
                        <p className="text-muted-foreground">
                          By monitoring how quickly benchmarks become h-matched, we can observe the accelerating pace of AI capabilities. If this time reaches zero, it would indicate a critical milestone where creating benchmarks that humans can outperform AI systems becomes virtually impossible.
                        </p>
                      </div>
                      
                      <div>
                        <h3 className="text-lg font-semibold mb-2">What does this mean?</h3>
                        <p className="text-muted-foreground">
                          The shrinking time-to-solve for new benchmarks suggests an acceleration in AI capabilities. This metric helps visualize how quickly AI systems are catching up to human-level performance across various tasks and domains.
                        </p>
                      </div>
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
                  <XAxis
                    type="number"
                    dataKey="released"
                    name="Release Year"
                    domain={['auto', 'auto']}
                    tickCount={7}
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
                            {item.solved && item.solved.source && (
                              <TooltipProvider>
                                <RadixTooltip>
                                  <TooltipTrigger className="cursor-help inline-flex">
                                    <HelpCircle className="h-4 w-4 text-muted-foreground hover:text-primary transition-colors" />
                                  </TooltipTrigger>
                                  <TooltipContent 
                                    side="top"
                                    className="bg-background border-border max-w-[400px]" 
                                    sideOffset={5}
                                  >
                                    <div className="space-y-4">
                                      <p className="font-semibold">Achievement Date</p>
                                      <div>
                                        <p className="text-sm text-muted-foreground mb-2" 
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
                                    </div>
                                  </TooltipContent>
                                </RadixTooltip>
                              </TooltipProvider>
                            )}
                          </div>
                        </TableCell>
                        <TableCell className="font-mono">
                          <div className="flex items-center gap-1.5">
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
                          </div>
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
                Data last updated {currentDate}  Created by <a href="https://lindahl.works" className="hover:text-primary transition-colors">Rasmus Lindahl</a>
              </p>
            </footer>
          </div>
        </div>
      </div>
    </div>
  );
}