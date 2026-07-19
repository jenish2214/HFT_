"use client";

import type { ReactNode } from "react";

export type AboutTabId = "overview" | "team" | "strategy" | "values" | "contact";

export const ABOUT_TABS: { id: AboutTabId; label: string }[] = [
  { id: "overview", label: "Overview" },
  { id: "team", label: "Our team" },
  { id: "strategy", label: "Strategy" },
  { id: "values", label: "Values" },
  { id: "contact", label: "Contact" },
];

interface Props {
  active: AboutTabId;
  onChange: (tab: AboutTabId) => void;
}

export default function AboutTabNav({ active, onChange }: Props) {
  return (
    <div className="oa-about-tabs-wrap">
      <nav className="oa-about-tabs" aria-label="About sections" role="tablist">
        {ABOUT_TABS.map((tab) => (
          <button
            key={tab.id}
            type="button"
            role="tab"
            className={`oa-about-tab${active === tab.id ? " is-active" : ""}`}
            onClick={() => onChange(tab.id)}
            aria-selected={active === tab.id}
            aria-controls={`about-panel-${tab.id}`}
          >
            {tab.label}
          </button>
        ))}
      </nav>
    </div>
  );
}

export function AboutTabPanel({
  id,
  active,
  children,
}: {
  id: AboutTabId;
  active: AboutTabId;
  children: ReactNode;
}) {
  if (id !== active) return null;
  return (
    <div className="oa-about-panel" role="tabpanel" id={`about-panel-${id}`}>
      {children}
    </div>
  );
}
