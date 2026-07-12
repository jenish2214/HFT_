import type { Stage } from "./ActivityLog";
import { STAGE_COLOR } from "./ActivityLog";

const STEPS: { id: Stage; label: string; desc: string }[] = [
  { id: "feed", label: "Market Feed", desc: "Price update arrives" },
  { id: "strategy", label: "Strategy", desc: "Quotes around mid" },
  { id: "gateway", label: "Order Gateway", desc: "Order routed" },
  { id: "engine", label: "Matching Engine", desc: "Price-time match" },
  { id: "fill", label: "Fill", desc: "Position updated" },
];

interface Props {
  activeStage?: Stage;
}

export default function Pipeline({ activeStage = "feed" }: Props) {
  return (
    <div className="panel">
      <div className="panel-title">Data pipeline</div>
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
        The activity log shows each step. The highlighted stage matches the latest event.
      </p>
    </div>
  );
}
