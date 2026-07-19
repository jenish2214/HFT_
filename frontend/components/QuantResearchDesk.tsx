"use client";

import type { ReactNode } from "react";
import type { QuantResearchData } from "@/lib/quantResearchTypes";

export type PnlTone = "pos" | "neg" | "neutral";

export interface KpiItem {
  label: string;
  value: string;
  tone?: PnlTone;
  hint?: string;
}

export function pnlTone(value: number | null | undefined, invert = false): PnlTone {
  if (value == null || Number.isNaN(value) || value === 0) return "neutral";
  const pos = value > 0;
  if (invert) return pos ? "neg" : "pos";
  return pos ? "pos" : "neg";
}

function fmtSignedPct(v: number | null | undefined, digits = 2): string {
  if (v == null) return "—";
  const sign = v > 0 ? "+" : "";
  return `${sign}${v.toFixed(digits)}%`;
}

function toneClass(tone?: PnlTone): string {
  if (tone === "pos") return " qr-pnl-bg-pos";
  if (tone === "neg") return " qr-pnl-bg-neg";
  return "";
}

export function ResearchDeskBar({ data, primary }: { data: QuantResearchData; primary: string }) {
  const risk = data.risk_metrics.find((r) => r.symbol === primary);
  const capm = data.capm.find((c) => c.symbol === primary);
  const qs = data.quantstats;
  const profile = data.primary_profile ?? data.company_profiles?.[primary];

  const cagr = qs?.cagr_pct ?? risk?.cagr_pct ?? null;
  const alpha = capm?.alpha_ann_pct ?? null;
  const sharpe = qs?.sharpe ?? risk?.sharpe ?? null;
  const maxDd = qs?.max_drawdown_pct ?? risk?.max_drawdown_pct ?? null;
  const winRate = qs?.win_rate_pct ?? null;
  const price = risk?.latest_price ?? null;

  const cagrTone = pnlTone(cagr);
  const alphaTone = pnlTone(alpha);
  const quoteTone = cagrTone !== "neutral" ? cagrTone : alphaTone;

  const kpis: KpiItem[] = [
    {
      label: "CAGR",
      value: fmtSignedPct(cagr),
      tone: cagrTone,
      hint: "Annualized return",
    },
    {
      label: "Alpha",
      value: fmtSignedPct(alpha),
      tone: alphaTone,
      hint: `vs ${data.benchmark}`,
    },
    {
      label: "Sharpe",
      value: sharpe != null ? sharpe.toFixed(2) : "—",
      tone: pnlTone(sharpe),
    },
    {
      label: "Ann vol",
      value: risk?.ann_vol_pct != null ? `${risk.ann_vol_pct}%` : "—",
      tone: "neutral",
    },
    {
      label: "Max DD",
      value: fmtSignedPct(maxDd),
      tone: maxDd != null ? "neg" : "neutral",
      hint: "Peak-to-trough loss",
    },
    {
      label: "Beta",
      value: capm?.beta != null ? String(capm.beta) : "—",
    },
    {
      label: "Calmar",
      value: qs?.calmar != null ? String(qs.calmar) : "—",
      tone: pnlTone(qs?.calmar ?? null),
    },
    {
      label: "Win rate",
      value: winRate != null ? `${winRate}%` : "—",
      tone: winRate == null ? "neutral" : winRate >= 50 ? "pos" : "neg",
    },
  ];

  return (
    <section className={`qr-desk-bar qr-desk-bar-pro${quoteTone !== "neutral" ? ` qr-desk-bar-${quoteTone}` : ""}`}>
      <div className="qr-desk-bar-top">
        <div className="qr-desk-identity">
          <span className="qr-desk-code mono">QR</span>
          <div>
            <h2 className="qr-desk-symbol mono">{primary}</h2>
            <p className="qr-desk-name">{profile?.name ?? primary}</p>
          </div>
        </div>

        <div className={`qr-desk-quote${toneClass(quoteTone)}`}>
          <div className="qr-desk-quote-main">
            <span className="qr-desk-quote-label">Last</span>
            <strong className="mono qr-desk-quote-price">
              {price != null ? `$${price.toFixed(2)}` : "—"}
            </strong>
          </div>
          <div className="qr-desk-quote-chg">
            <span className="qr-desk-quote-label">CAGR</span>
            <strong className={`mono qr-desk-quote-pct${quoteTone !== "neutral" ? ` pnl-${quoteTone}` : ""}`}>
              {fmtSignedPct(cagr)}
            </strong>
          </div>
          <div className="qr-desk-quote-chg">
            <span className="qr-desk-quote-label">Alpha</span>
            <strong className={`mono qr-desk-quote-pct${alphaTone !== "neutral" ? ` pnl-${alphaTone}` : ""}`}>
              {fmtSignedPct(alpha)}
            </strong>
          </div>
        </div>

        <div className="qr-desk-tags mono">
          <span>{data.period.toUpperCase()}</span>
          <span>{data.trading_days} sessions</span>
          <span>
            {data.date_range.start} → {data.date_range.end}
          </span>
          <span>Bench {data.benchmark}</span>
        </div>
      </div>

      <div className="qr-desk-kpi-row">
        {kpis.map((k) => (
          <div key={k.label} className={`qr-desk-kpi${toneClass(k.tone)}`} title={k.hint}>
            <span className="qr-desk-kpi-label">{k.label}</span>
            <strong
              className={`mono qr-desk-kpi-val${k.tone && k.tone !== "neutral" ? ` qr-desk-kpi-${k.tone} pnl-${k.tone}` : ""}`}
            >
              {k.value}
            </strong>
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
          {tags.map((t) => (
            <span key={t}>{t}</span>
          ))}
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
        <div key={k.label} className={`qr-chart-kpi${toneClass(k.tone)}`}>
          <span className="qr-chart-kpi-label">{k.label}</span>
          <strong
            className={`mono qr-chart-kpi-val${k.tone && k.tone !== "neutral" ? ` qr-chart-kpi-${k.tone} pnl-${k.tone}` : ""}`}
          >
            {k.value}
          </strong>
        </div>
      ))}
    </div>
  );
}

export function ChartFootnote({ children }: { children: ReactNode }) {
  return <p className="qr-chart-footnote mono">{children}</p>;
}
