export type AssetClass = "equity" | "crypto" | "commodity" | "index" | "fx" | "rates";

export interface MarketAsset {
  symbol: string;
  name: string;
  asset_class: AssetClass;
  price: number;
  change: number;
  change_pct: number;
  volume: number;
  day_high?: number | null;
  day_low?: number | null;
  market_cap_fmt?: string | null;
  fifty_two_week_high?: number | null;
  fifty_two_week_low?: number | null;
  sector?: string | null;
  currency?: string | null;
}

export interface MarketCategory {
  label: string;
  assets: MarketAsset[];
}

export interface MarketBreadth {
  up: number;
  down: number;
  flat: number;
  total: number;
}

export interface BankerDeskData {
  categories: Record<AssetClass, MarketCategory>;
  breadth: MarketBreadth;
  top_gainers: MarketAsset[];
  top_losers: MarketAsset[];
  macro: {
    sentiment: "Risk-On" | "Risk-Off" | "Neutral";
    risk_score: number;
    equity_avg_chg: number;
    crypto_avg_chg: number;
    commodity_avg_chg: number;
    index_avg_chg: number;
    headline_assets: MarketAsset[];
  };
  updated_ts: number;
}

export interface ResearchProfile {
  symbol: string;
  asset_class: AssetClass;
  asset_class_label: string;
  quote: MarketAsset;
  data_found?: boolean;
  data_source?: string;
  sources_tried?: string[];
  message?: string | null;
  report: {
    symbol: string;
    name: string;
    sector: string | null;
    industry: string | null;
    description: string | null;
    market_cap_fmt: string | null;
    pe_ratio: number | null;
    eps: number | null;
    dividend_yield: number | null;
    annual_reports: { year: string; revenue_fmt: string | null; net_income_fmt: string | null }[];
  } | null;
  technicals: {
    fifty_two_week_high: number | null;
    fifty_two_week_low: number | null;
    range_position_pct: number | null;
    from_52w_high_pct: number | null;
    day_range: string | null;
  };
  peer_comparison: MarketAsset[];
  sector_peers: MarketAsset[];
  market_breadth: MarketBreadth;
}

export const ASSET_CLASS_LABELS: Record<AssetClass, string> = {
  equity: "Equities",
  crypto: "Crypto",
  commodity: "Commodities",
  index: "Indices",
  fx: "FX",
  rates: "Rates",
};

export const ASSET_CLASS_ORDER: AssetClass[] = [
  "equity", "index", "crypto", "commodity", "fx", "rates",
];
