"use client";

import type { ReactNode } from "react";

export type ResearchTabId = "overview" | "performance" | "analysis" | "risk";

const TABS: { id: ResearchTabId; label: string; hint: string }[] = [
  { id: "overview", label: "Overview", hint: "Profile & peers" },
  { id: "performance", label: "Performance", hint: "Full risk report" },
  { id: "analysis", label: "Analysis", hint: "Momentum & charts" },
  { id: "risk", label: "Risk & factors", hint: "Metrics & CAPM" },
];

interface Props {
  active: ResearchTabId;
  onChange: (tab: ResearchTabId) => void;
  symbol?: string;
}

export default function ResearchTabNav({ active, onChange, symbol }: Props) {
  return (
    <div className="qr-tabs-wrap site-section-wide">
      <nav className="qr-tabs" aria-label="Research sections">
        {TABS.map((tab) => (
          <button
            key={tab.id}
            type="button"
            className={`qr-tab${active === tab.id ? " qr-tab-active" : ""}`}
            onClick={() => onChange(tab.id)}
            aria-current={active === tab.id ? "page" : undefined}
          >
            <span className="qr-tab-label">{tab.label}</span>
            <span className="qr-tab-hint">{tab.hint}</span>
          </button>
        ))}
      </nav>
      {symbol && (
        <p className="qr-tabs-symbol mono" aria-live="polite">
          Viewing <strong>{symbol}</strong>
        </p>
      )}
    </div>
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
