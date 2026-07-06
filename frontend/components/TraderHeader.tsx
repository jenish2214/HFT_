import type { UserInfo, TickInfo, MarketSession } from "@/app/page";
import SymbolSelector from "@/components/SymbolSelector";

interface Props {
  symbol: string;
  tick: TickInfo | null;
  user: UserInfo;
  connected: boolean;
  market?: MarketSession | null;
  onSymbolChange: (sym: string) => void;
  symbolLoading?: boolean;
}

function fmtPnl(n: number): string {
  const sign = n >= 0 ? "+" : "-";
  return `${sign}$${Math.abs(n).toFixed(2)}`;
}

export default function TraderHeader({
  symbol, tick, user, connected, market, onSymbolChange, symbolLoading,
}: Props) {
  const totalPnl = user.total_pnl ?? 0;
  const equity = user.equity ?? user.initial_equity ?? 0;
  const price = tick?.price ?? 0;
  const spread = tick && tick.bid > 0 && tick.ask > 0 ? tick.ask - tick.bid : 0;

  const metrics = [
    { label: "Equity", value: `$${equity.toLocaleString(undefined, { maximumFractionDigits: 0 })}` },
    { label: "P&L", value: fmtPnl(totalPnl), cls: totalPnl >= 0 ? "pnl-pos" : "pnl-neg" },
    { label: "Pos", value: `${user.position >= 0 ? "+" : ""}${user.position}` },
    { label: "BP", value: `$${(user.buying_power ?? 0).toLocaleString(undefined, { maximumFractionDigits: 0 })}` },
    { label: "Bid", value: tick?.bid ? `$${tick.bid.toFixed(2)}` : "—", cls: "bid" },
    { label: "Ask", value: tick?.ask ? `$${tick.ask.toFixed(2)}` : "—", cls: "ask" },
    { label: "Spr", value: spread > 0 ? spread.toFixed(2) : "—" },
    { label: "Open", value: tick?.open ? `$${tick.open.toFixed(2)}` : "—" },
    { label: "Hi", value: tick?.day_high ? `$${tick.day_high.toFixed(2)}` : "—", cls: "bid" },
    { label: "Lo", value: tick?.day_low ? `$${tick.day_low.toFixed(2)}` : "—", cls: "ask" },
    { label: "Vol", value: tick?.volume ? tick.volume.toLocaleString() : "—" },
    { label: "Exch", value: market?.exchange ?? "US" },
    { label: "Time", value: market?.local_time ?? "—" },
  ];

  return (
    <header className="trader-header bb-header dense-header">
      <div className="trader-header-row dense-header-row">
        <div className="bb-logo-block">
          <div className="bb-logo">BB</div>
          <div className="trader-brand-title">Terminal</div>
        </div>
        <SymbolSelector
          symbol={symbol}
          price={price > 0 ? price : null}
          change={tick?.change}
          changePct={tick?.change_pct}
          onChange={onSymbolChange}
          loading={symbolLoading}
          dark
          isLive={market?.is_live}
          isRegularHours={market?.is_regular_hours}
        />
        <div className="trader-status">
          <span className={`status-dot ${connected ? "live" : "offline"}`} />
          {connected ? "LIVE" : "OFF"}
          {market?.status && <span className="dense-status-tag">{market.status.toUpperCase()}</span>}
        </div>
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
