"use client";

import { useEffect, useRef, useState } from "react";
import { getApiBase } from "@/lib/api";
import DataNotFound from "@/components/DataNotFound";
import SymbolSearchInput from "@/components/SymbolSearchInput";
import LoadingSpinner from "@/components/LoadingSpinner";
import QuantResearchCharts from "@/components/QuantResearchCharts";
import QuantSymbolCards from "@/components/QuantSymbolCards";
import QuantCompanyProfile from "@/components/QuantCompanyProfile";
import type { QuantResearchData } from "@/lib/quantResearchTypes";
import { QUANT_DEFAULT_TICKERS } from "@/lib/quantResearchTypes";
import { PRODUCT_NAME, PRODUCT_MOTTO } from "@/lib/orionAlpha";

function alphaBar(value: number | null, max = 1.5) {
  if (value == null) return 0;
  const pct = Math.min(100, Math.max(0, ((value + max) / (2 * max)) * 100));
  return pct;
}

function probClass(p: number) {
  if (p >= 70) return "qr-prob-high";
  if (p >= 50) return "qr-prob-mid";
  return "qr-prob-low";
}

function hasQuantData(d: QuantResearchData | null): boolean {
  return !!d && d.data_found !== false && !!d.date_range && !!d.summary;
}

export default function QuantResearchDashboard() {
  const [primary, setPrimary] = useState("AAPL");
  const [draftSymbol, setDraftSymbol] = useState("AAPL");
  const [data, setData] = useState<QuantResearchData | null>(null);
  const [loading, setLoading] = useState(true);
  const [retryKey, setRetryKey] = useState(0);
  const factorsRef = useRef<HTMLDivElement>(null);
  const [factorsVisible, setFactorsVisible] = useState(false);

  const runResearch = (sym: string) => {
    setDraftSymbol(sym);
    setPrimary(sym);
  };

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    setData(null);

    const tickers = QUANT_DEFAULT_TICKERS.join(",");
    fetch(`${getApiBase()}/research/quant?symbol=${encodeURIComponent(primary)}&tickers=${tickers}`, { cache: "no-store" })
      .then(async (r) => {
        const d = await r.json() as QuantResearchData & { status?: string };
        if (cancelled) return;
        if (!r.ok || d.status === "error" || d.data_found === false) {
          setData({
            data_found: false,
            message: d.message ?? "Quant research unavailable. Please try again later.",
            sources_tried: d.sources_tried ?? ["yfinance", "python-quant-engine"],
          } as QuantResearchData);
        } else {
          setData(d);
        }
      })
      .catch(() => {
        if (!cancelled) setData(null);
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });

    return () => { cancelled = true; };
  }, [primary, retryKey]);

  useEffect(() => {
    const el = factorsRef.current;
    if (!el) return;
    const obs = new IntersectionObserver(([e]) => { if (e.isIntersecting) setFactorsVisible(true); }, { threshold: 0.1 });
    obs.observe(el);
    return () => obs.disconnect();
  }, [data]);

  const quantData = hasQuantData(data) ? data : null;

  return (
    <div className="qr-page">
      <section className="qr-hero site-section-wide">
        <div className="qr-hero-inner">
          <p className="site-hero-badge">{PRODUCT_MOTTO}</p>
          <h1 className="qr-hero-title">Quant Research</h1>
          <p className="qr-hero-lead">
            Factor engine, CAPM alpha/beta, risk metrics, Monte Carlo simulation, and pattern probability — clean quant research for any symbol.
          </p>
          <div className="qr-hero-search-wrap">
            <SymbolSearchInput
              value={draftSymbol}
              onQueryChange={setDraftSymbol}
              onSelect={runResearch}
              submitOnGoOnly
              showGoButton
              loading={loading}
              placeholder="Symbol e.g. AAPL"
              className="qr-symbol-search"
              ariaLabel="Primary research symbol"
            />
            <p className="qr-hero-search-hint">Select or type a symbol, then press <strong>GO</strong> to run research.</p>
          </div>
          {quantData && (
            <p className="qr-meta mono">
              {quantData.trading_days} days · {quantData.date_range.start} → {quantData.date_range.end} · vs {quantData.benchmark}
            </p>
          )}
        </div>
      </section>

      {loading && (
        <div className="qr-loading">
          <LoadingSpinner size="lg" label="Running quant research pipeline…" />
        </div>
      )}

      {!loading && !quantData && (
        <DataNotFound
          symbol={primary}
          title="Research data not found"
          message={data?.message ?? "Quant research unavailable. Please try again later."}
          sourcesTried={data?.sources_tried ?? ["yfinance", "quant-research"]}
          onRetry={() => setRetryKey((k) => k + 1)}
        />
      )}

      {!loading && quantData && (
        <>
          <section className="site-section site-section-wide site-section-muted">
            <h2 className="site-section-title">Research summary</h2>
            <p className="site-section-lead">{quantData.summary.recommendation}</p>
            <div className="qr-summary-grid">
              <article className="qr-summary-card">
                <span className="qr-summary-label">Top factor pick</span>
                <strong className="mono">{quantData.summary.top_factor_pick}</strong>
              </article>
              <article className="qr-summary-card">
                <span className="qr-summary-label">Best CAPM alpha</span>
                <strong className="mono">{quantData.summary.best_capm_alpha}</strong>
              </article>
              <article className="qr-summary-card">
                <span className="qr-summary-label">Best Sharpe</span>
                <strong className="mono">{quantData.summary.best_sharpe}</strong>
              </article>
              <article className="qr-summary-card">
                <span className="qr-summary-label">Universe vol</span>
                <strong className="mono">{quantData.summary.universe_vol_pct ?? "—"}%</strong>
              </article>
            </div>
          </section>

          <QuantCompanyProfile data={quantData} primary={primary} />

          <QuantSymbolCards data={quantData} primary={primary} onSelect={setDraftSymbol} />

          <QuantResearchCharts data={quantData} primary={primary} />

          <section className="site-section site-section-wide" ref={factorsRef}>
            <h2 className="site-section-title">Factor model & composite alpha</h2>
            <p className="site-section-lead">
              Momentum, reversal, low-vol, and trend factors — cross-sectional z-scores from QuantResearch.ipynb.
            </p>
            <div className="qr-table-wrap">
              <table className="qr-table">
                <thead>
                  <tr>
                    <th>Symbol</th>
                    <th>Momentum 63d</th>
                    <th>Reversal 5d</th>
                    <th>Trend vs SMA50</th>
                    <th>RSI 14</th>
                    <th>Composite α</th>
                  </tr>
                </thead>
                <tbody>
                  {quantData.factor_scores.map((row, i) => (
                    <tr key={row.symbol} className={row.symbol === primary ? "qr-row-primary" : ""}>
                      <td className="mono qr-sym">{row.symbol}</td>
                      <td className="mono">{((row.momentum_63d ?? 0) * 100).toFixed(2)}%</td>
                      <td className="mono">{((row.reversal_5d ?? 0) * 100).toFixed(2)}%</td>
                      <td className="mono">{((row.trend_sma50 ?? 0) * 100).toFixed(2)}%</td>
                      <td className="mono">{row.rsi_14?.toFixed(1) ?? "—"}</td>
                      <td>
                        <div className="qr-alpha-bar-wrap">
                          <div
                            className={`qr-alpha-bar site-prob-fill${factorsVisible ? " qr-bar-animate" : ""}`}
                            style={{ width: factorsVisible ? `${alphaBar(row.composite_alpha)}%` : "0%", transitionDelay: `${i * 0.08}s` }}
                          />
                          <span className="mono qr-alpha-val">{row.composite_alpha?.toFixed(3) ?? "—"}</span>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </section>

          <section className="site-section site-section-wide site-section-muted">
            <h2 className="site-section-title">Pattern recognition & probability</h2>
            <p className="site-section-lead">Technical pattern signals for {quantData.primary} — probability-weighted setups.</p>
            <div className="site-prob-grid">
              {quantData.pattern_signals.map((s, i) => (
                <article key={s.label} className={`site-prob-card site-in-view qr-prob-card ${probClass(s.probability)}`} style={{ animationDelay: `${i * 0.08}s` }}>
                  <div className="site-prob-head">
                    <h3>{s.label}</h3>
                    <span className="site-prob-value">{s.probability}%</span>
                  </div>
                  <div className="site-prob-track">
                    <div className="site-prob-fill" style={{ width: `${s.probability}%` }} />
                  </div>
                  <p>{s.description}</p>
                </article>
              ))}
            </div>
          </section>

          <section className="site-section site-section-wide">
            <h2 className="site-section-title">Risk metrics & CAPM</h2>
            <div className="qr-dual-grid">
              <div className="qr-table-wrap">
                <h3 className="qr-subtitle">Risk</h3>
                <table className="qr-table qr-table-compact">
                  <thead>
                    <tr>
                      <th>Sym</th><th>Sharpe</th><th>Sortino</th><th>Vol%</th><th>Max DD%</th><th>VaR 95%</th>
                    </tr>
                  </thead>
                  <tbody>
                    {quantData.risk_metrics.map((r) => (
                      <tr key={r.symbol}>
                        <td className="mono">{r.symbol}</td>
                        <td className="mono">{r.sharpe ?? "—"}</td>
                        <td className="mono">{r.sortino ?? "—"}</td>
                        <td className="mono">{r.ann_vol_pct ?? "—"}</td>
                        <td className="mono">{r.max_drawdown_pct ?? "—"}</td>
                        <td className="mono">{r.var_95_pct ?? "—"}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              <div className="qr-table-wrap">
                <h3 className="qr-subtitle">CAPM vs {quantData.benchmark}</h3>
                <table className="qr-table qr-table-compact">
                  <thead>
                    <tr><th>Sym</th><th>Alpha ann%</th><th>Beta</th></tr>
                  </thead>
                  <tbody>
                    {quantData.capm.map((c) => (
                      <tr key={c.symbol}>
                        <td className="mono">{c.symbol}</td>
                        <td className={`mono ${(c.alpha_ann_pct ?? 0) >= 0 ? "pnl-pos" : "pnl-neg"}`}>{c.alpha_ann_pct ?? "—"}</td>
                        <td className="mono">{c.beta ?? "—"}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </section>

          <section className="site-section site-section-wide site-section-muted">
            <h2 className="site-section-title">Monte Carlo forecast (252d GBM)</h2>
            <div className="qr-table-wrap">
              <table className="qr-table">
                <thead>
                  <tr><th>Symbol</th><th>Current</th><th>5th %ile</th><th>Median</th><th>95th %ile</th></tr>
                </thead>
                <tbody>
                  {quantData.monte_carlo.map((m) => (
                    <tr key={m.symbol}>
                      <td className="mono">{m.symbol}</td>
                      <td className="mono">${m.current?.toFixed(2) ?? "—"}</td>
                      <td className="mono">${m.p05?.toFixed(2) ?? "—"}</td>
                      <td className="mono">${m.p50?.toFixed(2) ?? "—"}</td>
                      <td className="mono">${m.p95?.toFixed(2) ?? "—"}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <p className="qr-footnote mono">
              Equal-weight portfolio: {quantData.portfolio.equal_weight.return_pct}% return · {quantData.portfolio.equal_weight.vol_pct}% vol · Sharpe {quantData.portfolio.equal_weight.sharpe}
            </p>
          </section>

          <section className="site-section site-section-wide qr-method">
            <p className="qr-method-note">Quant research · {PRODUCT_NAME}</p>
          </section>
        </>
      )}
    </div>
  );
}
