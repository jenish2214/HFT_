"use client";

import { ASSET_CLASS_SHORT } from "@/lib/orionAlpha";
import { getSymbolEntry } from "@/lib/symbolCatalog";
import type { QuantResearchData } from "@/lib/quantResearchTypes";
import { QR_COLORS } from "@/components/QuantResearchCharts";

interface Props {
  data: QuantResearchData;
  primary: string;
  onSelect?: (symbol: string) => void;
}

function pctChange(from: number | null | undefined, to: number | null | undefined): string {
  if (from == null || to == null || from === 0) return "—";
  const ch = ((to - from) / from) * 100;
  const sign = ch >= 0 ? "+" : "";
  return `${sign}${ch.toFixed(1)}%`;
}

export default function QuantSymbolCards({ data, primary, onSelect }: Props) {
  const cards = data.tickers.map((sym, i) => {
    const entry = getSymbolEntry(sym);
    const company = data.company_profiles?.[sym];
    const factor = data.factor_scores.find((f) => f.symbol === sym);
    const risk = data.risk_metrics.find((r) => r.symbol === sym);
    const capm = data.capm.find((c) => c.symbol === sym);
    const mc = data.monte_carlo.find((m) => m.symbol === sym);
    const series = data.charts?.price_series?.[sym];
    const lastClose = series?.[series.length - 1]?.close ?? risk?.latest_price;
    const firstNorm = series?.[0]?.norm ?? 100;
    const lastNorm = series?.[series.length - 1]?.norm ?? 100;
    const perf = firstNorm && lastNorm ? ((lastNorm - firstNorm) / firstNorm) * 100 : null;

    return {
      sym,
      color: QR_COLORS[i % QR_COLORS.length],
      name: company?.name ?? entry?.name ?? sym,
      sector: company?.sector,
      industry: company?.industry,
      marketCap: company?.market_cap_fmt,
      pe: company?.pe_ratio,
      assetClass: entry?.assetClass,
      price: lastClose ?? risk?.latest_price,
      perf,
      sharpe: risk?.sharpe,
      vol: risk?.ann_vol_pct,
      alpha: capm?.alpha_ann_pct,
      beta: capm?.beta,
      composite: factor?.composite_alpha,
      rsi: factor?.rsi_14,
      mcP50: mc?.p50,
      mcUpside: pctChange(mc?.current, mc?.p95),
      mcDownside: pctChange(mc?.current, mc?.p05),
      isPrimary: sym === primary,
    };
  });

  return (
    <section className="site-section site-section-wide">
      <h2 className="site-section-title">Universe overview</h2>
      <p className="site-section-lead">
        Per-symbol snapshot — click a card to load the symbol, then press GO to run research.
      </p>
      <div className="qr-stock-grid">
        {cards.map((c) => (
          <article
            key={c.sym}
            className={`qr-stock-card${c.isPrimary ? " qr-stock-card-primary" : ""}`}
            style={{ "--qr-accent": c.color } as React.CSSProperties}
            onClick={() => onSelect?.(c.sym)}
            role={onSelect ? "button" : undefined}
            tabIndex={onSelect ? 0 : undefined}
            onKeyDown={(e) => { if (onSelect && (e.key === "Enter" || e.key === " ")) onSelect(c.sym); }}
          >
            <header className="qr-stock-head">
              <span className="qr-stock-badge mono" style={{ background: `${c.color}18`, color: c.color, borderColor: `${c.color}44` }}>
                {c.assetClass ? ASSET_CLASS_SHORT[c.assetClass] : "—"}
              </span>
              <div className="qr-stock-titles">
                <strong className="mono qr-stock-sym">{c.sym}</strong>
                <span className="qr-stock-name">{c.name}</span>
                {(c.sector || c.industry) && (
                  <span className="qr-stock-sector mono">
                    {[c.sector, c.industry].filter(Boolean).join(" · ")}
                  </span>
                )}
              </div>
              {c.isPrimary && <span className="qr-stock-pin">Primary</span>}
            </header>

            <div className="qr-stock-price-row">
              <span className="qr-stock-price mono">
                {c.price != null ? `$${c.price.toFixed(2)}` : "—"}
              </span>
              {c.marketCap && <span className="qr-stock-mcap mono">{c.marketCap}</span>}
              {c.perf != null && (
                <span className={`mono qr-stock-perf ${c.perf >= 0 ? "pnl-pos" : "pnl-neg"}`}>
                  {c.perf >= 0 ? "+" : ""}{c.perf.toFixed(1)}% period
                </span>
              )}
            </div>

            <div className="qr-stock-metrics">
              <div className="qr-stock-metric">
                <span className="qr-stock-metric-label">Composite α</span>
                <span className="mono">{c.composite?.toFixed(3) ?? "—"}</span>
              </div>
              <div className="qr-stock-metric">
                <span className="qr-stock-metric-label">CAPM α</span>
                <span className={`mono ${(c.alpha ?? 0) >= 0 ? "pnl-pos" : "pnl-neg"}`}>
                  {c.alpha != null ? `${c.alpha}%` : "—"}
                </span>
              </div>
              <div className="qr-stock-metric">
                <span className="qr-stock-metric-label">Sharpe</span>
                <span className="mono">{c.sharpe ?? "—"}</span>
              </div>
              <div className="qr-stock-metric">
                <span className="qr-stock-metric-label">Vol</span>
                <span className="mono">{c.vol != null ? `${c.vol}%` : "—"}</span>
              </div>
              <div className="qr-stock-metric">
                <span className="qr-stock-metric-label">Beta</span>
                <span className="mono">{c.beta ?? "—"}</span>
              </div>
              <div className="qr-stock-metric">
                <span className="qr-stock-metric-label">P/E</span>
                <span className="mono">{c.pe?.toFixed(1) ?? "—"}</span>
              </div>
              <div className="qr-stock-metric">
                <span className="qr-stock-metric-label">RSI</span>
                <span className="mono">{c.rsi?.toFixed(0) ?? "—"}</span>
              </div>
            </div>

            {c.mcP50 != null && (
              <footer className="qr-stock-foot">
                MC median ${c.mcP50.toFixed(2)} · upside {c.mcUpside} · downside {c.mcDownside}
              </footer>
            )}
          </article>
        ))}
      </div>
    </section>
  );
}
