/** Educational glossary — definitions used across Orion Alpha lab pages. */

export interface DocTerm {
  id: string;
  term: string;
  short?: string;
  body: string;
}

export interface DocSection {
  id: string;
  title: string;
  intro?: string;
  terms: DocTerm[];
}

export const MARKET_DOC_SECTIONS: DocSection[] = [
  {
    id: "basics",
    title: "Market basics",
    intro: "Core ideas for reading prices, symbols, and sessions in the lab.",
    terms: [
      {
        id: "symbol",
        term: "Symbol / Ticker",
        body: "A short code for a tradable instrument (e.g. AAPL for Apple stock, BTC-USD for Bitcoin vs US dollar). Orion Alpha validates symbols before any API call.",
      },
      {
        id: "bid-ask",
        term: "Bid & Ask",
        body: "Bid is the highest price buyers offer; ask is the lowest price sellers accept. The gap between them is the spread. Tighter spreads usually mean more liquidity.",
      },
      {
        id: "volume",
        term: "Volume",
        body: "Number of shares or contracts traded in a period. Rising volume with price moves often gets studied in technical exercises — context only, not a signal to trade.",
      },
      {
        id: "asset-class",
        term: "Asset class",
        body: "Category of instrument: equity (stocks), crypto, commodity, FX (foreign exchange), index, or rates. Each class has different hours, volatility, and data sources.",
      },
      {
        id: "benchmark",
        term: "Benchmark",
        body: "A reference index used to compare performance — e.g. SPY (S&P 500 ETF). CAPM and relative-strength exercises on the research lab use a benchmark like SPY.",
      },
    ],
  },
  {
    id: "technical",
    title: "Technical indicators",
    intro: "Chart tools used in pattern study scores and momentum lab exercises.",
    terms: [
      {
        id: "sma",
        term: "SMA (Simple Moving Average)",
        short: "SMA20 / SMA50",
        body: "Average closing price over N days. SMA20 tracks short-term trend; SMA50 medium-term. The momentum study lab uses pullbacks toward SMA20 or SMA50 as educational entry levels — textbook examples, not buy orders.",
      },
      {
        id: "rsi",
        term: "RSI (Relative Strength Index)",
        short: "RSI 14",
        body: "Oscillator from 0–100 measuring recent up vs down moves. Above 70 often labeled overbought; below 30 oversold. Used in mean-reversion study scores on the research page.",
      },
      {
        id: "macd",
        term: "MACD",
        body: "Moving Average Convergence Divergence — difference between two EMAs plus a signal line. Positive histogram suggests upward momentum in demo pattern exercises.",
      },
      {
        id: "bollinger",
        term: "Bollinger Bands",
        body: "Middle band = SMA; upper/lower bands = middle ± 2 standard deviations. Price touching outer bands is studied in mean-reversion classroom scenarios.",
      },
      {
        id: "momentum-63",
        term: "63-day momentum",
        body: "Percentage price change over roughly one quarter (~63 trading days). Positive momentum with price above SMAs maps to a strong momentum regime in the education lab.",
      },
    ],
  },
  {
    id: "risk",
    title: "Risk metrics",
    intro: "How the lab measures volatility and drawdowns — for learning portfolio math.",
    terms: [
      {
        id: "volatility",
        term: "Annualized volatility",
        short: "Ann vol %",
        body: "Standard deviation of daily returns scaled to a year. Higher vol = wider typical price swings. Shown per symbol in the research desk KPI row.",
      },
      {
        id: "sharpe",
        term: "Sharpe ratio",
        body: "Excess return per unit of total risk (return ÷ volatility, vs a risk-free rate). Above 1 is often considered strong in textbooks; the lab uses it to compare symbols in tables.",
      },
      {
        id: "sortino",
        term: "Sortino ratio",
        body: "Like Sharpe but penalizes only downside volatility. Useful when studying asymmetric return profiles.",
      },
      {
        id: "max-dd",
        term: "Maximum drawdown",
        short: "Max DD %",
        body: "Largest peak-to-trough decline in the sample period. Teaches how bad a buy-and-hold path could have felt historically.",
      },
      {
        id: "var",
        term: "Value at Risk (VaR 95%)",
        body: "Demo stat: approximate worst daily loss not exceeded 95% of the time in the historical window. A simplified risk classroom metric, not a regulatory VaR model.",
      },
    ],
  },
  {
    id: "capm",
    title: "CAPM & factors",
    intro: "Regression-style ideas for separating market exposure from idiosyncratic return.",
    terms: [
      {
        id: "capm",
        term: "CAPM (Capital Asset Pricing Model)",
        body: "Links an asset’s expected return to market beta. The lab runs a regression of symbol returns vs a benchmark (e.g. SPY) to estimate alpha and beta.",
      },
      {
        id: "beta",
        term: "Beta (β)",
        body: "Sensitivity to benchmark moves. β ≈ 1 moves with the market; β > 1 amplifies; β < 1 dampens. Educational context for hedging discussions.",
      },
      {
        id: "alpha",
        term: "Alpha (α)",
        short: "Alpha ann %",
        body: "Annualized excess return vs CAPM expectation after adjusting for beta. Positive alpha in the lab means the symbol beat the benchmark on a risk-adjusted basis in the sample — historical only.",
      },
      {
        id: "factor-engine",
        term: "Factor engine",
        body: "Python module scoring momentum, reversal, low-volatility, and trend factors, then z-scoring across the universe to build composite alpha. Shown in the factor table on /research.",
      },
      {
        id: "composite-alpha",
        term: "Composite alpha score",
        body: "Average of standardized factor z-scores for each symbol. Used to rank the demo universe — higher = stronger factor stack in the historical window.",
      },
      {
        id: "factor-ic",
        term: "Factor IC (Information Coefficient)",
        body: "Spearman correlation between a factor and forward returns. Measures how predictive a factor was in-sample — a quant research learning metric.",
      },
    ],
  },
  {
    id: "monte-carlo",
    title: "Monte Carlo simulation",
    intro: "Random-path exercises for thinking about uncertainty — not forecasts.",
    terms: [
      {
        id: "monte-carlo",
        term: "Monte Carlo simulation",
        body: "Runs many random price paths using assumed drift (μ) and volatility (σ). Orion Alpha uses Geometric Brownian Motion (GBM) with ~1,500 paths for a 1-year horizon in the quant lab.",
      },
      {
        id: "gbm",
        term: "Geometric Brownian Motion (GBM)",
        body: "A simple model where log-returns are random with constant mean and variance. Common in finance courses; real markets have jumps, regime changes, and fat tails GBM ignores.",
      },
      {
        id: "p05-p50-p95",
        term: "P05 · P50 · P95 bands",
        body: "Percentiles across simulated paths: P05 = pessimistic path, P50 = median, P95 = optimistic. The education lab displays these as a learning band — not price targets.",
      },
      {
        id: "mc-fan",
        term: "Monte Carlo fan chart",
        body: "Time series of P05/P50/P95 percentiles over ~63 days. Visualizes how uncertainty cones widen over time in the simulation exercise.",
      },
      {
        id: "scenario-scorecard",
        term: "Demo scenario scorecard",
        body: "Higher / Range / Lower percentages blend pattern scores, factor tilt, and MC median vs current price. Explicitly labeled as classroom exercise — not a prediction of where price will go.",
      },
    ],
  },
  {
    id: "patterns",
    title: "Pattern study scores",
    intro: "Rule-based technical exercises shown as percentages on the research lab.",
    terms: [
      {
        id: "trend-continuation",
        term: "Trend continuation score",
        body: "Higher when price sits above SMA20 and SMA50 with rising short-term volatility. Teaches how trend-following setups are defined in rule-based systems.",
      },
      {
        id: "mean-reversion",
        term: "Mean reversion score",
        body: "Higher when RSI is stretched (>70 or <30) or price touches Bollinger bands. Used to study counter-trend ideas in the lab.",
      },
      {
        id: "breakout",
        term: "Breakout confirmation score",
        body: "Combines MACD histogram and price vs Bollinger midline. Demonstrates how quants encode breakout logic as numeric scores.",
      },
      {
        id: "relative-strength",
        term: "Sector relative strength score",
        body: "Compares 21-day return of the primary symbol vs peer basket in the research universe. Outperformance increases the demo score.",
      },
      {
        id: "momentum-buy-lab",
        term: "Momentum study buy level",
        body: "Educational price level from SMA rules: strong momentum → study SMA20 pullback; moderate → SMA50; weak → repair zone below trend. Not a live order recommendation.",
      },
    ],
  },
  {
    id: "platform",
    title: "Platform & stack",
    intro: "How Orion Alpha is built — for learners exploring systems design.",
    terms: [
      {
        id: "cpp-engine",
        term: "C++ matching engine",
        body: "Demo HFT-style order book on port 9001. Matches limit/market orders with price-time priority and reports latency stats. Powers the terminal depth view in local dev.",
      },
      {
        id: "python-api",
        term: "Python FastAPI backend",
        body: "Serves quotes, charts, company reports, and /research/quant. Browser calls go through Next.js /api proxy for security (CSP connect-src 'self').",
      },
      {
        id: "api-proxy",
        term: "/api proxy",
        body: "Same-origin route that forwards allowed paths to the backend. Prevents browsers from calling localhost:8000 directly and keeps CSP strict.",
      },
      {
        id: "yfinance",
        term: "Market data sources",
        body: "Historical prices and fundamentals often come from yfinance / yahooquery in dev. Deployed environments may see delays or partial data — run ./scripts/run.sh locally for full lab exercises.",
      },
      {
        id: "education-only",
        term: "Education-only disclaimer",
        body: "All lab output is for learning: definitions, demos, and simulations. Not investment advice, solicitation, or guaranteed performance.",
      },
    ],
  },
];

export function allDocTerms(): DocTerm[] {
  return MARKET_DOC_SECTIONS.flatMap((s) => s.terms);
}
