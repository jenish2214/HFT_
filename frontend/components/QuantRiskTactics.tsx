"use client";

import { useMemo } from "react";
import type { QuantResearchData } from "@/lib/quantResearchTypes";
import { buildRiskTactics } from "@/lib/quantRiskTactics";

interface Props {
  data: QuantResearchData;
  primary: string;
}

function PerspectiveBlock({
  label,
  code,
  items,
}: {
  label: string;
  code: string;
  items: ReturnType<typeof buildRiskTactics>;
}) {
  if (!items.length) return null;
  return (
    <div className="qr-risk-block">
      <header className="qr-risk-block-head">
        <span className="qr-risk-code mono">{code}</span>
        <h3 className="qr-risk-block-title">{label}</h3>
      </header>
      <div className="qr-risk-list">
        {items.map((t) => (
          <article key={t.id} className={`qr-risk-card qr-risk-${t.priority}`}>
            <div className="qr-risk-card-head">
              <h4 className="qr-risk-card-title">{t.title}</h4>
              <span className={`qr-risk-priority mono qr-risk-priority-${t.priority}`}>{t.priority}</span>
            </div>
            <p className="qr-risk-action mono">{t.action}</p>
            <p className="qr-risk-rationale">{t.rationale}</p>
          </article>
        ))}
      </div>
    </div>
  );
}

export default function QuantRiskTactics({ data, primary }: Props) {
  const tactics = useMemo(() => buildRiskTactics(data, primary), [data, primary]);
  const trader = tactics.filter((t) => t.perspective === "trader");
  const investor = tactics.filter((t) => t.perspective === "investor");

  return (
    <section className="site-section site-section-wide qr-risk-section">
      <div className="qr-risk-head">
        <span className="qr-risk-desk-code mono">RISK</span>
        <div>
          <h2 className="site-section-title">Risk management tactics</h2>
          <p className="site-section-lead">
            Desk-style suggestions for {primary} — trader execution guardrails and investor allocation framing, derived from live quant outputs.
          </p>
        </div>
      </div>
      <div className="qr-risk-grid">
        <PerspectiveBlock label="Trader desk — execution & hedging" code="TRD" items={trader} />
        <PerspectiveBlock label="Investor desk — allocation & sleeves" code="INV" items={investor} />
      </div>
    </section>
  );
}
