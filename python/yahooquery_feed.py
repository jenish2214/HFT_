"""
Fundamentals via yahooquery — profile, earnings, financial statements.
Falls back gracefully when yahooquery is unavailable or data is missing.
"""

from __future__ import annotations

from typing import Any

try:
    from yahooquery import Ticker as YqTicker
except ImportError:
    YqTicker = None  # type: ignore[misc, assignment]

YQ_INCOME_ROWS = [
    ("Total Revenue", "TotalRevenue"),
    ("Cost of Revenue", "CostOfRevenue"),
    ("Gross Profit", "GrossProfit"),
    ("Operating Expenses", "OperatingExpense"),
    ("Operating Income", "OperatingIncome"),
    ("Interest Expense", "InterestExpense"),
    ("Pretax Income", "PretaxIncome"),
    ("Tax Provision", "TaxProvision"),
    ("Net Income", "NetIncome"),
    ("EBITDA", "EBITDA"),
    ("Basic EPS", "BasicEPS"),
    ("Diluted EPS", "DilutedEPS"),
]

YQ_BALANCE_ROWS = [
    ("Total Assets", "TotalAssets"),
    ("Current Assets", "CurrentAssets"),
    ("Cash & Equivalents", "CashAndCashEquivalents"),
    ("Total Liabilities", "TotalLiabilitiesNetMinorityInterest"),
    ("Current Liabilities", "CurrentLiabilities"),
    ("Total Debt", "TotalDebt"),
    ("Stockholders Equity", "StockholdersEquity"),
    ("Retained Earnings", "RetainedEarnings"),
    ("Working Capital", "WorkingCapital"),
]

YQ_CASHFLOW_ROWS = [
    ("Operating Cash Flow", "OperatingCashFlow"),
    ("Investing Cash Flow", "InvestingCashFlow"),
    ("Financing Cash Flow", "FinancingCashFlow"),
    ("Capital Expenditure", "CapitalExpenditure"),
    ("Free Cash Flow", "FreeCashFlow"),
    ("Dividends Paid", "CashDividendsPaid"),
    ("Stock Repurchased", "RepurchaseOfCapitalStock"),
    ("Change in Cash", "ChangesInCash"),
]


def _safe_float(val: Any) -> float | None:
    try:
        if val is None or val != val:
            return None
        return round(float(val), 2)
    except (TypeError, ValueError):
        return None


def _fmt_large(n: float | None) -> str | None:
    if n is None:
        return None
    abs_n = abs(n)
    if abs_n >= 1e12:
        return f"{n / 1e12:.2f}T"
    if abs_n >= 1e9:
        return f"{n / 1e9:.2f}B"
    if abs_n >= 1e6:
        return f"{n / 1e6:.2f}M"
    return f"{n:,.0f}"


def _annual_df(df):
    if df is None or getattr(df, "empty", True):
        return None
    out = df.copy()
    if "periodType" in out.columns:
        out = out[out["periodType"].astype(str).str.contains("12M", na=False)]
    if "asOfDate" in out.columns:
        out = out.sort_values("asOfDate", ascending=False)
    return out.head(4) if not out.empty else None


def _build_yq_statement(df, row_defs: list[tuple[str, str]], max_years: int = 4) -> dict:
    annual = _annual_df(df)
    if annual is None or annual.empty:
        return {"years": [], "rows": []}

    if "asOfDate" in annual.columns:
        years = [str(d.year) if hasattr(d, "year") else str(d)[:4] for d in annual["asOfDate"].head(max_years)]
    else:
        years = [str(i) for i in range(len(annual.head(max_years)))]

    rows: list[dict] = []
    for label, col in row_defs:
        if col not in annual.columns:
            continue
        values: list[float | None] = []
        values_fmt: list[str | None] = []
        for _, row in annual.head(max_years).iterrows():
            v = _safe_float(row.get(col))
            values.append(v)
            values_fmt.append(_fmt_large(v))
        if any(v is not None for v in values):
            rows.append({"label": label, "values": values, "values_fmt": values_fmt})

    return {"years": years, "rows": rows}


def _extract_yq_key_stats(summary: dict) -> list[dict]:
    if not summary:
        return []
    fields = [
        ("Profit Margin", "profitMargins", "pct"),
        ("Operating Margin", "operatingMargins", "pct"),
        ("Return on Equity", "returnOnEquity", "pct"),
        ("Return on Assets", "returnOnAssets", "pct"),
        ("Revenue Growth", "revenueGrowth", "pct"),
        ("Earnings Growth", "earningsGrowth", "pct"),
        ("Debt / Equity", "debtToEquity", "ratio"),
        ("Current Ratio", "currentRatio", "ratio"),
        ("Quick Ratio", "quickRatio", "ratio"),
        ("P/E (Trailing)", "trailingPE", "num"),
        ("P/E (Forward)", "forwardPE", "num"),
        ("PEG Ratio", "pegRatio", "num"),
        ("Price / Book", "priceToBook", "num"),
        ("EV / Revenue", "enterpriseToRevenue", "num"),
        ("EV / EBITDA", "enterpriseToEbitda", "num"),
        ("Beta", "beta", "num"),
        ("Payout Ratio", "payoutRatio", "pct"),
        ("Book Value", "bookValue", "money"),
        ("Enterprise Value", "enterpriseValue", "large"),
    ]
    stats: list[dict] = []
    for label, key, fmt in fields:
        raw = summary.get(key)
        if raw is None or raw != raw:
            continue
        val = _safe_float(raw)
        if val is None:
            continue
        if fmt == "pct":
            display = f"{val * 100:.2f}%" if abs(val) < 2 else f"{val:.2f}%"
        elif fmt == "large":
            display = _fmt_large(val) or str(val)
        elif fmt == "money":
            display = f"${val:,.2f}"
        else:
            display = f"{val:,.2f}"
        stats.append({"label": label, "value": val, "display": display})
    return stats


def fetch_yahooquery_report(symbol: str) -> dict | None:
    """Build a partial company report from yahooquery. Returns None if unavailable."""
    if YqTicker is None:
        return None

    sym = symbol.upper().strip()
    try:
        t = YqTicker(sym, asynchronous=False)
        profile = (t.asset_profile or {}).get(sym) or {}
        summary = (t.summary_detail or {}).get(sym) or {}
        key_stats_raw = (t.key_stats or {}).get(sym) or {}
        summary = {**key_stats_raw, **summary}

        report: dict = {
            "symbol": sym,
            "name": profile.get("longName") or profile.get("shortName") or sym,
            "sector": profile.get("sector"),
            "industry": profile.get("industry"),
            "description": (profile.get("longBusinessSummary") or "")[:800] or None,
            "website": profile.get("website"),
            "employees": profile.get("fullTimeEmployees"),
            "market_cap": _safe_float(summary.get("marketCap")),
            "market_cap_fmt": _fmt_large(_safe_float(summary.get("marketCap"))),
            "pe_ratio": _safe_float(summary.get("trailingPE")),
            "eps": _safe_float(summary.get("trailingEps")),
            "dividend_yield": _safe_float(summary.get("dividendYield")),
            "fifty_two_week_high": _safe_float(summary.get("fiftyTwoWeekHigh")),
            "fifty_two_week_low": _safe_float(summary.get("fiftyTwoWeekLow")),
            "key_stats": _extract_yq_key_stats(summary),
            "data_source": "yahooquery",
        }

        income = t.income_statement(frequency="a")
        balance = t.balance_sheet(frequency="a")
        cashflow = t.cash_flow(frequency="a")

        if income is not None and not income.empty:
            sym_inc = income[income["symbol"] == sym] if "symbol" in income.columns else income
            report["income_statement"] = _build_yq_statement(sym_inc, YQ_INCOME_ROWS)

            annual: list[dict] = []
            annual_df = _annual_df(sym_inc if hasattr(sym_inc, "columns") else income)
            if annual_df is not None:
                for _, row in annual_df.iterrows():
                    year = str(row["asOfDate"].year) if hasattr(row.get("asOfDate"), "year") else str(row.get("asOfDate", ""))[:4]
                    revenue = _safe_float(row.get("TotalRevenue"))
                    gross = _safe_float(row.get("GrossProfit"))
                    operating = _safe_float(row.get("OperatingIncome"))
                    net = _safe_float(row.get("NetIncome"))
                    annual.append({
                        "year": year,
                        "revenue": revenue,
                        "revenue_fmt": _fmt_large(revenue),
                        "gross_profit": gross,
                        "gross_profit_fmt": _fmt_large(gross),
                        "operating_income": operating,
                        "operating_income_fmt": _fmt_large(operating),
                        "net_income": net,
                        "net_income_fmt": _fmt_large(net),
                    })
            if annual:
                report["annual_reports"] = annual

        if balance is not None and not balance.empty:
            sym_bs = balance[balance["symbol"] == sym] if "symbol" in balance.columns else balance
            report["balance_sheet"] = _build_yq_statement(sym_bs, YQ_BALANCE_ROWS)

        if cashflow is not None and not cashflow.empty:
            sym_cf = cashflow[cashflow["symbol"] == sym] if "symbol" in cashflow.columns else cashflow
            report["cash_flow"] = _build_yq_statement(sym_cf, YQ_CASHFLOW_ROWS)

        earnings = t.earnings
        if earnings is not None and not getattr(earnings, "empty", True):
            report["earnings_history"] = earnings.to_dict(orient="records")[:8]

        return report
    except Exception as exc:
        print(f"[yahooquery] report failed ({sym}): {exc}")
        return None


def merge_report(base: dict, overlay: dict) -> dict:
    """Merge overlay fields into base without clobbering existing good data."""
    for key, val in overlay.items():
        if val is None or val == "" or val == []:
            continue
        if key in ("income_statement", "balance_sheet", "cash_flow"):
            if isinstance(val, dict) and val.get("rows"):
                if not base.get(key, {}).get("rows"):
                    base[key] = val
            continue
        if key == "key_stats":
            if val and not base.get("key_stats"):
                base[key] = val
            continue
        if base.get(key) is None:
            base[key] = val
    return base
