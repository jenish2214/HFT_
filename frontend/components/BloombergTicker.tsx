"use client";

import type { TickInfo, MarketSession } from "@/lib/marketTypes";
import { PRODUCT_NAME } from "@/lib/orionAlpha";

interface Props {
  tick: TickInfo | null;
  market: MarketSession | null;
  symbol: string;
}

export default function BloombergTicker({ tick, market, symbol }: Props) {
  const items = [
    market?.label ?? "US EQUITIES",
    tick ? `${symbol} US ${tick.price.toFixed(2)} ${(tick.change ?? 0) >= 0 ? "+" : ""}${(tick.change ?? 0).toFixed(2)} (${(tick.change_pct ?? 0) >= 0 ? "+" : ""}${(tick.change_pct ?? 0).toFixed(2)}%)` : "",
    tick?.day_high ? `HI ${tick.day_high.toFixed(2)}` : "",
    tick?.day_low ? `LO ${tick.day_low.toFixed(2)}` : "",
    tick?.volume ? `VOL ${tick.volume.toLocaleString()}` : "",
    market?.countdown ? `NXT ${market.countdown}` : "",
    `${PRODUCT_NAME.toUpperCase()} RESEARCH TERMINAL`,
  ].filter(Boolean);

  const text = items.join("   ◆   ");

  return (
    <div className="bb-ticker">
      <span className="bb-ticker-label">TKR</span>
      <div className="bb-ticker-scroll">
        <div className="bb-ticker-track mono">
          <span>{text}</span>
          <span aria-hidden>{text}</span>
        </div>
      </div>
    </div>
  );
}
