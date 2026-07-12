"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import type { ChartBar, ChartTimeframe } from "@/components/BloombergTerminalChart";
import type { MarketSession, TickInfo } from "@/lib/marketTypes";
import { useMarketStream } from "@/hooks/useMarketStream";
import { getApiBase } from "@/lib/api";
import { mergeChartBars, mergeChartPatch, sameTick } from "@/lib/marketDelta";

export function useChartStream(initialSymbol = "AAPL", initialTimeframe: ChartTimeframe = "1D") {
  const [symbol, setSymbol] = useState(initialSymbol);
  const [tick, setTick] = useState<TickInfo | null>(null);
  const [market, setMarket] = useState<MarketSession | null>(null);
  const [chartBars, setChartBars] = useState<ChartBar[]>([]);
  const [chartTimeframe, setChartTimeframe] = useState<ChartTimeframe>(initialTimeframe);
  const [chartIntervalLabel, setChartIntervalLabel] = useState("1m");
  const [chartLoading, setChartLoading] = useState(false);
  const [symbolLoading, setSymbolLoading] = useState(false);
  const [lastUpdateTs, setLastUpdateTs] = useState(0);
  const tickMetaRef = useRef({ ts: 0 });
  const bootstrappedRef = useRef(false);

  const applyFullSnapshot = useCallback((msg: Record<string, unknown>) => {
    if (msg.market) setMarket(msg.market as MarketSession);
    if (msg.chart_bars) setChartBars(msg.chart_bars as ChartBar[]);
    if (msg.chart_timeframe) setChartTimeframe(msg.chart_timeframe as ChartTimeframe);
    if (msg.chart_interval_label) setChartIntervalLabel(msg.chart_interval_label as string);
    const tickMsg = (msg.tick || msg.quote) as TickInfo | undefined;
    if (tickMsg?.symbol) setTick(tickMsg);
  }, []);

  const handleMessage = useCallback((msg: Record<string, unknown>) => {
    if (msg.type === "snapshot" || msg.type === "symbol_changed" || msg.type === "timeframe_changed") {
      if (msg.symbol) setSymbol(msg.symbol as string);
      else if ((msg.tick as TickInfo)?.symbol) setSymbol((msg.tick as TickInfo).symbol);
      applyFullSnapshot(msg);
      setSymbolLoading(false);
      setChartLoading(false);
      return;
    }

    if (msg.type === "tick") {
      const tickMsg = (msg.tick || msg.quote) as TickInfo | undefined;
      if (tickMsg?.symbol) {
        setTick((prev) => (prev && sameTick(prev, tickMsg) ? prev : tickMsg));
      }
      if (msg.market) {
        const m = msg.market as MarketSession;
        setMarket((prev) => (prev && JSON.stringify(prev) === JSON.stringify(m) ? prev : m));
      }
      if (msg.chart_patch) {
        setChartBars((prev) => mergeChartPatch(prev, msg.chart_patch as ChartBar));
      } else if (msg.chart_bars) {
        setChartBars((prev) => mergeChartBars(prev, msg.chart_bars as ChartBar[]));
      }

      if (msg.last_update_ts && msg.last_update_ts !== tickMetaRef.current.ts) {
        tickMetaRef.current.ts = msg.last_update_ts as number;
        setLastUpdateTs(msg.last_update_ts as number);
      }
    }
  }, [applyFullSnapshot]);

  const { connected, send } = useMarketStream(handleMessage);

  useEffect(() => {
    if (bootstrappedRef.current) return;
    bootstrappedRef.current = true;
    send({ action: "symbol", symbol: initialSymbol.toUpperCase() });
    if (initialTimeframe !== "1D") {
      send({ action: "timeframe", timeframe: initialTimeframe });
    }
  }, [initialSymbol, initialTimeframe, send]);

  const changeSymbol = useCallback((sym: string) => {
    const next = sym.toUpperCase().trim();
    if (!next || next === symbol) return;
    setSymbol(next);
    setSymbolLoading(true);
    setChartBars([]);
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

  return {
    symbol,
    tick,
    market,
    chartBars,
    chartTimeframe,
    chartIntervalLabel,
    chartLoading,
    symbolLoading,
    lastUpdateTs,
    connected,
    changeSymbol,
    changeTimeframe,
  };
}
