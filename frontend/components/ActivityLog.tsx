export type Stage = "feed" | "strategy" | "gateway" | "engine" | "fill";

export interface DemoEvent {
  ts: number;
  stage: Stage;
  message: string;
  detail: string;
}

const STAGE_LABEL: Record<Stage, string> = {
  feed: "FEED", strategy: "STRAT", gateway: "GW", engine: "ENG", fill: "FILL",
};

const STAGE_COLOR: Record<Stage, string> = {
  feed: "#2962ff", strategy: "#8b5cf6", gateway: "#f59e0b", engine: "#26a69a", fill: "#4ade80",
};

interface Props {
  events: DemoEvent[];
  activeStage?: Stage;
}

export default function ActivityLog({ events, activeStage }: Props) {
  return (
    <div className="panel">
      <div className="panel-head">
        <span className="panel-title">Execution Log</span>
        <span style={{ fontSize: 10, color: "var(--text-muted)" }}>{events.length} events</span>
      </div>
      <div className="panel-body" style={{ maxHeight: 200, padding: "4px 12px" }}>
        {events.length === 0 && (
          <p style={{ color: "var(--text-muted)", fontSize: 11, padding: 8 }}>Waiting for events…</p>
        )}
        {events.slice(0, 30).map((ev, i) => (
          <div key={`${ev.ts}-${i}`} className="event-row">
            <span className="event-tag" style={{ color: STAGE_COLOR[ev.stage], borderColor: STAGE_COLOR[ev.stage] }}>
              {STAGE_LABEL[ev.stage]}
            </span>
            <div style={{ flex: 1 }}>
              <div style={{ opacity: i === 0 ? 1 : 0.85 }}>{ev.message}</div>
              {ev.detail && <div style={{ fontSize: 10, color: "var(--text-muted)", marginTop: 1 }}>{ev.detail}</div>}
            </div>
            <span className="mono" style={{ fontSize: 9, color: "var(--text-muted)" }}>
              {new Date(ev.ts * 1000).toLocaleTimeString()}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}

export { STAGE_LABEL, STAGE_COLOR };
