import type { ChartBar } from "@/components/BloombergTerminalChart";
import type { Book, StrategyInfo, TickInfo, UserInfo } from "@/app/page";

export function sameTick(a: TickInfo | null, b: TickInfo): boolean {
  if (!a) return false;
  return (
    a.price === b.price
    && a.bid === b.bid
    && a.ask === b.ask
    && a.volume === b.volume
    && a.change === b.change
    && a.change_pct === b.change_pct
    && a.day_high === b.day_high
    && a.day_low === b.day_low
    && a.open === b.open
    && a.prev_close === b.prev_close
    && a.source === b.source
    && a.symbol === b.symbol
  );
}

export function sameBook(a: Book, b: Book): boolean {
  return (
    a.mid === b.mid
    && a.spread === b.spread
    && JSON.stringify(a.bids) === JSON.stringify(b.bids)
    && JSON.stringify(a.asks) === JSON.stringify(b.asks)
  );
}

export function samePnlAccount(a: StrategyInfo, b: StrategyInfo): boolean {
  return (
    a.position === b.position
    && a.cash === b.cash
    && a.orders_sent === b.orders_sent
    && a.fills === b.fills
    && a.realized_pnl === b.realized_pnl
    && a.unrealized_pnl === b.unrealized_pnl
    && a.total_pnl === b.total_pnl
    && a.exposure === b.exposure
    && a.avg_entry === b.avg_entry
  );
}

export function sameUser(a: UserInfo, b: UserInfo): boolean {
  return (
    samePnlAccount(a, b)
    && a.equity === b.equity
    && a.buying_power === b.buying_power
    && a.initial_equity === b.initial_equity
  );
}

export function sameBar(a: ChartBar, b: ChartBar): boolean {
  return (
    a.ts === b.ts
    && a.open === b.open
    && a.high === b.high
    && a.low === b.low
    && a.close === b.close
    && a.volume === b.volume
  );
}

/** Merge last chart bar or append — returns prev if unchanged. */
export function mergeChartPatch(prev: ChartBar[], patch: ChartBar): ChartBar[] {
  if (prev.length === 0) return [patch];
  const last = prev[prev.length - 1];
  if (last.ts === patch.ts) {
    if (sameBar(last, patch)) return prev;
    return [...prev.slice(0, -1), patch];
  }
  if (patch.ts > last.ts) return [...prev, patch];
  return prev;
}

/** Append single price point — returns prev if duplicate ts. */
export function mergePricePoint(
  prev: { ts: number; price: number }[],
  point: { ts: number; price: number },
  max = 120,
): { ts: number; price: number }[] {
  if (prev.length > 0) {
    const last = prev[prev.length - 1];
    if (last.ts === point.ts && last.price === point.price) return prev;
    if (last.ts === point.ts) return [...prev.slice(0, -1), point];
  }
  return [...prev, point].slice(-max);
}

export function mergeChartBars(prev: ChartBar[], next: ChartBar[]): ChartBar[] {
  if (prev.length === next.length && prev.length > 0) {
    const lastPrev = prev[prev.length - 1];
    const lastNext = next[next.length - 1];
    if (lastPrev.ts === lastNext.ts) {
      if (sameBar(lastPrev, lastNext)) return prev;
      let samePrefix = true;
      for (let i = 0; i < prev.length - 1; i++) {
        if (!sameBar(prev[i], next[i])) {
          samePrefix = false;
          break;
        }
      }
      if (samePrefix) return mergeChartPatch(prev, lastNext);
    }
  }
  if (prev.length === next.length && prev.every((b, i) => sameBar(b, next[i]))) {
    return prev;
  }
  return next;
}
