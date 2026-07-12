"""
HFT Demo — FastAPI server with WebSocket streaming.
"""

import asyncio
import json
import os
import random
import time
from contextlib import asynccontextmanager

from fastapi import FastAPI, Request, WebSocket, WebSocketDisconnect
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
from starlette.middleware.base import BaseHTTPMiddleware

from security import (
    SECURITY_HEADERS,
    allowed_origins,
    check_rate_limit,
    security_status,
    validate_order_payload,
    validate_symbol,
    validate_timeframe,
)

from demo_events import (
    demo_intro_events,
    engine_event,
    feed_event,
    fill_event,
    gateway_event,
    make_event,
    strategy_event,
)
from engine_client import EngineClient
from market_hours import market_session
from strategy import MarketMaker
from user_portfolio import UserPortfolio
from user_orders import USER_STRATEGY, UserOrderBook
from quant_research import run_quant_research
from yfinance_feed import (
    YFinanceFeed,
    fetch_all_company_reports,
    fetch_banker_desk,
    fetch_company_report,
    fetch_markets_overview,
    fetch_research_profile,
    fetch_watchlist,
)

SYMBOL = os.environ.get("HFT_SYMBOL", "AAPL")
current_symbol = SYMBOL
DEMO_MODE = os.environ.get("HFT_DEMO", "1") == "1"

clients: list[WebSocket] = []
engine = EngineClient(
    host=os.environ.get("HFT_ENGINE_HOST", "127.0.0.1"),
    port=int(os.environ.get("HFT_ENGINE_PORT", "9001")),
)
feed = YFinanceFeed(symbol=SYMBOL)
strategy = MarketMaker()
user = UserPortfolio()
user_orders = UserOrderBook()
running = False
book_seeded = False
last_mm_order_ids: list[int] = []

recent_trades: list[dict] = []
latency_history: list[dict] = []
activity_log: list[dict] = []
last_tick_payload: dict = {}

MAX_TRADES = 50
MAX_LATENCY = 100
MAX_EVENTS = 80


def push_event(event: dict):
    activity_log.insert(0, event)
    del activity_log[MAX_EVENTS:]


def annotate_trade(trade: dict, side: str, strategy_name: str) -> dict:
    return {**trade, "side": side, "strategy": strategy_name}


def _tick_from_quote(quote: dict) -> dict:
    return {
        "symbol": quote["symbol"],
        "price": quote["price"],
        "bid": quote["bid"],
        "ask": quote["ask"],
        "volume": quote["volume"],
        "source": quote["source"],
        "change": quote.get("change", 0),
        "change_pct": quote.get("change_pct", 0),
        "day_high": quote.get("day_high", 0),
        "day_low": quote.get("day_low", 0),
        "open": quote.get("open", 0),
        "prev_close": quote.get("prev_close", 0),
    }


def build_state() -> dict:
    quote = feed.get_quote()
    try:
        book = engine.get_book()
    except Exception as exc:
        print(f"[state] engine book unavailable: {exc}")
        book = {"book": {"bids": [], "asks": [], "mid": 0, "spread": 0}}
    try:
        stats = engine.get_stats()
    except Exception:
        stats = {"stats": {"avg_latency_ns": 0, "total_orders": 0, "total_trades": 0}}
    mark = quote.get("price") or book.get("book", {}).get("mid", 0) or 0
    session = quote.get("market") or market_session()
    try:
        eng_orders = engine.get_orders(USER_STRATEGY).get("orders", [])
    except Exception:
        eng_orders = []
    user_orders.sync_pending(eng_orders)
    try:
        watchlist = fetch_watchlist()
    except Exception as exc:
        print(f"[state] watchlist fetch failed: {exc}")
        watchlist = []
    return {
        "type": "snapshot",
        "symbol": current_symbol,
        "tick": _tick_from_quote(quote),
        "book": book.get("book", {}),
        "trades": recent_trades,
        "strategy": strategy.to_dict(mark),
        "user": user.to_dict(mark),
        "user_pending_orders": user_orders.pending(),
        "user_order_history": user_orders.history,
        "watchlist": watchlist,
        "stats": stats.get("stats", {}),
        "latency_history": latency_history,
        "events": activity_log,
        "quote": quote,
        "market": session,
        "price_history": quote.get("price_history", []),
        "chart_bars": quote.get("chart_bars", []),
        "chart_timeframe": quote.get("timeframe", "1D"),
        "chart_interval_label": quote.get("interval_label", "1m"),
        "last_update_ts": quote.get("last_update_ts", 0),
        "is_streaming_live": session.get("is_live", False),
        "active_stage": activity_log[0]["stage"] if activity_log else "feed",
    }


def change_symbol(new_symbol: str) -> dict:
    global current_symbol, book_seeded, strategy, user, recent_trades, activity_log
    global latency_history, last_mm_order_ids

    sym = validate_symbol(new_symbol)

    cancel_mm_orders()
    feed.set_symbol(sym)
    current_symbol = sym

    strategy = MarketMaker()
    user = UserPortfolio()
    user_orders.reset()
    recent_trades.clear()
    activity_log.clear()
    latency_history.clear()
    last_mm_order_ids = []

    tick = feed.next_tick()
    if tick.price <= 0:
        raise ValueError(f"No quote found for {sym}. Data not found — try again later. (yfinance & Google Finance)")

    mid = (tick.bid + tick.ask) / 2 if tick.bid and tick.ask else tick.price
    seed_order_book(mid)
    book_seeded = True

    push_event(make_event("feed", f"Switched to {sym}", f"Live price ${tick.price:.2f} from yfinance"))
    for ev in demo_intro_events(sym, mid):
        push_event(ev)
    if DEMO_MODE:
        burst = run_demo_burst(mid)
        recent_trades.extend(burst)
        del recent_trades[MAX_TRADES:]

    return build_state()


def change_timeframe(timeframe: str) -> dict:
    feed.set_timeframe(timeframe)
    meta = feed.chart_meta()
    push_event(make_event("feed", f"Chart → {timeframe}", f"{meta['interval_label']} · {meta['bar_count']} bars"))
    return build_state()


async def broadcast(msg: dict):
    dead = []
    for ws in clients:
        try:
            await ws.send_json(msg)
        except Exception:
            dead.append(ws)
    for ws in dead:
        clients.remove(ws)


async def run_sync(fn, *args, **kwargs):
    return await asyncio.to_thread(fn, *args, **kwargs)


def seed_order_book(mid: float):
    if mid <= 0:
        return
    for i in range(5):
        offset = (i + 1) * 0.10
        engine.submit_order("BUY", "LIMIT", round(mid - offset, 2), 200 + i * 50, "seed")
        engine.submit_order("SELL", "LIMIT", round(mid + offset, 2), 200 + i * 50, "seed")


def cancel_mm_orders():
    global last_mm_order_ids
    for oid in last_mm_order_ids:
        try:
            engine.cancel_order(oid)
        except Exception:
            pass
    last_mm_order_ids = []


def submit_strategy_orders(orders: list[dict]) -> tuple[list[dict], list[int], list[dict], list[int]]:
    """Cancel old quotes, post new ones. Returns (events, latencies, trades, new_order_ids)."""
    global last_mm_order_ids
    events: list[dict] = []
    latencies: list[int] = []
    trades: list[dict] = []
    new_ids: list[int] = []

    cancel_mm_orders()

    for order in orders:
        events.append(strategy_event(order["side"], order["price"], order["qty"]))
        events.append(
            gateway_event(order["side"], order["type"], order["price"], order["qty"], order["strategy"])
        )
        resp = engine.submit_order_dict(order)
        latencies.append(resp.get("latency_ns", 0))
        events.append(engine_event(resp.get("latency_ns", 0), len(resp.get("trades", []))))

        order_info = resp.get("order", {})
        if order_info.get("status") in ("PENDING", "PARTIAL"):
            new_ids.append(order_info["id"])

        for trade in resp.get("trades", []):
            trades.append(annotate_trade(trade, order["side"], order["strategy"]))
            events.append(fill_event(order["side"], trade["price"], trade["qty"], order["strategy"]))
            strategy.on_fill(order["side"], trade["price"], trade["qty"])

    last_mm_order_ids = new_ids
    return events, latencies, trades, new_ids


def run_demo_burst(mid: float) -> list[dict]:
    trades = []
    actions = [
        ("BUY", "MARKET", 0, 50, "demo_trader"),
        ("SELL", "MARKET", 0, 30, "demo_trader"),
        ("BUY", "LIMIT", round(mid - 0.05, 2), 100, "demo_trader"),
    ]
    for side, otype, price, qty, strat in actions:
        push_event(gateway_event(side, otype, price, qty, strat))
        resp = engine.submit_order(side, otype, price, qty, strat)
        push_event(engine_event(resp.get("latency_ns", 0), len(resp.get("trades", []))))
        for t in resp.get("trades", []):
            trades.append(annotate_trade(t, side, strat))
            push_event(fill_event(side, t["price"], t["qty"], strat))
    return trades


def tick_sleep_s() -> float:
    session = market_session()
    if session["is_regular_hours"]:
        return 0.35
    if session["is_live"]:
        return 0.65
    return 1.5


async def ws_keepalive_loop():
    """Ping clients so idle WebSockets stay open during long sessions."""
    while running:
        await asyncio.sleep(20)
        if not clients:
            continue
        dead: list[WebSocket] = []
        ping = {"type": "ping", "ts": time.time()}
        for ws in list(clients):
            try:
                await ws.send_json(ping)
            except Exception:
                dead.append(ws)
        for ws in dead:
            if ws in clients:
                clients.remove(ws)


async def trading_loop():
    global running, book_seeded, last_tick_payload
    running = True

    try:
        for _ in range(10):
            tick = await run_sync(feed.next_tick)
            if tick.price > 0:
                mid = (tick.bid + tick.ask) / 2 if tick.bid and tick.ask else tick.price
                await run_sync(seed_order_book, mid)
                book_seeded = True
                for ev in demo_intro_events(SYMBOL, mid):
                    push_event(ev)
                if DEMO_MODE:
                    burst = await run_sync(run_demo_burst, mid)
                    recent_trades.extend(burst)
                    recent_trades.sort(key=lambda t: t.get("timestamp_ns", 0), reverse=True)
                    del recent_trades[MAX_TRADES:]
                break
            await asyncio.sleep(1)
    except Exception as exc:
        print(f"[trading_loop] startup error: {exc}")
        push_event(make_event("feed", "Startup error", str(exc)))

    tick_num = 0
    while running:
        try:
            tick = await run_sync(feed.next_tick)
            tick_num += 1

            if tick.price <= 0:
                await broadcast({"type": "error", "message": f"yfinance: no quote for {SYMBOL}"})
                await asyncio.sleep(2)
                continue

            tick_events = [feed_event(tick.symbol, tick.price, tick.bid, tick.ask)]
            session = market_session()

            book_resp = await run_sync(engine.get_book)
            book = book_resp.get("book", {})
            yf_mid = (tick.bid + tick.ask) / 2 if tick.bid and tick.ask else tick.price
            spread = book.get("spread", tick.ask - tick.bid) or max(tick.ask - tick.bid, 0.01)
            mid = yf_mid if yf_mid > 0 else tick.price

            tick_latencies: list[int] = []
            new_trades: list[dict] = []

            # Strategy quotes — faster when regular session is live
            strat_every = 2 if session["is_regular_hours"] else 3
            if tick_num % strat_every == 1:
                orders = strategy.on_tick(mid, spread)
                ev, lat, tr, _ = await run_sync(submit_strategy_orders, orders)
                tick_events.extend(ev)
                tick_latencies.extend(lat)
                new_trades.extend(tr)

            if DEMO_MODE:
                demo_every = 2 if session["is_regular_hours"] else (3 if session["is_live"] else 6)
                if tick_num % demo_every == 0:
                    side = random.choice(["BUY", "SELL"])
                    qty = random.choice([25, 50, 75])
                    strat = random.choice(["external_flow", "retail_trader", "institutional"])
                    tick_events.append(
                        make_event(
                            "gateway",
                            f"Incoming {side} MARKET order × {qty}",
                            f"External participant ({strat}) hits the book",
                        )
                    )
                    resp = await run_sync(engine.submit_order, side, "MARKET", 0, qty, strat)
                    tick_events.append(engine_event(resp.get("latency_ns", 0), len(resp.get("trades", []))))
                    for trade in resp.get("trades", []):
                        new_trades.append(annotate_trade(trade, side, strat))
                        tick_events.append(fill_event(side, trade["price"], trade["qty"], strat))

            for trade in new_trades:
                recent_trades.insert(0, trade)
            del recent_trades[MAX_TRADES:]

            for ev in reversed(tick_events):
                push_event(ev)

            if tick_latencies:
                avg_lat = sum(tick_latencies) / len(tick_latencies)
                latency_history.insert(0, {"ts": time.time(), "latency_ns": avg_lat})
                del latency_history[MAX_LATENCY:]

            book_resp = await run_sync(engine.get_book)
            stats_resp = await run_sync(engine.get_stats)

            mark = tick.price or book_resp.get("book", {}).get("mid", 0) or mid
            send_full_chart = tick_num == 1 or tick_num % 15 == 0
            payload = {
                "type": "tick",
                "tick_seq": tick_num,
                "last_update_ts": feed.last_update_ts,
                "is_streaming_live": session["is_live"],
                "tick": {
                    "symbol": tick.symbol,
                    "price": tick.price,
                    "bid": tick.bid,
                    "ask": tick.ask,
                    "volume": tick.volume,
                    "source": tick.source,
                    "change": tick.change,
                    "change_pct": tick.change_pct,
                    "day_high": tick.day_high,
                    "day_low": tick.day_low,
                    "open": tick.open,
                    "prev_close": tick.prev_close,
                },
                "book": book_resp.get("book", {}),
                "trades": new_trades,
                "strategy": strategy.to_dict(mark),
                "user": user.to_dict(mark),
                "stats": stats_resp.get("stats", {}),
                "latency_ns": tick_latencies[-1] if tick_latencies else 0,
                "events": tick_events,
                "active_stage": tick_events[-1]["stage"] if tick_events else "feed",
                "market": session,
            }
            if send_full_chart:
                payload["chart_bars"] = feed.chart_bars
            elif feed.chart_bars:
                payload["chart_patch"] = feed.chart_bars[-1]
            if feed.price_history:
                payload["price_point"] = feed.price_history[-1]
            if send_full_chart:
                payload["price_history"] = feed.price_history[-60:]
            payload["chart_timeframe"] = feed.chart_timeframe
            payload["chart_interval_label"] = feed.chart_meta()["interval_label"]
            if tick_num % 30 == 1:
                payload["watchlist"] = fetch_watchlist()
            try:
                eng_orders = engine.get_orders(USER_STRATEGY).get("orders", [])
            except Exception:
                eng_orders = []
            user_orders.sync_pending(eng_orders)
            payload["user_pending_orders"] = user_orders.pending()
            payload["user_order_history"] = user_orders.history
            last_tick_payload = payload
            await broadcast(payload)

        except ConnectionError:
            await broadcast({"type": "error", "message": "C++ engine not reachable"})
            await asyncio.sleep(2)
        except Exception as exc:
            print(f"[trading_loop] tick error: {exc}")
            push_event(make_event("engine", "Tick error", str(exc)))
            await asyncio.sleep(1)

        await asyncio.sleep(tick_sleep_s())


@asynccontextmanager
async def lifespan(app: FastAPI):
    global running
    running = True
    loop = asyncio.get_event_loop()
    loop.run_in_executor(None, fetch_watchlist)
    task = asyncio.create_task(trading_loop())
    keepalive = asyncio.create_task(ws_keepalive_loop())
    yield
    running = False
    for client in list(clients):
        try:
            await client.close(code=1001, reason="server shutdown")
        except Exception:
            pass
    clients.clear()
    task.cancel()
    keepalive.cancel()
    try:
        await task
    except asyncio.CancelledError:
        pass
    try:
        await keepalive
    except asyncio.CancelledError:
        pass


app = FastAPI(title="HFT Demo API", lifespan=lifespan)


class SecurityMiddleware(BaseHTTPMiddleware):
    async def dispatch(self, request: Request, call_next):
        client = request.client.host if request.client else "unknown"
        if not check_rate_limit(client):
            return JSONResponse(
                status_code=429,
                content={"status": "error", "message": "Rate limit exceeded"},
                headers=SECURITY_HEADERS,
            )
        response = await call_next(request)
        for key, value in SECURITY_HEADERS.items():
            response.headers[key] = value
        return response


app.add_middleware(SecurityMiddleware)
app.add_middleware(
    CORSMiddleware,
    allow_origins=allowed_origins(),
    allow_credentials=True,
    allow_methods=["GET", "POST", "OPTIONS"],
    allow_headers=["Accept", "Content-Type"],
)


@app.get("/security/status")
async def get_security_status():
    return security_status()


@app.get("/health")
async def health():
    engine_ok = False
    try:
        await run_sync(engine.get_stats)
        engine_ok = True
    except Exception:
        engine_ok = False
    return {
        "status": "ok" if engine_ok and running else "degraded",
        "running": running,
        "engine": engine_ok,
        "clients": len(clients),
        "symbol": current_symbol,
        "ts": time.time(),
    }


@app.get("/")
async def root():
    return {"service": "HFT Demo API", "status": "running", "symbol": current_symbol, "demo": DEMO_MODE}


@app.get("/symbol")
async def get_symbol():
    return {"symbol": current_symbol}


@app.post("/symbol")
async def set_symbol(body: dict):
    sym = body.get("symbol", "")
    try:
        state = await run_sync(change_symbol, sym)
        await broadcast({"type": "symbol_changed", **state})
        return {"status": "ok", "symbol": current_symbol, "quote": state["quote"]}
    except ValueError as exc:
        return {"status": "error", "message": str(exc)}


@app.get("/quote")
async def get_quote():
    return await run_sync(feed.get_quote)


@app.get("/state")
async def get_state():
    try:
        return await run_sync(build_state)
    except Exception as exc:
        print(f"[state] build_state failed: {exc}")
        from fastapi.responses import JSONResponse
        return JSONResponse(
            status_code=503,
            content={"status": "error", "message": "State temporarily unavailable", "detail": str(exc)},
        )


@app.get("/company/report")
async def get_company_report(symbol: str = ""):
    sym = (symbol or current_symbol).upper().strip()
    if not sym:
        return {"status": "error", "message": "symbol required"}
    try:
        sym = validate_symbol(sym)
        return await run_sync(fetch_company_report, sym)
    except ValueError as exc:
        return JSONResponse(status_code=400, content={"status": "error", "message": str(exc)})
    except Exception as exc:
        print(f"[report] failed for {sym}: {exc}")
        from fastapi.responses import JSONResponse
        return JSONResponse(
            status_code=503,
            content={"status": "error", "message": f"Report unavailable for {sym}", "detail": str(exc)},
        )


@app.get("/chart")
async def get_chart(timeframe: str = ""):
    tf = timeframe.upper().strip() if timeframe else feed.chart_timeframe
    if tf and tf != feed.chart_timeframe:
        await run_sync(feed.set_timeframe, tf)
    return {
        "chart_bars": feed.chart_bars,
        **feed.chart_meta(),
        "symbol": current_symbol,
    }


@app.post("/chart/timeframe")
async def set_chart_timeframe(body: dict):
    tf = body.get("timeframe", "1D")
    try:
        tf = validate_timeframe(tf)
        state = await run_sync(change_timeframe, tf)
        await broadcast({"type": "timeframe_changed", **state})
        return {
            "status": "ok",
            "chart_bars": feed.chart_bars,
            **feed.chart_meta(),
        }
    except ValueError as exc:
        return {"status": "error", "message": str(exc)}


@app.get("/companies/reports")
async def get_all_company_reports():
    return {"companies": await run_sync(fetch_all_company_reports)}


@app.get("/markets/overview")
async def get_markets_overview():
    return await run_sync(fetch_markets_overview)


@app.get("/markets/banker")
async def get_banker_desk():
    return await run_sync(fetch_banker_desk)


@app.get("/research/quant")
async def get_quant_research(symbol: str = "AAPL", tickers: str = ""):
    sym = (symbol or "AAPL").upper().strip()
    try:
        sym = validate_symbol(sym)
        ticker_list = None
        if tickers.strip():
            ticker_list = [validate_symbol(t.strip()) for t in tickers.split(",") if t.strip()]
        result = await run_sync(run_quant_research, sym, ticker_list)
        try:
            stats = await run_sync(engine.get_stats)
            result["engine"] = {
                "source": "C++ matching engine",
                "avg_latency_ns": stats.get("avg_latency_ns"),
                "total_orders": stats.get("total_orders"),
                "total_trades": stats.get("total_trades"),
                "status": "live",
            }
            if result.get("predictions") and result["predictions"].get("models"):
                for m in result["predictions"]["models"]:
                    if m.get("id") == "cpp-engine":
                        m["status"] = "live"
                        if stats.get("avg_latency_ns") is not None:
                            m["latency_ns"] = stats.get("avg_latency_ns")
        except Exception:
            result["engine"] = {"source": "C++ matching engine", "status": "offline"}
        return result
    except ValueError as exc:
        return JSONResponse(status_code=400, content={"status": "error", "message": str(exc)})
    except Exception as exc:
        print(f"[quant] research failed: {exc}")
        return JSONResponse(
            status_code=503,
            content={
                "status": "error",
                "data_found": False,
                "message": "Quant research data not found. Please try again later.",
                "sources_tried": ["yfinance", "python-quant-engine"],
                "detail": str(exc),
            },
        )


@app.get("/research/profile")
async def get_research_profile(symbol: str = ""):
    sym = (symbol or current_symbol).upper().strip()
    if not sym:
        return {"status": "error", "message": "symbol required"}
    try:
        sym = validate_symbol(sym)
        return await run_sync(fetch_research_profile, sym)
    except ValueError as exc:
        return JSONResponse(status_code=400, content={"status": "error", "message": str(exc)})


@app.get("/demo/events")
async def get_events():
    return {"events": activity_log}


@app.get("/book")
async def get_book():
    return await run_sync(engine.get_book)


@app.get("/stats")
async def get_stats():
    return await run_sync(engine.get_stats)


def apply_user_fills(side: str, resp: dict, strategy_id: str) -> list[dict]:
    """Record user fills and return annotated trades."""
    user.record_order()
    trades: list[dict] = []
    for t in resp.get("trades", []):
        trade = annotate_trade(t, side, strategy_id)
        trades.append(trade)
        user.on_fill(side, t["price"], t["qty"])
        push_event(fill_event(side, t["price"], t["qty"], strategy_id))
    return trades


@app.post("/order")
async def manual_order(body: dict):
    try:
        order = validate_order_payload(body)
    except ValueError as exc:
        return JSONResponse(status_code=400, content={"status": "error", "message": str(exc)})
    side = order["side"]
    otype = order["type"]
    price = order["price"]
    qty = order["qty"]
    push_event(gateway_event(side, otype, price, qty, USER_STRATEGY))
    resp = await run_sync(engine.submit_order, side, otype, price, qty, USER_STRATEGY)
    push_event(engine_event(resp.get("latency_ns", 0), len(resp.get("trades", []))))
    new_trades = apply_user_fills(side, resp, USER_STRATEGY)
    user_orders.record_submit(side, otype, price, qty, resp, new_trades)
    for t in new_trades:
        recent_trades.insert(0, t)
    del recent_trades[MAX_TRADES:]
    state = build_state()
    await broadcast({"type": "manual_order", **state, "response": resp, "trades": new_trades})
    return {
        **resp,
        "trades": new_trades,
        "user": state["user"],
        "user_pending_orders": state["user_pending_orders"],
        "user_order_history": state["user_order_history"],
    }


@app.post("/order/cancel")
async def cancel_user_order(body: dict):
    order_id = int(body["order_id"])
    resp = await run_sync(engine.cancel_order, order_id)
    if resp.get("status") == "ok":
        user_orders.mark_cancelled(order_id)
    state = build_state()
    await broadcast({"type": "manual_order", **state})
    return {
        **resp,
        "user_pending_orders": state["user_pending_orders"],
        "user_order_history": state["user_order_history"],
    }


@app.websocket("/ws")
async def websocket_endpoint(ws: WebSocket):
    await ws.accept()
    clients.append(ws)
    try:
        state = await run_sync(build_state)
        await ws.send_json(state)
        while True:
            data = await ws.receive_text()
            msg = json.loads(data)
            if msg.get("action") == "ping":
                await ws.send_json({"type": "pong", "ts": time.time()})
                continue
            if msg.get("action") == "order":
                side = msg["side"]
                otype = msg.get("type", "LIMIT")
                price = msg.get("price", 0)
                qty = msg["qty"]
                push_event(gateway_event(side, otype, price, qty, USER_STRATEGY))
                resp = await run_sync(engine.submit_order, side, otype, price, qty, USER_STRATEGY)
                push_event(engine_event(resp.get("latency_ns", 0), len(resp.get("trades", []))))
                new_trades = apply_user_fills(side, resp, USER_STRATEGY)
                user_orders.record_submit(side, otype, price, qty, resp, new_trades)
                for t in new_trades:
                    recent_trades.insert(0, t)
                del recent_trades[MAX_TRADES:]
                state = build_state()
                await broadcast({"type": "manual_order", **state, "response": resp, "trades": new_trades})
            elif msg.get("action") == "symbol":
                sym = msg.get("symbol", "")
                try:
                    state = await run_sync(change_symbol, sym)
                    await ws.send_json({"type": "symbol_changed", **state})
                    await broadcast({"type": "symbol_changed", **state})
                except ValueError as exc:
                    await ws.send_json({"type": "error", "message": str(exc)})
            elif msg.get("action") == "timeframe":
                tf = msg.get("timeframe", "1D")
                try:
                    state = await run_sync(change_timeframe, tf)
                    await ws.send_json({"type": "timeframe_changed", **state})
                    await broadcast({"type": "timeframe_changed", **state})
                except ValueError as exc:
                    await ws.send_json({"type": "error", "message": str(exc)})
    except WebSocketDisconnect:
        pass
    except Exception as exc:
        print(f"[ws] disconnected: {exc}")
    finally:
        if ws in clients:
            clients.remove(ws)
