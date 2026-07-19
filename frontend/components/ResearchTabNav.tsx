"use client";

import type { ReactNode } from "react";

export type ResearchTabId = "overview" | "performance" | "analysis" | "risk";

const TABS: { id: ResearchTabId; label: string }[] = [
  { id: "overview", label: "Overview" },
  { id: "performance", label: "Performance" },
  { id: "analysis", label: "Analysis" },
  { id: "risk", label: "Risk" },
];

interface Props {
  active: ResearchTabId;
  onChange: (tab: ResearchTabId) => void;
  symbol?: string;
}

/** Simple research section tabs. */
export default function ResearchTabNav({ active, onChange }: Props) {
  return (
    <nav className="qr-tabs-wrap" aria-label="Research sections">
      <div className="qr-tabs">
        {TABS.map((tab) => (
          <button
            key={tab.id}
            type="button"
            className={`qr-tab${active === tab.id ? " qr-tab-active" : ""}`}
            onClick={() => onChange(tab.id)}
            aria-current={active === tab.id ? "page" : undefined}
          >
            <span className="qr-tab-label">{tab.label}</span>
          </button>
        ))}
      </div>
    </nav>
  );
}

export function ResearchTabPanel({
  id,
  active,
  children,
}: {
  id: ResearchTabId;
  active: ResearchTabId;
  children: ReactNode;
}) {
  if (id !== active) return null;
  return <div className="qr-tab-panel">{children}</div>;
}
