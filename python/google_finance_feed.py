"""
Google Finance quote fallback — used when yfinance returns no price.
Parses embedded page data (no API key required).
"""

from __future__ import annotations

import json
import re
import urllib.error
import urllib.request
from typing import Any


def _detect_asset_class(symbol: str) -> str:
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

_USER_AGENT = (
    "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) "
    "AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36"
)

# Yahoo / internal symbol -> (Google ticker, exchange code)
_GOOGLE_SYMBOL_MAP: dict[str, tuple[str, str]] = {
    "AAPL": ("AAPL", "NASDAQ"),
    "MSFT": ("MSFT", "NASDAQ"),
    "GOOGL": ("GOOGL", "NASDAQ"),
    "NVDA": ("NVDA", "NASDAQ"),
    "TSLA": ("TSLA", "NASDAQ"),
    "AMZN": ("AMZN", "NASDAQ"),
    "META": ("META", "NASDAQ"),
    "JPM": ("JPM", "NYSE"),
    "XOM": ("XOM", "NYSE"),
    "BTC-USD": ("BTC-USD", "CCC"),
    "ETH-USD": ("ETH-USD", "CCC"),
    "SOL-USD": ("SOL-USD", "CCC"),
    "BNB-USD": ("BNB-USD", "CCC"),
    "XRP-USD": ("XRP-USD", "CCC"),
    "GC=F": ("GCW00", "COMEX"),
    "CL=F": ("CLW00", "NYMEX"),
    "SI=F": ("SIW00", "COMEX"),
    "NG=F": ("NGW00", "NYMEX"),
    "HG=F": ("HGW00", "COMEX"),
    "ZC=F": ("ZCW00", "CBOT"),
    "SPY": ("SPY", "NYSEARCA"),
    "QQQ": ("QQQ", "NASDAQ"),
    "DIA": ("DIA", "NYSEARCA"),
    "IWM": ("IWM", "NYSEARCA"),
    "^VIX": (".VIX", "INDEXCBOE"),
    "^GSPC": (".INX", "INDEXSP"),
    "EURUSD=X": ("EUR-USD", "CURRENCY"),
    "GBPUSD=X": ("GBP-USD", "CURRENCY"),
    "USDJPY=X": ("USD-JPY", "CURRENCY"),
    "DX-Y.NYB": ("DXY", "INDEX"),
    "^TNX": ("US10Y", "INDEX"),
    "TLT": ("TLT", "NASDAQ"),
    "SHY": ("SHY", "NASDAQ"),
}


def resolve_google_symbol(symbol: str) -> tuple[str, str] | None:
    sym = symbol.upper().strip()
    if sym in _GOOGLE_SYMBOL_MAP:
        return _GOOGLE_SYMBOL_MAP[sym]

    ac = _detect_asset_class(sym)
    if ac == "crypto" and sym.endswith("-USD"):
        return sym, "CCC"
    if ac == "fx" and sym.endswith("=X"):
        base = sym.replace("=X", "")
        if len(base) == 6:
            return f"{base[:3]}-{base[3:]}", "CURRENCY"
    if ac == "equity" and sym.isalpha() and 1 < len(sym) <= 5:
        return sym, "NASDAQ"
    if ac == "index" and sym.startswith("^"):
        return sym[1:], "INDEX"
    return None


def _extract_js_data(html: str, key: str) -> Any | None:
    m = re.search(rf"AF_initDataCallback\(\{{key: '{key}', hash: '[^']+', data:", html)
    if not m:
        return None
    start = m.end()
    depth = 0
    for i in range(start, len(html)):
        ch = html[i]
        if ch == "[":
            depth += 1
        elif ch == "]":
            depth -= 1
            if depth == 0:
                try:
                    return json.loads(html[start : i + 1])
                except json.JSONDecodeError:
                    return None
    return None


def _prev_close_from_ds12(html: str) -> float | None:
    data = _extract_js_data(html, "ds:12")
    if not isinstance(data, list):
        return None
    try:
        candles = data[0][0][3][0][2]
        if not candles:
            return None
        last = candles[-1]
        if isinstance(last, list) and len(last) > 1:
            return float(last[1])
    except (IndexError, TypeError, ValueError):
        return None
    return None


def _fetch_html(ticker: str, exchange: str) -> str | None:
    url = f"https://www.google.com/finance/quote/{ticker}:{exchange}"
    req = urllib.request.Request(url, headers={"User-Agent": _USER_AGENT})
    try:
        with urllib.request.urlopen(req, timeout=12) as resp:
            return resp.read().decode("utf-8", errors="ignore")
    except (urllib.error.URLError, TimeoutError, OSError) as exc:
        print(f"[google-finance] fetch failed ({ticker}:{exchange}): {exc}")
        return None


def fetch_google_quote(symbol: str) -> dict | None:
    """Return quote dict or None if Google Finance has no usable price."""
    sym = symbol.upper().strip()
    resolved = resolve_google_symbol(sym)
    if not resolved:
        return None

    ticker, exchange = resolved
    html = _fetch_html(ticker, exchange)
    if not html:
        return None

    ds5 = _extract_js_data(html, "ds:5")
    if not isinstance(ds5, list) or not ds5 or not isinstance(ds5[0], list):
        return None

    row = ds5[0]
    try:
        price = float(row[4])
    except (IndexError, TypeError, ValueError):
        return None

    if price <= 0:
        return None

    name = str(row[0]) if row and row[0] else sym
    prev = _prev_close_from_ds12(html)
    change = round(price - prev, 4) if prev and prev > 0 else 0.0
    change_pct = round((change / prev) * 100, 2) if prev and prev > 0 else 0.0
    ac = _detect_asset_class(sym)
    dec = 4 if ac in ("fx", "rates") else 2

    return {
        "symbol": sym,
        "name": name,
        "price": round(price, dec),
        "change": round(change, dec),
        "change_pct": change_pct,
        "bid": round(price - 0.01, dec),
        "ask": round(price + 0.01, dec),
        "volume": 0,
        "day_high": None,
        "day_low": None,
        "prev_close": round(prev, dec) if prev else None,
        "source": "google-finance",
        "data_found": True,
    }
