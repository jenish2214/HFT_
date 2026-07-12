import type { Trade } from "@/app/page";

interface Props {
  trades: Trade[];
  isLive?: boolean;
}

export default function TradeTape({ trades, isLive = false }: Props) {
  return (
    <div className="panel">
      <div className="panel-head">
        <span className="panel-title">T&S — Time &amp; Sales</span>
        {isLive && <span className="md-live-badge">LIVE</span>}
      </div>
      <div className="panel-body tape-body">
        <table>
          <thead>
            <tr>
              <th style={{ textAlign: "left" }}>Time</th>
              <th>Side</th>
              <th>Price</th>
              <th>Qty</th>
            </tr>
          </thead>
          <tbody>
            {trades.length === 0 && (
              <tr><td colSpan={4} style={{ textAlign: "center", color: "var(--text-muted)", padding: 20 }}>
                No trades yet
              </td></tr>
            )}
            {trades.map((t, i) => (
              <tr key={`${t.id}-${t.timestamp_ns}`} className={i === 0 && isLive ? "tape-row-new" : ""}>
                <td style={{ textAlign: "left", color: "var(--text-muted)", fontSize: 10 }}>
                  {new Date(t.timestamp_ns / 1e6).toLocaleTimeString()}
                </td>
                <td className={t.side === "BUY" ? "bid" : "ask"}>{t.side || "—"}</td>
                <td>${t.price.toFixed(2)}</td>
                <td>{t.qty}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
