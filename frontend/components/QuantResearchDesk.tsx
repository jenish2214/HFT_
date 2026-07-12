"use client";

import type { ReactNode } from "react";
import type { QuantResearchData } from "@/lib/quantResearchTypes";

export interface KpiItem {
  label: string;
  value: string;
  tone?: "pos" | "neg" | "neutral";
}

export function ResearchDeskBar({ data, primary }: { data: QuantResearchData; primary: string }) {
  const risk = data.risk_metrics.find((r) => r.symbol === primary);
  const capm = data.capm.find((c) => c.symbol === primary);
  const factor = data.factor_scores.find((f) => f.symbol === primary);
  const mc = data.monte_carlo.find((m) => m.symbol === primary);
  const profile = data.primary_profile ?? data.company_profiles?.[primary];

  const kpis: KpiItem[] = [
    { label: "Last", value: risk?.latest_price != null ? `$${risk.latest_price.toFixed(2)}` : "—" },
    { label: "Sharpe", value: risk?.sharpe != null ? String(risk.sharpe) : "—" },
    { label: "Ann vol", value: risk?.ann_vol_pct != null ? `${risk.ann_vol_pct}%` : "—" },
    { label: "Max DD", value: risk?.max_drawdown_pct != null ? `${risk.max_drawdown_pct}%` : "—", tone: "neg" },
    { label: "Alpha", value: capm?.alpha_ann_pct != null ? `${capm.alpha_ann_pct}%` : "—", tone: (capm?.alpha_ann_pct ?? 0) >= 0 ? "pos" : "neg" },
    { label: "Beta", value: capm?.beta != null ? String(capm.beta) : "—" },
    { label: "Composite α", value: factor?.composite_alpha?.toFixed(3) ?? "—" },
    { label: "RSI 14", value: factor?.rsi_14?.toFixed(1) ?? "—" },
    { label: "MC median", value: mc?.p50 != null ? `$${mc.p50.toFixed(2)}` : "—" },
  ];

  return (
    <section className="qr-desk-bar site-section-wide">
      <div className="qr-desk-bar-top">
        <div className="qr-desk-identity">
          <span className="qr-desk-code mono">QR</span>
          <div>
            <h2 className="qr-desk-symbol mono">{primary}</h2>
            <p className="qr-desk-name">{profile?.name ?? primary}</p>
          </div>
        </div>
        <div className="qr-desk-tags mono">
          <span>{data.period.toUpperCase()}</span>
          <span>{data.trading_days} sessions</span>
          <span>{data.date_range.start} → {data.date_range.end}</span>
          <span>Bench {data.benchmark}</span>
          <span>Universe {data.tickers.join(", ")}</span>
        </div>
      </div>
      <div className="qr-desk-kpi-row">
        {kpis.map((k) => (
          <div key={k.label} className="qr-desk-kpi">
            <span className="qr-desk-kpi-label">{k.label}</span>
            <strong className={`mono qr-desk-kpi-val${k.tone ? ` qr-desk-kpi-${k.tone}` : ""}`}>{k.value}</strong>
          </div>
        ))}
      </div>
      <p className="qr-desk-verdict">{data.summary.recommendation}</p>
    </section>
  );
}

export function ChartDeskHeader({
  code,
  title,
  subtitle,
  tags,
}: {
  code: string;
  title: string;
  subtitle?: string;
  tags?: string[];
}) {
  return (
    <header className="qr-chart-desk-head">
      <div className="qr-chart-desk-title-row">
        <span className="qr-chart-code mono">{code}</span>
        <div>
          <h3 className="qr-chart-title">{title}</h3>
          {subtitle && <p className="qr-chart-sub">{subtitle}</p>}
        </div>
      </div>
      {tags && tags.length > 0 && (
        <div className="qr-chart-tags mono">
          {tags.map((t) => <span key={t}>{t}</span>)}
        </div>
      )}
    </header>
  );
}

export function ChartKpiStrip({ items }: { items: KpiItem[] }) {
  if (!items.length) return null;
  return (
    <div className="qr-chart-kpi-strip">
      {items.map((k) => (
        <div key={k.label} className="qr-chart-kpi">
          <span className="qr-chart-kpi-label">{k.label}</span>
          <strong className={`mono qr-chart-kpi-val${k.tone ? ` qr-chart-kpi-${k.tone}` : ""}`}>{k.value}</strong>
        </div>
      ))}
    </div>
  );
}

export function ChartFootnote({ children }: { children: ReactNode }) {
  return <p className="qr-chart-footnote mono">{children}</p>;
}
