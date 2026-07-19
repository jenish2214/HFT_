import { getApiBase } from "@/lib/api";
import { isBrowserLocalhost } from "@/lib/runtimeEnv";
import type { ResearchProfile } from "@/lib/marketDeskTypes";
import type { QuantResearchData } from "@/lib/quantResearchTypes";
import { QUANT_DEFAULT_TICKERS } from "@/lib/quantResearchTypes";
import { getQuantCache, setQuantCache } from "@/lib/quantCache";

/** Browser must use same-origin /api only — CSP blocks direct backend URLs. */
function apiBase(): string {
  return getApiBase();
}

const QUANT_TIMEOUT_MS = typeof window !== "undefined" && isBrowserLocalhost() ? 60_000 : 90_000;

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
    const res = await fetch(url, {
      cache: "default",
      signal: controller.signal,
      headers: { Accept: "application/json" },
    });
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

/**
 * Load quant research via /api proxy.
 * Uses client cache first for instant production loads; otherwise waits for full result.
 */
export async function loadQuantResearch(
  symbol: string,
  tickers: string[] = QUANT_DEFAULT_TICKERS,
  options?: { preferCache?: boolean },
): Promise<QuantFetchResult> {
  const preferCache = options?.preferCache !== false;
  if (preferCache) {
    const cached = getQuantCache(symbol);
    if (cached && isFullQuant(cached)) {
      return { mode: "full", data: cached, via: "cache", latencyMs: 0 };
    }
  }

  const qs = quantQuery(symbol, tickers);
  const base = apiBase();

  const quantPromise = fetchJson<QuantResearchData & { status?: string }>(
    `${base}/research/quant?${qs}`,
  );
  const profilePromise = fetchJson<ResearchProfile>(
    `${base}/research/profile?symbol=${encodeURIComponent(symbol)}`,
    10_000,
  );

  const quant = await quantPromise;
  if (quant.ok && quant.data && isFullQuant(quant.data) && quant.data.status !== "error") {
    setQuantCache(symbol, quant.data);
    return { mode: "full", data: quant.data, via: base, latencyMs: quant.latencyMs };
  }

  const profile = await profilePromise;
  if (profile.ok && profile.data && profile.data.quote?.price && profile.data.data_found !== false) {
    return {
      mode: "lite",
      profile: profile.data,
      via: base,
      latencyMs: quant.latencyMs + profile.latencyMs,
    };
  }

  return {
    mode: "error",
    message: "Quant research API is unavailable. Use the chart or terminal below, or restart the server.",
    latencyMs: quant.latencyMs + profile.latencyMs,
  };
}

/** Background refresh — does not block UI. */
export function revalidateQuantResearch(
  symbol: string,
  tickers: string[] = QUANT_DEFAULT_TICKERS,
): void {
  void loadQuantResearch(symbol, tickers, { preferCache: false }).then((result) => {
    if (result.mode === "full") setQuantCache(symbol, result.data);
  });
}
