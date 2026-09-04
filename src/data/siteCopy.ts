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
  {
    heading: "How the h-match date is chosen",
    body: "The date is the RELEASE DATE OF THE FIRST MODEL known to reach the human baseline, not the date somebody published a score. Those two differ, sometimes by years: a benchmark stops being fashionable to report on long before it stops being informative, so the first published pass can arrive well after the capability did. Dating to the model keeps the interval a measure of when AI got there, rather than of when the field last looked. It is still an upper bound - an older model may clear a benchmark nobody has run it on - so a date can move earlier as more models are tested, and never later.",
  },
  {
    heading: "What a human baseline has to be",
    body: "A published number, measured on humans, on the same metric and split that models are scored on. Not an estimated ceiling, not a pass mark, not inter-annotator agreement, and not a model's own score. That last one is not hypothetical: three benchmarks in the excluded list circulate a model's score as the human baseline, and one of them was on this page until it was checked.",
  },
];
