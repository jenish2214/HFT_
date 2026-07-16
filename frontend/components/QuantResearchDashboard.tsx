"use client";

import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import DataLoadingBar from "@/components/DataLoadingBar";
import DataNotFound from "@/components/DataNotFound";
import ResearchTabNav, { ResearchTabPanel, type ResearchTabId } from "@/components/ResearchTabNav";
import SymbolSearchInput from "@/components/SymbolSearchInput";
import { QuantPageSkeleton } from "@/components/skeletons/ContentSkeletons";
import QuantResearchCharts from "@/components/QuantResearchCharts";
import QuantRiskTactics from "@/components/QuantRiskTactics";
import { ResearchDeskBar } from "@/components/QuantResearchDesk";
import QuantSymbolCards from "@/components/QuantSymbolCards";
import QuantCompanyProfile from "@/components/QuantCompanyProfile";
import QuantEducationLab from "@/components/QuantEducationLab";
import QuantStatsPanel from "@/components/QuantStatsPanel";
import type { QuantResearchData } from "@/lib/quantResearchTypes";
import { QUANT_DEFAULT_TICKERS } from "@/lib/quantResearchTypes";
import { getQuantCache, setQuantCache } from "@/lib/quantCache";
import { loadQuantResearch } from "@/lib/fetchQuantResearch";
import QuantResearchFallback from "@/components/QuantResearchFallback";
import type { ResearchProfile } from "@/lib/marketDeskTypes";
import { PRODUCT_NAME } from "@/lib/orionAlpha";

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

function ResearchRiskFactors({
  data,
  primary,
  factorsVisible,
  factorsRef,
}: {
  data: QuantResearchData;
  primary: string;
  factorsVisible: boolean;
  factorsRef: React.RefObject<HTMLDivElement>;
}) {
  return (
    <>
      <QuantRiskTactics data={data} primary={primary} />

      <section className="site-section site-section-wide qr-section-card" ref={factorsRef}>
        <h2 className="site-section-title">Factor scores</h2>
        <p className="site-section-lead">Momentum, reversal, trend, and composite alpha vs peers.</p>
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
              {data.factor_scores.map((row, i) => (
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

      <section className="site-section site-section-wide qr-section-card">
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
                {data.risk_metrics.map((r) => (
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
            <h3 className="qr-subtitle">CAPM vs {data.benchmark}</h3>
            <table className="qr-table qr-table-compact">
              <thead>
                <tr><th>Sym</th><th>Alpha ann%</th><th>Beta</th></tr>
              </thead>
              <tbody>
                {data.capm.map((c) => (
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
    </>
  );
}

export default function QuantResearchDashboard() {
  const [hasSearched, setHasSearched] = useState(false);
  const [primary, setPrimary] = useState("");
  const [draftSymbol, setDraftSymbol] = useState("");
  const [data, setData] = useState<QuantResearchData | null>(null);
  const [fetching, setFetching] = useState(false);
  const [retryKey, setRetryKey] = useState(0);
  const [liteProfile, setLiteProfile] = useState<ResearchProfile | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<ResearchTabId>("overview");
  const factorsRef = useRef<HTMLDivElement>(null);
  const [factorsVisible, setFactorsVisible] = useState(false);
  const [fetchSlow, setFetchSlow] = useState(false);

  useEffect(() => {
    if (!fetching) {
      setFetchSlow(false);
      return;
    }
    const t = window.setTimeout(() => setFetchSlow(true), 2500);
    return () => window.clearTimeout(t);
  }, [fetching]);

  const runResearch = (sym: string) => {
    const next = sym.trim().toUpperCase();
    if (!next) return;
    setDraftSymbol(next);
    setHasSearched(true);
    setActiveTab("overview");
    setLiteProfile(null);
    setErrorMsg(null);
    setFetching(true);

    if (next === primary) {
      setRetryKey((k) => k + 1);
      return;
    }

    const cached = getQuantCache(next);
    setData(cached && hasQuantData(cached) ? cached : null);
    setPrimary(next);
  };

  useEffect(() => {
    if (!primary) return;

    let cancelled = false;
    const cached = getQuantCache(primary);
    const hasCache = cached && hasQuantData(cached);

    if (hasCache) {
      setData(cached);
      setLiteProfile(null);
      setErrorMsg(null);
    } else {
      setData(null);
      setLiteProfile(null);
      setErrorMsg(null);
    }
    setFetching(true);

    loadQuantResearch(primary, QUANT_DEFAULT_TICKERS)
      .then((result) => {
        if (cancelled) return;

        if (result.mode === "full") {
          setData(result.data);
          setLiteProfile(null);
          setErrorMsg(null);
          setQuantCache(primary, result.data);
        } else if (result.mode === "lite") {
          if (!hasCache) {
            setData(null);
            setLiteProfile(result.profile);
            setErrorMsg(null);
          }
        } else if (result.mode === "error" && !hasCache) {
          setData(null);
          setLiteProfile(null);
          setErrorMsg(result.message);
        }
      })
      .catch(() => {
        if (!cancelled && !hasCache) {
          setData(null);
          setLiteProfile(null);
          setErrorMsg("Quant research unavailable. Please try again later.");
        }
      })
      .finally(() => {
        if (!cancelled) setFetching(false);
      });

    return () => { cancelled = true; };
  }, [primary, retryKey]);

  useEffect(() => {
    const el = factorsRef.current;
    if (!el || activeTab !== "risk") return;
    const obs = new IntersectionObserver(([e]) => { if (e.isIntersecting) setFactorsVisible(true); }, { threshold: 0.1 });
    obs.observe(el);
    return () => obs.disconnect();
  }, [data, activeTab]);

  const quantData =
    hasQuantData(data) && data!.primary.toUpperCase() === primary.toUpperCase()
      ? data
      : null;

  return (
    <div className="qr-page qr-page-pro">
      <DataLoadingBar active={fetching && hasSearched} slow={fetchSlow} />

      <section className="qr-hero-pro site-section-wide">
        <div className="qr-hero-pro-inner">
          <div className="qr-hero-pro-copy">
            <p className="site-hero-badge">Research desk · {PRODUCT_NAME}</p>
            <h1 className="qr-hero-pro-title">Quantitative research</h1>
            <p className="qr-hero-pro-lead">
              Enter a symbol for performance metrics, factor scores, momentum analysis, and risk tables.
            </p>
          </div>
          <div className="qr-hero-pro-search oa-card">
            <SymbolSearchInput
              value={draftSymbol}
              onQueryChange={setDraftSymbol}
              onSelect={runResearch}
              submitOnGoOnly
              showGoButton
              loading={fetching}
              placeholder="Symbol — AAPL, SPY, BTC-USD…"
              className="qr-symbol-search"
              ariaLabel="Primary research symbol"
            />
            <p className="qr-hero-search-hint">
              Press <strong>GO</strong> to load. <Link href="/docs" className="qr-hero-docs-link">Definitions</Link>
            </p>
          </div>
        </div>
        {quantData && (
          <p className="qr-meta-pro mono">
            {quantData.trading_days} sessions · {quantData.date_range.start} → {quantData.date_range.end} · Benchmark {quantData.benchmark}
          </p>
        )}
      </section>

      {!hasSearched && (
        <div className="qr-empty-state qr-empty-pro">
          <h2 className="qr-empty-title">Research desk ready</h2>
          <p className="qr-empty-msg">
            Search a symbol above. Results are organized in Overview, Performance, Analysis, and Risk tabs.
          </p>
          <div className="qr-empty-suggestions">
            <span className="qr-empty-label">Popular</span>
            {["AAPL", "MSFT", "NVDA", "SPY", "BTC-USD"].map((sym) => (
              <button
                key={sym}
                type="button"
                className="qr-empty-chip mono"
                onClick={() => setDraftSymbol(sym)}
              >
                {sym}
              </button>
            ))}
          </div>
        </div>
      )}

      {hasSearched && fetching && quantData && (
        <div className="oa-progress-bar oa-progress-bar-indeterminate qr-top-progress" role="status" aria-live="polite" aria-label="Updating research data" />
      )}

      {hasSearched && fetching && !quantData && !liteProfile && <QuantPageSkeleton />}

      {hasSearched && !fetching && !quantData && liteProfile && (
        <QuantResearchFallback symbol={primary} profile={liteProfile} onRetry={() => setRetryKey((k) => k + 1)} />
      )}

      {hasSearched && !fetching && !quantData && !liteProfile && (errorMsg || data?.data_found === false) && (
        <DataNotFound
          symbol={primary}
          title="Research data not found"
          message={errorMsg ?? data?.message ?? "Quant research unavailable. Please try again later."}
          onRetry={() => setRetryKey((k) => k + 1)}
          compact
          hideSources
        />
      )}

      {quantData && (
        <div className={`qr-content-wrap${fetching ? " qr-content-refreshing" : ""}`}>
          <ResearchDeskBar data={quantData} primary={primary} />

          <ResearchTabNav active={activeTab} onChange={setActiveTab} symbol={primary} />

          <ResearchTabPanel id="overview" active={activeTab}>
            <QuantCompanyProfile data={quantData} primary={primary} />
            <QuantSymbolCards data={quantData} primary={primary} onSelect={setDraftSymbol} />
          </ResearchTabPanel>

          <ResearchTabPanel id="performance" active={activeTab}>
            <QuantStatsPanel data={quantData} primary={primary} />
          </ResearchTabPanel>

          <ResearchTabPanel id="analysis" active={activeTab}>
            <QuantEducationLab data={quantData} primary={primary} />
            <QuantResearchCharts data={quantData} primary={primary} />
            <section className="site-section site-section-wide qr-section-card">
              <h2 className="site-section-title">Pattern scores</h2>
              <p className="site-section-lead">Technical setup probabilities for {quantData.primary}.</p>
              <div className="site-prob-grid">
                {quantData.pattern_signals.map((s, i) => (
                  <article key={s.label} className={`site-prob-card qr-prob-card ${probClass(s.probability)}`} style={{ animationDelay: `${i * 0.08}s` }}>
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
          </ResearchTabPanel>

          <ResearchTabPanel id="risk" active={activeTab}>
            <ResearchRiskFactors
              data={quantData}
              primary={primary}
              factorsVisible={factorsVisible}
              factorsRef={factorsRef}
            />
          </ResearchTabPanel>

          <section className="site-section site-section-wide qr-method">
            <p className="qr-method-note">{PRODUCT_NAME} · BSJ Infotech research desk</p>
          </section>
        </div>
      )}
    </div>
  );
}
