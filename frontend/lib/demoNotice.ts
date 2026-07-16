/** Demo context for About page */

export const DEMO_NOTICE = {
  badge: "Research demo",
  title: "This is a working research environment",
  paragraphs: [
    "Orion Alpha demonstrates our local research model — quantitative analysis, factor studies, and risk reporting across a diversified market universe.",
    "BSJ Infotech does not sell or deliver a terminal product. We use this environment to research markets, test algorithms, and support investors who want to grow assets in line with their expectations.",
    "Contact our team to discuss diversification, growth goals, or how our research approach applies to your portfolio.",
  ],
  points: [
    { label: "Model", value: "Local research & algorithms" },
    { label: "Focus", value: "Diversification & growth" },
    { label: "Universe", value: "6 asset classes" },
    { label: "Contact", value: "Investor goals & support" },
  ],
} as const;
