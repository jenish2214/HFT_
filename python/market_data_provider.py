"""
Unified market data — yfinance primary, Google Finance fallback.
"""

from __future__ import annotations

import yfinance as yf

from google_finance_feed import fetch_google_quote

DATA_NOT_FOUND_MSG = "Data not found. Please try again later."
SOURCES = ("yfinance", "google-finance")


def _empty_quote(symbol: str, sources_tried: list[str] | None = None) -> dict:
    return {
        "symbol": symbol.upper().strip(),
        "price": 0.0,
        "bid": 0.0,
        "ask": 0.0,
        "change": 0.0,
        "change_pct": 0.0,
        "volume": 0,
        "day_high": None,
        "day_low": None,
        "open": None,
        "prev_close": None,
        "source": "none",
        "data_found": False,
        "sources_tried": sources_tried or list(SOURCES),
        "message": DATA_NOT_FOUND_MSG,
    }


def _quote_from_yfinance(symbol: str) -> dict | None:
    sym = symbol.upper().strip()
    try:
        ticker = yf.Ticker(sym)
        info = ticker.fast_info
        price = float(getattr(info, "last_price", 0) or getattr(info, "lastPrice", 0) or 0)
        if price <= 0:
            hist = ticker.history(period="1d", interval="1m")
            if hist is not None and not hist.empty:
                price = float(hist["Close"].iloc[-1])

        if price <= 0:
            return None

        prev = float(getattr(info, "previous_close", 0) or getattr(info, "previousClose", 0) or 0)
        bid = float(getattr(info, "bid", 0) or getattr(info, "Bid", 0) or 0)
        ask = float(getattr(info, "ask", 0) or getattr(info, "ask", 0) or 0)
        if bid <= 0:
            bid = price - 0.01
        if ask <= 0:
            ask = price + 0.01

        change = price - prev if prev else 0.0
        change_pct = (change / prev * 100) if prev else 0.0
        vol = getattr(info, "last_volume", None) or getattr(info, "volume", None)

        return {
            "symbol": sym,
            "price": round(price, 2),
            "bid": round(bid, 2),
            "ask": round(ask, 2),
            "change": round(change, 2),
            "change_pct": round(change_pct, 2),
            "volume": int(vol) if vol else 0,
            "day_high": getattr(info, "day_high", None) or getattr(info, "dayHigh", None),
            "day_low": getattr(info, "day_low", None) or getattr(info, "dayLow", None),
            "open": getattr(info, "open", None) or getattr(info, "regularMarketOpen", None),
            "prev_close": round(prev, 2) if prev else None,
            "source": "yfinance",
            "data_found": True,
            "sources_tried": ["yfinance"],
        }
    except Exception as exc:
        print(f"[market-data] yfinance quote failed ({sym}): {exc}")
        return None


def fetch_quote_with_fallback(symbol: str) -> dict:
    """Try yfinance, then Google Finance. Always returns a structured dict."""
    sym = symbol.upper().strip()
    yq = _quote_from_yfinance(sym)
    if yq and yq.get("price", 0) > 0:
        return yq

    gq = fetch_google_quote(sym)
    if gq and gq.get("price", 0) > 0:
        return {
            **gq,
            "sources_tried": ["yfinance", "google-finance"],
            "message": None,
        }

    return _empty_quote(sym)


def merge_quote_into_row(row: dict, quote: dict) -> dict:
    """Apply fallback quote fields onto a market/watchlist row."""
    if quote.get("data_found"):
        row.update({
            "price": quote.get("price", row.get("price", 0)),
            "change": quote.get("change", row.get("change", 0)),
            "change_pct": quote.get("change_pct", row.get("change_pct", 0)),
            "source": quote.get("source", row.get("source")),
            "data_found": True,
        })
        if quote.get("name"):
            row["name"] = quote["name"]
    else:
        row["data_found"] = row.get("price", 0) > 0
        row["source"] = quote.get("source", "none")
        row["sources_tried"] = quote.get("sources_tried", list(SOURCES))
        row["message"] = quote.get("message", DATA_NOT_FOUND_MSG)
    return row


def report_has_data(report: dict) -> bool:
    if report.get("description"):
        return True
    if report.get("annual_reports"):
        return True
    if report.get("key_stats"):
        return True
    if report.get("pe_ratio") is not None:
        return True
    if report.get("income_statement", {}).get("rows"):
        return True
    return False
