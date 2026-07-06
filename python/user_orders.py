"""Track user order history and sync open orders from the engine."""

import time
from typing import Any

USER_STRATEGY = "user"
MAX_HISTORY = 100


class UserOrderBook:
    def __init__(self):
        self.history: list[dict[str, Any]] = []

    def reset(self):
        self.history.clear()

    def record_submit(self, side: str, otype: str, price: float, qty: int, resp: dict, trades: list[dict]) -> dict:
        order = resp.get("order", {})
        now = time.time()
        entry = {
            "id": order.get("id"),
            "side": side,
            "type": otype,
            "price": order.get("price", price),
            "qty": qty,
            "filled": order.get("filled", 0),
            "status": order.get("status", "UNKNOWN"),
            "created_at": now,
            "updated_at": now,
            "fills": [{"price": t["price"], "qty": t["qty"], "time": now} for t in trades],
        }
        self._upsert(entry)
        return entry

    def mark_cancelled(self, order_id: int) -> None:
        for row in self.history:
            if row["id"] == order_id:
                row["status"] = "CANCELLED"
                row["updated_at"] = time.time()
                return

    def sync_pending(self, engine_orders: list[dict]) -> None:
        open_ids = {o["id"] for o in engine_orders}
        for eng in engine_orders:
            self._upsert({
                "id": eng["id"],
                "side": eng["side"],
                "type": eng["type"],
                "price": eng["price"],
                "qty": eng["qty"],
                "filled": eng.get("filled", 0),
                "status": eng["status"],
                "created_at": time.time(),
                "updated_at": time.time(),
                "fills": [],
            }, preserve_created=False)

    def pending(self) -> list[dict]:
        return [h for h in self.history if h["status"] in ("PENDING", "PARTIAL")]

    def _upsert(self, entry: dict, preserve_created: bool = True) -> None:
        for i, row in enumerate(self.history):
            if row["id"] == entry["id"]:
                created = row["created_at"] if preserve_created else entry["created_at"]
                fills = row.get("fills", []) + entry.get("fills", [])
                self.history[i] = {**row, **entry, "created_at": created, "fills": fills}
                return
        self.history.insert(0, entry)
        del self.history[MAX_HISTORY:]
