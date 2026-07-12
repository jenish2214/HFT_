export type BbFunction = "GP" | "DES" | "FA" | "CN" | "HP" | "WEI" | "MON" | "IB" | "RES" | "HELP";

export type MobileDeskTab = "chart" | "market" | "report" | "ibank" | "research";

export interface BbCommandResult {
  fn?: BbFunction;
  symbol?: string;
}

const FN_KEYS = new Set<BbFunction>(["GP", "DES", "FA", "CN", "HP", "WEI", "MON", "IB", "RES", "HELP"]);

function parseSymbolArg(parts: string[]): string | undefined {
  if (parts.length < 2) return undefined;
  return parts.slice(1).join(" ").trim().toUpperCase() || undefined;
}

/** Parse Bloomberg-style terminal commands. */
export function parseBloombergCommand(input: string): BbCommandResult {
  const cleaned = input.trim().toUpperCase().replace(/<GO>/g, "").trim();
  if (!cleaned) return {};

  const parts = cleaned.split(/\s+/).filter(Boolean);
  const first = parts[0] as BbFunction | string;

  if (FN_KEYS.has(first as BbFunction)) {
    const fn = first as BbFunction;
    return { fn, symbol: parseSymbolArg(parts) };
  }

  if (/^[A-Z0-9^=.-]{2,14}$/.test(first)) {
    return { symbol: first, fn: "GP" };
  }

  return {};
}

export function isFullDeskFunction(fn: BbFunction): boolean {
  return fn === "IB" || fn === "RES";
}

export const BB_HELP_LINES = [
  "AAPL <GO>     Load symbol",
  "GP MSFT       Graph / chart view",
  "FA AAPL       Fundamentals & annual report",
  "FA tabs       Income · Balance Sheet · Cash Flow · Stats",
  "DES AAPL      Company description",
  "MON           Orion Alpha monitor (all assets)",
  "IB            Investment banker — all markets",
  "RES AAPL      Pro research desk",
  "HP AAPL       Historical prices (1Y chart)",
  "WEI           World indices (SPY)",
  "BTC-USD       Load crypto symbol",
  "GC=F          Load gold futures",
  "EURUSD=X      Load FX pair",
  "CN AAPL       Company profile",
  "HELP          Orion Alpha feature guide",
  "FULL CHART    Open /chart in new tab",
];

export function mobileTabForFunction(fn: BbFunction): MobileDeskTab {
  if (fn === "IB") return "ibank";
  if (fn === "RES") return "research";
  if (fn === "MON") return "market";
  if (fn === "GP" || fn === "HP") return "chart";
  if (fn === "HELP") return "chart";
  return "report";
}

export function deskColumnForFunction(fn: BbFunction): "watch" | "center" | "report" | "full" {
  if (fn === "IB" || fn === "RES") return "full";
  if (fn === "MON") return "watch";
  if (fn === "GP" || fn === "HP" || fn === "HELP") return "center";
  return "report";
}
