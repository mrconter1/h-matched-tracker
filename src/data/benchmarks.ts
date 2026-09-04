/**
 * Who the humans in the baseline were. "Human-level" means very different
 * things across benchmarks, so keep it explicit:
 *   crowd         - crowdworkers / annotators without domain expertise
 *   expert        - domain experts (PhDs, engineers, IMO medalists)
 *   collective    - union of what several people or teams solved, no single
 *                   human reached the number
 *   small-sample  - fewer than ~10 participants
 *   single        - one person
 *   unspecified   - the paper or note does not say
 */
export type BaselineType = 'crowd' | 'expert' | 'collective' | 'small-sample' | 'single' | 'unspecified';

export type HumanBaseline = {
  /** Same unit as the model score: percent unless `unit` says otherwise. */
  score: number;
  unit?: 'F1' | 'points';
  baselineType: BaselineType;
  /** Participants, when the source says. */
  n?: number;
};

export type BenchmarkSolved = {
  date: string | null;
  /** The system credited with the h-match, when the source names one. */
  model?: string;
  /** Its score, in the same unit as human.score. */
  score?: number;
  /** Anything that qualifies the score: shot count, tools, compute setting. */
  conditions?: string;
  /** True when the h-match is disputed or the bar was unusually lenient. */
  contested?: boolean;
  source?: {
    text: string;
    references: {
      url: string;
    }[];
  };
};

/**
 * solved:     AI has reached the human baseline.
 * open:       still below the human baseline and labs still report scores on it.
 * unreported: no lab has published a frontier-model score for roughly two
 *             years. Its true status is unknown - it is not evidence that the
 *             benchmark is hard, only that nobody has measured it lately.
 */
export type BenchmarkStatus = 'solved' | 'open' | 'unreported';

export type Benchmark = {
  benchmark: string;
  release: string;
  solved: BenchmarkSolved;
  url?: string;
  paperUrl?: string;
  human?: HumanBaseline;
  /** Only needed for 'unreported'; solved/open are derived from solved.date. */
  status?: BenchmarkStatus;
  /** ISO date of the newest published frontier-model score, when known. */
  lastReported?: string;
};

export const getStatus = (item: Benchmark): BenchmarkStatus => {
  if (item.solved.date !== null) return 'solved';
  return item.status ?? 'open';
};

export const BASELINE_LABELS: Record<BaselineType, string> = {
  crowd: 'crowd',
  expert: 'expert',
  collective: 'collective',
  'small-sample': 'small sample',
  single: 'single person',
  unspecified: 'unspecified',
};

/** Scores are percentages unless the baseline says F1 or points. */
export const formatScore = (score: number, unit?: HumanBaseline['unit']) => {
  if (unit === 'F1') return `${score} F1`;
  if (unit === 'points') return `${score} pts`;
  return `${score}%`;
};

/**
 * Years between a benchmark's release and the date it became h-matched.
 * Returns Infinity while a benchmark is still unsolved.
 */
export const calculateTimeToSolve = (releaseDate: string, solved: BenchmarkSolved): number => {
  if (solved.date === null) {
    return Infinity;
  }
  const release = new Date(releaseDate);
  const solvedDate = new Date(solved.date);
  const diffTime = solvedDate.getTime() - release.getTime();
  const diffYears = diffTime / (1000 * 60 * 60 * 24 * 365.25);
  return Number(diffYears.toFixed(2));
};

export const benchmarkData: Benchmark[] = [
  {
    benchmark: "ImageNet Challenge",
    release: "2009-01-01",
    human: { score: 95.0, baselineType: "single" },
    solved: {
      date: "2016-03-15",
      model: "ResNet ensemble (He et al.)",
      score: 96.4,
      conditions: "top-5 accuracy",
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
    human: { score: 92.0, baselineType: "unspecified" },
    solved: {
      date: "2019-11-01",
      model: "RoBERTa fine-tuned on WinoGrande",
      score: 90.1,
      contested: true,
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
    human: { score: 91.22, unit: "F1", baselineType: "crowd" },
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
    human: { score: 79.7, baselineType: "crowd" },
    solved: {
      date: "2022-08-08",
      model: "Atlas (Meta AI)",
      score: 84.7,
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
    status: "unreported",
    lastReported: "2024-12-27",
    release: "2017-04-17",
    human: { score: 94.5, baselineType: "expert" },
    solved: {
      date: null,
      source: {
        text: "RACE tests reading comprehension using questions from English exams for Chinese students. The ceiling performance reported in the paper is 94.5%.<sup class='reference'>[1]</sup> The most recent published scores are 74.2% on RACE-Middle and 56.8% on RACE-High (Llama 3.1 405B base, 5-shot), leaving the widest absolute gap on the tracker.<sup class='reference'>[2]</sup>",
        references: [

          { url: "https://arxiv.org/pdf/1704.04683" },

          { url: "https://arxiv.org/abs/2412.19437" }

        ]
      }
    },
    url: "http://www.cs.cmu.edu/~glai1/data/race/",
    paperUrl: "https://arxiv.org/pdf/1704.04683"
  },
  {
    benchmark: "SQuAD 2.0",
    release: "2018-06-11",
    human: { score: 89.45, unit: "F1", baselineType: "crowd" },
    solved: {
      date: "2019-03-15",
      score: 89.47,
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
    human: { score: 88.9, baselineType: "crowd" },
    solved: {
      date: "2022-07-23",
      model: "KEAR (Microsoft)",
      score: 89.4,
      source: {
        text: "Human performance on CommonsenseQA is about 88.9–89% accuracy, while Microsoft's KEAR system (Knowledgeable External Attention for commonsense Reasoning) achieved 89.4% accuracy, slightly surpassing human-level performance on this benchmark.<sup class='reference'>[1]</sup><sup class='reference'>[2]</sup>",
        references: [
          { url: "https://aclanthology.org/N19-1421.pdf" },
          { url: "https://www.microsoft.com/en-us/research/publication/human-parity-on-commonsenseqa-augmenting-self-attention-with-external-attention/" }
        ]
      }
    },
    url: "https://www.tau-nlp.sites.tau.ac.il/commonsenseqa",
    paperUrl: "https://aclanthology.org/N19-1421.pdf"
  },
  {
    benchmark: "GLUE",
    release: "2018-11-01",
    human: { score: 87.1, unit: "points", baselineType: "crowd" },
    solved: {
      date: "2019-07-01",
      model: "XLNet (Yang et al.)",
      score: 88.4,
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
    human: { score: 95.6, baselineType: "crowd" },
    solved: {
      date: "2024-03-04",
      model: "Claude 3 Opus",
      score: 95.4,
      conditions: "10-shot",
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
    benchmark: "ARC-AGI-1 (Verified)",
    release: "2019-11-05",
    human: { score: 85.0, baselineType: "crowd" },
    solved: {
      date: "2024-12-20",
      model: "o3 (OpenAI)",
      score: 87.5,
      conditions: "semi-private eval, high-compute configuration",
      contested: true,
      source: {
        text: "Human participants achieve around 64% accuracy on ARC-style evaluation tasks according to the H-ARC human study, and ARC Prize uses 85% as its human-level threshold.<sup class='reference'>[1]</sup> OpenAI's o3 scored 87.5% on the semi-private evaluation set in December 2024, but only in a high-compute configuration estimated at thousands of dollars per task; the low-compute run scored 75.7%. ARC Prize did not count the result as a solution, so this entry is contested.<sup class='reference'>[2]</sup>",
        references: [
          { url: "https://arxiv.org/abs/2409.01374" },
          { url: "https://arcprize.org/blog/oai-o3-pub-breakthrough" }
        ]
      }
    },
    url: "https://arcprize.org/arc",
    paperUrl: "https://arxiv.org/abs/1911.01547"
  },
  {
    benchmark: "SuperGLUE",
    release: "2020-02-13",
    human: { score: 89.8, unit: "points", baselineType: "crowd" },
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
    human: { score: 89.8, baselineType: "expert" },
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
    human: { score: 90.0, baselineType: "single", n: 1 },
    solved: {
      date: "2024-09-12",
      model: "o1 (OpenAI)",
      score: 94.8,
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
    benchmark: "FrontierMath (Tier 1–3)",
    release: "2024-11-07",
    human: { score: 35.0, baselineType: "collective" },
    solved: {
      date: "2025-12-11",
      model: "GPT-5.2 Thinking (OpenAI)",
      score: 40.3,
      conditions: "with tool use",
      contested: true,
      source: {
        text: "In a human baseline tournament at MIT, teams of strong undergraduate mathematicians and experts collectively solved about 35% of FrontierMath Tier 1–3 problems across all teams.<sup class='reference'>[1]</sup> OpenAI's GPT-5.2 Thinking model solved 40.3% of Tier 1–3 problems with tool use, surpassing this collective human solve rate on this subset of the benchmark.<sup class='reference'>[2]</sup>",
        references: [
          { url: "https://epoch.ai/frontiermath/about" },
          { url: "https://openai.com/index/introducing-gpt-5-2" }
        ]
      }
    },
    url: "https://epoch.ai/frontiermath",
    paperUrl: "https://pi.math.cornell.edu/~levine/frontiermath.pdf"
  },
  {
    benchmark: "GSM8K",
    release: "2021-11-18",
    human: { score: 60.0, baselineType: "unspecified" },
    solved: {
      date: "2023-03-14",
      model: "GPT-4",
      score: 87.1,
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
    human: { score: 88.4, baselineType: "crowd" },
    solved: {
      date: "2024-08-01",
      model: "Phi-3.5-vision-instruct (Microsoft)",
      score: 91.3,
      source: {
        text: "Human performance is about 88.40% accuracy on ScienceQA, while general-purpose large multimodal models now surpass this level; for example, Microsoft's Phi-3.5-vision-instruct achieves 91.3% accuracy on the ScienceQA leaderboard, indicating the benchmark is effectively solved by mainstream LMMs.<sup class='reference'>[1]</sup><sup class='reference'>[2]</sup><sup class='reference'>[3]</sup>",
        references: [
          { url: "https://lupantech.github.io/papers/neurips22_scienceqa.pdf" },
          { url: "https://aclanthology.org/2024.nlp4science-1.pdf" },
          { url: "https://llm-stats.com/benchmarks/scienceqa" }
        ]
      }
    },
    url: "https://scienceqa.github.io/",
    paperUrl: "https://lupantech.github.io/papers/neurips22_scienceqa.pdf"
  },
  {
    benchmark: "BIG-Bench-Hard",
    release: "2022-10-17",
    human: { score: 94.4, baselineType: "single" },
    solved: {
      date: "2024-06-21",
      model: "Claude 3.5 Sonnet",
      score: 93.1,
      conditions: "3-shot CoT",
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
    human: { score: 69.7, baselineType: "expert" },
    solved: {
      date: "2024-09-12",
      model: "o1 (OpenAI)",
      score: 78.3,
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
    human: { score: 92.96, baselineType: "expert" },
    solved: {
      date: null,
      source: {
        text: "BIRD-SQL evaluates text-to-SQL across 37 professional domains against large databases, scoring correctness and query efficiency. Human performance (data engineers and DB students) is 92.96% execution accuracy.<sup class='reference'>[1]</sup> The official leaderboard's best entry is 82.28% (SiriusAI-SQL, September 2026), from an agentic system rather than a single zero-shot call.<sup class='reference'>[2]</sup>",
        references: [

          { url: "https://arxiv.org/pdf/2305.03111" },

          { url: "https://bird-bench.github.io/" }

        ]
      }
    },
    url: "https://bird-bench.github.io/",
    paperUrl: "https://arxiv.org/pdf/2305.03111"
  },
  {
    benchmark: "METATOOL",
    release: "2023-10-05",
    human: { score: 96.0, baselineType: "unspecified" },
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
    human: { score: 88.6, baselineType: "expert" },
    solved: {
      date: null,
      source: {
        text: "MMMU tests expert-level multimodal understanding across 30 subjects in 6 disciplines. The 88.6% baseline is the BEST of three expert annotators, who spanned 76.2-88.6%; the median expert is well below the headline number. GPT-4o reached 69.1% at the time of writing, and the best current scores are around 86%, so the gap depends on which end of the expert range you compare against.",
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
    human: { score: 78.0, baselineType: "single", n: 1 },
    solved: {
      date: "2024-03-04",
      model: "Claude 3 Sonnet",
      score: 79.7,
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
    human: { score: 60.3, baselineType: "crowd" },
    solved: {
      date: "2024-05-13",
      model: "GPT-4o",
      score: 63.8,
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
    benchmark: "CharXiv-R",
    release: "2024-06-26",
    human: { score: 71.3, baselineType: "unspecified" },
    solved: {
      date: "2025-04-16",
      model: "o3 (OpenAI)",
      score: 78.6,
      source: {
        text: "Human evaluators achieve about 71.3% accuracy on the reasoning split of CharXiv, with overall human performance around 80.5% on the full benchmark.<sup class='reference'>[1]</sup> OpenAI's O3 model reached roughly 78.6% accuracy on CharXiv-R, the reasoning component of CharXiv, becoming the first model to clearly surpass human-level performance on this chart-reasoning benchmark.<sup class='reference'>[2]</sup>",
        references: [
          { url: "https://arxiv.org/abs/2406.18521" },
          { url: "https://openai.com/index/introducing-o3-and-o4-mini" }
        ]
      }
    },
    url: "https://princeton-nlp.github.io/CharXiv/",
    paperUrl: "https://arxiv.org/abs/2406.18521"
  },
  {
    benchmark: "LongBench v2",
    release: "2025-01-03",
    human: { score: 53.7, baselineType: "expert" },
    solved: {
      date: "2024-12-12",
      model: "o1-preview (OpenAI)",
      score: 57.7,
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
    benchmark: "BioLP-bench",
    release: "2024-08-31",
    human: { score: 38.4, baselineType: "expert" },
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
    human: { score: 76.0, baselineType: "crowd" },
    solved: {
      date: "2025-01-26",
      model: "Qwen2-VL-72B-Instruct",
      score: 77.9,
      source: {
        text: "Human evaluators achieve about 76% accuracy on EgoSchema, while recent general-purpose video-language models such as Qwen2-VL-72B-Instruct reach 77.9% accuracy on the EgoSchema leaderboard, slightly surpassing human performance on this long-form video understanding benchmark.<sup class='reference'>[1]</sup><sup class='reference'>[2]</sup>",
        references: [
          { url: "https://arxiv.org/abs/2308.09126" },
          { url: "https://llm-stats.com/benchmarks/egoschema" }
        ]
      }
    },
    url: "https://egoschema.github.io/",
    paperUrl: "https://arxiv.org/pdf/2308.09126"
  },
  {
    benchmark: "DROP",
    status: "unreported",
    lastReported: "2024-12-27",
    release: "2019-04-16",
    human: { score: 96.4, unit: "F1", baselineType: "expert" },
    solved: {
      date: null,
      source: {
        text: "DROP requires discrete reasoning over paragraphs: counting, sorting and arithmetic. Expert human performance is 96.4 F1.<sup class='reference'>[1]</sup> The most recent published score is 89.0 F1 (DeepSeek-V3 base, 3-shot), 7.4 points short; GPT-4o was reported at 83.4 F1.<sup class='reference'>[2]</sup>",
        references: [

          { url: "https://arxiv.org/pdf/1903.00161" },

          { url: "https://arxiv.org/abs/2412.19437" }

        ]
      }
    },
    url: "https://allennlp.org/drop",
    paperUrl: "https://arxiv.org/pdf/1903.00161"
  },
  {
    benchmark: "TruthfulQA",
    release: "2022-05-08",
    human: { score: 94.0, baselineType: "unspecified" },
    solved: {
      date: null,
      source: {
        text: "TruthfulQA tests whether models avoid false answers that mimic human misconceptions, across 38 categories. Humans were 94% truthful against 58% for the best model.<sup class='reference'>[1]</sup> Both figures come from HUMAN-GRADED free-text generation. Modern leaderboards report the automated MC1/MC2 multiple-choice metrics instead, which are a different measurement - so widely quoted claims that this benchmark is saturated do not settle whether the 94% generation baseline has been matched.",
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
    status: "unreported",
    lastReported: "2024-12-27",
    release: "2019-11-26",
    human: { score: 94.9, baselineType: "crowd" },
    solved: {
      date: null,
      source: {
        text: "Physical Interaction: Question Answering (PIQA) tests physical commonsense reasoning. Human performance is 94.9% accuracy; models scored around 77% at release.<sup class='reference'>[1]</sup> The most recent published score is 85.9% (Llama 3.1 405B base, zero-shot, as re-evaluated in the DeepSeek-V3 report), still 9 points short.<sup class='reference'>[2]</sup>",
        references: [

          { url: "https://arxiv.org/pdf/1911.11641" },

          { url: "https://arxiv.org/abs/2412.19437" }

        ]
      }
    },
    url: "http://yonatanbisk.com/piqa",
    paperUrl: "https://arxiv.org/pdf/1911.11641"
  },
  {
    benchmark: "BoolQ",
    status: "unreported",
    lastReported: "2025-03-25",
    release: "2019-05-24",
    human: { score: 90.0, baselineType: "unspecified" },
    solved: {
      date: null,
      source: {
        text: "BoolQ tests complex inferential reasoning through naturally occurring yes/no questions. Human performance is 90% accuracy; models scored 80.4% at release.<sup class='reference'>[1]</sup> The most recent published score is 82.4% (Gemma 3 27B, zero-shot, pretrained), still 7.6 points short.<sup class='reference'>[2]</sup> No frontier chat model has been reported on it.",
        references: [

          { url: "https://arxiv.org/pdf/1905.10044" },

          { url: "https://arxiv.org/abs/2503.19786" }

        ]
      }
    },
    url: "https://github.com/google-research-datasets/boolean-questions",
    paperUrl: "https://arxiv.org/pdf/1905.10044"
  },
  {
    benchmark: "WinoGrande",
    lastReported: "2026-09-04",
    release: "2019-11-21",
    human: { score: 94.0, baselineType: "crowd" },
    solved: {
      date: null,
      source: {
        text: "WinoGrande tests commonsense reasoning through adversarially filtered pronoun resolution. Human performance is 94% accuracy; models scored 59.4-79.1% at release, and the best published score since was 89.5% (Nemotron-4-340B base, 5-shot) - no frontier chat model had been evaluated on it in two years.<sup class='reference'>[1]</sup><sup class='reference'>[2]</sup> Measured for this tracker over the full 1,267-item validation set, zero-shot: Claude Opus 4.6 scores 91.08%, 95% CI [89.51, 92.65], and Claude Sonnet 5 scores 87.37%, 95% CI [85.54, 89.20]. Opus 4.6 is the best score on record and still 2.9 points short, with the baseline outside its interval, so the benchmark is measurably open rather than merely unmeasured. Every prompt, reply and per-item score is in the repository.<sup class='reference'>[3]</sup><sup class='reference'>[4]</sup>",
        references: [
          { url: "https://arxiv.org/pdf/1907.10641" },
          { url: "https://arxiv.org/abs/2406.11704" },
          { url: "https://github.com/mrconter1/h-matched-tracker/blob/main/eval/results/winogrande/anthropic__claude-opus-4.6_2026-09-04.json" },
          { url: "https://github.com/mrconter1/h-matched-tracker/blob/main/eval/results/winogrande/anthropic__claude-sonnet-5_2026-09-03.json" }
        ]
      }
    },
    url: "https://winogrande.allenai.org/",
    paperUrl: "https://arxiv.org/pdf/1907.10641"
  },
  {
    benchmark: "BELEBELE",
    release: "2024-07-25",
    human: { score: 97.6, baselineType: "unspecified" },
    solved: {
      date: null,
      source: {
        text: "BELEBELE tests multilingual reading comprehension across 122 language variants. The 97.6% human figure was measured on ENGLISH ONLY - four of the authors answering about 120 questions each - while the 60.2% model figure is an average across all 122 languages, so the two are not like-for-like.<sup class='reference'>[1]</sup> A fair comparison would need either a multilingual human baseline or an English-only model score.",
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
    human: { score: 95.7, baselineType: "unspecified" },
    solved: {
      date: null,
      source: {
        text: "InfographicVQA tests visual question answering on infographics that combine text, graphics and layout. Human performance is 95.7% ANLS, against 19.74% for the best models at the time of release.<sup class='reference'>[1]</sup> That 19.74% is a launch-era figure: current multimodal systems are reported in the 83-93% range, though no frontier lab publishes on this benchmark and the leaderboard is the only source.",
        references: [{
          url: "https://arxiv.org/pdf/2104.12756"
        }]
      }
    },
    url: "https://www.docvqa.org/datasets/infographicvqa",
    paperUrl: "https://arxiv.org/pdf/2104.12756"
  },
  {
    benchmark: "TextVQA",
    release: "2019-05-13",
    human: { score: 85.0, baselineType: "crowd" },
    solved: {
      date: "2024-09-01",
      model: "Qwen2-VL-72B-Instruct",
      score: 85.5,
      source: {
        text: "Human performance on TextVQA is about 85% accuracy, and recent general-purpose multimodal models such as Qwen2-VL-72B-Instruct reach 85.5% accuracy on the TextVQA leaderboard, roughly matching human-level performance on this text-centric visual question answering benchmark.<sup class='reference'>[1]</sup><sup class='reference'>[2]</sup>",
        references: [
          { url: "https://arxiv.org/abs/2012.05153" },
          { url: "https://llm-stats.com/benchmarks/textvqa" }
        ]
      }
    },
    url: "https://textvqa.org/",
    paperUrl: "https://arxiv.org/pdf/1904.08920"
  },
  {
    benchmark: "ReMI",
    release: "2024-06-13",
    human: { score: 95.8, baselineType: "unspecified" },
    solved: {
      date: null,
      source: {
        text: "Reasoning with Multiple Images (ReMI) tests multi-image reasoning across various domains including math, physics, logic, code, and spatial/temporal reasoning. Human performance is 95.8% accuracy, while the best AI models achieved only 50.5% accuracy<sup class='reference'>[1]</sup>",
        references: [{
          url: "https://arxiv.org/pdf/2406.09175"
        }]
      }
    },
    url: "https://huggingface.co/datasets/mehrankazemi/ReMI",
    paperUrl: "https://arxiv.org/pdf/2406.09175"
  },
  {
    benchmark: "BLINK",
    release: "2024-07-03",
    human: { score: 95.7, baselineType: "unspecified" },
    solved: {
      date: null,
      source: {
        text: "BLINK reformats 14 classic computer vision tasks as multiple-choice questions. Human performance is 95.70% accuracy; at release GPT-4V and Gemini managed 51.26% and 45.72%, barely above chance.<sup class='reference'>[1]</sup> Those are launch-era figures - the best reported score has since roughly reached 81%, still 15 points short.",
        references: [{
          url: "https://arxiv.org/pdf/2404.12390"
        }]
      }
    },
    url: "https://zeyofu.github.io/blink/",
    paperUrl: "https://arxiv.org/pdf/2404.12390"
  },
  {
    benchmark: "SpatialSense",
    status: "unreported",
    release: "2019-08-29",
    human: { score: 94.6, baselineType: "unspecified" },
    solved: {
      date: null,
      source: {
        text: "SpatialSense tests spatial relation recognition in images, requiring deep understanding of objects, their 3D configuration, and interactions. Human performance is 94.6% accuracy, while the best AI model (DRNet) achieved only 71.3% accuracy, highlighting significant room for improvement.<sup class='reference'>[1]</sup>",
        references: [{
          url: "https://arxiv.org/pdf/1908.02660"
        }]
      }
    },
    url: "https://github.com/princeton-vl/SpatialSense",
    paperUrl: "https://arxiv.org/pdf/1908.02660"
  },
  {
    benchmark: "SocialIQA",
    status: "unreported",
    lastReported: "2025-03-25",
    release: "2019-09-09",
    human: { score: 84.4, baselineType: "crowd" },
    solved: {
      date: null,
      source: {
        text: "SocialIQA tests commonsense reasoning about social interactions: motivations, emotional reactions and likely next actions. Human performance is 84.4% accuracy; BERT-large scored 64.5% at release.<sup class='reference'>[1]</sup> The most recent published score is 54.9% (Gemma 3 27B, zero-shot, pretrained) - a 29.5 point gap, the widest of the unreported set, and the thinnest evidence base.<sup class='reference'>[2]</sup>",
        references: [

          { url: "https://arxiv.org/pdf/1904.09728" },

          { url: "https://arxiv.org/abs/2503.19786" }

        ]
      }
    },
    url: "https://huggingface.co/datasets/allenai/social_i_qa",
    paperUrl: "https://arxiv.org/pdf/1904.09728"
  },
  {
    benchmark: "LAB-Bench (FigQA)",
    release: "2024-07-15",
    human: { score: 77.0, baselineType: "expert" },
    solved: {
      date: "2026-04-16",
      model: "Claude Opus 4.7",
      score: 79.3,
      conditions: "no tools (85.4% with Python tools)",
      source: {
        text: "LAB-Bench evaluates AI on biology research tasks; the FigQA subset tests scientific figure interpretation. Expert human baseline is 77.0%. Claude Opus 4.7 achieved 79.3% (no tools) and 85.4% (with Python tools), surpassing the human expert baseline.<sup class='reference'>[1]</sup><sup class='reference'>[2]</sup>",
        references: [
          { url: "https://arxiv.org/abs/2407.10362" },
          { url: "https://cdn.sanity.io/files/4zrzovbb/website/c886650a2e96fc0925c805a1a7ca77314ccbf4a6.pdf" }
        ]
      }
    },
    url: "https://futurehouse.org/lab-bench",
    paperUrl: "https://arxiv.org/abs/2407.10362"
  },
  {
    benchmark: "OSWorld",
    release: "2024-04-11",
    human: { score: 72.36, baselineType: "unspecified" },
    solved: {
      date: "2026-02-06",
      model: "Claude Opus 4.6",
      score: 72.7,
      source: {
        text: "OSWorld evaluates multimodal agents on 369 real-world computer tasks across Ubuntu, Windows, and macOS. Human performance is 72.36% success rate. Claude Opus 4.6 achieved 72.7% accuracy, surpassing human-level performance.<sup class='reference'>[1]</sup><sup class='reference'>[2]</sup>",
        references: [
          { url: "https://arxiv.org/abs/2404.07972" },
          { url: "https://anthropic.com/news/claude-opus-4-6" }
        ]
      }
    },
    url: "https://os-world.github.io/",
    paperUrl: "https://arxiv.org/abs/2404.07972"
  },
  {
    benchmark: "SimpleBench",
    release: "2024-10-31",
    human: { score: 83.7, baselineType: "small-sample", n: 9 },
    solved: {
      date: "2026-09-01",
      model: "Claude Fable 5.1",
      score: 86.6,
      conditions: "AVG@5",
      source: {
        text: "SimpleBench is a 200+ question multiple-choice text benchmark covering spatio-temporal reasoning, social intelligence and linguistic adversarial robustness (trick questions), answerable with unspecialized high school knowledge. The human baseline is 83.7% (nine participants). Claude Fable 5.1 scored 86.6% (AVG@5), the first model to exceed the human baseline; the previous best was Claude Fable at 81.9%.<sup class='reference'>[1]</sup><sup class='reference'>[2]</sup>",
        references: [
          { url: "https://simple-bench.com/" },
          { url: "https://drive.google.com/file/d/1mddNFK5UbBFVr3oDftd2Kyc6D8TFctfe/view" }
        ]
      }
    },
    url: "https://simple-bench.com/",
    paperUrl: "https://drive.google.com/file/d/1mddNFK5UbBFVr3oDftd2Kyc6D8TFctfe/view"
  },
  {
    benchmark: "CoQA",
    release: "2018-08-21",
    human: { score: 88.8, unit: "F1", baselineType: "crowd" },
    solved: {
      date: "2019-03-29",
      model: "Microsoft Research Asia ensemble",
      score: 89.4,
      conditions: "overall test-set F1",
      source: {
        text: "CoQA measures conversational question answering, where each question depends on the dialogue so far. Crowdworkers score 88.8 F1 overall on the test set (89.4 in-domain, 87.4 out-of-domain).<sup class='reference'>[1]</sup> Microsoft's ensemble reached 89.4 overall F1 in March 2019, seven months after release. The often-quoted 89.9 is its in-domain score, which is measured against a higher 89.4 human bar.<sup class='reference'>[2]</sup>",
        references: [
          { url: "https://arxiv.org/abs/1808.07042" },
          { url: "https://www.microsoft.com/en-us/research/blog/machine-reading-systems-are-becoming-more-conversational/" }
        ]
      }
    },
    url: "https://stanfordnlp.github.io/coqa/",
    paperUrl: "https://arxiv.org/abs/1808.07042"
  },
  {
    benchmark: "WebArena",
    release: "2023-07-25",
    human: { score: 78.24, baselineType: "small-sample", n: 5 },
    solved: {
      date: null,
      source: {
        text: "WebArena runs agents against self-hosted clones of real websites - shopping, forums, code hosting, a CMS - and scores end-to-end task success. Five computer science graduate students reached 78.24%.<sup class='reference'>[1]</sup> The best credibly published agent score is 38.1% (pass@5, February 2026), less than half the human rate.",
        references: [
          { url: "https://arxiv.org/abs/2307.13854" }
        ]
      }
    },
    url: "https://webarena.dev/",
    paperUrl: "https://arxiv.org/abs/2307.13854"
  },
  {
    benchmark: "GAIA",
    release: "2023-11-21",
    human: { score: 92.0, baselineType: "crowd" },
    solved: {
      date: null,
      source: {
        text: "GAIA asks general-assistant questions that need web browsing, tool use and multi-step reasoning, and are easy for people but hard to automate. Compensated annotators score 92% overall (94% level 1, 92% level 2, 87% level 3); GPT-4 with plugins managed 15% at release.<sup class='reference'>[1]</sup> The best verifiable public score is around 71%, though the leaderboard is self-reported and one unconfirmed 92% claim exists.",
        references: [
          { url: "https://arxiv.org/abs/2311.12983" }
        ]
      }
    },
    url: "https://huggingface.co/gaia-benchmark",
    paperUrl: "https://arxiv.org/abs/2311.12983"
  },
  {
    benchmark: "TempCompass",
    release: "2024-03-01",
    human: { score: 97.3, baselineType: "small-sample", n: 3 },
    solved: {
      date: null,
      source: {
        text: "TempCompass tests whether video models actually perceive time - speed, direction, event order - rather than answering from a single frame. Three annotators scored 97.3% over 200 sampled instructions judged three times each.<sup class='reference'>[1]</sup> The best reported model is around 74.8%.",
        references: [
          { url: "https://arxiv.org/abs/2403.00476" }
        ]
      }
    },
    url: "https://llyx97.github.io/tempcompass/",
    paperUrl: "https://arxiv.org/abs/2403.00476"
  },
  {
    benchmark: "VSI-Bench",
    release: "2024-12-18",
    human: { score: 79.0, baselineType: "small-sample" },
    solved: {
      date: null,
      source: {
        text: "VSI-Bench tests visual-spatial reasoning from video: distances, sizes, routes and object counts in a filmed space. Human evaluators average 79% on a 400-question subset, with unlimited time and free rewatching, outperforming the best model by 33 points.<sup class='reference'>[1]</sup> The best score found since is 56.8%.",
        references: [
          { url: "https://arxiv.org/abs/2412.14171" }
        ]
      }
    },
    url: "https://vision-x-nyu.github.io/thinking-in-space.github.io/",
    paperUrl: "https://arxiv.org/abs/2412.14171"
  },
  {
    benchmark: "ZeroBench",
    release: "2025-02-13",
    human: { score: 29.5, baselineType: "small-sample", n: 15 },
    solved: {
      date: null,
      source: {
        text: "ZeroBench was built so that every frontier model scores zero: at release all of them got 0% pass@1. Fifteen undergraduate and postgraduate evaluators averaged 29.5%, but with a 27.1 point standard deviation, so the baseline is unusually noisy and 'reaching human level' here is a fuzzy target.<sup class='reference'>[1]</sup> The best score since is about 19% pass@5.",
        references: [
          { url: "https://arxiv.org/abs/2502.09696" }
        ]
      }
    },
    url: "https://huggingface.co/datasets/jonathan-roberts1/zerobench",
    paperUrl: "https://arxiv.org/abs/2502.09696"
  },
  {
    benchmark: "PaperBench",
    release: "2025-04-02",
    human: { score: 41.4, baselineType: "expert", n: 8 },
    solved: {
      date: null,
      source: {
        text: "PaperBench asks an agent to replicate an ICML paper from scratch, judged against a rubric written by the paper's own authors. Eight current or former ML PhD students scored 41.4% best-of-3 after 48 tracked hours on a three-paper subset, against 26.6% for o1 on the same subset.<sup class='reference'>[1]</sup> The best model in the paper reaches 21.0% over the full 20 papers.",
        references: [
          { url: "https://arxiv.org/abs/2504.01848" }
        ]
      }
    },
    url: "https://openai.com/index/paperbench/",
    paperUrl: "https://arxiv.org/abs/2504.01848"
  },
  {
    benchmark: "GTSRB",
    release: "2011-01-19",
    human: { score: 98.84, baselineType: "crowd" },
    solved: {
      date: "2011-08-01",
      model: "IDSIA committee of CNNs",
      score: 99.46,
      conditions: "final IJCNN competition round, multi-column DNN committee",
      source: {
        text: "The German Traffic Sign Recognition Benchmark's final round pitted algorithms against a human reader baseline of 98.84% on the same held-out test images.<sup class='reference'>[1]</sup> IDSIA's committee of CNNs scored 99.46% at the IJCNN 2011 final round (31 Jul - 5 Aug 2011), one of the earliest results described as superhuman on a computer-vision benchmark; both the human and machine numbers were formally written up the following year.<sup class='reference'>[2]</sup>",
        references: [
          { url: "https://www.sciencedirect.com/science/article/pii/S0893608012000457" },
          { url: "https://www.sciencedirect.com/science/article/pii/S0893608012000524" }
        ]
      }
    },
    url: "https://benchmark.ini.rub.de/gtsrb_news.html",
    paperUrl: "https://www.sciencedirect.com/science/article/pii/S0893608012000524"
  },
  {
    benchmark: "Arcade Learning Environment",
    release: "2013-06-21",
    human: { score: 100.0, baselineType: "single" },
    solved: {
      date: "2015-09-22",
      model: "Double DQN",
      score: 114.7,
      conditions: "median human-normalized score, 49 games, 5-minute episodes",
      source: {
        text: "ALE scores Atari agents against a professional games tester, normalised per game so 0% is random play and 100% is the human expert; the usual summary is the median across the 49 games.<sup class='reference'>[1]</sup> DQN's 2015 Nature paper is widely remembered as reaching human level, but its median human-normalized score was 93.5%, below the bar - the successor paper's own Table 1 reports it. Double DQN was the first agent past it at 114.7%.<sup class='reference'>[2]</sup> Under the stricter human-starts regime the same table puts DQN at 47.5% and Double DQN at 88.4%, so on that measure the benchmark was not h-matched until later still.",
        references: [
          { url: "https://arxiv.org/abs/1207.4708" },
          { url: "https://arxiv.org/abs/1509.06461" }
        ]
      }
    },
    url: "https://github.com/Farama-Foundation/Arcade-Learning-Environment",
    paperUrl: "https://arxiv.org/abs/1207.4708"
  },
  {
    benchmark: "HotpotQA",
    release: "2018-09-25",
    human: { score: 82.55, unit: "F1", baselineType: "crowd" },
    solved: {
      date: null,
      source: {
        text: "HotpotQA requires combining facts from two Wikipedia articles and supporting the answer with the sentences used. Crowdworkers reach 82.55 joint F1 on a 1,000-question sample, where the joint metric scores the answer and the supporting evidence together.<sup class='reference'>[1]</sup> The best published systems remain around 77.5 joint F1. Answer-only F1 is far easier and is often quoted instead, which makes the benchmark look closer to solved than it is.",
        references: [
          { url: "https://arxiv.org/abs/1809.09600" }
        ]
      }
    },
    url: "https://hotpotqa.github.io/",
    paperUrl: "https://arxiv.org/abs/1809.09600"
  },
  {
    benchmark: "ALFRED",
    release: "2019-12-03",
    human: { score: 91.0, baselineType: "small-sample", n: 5 },
    solved: {
      date: null,
      source: {
        text: "ALFRED asks an embodied agent to carry out household instructions in a simulated home, from a natural-language command and egocentric vision. Five participants completed 100 unseen tasks at a 91% success rate, 86% path-weighted.<sup class='reference'>[1]</sup> A 2024 paper reports 98-100% but on a smaller non-standard evaluation, so it does not settle the official metric.",
        references: [
          { url: "https://arxiv.org/abs/1912.01734" }
        ]
      }
    },
    url: "https://askforalfred.com/",
    paperUrl: "https://arxiv.org/abs/1912.01734"
  },
  {
    benchmark: "Habitat ObjectNav",
    release: "2020-06-23",
    human: { score: 88.9, baselineType: "unspecified" },
    solved: {
      date: null,
      source: {
        text: "ObjectNav drops an agent into an unseen indoor scene and names an object to find. Humans succeed 88.9% of the time on the Matterport3D validation split within a 500-step budget.<sup class='reference'>[1]</sup> The best systems on the same split stay under 70%, and the gap has closed slowly compared with the vision benchmarks of the same era.",
        references: [
          { url: "https://arxiv.org/abs/2006.13171" }
        ]
      }
    },
    url: "https://aihabitat.org/",
    paperUrl: "https://arxiv.org/abs/2006.13171"
  },
  {
    benchmark: "NExT-QA",
    release: "2021-05-18",
    human: { score: 88.38, baselineType: "crowd" },
    solved: {
      date: null,
      source: {
        text: "NExT-QA asks causal and temporal questions about everyday video: why something happened, what happened before or after. Human accuracy is 88.38% overall - 87.61% causal, 88.56% temporal, 90.40% descriptive.<sup class='reference'>[1]</sup> The best documented system reaches about 72.5%, and the causal split is where models lose most ground.",
        references: [
          { url: "https://arxiv.org/abs/2105.08276" }
        ]
      }
    },
    url: "https://doc-doc.github.io/docs/nextqa.html",
    paperUrl: "https://arxiv.org/abs/2105.08276"
  },
  {
    benchmark: "Perception Test",
    release: "2023-05-23",
    human: { score: 91.4, baselineType: "unspecified" },
    solved: {
      date: null,
      source: {
        text: "The Perception Test uses purpose-filmed video to probe memory, physics, abstraction and semantics rather than object recognition. Human accuracy is 91.4% against 46.2% for the best model at publication.<sup class='reference'>[1]</sup> The best score since is roughly 73%. A 99.64% human figure circulates from a later challenge report measured on a different subset; it is not comparable and is not used here.",
        references: [
          { url: "https://arxiv.org/abs/2305.13786" }
        ]
      }
    },
    url: "https://github.com/google-deepmind/perception_test",
    paperUrl: "https://arxiv.org/abs/2305.13786"
  },
  {
    benchmark: "MMVP",
    release: "2024-01-11",
    human: { score: 95.7, baselineType: "small-sample", n: 4 },
    solved: {
      date: null,
      source: {
        text: "MMVP collects image pairs that CLIP embeds almost identically but which differ in a way people see immediately, then asks a question that turns on the difference. Four volunteers scored 95.7% on 300 questions; GPT-4V managed 38.7%, below chance on a two-choice task.<sup class='reference'>[1]</sup> The baseline rests on four people, so treat the exact number loosely; the size of the gap is the finding.",
        references: [
          { url: "https://arxiv.org/abs/2401.06209" }
        ]
      }
    },
    url: "https://tsb0601.github.io/mmvp_blog/",
    paperUrl: "https://arxiv.org/abs/2401.06209"
  },
  {
    benchmark: "MathVerse",
    release: "2024-03-21",
    human: { score: 64.9, baselineType: "small-sample", n: 10 },
    solved: {
      date: null,
      source: {
        text: "MathVerse rewrites each maths problem into six versions that shift information between the diagram and the text, to test whether a model reads the diagram at all. Ten college students averaged 64.9%, against 54.4% for GPT-4V.<sup class='reference'>[1]</sup> The baseline is a small sample and the human number is itself low, which makes this one of the closer open gaps on the tracker.",
        references: [
          { url: "https://arxiv.org/abs/2403.14624" }
        ]
      }
    },
    url: "https://mathverse-cuhk.github.io/",
    paperUrl: "https://arxiv.org/abs/2403.14624"
  }
];
