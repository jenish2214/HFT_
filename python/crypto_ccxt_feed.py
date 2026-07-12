"""
Crypto spot quotes via ccxt — Binance, Coinbase, Bybit, Kraken, OKX, Bitget.
"""

from __future__ import annotations

try:
    import ccxt
except ImportError:
    ccxt = None  # type: ignore[assignment]

CRYPTO_BASES = frozenset({
    "BTC", "ETH", "SOL", "DOGE", "ADA", "XRP", "AVAX", "DOT", "LINK", "MATIC",
    "BNB", "LTC", "UNI", "SHIB", "ATOM", "BCH", "XLM", "NEAR", "APT", "ARB",
    "OP", "FIL", "ICP", "HBAR", "VET", "ALGO", "AAVE", "MKR", "CRO", "PEPE",
})

EXCHANGE_IDS = ("binance", "coinbase", "kraken", "bybit", "okx", "bitget")


def is_crypto_symbol(symbol: str) -> bool:
    sym = symbol.upper().strip()
    if "-" in sym:
        base, quote = sym.split("-", 1)
        return quote in ("USD", "USDT", "USDC") and base in CRYPTO_BASES
    if sym.endswith("USD") and len(sym) > 3:
        base = sym[:-3]
        return base in CRYPTO_BASES
    return False


def to_ccxt_symbol(symbol: str) -> str:
    """Map BTC-USD / BTCUSD → BTC/USDT for liquid ccxt pairs."""
    sym = symbol.upper().strip()
    if "-" in sym:
        base, _quote = sym.split("-", 1)
    elif sym.endswith("USD"):
        base = sym[:-3]
    else:
        base = sym
    return f"{base}/USDT"


def fetch_crypto_quote_ccxt(symbol: str) -> dict | None:
    """Try ccxt exchanges in order. Returns normalized quote dict or None."""
    if ccxt is None:
        return None

    sym = symbol.upper().strip()
    pair = to_ccxt_symbol(sym)
    base = pair.split("/")[0]
    last_error: Exception | None = None

    for ex_id in EXCHANGE_IDS:
        try:
            exchange_cls = getattr(ccxt, ex_id, None)
            if exchange_cls is None:
                continue
            exchange = exchange_cls({"enableRateLimit": True, "timeout": 8000})
            markets = exchange.load_markets()
            target = pair
            if target not in markets:
                alt = f"{base}/USD"
                target = alt if alt in markets else None
            if not target:
                continue

            ticker = exchange.fetch_ticker(target)
            price = float(ticker.get("last") or ticker.get("close") or 0)
            if price <= 0:
                continue

            bid = float(ticker.get("bid") or price - 0.01)
            ask = float(ticker.get("ask") or price + 0.01)
            prev = float(ticker.get("previousClose") or ticker.get("open") or price)
            change = price - prev if prev else float(ticker.get("change") or 0)
            change_pct = float(ticker.get("percentage") or ((change / prev * 100) if prev else 0))
            vol = ticker.get("baseVolume") or ticker.get("quoteVolume") or 0

            return {
                "symbol": sym,
                "name": base,
                "price": round(price, 2),
                "bid": round(bid, 2),
                "ask": round(ask, 2),
                "change": round(change, 2),
                "change_pct": round(change_pct, 2),
                "volume": int(vol) if vol else 0,
                "day_high": ticker.get("high"),
                "day_low": ticker.get("low"),
                "open": ticker.get("open"),
                "prev_close": round(prev, 2) if prev else None,
                "source": f"ccxt:{ex_id}",
                "data_found": True,
                "sources_tried": ["ccxt", ex_id],
            }
        except Exception as exc:
            last_error = exc
            continue

    if last_error:
        print(f"[ccxt] all exchanges failed ({sym}): {last_error}")
    return None
