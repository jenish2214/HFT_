/** Quant research API types — from QuantResearch.ipynb via /research/quant */

export interface QuantFactorRow {
  symbol: string;
  momentum_63d: number | null;
  reversal_5d: number | null;
  low_vol_21d: number | null;
  trend_sma50: number | null;
  rsi_14: number | null;
  composite_alpha: number | null;
}

export interface QuantCapmRow {
  symbol: string;
  alpha_ann_pct: number | null;
  beta: number | null;
  benchmark: string;
}

export interface QuantRiskRow {
  symbol: string;
  cagr_pct: number | null;
  ann_vol_pct: number | null;
  sharpe: number | null;
  sortino: number | null;
  max_drawdown_pct: number | null;
  var_95_pct: number | null;
  latest_price: number | null;
}

export interface QuantMonteCarloRow {
  symbol: string;
  current: number | null;
  p05: number | null;
  p50: number | null;
  p95: number | null;
}

export interface QuantPatternSignal {
  label: string;
  probability: number;
  description: string;
}

export interface QuantMomentumZone {
  label: string;
  price: number;
  role: string;
  highlight?: boolean;
}

export interface QuantMomentumLab {
  data_found: boolean;
  symbol?: string;
  current_price?: number;
  momentum_regime?: string;
  momentum_63d_pct?: number;
  rsi_14?: number | null;
  study_buy_price?: number;
  distance_from_current_pct?: number;
  zones?: QuantMomentumZone[];
  lesson?: string;
  disclaimer?: string;
}

export interface QuantPredictionModel {
  id: string;
  name: string;
  stack: string;
  role: string;
  status?: string;
  latency_ns?: number;
}

export interface QuantScenario {
  label: string;
  probability: number;
  hint: string;
}

export interface QuantPredictions {
  outlook: "Bullish" | "Neutral" | "Bearish";
  confidence: number;
  headline: string;
  bullish_score?: number;
  scenarios: QuantScenario[];
  signals: QuantPatternSignal[];
  models: QuantPredictionModel[];
  top_signal?: { label: string; probability: number } | null;
  price_band?: { current: number; low: number; mid: number; high: number };
}

export interface QuantFactorIc {
  symbol: string;
  factor: string;
  ic: number | null;
}

export interface QuantEngineStats {
  source: string;
  avg_latency_ns?: number;
  total_orders?: number;
  total_trades?: number;
  status?: string;
}

export interface QuantKeyStat {
  label: string;
  value: string;
}

export interface QuantCompanyProfile {
  symbol: string;
  name: string;
  sector: string | null;
  industry: string | null;
  description: string | null;
  website: string | null;
  employees: number | null;
  market_cap_fmt: string | null;
  pe_ratio: number | null;
  eps: number | null;
  dividend_yield: number | null;
  fifty_two_week_high: number | null;
  fifty_two_week_low: number | null;
  latest_revenue_fmt: string | null;
  latest_net_income_fmt: string | null;
  report_year: string | null;
  key_stats?: QuantKeyStat[];
  data_found?: boolean;
  partial?: boolean;
}

export interface QuantResearchData {
  primary: string;
  tickers: string[];
  benchmark: string;
  period: string;
  trading_days: number;
  date_range: { start: string; end: string };
  data_found: boolean;
  data_source: string;
  sources_tried: string[];
  factor_scores: QuantFactorRow[];
  capm: QuantCapmRow[];
  risk_metrics: QuantRiskRow[];
  monte_carlo: QuantMonteCarloRow[];
  factor_ic: QuantFactorIc[];
  pattern_signals: QuantPatternSignal[];
  correlation: { symbols: string[]; values: number[][] };
  company_profiles?: Record<string, QuantCompanyProfile>;
  primary_profile?: QuantCompanyProfile;
  charts?: {
    price_series: Record<string, { date: string; close: number | null; norm: number | null }[]>;
    cumulative_returns: ({ date: string } & Record<string, number | null>)[];
    rsi: { date: string; rsi: number | null }[];
    indicators?: {
      symbol: string;
      price: { date: string; close: number | null }[];
      sma20: { date: string; value: number | null }[];
      sma50: { date: string; value: number | null }[];
      bb_upper: { date: string; value: number | null }[];
      bb_mid: { date: string; value: number | null }[];
      bb_lower: { date: string; value: number | null }[];
      macd: { date: string; value: number | null }[];
      macd_signal: { date: string; value: number | null }[];
      macd_hist: { date: string; value: number | null }[];
    };
    monte_carlo_fan: {
      symbol: string;
      current: number | null;
      days: number;
      p05: (number | null)[];
      p50: (number | null)[];
      p95: (number | null)[];
    };
  };
  portfolio: {
    equal_weight: { return_pct: number | null; vol_pct: number | null; sharpe: number | null };
  };
  summary: {
    best_sharpe: string;
    top_factor_pick: string;
    best_capm_alpha: string;
    recommendation: string;
    universe_vol_pct: number | null;
  };
  methodology: string;
  predictions?: QuantPredictions;
  momentum_lab?: QuantMomentumLab;
  engine?: QuantEngineStats;
  message?: string;
  updated_ts?: number;
}

export const QUANT_DEFAULT_TICKERS = ["AAPL", "MSFT", "NVDA", "GOOGL"];
