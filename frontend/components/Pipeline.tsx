import type { Stage } from "./ActivityLog";
import { STAGE_COLOR } from "./ActivityLog";

const STEPS: { id: Stage; label: string; desc: string }[] = [
  { id: "feed", label: "Market Feed", desc: "yfinance sends bid/ask/last price" },
  { id: "strategy", label: "Strategy", desc: "Algo computes quotes around mid" },
  { id: "gateway", label: "Order Gateway", desc: "Python routes order to engine" },
  { id: "engine", label: "Matching Engine", desc: "C++ matches by price-time priority" },
  { id: "fill", label: "Fill", desc: "Trade done, position & P&L updated" },
];

interface Props {
  activeStage?: Stage;
}

export default function Pipeline({ activeStage = "feed" }: Props) {
  return (
    <div className="panel">
      <div className="panel-title">How HFT Works — Data Pipeline</div>
      <div style={{ display: "flex", alignItems: "center", gap: 0, overflowX: "auto" }}>
        {STEPS.map((step, i) => {
          const active = step.id === activeStage;
          return (
            <div key={step.id} style={{ display: "flex", alignItems: "center" }}>
              <div
                style={{
                  border: `2px solid ${active ? STAGE_COLOR[step.id] : "#d4d4d4"}`,
                  background: active ? "#fafafa" : "#fff",
                  padding: "10px 16px",
                  minWidth: 140,
                  textAlign: "center",
                }}
              >
                <div style={{ fontSize: 12, fontWeight: 600, color: active ? STAGE_COLOR[step.id] : "#1a1a1a" }}>
                  {step.label}
                </div>
                <div style={{ fontSize: 11, color: "#666", marginTop: 4 }}>{step.desc}</div>
              </div>
              {i < STEPS.length - 1 && (
                <div style={{ color: "#999", fontSize: 18, padding: "0 8px" }}>→</div>
              )}
            </div>
          );
        })}
      </div>
      <p style={{ fontSize: 12, color: "#666", marginTop: 12, lineHeight: 1.6 }}>
        Watch the <strong>Live Activity</strong> log below — each row shows one step in the loop.
        The highlighted pipeline stage matches the latest event. Demo mode injects sample trades
        so you can see fills, latency, and P&L update in real time.
      </p>
    </div>
  );
}
