"use client";

import { useState, useCallback, useRef, memo, useEffect } from "react";
import OrderBook from "@/components/OrderBook";
import TradeTape from "@/components/TradeTape";
import BloombergCommandBar from "@/components/BloombergCommandBar";
import BloombergFunctionBar from "@/components/BloombergFunctionBar";
import BloombergHelpPanel from "@/components/BloombergHelpPanel";
import BloombergWatchlist, { type WatchRow } from "@/components/BloombergWatchlist";
import BloombergTicker from "@/components/BloombergTicker";
import TraderHeader from "@/components/TraderHeader";
import MarketStatusBar from "@/components/MarketStatusBar";
import MarketDataPanel from "@/components/MarketDataPanel";
import CompanyReportPanel, { CompanyDirectory } from "@/components/CompanyReportPanel";
import InvestmentBankerDesk from "@/components/InvestmentBankerDesk";
import ProResearchDesk from "@/components/ProResearchDesk";
import CppEnginePanel from "@/components/CppEnginePanel";
import BloombergTerminalChart, { type ChartBar, type ChartTimeframe } from "@/components/BloombergTerminalChart";
import LoadingSpinner from "@/components/LoadingSpinner";
import type { QuickQuote } from "@/components/PanelLoading";
import { useMarketStream } from "@/hooks/useMarketStream";
import { getApiBase } from "@/lib/api";
import {
  deskColumnForFunction,
  isFullDeskFunction,
  mobileTabForFunction,
  type BbFunction,
  type MobileDeskTab,
} from "@/lib/bloombergCommands";
import { chartPageUrl } from "@/lib/chartIndicators";
import {
  mergeChartBars,
  mergeChartPatch,
  sameBook,
  sameTick,
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

export interface Stats {
  avg_latency_ns: number;
  total_orders: number;
  total_trades: number;
}

export interface MarketSession {
  status: "open" | "pre" | "after" | "closed";
  label: string;
  session_detail?: string;
  day_name?: string;
  is_weekend?: boolean;
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
    setTick: (t: TickInfo | ((p: TickInfo | null) => TickInfo | null)) => void;
    setMarket: (m: MarketSession | ((p: MarketSession | null) => MarketSession | null)) => void;
    setPriceHistory: (h: { ts: number; price: number }[] | ((p: { ts: number; price: number }[]) => { ts: number; price: number }[])) => void;
    setChartBars: (b: ChartBar[] | ((p: ChartBar[]) => ChartBar[])) => void;
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

  if (msg.market) {
    const market = msg.market as MarketSession;
    setters.setMarket((prev) => {
      if (!prev) return market;
      return JSON.stringify(prev) === JSON.stringify(market) ? prev : market;
    });
  }

  if (msg.chart_patch) {
    const patch = msg.chart_patch as ChartBar;
    setters.setChartBars((prev) => mergeChartPatch(prev, patch));
  } else if (msg.chart_bars) {
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
  const [tick, setTick] = useState<TickInfo | null>(null);
  const [market, setMarket] = useState<MarketSession | null>(null);
  const [priceHistory, setPriceHistory] = useState<{ ts: number; price: number }[]>([]);
  const [chartBars, setChartBars] = useState<ChartBar[]>([]);
  const [pricePoint, setPricePoint] = useState<{ ts: number; price: number } | null>(null);
  const [chartTimeframe, setChartTimeframe] = useState<ChartTimeframe>("1D");
  const [chartIntervalLabel, setChartIntervalLabel] = useState("1m");
  const [chartLoading, setChartLoading] = useState(false);
  const [lastUpdateTs, setLastUpdateTs] = useState(0);
  const [symbol, setSymbol] = useState("AAPL");
  const [symbolLoading, setSymbolLoading] = useState(false);
  const [watchlist, setWatchlist] = useState<WatchRow[]>([]);
  const [mobileTab, setMobileTab] = useState<MobileDeskTab>("chart");
  const [bbFunction, setBbFunction] = useState<BbFunction>("FA");
  const [bootstrapping, setBootstrapping] = useState(true);
  const [stats, setStats] = useState<Stats | null>(null);

  const tickMetaRef = useRef({ ts: 0 });
  const activeDesk = deskColumnForFunction(bbFunction);
  const fullDesk = isFullDeskFunction(bbFunction);
  const reportMode: BbFunction = bbFunction === "DES" || bbFunction === "CN" ? bbFunction : "FA";

  const syncMeta = useCallback((msg: Record<string, unknown>) => {
    if (msg.watchlist) setWatchlist(msg.watchlist as WatchRow[]);
  }, []);

  const applyFullSnapshot = useCallback((msg: Record<string, unknown>) => {
    if (msg.book) setBook(msg.book as Book);
    if (msg.market) setMarket(msg.market as MarketSession);
    if (msg.stats) setStats(msg.stats as Stats);
    if (msg.price_history) {
      setPricePoint(null);
      setPriceHistory(msg.price_history as { ts: number; price: number }[]);
    }
    if (msg.chart_bars) {
      setChartBars(msg.chart_bars as ChartBar[]);
    }
    if (msg.chart_timeframe) setChartTimeframe(msg.chart_timeframe as ChartTimeframe);
    if (msg.chart_interval_label) setChartIntervalLabel(msg.chart_interval_label as string);
    const tickMsg = (msg.tick || msg.quote) as TickInfo | undefined;
    if (tickMsg?.symbol) setTick(tickMsg);
    syncMeta(msg);
    if (tickMsg?.price || msg.book) setBootstrapping(false);
  }, [syncMeta]);

  const handleMessage = useCallback((msg: Record<string, unknown>) => {
    if (msg.type === "snapshot" || msg.type === "symbol_changed" || msg.type === "timeframe_changed") {
      if (msg.trades) setTrades(msg.trades as Trade[]);
      if (msg.symbol) setSymbol(msg.symbol as string);
      else if ((msg.tick as TickInfo)?.symbol) setSymbol((msg.tick as TickInfo).symbol);
      applyFullSnapshot(msg);
      setSymbolLoading(false);
      setChartLoading(false);
      setPricePoint(null);
      setBootstrapping(false);
      return;
    }

    if (msg.type === "tick") {
      applyTickUpdate(msg, {
        setBook,
        setTick,
        setMarket,
        setPriceHistory,
        setChartBars,
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

  const changeSymbol = useCallback((sym: string) => {
    const next = sym.toUpperCase().trim();
    if (!next || next === symbol) return;
    setSymbol(next);
    setSymbolLoading(true);
    setTrades([]);
    setPriceHistory([]);
    setChartBars([]);
    setPricePoint(null);
    setChartTimeframe("1D");
    setChartIntervalLabel("1m");
    send({ action: "symbol", symbol: next });
  }, [symbol, send]);

  const changeTimeframe = useCallback((tf: ChartTimeframe) => {
    if (tf === chartTimeframe) return;
    setChartLoading(true);
    setChartTimeframe(tf);
    send({ action: "timeframe", timeframe: tf });
    fetch(`${getApiBase()}/chart/timeframe`, {
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

  const handleBbFunction = useCallback((fn: BbFunction, sym?: string) => {
    setBbFunction(fn);
    setMobileTab(mobileTabForFunction(fn));

    if (sym) changeSymbol(sym);
    else if (fn === "WEI") changeSymbol("SPY");

    if (fn === "HP") {
      changeTimeframe("1Y");
      const target = sym || symbol;
      window.open(chartPageUrl(target, "1Y"), "_blank", "noopener,noreferrer");
    }
  }, [changeSymbol, changeTimeframe, symbol]);

  const handleMarketSelect = useCallback((sym: string) => {
    changeSymbol(sym);
    setBbFunction("RES");
    setMobileTab("research");
  }, [changeSymbol]);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape" && bbFunction === "HELP") setBbFunction("GP");
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [bbFunction]);

  const quickQuote: QuickQuote = {
    symbol: tick?.symbol || symbol,
    price: tick?.price,
    change: tick?.change,
    change_pct: tick?.change_pct,
  };

  return (
    <div className="bb-terminal">
      {bootstrapping && (
        <div className="oa-boot-bar">
          <LoadingSpinner size="sm" />
          <span>Connecting to market feed — loading live quotes…</span>
        </div>
      )}
      <TraderHeader
        symbol={symbol}
        tick={tick}
        connected={connected}
        market={market}
        onSymbolChange={changeSymbol}
        symbolLoading={symbolLoading}
      />

      <BloombergCommandBar symbol={symbol} onSymbolChange={changeSymbol} onFunction={handleBbFunction} />
      <BloombergFunctionBar active={bbFunction} onSelect={handleBbFunction} />
      <MarketStatusBar market={market} lastUpdateTs={lastUpdateTs} />

      <div className={`desk${fullDesk ? " desk-has-full" : ""}`}>
        {bbFunction === "IB" ? (
          <InvestmentBankerDesk active={symbol} onSelect={handleMarketSelect} />
        ) : bbFunction === "RES" ? (
          <ProResearchDesk symbol={symbol} onSelect={handleMarketSelect} quickQuote={quickQuote} />
        ) : (
        <>
        <div className={`desk-col desk-col-watch${activeDesk === "watch" ? " desk-col-active" : ""}${mobileTab === "market" ? " desk-mobile-active" : ""}`}>
          <BloombergWatchlist
            rows={watchlist}
            active={symbol}
            onSelect={changeSymbol}
            loading={bootstrapping && watchlist.length === 0}
          />
          <MemoOrderBook book={book} symbol={symbol} />
          <CppEnginePanel stats={stats} connected={connected} />
          <MemoMarketData tick={tick} lastUpdateTs={lastUpdateTs} isLive={market?.is_regular_hours} />
        </div>

        <div className={`desk-col desk-col-center${activeDesk === "center" ? " desk-col-active" : ""}${mobileTab === "chart" ? " desk-mobile-active" : ""}`}>
          {bbFunction === "HELP" ? (
            <BloombergHelpPanel onClose={() => setBbFunction("GP")} />
          ) : (
            <>
              <MemoChart
                symbol={symbol}
                tick={tick}
                bars={chartBars}
                market={market}
                timeframe={chartTimeframe}
                intervalLabel={chartIntervalLabel}
                loading={chartLoading}
                symbolLoading={symbolLoading}
                onTimeframeChange={changeTimeframe}
                onSymbolChange={changeSymbol}
              />
              <MemoTradeTape
                trades={trades}
                isLive={market?.is_regular_hours}
                marketClosed={!market?.is_live || market?.is_weekend}
              />
            </>
          )}
        </div>

        <div className={`desk-col desk-col-report${activeDesk === "report" ? " desk-col-active" : ""}${mobileTab === "report" ? " desk-mobile-active" : ""}`}>
          <CompanyDirectory active={symbol} onSelect={changeSymbol} />
          <MemoCompanyReport symbol={symbol} mode={reportMode} quickQuote={quickQuote} />
        </div>
        </>
        )}
      </div>

      <nav className="mobile-desk-nav" aria-label="Desk panels">
        <button
          type="button"
          className={`mobile-desk-tab${mobileTab === "chart" ? " mobile-desk-tab-active" : ""}`}
          onClick={() => { setMobileTab("chart"); setBbFunction("GP"); }}
        >
          Chart
        </button>
        <button
          type="button"
          className={`mobile-desk-tab${mobileTab === "market" ? " mobile-desk-tab-active" : ""}`}
          onClick={() => { setMobileTab("market"); setBbFunction("MON"); }}
        >
          Market
        </button>
        <button
          type="button"
          className={`mobile-desk-tab${mobileTab === "report" ? " mobile-desk-tab-active" : ""}`}
          onClick={() => { setMobileTab("report"); setBbFunction("FA"); }}
        >
          Report
        </button>
        <button
          type="button"
          className={`mobile-desk-tab${mobileTab === "ibank" ? " mobile-desk-tab-active" : ""}`}
          onClick={() => { setMobileTab("ibank"); setBbFunction("IB"); }}
        >
          I-Bank
        </button>
        <button
          type="button"
          className={`mobile-desk-tab${mobileTab === "research" ? " mobile-desk-tab-active" : ""}`}
          onClick={() => { setMobileTab("research"); setBbFunction("RES"); }}
        >
          Research
        </button>
      </nav>

      <BloombergTicker tick={tick} market={market} symbol={symbol} />
    </div>
  );
}

const MemoOrderBook = memo(OrderBook, (a, b) => a.symbol === b.symbol && sameBook(a.book, b.book));
const MemoTradeTape = memo(TradeTape);
const MemoCompanyReport = memo(
  CompanyReportPanel,
  (a, b) => a.symbol === b.symbol && a.mode === b.mode && a.quickQuote?.price === b.quickQuote?.price,
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
  && a.symbolLoading === b.symbolLoading
  && a.bars === b.bars
  && a.onTimeframeChange === b.onTimeframeChange
  && a.onSymbolChange === b.onSymbolChange
  && (a.tick?.price === b.tick?.price)
  && (a.tick?.change === b.tick?.change)
  && (a.tick?.change_pct === b.tick?.change_pct)
  && (a.tick?.day_high === b.tick?.day_high)
  && (a.tick?.day_low === b.tick?.day_low)
  && (a.market?.status === b.market?.status)
  && (a.market?.is_live === b.market?.is_live)
  && (a.market?.is_regular_hours === b.market?.is_regular_hours),
);
