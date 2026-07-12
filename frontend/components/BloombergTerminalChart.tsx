"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import {
  type IChartApi,
  type ISeriesApi,
  type CandlestickData,
  type HistogramData,
  type UTCTimestamp,
  createChart,
  ColorType,
  CrosshairMode,
} from "lightweight-charts";
import type { MarketSession, TickInfo } from "@/lib/marketTypes";
import { chartPageUrl } from "@/lib/chartIndicators";
import LoadingSpinner from "@/components/LoadingSpinner";
import ChartSymbolBar from "@/components/ChartSymbolBar";

export interface ChartBar {
  ts: number;
  open: number;
  high: number;
  low: number;
  close: number;
  volume: number;
}

export type ChartTimeframe = "1D" | "1W" | "1M" | "3M" | "1Y" | "ALL";

export const CHART_TIMEFRAMES: { id: ChartTimeframe; label: string; desc: string }[] = [
  { id: "1D", label: "1D", desc: "Intraday 1m" },
  { id: "1W", label: "1W", desc: "5 days · 5m" },
  { id: "1M", label: "1M", desc: "1 month · 1h" },
  { id: "3M", label: "3M", desc: "3 months · daily" },
  { id: "1Y", label: "1Y", desc: "1 year · daily" },
  { id: "ALL", label: "All", desc: "Max history · weekly" },
];

interface Props {
  symbol: string;
  tick: TickInfo | null;
  bars: ChartBar[];
  market: MarketSession | null;
  timeframe: ChartTimeframe;
  intervalLabel: string;
  loading?: boolean;
  symbolLoading?: boolean;
  onTimeframeChange: (tf: ChartTimeframe) => void;
  onSymbolChange?: (sym: string) => void;
}

interface CrosshairInfo {
  time: string;
  open: number;
  high: number;
  low: number;
  close: number;
  volume: number;
}

const CHART_THEME = {
  bg: "#0a0f1a",
  grid: "#1e2d4a",
  border: "#1e2d4a",
  text: "#64748b",
  up: "#34d399",
  down: "#f87171",
};

function normalizeTs(ts: unknown): number {
  let n = Math.floor(Number(ts));
  if (!Number.isFinite(n) || n <= 0) return 0;
  if (n > 1e12) n = Math.floor(n / 1000);
  return n;
}

function toChartTime(ts: number): UTCTimestamp {
  const sec = normalizeTs(ts);
  if (sec <= 0) return 0 as UTCTimestamp;
  return sec as UTCTimestamp;
}

/** lightweight-charts requires strictly ascending unique UTC seconds. */
function sanitizeBars(bars: ChartBar[]): ChartBar[] {
  const seen = new Set<number>();
  const out: ChartBar[] = [];

  for (const bar of [...bars].sort((a, b) => normalizeTs(a.ts) - normalizeTs(b.ts))) {
    const ts = normalizeTs(bar.ts);
    if (ts <= 0 || seen.has(ts)) continue;

    const open = Number(bar.open);
    const high = Number(bar.high);
    const low = Number(bar.low);
    const close = Number(bar.close);
    if (![open, high, low, close].every((n) => Number.isFinite(n) && n > 0)) continue;

    seen.add(ts);
    out.push({
      ts,
      open,
      high,
      low,
      close,
      volume: Number.isFinite(bar.volume) ? bar.volume : 0,
    });
  }

  return out;
}

function fmtBarTime(ts: number, timeframe: ChartTimeframe): string {
  const d = new Date(ts * 1000);
  if (timeframe === "1D" || timeframe === "1W") {
    return d.toLocaleTimeString("en-US", {
      hour: "2-digit",
      minute: "2-digit",
      hour12: false,
      timeZone: "America/New_York",
    });
  }
  if (timeframe === "1M") {
    return d.toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
      hour12: false,
      timeZone: "America/New_York",
    });
  }
  return d.toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: timeframe === "ALL" ? "numeric" : undefined,
    timeZone: "America/New_York",
  });
}

function toCandle(bar: ChartBar): CandlestickData {
  return {
    time: toChartTime(bar.ts),
    open: bar.open,
    high: bar.high,
    low: bar.low,
    close: bar.close,
  };
}

function toVolume(bar: ChartBar): HistogramData {
  return {
    time: toChartTime(bar.ts),
    value: bar.volume,
    color: bar.close >= bar.open ? "rgba(61,220,132,0.35)" : "rgba(255,82,82,0.35)",
  };
}

export default function BloombergTerminalChart({
  symbol,
  tick,
  bars,
  market,
  timeframe,
  intervalLabel,
  loading = false,
  symbolLoading = false,
  onTimeframeChange,
  onSymbolChange,
}: Props) {
  const containerRef = useRef<HTMLDivElement>(null);
  const chartRef = useRef<IChartApi | null>(null);
  const candleRef = useRef<ISeriesApi<"Candlestick"> | null>(null);
  const volumeRef = useRef<ISeriesApi<"Histogram"> | null>(null);
  const barsLenRef = useRef(0);
  const lastBarTsRef = useRef(0);
  const symbolRef = useRef(symbol);
  const timeframeRef = useRef(timeframe);

  const [crosshair, setCrosshair] = useState<CrosshairInfo | null>(null);
  const [barCount, setBarCount] = useState(0);
  const [chartError, setChartError] = useState<string | null>(null);
  const mountedRef = useRef(true);

  timeframeRef.current = timeframe;

  const isLive = market?.is_live ?? false;
  const isOpen = market?.is_regular_hours ?? false;
  const chg = tick?.change ?? 0;
  const chgPct = tick?.change_pct ?? 0;
  const up = chg >= 0;

  const fitFixed = useCallback(() => {
    const chart = chartRef.current;
    if (!chart || barsLenRef.current === 0) return;
    const count = Math.min(timeframe === "1D" ? 90 : 50, barsLenRef.current);
    chart.timeScale().setVisibleLogicalRange({
      from: Math.max(0, barsLenRef.current - count),
      to: barsLenRef.current,
    });
  }, [timeframe]);

  useEffect(() => {
    mountedRef.current = true;
    const el = containerRef.current;
    if (!el) return;

    let disposed = false;
    let ro: ResizeObserver | null = null;

    const init = () => {
      if (disposed || !containerRef.current) return;

      try {
        const chart = createChart(el, {
          layout: {
            background: { type: ColorType.Solid, color: CHART_THEME.bg },
            textColor: CHART_THEME.text,
            fontFamily: "SF Mono, Fira Code, Consolas, monospace",
            fontSize: 9,
          },
          grid: {
            vertLines: { color: CHART_THEME.grid },
            horzLines: { color: CHART_THEME.grid },
          },
          crosshair: {
            mode: CrosshairMode.Normal,
            vertLine: { color: "#333333", width: 1, style: 2, labelBackgroundColor: "#22d3ee" },
            horzLine: { color: "#333333", width: 1, style: 2, labelBackgroundColor: "#1a1a1a" },
          },
          rightPriceScale: {
            borderColor: CHART_THEME.border,
            scaleMargins: { top: 0.08, bottom: 0.22 },
          },
          timeScale: {
            borderColor: CHART_THEME.border,
            timeVisible: true,
            secondsVisible: false,
            rightOffset: 6,
            barSpacing: 6,
            minBarSpacing: 1,
          },
          handleScroll: { mouseWheel: false, pressedMouseMove: false, horzTouchDrag: false, vertTouchDrag: false },
          handleScale: { axisPressedMouseMove: false, mouseWheel: false, pinch: false },
        });

        const candles = chart.addCandlestickSeries({
          upColor: CHART_THEME.up,
          downColor: CHART_THEME.down,
          borderVisible: false,
          wickUpColor: CHART_THEME.up,
          wickDownColor: CHART_THEME.down,
          priceLineVisible: false,
          lastValueVisible: false,
        });

        const volume = chart.addHistogramSeries({
          priceFormat: { type: "volume" },
          priceScaleId: "vol",
          priceLineVisible: false,
          lastValueVisible: false,
        });

        chart.priceScale("vol").applyOptions({ scaleMargins: { top: 0.82, bottom: 0 } });

        chart.subscribeCrosshairMove((param) => {
          if (!mountedRef.current || !param.time || !candleRef.current) {
            if (mountedRef.current) setCrosshair(null);
            return;
          }
          const cd = param.seriesData.get(candleRef.current) as CandlestickData | undefined;
          const vd = volumeRef.current
            ? (param.seriesData.get(volumeRef.current) as HistogramData | undefined)
            : undefined;
          if (cd && "open" in cd) {
            setCrosshair({
              time: fmtBarTime(param.time as number, timeframeRef.current),
              open: cd.open,
              high: cd.high,
              low: cd.low,
              close: cd.close,
              volume: vd?.value ?? 0,
            });
          }
        });

        ro = new ResizeObserver((entries) => {
          const { width, height } = entries[0]?.contentRect ?? {};
          if (width && height) chart.applyOptions({ width, height });
        });
        ro.observe(el);

        chartRef.current = chart;
        candleRef.current = candles;
        volumeRef.current = volume;
        setChartError(null);
      } catch (err) {
        console.error("[chart] init failed:", err);
        if (mountedRef.current) {
          setChartError("Chart failed to load — refresh the page");
        }
      }
    };

    void init();

    return () => {
      disposed = true;
      mountedRef.current = false;
      ro?.disconnect();
      if (chartRef.current) {
        chartRef.current.remove();
        chartRef.current = null;
        candleRef.current = null;
        volumeRef.current = null;
      }
    };
  }, []);

  useEffect(() => {
    const candles = candleRef.current;
    const volume = volumeRef.current;
    const chart = chartRef.current;
    if (!candles || !volume || !chart) return;

    if (symbolRef.current !== symbol || timeframeRef.current !== timeframe) {
      symbolRef.current = symbol;
      timeframeRef.current = timeframe;
      barsLenRef.current = 0;
      lastBarTsRef.current = 0;
    }

    const clean = sanitizeBars(bars);

    if (clean.length === 0) {
      try {
        candles.setData([]);
        volume.setData([]);
      } catch {
        // chart may be mid-dispose
      }
      barsLenRef.current = 0;
      lastBarTsRef.current = 0;
      setBarCount(0);
      return;
    }

    const candleData = clean.map(toCandle);
    const volumeData = clean.map(toVolume);
    const prevLen = barsLenRef.current;
    const prevLastTs = lastBarTsRef.current;
    const lastTs = clean[clean.length - 1].ts;
    const anchorTs = prevLen > 0 ? clean[Math.min(prevLen, clean.length) - 1]?.ts ?? 0 : 0;

    const fullReset =
      prevLen === 0
      || loading
      || clean.length < prevLen - 1
      || lastTs < prevLastTs
      || (prevLen > 0 && anchorTs !== prevLastTs);

    const appendOnly =
      !fullReset
      && clean.length > prevLen
      && anchorTs === prevLastTs;

    const patchLast =
      !fullReset
      && !appendOnly
      && clean.length === prevLen
      && lastTs === prevLastTs;

    try {
      if (fullReset) {
        candles.setData(candleData);
        volume.setData(volumeData);
        const count = Math.min(timeframe === "1D" ? 90 : 50, clean.length);
        chart.timeScale().setVisibleLogicalRange({
          from: Math.max(0, clean.length - count),
          to: clean.length,
        });
      } else if (appendOnly) {
        for (const bar of clean.slice(prevLen)) {
          candles.update(toCandle(bar));
          volume.update(toVolume(bar));
        }
      } else if (patchLast) {
        candles.update(candleData[candleData.length - 1]);
        volume.update(volumeData[volumeData.length - 1]);
      } else {
        candles.setData(candleData);
        volume.setData(volumeData);
        fitFixed();
      }

      barsLenRef.current = clean.length;
      lastBarTsRef.current = lastTs;
      setBarCount(clean.length);
      setChartError(null);
    } catch (err) {
      console.error("[chart] data update failed:", err);
      try {
        candles.setData(candleData);
        volume.setData(volumeData);
        const count = Math.min(timeframe === "1D" ? 90 : 50, clean.length);
        chart.timeScale().setVisibleLogicalRange({
          from: Math.max(0, clean.length - count),
          to: clean.length,
        });
        barsLenRef.current = clean.length;
        lastBarTsRef.current = lastTs;
        setBarCount(clean.length);
        setChartError(null);
      } catch {
        if (mountedRef.current) setChartError("Chart data error — try another timeframe");
      }
    }
  }, [bars, loading, timeframe, symbol, fitFixed]);

  const cleanBars = sanitizeBars(bars);
  const display = crosshair ?? (cleanBars.length > 0 ? {
    time: fmtBarTime(cleanBars[cleanBars.length - 1].ts, timeframe),
    open: tick?.open ?? cleanBars[cleanBars.length - 1].open,
    high: tick?.day_high ?? cleanBars[cleanBars.length - 1].high,
    low: tick?.day_low ?? cleanBars[cleanBars.length - 1].low,
    close: tick?.price ?? cleanBars[cleanBars.length - 1].close,
    volume: cleanBars[cleanBars.length - 1].volume,
  } : null);

  return (
    <div className="panel bloomberg-chart-panel">
      <div className="panel-head bloomberg-chart-head">
        <div className="bloomberg-chart-title">
          <span className="panel-title">GP — {symbol}</span>
          {onSymbolChange && (
            <ChartSymbolBar
              symbol={symbol}
              onChange={onSymbolChange}
              loading={symbolLoading}
              compact
            />
          )}
          {isOpen && timeframe === "1D" && <span className="bloomberg-live-badge">LIVE</span>}
          <a
            href={chartPageUrl(symbol, timeframe)}
            target="_blank"
            rel="noopener noreferrer"
            className="chart-fullscreen-btn mono"
            title="Open full-screen chart with indicators"
          >
            FULL CHART ↗
          </a>
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
      </div>

      {display && (
        <div className="bloomberg-crosshair-bar mono dense-crosshair">
          <span className="crosshair-time">{display.time}</span>
          <span>O <b className={display.close >= display.open ? "pnl-pos" : "pnl-neg"}>{display.open.toFixed(2)}</b></span>
          <span>H <b className="pnl-pos">{display.high.toFixed(2)}</b></span>
          <span>L <b className="pnl-neg">{display.low.toFixed(2)}</b></span>
          <span>C <b className={display.close >= display.open ? "pnl-pos" : "pnl-neg"}>{display.close.toFixed(2)}</b></span>
          <span>Vol <b>{display.volume.toLocaleString()}</b></span>
          {tick && (
            <>
              <span className="bid">Bid {tick.bid > 0 ? tick.bid.toFixed(2) : "—"}</span>
              <span className="ask">Ask {tick.ask > 0 ? tick.ask.toFixed(2) : "—"}</span>
              <span className={up ? "pnl-pos" : "pnl-neg"}>
                {up ? "+" : ""}{chg.toFixed(2)} ({up ? "+" : ""}{chgPct.toFixed(2)}%)
              </span>
            </>
          )}
          {market?.status === "open" && (
            <span className="chart-market-tag dense-fixed-tag chart-market-open">OPEN</span>
          )}
        </div>
      )}

      <div className="bloomberg-chart-body">
        <div ref={containerRef} className="bloomberg-chart-container" />
        {(cleanBars.length < 2 || loading || chartError) && (
          <div className="bloomberg-chart-empty bloomberg-chart-overlay">
            <LoadingSpinner
              size="md"
              label={chartError ?? (loading ? `Loading ${timeframe} chart…` : "Loading chart…")}
            />
            {tick && tick.price > 0 && (
              <span className="mono bloomberg-chart-last oa-fast-info-inline">
                {tick.symbol} ${tick.price.toFixed(2)}
                {tick.change_pct != null && (
                  <span className={tick.change_pct >= 0 ? " pnl-pos" : " pnl-neg"}>
                    {" "}{tick.change_pct >= 0 ? "+" : ""}{tick.change_pct.toFixed(2)}%
                  </span>
                )}
              </span>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
