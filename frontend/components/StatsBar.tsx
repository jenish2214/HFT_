import type { Stats } from "@/lib/marketTypes";

interface Props {
  stats: Stats;
  lastLatency: number;
  spread: number;
  mid: number;
}

function fmtNs(ns: number): string {
  if (ns < 1000) return `${ns.toFixed(0)} ns`;
  if (ns < 1_000_000) return `${(ns / 1000).toFixed(1)} µs`;
  return `${(ns / 1_000_000).toFixed(2)} ms`;
}

export default function StatsBar({ stats, lastLatency, spread, mid }: Props) {
  const items = [
    { label: "Mid Price", value: mid > 0 ? `$${mid.toFixed(2)}` : "—" },
    { label: "Spread", value: spread > 0 ? `$${spread.toFixed(2)}` : "—" },
    { label: "Last Match", value: lastLatency > 0 ? fmtNs(lastLatency) : "—" },
    { label: "Avg Latency", value: stats.avg_latency_ns > 0 ? fmtNs(stats.avg_latency_ns) : "—" },
    { label: "Total Orders", value: String(stats.total_orders) },
    { label: "Total Trades", value: String(stats.total_trades) },
  ];

  return (
    <div style={{
      background: "#fff", borderBottom: "1px solid #d4d4d4",
      display: "flex", gap: 0, overflowX: "auto",
    }}>
      {items.map((item) => (
        <div key={item.label} style={{
          flex: "1 0 auto", padding: "10px 20px",
          borderRight: "1px solid #d4d4d4", minWidth: 120,
        }}>
          <div style={{ fontSize: 10, color: "#666", textTransform: "uppercase", letterSpacing: "0.06em" }}>
            {item.label}
          </div>
          <div className="mono" style={{ fontSize: 15, fontWeight: 600, marginTop: 2 }}>
            {item.value}
          </div>
        </div>
      ))}
    </div>
  );
}
