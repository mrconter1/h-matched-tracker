export type Benchmark = {
  benchmark: string;
  release: string;
  solved: string;
  url?: string;
  paperUrl?: string;
};

export const benchmarkData: Benchmark[] = [
  {
    benchmark: "ImageNet Challenge",
    release: "2009-01-01",
    solved: "2015-03-01",
    url: "https://www.image-net.org/",
    paperUrl: "https://arxiv.org/pdf/1409.0575"
  },
  {
    benchmark: "WinoGrande",
    release: "2012-06-10",
    solved: "2023-07-11",
    url: "https://winogrande.allenai.org/",
    paperUrl: "https://arxiv.org/pdf/1907.10641"
  },
  {
    benchmark: "SQuAD 1.1",
    release: "2016-06-16",
    solved: "2017-06-15",
    url: "https://rajpurkar.github.io/SQuAD-explorer/explore/1.1/dev/",
    paperUrl: "https://arxiv.org/pdf/1606.05250"
  },
  {
    benchmark: "SQuAD 2.0",
    release: "2018-06-11",
    solved: "2018-06-15",
    url: "https://rajpurkar.github.io/SQuAD-explorer/explore/v2.0/dev/",
    paperUrl: "https://arxiv.org/pdf/1806.03822"
  },
  {
    benchmark: "VQA",
    release: "2019-05-03",
    solved: "2021-06-15",
    url: "https://visualqa.org/",
    paperUrl: "https://arxiv.org/pdf/1505.00468"
  },
  {
    benchmark: "HellaSwag",
    release: "2019-06-19",
    solved: "2023-03-14",
    url: "https://rowanzellers.com/hellaswag/",
    paperUrl: "https://arxiv.org/pdf/1905.07830"
  },
  { 
    benchmark: "Adversarial NLI", 
    release: "2019-10-31", 
    solved: "2020-06-15", 
    url: "https://github.com/facebookresearch/anli",
    paperUrl: "https://arxiv.org/pdf/1910.14599"
  },
  { benchmark: "ARC-AGI", release: "2019-11-05", solved: "2024-12-21", url: "https://arcprize.org/arc", paperUrl: "https://arxiv.org/abs/1911.01547" },
  { 
    benchmark: "SuperGLUE", 
    release: "2020-02-13", 
    solved: "2020-03-15", 
    url: "https://super.gluebenchmark.com/",
    paperUrl: "https://arxiv.org/pdf/1905.00537"
  },
  { 
    benchmark: "MMLU", 
    release: "2020-09-07", 
    solved: "2024-12-05", 
    url: "https://crfm.stanford.edu/helm/mmlu/latest/",
    paperUrl: "https://arxiv.org/pdf/2009.03300"
  },
  { 
    benchmark: "MATH", 
    release: "2021-11-08", 
    solved: "2024-06-15", 
    url: "https://github.com/hendrycks/math/",
    paperUrl: "https://arxiv.org/pdf/2103.03874v2"
  },
  { 
    benchmark: "BIG-Bench-Hard", 
    release: "2022-10-17", 
    solved: "2024-06-21", 
    url: "https://github.com/suzgunmirac/BIG-Bench-Hard",
    paperUrl: "https://arxiv.org/pdf/2210.09261"
  },
  { 
    benchmark: "GPQA", 
    release: "2023-11-29", 
    solved: "2024-09-21", 
    url: "https://github.com/idavidrein/gpqa",
    paperUrl: "https://arxiv.org/pdf/2311.12022"
  },
  { 
    benchmark: "GSM8K", 
    release: "2021-11-18", 
    solved: "2024-03-04", 
    url: "https://github.com/openai/grade-school-math",
    paperUrl: "https://arxiv.org/pdf/2110.14168"
  }
]; 