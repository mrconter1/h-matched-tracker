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
import { ArrowUpDown, ExternalLink, FileText } from 'lucide-react';
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
    .sort((a, b) => new Date(a.solved).getTime() - new Date(b.solved).getTime())
    .map(item => ({
      name: item.benchmark,
      solved: Number(getDecimalYear(item.solved).toFixed(2)),
      timeToSolve: calculateTimeToSolve(item.release, item.solved),
      solvedDate: formatDate(item.solved)
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
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-16">
        {/* Hero Section */}
        <div className="text-center space-y-8 mb-16">
          <h1 className="text-4xl sm:text-6xl lg:text-7xl font-bold tracking-tight">
            Broken <span className="text-primary">Benchmarks</span>
          </h1>
          <div className="space-y-4">
            <p className="text-lg sm:text-xl text-muted-foreground max-w-2xl mx-auto">
              Tracking how quickly AI systems achieve human-level performance on benchmarks, revealing an uncomfortable trend: we&apos;re running out of tasks that humans can solve but AI cannot.
            </p>
            <p className="text-sm sm:text-base text-muted-foreground max-w-2xl mx-auto">
              As the time between a benchmark&apos;s release and its solution by AI rapidly shrinks, we approach a pivotal moment: when AI can solve new challenges as quickly as humans can create them—perhaps the clearest signal yet of artificial general intelligence.
            </p>
          </div>
        </div>

        {/* Graph Card */}
        <Card className="mb-16 shadow-md hover:shadow-lg transition-shadow">
          <CardHeader className="space-y-1">
            <CardTitle>Time to Human Level Trend</CardTitle>
            <p className="text-sm text-muted-foreground">
              Visualization of how quickly AI systems reached human-level performance on each benchmark
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
                  dataKey="solved"
                  name="Year Solved"
                  domain={['auto', 'auto']}
                  tickCount={7}
                  label={{ 
                    value: 'Year Solved', 
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

        <Separator className="my-12" />

        <footer className="text-center text-sm text-muted-foreground">
          <p suppressHydrationWarning>Data last updated {currentDate}</p>
        </footer>
      </div>
    </div>
  );
}