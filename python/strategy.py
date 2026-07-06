"""
Simple market-making strategy.
"""

from dataclasses import dataclass, field


@dataclass
class StrategyState:
    position: int = 0
    cash: float = 0.0
    avg_entry: float = 0.0
    realized_pnl: float = 0.0
    orders_sent: int = 0
    fills: int = 0
    max_position: int = 500
    quote_size: int = 100
    spread_offset: float = 0.05


@dataclass
class MarketMaker:
    name: str = "mm_alpha"
    state: StrategyState = field(default_factory=StrategyState)

    def on_tick(self, mid: float, spread: float) -> list[dict]:
        orders = []
        s = self.state
        skew = (s.position / s.max_position) * 0.10

        bid_price = round(mid - spread / 2 - s.spread_offset - skew, 2)
        ask_price = round(mid + spread / 2 + s.spread_offset - skew, 2)

        if s.position < s.max_position:
            orders.append(
                {
                    "side": "BUY",
                    "type": "LIMIT",
                    "price": bid_price,
                    "qty": s.quote_size,
                    "strategy": self.name,
                }
            )

        if s.position > -s.max_position:
            orders.append(
                {
                    "side": "SELL",
                    "type": "LIMIT",
                    "price": ask_price,
                    "qty": s.quote_size,
                    "strategy": self.name,
                }
            )

        s.orders_sent += len(orders)
        return orders

    def on_fill(self, side: str, price: float, qty: int):
        s = self.state
        s.fills += 1

        if side == "BUY":
            if s.position >= 0:
                total_cost = s.avg_entry * s.position + price * qty
                s.position += qty
                s.avg_entry = total_cost / s.position if s.position else 0.0
            else:
                # Covering short
                closed = min(qty, abs(s.position))
                s.realized_pnl += (s.avg_entry - price) * closed
                s.position += qty
                if s.position > 0:
                    s.avg_entry = price
                elif s.position == 0:
                    s.avg_entry = 0.0
            s.cash -= price * qty
        else:
            if s.position <= 0:
                total_cost = abs(s.avg_entry * s.position) + price * qty
                s.position -= qty
                s.avg_entry = total_cost / abs(s.position) if s.position else 0.0
            else:
                # Selling long
                closed = min(qty, s.position)
                s.realized_pnl += (price - s.avg_entry) * closed
                s.position -= qty
                if s.position < 0:
                    s.avg_entry = price
                elif s.position == 0:
                    s.avg_entry = 0.0
            s.cash += price * qty

    def pnl(self, mark_price: float) -> dict:
        s = self.state
        unrealized = 0.0
        if s.position > 0 and mark_price > 0:
            unrealized = (mark_price - s.avg_entry) * s.position
        elif s.position < 0 and mark_price > 0:
            unrealized = (s.avg_entry - mark_price) * abs(s.position)

        total = s.realized_pnl + unrealized
        exposure = abs(s.position) * mark_price if mark_price > 0 else 0.0

        return {
            "realized_pnl": round(s.realized_pnl, 2),
            "unrealized_pnl": round(unrealized, 2),
            "total_pnl": round(total, 2),
            "exposure": round(exposure, 2),
            "avg_entry": round(s.avg_entry, 2),
        }

    def to_dict(self, mark_price: float = 0) -> dict:
        p = self.pnl(mark_price)
        return {
            "name": self.name,
            "position": self.state.position,
            "cash": round(self.state.cash, 2),
            "orders_sent": self.state.orders_sent,
            "fills": self.state.fills,
            **p,
        }
