import { getApiBase } from "@/lib/api";
import { isBrowserLocalhost } from "@/lib/runtimeEnv";
import type { ResearchProfile } from "@/lib/marketDeskTypes";
import type { QuantResearchData } from "@/lib/quantResearchTypes";
import { QUANT_DEFAULT_TICKERS } from "@/lib/quantResearchTypes";

/** Browser must use same-origin /api only — CSP blocks direct backend URLs. */
function apiBase(): string {
  return getApiBase();
}

const QUANT_TIMEOUT_MS = typeof window !== "undefined" && isBrowserLocalhost() ? 60_000 : 120_000;

function quantQuery(symbol: string, tickers: string[]): string {
  return `symbol=${encodeURIComponent(symbol)}&tickers=${encodeURIComponent(tickers.join(","))}`;
}

async function fetchJson<T>(
  url: string,
  timeoutMs = QUANT_TIMEOUT_MS,
): Promise<{ ok: boolean; data: T | null; status: number; latencyMs: number }> {
  const start = Date.now();
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);
  try {
    const res = await fetch(url, { cache: "no-store", signal: controller.signal });
    const latencyMs = Date.now() - start;
    if (!res.ok) return { ok: false, data: null, status: res.status, latencyMs };
    const data = (await res.json()) as T;
    return { ok: true, data, status: res.status, latencyMs };
  } catch {
    return { ok: false, data: null, status: 0, latencyMs: Date.now() - start };
  } finally {
    clearTimeout(timer);
  }
}

export type QuantFetchResult =
  | { mode: "full"; data: QuantResearchData; via: string; latencyMs: number }
  | { mode: "lite"; profile: ResearchProfile; via: string; latencyMs: number }
  | { mode: "error"; message: string; latencyMs: number };

function isFullQuant(data: QuantResearchData | null): data is QuantResearchData {
  return !!data && data.data_found !== false && !!data.date_range && !!data.summary;
}

/** Load quant research via /api proxy. Falls back to research profile. */
export async function loadQuantResearch(
  symbol: string,
  tickers: string[] = QUANT_DEFAULT_TICKERS,
): Promise<QuantFetchResult> {
  const qs = quantQuery(symbol, tickers);
  const base = apiBase();
  let totalLatency = 0;

  const quant = await fetchJson<QuantResearchData & { status?: string }>(
    `${base}/research/quant?${qs}`,
  );
  totalLatency += quant.latencyMs;
  if (quant.ok && quant.data && isFullQuant(quant.data) && quant.data.status !== "error") {
    return { mode: "full", data: quant.data, via: base, latencyMs: totalLatency };
  }

  const profile = await fetchJson<ResearchProfile>(
    `${base}/research/profile?symbol=${encodeURIComponent(symbol)}`,
  );
  totalLatency += profile.latencyMs;
  if (profile.ok && profile.data && profile.data.quote?.price && profile.data.data_found !== false) {
    return { mode: "lite", profile: profile.data, via: base, latencyMs: totalLatency };
  }

  return {
    mode: "error",
    message: "Quant research API is unavailable. Use the chart or terminal below, or restart the server.",
    latencyMs: totalLatency,
  };
}
