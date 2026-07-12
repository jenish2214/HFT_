import type { TickInfo } from "@/lib/marketTypes";
import PanelLoading from "@/components/PanelLoading";

interface Props {
  tick: TickInfo | null;
  compact?: boolean;
  marketOpen?: boolean;
  lastUpdateTs?: number;
}

function fmtMoney(n?: number): string {
  return n && n > 0 ? `$${n.toFixed(2)}` : "—";
}

export default function MarketDataPanel({ tick, compact = false, marketOpen = false, lastUpdateTs = 0 }: Props) {
  if (!tick) {
    return (
      <div className="panel">
        <div className="panel-head"><span className="panel-title">Quote</span></div>
        <div className="panel-body dense-pad">
          <PanelLoading message="Waiting for quote…" skeleton="grid" marketOpen={marketOpen} />
        </div>
      </div>
    );
  }

  const change = tick.change ?? 0;
  const changePct = tick.change_pct ?? 0;
  const spread = tick.bid > 0 && tick.ask > 0 ? tick.ask - tick.bid : 0;
  const range = (tick.day_high ?? 0) - (tick.day_low ?? 0);
  const posPct = range > 0 ? ((tick.price - (tick.day_low ?? 0)) / range) * 100 : 50;
  const hasRange = (tick.day_high ?? 0) > 0 && (tick.day_low ?? 0) > 0;
  const up = change >= 0;

  const fields = [
    { label: "Last", value: fmtMoney(tick.price), cls: marketOpen ? "md-last-live" : "" },
    { label: "Chg", value: `${up ? "+" : ""}${change.toFixed(2)}`, cls: up ? "report-emphasis" : "report-dim" },
    { label: "Chg%", value: `${up ? "+" : ""}${changePct.toFixed(2)}%`, cls: up ? "report-emphasis" : "report-dim" },
    { label: "Bid", value: fmtMoney(tick.bid) },
    { label: "Ask", value: fmtMoney(tick.ask) },
    { label: "Spr", value: spread > 0 ? spread.toFixed(2) : "—" },
    { label: "Open", value: fmtMoney(tick.open) },
    { label: "Prev", value: fmtMoney(tick.prev_close) },
    { label: "High", value: fmtMoney(tick.day_high) },
    { label: "Low", value: fmtMoney(tick.day_low) },
    { label: "Vol", value: tick.volume ? tick.volume.toLocaleString() : "—" },
    { label: "Src", value: marketOpen && tick.source?.includes("live") ? "LIVE" : "YF", cls: marketOpen && tick.source?.includes("live") ? "report-emphasis" : "dense-muted" },
  ];

  return (
    <div className="panel">
      <div className="panel-head dense-head">
        <span className="panel-title">{tick.symbol} Quote</span>
        <div className="dense-head-right">
          {marketOpen && tick.source?.includes("live") && <span className="md-live-badge">LIVE</span>}
          <span className={`mono dense-chg ${up ? "report-emphasis" : "report-dim"}`}>
            {fmtMoney(tick.price)} {up ? "+" : ""}{changePct.toFixed(2)}%
          </span>
        </div>
      </div>
      <div className={`panel-body dense-pad ${compact ? "md-dense" : ""}`}>
        <div className="data-grid data-grid-dense">
          {fields.map((f) => (
            <div key={f.label} className="data-cell data-cell-dense">
              <div className="data-cell-label">{f.label}</div>
              <div className={`data-cell-value mono ${f.cls || ""}`}>{f.value}</div>
            </div>
          ))}
        </div>

        {hasRange && (
          <div className="day-range day-range-dense">
            <div className="day-range-track">
              <div className="day-range-fill" style={{ width: "100%" }} />
              <div className="day-range-marker" style={{ left: `${posPct}%` }} />
            </div>
            <div className="day-range-labels mono dense-range-labels">
              <span>L {fmtMoney(tick.day_low)}</span>
              <span>Last {fmtMoney(tick.price)}</span>
              <span>H {fmtMoney(tick.day_high)}</span>
            </div>
          </div>
        )}

        {marketOpen && lastUpdateTs > 0 && (
          <div className="md-updated mono dense-updated">
            Updated {new Date(lastUpdateTs * 1000).toLocaleTimeString()}
          </div>
        )}
      </div>
    </div>
  );
}
