"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import type { IChartApi, ISeriesApi, CandlestickData, HistogramData, LineData } from "lightweight-charts";
import type { ChartBar, ChartTimeframe } from "@/components/BloombergTerminalChart";
import { CHART_TIMEFRAMES } from "@/components/BloombergTerminalChart";
import type { MarketSession, TickInfo } from "@/app/page";
import {
  bollinger,
  computeAnalysis,
  DEFAULT_INDICATORS,
  ema,
  macd,
  rsi,
  sma,
  type IndicatorToggles,
} from "@/lib/chartIndicators";
import { fmtBarTime, sanitizeBars, toChartTime } from "@/lib/chartUtils";
import ChartAnalysisPanel from "@/components/ChartAnalysisPanel";
import ChartSymbolBar from "@/components/ChartSymbolBar";
import LoadingSpinner from "@/components/LoadingSpinner";
import { PRODUCT_NAME } from "@/lib/orionAlpha";

const CHART_THEME = {
  bg: "#000000",
  grid: "#1a1a1a",
  border: "#2a2a2a",
  text: "#666666",
  up: "#3ddc84",
  down: "#ff5252",
};

interface Props {
  symbol: string;
  tick: TickInfo | null;
  bars: ChartBar[];
  market: MarketSession | null;
  timeframe: ChartTimeframe;
  intervalLabel: string;
  loading?: boolean;
  connected?: boolean;
  symbolLoading?: boolean;
  onSymbolChange: (sym: string) => void;
  onTimeframeChange: (tf: ChartTimeframe) => void;
}

function toCandle(bar: ChartBar): CandlestickData {
  return { time: toChartTime(bar.ts), open: bar.open, high: bar.high, low: bar.low, close: bar.close };
}

function toVolume(bar: ChartBar): HistogramData {
  return {
    time: toChartTime(bar.ts),
    value: bar.volume,
    color: bar.close >= bar.open ? "rgba(61,220,132,0.35)" : "rgba(255,82,82,0.35)",
  };
}

function toLine(bars: ChartBar[], values: (number | null)[]): LineData[] {
  const out: LineData[] = [];
  for (let i = 0; i < bars.length; i++) {
    if (values[i] == null) continue;
    out.push({ time: toChartTime(bars[i].ts), value: values[i]! });
  }
  return out;
}

function toHist(bars: ChartBar[], values: (number | null)[]): HistogramData[] {
  const out: HistogramData[] = [];
  for (let i = 0; i < bars.length; i++) {
    if (values[i] == null) continue;
    const v = values[i]!;
    out.push({
      time: toChartTime(bars[i].ts),
      value: v,
      color: v >= 0 ? "rgba(61,220,132,0.5)" : "rgba(255,82,82,0.5)",
    });
  }
  return out;
}

export default function FullScreenChartView({
  symbol,
  tick,
  bars,
  market,
  timeframe,
  intervalLabel,
  loading = false,
  connected = false,
  symbolLoading,
  onSymbolChange,
  onTimeframeChange,
}: Props) {
  const mainRef = useRef<HTMLDivElement>(null);
  const rsiRef = useRef<HTMLDivElement>(null);
  const macdRef = useRef<HTMLDivElement>(null);

  const mainChartRef = useRef<IChartApi | null>(null);
  const rsiChartRef = useRef<IChartApi | null>(null);
  const macdChartRef = useRef<IChartApi | null>(null);

  const candleRef = useRef<ISeriesApi<"Candlestick"> | null>(null);
  const volumeRef = useRef<ISeriesApi<"Histogram"> | null>(null);
  const overlayRefs = useRef<ISeriesApi<"Line">[]>([]);
  const rsiSeriesRef = useRef<ISeriesApi<"Line"> | null>(null);
  const macdLineRef = useRef<ISeriesApi<"Line"> | null>(null);
  const macdSignalRef = useRef<ISeriesApi<"Line"> | null>(null);
  const macdHistRef = useRef<ISeriesApi<"Histogram"> | null>(null);

  const syncingRef = useRef(false);
  const [indicators, setIndicators] = useState<IndicatorToggles>(DEFAULT_INDICATORS);
  const [crosshair, setCrosshair] = useState<string>("");

  const cleanBars = useMemo(() => sanitizeBars(bars), [bars]);
  const analysis = useMemo(() => computeAnalysis(cleanBars), [cleanBars]);

  const indicatorData = useMemo(() => {
    const closes = cleanBars.map((b) => b.close);
    return {
      sma20: sma(closes, 20),
      sma50: sma(closes, 50),
      ema12: ema(closes, 12),
      bb: bollinger(closes, 20, 2),
      rsi: rsi(closes, 14),
      macd: macd(closes),
    };
  }, [cleanBars]);

  const syncRange = useCallback((source: IChartApi, targets: (IChartApi | null)[]) => {
    source.timeScale().subscribeVisibleLogicalRangeChange((range) => {
      if (syncingRef.current || !range) return;
      syncingRef.current = true;
      for (const t of targets) {
        if (t) t.timeScale().setVisibleLogicalRange(range);
      }
      syncingRef.current = false;
    });
  }, []);

  useEffect(() => {
    let disposed = false;
    const roList: ResizeObserver[] = [];

    const init = async () => {
      const { createChart, ColorType, CrosshairMode } = await import("lightweight-charts");
      if (disposed) return;

      const baseOpts = {
        layout: {
          background: { type: ColorType.Solid, color: CHART_THEME.bg },
          textColor: CHART_THEME.text,
          fontFamily: "SF Mono, Fira Code, Consolas, monospace",
          fontSize: 10,
        },
        grid: {
          vertLines: { color: CHART_THEME.grid },
          horzLines: { color: CHART_THEME.grid },
        },
        crosshair: {
          mode: CrosshairMode.Normal,
          vertLine: { color: "#333", width: 1 as const, style: 2, labelBackgroundColor: "#ff8c00" },
          horzLine: { color: "#333", width: 1 as const, style: 2, labelBackgroundColor: "#1a1a1a" },
        },
        timeScale: {
          borderColor: CHART_THEME.border,
          timeVisible: true,
          secondsVisible: false,
          rightOffset: 8,
          barSpacing: 8,
        },
      };

      if (mainRef.current) {
        const chart = createChart(mainRef.current, {
          ...baseOpts,
          rightPriceScale: { borderColor: CHART_THEME.border, scaleMargins: { top: 0.05, bottom: 0.2 } },
          handleScroll: { mouseWheel: true, pressedMouseMove: true, horzTouchDrag: true, vertTouchDrag: false },
          handleScale: { axisPressedMouseMove: true, mouseWheel: true, pinch: true },
        });
        candleRef.current = chart.addCandlestickSeries({
          upColor: CHART_THEME.up,
          downColor: CHART_THEME.down,
          borderVisible: false,
          wickUpColor: CHART_THEME.up,
          wickDownColor: CHART_THEME.down,
        });
        volumeRef.current = chart.addHistogramSeries({
          priceFormat: { type: "volume" },
          priceScaleId: "vol",
        });
        chart.priceScale("vol").applyOptions({ scaleMargins: { top: 0.82, bottom: 0 } });

        chart.subscribeCrosshairMove((param) => {
          if (!param.time) { setCrosshair(""); return; }
          setCrosshair(fmtBarTime(param.time as number, timeframe));
        });

        const ro = new ResizeObserver(([e]) => {
          const { width, height } = e.contentRect;
          if (width && height) chart.applyOptions({ width, height });
        });
        ro.observe(mainRef.current);
        roList.push(ro);
        mainChartRef.current = chart;
      }

      if (rsiRef.current) {
        const chart = createChart(rsiRef.current, {
          ...baseOpts,
          rightPriceScale: { borderColor: CHART_THEME.border, scaleMargins: { top: 0.1, bottom: 0.1 } },
          handleScroll: false,
          handleScale: false,
        });
        const rsiSeries = chart.addLineSeries({ color: "#3ddc84", lineWidth: 1, priceLineVisible: false, lastValueVisible: false });
        rsiSeries.createPriceLine({ price: 70, color: "#ff5252", lineWidth: 1, lineStyle: 2, axisLabelVisible: true, title: "70" });
        rsiSeries.createPriceLine({ price: 30, color: "#3ddc84", lineWidth: 1, lineStyle: 2, axisLabelVisible: true, title: "30" });
        rsiSeriesRef.current = rsiSeries;
        const ro = new ResizeObserver(([e]) => {
          const { width, height } = e.contentRect;
          if (width && height) chart.applyOptions({ width, height });
        });
        ro.observe(rsiRef.current);
        roList.push(ro);
        rsiChartRef.current = chart;
      }

      if (macdRef.current) {
        const chart = createChart(macdRef.current, {
          ...baseOpts,
          rightPriceScale: { borderColor: CHART_THEME.border, scaleMargins: { top: 0.15, bottom: 0.05 } },
          handleScroll: false,
          handleScale: false,
        });
        macdHistRef.current = chart.addHistogramSeries({ priceLineVisible: false, lastValueVisible: false });
        macdLineRef.current = chart.addLineSeries({ color: "#ff8c00", lineWidth: 1, priceLineVisible: false, lastValueVisible: false });
        macdSignalRef.current = chart.addLineSeries({ color: "#00bcd4", lineWidth: 1, priceLineVisible: false, lastValueVisible: false });
        const ro = new ResizeObserver(([e]) => {
          const { width, height } = e.contentRect;
          if (width && height) chart.applyOptions({ width, height });
        });
        ro.observe(macdRef.current);
        roList.push(ro);
        macdChartRef.current = chart;
      }

      if (mainChartRef.current) {
        syncRange(mainChartRef.current, [rsiChartRef.current, macdChartRef.current]);
      }
    };

    void init();

    return () => {
      disposed = true;
      roList.forEach((ro) => ro.disconnect());
      overlayRefs.current = [];
      [mainChartRef, rsiChartRef, macdChartRef].forEach((ref) => {
        if (ref.current) {
          ref.current.remove();
          ref.current = null;
        }
      });
      candleRef.current = null;
      volumeRef.current = null;
      rsiSeriesRef.current = null;
      macdLineRef.current = null;
      macdSignalRef.current = null;
      macdHistRef.current = null;
    };
  }, [syncRange, timeframe]);

  useEffect(() => {
    const main = mainChartRef.current;
    const candles = candleRef.current;
    const volume = volumeRef.current;
    if (!main || !candles || !volume) return;

    overlayRefs.current.forEach((s) => { try { main.removeSeries(s); } catch { /* disposed */ } });
    overlayRefs.current = [];

    if (cleanBars.length === 0) {
      candles.setData([]);
      volume.setData([]);
      return;
    }

    candles.setData(cleanBars.map(toCandle));
    volume.setData(indicators.volume ? cleanBars.map(toVolume) : []);

    const addLine = (data: LineData[], color: string) => {
      const s = main.addLineSeries({ color, lineWidth: 1 as const, priceLineVisible: false, lastValueVisible: false });
      s.setData(data);
      overlayRefs.current.push(s);
    };

    if (indicators.sma20) addLine(toLine(cleanBars, indicatorData.sma20), "#ff8c00");
    if (indicators.sma50) addLine(toLine(cleanBars, indicatorData.sma50), "#ffd700");
    if (indicators.ema12) addLine(toLine(cleanBars, indicatorData.ema12), "#00bcd4");
    if (indicators.bb) {
      addLine(toLine(cleanBars, indicatorData.bb.upper), "#9c27b0");
      addLine(toLine(cleanBars, indicatorData.bb.middle), "#9c27b080");
      addLine(toLine(cleanBars, indicatorData.bb.lower), "#9c27b0");
    }

    const count = Math.min(timeframe === "1D" ? 120 : 80, cleanBars.length);
    main.timeScale().setVisibleLogicalRange({
      from: Math.max(0, cleanBars.length - count),
      to: cleanBars.length,
    });
  }, [cleanBars, indicators, indicatorData, timeframe]);

  useEffect(() => {
    if (rsiSeriesRef.current) {
      rsiSeriesRef.current.setData(indicators.rsi ? toLine(cleanBars, indicatorData.rsi) : []);
    }
  }, [cleanBars, indicatorData.rsi, indicators.rsi]);

  useEffect(() => {
    if (macdLineRef.current && macdSignalRef.current && macdHistRef.current) {
      if (indicators.macd) {
        macdLineRef.current.setData(toLine(cleanBars, indicatorData.macd.line));
        macdSignalRef.current.setData(toLine(cleanBars, indicatorData.macd.signal));
        macdHistRef.current.setData(toHist(cleanBars, indicatorData.macd.histogram));
      } else {
        macdLineRef.current.setData([]);
        macdSignalRef.current.setData([]);
        macdHistRef.current.setData([]);
      }
    }
  }, [cleanBars, indicatorData.macd, indicators.macd]);

  const marketLabel =
    market?.status === "open" ? "REGULAR"
    : market?.status === "pre" ? "PRE-MARKET"
    : market?.status === "after" ? "AFTER-HOURS"
    : "CLOSED";

  return (
    <div className="fs-chart-root">
      <header className="fs-chart-header">
        <div className="fs-chart-header-left">
          <a href="/" className="fs-back-link mono">← {PRODUCT_NAME}</a>
          <ChartSymbolBar
            symbol={symbol}
            onChange={onSymbolChange}
            loading={symbolLoading}
          />
          {tick && (
            <span className={`fs-chart-last mono ${(tick.change ?? 0) >= 0 ? "pnl-pos" : "pnl-neg"}`}>
              ${tick.price.toFixed(2)}
            </span>
          )}
          <span className={`fs-conn-dot${connected ? " fs-conn-live" : ""}`} title={connected ? "Connected" : "Disconnected"} />
          <span className="fs-market-tag mono">{marketLabel}</span>
          {crosshair && <span className="fs-crosshair-time mono">{crosshair}</span>}
        </div>
        <div className="chart-timeframe-row">
          {CHART_TIMEFRAMES.map((tf) => (
            <button
              key={tf.id}
              type="button"
              className={`chart-tf-btn ${timeframe === tf.id ? "chart-tf-active" : ""}`}
              title={tf.desc}
              disabled={loading && timeframe !== tf.id}
              onClick={() => tf.id !== timeframe && onTimeframeChange(tf.id)}
            >
              {tf.label}
            </button>
          ))}
        </div>
      </header>

      <div className="fs-chart-body">
        <div className="fs-chart-stack">
          <div className="fs-chart-pane-wrap fs-chart-pane-main-wrap">
            <div ref={mainRef} className="fs-chart-pane fs-chart-pane-main" />
            {(cleanBars.length < 2 || loading) && (
              <div className="fs-chart-loading">
                <LoadingSpinner
                  size="md"
                  label={loading ? `Loading ${timeframe} chart…` : "Waiting for chart data…"}
                />
                {tick && tick.price > 0 && (
                  <span className="mono bloomberg-chart-last">
                    {symbol} ${tick.price.toFixed(2)}
                  </span>
                )}
              </div>
            )}
          </div>
          <div className={`fs-chart-pane-wrap${indicators.rsi ? "" : " fs-pane-hidden"}`}>
            <div className="fs-pane-label mono">RSI 14</div>
            <div ref={rsiRef} className="fs-chart-pane fs-chart-pane-rsi" />
          </div>
          <div className={`fs-chart-pane-wrap${indicators.macd ? "" : " fs-pane-hidden"}`}>
            <div className="fs-pane-label mono">MACD (12, 26, 9)</div>
            <div ref={macdRef} className="fs-chart-pane fs-chart-pane-macd" />
          </div>
        </div>

        <ChartAnalysisPanel
          symbol={symbol}
          timeframe={timeframe}
          intervalLabel={intervalLabel}
          tick={tick}
          analysis={analysis}
          indicators={indicators}
          onIndicatorsChange={setIndicators}
          onSymbolChange={onSymbolChange}
          symbolLoading={symbolLoading}
        />
      </div>
    </div>
  );
}
