"use client";

import Link from "next/link";
import type { QuantCompanyProfile as CompanyProfile, QuantResearchData } from "@/lib/quantResearchTypes";
import { ASSET_CLASS_SHORT } from "@/lib/orionAlpha";
import { getSymbolEntry } from "@/lib/symbolCatalog";

function fmtPct(val: number | null | undefined): string {
  if (val == null) return "—";
  return `${(val * 100).toFixed(2)}%`;
}

function fmtNum(val: number | null | undefined, digits = 2): string {
  if (val == null) return "—";
  return val.toFixed(digits);
}

function StatCell({ label, value }: { label: string; value: string }) {
  return (
    <div className="qr-co-stat">
      <span className="qr-co-stat-label">{label}</span>
      <span className="mono qr-co-stat-value">{value}</span>
    </div>
  );
}

function ProfileBlock({ profile, primary, riskPrice }: {
  profile: CompanyProfile;
  primary: string;
  riskPrice?: number | null;
}) {
  const entry = getSymbolEntry(profile.symbol);
  const hi = profile.fifty_two_week_high;
  const lo = profile.fifty_two_week_low;
  const price = riskPrice ?? hi;
  let rangePct: string | null = null;
  if (hi != null && lo != null && price != null && hi > lo) {
    rangePct = `${(((price - lo) / (hi - lo)) * 100).toFixed(0)}% of 52w range`;
  }

  return (
    <article className="qr-co-card">
      <header className="qr-co-head">
        <div className="qr-co-head-main">
          <div className="qr-co-symbol-row">
            <span className="mono qr-co-symbol">{profile.symbol}</span>
            {entry && (
              <span className="qr-co-class-badge mono">{ASSET_CLASS_SHORT[entry.assetClass] ?? entry.assetClass}</span>
            )}
            {profile.symbol === primary && <span className="qr-co-primary-badge">Primary</span>}
          </div>
          <h3 className="qr-co-name">{profile.name}</h3>
          {(profile.sector || profile.industry) && (
            <p className="qr-co-sector mono">
              {[profile.sector, profile.industry].filter(Boolean).join(" · ")}
            </p>
          )}
        </div>
        {profile.website && (
          <a
            href={profile.website.startsWith("http") ? profile.website : `https://${profile.website}`}
            target="_blank"
            rel="noopener noreferrer"
            className="qr-co-website mono"
          >
            {profile.website.replace(/^https?:\/\//, "")} ↗
          </a>
        )}
      </header>

      {profile.description && (
        <p className="qr-co-desc">{profile.description}</p>
      )}

      <div className="qr-co-stats-grid">
        <StatCell label="Market cap" value={profile.market_cap_fmt ?? "—"} />
        <StatCell label="P/E ratio" value={fmtNum(profile.pe_ratio)} />
        <StatCell label="EPS" value={profile.eps != null ? `$${fmtNum(profile.eps)}` : "—"} />
        <StatCell label="Div yield" value={fmtPct(profile.dividend_yield)} />
        <StatCell label="Employees" value={profile.employees != null ? profile.employees.toLocaleString() : "—"} />
        <StatCell
          label="52-week range"
          value={hi != null && lo != null ? `$${fmtNum(lo)} – $${fmtNum(hi)}` : "—"}
        />
        {profile.latest_revenue_fmt && (
          <StatCell label={`Revenue (${profile.report_year ?? "FY"})`} value={profile.latest_revenue_fmt} />
        )}
        {profile.latest_net_income_fmt && (
          <StatCell label={`Net income (${profile.report_year ?? "FY"})`} value={profile.latest_net_income_fmt} />
        )}
      </div>

      {rangePct && <p className="qr-co-range-note mono">{rangePct}</p>}

      {profile.key_stats && profile.key_stats.length > 0 && (
        <div className="qr-co-key-stats">
          {profile.key_stats.map((s) => (
            <span key={s.label} className="qr-co-key-chip">
              <em>{s.label}</em>
              <strong className="mono">{s.value}</strong>
            </span>
          ))}
        </div>
      )}

      <footer className="qr-co-foot">
        <Link href={`/fundamentals?symbol=${encodeURIComponent(profile.symbol)}`} className="site-btn site-btn-outline qr-co-fa-link">
          Full fundamentals ↗
        </Link>
      </footer>
    </article>
  );
}

interface Props {
  data: QuantResearchData;
  primary: string;
}

export default function QuantCompanyProfile({ data, primary }: Props) {
  const profile = data.primary_profile ?? data.company_profiles?.[primary];
  const profiles = data.company_profiles ?? {};
  const others = data.tickers.filter((t) => t !== primary && profiles[t]?.data_found !== false);

  if (!profile && Object.keys(profiles).length === 0) return null;

  const riskPrice = data.risk_metrics.find((r) => r.symbol === primary)?.latest_price;

  return (
    <section className="site-section site-section-wide site-section-muted qr-co-section">
      <h2 className="site-section-title">Company information</h2>
      <p className="site-section-lead">
        Fundamentals and business profile for {primary} and universe peers — sector, valuation, and financials.
      </p>

      {profile && profile.data_found !== false ? (
        <ProfileBlock profile={profile} primary={primary} riskPrice={riskPrice} />
      ) : (
        <p className="qr-co-unavailable">Company profile unavailable for {primary}. Try again later.</p>
      )}

      {others.length > 0 && (
        <div className="qr-co-peers">
          <h3 className="qr-co-peers-title">Universe companies</h3>
          <div className="qr-co-peer-grid">
            {others.map((sym) => {
              const p = profiles[sym];
              if (!p) return null;
              return (
                <article key={sym} className="qr-co-peer-card">
                  <div className="qr-co-peer-head">
                    <strong className="mono">{p.symbol}</strong>
                    <span className="qr-co-peer-name">{p.name}</span>
                  </div>
                  {(p.sector || p.industry) && (
                    <p className="qr-co-peer-sector mono">{[p.sector, p.industry].filter(Boolean).join(" · ")}</p>
                  )}
                  <div className="qr-co-peer-metrics">
                    <span><em>Mkt cap</em> {p.market_cap_fmt ?? "—"}</span>
                    <span><em>P/E</em> {fmtNum(p.pe_ratio)}</span>
                    <span><em>EPS</em> {p.eps != null ? `$${fmtNum(p.eps)}` : "—"}</span>
                  </div>
                  {p.description && (
                    <p className="qr-co-peer-desc">{p.description.slice(0, 120)}{p.description.length > 120 ? "…" : ""}</p>
                  )}
                </article>
              );
            })}
          </div>
        </div>
      )}
    </section>
  );
}
