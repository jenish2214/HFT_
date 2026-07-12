"use client";

import { Suspense, useEffect } from "react";
import { useSearchParams } from "next/navigation";
import FullScreenChartView from "@/components/FullScreenChartView";
import type { ChartTimeframe } from "@/components/BloombergTerminalChart";
import { useChartStream } from "@/hooks/useChartStream";

const VALID_TF = new Set<ChartTimeframe>(["1D", "1W", "1M", "3M", "1Y", "ALL"]);

function parseTimeframe(raw: string | null): ChartTimeframe {
  const tf = (raw || "1D").toUpperCase() as ChartTimeframe;
  return VALID_TF.has(tf) ? tf : "1D";
}

function ChartPageContent() {
  const params = useSearchParams();
  const initialSymbol = (params.get("symbol") || "AAPL").toUpperCase();
  const initialTf = parseTimeframe(params.get("tf"));

  const stream = useChartStream(initialSymbol, initialTf);

  useEffect(() => {
    const url = new URL(window.location.href);
    url.searchParams.set("symbol", stream.symbol);
    url.searchParams.set("tf", stream.chartTimeframe);
    window.history.replaceState(null, "", url.toString());
  }, [stream.symbol, stream.chartTimeframe]);

  return (
    <FullScreenChartView
      symbol={stream.symbol}
      tick={stream.tick}
      bars={stream.chartBars}
      market={stream.market}
      timeframe={stream.chartTimeframe}
      intervalLabel={stream.chartIntervalLabel}
      loading={stream.chartLoading}
      connected={stream.connected}
      symbolLoading={stream.symbolLoading}
      onSymbolChange={stream.changeSymbol}
      onTimeframeChange={stream.changeTimeframe}
    />
  );
}

export default function ChartPage() {
  return (
    <Suspense fallback={
      <div className="fs-chart-root fs-chart-loading-page mono">Loading chart workspace…</div>
    }>
      <ChartPageContent />
    </Suspense>
  );
}
