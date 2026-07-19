"use client";

import { useEffect, useRef, useState } from "react";
import DataLoadingBar from "@/components/DataLoadingBar";
import DataNotFound from "@/components/DataNotFound";
import ResearchTabNav, { ResearchTabPanel, type ResearchTabId } from "@/components/ResearchTabNav";
import SymbolSearchInput from "@/components/SymbolSearchInput";
import QuantResearchCharts from "@/components/QuantResearchCharts";
import QuantRiskTactics from "@/components/QuantRiskTactics";
import { ResearchDeskBar } from "@/components/QuantResearchDesk";
import QuantCompanyProfile from "@/components/QuantCompanyProfile";
import QuantEducationLab from "@/components/QuantEducationLab";
import QuantStatsPanel from "@/components/QuantStatsPanel";
import type { QuantResearchData } from "@/lib/quantResearchTypes";
import { QUANT_DEFAULT_TICKERS } from "@/lib/quantResearchTypes";
import { getQuantCache, setQuantCache } from "@/lib/quantCache";
import { loadQuantResearch, revalidateQuantResearch } from "@/lib/fetchQuantResearch";
import QuantResearchFallback from "@/components/QuantResearchFallback";
import PanelLoading from "@/components/PanelLoading";
import type { ResearchProfile } from "@/lib/marketDeskTypes";
import { PRODUCT_NAME } from "@/lib/orionAlpha";

function alphaBar(value: number | null, max = 1.5) {
  if (value == null) return 0;
  return Math.min(100, Math.max(0, ((value + max) / (2 * max)) * 100));
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

      <section className="qr-section-card" ref={factorsRef}>
        <h2 className="site-section-title">Factor scores</h2>
        <p className="site-section-lead">Momentum, reversal, trend, and composite alpha vs peers.</p>
        <div className="qr-table-wrap">
          <table className="qr-table">
            <thead>
              <tr>
                <th>Symbol</th>
                <th>Momentum</th>
                <th>Reversal</th>
                <th>Trend</th>
                <th>RSI</th>
                <th>Alpha</th>
              </tr>
            </thead>
            <tbody>
              {data.factor_scores.map((row, i) => (
                <tr key={row.symbol} className={row.symbol === primary ? "qr-row-primary" : ""}>
                  <td className="mono qr-sym">{row.symbol}</td>
                  <td className="mono">{((row.momentum_63d ?? 0) * 100).toFixed(1)}%</td>
                  <td className="mono">{((row.reversal_5d ?? 0) * 100).toFixed(1)}%</td>
                  <td className="mono">{((row.trend_sma50 ?? 0) * 100).toFixed(1)}%</td>
                  <td className="mono">{row.rsi_14?.toFixed(0) ?? "—"}</td>
                  <td>
                    <div className="qr-alpha-bar-wrap">
                      <div
                        className={`qr-alpha-bar site-prob-fill${factorsVisible ? " qr-bar-animate" : ""}`}
                        style={{
                          width: factorsVisible ? `${alphaBar(row.composite_alpha)}%` : "0%",
                          transitionDelay: `${i * 0.06}s`,
                        }}
                      />
                      <span className="mono qr-alpha-val">{row.composite_alpha?.toFixed(2) ?? "—"}</span>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      <section className="qr-section-card">
        <h2 className="site-section-title">Risk & CAPM</h2>
        <div className="qr-dual-grid">
          <div className="qr-table-wrap">
            <h3 className="qr-subtitle">Risk</h3>
            <table className="qr-table qr-table-compact">
              <thead>
                <tr>
                  <th>Sym</th>
                  <th>Sharpe</th>
                  <th>Vol%</th>
                  <th>Max DD%</th>
                </tr>
              </thead>
              <tbody>
                {data.risk_metrics.map((r) => (
                  <tr key={r.symbol}>
                    <td className="mono">{r.symbol}</td>
                    <td className="mono">{r.sharpe ?? "—"}</td>
                    <td className="mono">{r.ann_vol_pct ?? "—"}</td>
                    <td className="mono">{r.max_drawdown_pct ?? "—"}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <div className="qr-table-wrap">
            <h3 className="qr-subtitle">CAPM vs {data.benchmark}</h3>
            <table className="qr-table qr-table-compact">
              <thead>
                <tr>
                  <th>Sym</th>
                  <th>Alpha %</th>
                  <th>Beta</th>
                </tr>
              </thead>
              <tbody>
                {data.capm.map((c) => (
                  <tr key={c.symbol}>
                    <td className="mono">{c.symbol}</td>
                    <td className={`mono ${(c.alpha_ann_pct ?? 0) >= 0 ? "pnl-pos" : "pnl-neg"}`}>
                      {c.alpha_ann_pct ?? "—"}
                    </td>
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

const POPULAR = ["AAPL", "MSFT", "NVDA", "SPY", "BTC-USD"] as const;

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

    if (next === primary) {
      setFetching(true);
      setData(null);
      setRetryKey((k) => k + 1);
      return;
    }

    setRetryKey(0);
    setData(null);
    setFetching(true);
    setPrimary(next);
  };

  useEffect(() => {
    if (!primary) return;

    let cancelled = false;
    const cached = getQuantCache(primary);
    const hasCache = cached && hasQuantData(cached);

    if (hasCache && retryKey === 0) {
      setData(cached);
      setLiteProfile(null);
      setErrorMsg(null);
      setFetching(false);
      revalidateQuantResearch(primary, QUANT_DEFAULT_TICKERS);
      return;
    }

    setData(null);
    setLiteProfile(null);
    setErrorMsg(null);
    setFetching(true);

    loadQuantResearch(primary, QUANT_DEFAULT_TICKERS, { preferCache: false })
      .then((result) => {
        if (cancelled) return;
        if (result.mode === "full") {
          setData(result.data);
          setLiteProfile(null);
          setErrorMsg(null);
          setQuantCache(primary, result.data);
        } else if (result.mode === "lite") {
          setData(null);
          setLiteProfile(result.profile);
          setErrorMsg(null);
        } else {
          setData(null);
          setLiteProfile(null);
          setErrorMsg(result.message);
        }
      })
      .catch(() => {
        if (!cancelled) {
          setData(null);
          setLiteProfile(null);
          setErrorMsg("Quant research unavailable. Please try again later.");
        }
      })
      .finally(() => {
        if (!cancelled) setFetching(false);
      });

    return () => {
      cancelled = true;
    };
  }, [primary, retryKey]);

  useEffect(() => {
    const el = factorsRef.current;
    if (!el || activeTab !== "risk") return;
    const obs = new IntersectionObserver(
      ([e]) => {
        if (e.isIntersecting) setFactorsVisible(true);
      },
      { threshold: 0.1 },
    );
    obs.observe(el);
    return () => obs.disconnect();
  }, [data, activeTab]);

  const quantData =
    hasQuantData(data) && data!.primary.toUpperCase() === primary.toUpperCase() ? data : null;

  return (
    <div className="qr-page qr-page-pro qr-page-clean">
      <DataLoadingBar active={fetching && hasSearched} slow={fetchSlow} />

      <section className="qr-hero-pro">
        <p className="site-hero-badge">Research · {PRODUCT_NAME}</p>
        <h1 className="qr-hero-pro-title">Research desk</h1>
        <div className="qr-hero-pro-search">
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
        </div>
        {!hasSearched && (
          <div className="qr-empty-suggestions">
            {POPULAR.map((sym) => (
              <button
                key={sym}
                type="button"
                className="qr-empty-chip mono"
                onClick={() => runResearch(sym)}
              >
                {sym}
              </button>
            ))}
          </div>
        )}
        {quantData && (
          <p className="qr-meta-pro mono">
            {quantData.trading_days} sessions · {quantData.date_range.start} → {quantData.date_range.end} ·{" "}
            {quantData.benchmark}
          </p>
        )}
      </section>

      {hasSearched && fetching && (
        <div className="qr-loading-gate" role="status" aria-live="polite">
          <PanelLoading
            variant="full"
            title={`Loading ${primary || draftSymbol}`}
            message={
              fetchSlow
                ? "Still loading — first request on Render can be slow…"
                : `Fetching ${primary || draftSymbol}…`
            }
            skeleton="desk"
          />
        </div>
      )}

      {hasSearched && !fetching && !quantData && liteProfile && (
        <QuantResearchFallback
          symbol={primary}
          profile={liteProfile}
          onRetry={() => setRetryKey((k) => k + 1)}
        />
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

      {hasSearched && !fetching && quantData && (
        <div className="qr-content-wrap">
          <ResearchDeskBar data={quantData} primary={primary} />
          <ResearchTabNav active={activeTab} onChange={setActiveTab} symbol={primary} />

          <ResearchTabPanel id="overview" active={activeTab}>
            <QuantCompanyProfile data={quantData} primary={primary} />
          </ResearchTabPanel>

          <ResearchTabPanel id="performance" active={activeTab}>
            <QuantStatsPanel data={quantData} primary={primary} />
          </ResearchTabPanel>

          <ResearchTabPanel id="analysis" active={activeTab}>
            <QuantEducationLab data={quantData} primary={primary} />
            <QuantResearchCharts data={quantData} primary={primary} />
          </ResearchTabPanel>

          <ResearchTabPanel id="risk" active={activeTab}>
            <ResearchRiskFactors
              data={quantData}
              primary={primary}
              factorsVisible={factorsVisible}
              factorsRef={factorsRef}
            />
          </ResearchTabPanel>
        </div>
      )}
    </div>
  );
}
