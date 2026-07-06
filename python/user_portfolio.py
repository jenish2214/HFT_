"""
User trading account — tracks manual order fills and live P&L.
"""

from dataclasses import dataclass

from strategy import MarketMaker

INITIAL_EQUITY = 100_000.0


@dataclass
class UserPortfolio(MarketMaker):
    initial_equity: float = INITIAL_EQUITY

    def __post_init__(self):
        self.name = "user"

    def record_order(self) -> None:
        self.state.orders_sent += 1

    def buying_power(self, mark_price: float) -> float:
        p = self.pnl(mark_price)
        equity = self.initial_equity + p["total_pnl"]
        if self.state.position > 0 and mark_price > 0:
            return max(0.0, equity - self.state.position * mark_price)
        if self.state.position < 0 and mark_price > 0:
            return max(0.0, equity - abs(self.state.position) * mark_price * 0.5)
        return max(0.0, equity)

    def to_dict(self, mark_price: float = 0) -> dict:
        p = self.pnl(mark_price)
        equity = round(self.initial_equity + p["total_pnl"], 2)
        return {
            "name": self.name,
            "position": self.state.position,
            "cash": round(self.state.cash, 2),
            "initial_equity": self.initial_equity,
            "equity": equity,
            "buying_power": round(self.buying_power(mark_price), 2),
            "orders_sent": self.state.orders_sent,
            "fills": self.state.fills,
            **p,
        }
