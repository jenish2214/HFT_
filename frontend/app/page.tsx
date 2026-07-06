"use client";

import { useState, useCallback, useRef, memo } from "react";
import OrderBook from "@/components/OrderBook";
import TradeTape from "@/components/TradeTape";
import PortfolioSwitcher from "@/components/PortfolioSwitcher";
import OrderTicket from "@/components/OrderTicket";
import OrderBlotter, { type UserOrder } from "@/components/OrderBlotter";
import BloombergCommandBar from "@/components/BloombergCommandBar";
import BloombergWatchlist, { type WatchRow } from "@/components/BloombergWatchlist";
import BloombergTicker from "@/components/BloombergTicker";
import TraderHeader from "@/components/TraderHeader";
import MarketStatusBar from "@/components/MarketStatusBar";
import MarketDataPanel from "@/components/MarketDataPanel";
import BloombergTerminalChart, { type ChartBar, type ChartTimeframe } from "@/components/BloombergTerminalChart";
import { useMarketStream } from "@/hooks/useMarketStream";
import {
  mergeChartBars,
  sameBar,
  sameBook,
  sameTick,
  sameUser,
} from "@/lib/marketDelta";

export interface BookLevel {
  price: number;
  qty: number;
  orders: number;
}

export interface Book {
  bids: BookLevel[];
  asks: BookLevel[];
  mid: number;
  spread: number;
}

export interface Trade {
  id: number;
  price: number;
  qty: number;
  buy_order: number;
  sell_order: number;
  timestamp_ns: number;
  side?: string;
  strategy?: string;
}

export interface StrategyInfo {
  name: string;
  position: number;
  cash: number;
  orders_sent: number;
  fills: number;
  realized_pnl?: number;
  unrealized_pnl?: number;
  total_pnl?: number;
  exposure?: number;
  avg_entry?: number;
}

export interface UserInfo extends StrategyInfo {
  initial_equity?: number;
  equity?: number;
  buying_power?: number;
}

const DEFAULT_USER: UserInfo = {
  name: "user",
  position: 0,
  cash: 0,
  orders_sent: 0,
  fills: 0,
  initial_equity: 100_000,
  equity: 100_000,
  buying_power: 100_000,
  realized_pnl: 0,
  unrealized_pnl: 0,
  total_pnl: 0,
};

export interface Stats {
  avg_latency_ns: number;
  total_orders: number;
  total_trades: number;
}

export interface MarketSession {
  status: "open" | "pre" | "after" | "closed";
  label: string;
  is_live: boolean;
  is_regular_hours: boolean;
  exchange: string;
  timezone: string;
  local_time: string;
  countdown: string;
}

export interface TickInfo {
  symbol: string;
  price: number;
  bid: number;
  ask: number;
  volume: number;
  source?: string;
  change?: number;
  change_pct?: number;
  day_high?: number;
  day_low?: number;
  open?: number;
  prev_close?: number;
}

function applyTickUpdate(
  msg: Record<string, unknown>,
  setters: {
    setBook: (b: Book | ((p: Book) => Book)) => void;
    setUser: (u: UserInfo | ((p: UserInfo) => UserInfo)) => void;
    setTick: (t: TickInfo | ((p: TickInfo | null) => TickInfo | null)) => void;
    setMarket: (m: MarketSession | ((p: MarketSession | null) => MarketSession | null)) => void;
    setPriceHistory: (h: { ts: number; price: number }[] | ((p: { ts: number; price: number }[]) => { ts: number; price: number }[])) => void;
    setChartBars: (b: ChartBar[] | ((p: ChartBar[]) => ChartBar[])) => void;
    setChartPatch: (b: ChartBar | null | ((p: ChartBar | null) => ChartBar | null)) => void;
    setPricePoint: (p: { ts: number; price: number } | null | ((prev: { ts: number; price: number } | null) => { ts: number; price: number } | null)) => void;
  },
) {
  const tick = (msg.tick || msg.quote) as TickInfo | undefined;
  if (tick?.symbol) {
    setters.setTick((prev) => (prev && sameTick(prev, tick) ? prev : tick));
  }

  if (msg.book) {
    const book = msg.book as Book;
    setters.setBook((prev) => (sameBook(prev, book) ? prev : book));
  }

  if (msg.user) {
    const user = msg.user as UserInfo;
    setters.setUser((prev) => (sameUser(prev, user) ? prev : user));
  }

  if (msg.market) {
    const market = msg.market as MarketSession;
    setters.setMarket((prev) => {
      if (!prev) return market;
      return JSON.stringify(prev) === JSON.stringify(market) ? prev : market;
    });
  }

  if (msg.chart_patch) {
    const patch = msg.chart_patch as ChartBar;
    setters.setChartPatch((prev) => (prev && sameBar(prev, patch) ? prev : patch));
  } else if (msg.chart_bars) {
    setters.setChartPatch(null);
    setters.setChartBars((prev) => mergeChartBars(prev, msg.chart_bars as ChartBar[]));
  }

  if (msg.price_point) {
    const point = msg.price_point as { ts: number; price: number };
    setters.setPricePoint((prev) => (
      prev && prev.ts === point.ts && prev.price === point.price ? prev : point
    ));
  } else if (msg.price_history) {
    setters.setPricePoint(null);
    setters.setPriceHistory(msg.price_history as { ts: number; price: number }[]);
  }
}

export default function Dashboard() {
  const [book, setBook] = useState<Book>({ bids: [], asks: [], mid: 0, spread: 0 });
  const [trades, setTrades] = useState<Trade[]>([]);
  const [user, setUser] = useState<UserInfo>(DEFAULT_USER);
  const [tick, setTick] = useState<TickInfo | null>(null);
  const [market, setMarket] = useState<MarketSession | null>(null);
  const [priceHistory, setPriceHistory] = useState<{ ts: number; price: number }[]>([]);
  const [chartBars, setChartBars] = useState<ChartBar[]>([]);
  const [chartPatch, setChartPatch] = useState<ChartBar | null>(null);
  const [pricePoint, setPricePoint] = useState<{ ts: number; price: number } | null>(null);
  const [chartTimeframe, setChartTimeframe] = useState<ChartTimeframe>("1D");
  const [chartIntervalLabel, setChartIntervalLabel] = useState("1m");
  const [chartLoading, setChartLoading] = useState(false);
  const [lastUpdateTs, setLastUpdateTs] = useState(0);
  const [symbol, setSymbol] = useState("AAPL");
  const [symbolLoading, setSymbolLoading] = useState(false);
  const [pendingOrders, setPendingOrders] = useState<UserOrder[]>([]);
  const [orderHistory, setOrderHistory] = useState<UserOrder[]>([]);
  const [watchlist, setWatchlist] = useState<WatchRow[]>([]);

  const tickMetaRef = useRef({ ts: 0 });

  const syncMeta = useCallback((msg: Record<string, unknown>) => {
    if (msg.user_pending_orders) setPendingOrders(msg.user_pending_orders as UserOrder[]);
    if (msg.user_order_history) setOrderHistory(msg.user_order_history as UserOrder[]);
    if (msg.watchlist) setWatchlist(msg.watchlist as WatchRow[]);
  }, []);

  const applyFullSnapshot = useCallback((msg: Record<string, unknown>) => {
    if (msg.book) setBook(msg.book as Book);
    if (msg.user) setUser(msg.user as UserInfo);
    if (msg.market) setMarket(msg.market as MarketSession);
    if (msg.price_history) {
      setPricePoint(null);
      setPriceHistory(msg.price_history as { ts: number; price: number }[]);
    }
    if (msg.chart_bars) {
      setChartPatch(null);
      setChartBars(msg.chart_bars as ChartBar[]);
    }
    if (msg.chart_timeframe) setChartTimeframe(msg.chart_timeframe as ChartTimeframe);
    if (msg.chart_interval_label) setChartIntervalLabel(msg.chart_interval_label as string);
    const tick = (msg.tick || msg.quote) as TickInfo | undefined;
    if (tick?.symbol) setTick(tick);
    syncMeta(msg);
  }, [syncMeta]);

  const handleMessage = useCallback((msg: Record<string, unknown>) => {
    if (msg.type === "snapshot" || msg.type === "symbol_changed" || msg.type === "timeframe_changed") {
      if (msg.trades) setTrades(msg.trades as Trade[]);
      if (msg.symbol) setSymbol(msg.symbol as string);
      else if ((msg.tick as TickInfo)?.symbol) setSymbol((msg.tick as TickInfo).symbol);
      applyFullSnapshot(msg);
      setSymbolLoading(false);
      setChartLoading(false);
      setChartPatch(null);
      setPricePoint(null);
      setPendingOrders([]);
      setOrderHistory([]);
      return;
    }

    if (msg.type === "manual_order") {
      if (msg.trades) setTrades((prev) => [...(msg.trades as Trade[]), ...prev].slice(0, 50));
      applyFullSnapshot(msg);
      syncMeta(msg);
      return;
    }

    if (msg.type === "tick") {
      applyTickUpdate(msg, {
        setBook,
        setUser,
        setTick,
        setMarket,
        setPriceHistory,
        setChartBars,
        setChartPatch,
        setPricePoint,
      });
      syncMeta(msg);

      if (msg.last_update_ts && msg.last_update_ts !== tickMetaRef.current.ts) {
        tickMetaRef.current.ts = msg.last_update_ts as number;
        setLastUpdateTs(msg.last_update_ts as number);
      }

      if (Array.isArray(msg.trades) && msg.trades.length) {
        setTrades((prev) => [...(msg.trades as Trade[]), ...prev].slice(0, 50));
      }
    }
  }, [applyFullSnapshot, syncMeta]);

  const { connected, send } = useMarketStream(handleMessage);

  const refreshState = useCallback(() => {
    fetch(`${process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000"}/state`, { cache: "no-store" })
      .then((r) => r.json())
      .then((state) => handleMessage(state))
      .catch(() => {});
  }, [handleMessage]);

  const cancelOrder = useCallback(async (orderId: number) => {
    await fetch(`${process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000"}/order/cancel`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ order_id: orderId }),
    });
    refreshState();
  }, [refreshState]);

  const sendOrder = useCallback(async (order: {
    side: string;
    type: string;
    price: number;
    qty: number;
  }) => {
    return new Promise<{ ok: boolean; message: string }>((resolve) => {
      fetch(`${process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000"}/order`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(order),
      })
        .then((r) => r.json())
        .then((resp) => {
          const orderTrades = resp?.trades || [];
          const orderInfo = resp?.order || {};
          if (resp?.user) setUser(resp.user as UserInfo);
          if (resp?.user_pending_orders) setPendingOrders(resp.user_pending_orders as UserOrder[]);
          if (resp?.user_order_history) setOrderHistory(resp.user_order_history as UserOrder[]);
          if (orderTrades.length > 0) {
            setTrades((prev) => [...orderTrades, ...prev].slice(0, 50));
            const t = orderTrades[0];
            resolve({
              ok: true,
              message: `Filled ${order.side} ${t.qty} @ $${t.price.toFixed(2)}`,
            });
          } else if (orderInfo.status === "PENDING" || orderInfo.status === "PARTIAL") {
            resolve({
              ok: true,
              message: `${order.side} ${order.qty} working @ $${order.price.toFixed(2)}`,
            });
          } else if (resp?.status === "ok") {
            resolve({ ok: true, message: `${order.side} order accepted` });
          } else {
            resolve({ ok: false, message: resp?.message || "Order rejected" });
          }
          refreshState();
        })
        .catch(() => resolve({ ok: false, message: "Network error" }));
    });
  }, [refreshState]);

  const changeSymbol = (sym: string) => {
    const next = sym.toUpperCase().trim();
    if (!next || next === symbol) return;
    setSymbol(next);
    setSymbolLoading(true);
    setTrades([]);
    setPriceHistory([]);
    setChartBars([]);
    setChartPatch(null);
    setPricePoint(null);
    setChartTimeframe("1D");
    setChartIntervalLabel("1m");
    setUser(DEFAULT_USER);
    send({ action: "symbol", symbol: next });
  };

  const changeTimeframe = useCallback((tf: ChartTimeframe) => {
    if (tf === chartTimeframe) return;
    setChartLoading(true);
    setChartTimeframe(tf);
    send({ action: "timeframe", timeframe: tf });
    fetch(`${process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000"}/chart/timeframe`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ timeframe: tf }),
    })
      .then((r) => r.json())
      .then((resp) => {
        if (resp.chart_bars) setChartBars(resp.chart_bars);
        if (resp.interval_label) setChartIntervalLabel(resp.interval_label);
        if (resp.timeframe) setChartTimeframe(resp.timeframe);
      })
      .catch(() => {})
      .finally(() => setChartLoading(false));
  }, [chartTimeframe, send]);

  return (
    <div className="bb-terminal">
      <TraderHeader
        symbol={symbol}
        tick={tick}
        user={user}
        connected={connected}
        market={market}
        onSymbolChange={changeSymbol}
        symbolLoading={symbolLoading}
      />

      <BloombergCommandBar symbol={symbol} onSymbolChange={changeSymbol} />
      <MarketStatusBar market={market} lastUpdateTs={lastUpdateTs} />

      <div className="desk">
        <div className="desk-col desk-col-watch">
          <BloombergWatchlist rows={watchlist} active={symbol} onSelect={changeSymbol} />
          <MemoOrderBook book={book} symbol={symbol} />
          <MemoMarketData tick={tick} lastUpdateTs={lastUpdateTs} isLive={market?.is_regular_hours} />
        </div>

        <div className="desk-col desk-col-center">
          <MemoChart
            symbol={symbol}
            tick={tick}
            bars={chartBars}
            chartPatch={chartPatch}
            market={market}
            timeframe={chartTimeframe}
            intervalLabel={chartIntervalLabel}
            loading={chartLoading}
            onTimeframeChange={changeTimeframe}
          />
          <MemoOrderBlotter pending={pendingOrders} history={orderHistory} onCancel={cancelOrder} />
          <MemoTradeTape trades={trades} isLive={market?.is_regular_hours} />
        </div>

        <div className="desk-col">
          <MemoPortfolio user={user} />
          <MemoOrderTicket
            symbol={symbol}
            mid={book.mid}
            bid={tick?.bid ?? 0}
            ask={tick?.ask ?? 0}
            connected={connected}
            canTrade={book.mid > 0 && (book.bids.length > 0 || book.asks.length > 0)}
            user={user}
            onSubmit={sendOrder}
          />
        </div>
      </div>

      <BloombergTicker tick={tick} market={market} symbol={symbol} />
    </div>
  );
}

const MemoOrderBook = memo(OrderBook, (a, b) => a.symbol === b.symbol && sameBook(a.book, b.book));
const MemoTradeTape = memo(TradeTape);
const MemoOrderBlotter = memo(OrderBlotter);
const MemoPortfolio = memo(PortfolioSwitcher, (a, b) => sameUser(a.user, b.user));
const MemoOrderTicket = memo(OrderTicket, (a, b) =>
  a.symbol === b.symbol
  && a.mid === b.mid
  && a.bid === b.bid
  && a.ask === b.ask
  && a.connected === b.connected
  && a.canTrade === b.canTrade
  && sameUser(a.user, b.user)
  && a.onSubmit === b.onSubmit,
);
const MemoMarketData = memo(
  function MarketDataLive({ tick, lastUpdateTs, isLive }: { tick: TickInfo | null; lastUpdateTs: number; isLive?: boolean }) {
    return <MarketDataPanel tick={tick} compact isLive={isLive} lastUpdateTs={lastUpdateTs} />;
  },
  (a, b) => {
    if (a.lastUpdateTs !== b.lastUpdateTs) return false;
    if (a.isLive !== b.isLive) return false;
    if (!a.tick && !b.tick) return true;
    if (!a.tick || !b.tick) return false;
    return sameTick(a.tick, b.tick);
  },
);
const MemoChart = memo(BloombergTerminalChart, (a, b) =>
  a.symbol === b.symbol
  && a.timeframe === b.timeframe
  && a.intervalLabel === b.intervalLabel
  && a.loading === b.loading
  && a.bars === b.bars
  && a.chartPatch === b.chartPatch
  && a.onTimeframeChange === b.onTimeframeChange
  && (a.tick?.price === b.tick?.price)
  && (a.tick?.change === b.tick?.change)
  && (a.tick?.change_pct === b.tick?.change_pct)
  && (a.tick?.day_high === b.tick?.day_high)
  && (a.tick?.day_low === b.tick?.day_low)
  && (a.market?.status === b.market?.status)
  && (a.market?.is_live === b.market?.is_live)
  && (a.market?.is_regular_hours === b.market?.is_regular_hours),
);
