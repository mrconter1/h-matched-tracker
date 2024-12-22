export type BenchmarkSolved = {
  date: string;
  source?: {
    text: string;
    url: string;
  };
};

export type Benchmark = {
  benchmark: string;
  release: string;
  solved: BenchmarkSolved;
  url?: string;
  paperUrl?: string;
};

export const benchmarkData: Benchmark[] = [
  {
    benchmark: "ImageNet Challenge",
    release: "2009-01-01",
    solved: {
      date: "2015-12-10"
    },
    url: "https://www.image-net.org/",
    paperUrl: "https://arxiv.org/pdf/1409.0575"
  },
  {
    benchmark: "WinoGrande",
    release: "2012-06-10",
    solved: {
      date: "2023-07-11"
    },
    url: "https://winogrande.allenai.org/",
    paperUrl: "https://arxiv.org/pdf/1907.10641"
  },
  {
    benchmark: "SQuAD 1.1",
    release: "2016-06-16",
    solved: {
      date: "2018-09-15",
      source: {
        text: "Stanford's 2021 AI Index Report reported that AI surpassed human performance on SQuAD 1.1 in September 2018",
        url: "https://aiindex.stanford.edu/wp-content/uploads/2021/11/2021-AI-Index-Report_Master.pdf"
      }
    },
    url: "https://rajpurkar.github.io/SQuAD-explorer/explore/1.1/dev/",
    paperUrl: "https://arxiv.org/pdf/1606.05250"
  },
  {
    benchmark: "SQuAD 2.0",
    release: "2018-06-11",
    solved: {
      date: "2019-03-15"
    },
    url: "https://rajpurkar.github.io/SQuAD-explorer/explore/v2.0/dev/",
    paperUrl: "https://arxiv.org/pdf/1806.03822"
  },
  {
    benchmark: "VQA",
    release: "2019-05-03",
    solved: {
      date: "2021-06-15"
    },
    url: "https://visualqa.org/",
    paperUrl: "https://arxiv.org/pdf/1505.00468"
  },
  {
    benchmark: "HellaSwag",
    release: "2019-06-19",
    solved: {
      date: "2023-03-14"
    },
    url: "https://rowanzellers.com/hellaswag/",
    paperUrl: "https://arxiv.org/pdf/1905.07830"
  },
  {
    benchmark: "Adversarial NLI",
    release: "2019-10-31",
    solved: {
      date: "2020-06-15"
    },
    url: "https://github.com/facebookresearch/anli",
    paperUrl: "https://arxiv.org/pdf/1910.14599"
  },
  {
    benchmark: "ARC-AGI",
    release: "2019-11-05",
    solved: {
      date: "2024-12-21"
    },
    url: "https://arcprize.org/arc",
    paperUrl: "https://arxiv.org/abs/1911.01547"
  },
  {
    benchmark: "SuperGLUE",
    release: "2020-02-13",
    solved: {
      date: "2020-01-15"
    },
    url: "https://super.gluebenchmark.com/",
    paperUrl: "https://arxiv.org/pdf/1905.00537"
  },
  {
    benchmark: "MMLU",
    release: "2020-09-07",
    solved: {
      date: "2024-12-05"
    },
    url: "https://crfm.stanford.edu/helm/mmlu/latest/",
    paperUrl: "https://arxiv.org/pdf/2009.03300"
  },
  {
    benchmark: "MATH",
    release: "2021-11-08",
    solved: {
      date: "2024-09-12"
    },
    url: "https://github.com/hendrycks/math/",
    paperUrl: "https://arxiv.org/pdf/2103.03874v2"
  },
  {
    benchmark: "BIG-Bench-Hard",
    release: "2022-10-17",
    solved: {
      date: "2024-03-04"
    },
    url: "https://github.com/suzgunmirac/BIG-Bench-Hard",
    paperUrl: "https://arxiv.org/pdf/2210.09261"
  },
  {
    benchmark: "GPQA",
    release: "2023-11-29",
    solved: {
      date: "2024-09-21",
      source: {
        text: "OpenAI's O1 models achieved 78.3% accuracy, exceeding human expert performance of 69.7%",
        url: "https://openai.com/index/learning-to-reason-with-llms/"
      }
    },
    url: "https://github.com/idavidrein/gpqa",
    paperUrl: "https://arxiv.org/pdf/2311.12022"
  },
  {
    benchmark: "GSM8K",
    release: "2021-11-18",
    solved: {
      date: "2024-06-21"
    },
    url: "https://github.com/openai/grade-school-math",
    paperUrl: "https://arxiv.org/pdf/2110.14168"
  }
]; 