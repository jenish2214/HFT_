"""
Real market data feed via yfinance with extended quote fields.
"""

import time
from concurrent.futures import ThreadPoolExecutor
from dataclasses import dataclass, field

import yfinance as yf

from google_finance_feed import fetch_google_quote
from market_data_provider import (
    DATA_NOT_FOUND_MSG,
    fetch_quote_with_fallback,
    merge_quote_into_row,
    report_has_data,
)
from market_hours import market_session

# yfinance period/interval pairs (valid combinations)
CHART_TIMEFRAMES = {
    "1D": {"period": "1d", "interval": "1m", "label": "1m", "max_bars": 390},
    "1W": {"period": "5d", "interval": "5m", "label": "5m", "max_bars": 500},
    "1M": {"period": "1mo", "interval": "1h", "label": "1h", "max_bars": 500},
    "3M": {"period": "3mo", "interval": "1d", "label": "1D", "max_bars": 95},
    "1Y": {"period": "1y", "interval": "1d", "label": "1D", "max_bars": 370},
    "ALL": {"period": "max", "interval": "1wk", "label": "1W", "max_bars": 520},
}


@dataclass
class Tick:
    symbol: str
    price: float
    bid: float
    ask: float
    volume: int
    timestamp_ns: int
    source: str = "yfinance"
    change: float = 0.0
    change_pct: float = 0.0
    day_high: float = 0.0
    day_low: float = 0.0
    open: float = 0.0
    prev_close: float = 0.0


@dataclass
class YFinanceFeed:
    symbol: str = "AAPL"
    poll_interval_open_s: float = 0.5
    poll_interval_closed_s: float = 5.0
    tick_interval_ms: float = 400.0

    price: float = field(init=False)
    bid: float = field(init=False)
    ask: float = field(init=False)
    volume: int = field(default=0, init=False)
    change: float = field(default=0.0, init=False)
    change_pct: float = field(default=0.0, init=False)
    day_high: float = field(default=0.0, init=False)
    day_low: float = field(default=0.0, init=False)
    open: float = field(default=0.0, init=False)
    prev_close: float = field(default=0.0, init=False)
    tick_count: int = field(default=0, init=False)
    last_poll: float = field(default=0.0, init=False)
    price_history: list = field(default_factory=list, init=False)
    chart_bars: list = field(default_factory=list, init=False)
    chart_timeframe: str = field(default="1D", init=False)
    last_chart_fetch: float = field(default=0.0, init=False)
    last_update_ts: float = field(default=0.0, init=False)
    _ticker: yf.Ticker = field(init=False, repr=False)
    _session_started: float = field(default=0.0, init=False)
    _refresh_failures: int = field(default=0, init=False)
    _data_source: str = field(default="yfinance", init=False)

    def __post_init__(self):
        self._session_started = time.time()
        self._ticker = yf.Ticker(self.symbol)
        self.price = 0.0
        self.bid = 0.0
        self.ask = 0.0
        self._refresh(force=True)

    def _poll_interval(self) -> float:
        session = market_session()
        if session["is_regular_hours"]:
            return self.poll_interval_open_s
        if session["is_live"]:
            return self.poll_interval_open_s * 1.5
        return self.poll_interval_closed_s

    def _patch_live_candle(self) -> None:
        """Update the latest 1D candle from the live quote without refetching history."""
        if self.chart_timeframe != "1D" or not self.chart_bars or self.price <= 0:
            return
        if not market_session()["is_live"]:
            return
        last = self.chart_bars[-1]
        if abs(last["close"] - self.price) < 0.0001:
            return
        self.chart_bars[-1] = {
            **last,
            "high": round(max(last["high"], self.price), 2),
            "low": round(min(last["low"], self.price), 2),
            "close": self.price,
            "volume": self.volume or last["volume"],
        }

    @staticmethod
    def _fi(info, *keys):
        for k in keys:
            v = getattr(info, k, None)
            if v is not None and v != 0:
                return float(v)
        return None

    def _reset_ticker_session(self) -> None:
        """Refresh yfinance client after long runs or repeated failures."""
        self._ticker = yf.Ticker(self.symbol)
        self._session_started = time.time()
        self._refresh_failures = 0
        print(f"[yfinance] refreshed session for {self.symbol}")

    def _maybe_reset_ticker(self) -> None:
        age = time.time() - self._session_started
        if self._refresh_failures >= 5 or age > 1800:
            self._reset_ticker_session()

    def _fetch_chart_bars(self, force: bool = False) -> None:
        session = market_session()
        tf = CHART_TIMEFRAMES.get(self.chart_timeframe, CHART_TIMEFRAMES["1D"])
        # Intraday refreshes faster; daily+ weekly slower
        if self.chart_timeframe == "1D":
            interval_s = 3.0 if session["is_regular_hours"] else (8.0 if session["is_live"] else 60.0)
        elif self.chart_timeframe in ("1W", "1M"):
            interval_s = 30.0 if session["is_live"] else 120.0
        else:
            interval_s = 300.0

        now = time.time()
        if not force and now - self.last_chart_fetch < interval_s:
            return

        try:
            hist = self._ticker.history(period=tf["period"], interval=tf["interval"])
            if hist.empty:
                return

            bars = []
            for idx, row in hist.iterrows():
                ts = idx.timestamp() if hasattr(idx, "timestamp") else float(idx)
                ts = int(ts)
                if ts > 1_000_000_000_000:
                    ts //= 1000
                bars.append({
                    "ts": ts,
                    "open": round(float(row["Open"]), 2),
                    "high": round(float(row["High"]), 2),
                    "low": round(float(row["Low"]), 2),
                    "close": round(float(row["Close"]), 2),
                    "volume": int(row["Volume"]) if row["Volume"] == row["Volume"] else 0,
                })

            # Live tick append only on intraday 1D view
            if (
                self.chart_timeframe == "1D"
                and session["is_live"]
                and self.price > 0
                and bars
            ):
                last = bars[-1]
                if abs(last["close"] - self.price) > 0.001:
                    live_ts = int(now)
                    if live_ts <= last["ts"]:
                        bars[-1] = {
                            **last,
                            "high": round(max(last["high"], self.price), 2),
                            "low": round(min(last["low"], self.price), 2),
                            "close": self.price,
                            "volume": self.volume or last["volume"],
                        }
                    else:
                        bars.append({
                            "ts": live_ts,
                            "open": last["close"],
                            "high": round(max(last["close"], self.price), 2),
                            "low": round(min(last["close"], self.price), 2),
                            "close": self.price,
                            "volume": self.volume or last["volume"],
                        })

            self.chart_bars = bars[-tf["max_bars"] :]
            self.last_chart_fetch = now
        except Exception as exc:
            print(f"[yfinance] chart fetch failed ({self.chart_timeframe}): {exc}")

    def set_timeframe(self, timeframe: str) -> None:
        tf = timeframe.upper().strip()
        if tf not in CHART_TIMEFRAMES:
            raise ValueError(f"Invalid timeframe: {timeframe}. Use: {', '.join(CHART_TIMEFRAMES)}")
        self.chart_timeframe = tf
        self.chart_bars = []
        self.last_chart_fetch = 0.0
        self._fetch_chart_bars(force=True)

    def chart_meta(self) -> dict:
        tf = CHART_TIMEFRAMES.get(self.chart_timeframe, CHART_TIMEFRAMES["1D"])
        return {
            "timeframe": self.chart_timeframe,
            "interval_label": tf["label"],
            "period": tf["period"],
            "interval": tf["interval"],
            "bar_count": len(self.chart_bars),
        }

    def _refresh(self, force: bool = False) -> bool:
        now = time.time()
        interval = self._poll_interval()
        if not force and now - self.last_poll < interval:
            return False

        try:
            info = self._ticker.fast_info
            last = self._fi(info, "last_price", "lastPrice")
            bid = self._fi(info, "bid", "Bid")
            ask = self._fi(info, "ask", "Ask")
            day_high = self._fi(info, "day_high", "dayHigh")
            day_low = self._fi(info, "day_low", "dayLow")
            open_p = self._fi(info, "open", "regularMarketOpen", "Open")
            prev = self._fi(info, "previous_close", "previousClose", "regularMarketPreviousClose")

            if last and last > 0:
                self.price = round(last, 2)
            if bid and bid > 0:
                self.bid = round(bid, 2)
            elif self.price > 0:
                self.bid = round(self.price - 0.01, 2)
            if ask and ask > 0:
                self.ask = round(ask, 2)
            elif self.price > 0:
                self.ask = round(self.price + 0.01, 2)

            if day_high:
                self.day_high = round(day_high, 2)
            if day_low:
                self.day_low = round(day_low, 2)
            if open_p:
                self.open = round(open_p, 2)
            if prev:
                self.prev_close = round(prev, 2)

            if self.price <= 0:
                hist = self._ticker.history(period="1d", interval="1m")
                if not hist.empty:
                    self.price = round(float(hist["Close"].iloc[-1]), 2)
                    self.bid = round(self.price - 0.01, 2)
                    self.ask = round(self.price + 0.01, 2)
                    if self.day_high <= 0:
                        self.day_high = round(float(hist["High"].max()), 2)
                    if self.day_low <= 0:
                        self.day_low = round(float(hist["Low"].min()), 2)
                    if self.open <= 0:
                        self.open = round(float(hist["Open"].iloc[0]), 2)

            if self.price <= 0:
                gq = fetch_google_quote(self.symbol)
                if gq and gq.get("price", 0) > 0:
                    self.price = float(gq["price"])
                    self.bid = float(gq.get("bid") or self.price - 0.01)
                    self.ask = float(gq.get("ask") or self.price + 0.01)
                    self.change = float(gq.get("change") or 0)
                    self.change_pct = float(gq.get("change_pct") or 0)
                    if gq.get("prev_close"):
                        self.prev_close = float(gq["prev_close"])
                    self._data_source = "google-finance"
                else:
                    self._data_source = "none"
            else:
                self._data_source = "yfinance-live" if market_session()["is_live"] else "yfinance-delayed"

            if self.prev_close > 0 and self.price > 0:
                self.change = round(self.price - self.prev_close, 2)
                self.change_pct = round((self.change / self.prev_close) * 100, 2)

            vol = getattr(info, "last_volume", None) or getattr(info, "volume", None)
            if vol:
                self.volume = int(vol)

            if self.price > 0:
                self.price_history.append({"ts": int(now), "price": self.price})
                self.price_history = self.price_history[-120:]
                self.last_update_ts = now

            self._fetch_chart_bars(force=force)
            self._patch_live_candle()

            self.last_poll = now
            self._refresh_failures = 0
            return True
        except Exception as exc:
            self._refresh_failures += 1
            print(f"[yfinance] refresh failed for {self.symbol}: {exc}")
            self._maybe_reset_ticker()
            return False

    def next_tick(self) -> Tick:
        self._refresh()
        self.tick_count += 1
        session = market_session()
        source = getattr(self, "_data_source", "yfinance-live" if session["is_live"] else "yfinance-delayed")
        return Tick(
            symbol=self.symbol,
            price=self.price,
            bid=self.bid,
            ask=self.ask,
            volume=self.volume or 0,
            timestamp_ns=time.time_ns(),
            source=source,
            change=self.change,
            change_pct=self.change_pct,
            day_high=self.day_high,
            day_low=self.day_low,
            open=self.open,
            prev_close=self.prev_close,
        )

    def get_quote(self) -> dict:
        self._refresh(force=True)
        session = market_session()
        data_found = self.price > 0
        source = getattr(self, "_data_source", "yfinance-live" if session["is_live"] else "yfinance-delayed")
        if not data_found:
            source = "none"
        return {
            "symbol": self.symbol,
            "price": self.price,
            "bid": self.bid,
            "ask": self.ask,
            "spread": round(self.ask - self.bid, 2) if self.ask and self.bid else 0,
            "volume": self.volume,
            "change": self.change,
            "change_pct": self.change_pct,
            "day_high": self.day_high,
            "day_low": self.day_low,
            "open": self.open,
            "prev_close": self.prev_close,
            "source": source,
            "data_found": data_found,
            "sources_tried": ["yfinance", "google-finance"] if not data_found else [source.split("-")[0] if "-" in source else source],
            "message": None if data_found else DATA_NOT_FOUND_MSG,
            "market": session,
            "price_history": self.price_history[-60:],
            "chart_bars": self.chart_bars,
            "last_update_ts": self.last_update_ts,
            **self.chart_meta(),
        }

    def set_symbol(self, symbol: str) -> None:
        self.symbol = symbol.upper().strip()
        self._ticker = yf.Ticker(self.symbol)
        self.tick_count = 0
        self.last_poll = 0.0
        self.price = 0.0
        self.bid = 0.0
        self.ask = 0.0
        self.volume = 0
        self.change = 0.0
        self.change_pct = 0.0
        self.day_high = 0.0
        self.day_low = 0.0
        self.open = 0.0
        self.prev_close = 0.0
        self.price_history = []
        self.chart_bars = []
        self.chart_timeframe = "1D"
        self.last_chart_fetch = 0.0
        self._refresh(force=True)


WATCHLIST_SYMBOLS = ["AAPL", "MSFT", "GOOGL", "TSLA", "AMZN", "NVDA", "META", "SPY"]

MARKET_UNIVERSE: dict[str, dict] = {
    "equity": {
        "label": "Equities",
        "symbols": [
            ("AAPL", "Apple Inc"),
            ("MSFT", "Microsoft"),
            ("GOOGL", "Alphabet"),
            ("NVDA", "NVIDIA"),
            ("TSLA", "Tesla"),
            ("AMZN", "Amazon"),
            ("META", "Meta Platforms"),
            ("JPM", "JPMorgan Chase"),
            ("XOM", "Exxon Mobil"),
        ],
    },
    "crypto": {
        "label": "Crypto",
        "symbols": [
            ("BTC-USD", "Bitcoin"),
            ("ETH-USD", "Ethereum"),
            ("SOL-USD", "Solana"),
            ("BNB-USD", "BNB"),
            ("XRP-USD", "Ripple"),
        ],
    },
    "commodity": {
        "label": "Commodities",
        "symbols": [
            ("GC=F", "Gold"),
            ("CL=F", "WTI Crude Oil"),
            ("SI=F", "Silver"),
            ("NG=F", "Natural Gas"),
            ("HG=F", "Copper"),
            ("ZC=F", "Corn"),
        ],
    },
    "index": {
        "label": "Indices & ETFs",
        "symbols": [
            ("SPY", "S&P 500 ETF"),
            ("QQQ", "Nasdaq 100 ETF"),
            ("DIA", "Dow Jones ETF"),
            ("IWM", "Russell 2000 ETF"),
            ("^VIX", "VIX Volatility"),
            ("^GSPC", "S&P 500 Index"),
        ],
    },
    "fx": {
        "label": "FX",
        "symbols": [
            ("EURUSD=X", "EUR / USD"),
            ("GBPUSD=X", "GBP / USD"),
            ("USDJPY=X", "USD / JPY"),
            ("DX-Y.NYB", "US Dollar Index"),
        ],
    },
    "rates": {
        "label": "Rates",
        "symbols": [
            ("^TNX", "10Y Treasury Yield"),
            ("TLT", "20Y+ Treasury ETF"),
            ("SHY", "1-3Y Treasury ETF"),
        ],
    },
}


def _build_orion_universe() -> tuple[list[str], dict[str, dict]]:
    symbols: list[str] = []
    meta: dict[str, dict] = {}
    for cat_id, cat in MARKET_UNIVERSE.items():
        for sym, name in cat["symbols"]:
            symbols.append(sym)
            meta[sym] = {
                "name": name,
                "asset_class": cat_id,
                "asset_class_label": cat["label"],
            }
    return symbols, meta


ORION_UNIVERSE_SYMBOLS, ORION_SYMBOL_META = _build_orion_universe()
WATCHLIST_SYMBOLS = ORION_UNIVERSE_SYMBOLS

_watchlist_cache: list[dict] = []
_watchlist_ts: float = 0.0
_watchlist_refreshing: bool = False
_watchlist_executor = ThreadPoolExecutor(max_workers=12, thread_name_prefix="watch")
_overview_cache: dict | None = None
_overview_ts: float = 0.0
_research_cache: dict[str, dict] = {}
_research_cache_ts: dict[str, float] = {}
_report_cache: dict[str, dict] = {}
_report_cache_ts: dict[str, float] = {}
_all_reports_cache: list[dict] = []
_all_reports_ts: float = 0.0
_REPORT_TTL = 3600.0


def _safe_float(val) -> float | None:
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


def _row_value(df, names: tuple[str, ...], col):
    for name in names:
        if name in df.index:
            return _safe_float(df.loc[name, col])
    return None


def _year_label(col) -> str:
    if hasattr(col, "year"):
        return str(col.year)
    return str(col)[:4]


def _build_statement(df, row_defs: list[tuple[str, tuple[str, ...]]], max_years: int = 4) -> dict:
    """Extract multi-year financial statement rows from a yfinance dataframe."""
    if df is None or df.empty:
        return {"years": [], "rows": []}

    years_cols = list(df.columns[:max_years])
    years = [_year_label(c) for c in years_cols]
    rows: list[dict] = []

    for label, keys in row_defs:
        values: list[float | None] = []
        values_fmt: list[str | None] = []
        for col in years_cols:
            v = _row_value(df, keys, col)
            values.append(v)
            values_fmt.append(_fmt_large(v))
        if any(v is not None for v in values):
            rows.append({"label": label, "values": values, "values_fmt": values_fmt})

    return {"years": years, "rows": rows}


INCOME_ROWS = [
    ("Total Revenue", ("Total Revenue", "Operating Revenue")),
    ("Cost of Revenue", ("Cost Of Revenue", "Reconciled Cost Of Revenue")),
    ("Gross Profit", ("Gross Profit",)),
    ("Operating Expenses", ("Operating Expense", "Total Operating Expenses As Reported")),
    ("Operating Income", ("Operating Income", "EBIT")),
    ("Interest Expense", ("Interest Expense", "Interest Expense Non Operating")),
    ("Pretax Income", ("Pretax Income", "Income Before Tax")),
    ("Tax Provision", ("Tax Provision",)),
    ("Net Income", ("Net Income", "Net Income Common Stockholders")),
    ("EBITDA", ("EBITDA", "Normalized EBITDA")),
    ("Basic EPS", ("Basic EPS",)),
    ("Diluted EPS", ("Diluted EPS",)),
]

BALANCE_ROWS = [
    ("Total Assets", ("Total Assets",)),
    ("Current Assets", ("Current Assets",)),
    ("Cash & Equivalents", ("Cash And Cash Equivalents", "Cash Cash Equivalents And Short Term Investments")),
    ("Total Liabilities", ("Total Liabilities Net Minority Interest", "Total Liabilities")),
    ("Current Liabilities", ("Current Liabilities",)),
    ("Total Debt", ("Total Debt", "Long Term Debt And Capital Lease Obligation")),
    ("Stockholders Equity", ("Stockholders Equity", "Total Equity Gross Minority Interest")),
    ("Retained Earnings", ("Retained Earnings",)),
    ("Working Capital", ("Working Capital",)),
]

CASHFLOW_ROWS = [
    ("Operating Cash Flow", ("Operating Cash Flow", "Cash Flow From Continuing Operating Activities")),
    ("Investing Cash Flow", ("Investing Cash Flow", "Cash Flow From Continuing Investing Activities")),
    ("Financing Cash Flow", ("Financing Cash Flow", "Cash Flow From Continuing Financing Activities")),
    ("Capital Expenditure", ("Capital Expenditure", "Capital Expenditure Reported")),
    ("Free Cash Flow", ("Free Cash Flow",)),
    ("Dividends Paid", ("Cash Dividends Paid", "Common Stock Dividend Paid")),
    ("Stock Repurchased", ("Repurchase Of Capital Stock", "Common Stock Payments")),
    ("Change in Cash", ("Changes In Cash", "Change In Cash Supplemental As Reported")),
]


def _extract_key_stats(info: dict) -> list[dict]:
    """Key valuation and profitability metrics from yfinance info."""
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
        ("Total Cash", "totalCash", "large"),
        ("Total Debt", "totalDebt", "large"),
        ("EBITDA", "ebitda", "large"),
        ("Revenue (TTM)", "totalRevenue", "large"),
        ("Gross Profits", "grossProfits", "large"),
    ]

    stats: list[dict] = []
    for label, key, fmt in fields:
        raw = info.get(key)
        if raw is None or raw != raw:
            continue
        try:
            val = float(raw)
        except (TypeError, ValueError):
            continue

        if fmt == "pct":
            display = f"{val * 100:.2f}%"
        elif fmt == "money":
            display = f"${val:.2f}"
        elif fmt == "large":
            display = _fmt_large(val) or str(val)
        elif fmt == "ratio":
            display = f"{val:.2f}"
        else:
            display = f"{val:.2f}"

        stats.append({"label": label, "value": val, "display": display})

    return stats


def fetch_company_report(symbol: str) -> dict:
    """Annual-report style fundamentals for a single symbol."""
    sym = symbol.upper().strip()
    now = time.time()
    cached = _report_cache.get(sym)
    if cached and now - _report_cache_ts.get(sym, 0) < _REPORT_TTL:
        return cached

    report: dict = {
        "symbol": sym,
        "name": sym,
        "sector": None,
        "industry": None,
        "description": None,
        "website": None,
        "employees": None,
        "market_cap": None,
        "market_cap_fmt": None,
        "pe_ratio": None,
        "eps": None,
        "dividend_yield": None,
        "fifty_two_week_high": None,
        "fifty_two_week_low": None,
        "annual_reports": [],
        "income_statement": {"years": [], "rows": []},
        "balance_sheet": {"years": [], "rows": []},
        "cash_flow": {"years": [], "rows": []},
        "key_stats": [],
    }

    try:
        t = yf.Ticker(sym)
        info = t.info or {}
        report.update({
            "name": info.get("longName") or info.get("shortName") or sym,
            "sector": info.get("sector"),
            "industry": info.get("industry"),
            "description": (info.get("longBusinessSummary") or "")[:800] or None,
            "website": info.get("website"),
            "employees": info.get("fullTimeEmployees"),
            "market_cap": _safe_float(info.get("marketCap")),
            "market_cap_fmt": _fmt_large(_safe_float(info.get("marketCap"))),
            "pe_ratio": _safe_float(info.get("trailingPE")),
            "eps": _safe_float(info.get("trailingEps")),
            "dividend_yield": _safe_float(info.get("dividendYield")),
            "fifty_two_week_high": _safe_float(info.get("fiftyTwoWeekHigh")),
            "fifty_two_week_low": _safe_float(info.get("fiftyTwoWeekLow")),
            "key_stats": _extract_key_stats(info),
        })

        fin = t.financials
        if fin is not None and not fin.empty:
            years = list(fin.columns[:4])
            annual: list[dict] = []
            for col in years:
                year = _year_label(col)
                revenue = _row_value(fin, ("Total Revenue", "Operating Revenue"), col)
                gross = _row_value(fin, ("Gross Profit",), col)
                operating = _row_value(fin, ("Operating Income", "EBIT"), col)
                net = _row_value(fin, ("Net Income", "Net Income Common Stockholders"), col)
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
            report["annual_reports"] = annual

        report["income_statement"] = _build_statement(fin, INCOME_ROWS)

        bs = t.balance_sheet
        report["balance_sheet"] = _build_statement(bs, BALANCE_ROWS)

        cf = t.cashflow
        report["cash_flow"] = _build_statement(cf, CASHFLOW_ROWS)
    except Exception as exc:
        print(f"[yfinance] company report failed ({sym}): {exc}")

    if not report_has_data(report):
        gq = fetch_quote_with_fallback(sym)
        if gq.get("data_found"):
            report["name"] = gq.get("name") or report["name"]
            report["data_source"] = gq.get("source", "google-finance")
            report["data_found"] = True
            report["partial"] = True
            report["message"] = "Limited data from Google Finance. Full fundamentals not available — try again later."
        else:
            report["data_found"] = False
            report["data_source"] = "none"
            report["sources_tried"] = gq.get("sources_tried", ["yfinance", "google-finance"])
            report["message"] = DATA_NOT_FOUND_MSG
    else:
        report["data_found"] = True
        report["data_source"] = "yfinance"
        report["partial"] = False

    _report_cache[sym] = report
    _report_cache_ts[sym] = now
    return report


def fetch_all_company_reports() -> list[dict]:
    """Summaries for every watchlist symbol — annual report directory."""
    global _all_reports_cache, _all_reports_ts
    now = time.time()
    if _all_reports_cache and now - _all_reports_ts < _REPORT_TTL:
        return _all_reports_cache

    rows = []
    equity_syms = [sym for sym, _ in MARKET_UNIVERSE["equity"]["symbols"]]
    for sym in equity_syms:
        r = fetch_company_report(sym)
        rows.append({
            "symbol": r["symbol"],
            "name": r["name"],
            "sector": r["sector"],
            "industry": r["industry"],
            "market_cap_fmt": r["market_cap_fmt"],
            "pe_ratio": r["pe_ratio"],
            "eps": r["eps"],
            "latest_revenue_fmt": (
                r["annual_reports"][0]["revenue_fmt"]
                if r.get("annual_reports") else None
            ),
            "latest_net_income_fmt": (
                r["annual_reports"][0]["net_income_fmt"]
                if r.get("annual_reports") else None
            ),
            "report_year": (
                r["annual_reports"][0]["year"]
                if r.get("annual_reports") else None
            ),
        })

    _all_reports_cache = rows
    _all_reports_ts = now
    return rows


def _fetch_one_watch_row(sym: str) -> dict:
    """Single watchlist row — yfinance with Google Finance fallback."""
    meta = ORION_SYMBOL_META.get(sym, {})
    row: dict = {
        "symbol": sym,
        "name": meta.get("name") or sym,
        "sector": None,
        "asset_class": meta.get("asset_class"),
        "asset_class_label": meta.get("asset_class_label"),
        "price": 0,
        "change": 0,
        "change_pct": 0,
    }
    try:
        quote = fetch_quote_with_fallback(sym)
        dec = 4 if meta.get("asset_class") == "fx" else 2
        if quote.get("data_found"):
            row.update({
                "name": quote.get("name") or row["name"],
                "price": round(float(quote["price"]), dec),
                "change": round(float(quote.get("change") or 0), dec),
                "change_pct": round(float(quote.get("change_pct") or 0), 2),
                "source": quote.get("source"),
                "data_found": True,
            })
        else:
            row.update({
                "data_found": False,
                "source": "none",
                "sources_tried": quote.get("sources_tried"),
                "message": quote.get("message", DATA_NOT_FOUND_MSG),
            })
    except Exception:
        cached = next((r for r in _watchlist_cache if r["symbol"] == sym), None)
        if cached:
            return cached
        row["data_found"] = False
        row["message"] = DATA_NOT_FOUND_MSG
    return row


def _refresh_watchlist_sync() -> list[dict]:
    global _watchlist_cache, _watchlist_ts, _watchlist_refreshing
    _watchlist_refreshing = True
    try:
        order = {s: i for i, s in enumerate(WATCHLIST_SYMBOLS)}
        rows = list(_watchlist_executor.map(_fetch_one_watch_row, WATCHLIST_SYMBOLS))
        rows.sort(key=lambda r: order.get(r["symbol"], 999))
        _watchlist_cache = rows
        _watchlist_ts = time.time()
        return rows
    finally:
        _watchlist_refreshing = False


def fetch_watchlist() -> list[dict]:
    """Batch quotes for Orion Alpha monitor — parallel fetch, stale-while-revalidate."""
    global _watchlist_cache, _watchlist_ts
    now = time.time()
    if _watchlist_cache and now - _watchlist_ts < 90:
        return _watchlist_cache

    # Serve stale data immediately while a refresh is in flight.
    if _watchlist_refreshing and _watchlist_cache:
        return _watchlist_cache

    if _watchlist_cache and now - _watchlist_ts < 300:
        # Stale but usable — refresh in background thread, don't block /state.
        _watchlist_executor.submit(_refresh_watchlist_sync)
        return _watchlist_cache

    return _refresh_watchlist_sync()


def detect_asset_class(symbol: str) -> str:
    sym = symbol.upper().strip()
    if sym.endswith("-USD") or sym.endswith("-USDT"):
        return "crypto"
    if sym.endswith("=F"):
        return "commodity"
    if sym.endswith("=X") or sym == "DX-Y.NYB":
        return "fx"
    if sym in ("^TNX", "TLT", "SHY"):
        return "rates"
    if sym.startswith("^") or sym in ("SPY", "QQQ", "DIA", "IWM"):
        return "index"
    return "equity"


def _fetch_market_row(sym: str, name: str | None = None, asset_class: str | None = None) -> dict:
    sym = sym.upper().strip()
    ac = asset_class or detect_asset_class(sym)
    row: dict = {
        "symbol": sym,
        "name": name or sym,
        "asset_class": ac,
        "price": 0.0,
        "change": 0.0,
        "change_pct": 0.0,
        "volume": 0,
        "day_high": None,
        "day_low": None,
        "market_cap_fmt": None,
        "fifty_two_week_high": None,
        "fifty_two_week_low": None,
    }
    try:
        t = yf.Ticker(sym)
        fi = t.fast_info
        info = t.info or {}
        price = float(getattr(fi, "last_price", 0) or getattr(fi, "lastPrice", 0) or 0)
        prev = float(getattr(fi, "previous_close", 0) or getattr(fi, "previousClose", 0) or 0)
        chg = price - prev if price and prev else 0.0
        chg_pct = (chg / prev * 100) if prev else 0.0
        vol = getattr(fi, "last_volume", None) or getattr(fi, "volume", None) or info.get("volume")
        row.update({
            "name": name or info.get("shortName") or info.get("longName") or sym,
            "price": round(price, 4 if ac in ("fx", "rates") else 2),
            "change": round(chg, 4 if ac in ("fx", "rates") else 2),
            "change_pct": round(chg_pct, 2),
            "volume": int(vol) if vol else 0,
            "day_high": _safe_float(getattr(fi, "day_high", None) or info.get("dayHigh")),
            "day_low": _safe_float(getattr(fi, "day_low", None) or info.get("dayLow")),
            "market_cap_fmt": _fmt_large(_safe_float(info.get("marketCap"))),
            "fifty_two_week_high": _safe_float(info.get("fiftyTwoWeekHigh")),
            "fifty_two_week_low": _safe_float(info.get("fiftyTwoWeekLow")),
            "sector": info.get("sector"),
            "currency": info.get("currency"),
            "source": "yfinance",
            "data_found": price > 0,
        })
    except Exception as exc:
        print(f"[yfinance] market row failed ({sym}): {exc}")

    if row.get("price", 0) <= 0:
        quote = fetch_quote_with_fallback(sym)
        merge_quote_into_row(row, quote)
    else:
        row["data_found"] = True
    return row


def fetch_markets_overview() -> dict:
    """Cross-asset market board — equities, crypto, commodities, indices, FX, rates."""
    global _overview_cache, _overview_ts
    now = time.time()
    if _overview_cache and now - _overview_ts < 60:
        return _overview_cache

    categories: dict[str, dict] = {}
    all_assets: list[dict] = []

    for cat_id, cat in MARKET_UNIVERSE.items():
        assets: list[dict] = []
        for item in cat["symbols"]:
            sym, label = item if isinstance(item, tuple) else (item, item)
            row = _fetch_market_row(sym, label, cat_id)
            assets.append(row)
            all_assets.append(row)
        categories[cat_id] = {"label": cat["label"], "assets": assets}

    up = sum(1 for a in all_assets if a.get("change_pct", 0) > 0)
    down = sum(1 for a in all_assets if a.get("change_pct", 0) < 0)
    flat = len(all_assets) - up - down
    sorted_assets = sorted(all_assets, key=lambda a: a.get("change_pct", 0), reverse=True)

    result = {
        "categories": categories,
        "breadth": {"up": up, "down": down, "flat": flat, "total": len(all_assets)},
        "top_gainers": sorted_assets[:5],
        "top_losers": sorted_assets[-5:][::-1],
        "updated_ts": now,
    }
    _overview_cache = result
    _overview_ts = now
    return result


def fetch_banker_desk() -> dict:
    """Investment banker macro desk — cross-asset snapshot with risk sentiment."""
    overview = fetch_markets_overview()
    cats = overview["categories"]

    def _avg_chg(cat_id: str) -> float:
        assets = cats.get(cat_id, {}).get("assets", [])
        if not assets:
            return 0.0
        return round(sum(a.get("change_pct", 0) for a in assets) / len(assets), 2)

    equity_avg = _avg_chg("equity")
    crypto_avg = _avg_chg("crypto")
    commodity_avg = _avg_chg("commodity")
    index_avg = _avg_chg("index")

    risk_score = equity_avg + index_avg * 0.5 + crypto_avg * 0.3
    if risk_score > 0.3:
        sentiment = "Risk-On"
    elif risk_score < -0.3:
        sentiment = "Risk-Off"
    else:
        sentiment = "Neutral"

    headline = []
    for key in ("index", "rates", "commodity", "crypto", "fx"):
        for a in cats.get(key, {}).get("assets", [])[:2]:
            headline.append(a)

    return {
        **overview,
        "macro": {
            "sentiment": sentiment,
            "risk_score": round(risk_score, 2),
            "equity_avg_chg": equity_avg,
            "crypto_avg_chg": crypto_avg,
            "commodity_avg_chg": commodity_avg,
            "index_avg_chg": index_avg,
            "headline_assets": headline[:8],
        },
    }


def fetch_research_profile(symbol: str) -> dict:
    """Professional research desk — fundamentals, peers, asset-class context."""
    sym = symbol.upper().strip()
    now = time.time()
    cached = _research_cache.get(sym)
    if cached and now - _research_cache_ts.get(sym, 0) < _REPORT_TTL:
        return cached

    asset_class = detect_asset_class(sym)
    quote = _fetch_market_row(sym)
    report = fetch_company_report(sym) if asset_class == "equity" else None

    overview = fetch_markets_overview()
    same_class = overview["categories"].get(asset_class, {}).get("assets", [])
    peers = sorted(same_class, key=lambda a: abs(a.get("change_pct", 0)), reverse=True)[:8]

    hi = quote.get("fifty_two_week_high")
    lo = quote.get("fifty_two_week_low")
    price = quote.get("price") or 0
    range_pct = None
    from_high = None
    if hi and lo and hi > lo and price:
        range_pct = round((price - lo) / (hi - lo) * 100, 1)
        from_high = round((price - hi) / hi * 100, 2)

    sector_peers: list[dict] = []
    if report and report.get("sector"):
        sector = report["sector"]
        for cat in overview["categories"].values():
            for a in cat.get("assets", []):
                if a.get("sector") == sector and a["symbol"] != sym:
                    sector_peers.append(a)
        sector_peers = sector_peers[:6]

    profile = {
        "symbol": sym,
        "asset_class": asset_class,
        "asset_class_label": MARKET_UNIVERSE.get(asset_class, {}).get("label", asset_class.title()),
        "quote": quote,
        "report": report,
        "data_found": bool(quote.get("data_found") or (report and report.get("data_found"))),
        "data_source": quote.get("source") or (report or {}).get("data_source"),
        "sources_tried": quote.get("sources_tried") or (report or {}).get("sources_tried") or ["yfinance", "google-finance"],
        "message": None if quote.get("data_found") else quote.get("message", DATA_NOT_FOUND_MSG),
        "technicals": {
            "fifty_two_week_high": hi,
            "fifty_two_week_low": lo,
            "range_position_pct": range_pct,
            "from_52w_high_pct": from_high,
            "day_range": (
                f"${quote.get('day_low')} – ${quote.get('day_high')}"
                if quote.get("day_low") and quote.get("day_high") else None
            ),
        },
        "peer_comparison": peers,
        "sector_peers": sector_peers,
        "market_breadth": overview["breadth"],
    }

    _research_cache[sym] = profile
    _research_cache_ts[sym] = now
    return profile
