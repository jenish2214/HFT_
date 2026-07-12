"use client";

import type { ReactNode } from "react";
import { SUPPORT_EMAIL } from "@/lib/orionAlpha";
import type { LabDataQuality } from "@/lib/runtimeEnv";

interface Props {
  quality: LabDataQuality;
  latencyMs?: number;
  via?: string;
  className?: string;
}

function fmtLatency(ms?: number): string {
  if (ms == null || ms <= 0) return "";
  if (ms < 1000) return `${ms}ms`;
  return `${(ms / 1000).toFixed(1)}s`;
}

export default function LabDataQualityBanner({ quality, latencyMs, via, className = "" }: Props) {
  if (quality === "unavailable") return null;

  const mail = (
    <a href={`mailto:${SUPPORT_EMAIL}`} className="qr-lab-banner-mail">
      {SUPPORT_EMAIL}
    </a>
  );

  let title = "";
  let body: ReactNode = null;
  let tone: "good" | "info" | "warn" = "info";

  switch (quality) {
    case "full-local":
      tone = "good";
      title = "Local lab — full study scores";
      body = (
        <>
          Running locally via the <code className="qr-lab-banner-code">/api</code> proxy — momentum levels, pattern study scores,
          and Monte Carlo exercises load when the Python backend is up
          {latencyMs ? <> ({fmtLatency(latencyMs)})</> : ""}.
        </>
      );
      break;
    case "full-remote":
      tone = "info";
      title = "Cloud lab — data loaded";
      body = (
        <>
          Deployed environments can be slower than local. If scores look stale or incomplete,
          run <code className="qr-lab-banner-code">./scripts/run.sh</code> locally or contact {mail}.
          {latencyMs ? <> Response {fmtLatency(latencyMs)}.</> : null}
        </>
      );
      break;
    case "delayed":
      tone = "warn";
      title = "Data delay on deploy";
      body = (
        <>
          The cloud API returned slowly or incomplete lab data
          {latencyMs ? <> ({fmtLatency(latencyMs)})</> : ""}.
          For the full educational experience, use local dev or email {mail} if this persists on deploy.
        </>
      );
      break;
    case "partial":
      tone = "warn";
      title = "Partial lab data only";
      body = (
        <>
          Full quant exercises did not load — showing limited profile data.
          Local mode usually returns complete study scores. Need help? {mail}
        </>
      );
      break;
    default:
      return null;
  }

  return (
    <aside
      className={`qr-lab-banner qr-lab-banner-${tone} ${className}`.trim()}
      role="status"
      aria-live="polite"
    >
      <span className="qr-lab-banner-badge mono">{tone === "good" ? "Local" : tone === "warn" ? "Notice" : "Deploy"}</span>
      <div>
        <strong className="qr-lab-banner-title">{title}</strong>
        <p className="qr-lab-banner-body">{body}</p>
        {via && quality === "full-local" && (
          <p className="qr-lab-banner-via mono">via {via.replace("http://", "")}</p>
        )}
      </div>
    </aside>
  );
}
