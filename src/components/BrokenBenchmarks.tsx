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
import { Separator } from "@/components/ui/separator";
import { ArrowUpDown, ExternalLink, FileText, Mail, Globe } from 'lucide-react';
import { Button } from "@/components/ui/button";
import { benchmarkData, type Benchmark } from '@/data/benchmarks';
import { ScatterChart, Scatter, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';

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

const calculateTimeToSolve = (releaseDate: string, solvedDate: string): number => {
  const release = new Date(releaseDate);
  const solved = new Date(solvedDate);
  const diffTime = Math.abs(solved.getTime() - release.getTime());
  const diffYears = diffTime / (1000 * 60 * 60 * 24 * 365.25); // Using 365.25 to account for leap years
  return Number(diffYears.toFixed(2));
};

const prepareGraphData = (data: typeof benchmarkData) => {
  return data
    .sort((a, b) => new Date(a.release).getTime() - new Date(b.release).getTime())
    .map(item => ({
      name: item.benchmark,
      released: Number(getDecimalYear(item.release).toFixed(2)),
      timeToSolve: calculateTimeToSolve(item.release, item.solved),
      solvedDate: formatDate(item.solved),
      releaseDate: formatDate(item.release)
    }));
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
      dates[`${item.benchmark}-solved`] = formatDate(item.solved);
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
      
      if (sortConfig.key === 'release' || sortConfig.key === 'solved') {
        const dateA = new Date(a[sortConfig.key]).getTime();
        const dateB = new Date(b[sortConfig.key]).getTime();
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

  return (
    <div className="min-h-screen bg-gradient-to-b from-background to-muted">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 pt-16 pb-8">
        {/* Hero Section */}
        <div className="text-center space-y-8 mb-16">
          <div className="space-y-2">
            <h1 className="text-4xl sm:text-6xl lg:text-7xl font-bold tracking-tight">
              h-matched <span className="text-primary">Timeline</span>
            </h1>
            <p className="text-sm text-muted-foreground">
              h = human-level performance | Tracking time from release to h-matched
            </p>
          </div>
          
          <div className="grid md:grid-cols-2 gap-6 max-w-4xl mx-auto">
            <Card className="text-left p-6 card-hover">
              <CardTitle className="text-lg mb-3">What is this?</CardTitle>
              <p className="text-muted-foreground">
                A tracker measuring the duration between a benchmark&apos;s release and when it becomes h-matched (reached by AI at human-level performance).
              </p>
            </Card>
            
            <Card className="text-left p-6 card-hover">
              <CardTitle className="text-lg mb-3">Why track this?</CardTitle>
              <p className="text-muted-foreground">
                By monitoring how quickly benchmarks become h-matched, we can observe the accelerating pace at which AI systems achieve human-level capabilities across different domains.
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
              <ScatterChart
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
                    offset: 10
                  }}
                />
                <Tooltip
                  cursor={{ strokeDasharray: '3 3' }}
                  content={({ active, payload }) => {
                    if (active && payload && payload.length) {
                      return (
                        <div className="rounded-lg border bg-background p-2 shadow-sm">
                          <p className="font-medium">{payload[0].payload.name}</p>
                          <p className="text-sm text-muted-foreground">
                            Released: {payload[0].payload.releaseDate}
                          </p>
                          <p className="text-sm text-muted-foreground">
                            Solved: {payload[0].payload.solvedDate}
                          </p>
                          <p className="text-sm text-muted-foreground">
                            Time to Human Level: {payload[0].payload.timeToSolve} years
                          </p>
                        </div>
                      );
                    }
                    return null;
                  }}
                />
                <Scatter
                  data={prepareGraphData(benchmarkData)}
                  fill="hsl(var(--primary))"
                  stroke="hsl(var(--primary))"
                  strokeWidth={2}
                  r={6}
                />
              </ScatterChart>
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
                        <span className="bg-muted/50 px-2 py-1 rounded-md text-sm">
                          {formattedDates[`${item.benchmark}-release`] || ''}
                        </span>
                      </TableCell>
                      <TableCell className="font-mono text-muted-foreground">
                        <span className="bg-muted/50 px-2 py-1 rounded-md text-sm">
                          {formattedDates[`${item.benchmark}-solved`] || ''}
                        </span>
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
          <CardHeader className="space-y-1">
            <CardTitle>Contribute</CardTitle>
            <p className="text-sm text-muted-foreground">
              Help improve the h-matched Timeline
            </p>
          </CardHeader>
          <CardContent className="space-y-4">
            <p className="text-muted-foreground">
              If you notice any missing benchmarks or would like to suggest improvements, please feel free to:
            </p>
            
            <div className="flex flex-col sm:flex-row gap-4">
              <a
                href="https://github.com/mrconter1/broken-benchmarks/issues"
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center justify-center gap-2 rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90 transition-colors"
              >
                <FileText className="h-4 w-4" />
                Open an issue on GitHub
              </a>
              
              <a
                href="mailto:rasmus.lindahl1996@gmail.com"
                className="inline-flex items-center justify-center gap-2 rounded-md border border-input bg-background px-4 py-2 text-sm font-medium hover:bg-accent hover:text-accent-foreground transition-colors"
              >
                <Mail className="h-4 w-4" />
                Send me an email
              </a>
              
              <a
                href="https://lindahl.works"
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center justify-center gap-2 rounded-md border border-input bg-background px-4 py-2 text-sm font-medium hover:bg-accent hover:text-accent-foreground transition-colors"
              >
                <Globe className="h-4 w-4" />
                Visit my portfolio
              </a>
            </div>
          </CardContent>
        </Card>

        <div className="mt-2 flex flex-col items-center space-y-1">
          <Separator className="w-full" />
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