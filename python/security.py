"""
Orion Alpha — API security helpers (validation, rate limits, headers).
"""

from __future__ import annotations

import os
import re
import time
from collections import defaultdict
from typing import Callable

SYMBOL_PATTERN = re.compile(r"^[A-Z0-9^=.-]{2,14}$")
VALID_TIMEFRAMES = frozenset({"1D", "1W", "1M", "3M", "1Y", "ALL"})
VALID_SIDES = frozenset({"BUY", "SELL"})
VALID_ORDER_TYPES = frozenset({"LIMIT", "MARKET"})

MAX_BODY_BYTES = 16_384
RATE_LIMIT_WINDOW_SEC = 60
RATE_LIMIT_MAX_REQUESTS = 120

_rate_buckets: dict[str, list[float]] = defaultdict(list)


def allowed_origins() -> list[str]:
    raw = os.environ.get(
        "ALLOWED_ORIGINS",
        "http://localhost:3000,http://127.0.0.1:3000",
    )
    origins: list[str] = []
    for o in raw.split(","):
        o = o.strip()
        if not o:
            continue
        if "://" not in o:
            o = f"https://{o}"
        origins.append(o)
    return origins or ["http://localhost:3000"]


def validate_symbol(symbol: str) -> str:
    sym = (symbol or "").upper().strip()
    if not sym or not SYMBOL_PATTERN.match(sym):
        raise ValueError(f"Invalid symbol: {symbol}")
    return sym


def validate_timeframe(tf: str) -> str:
    val = (tf or "1D").upper().strip()
    if val not in VALID_TIMEFRAMES:
        raise ValueError(f"Invalid timeframe: {tf}")
    return val


def validate_order_payload(body: dict) -> dict:
    side = str(body.get("side", "")).upper().strip()
    if side not in VALID_SIDES:
        raise ValueError("Invalid order side")
    otype = str(body.get("type", "LIMIT")).upper().strip()
    if otype not in VALID_ORDER_TYPES:
        raise ValueError("Invalid order type")
    try:
        qty = int(body["qty"])
        price = float(body.get("price", 0))
    except (KeyError, TypeError, ValueError) as exc:
        raise ValueError("Invalid order quantity or price") from exc
    if qty <= 0 or qty > 10_000:
        raise ValueError("Quantity out of allowed range")
    if otype == "LIMIT" and price <= 0:
        raise ValueError("Limit orders require a positive price")
    if price < 0 or price > 1_000_000:
        raise ValueError("Price out of allowed range")
    return {"side": side, "type": otype, "qty": qty, "price": price}


def check_rate_limit(client_key: str) -> bool:
    """Return True if request is allowed."""
    now = time.time()
    bucket = _rate_buckets[client_key]
    cutoff = now - RATE_LIMIT_WINDOW_SEC
    _rate_buckets[client_key] = [t for t in bucket if t > cutoff]
    if len(_rate_buckets[client_key]) >= RATE_LIMIT_MAX_REQUESTS:
        return False
    _rate_buckets[client_key].append(now)
    return True


SECURITY_HEADERS = {
    "X-Content-Type-Options": "nosniff",
    "X-Frame-Options": "DENY",
    "Referrer-Policy": "strict-origin-when-cross-origin",
    "Permissions-Policy": "camera=(), microphone=(), geolocation=()",
    "X-XSS-Protection": "1; mode=block",
}


def security_status() -> dict:
    return {
        "status": "ok",
        "features": {
            "symbol_validation": True,
            "input_sanitization": True,
            "rate_limiting": True,
            "cors_restricted": True,
            "security_headers": True,
            "api_path_allowlist": True,
            "order_bounds_check": True,
            "proxy_isolation": True,
        },
        "limits": {
            "max_body_bytes": MAX_BODY_BYTES,
            "rate_limit_per_minute": RATE_LIMIT_MAX_REQUESTS,
            "symbol_pattern": SYMBOL_PATTERN.pattern,
        },
        "service": "Orion Alpha API",
    }
