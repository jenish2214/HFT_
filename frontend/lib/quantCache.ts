import type { QuantResearchData } from "@/lib/quantResearchTypes";

const PREFIX = "qr-v4";
const TTL_MS = 20 * 60 * 1000; // 20 min — faster repeat loads in production

type Entry = { ts: number; data: QuantResearchData };

const memory = new Map<string, Entry>();

function key(symbol: string) {
  return `${PREFIX}:${symbol.toUpperCase()}`;
}

function isFresh(entry: Entry | null | undefined): entry is Entry {
  return !!entry && Date.now() - entry.ts <= TTL_MS;
}

export function getQuantCache(symbol: string): QuantResearchData | null {
  const k = key(symbol);
  const mem = memory.get(k);
  if (isFresh(mem)) return mem.data;

  if (typeof sessionStorage === "undefined") return null;
  try {
    const raw = sessionStorage.getItem(k);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as Entry;
    if (!isFresh(parsed)) return null;
    memory.set(k, parsed);
    return parsed.data;
  } catch {
    return null;
  }
}

export function setQuantCache(symbol: string, data: QuantResearchData): void {
  const entry: Entry = { ts: Date.now(), data };
  const k = key(symbol);
  memory.set(k, entry);
  if (typeof sessionStorage === "undefined") return;
  try {
    sessionStorage.setItem(k, JSON.stringify(entry));
  } catch {
    /* quota */
  }
}

/** True when cached payload is still warm (skip blocking network wait). */
export function hasFreshQuantCache(symbol: string): boolean {
  return getQuantCache(symbol) != null;
}
