"use client";

import type { BbFunction } from "@/lib/bloombergCommands";

const FUNCTIONS: { key: BbFunction; label: string }[] = [
  { key: "GP", label: "Graph" },
  { key: "IB", label: "I-Bank" },
  { key: "RES", label: "Research" },
  { key: "FA", label: "Fundamentals" },
  { key: "DES", label: "Description" },
  { key: "CN", label: "Company News" },
  { key: "HP", label: "Historical" },
  { key: "WEI", label: "World Indices" },
  { key: "MON", label: "Monitor" },
  { key: "HELP", label: "Help" },
];

interface Props {
  active?: BbFunction;
  onSelect?: (key: BbFunction) => void;
}

export default function BloombergFunctionBar({ active = "FA", onSelect }: Props) {
  return (
    <div className="bb-fn-bar">
      {FUNCTIONS.map((fn) => (
        <button
          key={fn.key}
          type="button"
          className={`bb-fn-key${active === fn.key ? " bb-fn-key-active" : ""}`}
          title={fn.label}
          onClick={() => onSelect?.(fn.key)}
        >
          <span className="bb-fn-key-code">{fn.key}</span>
          <span className="bb-fn-key-label">{fn.label}</span>
        </button>
      ))}
    </div>
  );
}
