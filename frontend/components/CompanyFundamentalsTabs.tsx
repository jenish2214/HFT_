"use client";

import { useState } from "react";
import type { CompanyReport } from "@/components/CompanyReportPanel";

export type FundamentalsTab = "overview" | "income" | "balance" | "cashflow" | "stats";

const TABS: { id: FundamentalsTab; label: string }[] = [
  { id: "overview", label: "Overview" },
  { id: "income", label: "Income" },
  { id: "balance", label: "Balance Sheet" },
  { id: "cashflow", label: "Cash Flow" },
  { id: "stats", label: "Key Stats" },
];

export interface StatementRow {
  label: string;
  values: (number | null)[];
  values_fmt: (string | null)[];
}

export interface FinancialStatement {
  years: string[];
  rows: StatementRow[];
}

export interface KeyStat {
  label: string;
  value: number;
  display: string;
}

function fmt(val: string | number | null | undefined, suffix = ""): string {
  if (val == null || val === "") return "—";
  return `${val}${suffix}`;
}

function StatementTable({ statement, emphasizeLast }: { statement: FinancialStatement; emphasizeLast?: boolean }) {
  if (!statement.years.length || !statement.rows.length) {
    return <div className="fa-tab-empty mono">No data available</div>;
  }

  return (
    <div className="report-table-wrap">
      <table className="report-table fa-statement-table">
        <thead>
          <tr>
            <th style={{ textAlign: "left" }}>Metric</th>
            {statement.years.map((y) => (
              <th key={y}>FY {y}</th>
            ))}
          </tr>
        </thead>
        <tbody>
          {statement.rows.map((row) => (
            <tr key={row.label}>
              <td>{row.label}</td>
              {row.values_fmt.map((v, i) => (
                <td
                  key={`${row.label}-${statement.years[i]}`}
                  className={`mono${emphasizeLast && i === 0 ? " report-emphasis" : ""}`}
                >
                  {fmt(v)}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

interface Props {
  report: CompanyReport;
  defaultTab?: FundamentalsTab;
  compact?: boolean;
}

export default function CompanyFundamentalsTabs({ report, defaultTab = "overview", compact }: Props) {
  const [tab, setTab] = useState<FundamentalsTab>(defaultTab);
  const latest = report.annual_reports[0];
  const income = report.income_statement ?? { years: [], rows: [] };
  const balance = report.balance_sheet ?? { years: [], rows: [] };
  const cashflow = report.cash_flow ?? { years: [], rows: [] };
  const keyStats = report.key_stats ?? [];

  return (
    <div className={`fa-tabs-root${compact ? " fa-tabs-compact" : ""}`}>
      <div className="fa-tab-bar" role="tablist">
        {TABS.map((t) => (
          <button
            key={t.id}
            type="button"
            role="tab"
            aria-selected={tab === t.id}
            className={`fa-tab-btn${tab === t.id ? " fa-tab-active" : ""}`}
            onClick={() => setTab(t.id)}
          >
            {t.label}
          </button>
        ))}
      </div>

      <div className="fa-tab-panel">
        {tab === "overview" && (
          <>
            <div className="report-kpi-grid">
              <div className="report-kpi">
                <div className="report-kpi-label">Market Cap</div>
                <div className="report-kpi-value mono">{fmt(report.market_cap_fmt)}</div>
              </div>
              <div className="report-kpi">
                <div className="report-kpi-label">P/E</div>
                <div className="report-kpi-value mono">{fmt(report.pe_ratio)}</div>
              </div>
              <div className="report-kpi">
                <div className="report-kpi-label">EPS</div>
                <div className="report-kpi-value mono">{report.eps != null ? `$${report.eps}` : "—"}</div>
              </div>
              <div className="report-kpi">
                <div className="report-kpi-label">Div Yield</div>
                <div className="report-kpi-value mono">
                  {report.dividend_yield != null ? `${(report.dividend_yield * 100).toFixed(2)}%` : "—"}
                </div>
              </div>
              <div className="report-kpi">
                <div className="report-kpi-label">52W Range</div>
                <div className="report-kpi-value mono">
                  {report.fifty_two_week_low != null && report.fifty_two_week_high != null
                    ? `$${report.fifty_two_week_low} – $${report.fifty_two_week_high}`
                    : "—"}
                </div>
              </div>
              <div className="report-kpi">
                <div className="report-kpi-label">Employees</div>
                <div className="report-kpi-value mono">
                  {report.employees != null ? report.employees.toLocaleString() : "—"}
                </div>
              </div>
            </div>

            {latest && (
              <div className="report-highlight mono">
                FY {latest.year}: Revenue {fmt(latest.revenue_fmt)} · Net Income {fmt(latest.net_income_fmt)}
              </div>
            )}

            {keyStats.length > 0 && (
              <>
                <div className="report-section-title">Highlights</div>
                <div className="fa-stats-grid">
                  {keyStats.slice(0, 8).map((s) => (
                    <div key={s.label} className="fa-stat-cell">
                      <span className="fa-stat-label">{s.label}</span>
                      <span className="fa-stat-val mono">{s.display}</span>
                    </div>
                  ))}
                </div>
              </>
            )}

            {income.rows.length > 0 && (
              <>
                <div className="report-section-title">Income Summary</div>
                <StatementTable
                  statement={{
                    years: income.years,
                    rows: income.rows.filter((r) =>
                      ["Total Revenue", "Gross Profit", "Operating Income", "Net Income"].includes(r.label),
                    ),
                  }}
                  emphasizeLast
                />
              </>
            )}
          </>
        )}

        {tab === "income" && (
          <>
            <div className="report-section-title">Income Statement (Annual)</div>
            <StatementTable statement={income} emphasizeLast />
          </>
        )}

        {tab === "balance" && (
          <>
            <div className="report-section-title">Balance Sheet (Annual)</div>
            <StatementTable statement={balance} emphasizeLast />
          </>
        )}

        {tab === "cashflow" && (
          <>
            <div className="report-section-title">Cash Flow Statement (Annual)</div>
            <StatementTable statement={cashflow} emphasizeLast />
          </>
        )}

        {tab === "stats" && (
          <>
            <div className="report-section-title">Valuation &amp; Profitability</div>
            {keyStats.length === 0 ? (
              <div className="fa-tab-empty mono">Key stats unavailable</div>
            ) : (
              <div className="fa-stats-grid fa-stats-grid-full">
                {keyStats.map((s) => (
                  <div key={s.label} className="fa-stat-cell">
                    <span className="fa-stat-label">{s.label}</span>
                    <span className="fa-stat-val mono">{s.display}</span>
                  </div>
                ))}
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}
