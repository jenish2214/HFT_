"""TCP client for the C++ matching engine."""

import json
import socket
import time
from typing import Any


class EngineClient:
    def __init__(
        self,
        host: str = "127.0.0.1",
        port: int = 9001,
        timeout: float = 5.0,
        retries: int = 3,
    ):
        self.host = host
        self.port = port
        self.timeout = timeout
        self.retries = retries

    def send(self, payload: dict) -> dict:
        data = json.dumps(payload, separators=(",", ":")) + "\n"
        last_err: Exception | None = None

        for attempt in range(self.retries):
            try:
                with socket.create_connection(
                    (self.host, self.port), timeout=self.timeout
                ) as sock:
                    sock.sendall(data.encode())
                    response = b""
                    while True:
                        chunk = sock.recv(4096)
                        if not chunk:
                            break
                        response += chunk
                        if b"\n" in response:
                            break
                line = response.decode().strip()
                if not line:
                    raise ConnectionError("Engine returned empty response")
                return json.loads(line)
            except (OSError, json.JSONDecodeError, ConnectionError) as exc:
                last_err = exc
                if attempt + 1 < self.retries:
                    time.sleep(0.15 * (attempt + 1))
                    continue
                raise ConnectionError(
                    f"C++ engine not reachable at {self.host}:{self.port}"
                ) from last_err

        raise ConnectionError("C++ engine not reachable") from last_err

    def submit_order(
        self,
        side: str,
        order_type: str,
        price: float,
        qty: int,
        strategy: str = "manual",
    ) -> dict:
        return self.send(
            {
                "action": "submit",
                "side": side,
                "type": order_type,
                "price": price,
                "qty": qty,
                "strategy": strategy,
            }
        )

    def submit_order_dict(self, order: dict) -> dict:
        return self.submit_order(
            side=order["side"],
            order_type=order.get("type", order.get("order_type", "LIMIT")),
            price=float(order.get("price", 0)),
            qty=int(order["qty"]),
            strategy=order.get("strategy", "manual"),
        )

    def cancel_order(self, order_id: int) -> dict:
        return self.send({"action": "cancel", "order_id": order_id})

    def get_book(self) -> dict:
        return self.send({"action": "book"})

    def get_stats(self) -> dict:
        return self.send({"action": "stats"})

    def get_orders(self, strategy: str = "") -> dict:
        payload: dict[str, Any] = {"action": "orders"}
        if strategy:
            payload["strategy"] = strategy
        return self.send(payload)
