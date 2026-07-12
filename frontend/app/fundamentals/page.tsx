"use client";

import { Suspense, useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";
import { getApiBase } from "@/lib/api";
import type { CompanyReport } from "@/components/CompanyReportPanel";
import CompanyFundamentalsTabs from "@/components/CompanyFundamentalsTabs";
import PanelLoading from "@/components/PanelLoading";
import LoadingSpinner from "@/components/LoadingSpinner";
import { PRODUCT_NAME } from "@/lib/orionAlpha";

function FundamentalsContent() {
  const params = useSearchParams();
  const initialSymbol = (params.get("symbol") || "AAPL").toUpperCase();
  const [symbol, setSymbol] = useState(initialSymbol);
  const [report, setReport] = useState<CompanyReport | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setLoading(true);
    fetch(`${getApiBase()}/company/report?symbol=${encodeURIComponent(symbol)}`, { cache: "no-store" })
      .then((r) => r.json())
      .then((d) => setReport(d as CompanyReport))
      .catch(() => setReport(null))
      .finally(() => setLoading(false));
  }, [symbol]);

  useEffect(() => {
    const url = new URL(window.location.href);
    url.searchParams.set("symbol", symbol);
    window.history.replaceState(null, "", url.toString());
  }, [symbol]);

  return (
    <div className="fa-page-root">
      <header className="fa-page-header">
        <a href="/terminal" className="fs-back-link mono">← Terminal</a>
        <span className="panel-title">FA — Full Fundamentals</span>
        <form
          className="fs-symbol-form"
          onSubmit={(e) => {
            e.preventDefault();
            const fd = new FormData(e.currentTarget);
            const sym = String(fd.get("sym") || "").trim().toUpperCase();
            if (sym) setSymbol(sym);
          }}
        >
          <input name="sym" className="fs-symbol-input mono" defaultValue={symbol} key={symbol} placeholder="AAPL" />
          <button type="submit" className="fs-symbol-go">GO</button>
        </form>
      </header>

      {loading && !report && (
        <PanelLoading
          variant="full"
          title={`FA — ${symbol}`}
          message="Loading full fundamentals…"
          quote={{ symbol }}
          skeleton="report"
        />
      )}

      {!loading && !report && (
        <div className="desk-full-loading mono">Fundamentals unavailable for {symbol}</div>
      )}

      {report && (
        <div className="fa-page-body">
          <div className="fa-page-intro">
            <div>
              <h1 className="fa-page-name">{report.name}</h1>
              <div className="fa-page-meta mono">
                <span className="bb-orange-text">{report.symbol}</span>
                {[report.sector, report.industry].filter(Boolean).join(" · ")}
              </div>
            </div>
            {report.description && (
              <p className="fa-page-desc">{report.description.slice(0, 500)}{report.description.length > 500 ? "…" : ""}</p>
            )}
          </div>
          <CompanyFundamentalsTabs report={report} defaultTab="overview" />
        </div>
      )}
    </div>
  );
}

export default function FundamentalsPage() {
  return (
    <Suspense fallback={
      <div className="fa-page-root desk-full-loading">
        <LoadingSpinner size="lg" label="Loading…" />
      </div>
    }>
      <FundamentalsContent />
    </Suspense>
  );
}
