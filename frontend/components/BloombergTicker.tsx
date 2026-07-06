"use client";

import type { TickInfo, MarketSession } from "@/app/page";

interface Props {
  tick: TickInfo | null;
  market: MarketSession | null;
  symbol: string;
}

export default function BloombergTicker({ tick, market, symbol }: Props) {
  const items = [
    market?.label ?? "US Equities",
    tick ? `${symbol} ${tick.price.toFixed(2)} ${(tick.change_pct ?? 0) >= 0 ? "+" : ""}${(tick.change_pct ?? 0).toFixed(2)}%` : "",
    tick?.day_high ? `Hi ${tick.day_high.toFixed(2)}` : "",
    tick?.day_low ? `Lo ${tick.day_low.toFixed(2)}` : "",
    tick?.volume ? `Vol ${tick.volume.toLocaleString()}` : "",
    market?.countdown ?? "",
  ].filter(Boolean);

  const text = items.join("   ·   ");

  return (
    <div className="bb-ticker">
      <div className="bb-ticker-track mono">
        <span>{text}</span>
        <span aria-hidden>{text}</span>
      </div>
    </div>
  );
}
