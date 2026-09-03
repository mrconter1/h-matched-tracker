export const SITE_TITLE = "h-matched Tracker";

export const SITE_TAGLINE =
  "Measuring the shrinking gap between AI benchmark release and human-level achievement";

export const SITE_URL = "https://h-matched.vercel.app";

export type AboutSection = {
  heading: string;
  body: string;
};

export const ABOUT_SECTIONS: AboutSection[] = [
  {
    heading: "What is this?",
    body: "A tracker measuring the duration between a benchmark's release and when it becomes h-matched (reached by AI at human-level performance). As this duration approaches zero, it suggests we're nearing a point where AI systems match human performance almost immediately.",
  },
  {
    heading: "Why track this?",
    body: "By monitoring how quickly benchmarks become h-matched, we can observe the accelerating pace of AI capabilities. If this time reaches zero, it would indicate a critical milestone where creating benchmarks that humans can outperform AI systems becomes virtually impossible.",
  },
  {
    heading: "What does this mean?",
    body: "The shrinking time-to-solve for new benchmarks suggests an acceleration in AI capabilities. This metric helps visualize how quickly AI systems are catching up to human-level performance across various tasks and domains.",
  },
];
