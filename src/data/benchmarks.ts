export type BenchmarkSolved = {
  date: string;
  source?: {
    text: string;
    references: {
      url: string;
    }[];
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
      date: "2016-03-15",
      source: {
        text: "AI systems approximately reached human-level performance (around ~95%) around early 2016<sup class='reference'>[1]</sup>",
        references: [{
          url: "https://aiindex.stanford.edu/wp-content/uploads/2021/11/2021-AI-Index-Report_Master.pdf"
        }]
      }
    },
    url: "https://www.image-net.org/",
    paperUrl: "https://arxiv.org/pdf/1409.0575"
  },
  {
    benchmark: "WinoGrad",
    release: "2011-01-01",
    solved: {
      date: "2019-11-01",
      source: {
        text: "Initially performing at chance level in 2016, transformer models rapidly progressed to 90.1% accuracy in late 2019, approaching human performance of 92-96%<sup>[1]</sup>",
        references: [{
          url: "https://arxiv.org/pdf/2201.02387"
        }]
      }
    },
    url: "https://cs.nyu.edu/faculty/davise/papers/WinogradSchemas/WS.html",
    paperUrl: "https://cs.nyu.edu/faculty/davise/papers/WSKR2012.pdf"
  },
  {
    benchmark: "SQuAD 1.1",
    release: "2016-06-16",
    solved: {
      date: "2018-09-15",
      source: {
        text: "Performance improved from 67.75% in August 2016 to surpass human performance (91.22%) in September 2018<sup class='reference'>[1]</sup>",
        references: [{
          url: "https://aiindex.stanford.edu/wp-content/uploads/2021/11/2021-AI-Index-Report_Master.pdf"
        }]
      }
    },
    url: "https://rajpurkar.github.io/SQuAD-explorer/explore/1.1/dev/",
    paperUrl: "https://arxiv.org/pdf/1606.05250"
  },
  {
    benchmark: "SQuAD 2.0",
    release: "2018-06-11",
    solved: {
      date: "2019-03-15",
      source: {
        text: "Took just 10 months to surpass human performance, improving from 66.3% in May 2018 to 89.47% in March 2019<sup class='reference'>[1]</sup>",
        references: [{
          url: "https://aiindex.stanford.edu/wp-content/uploads/2021/11/2021-AI-Index-Report_Master.pdf"
        }]
      }
    },
    url: "https://rajpurkar.github.io/SQuAD-explorer/explore/v2.0/dev/",
    paperUrl: "https://arxiv.org/pdf/1806.03822"
  },
  {
    benchmark: "VQA",
    release: "2019-05-03",
    solved: {
      date: "2022-06-15",
      source: {
        text: "AI systems reached human-level performance on Visual Question Answering around mid-2022<sup class='reference'>[1]</sup>",
        references: [{
          url: "https://aiindex.stanford.edu/wp-content/uploads/2024/05/HAI_AI-Index-Report-2024.pdf"
        }]
      }
    },
    url: "https://visualqa.org/",
    paperUrl: "https://arxiv.org/pdf/1505.00468"
  },
  {
    benchmark: "HellaSwag",
    release: "2019-06-19",
    solved: {
      date: "2024-03-04",
      source: {
        text: "Claude 3 Opus achieved 95.4% accuracy (10-shot), matching human performance of around 95%<sup class='reference'>[1]</sup><sup class='reference'>[2]</sup>",
        references: [
          { url: "https://arxiv.org/pdf/1905.07830" },
          { url: "https://www.anthropic.com/news/claude-3-family" }
        ]
      }
    },
    url: "https://rowanzellers.com/hellaswag/",
    paperUrl: "https://arxiv.org/pdf/1905.07830"
  },
  {
    benchmark: "Adversarial NLI",
    release: "2019-10-31",
    solved: {
      date: "2021-06-15",
      source: {
        text: "AI systems reached human-level performance on Adversarial Natural Language Inference around mid-2021<sup class='reference'>[1]</sup>",
        references: [{
          url: "https://aiindex.stanford.edu/wp-content/uploads/2024/05/HAI_AI-Index-Report-2024.pdf"
        }]
      }
    },
    url: "https://github.com/facebookresearch/anli",
    paperUrl: "https://arxiv.org/pdf/1910.14599"
  },
  {
    benchmark: "ARC-AGI",
    release: "2019-11-05",
    solved: {
      date: "2024-12-20",
      source: {
        text: "OpenAI's O3 system achieved 87.5% accuracy on the Semi-Private Evaluation set, matching human performance of around 85%<sup class='reference'>[1]</sup><sup class='reference'>[2]</sup>",
        references: [
          { url: "https://arcprize.org/blog/oai-o3-pub-breakthrough" },
          { url: "https://www.researchgate.net/profile/Kyrtin-Atreides/publication/386734256_Solving_the_Abstraction_and_Reasoning_Corpus_for_Artificial_General_Intelligence_ARC-AGI_AI_Benchmark_with_ICOM/links/675974468a2601629917709f/Solving-the-Abstraction-and-Reasoning-Corpus-for-Artificial-General-Intelligence-ARC-AGI-AI-Benchmark-with-ICOM.pdf" }
        ]
      }
    },
    url: "https://arcprize.org/arc",
    paperUrl: "https://arxiv.org/abs/1911.01547"
  },
  {
    benchmark: "SuperGLUE",
    release: "2020-02-13",
    solved: {
      date: "2020-12-15",
      source: {
        text: "AI systems surpassed human performance on the SuperGLUE benchmark in December 2020<sup class='reference'>[1]</sup>",
        references: [{
          url: "https://aiindex.stanford.edu/wp-content/uploads/2021/11/2021-AI-Index-Report_Master.pdf"
        }]
      }
    },
    url: "https://super.gluebenchmark.com/",
    paperUrl: "https://arxiv.org/pdf/1905.00537"
  },
  {
    benchmark: "MMLU",
    release: "2020-09-07",
    solved: {
      date: "2022-12-15",
      source: {
        text: "AI systems reached human-level performance on the Massive Multitask Language Understanding benchmark around December 2022<sup class='reference'>[1]</sup>",
        references: [{
          url: "https://aiindex.stanford.edu/wp-content/uploads/2024/05/HAI_AI-Index-Report-2024.pdf"
        }]
      }
    },
    url: "https://crfm.stanford.edu/helm/mmlu/latest/",
    paperUrl: "https://arxiv.org/pdf/2009.03300"
  },
  {
    benchmark: "MATH",
    release: "2021-11-08",
    solved: {
      date: "2024-09-12",
      source: {
        text: "IMO gold medalists achieved 90% accuracy on sample problems<sup class='reference'>[1]</sup>, later surpassed by O1 models reaching 94.8% accuracy<sup class='reference'>[2]</sup>",
        references: [
          { url: "https://arxiv.org/pdf/2103.03874" },
          { url: "https://openai.com/index/learning-to-reason-with-llms/" }
        ]
      }
    },
    url: "https://github.com/hendrycks/math/",
    paperUrl: "https://arxiv.org/pdf/2103.03874v2"
  },
  {
    benchmark: "BIG-Bench-Hard",
    release: "2022-10-17",
    solved: {
      date: "2024-06-21",
      source: {
        text: "Claude 3.5 Sonnet achieved 93.1% (3-shot CoT), matching human performance of around 94.4%<sup class='reference'>[1]</sup><sup class='reference'>[2]</sup>",
        references: [
          { url: "https://arxiv.org/pdf/2210.09261" },
          { url: "https://www.anthropic.com/news/claude-3-5-sonnet" }
        ]
      }
    },
    url: "https://github.com/suzgunmirac/BIG-Bench-Hard",
    paperUrl: "https://arxiv.org/pdf/2210.09261"
  },
  {
    benchmark: "GPQA",
    release: "2023-11-29",
    solved: {
      date: "2024-09-12",
      source: {
        text: "OpenAI's O1 models achieved 78.3% accuracy, exceeding human expert performance of 69.7%<sup class='reference'>[1]</sup>",
        references: [{
          url: "https://openai.com/index/learning-to-reason-with-llms/"
        }]
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
  },
  {
    benchmark: "HumanEval",
    release: "2021-07-14",
    solved: {
      date: "2023-03-14",
      source: {
        text: "AI reached human-level performance with GPT-4<sup class='reference'>[1]</sup><sup class='reference'>[2]</sup>",
        references: [
          { url: "https://arxiv.org/pdf/2401.05940" },
          { url: "https://cdn.openai.com/papers/gpt-4-system-card.pdf" }
        ]
      }
    },
    url: "https://github.com/openai/human-eval",
    paperUrl: "https://arxiv.org/pdf/2107.03374v2"
  }
]; 