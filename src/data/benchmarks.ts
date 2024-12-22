export type Benchmark = {
  benchmark: string;
  release: string;
  solved: string;
  timeToSolve: number;
  url?: string;
  paperUrl?: string;
};

export const benchmarkData: Benchmark[] = [
  {
    benchmark: "ImageNet Challenge",
    release: "2009-01-01",
    solved: "2015-03-01",
    timeToSolve: 6.16,
    url: "https://www.image-net.org/"
  },
  {
    benchmark: "WinoGrande",
    release: "2012-06-10",
    solved: "2023-07-11",
    timeToSolve: 11.08,
    url: "https://winogrande.allenai.org/"
  },
  {
    benchmark: "SQuAD 1.1",
    release: "2016-06-16",
    solved: "2017-06-15",
    timeToSolve: 1.00,
    url: "https://rajpurkar.github.io/SQuAD-explorer/explore/1.1/dev/"
  },
  {
    benchmark: "SQuAD 2.0",
    release: "2018-06-11",
    solved: "2018-06-15",
    timeToSolve: 0.01,
    url: "https://rajpurkar.github.io/SQuAD-explorer/explore/v2.0/dev/"
  },
  {
    benchmark: "VQA",
    release: "2019-05-03",
    solved: "2021-06-15",
    timeToSolve: 2.12,
    url: "https://visualqa.org/"
  },
  {
    benchmark: "HellaSwag",
    release: "2019-06-19",
    solved: "2023-03-14",
    timeToSolve: 3.73,
    url: "https://rowanzellers.com/hellaswag/"
  },
  { benchmark: "Adversarial NLI", release: "2019-10-31", solved: "2020-06-15", timeToSolve: 0.62, url: "https://github.com/facebookresearch/anli" },
  { benchmark: "ARC-AGI", release: "2019-11-05", solved: "2024-12-21", timeToSolve: 5.13, url: "https://arcprize.org/arc", paperUrl: "https://arxiv.org/abs/1911.01547" },
  { 
    benchmark: "SuperGLUE", 
    release: "2020-02-13", 
    solved: "2020-03-15", 
    timeToSolve: 0.08,
    url: "https://super.gluebenchmark.com/",
    paperUrl: "https://arxiv.org/pdf/1905.00537"
  },
  { 
    benchmark: "MMLU", 
    release: "2020-09-07", 
    solved: "2024-12-05", 
    timeToSolve: 4.24,
    url: "https://crfm.stanford.edu/helm/mmlu/latest/",
    paperUrl: "https://arxiv.org/pdf/2009.03300"
  },
  { 
    benchmark: "MATH", 
    release: "2021-11-08", 
    solved: "2024-06-15", 
    timeToSolve: 2.60,
    url: "https://github.com/hendrycks/math/",
    paperUrl: "https://arxiv.org/pdf/2103.03874v2"
  },
  { 
    benchmark: "BIG-Bench-Hard", 
    release: "2022-10-17", 
    solved: "2024-06-21", 
    timeToSolve: 1.68,
    url: "https://github.com/suzgunmirac/BIG-Bench-Hard",
    paperUrl: "https://arxiv.org/pdf/2210.09261"
  },
  { 
    benchmark: "GPQA", 
    release: "2023-11-29", 
    solved: "2024-09-21", 
    timeToSolve: 0.81,
    url: "https://github.com/idavidrein/gpqa",
    paperUrl: "https://arxiv.org/pdf/2311.12022"
  },
  { benchmark: "GSM8K", release: "2021-11-18", solved: "2024-03-04", timeToSolve: 2.29 }
]; 