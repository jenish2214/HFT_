/** Orion Alpha — product identity & terminal feature catalog */

export const PRODUCT_NAME = "Orion Alpha";
export const PRODUCT_TAGLINE = "Global Markets Research Terminal";
export const PRODUCT_VERSION = "1.0";

export const ASSET_CLASS_SHORT: Record<string, string> = {
  equity: "EQ",
  crypto: "CR",
  commodity: "CO",
  index: "IDX",
  fx: "FX",
  rates: "RT",
};

export const ASSET_CLASS_FILTERS = [
  { id: "all", label: "ALL" },
  { id: "equity", label: "EQ" },
  { id: "crypto", label: "CR" },
  { id: "commodity", label: "CO" },
  { id: "index", label: "IDX" },
  { id: "fx", label: "FX" },
  { id: "rates", label: "RT" },
] as const;

export type AssetClassFilter = (typeof ASSET_CLASS_FILTERS)[number]["id"];

export const ORION_UNIVERSE = {
  equities: ["AAPL", "MSFT", "GOOGL", "NVDA", "TSLA", "AMZN", "META", "JPM", "XOM"],
  crypto: ["BTC-USD", "ETH-USD", "SOL-USD", "BNB-USD", "XRP-USD"],
  commodities: ["GC=F", "CL=F", "SI=F", "NG=F", "HG=F", "ZC=F"],
  indices: ["SPY", "QQQ", "DIA", "IWM", "^VIX", "^GSPC"],
  fx: ["EURUSD=X", "GBPUSD=X", "USDJPY=X", "DX-Y.NYB"],
  rates: ["^TNX", "TLT", "SHY"],
};

export const ORION_FEATURES = [
  {
    id: "gp",
    key: "GP",
    title: "Price Graph & Market Depth",
    details: "Live candlestick chart (1D–ALL), Level II order book, time & sales tape, real-time quote panel.",
  },
  {
    id: "mon",
    key: "MON",
    title: "Orion Alpha Monitor",
    details: "Full universe watchlist — equities, crypto, commodities, indices, FX, and rates with live quotes, sector, and asset class.",
  },
  {
    id: "fa",
    key: "FA",
    title: "Fundamentals & Annual Reports",
    details: "Income statement, balance sheet, cash flow, key stats, company directory for all Orion equity names.",
  },
  {
    id: "des",
    key: "DES",
    title: "Company Description",
    details: "Business summary, sector, industry, employees, website, market cap, P/E, EPS, dividend yield.",
  },
  {
    id: "cn",
    key: "CN",
    title: "Company Profile",
    details: "Condensed profile view with sector context and description scroll.",
  },
  {
    id: "hp",
    key: "HP",
    title: "Historical Prices",
    details: "Opens full-screen chart at 1Y with SMA, EMA, Bollinger Bands, RSI, MACD, and analysis panel.",
  },
  {
    id: "ib",
    key: "IB",
    title: "Investment Banker Desk",
    details: "Global markets overview — top gainers/losers, macro headlines, all asset classes in one desk.",
  },
  {
    id: "res",
    key: "RES",
    title: "Pro Research Desk",
    details: "Deep research profile — technicals, 52-week range, peer comparison, sector peers, full fundamentals.",
  },
  {
    id: "wei",
    key: "WEI",
    title: "World Equity Index",
    details: "Quick load SPY / global index context from command line.",
  },
  {
    id: "chart",
    key: "CHART",
    title: "Full Chart Workspace",
    details: "/chart?symbol=AAPL&tf=1Y — dedicated chart tab with all indicators and crosshair analysis.",
  },
  {
    id: "fundamentals",
    key: "FULL FA",
    title: "Full Fundamentals Page",
    details: "/fundamentals?symbol=AAPL — tabbed income, balance sheet, cash flow, and key stats in full page.",
  },
] as const;
