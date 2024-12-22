import React from 'react';

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
  return (
    <div className="min-h-screen bg-black">
      <main className="max-w-4xl mx-auto px-4 sm:px-6 py-12">
        <div className="mb-8">
          <h1 className="text-3xl md:text-4xl font-bold text-white mb-4">
            Broken Benchmarks
          </h1>
          <p className="text-gray-400">
            A timeline of AI benchmarks and how quickly they were solved.
          </p>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full border-collapse">
            <thead>
              <tr className="border-b border-white/10">
                <th className="py-3 px-4 text-left text-sm font-semibold text-gray-300">Benchmark</th>
                <th className="py-3 px-4 text-left text-sm font-semibold text-gray-300">Released</th>
                <th className="py-3 px-4 text-left text-sm font-semibold text-gray-300">Solved</th>
                <th className="py-3 px-4 text-left text-sm font-semibold text-gray-300">Time to Solve</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/10">
              {benchmarkData.map((item, index) => (
                <tr 
                  key={item.benchmark}
                  className="hover:bg-white/5 transition-colors"
                >
                  <td className="py-3 px-4 text-sm text-white">{item.benchmark}{index}</td>
                  <td className="py-3 px-4 text-sm text-gray-400">{formatDate(item.release)}</td>
                  <td className="py-3 px-4 text-sm text-gray-400">{formatDate(item.solved)}</td>
                  <td className="py-3 px-4 text-sm text-gray-400">
                    {item.timeToSolve.toFixed(2)} years
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </main>
    </div>
  );
}