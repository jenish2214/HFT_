/** Institutional brand copy — BSJ Infotech / Orion Alpha */

import { COMPANY_NAME, PRODUCT_NAME, SUPPORT_EMAIL } from "@/lib/orionAlpha";

export const COMPANY_DISPLAY = "BSJ Infotech";
export const COMPANY_LEGAL = COMPANY_NAME;

export const INSTITUTION_TAGLINE =
  "Research every investor before investment — find true value, not speculation. Build returns wisely.";

export const COMPANY_ABOUT = {
  headline: "Research and algorithms for diversified asset growth",
  story: `${COMPANY_DISPLAY} operates ${PRODUCT_NAME} as a local research model — not a product we ship as a terminal. Our team combines quantitative research, algorithm-driven analysis, and multi-asset diversification to help investors manage portfolios and pursue growth aligned with their expectations.`,
  mission:
    "Help every investor grow assets wisely — through research, diversification, and disciplined risk management, not speculation.",
  email: SUPPORT_EMAIL,
};

export const PLATFORM_STATS = [
  { value: "6", label: "Asset classes", detail: "Equity · Crypto · Commodity · FX · Index · Rates" },
  { value: "30+", label: "Instruments", detail: "Curated universe across major markets" },
  { value: "Risk", label: "Analytics engine", detail: "Sharpe, drawdown, Monte Carlo & heatmaps" },
  { value: "Live", label: "Terminal desk", detail: "Quotes, depth, charts & fundamentals" },
] as const;

export const ASSET_SERVICES = [
  {
    title: "Equity research",
    desc: "Factor scores, CAPM alpha/beta, company profiles, and peer comparison baskets.",
    tag: "EQ",
  },
  {
    title: "Multi-asset analytics",
    desc: "Crypto, commodities, FX, indices, and rates in one monitor with class filters.",
    tag: "MA",
  },
  {
    title: "Portfolio diagnostics",
    desc: "Sharpe, Sortino, max drawdown, VaR, win rate, and monthly return heatmaps.",
    tag: "RISK",
  },
  {
    title: "Execution context",
    desc: "Live terminal with order book, time & sales, and chart workspace for review.",
    tag: "DESK",
  },
] as const;

export const MARKET_ANALYSIS_STRATEGIES = [
  {
    code: "VAL",
    title: "Fundamental value",
    desc: "Study business quality, valuation, profitability, balance-sheet strength, and peer positioning before capital is committed.",
  },
  {
    code: "MOM",
    title: "Momentum",
    desc: "Measure trend persistence, relative strength, moving-average structure, and price acceleration across time horizons.",
  },
  {
    code: "REV",
    title: "Mean reversion",
    desc: "Identify statistically stretched moves and test whether price is likely to return toward its historical range.",
  },
  {
    code: "FAC",
    title: "Multi-factor scoring",
    desc: "Combine value, quality, momentum, volatility, and market sensitivity into a transparent comparative score.",
  },
  {
    code: "CAPM",
    title: "Alpha & beta",
    desc: "Separate benchmark exposure from excess return and understand how strongly an asset responds to the market.",
  },
  {
    code: "RISK",
    title: "Risk scenarios",
    desc: "Frame drawdown, value-at-risk, stress cases, and Monte Carlo outcomes before defining position size.",
  },
  {
    code: "MACRO",
    title: "Macro regime",
    desc: "Review rates, currencies, commodities, and indices together to understand the environment surrounding a trade.",
  },
  {
    code: "REL",
    title: "Relative value",
    desc: "Compare securities, sectors, and asset classes to find stronger opportunities instead of evaluating prices in isolation.",
  },
] as const;

export const INVESTMENT_PHILOSOPHY = [
  {
    title: "Research before investment",
    text: "Every decision starts with data — fundamentals, factors, and risk metrics — not hype or speculation.",
  },
  {
    title: "True value focus",
    text: "CAPM alpha, Sharpe ratios, and drawdown analysis help separate genuine opportunity from noise.",
  },
  {
    title: "Returns built wisely",
    text: "Scenario analysis, VaR, and performance reporting frame outcomes before capital is deployed.",
  },
] as const;

export const COMPANY_VALUES = [
  { title: "Research first", text: "Every allocation starts with fundamentals, factors, and risk — before capital moves." },
  { title: "Diversification", text: "Spread exposure across equities, crypto, commodities, FX, indices, and rates — not one concentrated bet." },
  { title: "Investor alignment", text: "Growth strategies framed against each investor's goals, horizon, and risk tolerance." },
] as const;

export const ABOUT_METRICS = [
  { label: "Research modules", value: "12+", hint: "Factors · CAPM · Patterns · Risk" },
  { label: "Asset classes", value: "6", hint: "Equity · Crypto · Commodity · FX · Index · Rates" },
  { label: "Analysis strategies", value: "8+", hint: "Value · Momentum · Factors · Macro" },
  { label: "Support", value: "Direct", hint: SUPPORT_EMAIL },
] as const;

export const DOCS_HIGHLIGHTS = [
  {
    title: "Risk & performance",
    desc: "Sharpe, Sortino, Calmar, drawdown, VaR, and Monte Carlo — how each metric is used on the research desk.",
    sectionId: "risk",
  },
  {
    title: "Factor research",
    desc: "Momentum, reversal, trend, RSI, and composite alpha — the language of the factor table.",
    sectionId: "capm",
  },
  {
    title: "CAPM & benchmarks",
    desc: "Alpha, beta, and benchmark-relative context for single names vs indices like SPY.",
    sectionId: "capm",
  },
] as const;

export const TEAM_OVERVIEW = {
  headline: "A research team built for diversification and growth",
  intro: `${COMPANY_DISPLAY} brings together quantitative researchers, algorithm specialists, and portfolio analysts. We work on a local research model — studying markets, building factor and risk frameworks, and helping investors allocate across a diversified universe rather than chasing single-name speculation.`,
  scale: "Our team holds depth across multi-asset research, algorithm design, risk reporting, and investor consultation — ready to discuss how your portfolio can grow in line with your expectations.",
} as const;

export const TEAM_EXPERTISE = [
  {
    area: "Quantitative research",
    detail: "Factor models, CAPM alpha/beta, momentum and reversal studies, and scenario analysis for single names and diversified baskets.",
  },
  {
    area: "Algorithm-driven analysis",
    detail: "Systematic scoring, multi-factor composites, and rule-based frameworks that support consistent, research-led decisions.",
  },
  {
    area: "Multi-asset diversification",
    detail: "Allocation views across equities, crypto, commodities, FX, indices, and rates — reducing concentration risk through broader exposure.",
  },
  {
    area: "Risk & investor growth",
    detail: "Sharpe, drawdown, VaR, and Monte Carlo reporting to align portfolio outcomes with each investor's growth goals and risk comfort.",
  },
] as const;

export const INVESTOR_GROWTH_APPROACH = {
  headline: "Growing assets in line with investor expectations",
  intro: "We believe growth should be intentional — matched to what each investor expects from their capital, not promised as speculation.",
  points: [
    "Define growth targets and risk limits before allocating capital.",
    "Use research and algorithms to identify true value across a diversified universe.",
    "Monitor performance, drawdown, and factor exposure against expectations over time.",
    "Adjust allocation when markets, regimes, or investor goals change.",
  ],
} as const;

export const DIVERSIFICATION_FOCUS = [
  {
    title: "Cross-asset spread",
    text: "Equities, crypto, commodities, FX, indices, and rates — so portfolios are not dependent on a single market or sector.",
  },
  {
    title: "Factor balance",
    text: "Blend value, momentum, quality, and risk signals instead of relying on one style that may fail in certain regimes.",
  },
  {
    title: "Risk-aware sizing",
    text: "Position and portfolio limits informed by drawdown, VaR, and scenario analysis before capital is committed.",
  },
  {
    title: "Expectation tracking",
    text: "Regular performance review against the investor's stated return and risk expectations — not generic benchmarks alone.",
  },
] as const;

export const TEAM_SERVICES = [
  "Diversified multi-asset research across your symbol universe",
  "Algorithm and factor analysis for portfolio decisions",
  "Risk-adjusted growth planning aligned with investor goals",
  "Performance and drawdown reporting against expectations",
  "Consultation on allocation, diversification, and rebalancing",
  "Direct support from the BSJ Infotech research team",
] as const;

export const CONTACT_TOPICS = [
  {
    title: "Investor growth goals",
    text: "Discuss return expectations, time horizon, and how research can support your asset growth plan.",
  },
  {
    title: "Portfolio diversification",
    text: "Ask how to spread exposure across asset classes, factors, and regions to reduce concentration risk.",
  },
  {
    title: "Research & algorithms",
    text: "Learn about our factor models, systematic analysis, and how we apply them to real portfolios.",
  },
  {
    title: "Risk & expectations",
    text: "Review drawdown limits, VaR, scenario analysis, and whether outcomes match your comfort level.",
  },
  {
    title: "Demo consultation",
    text: "Walk through the Orion Alpha research environment and see how our local model works in practice.",
  },
  {
    title: "General inquiry",
    text: "Any question about capabilities, partnership, or support — we respond directly.",
  },
] as const;
