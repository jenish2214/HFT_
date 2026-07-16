"use client";

import type { ReactNode } from "react";

export type AboutTabId = "overview" | "team" | "strategy" | "values" | "contact";

export const ABOUT_TABS: { id: AboutTabId; label: string; hint: string }[] = [
  { id: "overview", label: "Overview", hint: "Who we are" },
  { id: "team", label: "Our team", hint: "Expertise" },
  { id: "strategy", label: "Strategy", hint: "Growth & diversify" },
  { id: "values", label: "Values", hint: "What we stand for" },
  { id: "contact", label: "Contact", hint: "Reach our team" },
];

interface Props {
  active: AboutTabId;
  onChange: (tab: AboutTabId) => void;
}

export default function AboutTabNav({ active, onChange }: Props) {
  return (
    <div className="oa-about-tabs-wrap site-section-wide">
      <nav className="qr-tabs oa-about-tabs" aria-label="About sections">
        {ABOUT_TABS.map((tab) => (
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
    <div className="qr-tab-panel oa-about-panel" role="tabpanel" id={`about-panel-${id}`}>
      {children}
    </div>
  );
}
