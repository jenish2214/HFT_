"""Educational event messages for the HFT demo UI."""

import time
from typing import Literal

Stage = Literal["feed", "strategy", "gateway", "engine", "fill"]


def make_event(stage: Stage, message: str, detail: str = "") -> dict:
    return {
        "ts": time.time(),
        "stage": stage,
        "message": message,
        "detail": detail,
    }


def feed_event(symbol: str, price: float, bid: float, ask: float) -> dict:
    return make_event(
        "feed",
        f"Market tick: {symbol} last ${price:.2f}",
        f"Bid ${bid:.2f} · Ask ${ask:.2f} (yfinance)",
    )


def strategy_event(side: str, price: float, qty: int) -> dict:
    return make_event(
        "strategy",
        f"Strategy quotes {side} LIMIT ${price:.2f} × {qty}",
        "Market maker posts bid/ask around mid price to earn spread",
    )


def gateway_event(side: str, order_type: str, price: float, qty: int, strategy: str) -> dict:
    price_str = f"${price:.2f}" if order_type == "LIMIT" else "market"
    return make_event(
        "gateway",
        f"Order sent → {side} {order_type} {price_str} × {qty}",
        f"Routed to C++ engine via TCP (strategy: {strategy})",
    )


def engine_event(latency_ns: int, trades_count: int) -> dict:
    lat = f"{latency_ns / 1000:.1f} µs" if latency_ns >= 1000 else f"{latency_ns} ns"
    return make_event(
        "engine",
        f"Engine matched in {lat}",
        f"{trades_count} trade(s) executed · price-time priority",
    )


def fill_event(side: str, price: float, qty: int, strategy: str) -> dict:
    return make_event(
        "fill",
        f"FILL: {side} {qty} @ ${price:.2f}",
        f"Position updated · strategy: {strategy}",
    )


def seed_event(mid: float) -> dict:
    return make_event(
        "engine",
        f"Order book seeded around ${mid:.2f}",
        "Demo liquidity placed on 5 bid/ask levels",
    )


def demo_intro_events(symbol: str, mid: float) -> list[dict]:
    return [
        make_event(
            "feed",
            "Demo started — watch the pipeline below",
            f"Using live {symbol} price from yfinance as fair value",
        ),
        seed_event(mid),
        make_event(
            "strategy",
            "Market maker (mm_alpha) is now quoting",
            "Posts bid below mid, ask above mid — earns the spread on fills",
        ),
    ]
