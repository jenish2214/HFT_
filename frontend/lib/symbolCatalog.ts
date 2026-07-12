import { ORION_UNIVERSE } from "@/lib/orionAlpha";
import type { AssetClass } from "@/lib/marketDeskTypes";
import { ASSET_CLASS_LABELS } from "@/lib/marketDeskTypes";

export interface SymbolEntry {
  symbol: string;
  name: string;
  assetClass: AssetClass;
}

const DISPLAY_NAMES: Record<string, string> = {
  AAPL: "Apple",
  MSFT: "Microsoft",
  GOOGL: "Alphabet",
  NVDA: "NVIDIA",
  TSLA: "Tesla",
  AMZN: "Amazon",
  META: "Meta",
  JPM: "JPMorgan",
  XOM: "Exxon Mobil",
  "BTC-USD": "Bitcoin",
  "ETH-USD": "Ethereum",
  "SOL-USD": "Solana",
  "BNB-USD": "BNB",
  "XRP-USD": "Ripple",
  "GC=F": "Gold",
  "CL=F": "Crude Oil WTI",
  "SI=F": "Silver",
  "NG=F": "Natural Gas",
  "HG=F": "Copper",
  "ZC=F": "Corn",
  SPY: "S&P 500 ETF",
  QQQ: "Nasdaq 100 ETF",
  DIA: "Dow Jones ETF",
  IWM: "Russell 2000 ETF",
  "^VIX": "VIX Volatility",
  "^GSPC": "S&P 500 Index",
  "EURUSD=X": "EUR / USD",
  "GBPUSD=X": "GBP / USD",
  "USDJPY=X": "USD / JPY",
  "DX-Y.NYB": "US Dollar Index",
  "^TNX": "10Y Treasury Yield",
  TLT: "20+ Year Treasury ETF",
  SHY: "1-3 Year Treasury ETF",
};

const CLASS_MAP: { symbols: readonly string[]; assetClass: AssetClass }[] = [
  { symbols: ORION_UNIVERSE.equities, assetClass: "equity" },
  { symbols: ORION_UNIVERSE.crypto, assetClass: "crypto" },
  { symbols: ORION_UNIVERSE.commodities, assetClass: "commodity" },
  { symbols: ORION_UNIVERSE.indices, assetClass: "index" },
  { symbols: ORION_UNIVERSE.fx, assetClass: "fx" },
  { symbols: ORION_UNIVERSE.rates, assetClass: "rates" },
];

export const SYMBOL_CATALOG: SymbolEntry[] = CLASS_MAP.flatMap(({ symbols, assetClass }) =>
  symbols.map((symbol) => ({
    symbol,
    name: DISPLAY_NAMES[symbol] ?? symbol,
    assetClass,
  })),
);

/** Top picks shown when the search field is focused with no query */
export const SYMBOL_DEFAULTS: Record<AssetClass, string[]> = {
  equity: ["AAPL", "MSFT", "NVDA"],
  fx: ["EURUSD=X", "GBPUSD=X", "USDJPY=X"],
  crypto: ["BTC-USD", "ETH-USD"],
  commodity: ["GC=F", "CL=F"],
  index: ["SPY", "QQQ"],
  rates: ["^TNX", "TLT"],
};

export interface SymbolSearchGroup {
  assetClass: AssetClass;
  label: string;
  items: SymbolEntry[];
}

export function getSymbolEntry(symbol: string): SymbolEntry | undefined {
  return SYMBOL_CATALOG.find((e) => e.symbol === symbol);
}

function entryBySymbol(symbol: string): SymbolEntry | undefined {
  return getSymbolEntry(symbol);
}

function matchEntry(entry: SymbolEntry, query: string): boolean {
  const q = query.toUpperCase();
  if (!q) return true;
  return (
    entry.symbol.toUpperCase().includes(q)
    || entry.name.toUpperCase().includes(q)
    || entry.assetClass.includes(q.toLowerCase())
  );
}

export function searchSymbolGroups(
  query: string,
  limitPerGroup = 4,
): SymbolSearchGroup[] {
  const q = query.trim();
  const groups: SymbolSearchGroup[] = [];
  const used = new Set<string>();

  const addGroup = (assetClass: AssetClass, items: SymbolEntry[]) => {
    const unique = items.filter((e) => {
      if (used.has(e.symbol)) return false;
      used.add(e.symbol);
      return true;
    });
    if (unique.length === 0) return;
    groups.push({
      assetClass,
      label: ASSET_CLASS_LABELS[assetClass],
      items: unique.slice(0, limitPerGroup),
    });
  };

  if (!q) {
    for (const assetClass of Object.keys(SYMBOL_DEFAULTS) as AssetClass[]) {
      const picks = SYMBOL_DEFAULTS[assetClass]
        .map(entryBySymbol)
        .filter((e): e is SymbolEntry => !!e);
      addGroup(assetClass, picks);
    }
    return groups;
  }

  const byClass = new Map<AssetClass, SymbolEntry[]>();
  for (const entry of SYMBOL_CATALOG) {
    if (!matchEntry(entry, q)) continue;
    const list = byClass.get(entry.assetClass) ?? [];
    list.push(entry);
    byClass.set(entry.assetClass, list);
  }

  const order: AssetClass[] = ["equity", "fx", "crypto", "commodity", "index", "rates"];
  for (const assetClass of order) {
    const items = byClass.get(assetClass);
    if (items) addGroup(assetClass, items);
  }

  return groups;
}
