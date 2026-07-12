"use client";

import { useEffect, useRef, useState } from "react";
import { getApiBase } from "@/lib/api";
import type { BbFunction } from "@/lib/bloombergCommands";
import CompanyFundamentalsTabs from "@/components/CompanyFundamentalsTabs";
import type { FinancialStatement, KeyStat } from "@/components/CompanyFundamentalsTabs";
import PanelLoading, { type QuickQuote } from "@/components/PanelLoading";
import { PRODUCT_NAME } from "@/lib/orionAlpha";

function panelTitle(mode: BbFunction): string {
  if (mode === "DES") return "DES — Description";
  if (mode === "CN") return "CN — Company Profile";
  return "FA — Fundamentals";
}

export interface AnnualReportRow {
  year: string;
  revenue: number | null;
  revenue_fmt: string | null;
  gross_profit: number | null;
  gross_profit_fmt: string | null;
  operating_income: number | null;
  operating_income_fmt: string | null;
  net_income: number | null;
  net_income_fmt: string | null;
}

export interface CompanyReport {
  symbol: string;
  name: string;
  sector: string | null;
  industry: string | null;
  description: string | null;
  website: string | null;
  employees: number | null;
  market_cap_fmt: string | null;
  pe_ratio: number | null;
  eps: number | null;
  dividend_yield: number | null;
  fifty_two_week_high: number | null;
  fifty_two_week_low: number | null;
  annual_reports: AnnualReportRow[];
  income_statement?: FinancialStatement;
  balance_sheet?: FinancialStatement;
  cash_flow?: FinancialStatement;
  key_stats?: KeyStat[];
}

export interface CompanySummary {
  symbol: string;
  name: string;
  sector: string | null;
  industry: string | null;
  market_cap_fmt: string | null;
  pe_ratio: number | null;
  eps: number | null;
  latest_revenue_fmt: string | null;
  latest_net_income_fmt: string | null;
  report_year: string | null;
}

function fmt(val: string | number | null | undefined, suffix = ""): string {
  if (val == null || val === "") return "—";
  return `${val}${suffix}`;
}

interface ReportProps {
  symbol: string;
  mode?: BbFunction;
  quickQuote?: QuickQuote | null;
}

export default function CompanyReportPanel({ symbol, mode = "FA", quickQuote }: ReportProps) {
  const [report, setReport] = useState<CompanyReport | null>(null);
  const [loading, setLoading] = useState(true);
  const descRef = useRef<HTMLParagraphElement>(null);

  useEffect(() => {
    setLoading(true);
    fetch(`${getApiBase()}/company/report?symbol=${encodeURIComponent(symbol)}`, { cache: "no-store" })
      .then((r) => r.json())
      .then((data) => setReport(data as CompanyReport))
      .catch(() => setReport(null))
      .finally(() => setLoading(false));
  }, [symbol]);

  useEffect(() => {
    if ((mode === "DES" || mode === "CN") && descRef.current) {
      descRef.current.scrollIntoView({ behavior: "smooth", block: "start" });
    }
  }, [mode, report]);

  const title = panelTitle(mode === "DES" || mode === "CN" ? mode : "FA");
  const quote: QuickQuote = quickQuote ?? { symbol };

  if (loading && !report) {
    return (
      <div className="panel report-panel">
        <div className="panel-head"><span className="panel-title">{title}</span></div>
        <div className="panel-body report-body">
          <PanelLoading
            message={`Loading ${symbol} fundamentals…`}
            quote={quote.price ? quote : { symbol }}
            skeleton="report"
          />
        </div>
      </div>
    );
  }

  if (!report) {
    return (
      <div className="panel report-panel">
        <div className="panel-head"><span className="panel-title">{title}</span></div>
        <div className="panel-body report-body"><span className="report-muted">Report unavailable</span></div>
      </div>
    );
  }

  const showFinancials = mode === "FA";

  return (
    <div className="panel report-panel">
      <div className="panel-head report-head">
        <div>
          <span className="panel-title">{title}</span>
          <div className="report-company-name">{report.name}</div>
        </div>
        <span className="mono report-symbol bb-orange-text">{report.symbol} US</span>
        <a
          href={`/fundamentals?symbol=${encodeURIComponent(report.symbol)}`}
          target="_blank"
          rel="noopener noreferrer"
          className="chart-fullscreen-btn mono"
          title="Full fundamentals in new tab"
        >
          FULL FA ↗
        </a>
      </div>

      <div className="panel-body report-body">
        {(report.sector || report.industry) && (
          <div className="report-meta mono">
            {[report.sector, report.industry].filter(Boolean).join(" · ")}
          </div>
        )}

        {report.description && (
          <p ref={descRef} className={`report-summary${mode === "DES" || mode === "CN" ? " report-summary-focus" : ""}`}>
            {report.description}
          </p>
        )}

        {showFinancials && <CompanyFundamentalsTabs report={report} compact />}

        {report.website && (
          <div className="report-footer mono">
            {report.website.replace(/^https?:\/\//, "")}
          </div>
        )}
      </div>
    </div>
  );
}

interface DirectoryProps {
  active: string;
  onSelect: (sym: string) => void;
}

export function CompanyDirectory({ active, onSelect }: DirectoryProps) {
  const [companies, setCompanies] = useState<CompanySummary[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setLoading(true);
    fetch(`${getApiBase()}/companies/reports`, { cache: "no-store" })
      .then((r) => r.json())
      .then((data) => setCompanies((data.companies || []) as CompanySummary[]))
      .catch(() => setCompanies([]))
      .finally(() => setLoading(false));
  }, []);

  return (
    <div className="panel report-directory">
      <div className="panel-head">
        <span className="panel-title">FA — {PRODUCT_NAME} Equities</span>
        <span className="bb-fn">DES</span>
      </div>
      <div className="panel-body report-dir-body">
        {loading && companies.length === 0 ? (
          <PanelLoading message="Loading company directory…" skeleton="list" />
        ) : (
          companies.map((c) => (
            <button
              key={c.symbol}
              type="button"
              className={`report-dir-row${c.symbol === active ? " report-dir-active" : ""}`}
              onClick={() => onSelect(c.symbol)}
            >
              <div className="report-dir-top">
                <span className="report-dir-sym mono">{c.symbol}</span>
                <span className="report-dir-cap mono">{fmt(c.market_cap_fmt)}</span>
              </div>
              <div className="report-dir-name">{c.name}</div>
              <div className="report-dir-meta mono">
                {c.sector ?? "—"}
                {c.report_year && c.latest_revenue_fmt
                  ? ` · FY${c.report_year} Rev ${c.latest_revenue_fmt}`
                  : ""}
              </div>
            </button>
          ))
        )}
      </div>
    </div>
  );
}
