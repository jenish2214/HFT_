"use client";

export interface WatchRow {
  symbol: string;
  price: number;
  change: number;
  change_pct: number;
}

interface Props {
  rows: WatchRow[];
  active: string;
  onSelect: (sym: string) => void;
}

export default function BloombergWatchlist({ rows, active, onSelect }: Props) {
  return (
    <div className="panel bb-panel">
      <div className="panel-head">
        <span className="panel-title">Monitor</span>
        <span className="bb-fn">F2</span>
      </div>
      <div className="panel-body wl-body">
        <table className="wl-table">
          <thead>
            <tr>
              <th style={{ textAlign: "left" }}>Sym</th>
              <th>Last</th>
              <th>Chg</th>
              <th>%</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((r) => {
              const up = (r.change_pct ?? 0) >= 0;
              const isActive = r.symbol === active;
              return (
                <tr
                  key={r.symbol}
                  className={`wl-row ${isActive ? "wl-active" : ""}`}
                  onClick={() => onSelect(r.symbol)}
                >
                  <td className="wl-sym">{r.symbol}</td>
                  <td className="mono">{r.price > 0 ? r.price.toFixed(2) : "—"}</td>
                  <td className={`mono ${up ? "pnl-pos" : "pnl-neg"}`}>
                    {r.price > 0 ? `${up ? "+" : ""}${(r.change ?? 0).toFixed(2)}` : "—"}
                  </td>
                  <td className={`mono ${up ? "pnl-pos" : "pnl-neg"}`}>
                    {r.price > 0 ? `${up ? "+" : ""}${r.change_pct.toFixed(2)}` : "—"}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}
