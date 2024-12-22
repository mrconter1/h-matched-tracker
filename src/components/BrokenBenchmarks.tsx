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
import { ArrowUpRight, Calendar, Clock, Database, ArrowUpDown } from 'lucide-react';
import { Button } from "@/components/ui/button";

const benchmarkData = [
  { benchmark: "ImageNet Challenge", release: "2009-01-01", solved: "2015-03-01", timeToSolve: 6.16 },
  { benchmark: "WinoGrande", release: "2012-06-10", solved: "2023-07-11", timeToSolve: 11.08 },
  { benchmark: "SQuAD 1.1", release: "2016-06-16", solved: "2017-06-15", timeToSolve: 1.00 },
  { benchmark: "SQuAD 2.0", release: "2018-06-11", solved: "2018-06-15", timeToSolve: 0.01 },
  { benchmark: "VQA", release: "2019-05-03", solved: "2021-06-15", timeToSolve: 2.12 },
  { benchmark: "HellaSwag", release: "2019-06-19", solved: "2023-03-14", timeToSolve: 3.73 },
  { benchmark: "Adversarial NLI", release: "2019-10-31", solved: "2020-06-15", timeToSolve: 0.62 },
  { benchmark: "ARC-AGI", release: "2019-11-05", solved: "2024-12-21", timeToSolve: 5.13 },
  { benchmark: "SuperGLUE", release: "2020-02-13", solved: "2020-03-15", timeToSolve: 0.08 },
  { benchmark: "MMLU", release: "2020-09-07", solved: "2024-12-05", timeToSolve: 4.24 },
  { benchmark: "MATH", release: "2021-11-08", solved: "2024-06-15", timeToSolve: 2.60 },
  { benchmark: "BIG-Bench-Hard", release: "2022-10-17", solved: "2024-06-21", timeToSolve: 1.68 },
  { benchmark: "GPQA", release: "2023-11-29", solved: "2024-09-21", timeToSolve: 0.81 },
  { benchmark: "GSM8K", release: "2021-11-18", solved: "2024-03-04", timeToSolve: 2.29 }
];

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
  key: keyof typeof benchmarkData[0];
  direction: 'asc' | 'desc';
} | null;

export default function BrokenBenchmarks() {
  const [mounted, setMounted] = useState(false);
  const [formattedDates, setFormattedDates] = useState<{[key: string]: string}>({});
  const [latestSolved, setLatestSolved] = useState<string>("");
  const [sortConfig, setSortConfig] = useState<SortConfig>(null);
  const averageTimeToSolve = (benchmarkData.reduce((acc, curr) => acc + curr.timeToSolve, 0) / benchmarkData.length).toFixed(1);
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
        ? a[sortConfig.key] - b[sortConfig.key]
        : b[sortConfig.key] - a[sortConfig.key];
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
                          <ArrowUpRight className="w-4 h-4 text-muted-foreground hover:text-primary cursor-pointer transition-colors" />
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