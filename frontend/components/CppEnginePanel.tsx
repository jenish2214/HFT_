"use client";

import type { Stats } from "@/lib/marketTypes";

interface Props {
  stats: Stats | null;
  connected?: boolean;
}

function fmtLatency(ns: number): string {
  if (!ns || ns <= 0) return "—";
  if (ns < 1000) return `${ns}ns`;
  if (ns < 1_000_000) return `${(ns / 1000).toFixed(1)}µs`;
  return `${(ns / 1_000_000).toFixed(2)}ms`;
}

export default function CppEnginePanel({ stats, connected }: Props) {
  return (
    <div className="panel cpp-engine-panel">
      <div className="panel-head">
        <span className="panel-title">C++ Matching Engine</span>
        <span className={`cpp-engine-dot${connected ? " cpp-engine-live" : ""}`} title={connected ? "Engine linked" : "Offline"} />
      </div>
      <div className="panel-body cpp-engine-body mono">
        <div className="cpp-engine-row">
          <span className="cpp-engine-label">Order Book</span>
          <span className="cpp-engine-val">Level II · C++</span>
        </div>
        <div className="cpp-engine-row">
          <span className="cpp-engine-label">Avg Latency</span>
          <span className="cpp-engine-val bb-orange-text">{fmtLatency(stats?.avg_latency_ns ?? 0)}</span>
        </div>
        <div className="cpp-engine-row">
          <span className="cpp-engine-label">Orders</span>
          <span className="cpp-engine-val">{stats?.total_orders?.toLocaleString() ?? "—"}</span>
        </div>
        <div className="cpp-engine-row">
          <span className="cpp-engine-label">Fills</span>
          <span className="cpp-engine-val">{stats?.total_trades?.toLocaleString() ?? "—"}</span>
        </div>
        <div className="cpp-engine-tag">HFT Engine · port 9001</div>
      </div>
    </div>
  );
}
