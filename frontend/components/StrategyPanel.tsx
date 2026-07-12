import type { StrategyInfo } from "@/lib/marketTypes";

interface Props {
  strategy: StrategyInfo;
}

export default function StrategyPanelContent({ strategy }: Props) {
  const total = strategy.total_pnl ?? 0;

  return (
    <>
      <div className="portfolio-headline mono">
        <span className="portfolio-headline-label">Bot P&L</span>
        <span className={`portfolio-headline-value ${total >= 0 ? "pnl-pos" : "pnl-neg"}`}>
          {total >= 0 ? "+" : ""}${Math.abs(total).toFixed(2)}
        </span>
      </div>
      <div className="pnl-summary">
        <div className="pnl-summary-item">
          <span className="pnl-summary-label">Total P&L</span>
          <span className={`pnl-summary-value mono ${total >= 0 ? "pnl-pos" : "pnl-neg"}`}>
            {total >= 0 ? "+" : ""}${Math.abs(total).toFixed(2)}
          </span>
        </div>
        <div className="pnl-summary-item">
          <span className="pnl-summary-label">Realized</span>
          <span className={`mono ${(strategy.realized_pnl ?? 0) >= 0 ? "pnl-pos" : "pnl-neg"}`}>
            ${(strategy.realized_pnl ?? 0).toFixed(2)}
          </span>
        </div>
        <div className="pnl-summary-item">
          <span className="pnl-summary-label">Unrealized</span>
          <span className={`mono ${(strategy.unrealized_pnl ?? 0) >= 0 ? "pnl-pos" : "pnl-neg"}`}>
            ${(strategy.unrealized_pnl ?? 0).toFixed(2)}
          </span>
        </div>
      </div>
      <div className="data-grid">
        <Cell label="Position" value={`${strategy.position} shrs`} />
        <Cell label="Avg Entry" value={strategy.avg_entry ? `$${strategy.avg_entry.toFixed(2)}` : "—"} />
        <Cell label="Orders" value={String(strategy.orders_sent)} />
        <Cell label="Fills" value={String(strategy.fills)} />
      </div>
    </>
  );
}

function Cell({ label, value }: { label: string; value: string }) {
  return (
    <div className="data-cell">
      <div className="data-cell-label">{label}</div>
      <div className="data-cell-value mono">{value}</div>
    </div>
  );
}
