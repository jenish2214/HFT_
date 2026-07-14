import type { QuantResearchData } from "@/lib/quantResearchTypes";

const PREFIX = "qr-v3";
const TTL_MS = 5 * 60 * 1000;

export function getQuantCache(symbol: string): QuantResearchData | null {
  if (typeof sessionStorage === "undefined") return null;
  try {
    const raw = sessionStorage.getItem(`${PREFIX}:${symbol.toUpperCase()}`);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as { ts: number; data: QuantResearchData };
    if (Date.now() - parsed.ts > TTL_MS) return null;
    return parsed.data;
  } catch {
    return null;
  }
}

export function setQuantCache(symbol: string, data: QuantResearchData): void {
  if (typeof sessionStorage === "undefined") return;
  try {
    sessionStorage.setItem(
      `${PREFIX}:${symbol.toUpperCase()}`,
      JSON.stringify({ ts: Date.now(), data }),
    );
  } catch {
    /* quota */
  }
}
