"""
Market data simulator — generates realistic tick-by-tick price movement.

In real HFT, this data arrives via multicast feeds (e.g. ITCH, OUCH protocols)
from the exchange. Here we simulate a geometric Brownian motion price path.
"""

import time
from dataclasses import dataclass, field

import numpy as np


@dataclass
class Tick:
    symbol: str
    price: float
    bid: float
    ask: float
    volume: int
    timestamp_ns: int


@dataclass
class MarketSimulator:
    symbol: str = "AAPL"
    initial_price: float = 150.0
    volatility: float = 0.0002
    tick_interval_ms: float = 50.0
    spread_bps: float = 2.0  # basis points

    price: float = field(init=False)
    tick_count: int = field(default=0, init=False)

    def __post_init__(self):
        self.price = self.initial_price
        self.rng = np.random.default_rng(42)

    def _half_spread(self) -> float:
        return self.price * (self.spread_bps / 10000.0) / 2.0

    def next_tick(self) -> Tick:
        # Geometric Brownian motion step
        shock = self.rng.normal(0, self.volatility)
        self.price *= 1.0 + shock
        self.price = round(self.price, 2)

        hs = self._half_spread()
        bid = round(self.price - hs, 2)
        ask = round(self.price + hs, 2)
        volume = int(self.rng.integers(100, 5000))

        self.tick_count += 1
        return Tick(
            symbol=self.symbol,
            price=self.price,
            bid=bid,
            ask=ask,
            volume=volume,
            timestamp_ns=time.time_ns(),
        )
