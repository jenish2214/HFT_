import type { Stage } from "./ActivityLog";
import { STAGE_COLOR } from "./ActivityLog";

const STEPS: { id: Stage; label: string }[] = [
  { id: "feed", label: "Market Feed" },
  { id: "strategy", label: "Strategy" },
  { id: "gateway", label: "Gateway" },
  { id: "engine", label: "Engine" },
  { id: "fill", label: "Fill" },
];

interface Props {
  activeStage?: Stage;
}

export default function PipelineCompact({ activeStage = "feed" }: Props) {
  return (
    <div className="pipeline-compact">
      {STEPS.map((s, i) => (
        <span key={s.id} style={{ display: "flex", alignItems: "center", gap: 4 }}>
          <span className={`pipeline-step ${activeStage === s.id ? "pipeline-step-active" : ""}`}>
            {s.label}
          </span>
          {i < STEPS.length - 1 && <span style={{ color: "var(--border)" }}>→</span>}
        </span>
      ))}
    </div>
  );
}

export { STAGE_COLOR };
