export type BenchmarkSolved = {
  date: string | null;
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
        text: "AI systems approximately reached human-level performance (around 95%) around early 2016<sup class='reference'>[1]</sup>",
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
    benchmark: "TriviaQA",
    release: "2017-05-13",
    solved: {
      date: "2022-08-08",
      source: {
        text: "Meta AI's Atlas model achieved 84.7% accuracy, surpassing human performance of around 79.7%<sup class='reference'>[1]</sup><sup class='reference'>[2]</sup>",
        references: [
          { url: "https://arxiv.org/pdf/1705.03551" },
          { url: "https://arxiv.org/pdf/2208.03299" }
        ]
      }
    },
    url: "https://nlp.cs.washington.edu/triviaqa/",
    paperUrl: "https://arxiv.org/pdf/1705.03551"
  },
  {
    benchmark: "RACE",
    release: "2017-04-17",
    solved: {
      date: null,
      source: {
        text: "Human performance is 95% accuracy. RACE tests reading comprehension with questions from English exams for Chinese students, requiring reasoning over passages covering a variety of topics and styles.",
        references: [{
          url: "https://arxiv.org/pdf/1704.04683"
        }]
      }
    },
    url: "http://www.cs.cmu.edu/~glai1/data/race/",
    paperUrl: "https://arxiv.org/pdf/1704.04683"
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
    benchmark: "CommonsenseQA",
    release: "2018-11-02",
    solved: {
      date: null,
      source: {
        text: "Human performance is 89% accuracy, while the best AI models achieve around 56% accuracy. CommonsenseQA tests reasoning that requires background knowledge about spatial relations, causes and effects, scientific facts, and social conventions.",
        references: [{
          url: "https://aclanthology.org/N19-1421.pdf"
        }]
      }
    },
    url: "https://www.tau-nlp.sites.tau.ac.il/commonsenseqa",
    paperUrl: "https://aclanthology.org/N19-1421.pdf"
  },
  {
    benchmark: "GLUE",
    release: "2018-11-01",
    solved: {
      date: "2019-07-01",
      source: {
        text: "Yang et al. achieved a GLUE score of 88.4, surpassing human performance of 87.1 by 1.3 points<sup class='reference'>[1]</sup>",
        references: [{
          url: "https://arxiv.org/pdf/1905.00537"
        }]
      }
    },
    url: "https://gluebenchmark.com/",
    paperUrl: "https://openreview.net/pdf?id=rJ4km2R5t7"
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
    benchmark: "GSM8K",
    release: "2021-11-18",
    solved: {
      date: "2023-03-14",
      source: {
        text: "GPT-4 achieved 87.1% accuracy, significantly surpassing the human baseline of 60% from 9-12 year old students<sup class='reference'>[1]</sup><sup class='reference'>[2]</sup>",
        references: [
          { url: "https://openai.com/index/solving-math-word-problems/" },
          { url: "https://openai.com/index/gpt-4-research/" }
        ]
      }
    },
    url: "https://github.com/openai/grade-school-math",
    paperUrl: "https://arxiv.org/pdf/2110.14168"
  },
  {
    benchmark: "ScienceQA",
    release: "2022-09-20",
    solved: {
      date: null,
      source: {
        text: "Human performance is 88.40% accuracy, while the best AI model (GPT-4o) achieves 86.36% accuracy. ScienceQA tests multimodal reasoning across diverse science topics requiring multi-hop reasoning and explanations.",
        references: [{
          url: "https://lupantech.github.io/papers/neurips22_scienceqa.pdf"
        }]
      }
    },
    url: "https://scienceqa.github.io/",
    paperUrl: "https://lupantech.github.io/papers/neurips22_scienceqa.pdf"
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
    benchmark: "BIRD-SQL",
    release: "2023-11-15",
    solved: {
      date: null,
      source: {
        text: "Human performance (data engineers and DB students) is 92.96% accuracy, while the best AI models achieve around 75.63% accuracy. BIRD-SQL evaluates text-to-SQL parsing across 37 professional domains with large-scale database content, testing both correctness and efficiency of generated SQL queries.",
        references: [{
          url: "https://arxiv.org/pdf/2305.03111"
        }]
      }
    },
    url: "https://bird-bench.github.io/",
    paperUrl: "https://arxiv.org/pdf/2305.03111"
  },
  {
    benchmark: "METATOOL",
    release: "2023-10-05",
    solved: {
      date: null,
      source: {
        text: "Human performance is 96% accuracy on reliability testing, while the best AI models achieve only 50.35% accuracy. METATOOL evaluates whether LLMs can decide when to use tools and which tools to select from a collection to fulfill user requests.",
        references: [{
          url: "https://arxiv.org/pdf/2310.03128"
        }]
      }
    },
    url: "https://github.com/LAIR-RU/MetaTool",
    paperUrl: "https://arxiv.org/pdf/2310.03128"
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
  },
  {
    benchmark: "MMMU",
    release: "2024-06-13",
    solved: {
      date: null,
      source: {
        text: "Human experts achieved 88.6% accuracy, while the best AI model (GPT-4o) reached 69.1% accuracy. MMMU tests expert-level multimodal understanding across 30 subjects in 6 disciplines, requiring college-level knowledge and complex reasoning.",
        references: [{
          url: "https://arxiv.org/abs/2311.16502"
        }]
      }
    },
    url: "https://mmmu-benchmark.github.io/",
    paperUrl: "https://arxiv.org/pdf/2311.16502"
  },
  {
    benchmark: "PubMedQA",
    release: "2019-11-03",
    solved: {
      date: "2024-03-04",
      source: {
        text: "Claude 3 Sonnet achieved 79.7% accuracy, surpassing single human performance of 78.0%<sup class='reference'>[1]</sup><sup class='reference'>[2]</sup>",
        references: [
          { url: "https://aclanthology.org/D19-1259.pdf" },
          { url: "https://www-cdn.anthropic.com/de8ba9b01c9ab7cbabf5c33b80b7bbc618857627/Model_Card_Claude_3.pdf" }
        ]
      }
    },
    url: "https://pubmedqa.github.io/",
    paperUrl: "https://aclanthology.org/D19-1259.pdf"
  },
  {
    benchmark: "MathVista",
    release: "2024-01-21",
    solved: {
      date: "2024-05-13",
      source: {
        text: "GPT-4o achieved 63.8% accuracy, surpassing human performance of 60.3%<sup class='reference'>[1]</sup><sup class='reference'>[2]</sup>",
        references: [
          { url: "https://arxiv.org/pdf/2310.02255" },
          { url: "https://openai.com/index/hello-gpt-4o/" }
        ]
      }
    },
    url: "https://mathvista.github.io/",
    paperUrl: "https://arxiv.org/pdf/2310.02255"
  },
  {
    benchmark: "LongBench v2",
    release: "2025-01-03",
    solved: {
      date: "2024-12-12",
      source: {
        text: "O1-preview model achieved 57.7% accuracy, surpassing the human baseline of 53.7% by 4% under a 15-minute time constraint<sup class='reference'>[1]</sup>",
        references: [{
          url: "https://arxiv.org/pdf/2412.15204"
        }]
      }
    },
    url: "https://longbench2.github.io/",
    paperUrl: "https://arxiv.org/pdf/2412.15204"
  },
  {
    benchmark: "HALLUSIONBENCH",
    release: "2024-03-25",
    solved: {
      date: null,
      source: {
        text: "Human performance is 65.28% accuracy. The best model (GPT-4V) achieves only 31.42% question-pair accuracy, highlighting significant challenges in visual reasoning and hallucination detection<sup class='reference'>[1]</sup>",
        references: [{
          url: "https://arxiv.org/pdf/2310.14566v5"
        }]
      }
    },
    url: "https://github.com/tianyi-lab/HallusionBench",
    paperUrl: "https://arxiv.org/pdf/2310.14566v5"
  },
  {
    benchmark: "BioLP-bench",
    release: "2024-08-31",
    solved: {
      date: null,
      source: {
        text: "Human experts achieved 38.4% accuracy, while the best AI model (GPT-4o) only reached 17% accuracy. The benchmark measures understanding of biological lab protocols by identifying critical mistakes that would cause experiments to fail.",
        references: [{
          url: "https://doi.org/10.1101/2024.08.21.608694"
        }]
      }
    },
    url: "https://github.com/baceolus/BioLP-bench",
    paperUrl: "https://www.biorxiv.org/content/10.1101/2024.08.21.608694v2.full.pdf"
  },
  {
    benchmark: "EgoSchema",
    release: "2023-08-17",
    solved: {
      date: null,
      source: {
        text: "Human evaluators achieved 76% accuracy, while the best AI models achieved less than 33% accuracy (random is 20%). EgoSchema tests very long-form video understanding with 3-minute clips requiring complex temporal reasoning.",
        references: [{
          url: "https://arxiv.org/abs/2308.09126"
        }]
      }
    },
    url: "https://egoschema.github.io/",
    paperUrl: "https://arxiv.org/pdf/2308.09126"
  },
  {
    benchmark: "DROP",
    release: "2019-04-16",
    solved: {
      date: null,
      source: {
        text: "GPT-4o achieved 83.4% F1 score, which is still below expert human performance of 96.4% F1. DROP requires discrete reasoning over paragraphs, including operations like counting, sorting, and arithmetic.",
        references: [{
          url: "https://openai.com/index/gpt-4o-mini-advancing-cost-efficient-intelligence/"
        },
        {
          url: "https://arxiv.org/pdf/1903.00161"
        }]
      }
    },
    url: "https://allennlp.org/drop",
    paperUrl: "https://arxiv.org/pdf/1903.00161"
  },
  {
    benchmark: "TruthfulQA",
    release: "2022-05-08",
    solved: {
      date: null,
      source: {
        text: "Human performance was 94% truthful, while the best AI models were only 58% truthful. TruthfulQA tests whether models avoid generating false answers that mimic human misconceptions across 38 categories including health, law, finance, and politics.",
        references: [{
          url: "https://arxiv.org/abs/2109.07958"
        }]
      }
    },
    url: "https://github.com/sylinrl/TruthfulQA",
    paperUrl: "https://arxiv.org/pdf/2109.07958"
  },
  {
    benchmark: "PIQA",
    release: "2019-11-26",
    solved: {
      date: null,
      source: {
        text: "Physical Interaction: Question Answering (PIQA) tests physical commonsense reasoning. Human performance is 95% accuracy, while large pretrained models struggle at around 77% accuracy<sup class='reference'>[1]</sup>",
        references: [{
          url: "https://arxiv.org/pdf/1911.11641"
        }]
      }
    },
    url: "http://yonatanbisk.com/piqa",
    paperUrl: "https://arxiv.org/pdf/1911.11641"
  },
  {
    benchmark: "BoolQ",
    release: "2019-05-24",
    solved: {
      date: null,
      source: {
        text: "Exploring the Surprising Difficulty of Natural Yes/No Questions (BoolQ) tests complex inferential reasoning. Human performance is 90% accuracy, while the best AI models at the time of release achieved only 80.4% accuracy<sup class='reference'>[1]</sup>",
        references: [{
          url: "https://arxiv.org/pdf/1905.10044"
        }]
      }
    },
    url: "https://github.com/google-research-datasets/boolean-questions",
    paperUrl: "https://arxiv.org/pdf/1905.10044"
  },
  {
    benchmark: "WinoGrande",
    release: "2019-11-21",
    solved: {
      date: null,
      source: {
        text: "An Adversarial Winograd Schema Challenge at Scale (WinoGrande) tests commonsense reasoning through pronoun resolution problems. Human performance is 94% accuracy, while the best AI models at the time of release achieved between 59.4-79.1% accuracy depending on training data size<sup class='reference'>[1]</sup>",
        references: [{
          url: "https://arxiv.org/pdf/1907.10641"
        }]
      }
    },
    url: "https://winogrande.allenai.org/",
    paperUrl: "https://arxiv.org/pdf/1907.10641"
  },
  {
    benchmark: "BELEBELE",
    release: "2024-07-25",
    solved: {
      date: null,
      source: {
        text: "A Parallel Reading Comprehension Dataset in 122 Language Variants (BELEBELE) tests multilingual reading comprehension through multiple-choice questions. Human performance is 97.6% accuracy, while the best AI models achieved only 60.2% accuracy across all languages<sup class='reference'>[1]</sup>",
        references: [{
          url: "https://arxiv.org/pdf/2308.16884"
        }]
      }
    },
    url: "https://github.com/facebookresearch/belebele",
    paperUrl: "https://arxiv.org/pdf/2308.16884"
  },
  {
    benchmark: "InfographicVQA",
    release: "2021-08-22",
    solved: {
      date: null,
      source: {
        text: "InfographicVQA tests visual question answering on infographic images that combine textual, graphical, and visual elements. Human performance is 95.7% accuracy, while the best AI models achieved only 19.74% accuracy<sup class='reference'>[1]</sup>",
        references: [{
          url: "https://arxiv.org/pdf/2104.12756"
        }]
      }
    },
    url: "https://www.docvqa.org/datasets/infographicvqa",
    paperUrl: "https://arxiv.org/pdf/2104.12756"
  }
]; 