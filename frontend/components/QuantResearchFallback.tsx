"use client";

import Link from "next/link";
import type { ResearchProfile } from "@/lib/marketDeskTypes";
import { chartPageUrl } from "@/lib/chartIndicators";

interface Props {
  symbol: string;
  profile: ResearchProfile;
  onRetry: () => void;
}

function fmt(val: number | null | undefined, digits = 2): string {
  if (val == null) return "—";
  return val.toFixed(digits);
}

export default function QuantResearchFallback({ symbol, profile, onRetry }: Props) {
  const { quote, report, technicals } = profile;
  const terminalHref = `/terminal?symbol=${encodeURIComponent(symbol)}`;

  return (
    <section className="site-section site-section-wide qr-fallback">
      <div className="qr-fallback-banner">
        <p className="qr-fallback-title">Using alternative research view</p>
        <p className="qr-fallback-msg">
          Full quant pipeline is temporarily unavailable. Showing live quote, company profile, and chart links instead.
        </p>
      </div>

      <div className="qr-fallback-grid">
        <article className="qr-fallback-card">
          <h3 className="qr-fallback-card-title">Live quote</h3>
          <p className="qr-fallback-name">{report?.name || quote.name}</p>
          <p className="mono qr-fallback-price">${quote.price.toFixed(quote.asset_class === "fx" ? 4 : 2)}</p>
          <p className={`mono ${quote.change_pct >= 0 ? "pnl-pos" : "pnl-neg"}`}>
            {quote.change_pct >= 0 ? "+" : ""}{quote.change_pct.toFixed(2)}%
          </p>
          {report?.sector && (
            <p className="mono qr-fallback-meta">{report.sector}{report.industry ? ` · ${report.industry}` : ""}</p>
          )}
        </article>

        <article className="qr-fallback-card">
          <h3 className="qr-fallback-card-title">Technicals</h3>
          <ul className="qr-fallback-stats mono">
            <li><span>52W high</span><strong>{fmt(technicals.fifty_two_week_high)}</strong></li>
            <li><span>52W low</span><strong>{fmt(technicals.fifty_two_week_low)}</strong></li>
            <li><span>Range position</span><strong>{technicals.range_position_pct != null ? `${technicals.range_position_pct}%` : "—"}</strong></li>
            <li><span>Day range</span><strong>{technicals.day_range ?? "—"}</strong></li>
          </ul>
        </article>

        <article className="qr-fallback-card">
          <h3 className="qr-fallback-card-title">Fundamentals</h3>
          <ul className="qr-fallback-stats mono">
            <li><span>Market cap</span><strong>{report?.market_cap_fmt ?? "—"}</strong></li>
            <li><span>P/E</span><strong>{report?.pe_ratio ?? "—"}</strong></li>
            <li><span>EPS</span><strong>{report?.eps ?? "—"}</strong></li>
            <li><span>Div yield</span><strong>{report?.dividend_yield != null ? `${report.dividend_yield}%` : "—"}</strong></li>
          </ul>
        </article>
      </div>

      {report?.description && (
        <p className="qr-fallback-desc">{report.description.slice(0, 420)}{report.description.length > 420 ? "…" : ""}</p>
      )}

      <div className="qr-fallback-actions">
        <Link href={chartPageUrl(symbol, "1Y")} className="site-btn site-btn-outline">Open Chart</Link>
        <Link href={terminalHref} className="site-btn site-btn-outline">Open Terminal</Link>
        <Link href={`/fundamentals?symbol=${encodeURIComponent(symbol)}`} className="site-btn site-btn-outline">Fundamentals</Link>
        <button type="button" className="site-btn site-btn-outline" onClick={onRetry}>Retry quant research</button>
      </div>
    </section>
  );
}
