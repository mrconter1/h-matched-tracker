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
import { Calendar, Clock, Database, ArrowUpDown, ExternalLink } from 'lucide-react';
import { Button } from "@/components/ui/button";
import { benchmarkData, type Benchmark } from '@/data/benchmarks';

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

export default function BrokenBenchmarks() {
  const [mounted, setMounted] = useState(false);
  const [formattedDates, setFormattedDates] = useState<{[key: string]: string}>({});
  const [latestSolved, setLatestSolved] = useState<string>("");
  const [sortConfig, setSortConfig] = useState<SortConfig>(null);
  const averageTimeToSolve = (benchmarkData.reduce((acc, curr) => acc + (curr.timeToSolve || 0), 0) / benchmarkData.length).toFixed(1);
  const [currentDate, setCurrentDate] = useState("");

  useEffect(() => {
    setMounted(true);
    const dates: {[key: string]: string} = {};
    benchmarkData.forEach(item => {
      dates[`${item.benchmark}-release`] = formatDate(item.release);
      dates[`${item.benchmark}-solved`] = formatDate(item.solved);
    });
    setFormattedDates(dates);
    setLatestSolved(formatDate(benchmarkData.sort((a, b) => new Date(b.solved).getTime() - new Date(a.solved).getTime())[0].solved));
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

        {/* Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-16">
          <Card>
            <CardHeader className="space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
                <Database className="w-4 h-4" /> Benchmarks Tracked
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{benchmarkData.length}</div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
                <Clock className="w-4 h-4" /> Average Time to Solve
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{averageTimeToSolve} years</div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
                <Calendar className="w-4 h-4" /> Latest Solved
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{latestSolved}</div>
            </CardContent>
          </Card>
        </div>

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
                          {item.url && (
                            <a 
                              href={item.url}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="inline-flex items-center hover:text-primary transition-colors"
                            >
                              <ExternalLink className="w-4 h-4 text-muted-foreground hover:text-primary" />
                              <span className="sr-only">Visit {item.benchmark} website</span>
                            </a>
                          )}
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