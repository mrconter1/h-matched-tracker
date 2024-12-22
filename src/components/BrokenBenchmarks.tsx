import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Separator } from "@/components/ui/separator";
import { ArrowUpRight, Calendar, Clock, Database } from 'lucide-react';

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
  return date.toLocaleDateString('en-US', { 
    year: 'numeric',
    month: 'short',
    day: 'numeric'
  });
};

export default function BrokenBenchmarks() {
  const averageTimeToSolve = (benchmarkData.reduce((acc, curr) => acc + curr.timeToSolve, 0) / benchmarkData.length).toFixed(1);
  const latestSolved = formatDate(benchmarkData.sort((a, b) => new Date(b.solved).getTime() - new Date(a.solved).getTime())[0].solved);

  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-950 to-slate-900">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-16">
        {/* Hero Section */}
        <div className="text-center space-y-8 mb-16">
          <h1 className="text-4xl sm:text-6xl lg:text-7xl font-bold tracking-tight text-white">
            Broken <span className="text-blue-500">Benchmarks</span>
          </h1>
          <p className="text-lg sm:text-xl text-slate-400 max-w-2xl mx-auto">
            Tracking the rapid evolution of AI capabilities through benchmark achievements.
          </p>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-16">
          <Card className="bg-slate-900/50 border-slate-800">
            <CardHeader className="space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-slate-400 flex items-center gap-2">
                <Database className="w-4 h-4" /> Benchmarks Tracked
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-white">{benchmarkData.length}</div>
            </CardContent>
          </Card>
          <Card className="bg-slate-900/50 border-slate-800">
            <CardHeader className="space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-slate-400 flex items-center gap-2">
                <Clock className="w-4 h-4" /> Average Time to Solve
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-white">{averageTimeToSolve} years</div>
            </CardContent>
          </Card>
          <Card className="bg-slate-900/50 border-slate-800">
            <CardHeader className="space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-slate-400 flex items-center gap-2">
                <Calendar className="w-4 h-4" /> Latest Solved
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-white">{latestSolved}</div>
            </CardContent>
          </Card>
        </div>

        {/* Main Content */}
        <Card className="bg-slate-900/50 border-slate-800">
          <CardHeader>
            <CardTitle className="text-xl text-white">Benchmark Timeline</CardTitle>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow className="border-slate-800">
                  <TableHead className="text-slate-400">Benchmark</TableHead>
                  <TableHead className="text-slate-400">Released</TableHead>
                  <TableHead className="text-slate-400">Solved</TableHead>
                  <TableHead className="text-slate-400">Time to Solve</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {benchmarkData
                  .sort((a, b) => new Date(b.solved).getTime() - new Date(a.solved).getTime())
                  .map((item) => (
                    <TableRow 
                      key={item.benchmark} 
                      className="border-slate-800 hover:bg-slate-800/50 transition-colors"
                    >
                      <TableCell className="font-medium text-white flex items-center gap-2">
                        {item.benchmark}
                        <ArrowUpRight className="w-4 h-4 text-slate-400" />
                      </TableCell>
                      <TableCell className="font-mono text-slate-400">{formatDate(item.release)}</TableCell>
                      <TableCell className="font-mono text-slate-400">{formatDate(item.solved)}</TableCell>
                      <TableCell className="font-mono text-slate-400">
                        {item.timeToSolve.toFixed(2)} years
                      </TableCell>
                    </TableRow>
                  ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>

        <Separator className="my-12 bg-slate-800" />

        <footer className="text-center text-sm text-slate-400">
          <p>Data last updated {new Date().toLocaleDateString()}</p>
        </footer>
      </div>
    </div>
  );
}