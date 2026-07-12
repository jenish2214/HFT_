import { getApiBase } from "@/lib/api";
import type { ResearchProfile } from "@/lib/marketDeskTypes";
import type { QuantResearchData } from "@/lib/quantResearchTypes";
import { QUANT_DEFAULT_TICKERS } from "@/lib/quantResearchTypes";

function localBases(): string[] {
  const bases = [getApiBase()];
  if (typeof window !== "undefined") {
    const host = window.location.hostname;
    if (host === "localhost" || host === "127.0.0.1") {
      bases.push("http://127.0.0.1:8000");
    }
  }
  return [...new Set(bases)];
}

function quantQuery(symbol: string, tickers: string[]): string {
  return `symbol=${encodeURIComponent(symbol)}&tickers=${encodeURIComponent(tickers.join(","))}`;
}

async function fetchJson<T>(url: string): Promise<{ ok: boolean; data: T | null; status: number }> {
  try {
    const res = await fetch(url, { cache: "no-store" });
    if (!res.ok) return { ok: false, data: null, status: res.status };
    const data = (await res.json()) as T;
    return { ok: true, data, status: res.status };
  } catch {
    return { ok: false, data: null, status: 0 };
  }
}

export type QuantFetchResult =
  | { mode: "full"; data: QuantResearchData; via: string }
  | { mode: "lite"; profile: ResearchProfile; via: string }
  | { mode: "error"; message: string };

function isFullQuant(data: QuantResearchData | null): data is QuantResearchData {
  return !!data && data.data_found !== false && !!data.date_range && !!data.summary;
}

/** Try /api proxy first, then direct Python API on localhost. Falls back to research profile. */
export async function loadQuantResearch(
  symbol: string,
  tickers: string[] = QUANT_DEFAULT_TICKERS,
): Promise<QuantFetchResult> {
  const qs = quantQuery(symbol, tickers);

  for (const base of localBases()) {
    const { ok, data, status } = await fetchJson<QuantResearchData & { status?: string }>(
      `${base}/research/quant?${qs}`,
    );
    if (ok && data && isFullQuant(data) && data.status !== "error") {
      return { mode: "full", data, via: base };
    }
    if (status === 404 || status === 500 || status === 503) continue;
  }

  for (const base of localBases()) {
    const { ok, data } = await fetchJson<ResearchProfile>(
      `${base}/research/profile?symbol=${encodeURIComponent(symbol)}`,
    );
    if (ok && data && data.quote?.price && data.data_found !== false) {
      return { mode: "lite", profile: data, via: base };
    }
  }

  return {
    mode: "error",
    message: "Quant research API is unavailable. Use the chart or terminal below, or restart the server.",
  };
}
