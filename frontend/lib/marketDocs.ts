/** Educational glossary — definitions + real-world usage on Orion Alpha. */

export interface DocTerm {
  id: string;
  term: string;
  short?: string;
  body: string;
  realWorld: string;
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
    intro: "Core terms traders, analysts, and portfolio managers use every day on a desk.",
    terms: [
      {
        id: "symbol",
        term: "Symbol / Ticker",
        body: "A short code for a tradable instrument (e.g. AAPL for Apple, BTC-USD for Bitcoin vs USD).",
        realWorld: "Brokers, Bloomberg, and trading apps all use tickers. You type AAPL on the terminal, enter BTC-USD on crypto desks, and SPY when comparing to the S&P 500.",
      },
      {
        id: "bid-ask",
        term: "Bid & Ask",
        body: "Bid = highest price buyers offer. Ask = lowest price sellers accept. The spread is the gap between them.",
        realWorld: "Market makers quote bid/ask on exchanges. Tight spread on AAPL means easy to trade; wide spread on a small stock means higher execution cost — desk traders watch this before placing size.",
      },
      {
        id: "volume",
        term: "Volume",
        body: "Number of shares or contracts traded in a period.",
        realWorld: "Fund managers check volume to see if a stock can absorb their order. A breakout on 3× average volume gets more attention than one on thin volume — it suggests real participation.",
      },
      {
        id: "asset-class",
        term: "Asset class",
        body: "Category: equity, crypto, commodity, FX, index, or rates. Each has different hours and risk.",
        realWorld: "Multi-asset funds allocate across classes — equities for growth, gold (GC=F) as hedge, FX for macro views, rates (TLT, ^TNX) for duration risk. Orion Alpha groups symbols the same way.",
      },
      {
        id: "benchmark",
        term: "Benchmark",
        body: "Reference index to compare performance — e.g. SPY tracks the S&P 500.",
        realWorld: "Mutual funds report returns vs S&P 500. A fund manager beating SPY after fees is adding value. Research desk CAPM and alpha tables use SPY the same way.",
      },
    ],
  },
  {
    id: "technical",
    title: "Technical indicators",
    intro: "Chart tools used by technical analysts and systematic traders worldwide.",
    terms: [
      {
        id: "sma",
        term: "SMA (Simple Moving Average)",
        short: "SMA20 / SMA50",
        body: "Average closing price over N days. SMA20 = short trend; SMA50 = medium trend.",
        realWorld: "Traders use the 50-day SMA on daily charts as support in uptrends — many watch when price pulls back to it. Golden cross (50 above 200) is a classic institutional signal.",
      },
      {
        id: "rsi",
        term: "RSI (Relative Strength Index)",
        short: "RSI 14",
        body: "Oscillator 0–100. Above 70 often called overbought; below 30 oversold.",
        realWorld: "Day traders fade extreme RSI on range-bound names. Trend funds ignore RSI in strong trends. Mean-reversion desks use RSI >70 as a short setup filter.",
      },
      {
        id: "macd",
        term: "MACD",
        body: "Difference between two EMAs plus a signal line. Histogram shows momentum direction.",
        realWorld: "Used on equity and FX desks for trend confirmation. A positive MACD cross above the signal line often triggers momentum algos and discretionary trend followers.",
      },
      {
        id: "bollinger",
        term: "Bollinger Bands",
        body: "Middle = SMA; upper/lower = middle ± 2 standard deviations.",
        realWorld: "Options traders watch band width for volatility expansion. Mean-reversion funds buy near lower band, sell near upper — especially in sideways markets.",
      },
      {
        id: "momentum-63",
        term: "63-day momentum",
        body: "Price change over ~one quarter (~63 trading days).",
        realWorld: "Quant equity funds rank stocks by 3–12 month momentum — a well-documented factor. A positive 63d momentum score aligns with how many long-only and long/short books tilt exposure.",
      },
    ],
  },
  {
    id: "risk",
    title: "Risk metrics",
    intro: "How portfolio managers and risk officers measure return vs risk.",
    terms: [
      {
        id: "volatility",
        term: "Annualized volatility",
        short: "Ann vol %",
        body: "Standard deviation of daily returns scaled to a year. Higher = wider swings.",
        realWorld: "Risk teams set position limits from vol — a 40% vol crypto name gets smaller size than 15% vol large-cap. VaR and portfolio heat maps use vol as a core input.",
      },
      {
        id: "sharpe",
        term: "Sharpe ratio",
        body: "Return per unit of total risk. Higher Sharpe = better risk-adjusted performance.",
        realWorld: "Hedge funds quote Sharpe in pitch decks — 1.0+ is respectable, 2.0+ is strong. Fund-of-funds compare managers on Sharpe before allocating capital.",
      },
      {
        id: "quantstats",
        term: "Performance analytics",
        body: "Full portfolio metrics on daily returns — Sharpe, Sortino, Calmar, max drawdown, win rate, and heatmaps.",
        realWorld: "Fund managers review these metrics before allocating capital. Sharpe above 1.0 is respectable; drawdown limits define how much pain investors can tolerate.",
      },
      {
        id: "sortino",
        term: "Sortino ratio",
        body: "Like Sharpe but only penalizes downside volatility.",
        realWorld: "Preferred when returns are skewed — e.g. trend strategies with small losses and occasional big wins. Insurance-linked and options-selling funds often report Sortino.",
      },
      {
        id: "max-dd",
        term: "Maximum drawdown",
        short: "Max DD %",
        body: "Largest peak-to-trough decline in the period.",
        realWorld: "Investors ask 'how bad could it get?' — a 2020-style drawdown on a fund determines redemptions. Risk committees set max DD limits before strategies go live.",
      },
      {
        id: "var",
        term: "Value at Risk (VaR 95%)",
        body: "Approximate worst daily loss not exceeded 95% of the time in the sample.",
        realWorld: "Banks report regulatory VaR daily. Portfolio managers use it for overnight risk — 'how much could we lose tomorrow on a normal bad day?' Research desk shows a simplified historical VaR.",
      },
    ],
  },
  {
    id: "capm",
    title: "CAPM & factors",
    intro: "Frameworks asset managers use to separate market exposure from skill.",
    terms: [
      {
        id: "capm",
        term: "CAPM (Capital Asset Pricing Model)",
        body: "Links expected return to market beta via regression vs a benchmark.",
        realWorld: "Every MBA learns CAPM. PMs run regressions of fund returns vs MSCI or S&P to see if alpha is real or just levered beta. Research desk runs the same vs SPY.",
      },
      {
        id: "beta",
        term: "Beta (β)",
        body: "Sensitivity to benchmark. β≈1 moves with market; β>1 amplifies; β<1 dampens.",
        realWorld: "A tech stock with β 1.4 moves ~40% more than the market — useful for hedging with index futures. Market-neutral funds target β near zero.",
      },
      {
        id: "alpha",
        term: "Alpha (α)",
        short: "Alpha ann %",
        body: "Excess return after adjusting for beta vs benchmark in the sample period.",
        realWorld: "The holy grail of active management — positive alpha means beating the market on a risk-adjusted basis. Allocator meetings focus on whether alpha is persistent or luck.",
      },
      {
        id: "factor-engine",
        term: "Factor engine",
        body: "Scores momentum, reversal, trend, and composite factors across a universe.",
        realWorld: "BlackRock, AQR, and quant shops run factor models at scale. Smaller desks use similar logic — rank names by momentum/value/quality before portfolio construction.",
      },
      {
        id: "composite-alpha",
        term: "Composite alpha score",
        body: "Combined standardized factor score ranking symbols in the universe.",
        realWorld: "Used in quantitative stock selection — top quintile names get overweight, bottom gets underweight or excluded. Factor ETFs (MTUM, VLUE) productize single factors.",
      },
      {
        id: "factor-ic",
        term: "Factor IC (Information Coefficient)",
        body: "Correlation between a factor score and forward returns — measures predictive power in-sample.",
        realWorld: "Quant researchers report IC in factor research papers. IC of 0.05 is weak but tradable at scale; IC decay tells you when a factor stopped working.",
      },
    ],
  },
  {
    id: "monte-carlo",
    title: "Monte Carlo simulation",
    intro: "Stress-testing and scenario tools used in risk and planning.",
    terms: [
      {
        id: "monte-carlo",
        term: "Monte Carlo simulation",
        body: "Many random price paths from historical drift and volatility.",
        realWorld: "Pension funds and wealth advisors run Monte Carlo for retirement outcomes. Trading desks use it for options P&L ranges and stress tests before earnings.",
      },
      {
        id: "gbm",
        term: "Geometric Brownian Motion (GBM)",
        body: "Model where log-returns are random with constant mean and variance.",
        realWorld: "Black-Scholes options pricing assumes GBM. Real markets have fat tails and jumps — quants know GBM is a teaching model, but it powers trillions in derivatives math.",
      },
      {
        id: "p05-p50-p95",
        term: "P05 · P50 · P95 bands",
        body: "Percentiles across simulated paths — pessimistic, median, optimistic.",
        realWorld: "CFOs use P05 for downside planning, P50 for base case. On research desk, these bands show how wide outcomes could spread over ~63 days in a simulation exercise.",
      },
      {
        id: "mc-fan",
        term: "Monte Carlo fan chart",
        body: "Time series of P05/P50/P95 percentiles — uncertainty cone over time.",
        realWorld: "Central banks publish fan charts for GDP and inflation. Asset allocators use similar visuals to communicate range of portfolio outcomes to clients.",
      },
      {
        id: "scenario-scorecard",
        term: "Scenario scorecard",
        body: "Higher / Range / Lower probabilities from patterns, factors, and simulation.",
        realWorld: "Sell-side analysts publish price targets and bull/base/bear cases — same idea. Desk scorecards blend technical and quant inputs into readable scenario weights.",
      },
    ],
  },
  {
    id: "patterns",
    title: "Pattern study scores",
    intro: "Rule-based technical scores — how systematic desks encode chart ideas.",
    terms: [
      {
        id: "trend-continuation",
        term: "Trend continuation score",
        body: "Higher when price is above SMA20/SMA50 with supportive volatility.",
        realWorld: "CTA (Commodity Trading Advisor) programs ride trends for weeks. A high continuation score mirrors what trend-following algos look for before adding length.",
      },
      {
        id: "mean-reversion",
        term: "Mean reversion score",
        body: "Higher when RSI is stretched or price hits Bollinger extremes.",
        realWorld: "Stat-arb and pairs trading desks profit from prices returning to fair value. Market makers also mean-revert inventory — buy dips, sell rips, within risk limits.",
      },
      {
        id: "breakout",
        term: "Breakout confirmation score",
        body: "Combines MACD momentum and price vs Bollinger midline.",
        realWorld: "Classic breakout traders buy new 52-week highs with volume. Momentum funds add on breakouts from consolidation — MACD confirmation filters false breaks.",
      },
      {
        id: "relative-strength",
        term: "Sector relative strength score",
        body: "Compares symbol return vs peer basket over ~21 days.",
        realWorld: "Institutional investors rotate into leaders — if NVDA beats semiconductors, growth funds overweight it. RS is standard on professional relative-value screens.",
      },
      {
        id: "momentum-buy-lab",
        term: "Momentum buy level",
        body: "Study level from SMA rules — SMA20 in strong trends, SMA50 in moderate.",
        realWorld: "Discretionary traders mark 'add zones' at moving averages in uptrends. The lab level shows where textbook momentum entries would sit — for study, not auto-trading.",
      },
    ],
  },
];

export function allDocTerms(): DocTerm[] {
  return MARKET_DOC_SECTIONS.flatMap((s) => s.terms);
}
