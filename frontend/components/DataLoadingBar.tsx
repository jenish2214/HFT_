"use client";

import { Loader2 } from "lucide-react";

interface Props {
  active: boolean;
  label?: string;
  slow?: boolean;
}

/** Top loading bar for slow API / research fetches. */
export default function DataLoadingBar({ active, label = "Loading data…", slow = false }: Props) {
  if (!active) return null;

  return (
    <div className={`oa-load-bar${slow ? " oa-load-bar-slow" : ""}`} role="status" aria-live="polite">
      <Loader2 className="oa-load-bar-icon" size={14} aria-hidden />
      <span>{slow ? "Still loading — data may be delayed on deploy" : label}</span>
    </div>
  );
}
