import type { TickInfo, MarketSession } from "@/lib/marketTypes";
import { isMarketOpen } from "@/lib/marketTypes";
import Link from "next/link";
import SymbolSelector from "@/components/SymbolSelector";
import { PRODUCT_NAME, PRODUCT_MOTTO, PRODUCT_TAGLINE } from "@/lib/orionAlpha";

interface Props {
  symbol: string;
  tick: TickInfo | null;
  connected: boolean;
  market?: MarketSession | null;
  onSymbolChange: (sym: string) => void;
  symbolLoading?: boolean;
}

export default function TraderHeader({
  symbol, tick, connected, market, onSymbolChange, symbolLoading,
}: Props) {
  const price = tick?.price ?? 0;
  const spread = tick && tick.bid > 0 && tick.ask > 0 ? tick.ask - tick.bid : 0;
  const chg = tick?.change ?? 0;
  const up = chg >= 0;

  const marketOpen = isMarketOpen(market);

  const metrics = [
    { label: "Last", value: tick?.price ? tick.price.toFixed(2) : "—", cls: "bb-val-last" },
    { label: "Net Chg", value: tick?.change != null ? `${up ? "+" : ""}${chg.toFixed(2)}` : "—", cls: up ? "bid" : "ask" },
    { label: "Pct Chg", value: tick?.change_pct != null ? `${up ? "+" : ""}${tick.change_pct.toFixed(2)}` : "—", cls: up ? "bid" : "ask" },
    { label: "Bid", value: tick?.bid ? tick.bid.toFixed(2) : "—", cls: "bid" },
    { label: "Ask", value: tick?.ask ? tick.ask.toFixed(2) : "—", cls: "ask" },
    { label: "Spread", value: spread > 0 ? spread.toFixed(2) : "—" },
    { label: "Open", value: tick?.open ? tick.open.toFixed(2) : "—" },
    { label: "High", value: tick?.day_high ? tick.day_high.toFixed(2) : "—", cls: "bid" },
    { label: "Low", value: tick?.day_low ? tick.day_low.toFixed(2) : "—", cls: "ask" },
    { label: "Volume", value: tick?.volume ? tick.volume.toLocaleString() : "—" },
    { label: "Exch", value: market?.exchange ?? "US" },
    { label: "Time", value: market?.local_time ?? "—" },
  ];

  return (
    <header className="trader-header bb-header dense-header">
      <div className="trader-header-row dense-header-row">
        <div className="bb-logo-block">
          <Link href="/" className="bb-logo-link" title="Home">
            <div className="bb-logo oa-logo">OA</div>
          </Link>
          <div>
            <div className="trader-brand-title">
              <Link href="/terminal" className="trader-brand-link">{PRODUCT_NAME}</Link>
            </div>
            <div className="trader-brand-sub mono">{symbol} · {PRODUCT_MOTTO} · {PRODUCT_TAGLINE}</div>
          </div>
        </div>
        <SymbolSelector
          symbol={symbol}
          price={price > 0 ? price : null}
          change={tick?.change}
          changePct={tick?.change_pct}
          onChange={onSymbolChange}
          loading={symbolLoading}
          dark
          marketOpen={marketOpen}
        />
        {marketOpen && connected && (
          <div className="trader-status">
            <span className="status-dot live" />
            <span className="bb-status-label">LIVE</span>
          </div>
        )}
      </div>
      <div className="trader-metrics dense-metrics">
        {metrics.map((m) => (
          <div key={m.label} className="trader-metric dense-metric">
            <div className="trader-metric-label">{m.label}</div>
            <div className={`trader-metric-value mono ${m.cls || ""}`}>{m.value}</div>
          </div>
        ))}
      </div>
    </header>
  );
}
