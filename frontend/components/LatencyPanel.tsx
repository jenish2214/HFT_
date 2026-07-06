interface Props {
  history: { ts: number; latency_ns: number }[];
  avgNs: number;
}

function formatLatency(ns: number): string {
  if (ns < 1000) return `${ns.toFixed(0)} ns`;
  if (ns < 1_000_000) return `${(ns / 1000).toFixed(1)} µs`;
  return `${(ns / 1_000_000).toFixed(2)} ms`;
}

export default function LatencyPanel({ history, avgNs }: Props) {
  const maxNs = Math.max(...history.map((h) => h.latency_ns), 1);
  const recent = history.slice(0, 40).reverse();

  return (
    <div className="panel">
      <div className="panel-head">
        <span className="panel-title">Engine Latency</span>
        <span className="mono" style={{ fontSize: 11 }}>{avgNs > 0 ? formatLatency(avgNs) : "—"} avg</span>
      </div>
      <div className="panel-body">
        <div style={{ display: "flex", alignItems: "flex-end", gap: 1, height: 48 }}>
          {recent.length === 0 && <span style={{ color: "var(--text-muted)", fontSize: 11 }}>Collecting…</span>}
          {recent.map((h, i) => (
            <div
              key={i}
              title={formatLatency(h.latency_ns)}
              style={{
                flex: 1, minWidth: 2,
                height: `${Math.max(4, (h.latency_ns / maxNs) * 100)}%`,
                background: h.latency_ns < 10000 ? "var(--green)" : "var(--blue)",
              }}
            />
          ))}
        </div>
        <div style={{ fontSize: 10, color: "var(--text-muted)", marginTop: 8 }}>
          C++ matching engine · sub-µs target in production HFT
        </div>
      </div>
    </div>
  );
}
