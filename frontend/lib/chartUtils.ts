import type { UTCTimestamp } from "lightweight-charts";
import type { ChartBar } from "@/components/BloombergTerminalChart";
import type { ChartTimeframe } from "@/components/BloombergTerminalChart";

export function normalizeTs(ts: unknown): number {
  let n = Math.floor(Number(ts));
  if (!Number.isFinite(n) || n <= 0) return 0;
  if (n > 1e12) n = Math.floor(n / 1000);
  return n;
}

export function toChartTime(ts: number): UTCTimestamp {
  const sec = normalizeTs(ts);
  if (sec <= 0) return 0 as UTCTimestamp;
  return sec as UTCTimestamp;
}

export function sanitizeBars(bars: ChartBar[]): ChartBar[] {
  const seen = new Set<number>();
  const out: ChartBar[] = [];

  for (const bar of [...bars].sort((a, b) => normalizeTs(a.ts) - normalizeTs(b.ts))) {
    const ts = normalizeTs(bar.ts);
    if (ts <= 0 || seen.has(ts)) continue;

    const open = Number(bar.open);
    const high = Number(bar.high);
    const low = Number(bar.low);
    const close = Number(bar.close);
    if (![open, high, low, close].every((n) => Number.isFinite(n) && n > 0)) continue;

    seen.add(ts);
    out.push({
      ts,
      open,
      high,
      low,
      close,
      volume: Number.isFinite(bar.volume) ? bar.volume : 0,
    });
  }

  return out;
}

export function fmtBarTime(ts: number, timeframe: ChartTimeframe): string {
  const d = new Date(ts * 1000);
  if (timeframe === "1D" || timeframe === "1W") {
    return d.toLocaleTimeString("en-US", {
      hour: "2-digit",
      minute: "2-digit",
      hour12: false,
      timeZone: "America/New_York",
    });
  }
  if (timeframe === "1M") {
    return d.toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
      hour12: false,
      timeZone: "America/New_York",
    });
  }
  return d.toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: timeframe === "ALL" ? "numeric" : undefined,
    timeZone: "America/New_York",
  });
}
