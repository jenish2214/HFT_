"""
Real market data feed via yfinance with extended quote fields.
"""

import time
from dataclasses import dataclass, field

import yfinance as yf

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
                bars.append({
                    "ts": int(ts),
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
                    bars.append({
                        "ts": int(now),
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
        source = "yfinance-live" if session["is_live"] else "yfinance-delayed"
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
            "source": "yfinance-live" if session["is_live"] else "yfinance-delayed",
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
_watchlist_cache: list[dict] = []
_watchlist_ts: float = 0.0


def fetch_watchlist() -> list[dict]:
    """Batch quotes for Bloomberg-style watchlist panel."""
    global _watchlist_cache, _watchlist_ts
    now = time.time()
    if _watchlist_cache and now - _watchlist_ts < 45:
        return _watchlist_cache

    rows: list[dict] = []
    for sym in WATCHLIST_SYMBOLS:
        try:
            t = yf.Ticker(sym)
            fi = t.fast_info
            price = float(getattr(fi, "last_price", 0) or getattr(fi, "lastPrice", 0) or 0)
            prev = float(getattr(fi, "previous_close", 0) or getattr(fi, "previousClose", 0) or 0)
            chg = price - prev if price and prev else 0.0
            chg_pct = (chg / prev * 100) if prev else 0.0
            rows.append({
                "symbol": sym,
                "price": round(price, 2),
                "change": round(chg, 2),
                "change_pct": round(chg_pct, 2),
            })
        except Exception:
            cached = next((r for r in _watchlist_cache if r["symbol"] == sym), None)
            rows.append(cached or {"symbol": sym, "price": 0, "change": 0, "change_pct": 0})

    _watchlist_cache = rows
    _watchlist_ts = now
    return rows
