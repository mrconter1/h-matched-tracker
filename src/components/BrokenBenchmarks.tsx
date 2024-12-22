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

type SortConfig = {
  key: keyof Benchmark;
  direction: 'asc' | 'desc';
} | null;

const getDecimalYear = (dateString: string) => {
  const date = new Date(dateString);
  return date.getFullYear() + (date.getMonth() / 12) + (date.getDate() / 365);
};

const prepareGraphData = (data: typeof benchmarkData) => {
  return data
    .sort((a, b) => new Date(a.solved).getTime() - new Date(b.solved).getTime())
    .map(item => ({
      name: item.benchmark,
      solved: Number(getDecimalYear(item.solved).toFixed(2)),
      timeToSolve: Number(item.timeToSolve.toFixed(2))
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
      return sortConfig.direction === 'asc' 
        ? (a[sortConfig.key] as number) - (b[sortConfig.key] as number)
        : (b[sortConfig.key] as number) - (a[sortConfig.key] as number);
    });
  };

  const requestSort = (key: keyof typeof benchmarkData[0]) => {
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
          <p className="text-lg sm:text-xl text-muted-foreground max-w-2xl mx-auto">
            Tracking the rapid evolution of AI capabilities through benchmark achievements.
          </p>
        </div>

        {/* Graph Card */}
        <Card className="mb-16">
          <CardHeader>
            <CardTitle>Time to Solve Trend</CardTitle>
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
                  name="Time to Solve"
                  label={{ 
                    value: 'Time to Solve (Years)', 
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
                            Solved: {payload[0].payload.solved}
                          </p>
                          <p className="text-sm text-muted-foreground">
                            Time to Solve: {payload[0].payload.timeToSolve} years
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
        <Card>
          <CardHeader>
            <CardTitle>Benchmark Timeline</CardTitle>
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
                        className="hover:bg-muted/50 -ml-4 h-8 data-[state=open]:bg-accent"
                      >
                        Benchmark
                        <ArrowUpDown className="ml-2 h-4 w-4" />
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
                        Time to Solve
                        <ArrowUpDown className="ml-2 h-4 w-4" />
                      </Button>
                    </TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {sortedData.map((item) => (
                    <TableRow key={item.benchmark}>
                      <TableCell className="font-medium">
                        <div className="flex items-center gap-2">
                          {item.benchmark}
                          <div className="flex items-center gap-1">
                            {item.url && (
                              <a 
                                href={item.url}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="inline-flex items-center hover:text-primary transition-colors"
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
                                className="inline-flex items-center hover:text-primary transition-colors"
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
                        {formattedDates[`${item.benchmark}-release`] || ''}
                      </TableCell>
                      <TableCell className="font-mono text-muted-foreground">
                        {formattedDates[`${item.benchmark}-solved`] || ''}
                      </TableCell>
                      <TableCell className="font-mono">
                        <span className="px-2 py-1 rounded-md bg-muted">
                          {item.timeToSolve.toFixed(2)} years
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