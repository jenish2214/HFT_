"use client";

import type { ChartAnalysis, IndicatorToggles } from "@/lib/chartIndicators";
import type { ChartTimeframe } from "@/components/BloombergTerminalChart";
import type { TickInfo } from "@/lib/marketTypes";

interface Props {
  symbol: string;
  timeframe: ChartTimeframe;
  intervalLabel: string;
  tick: TickInfo | null;
  analysis: ChartAnalysis;
  indicators: IndicatorToggles;
  onIndicatorsChange: (next: IndicatorToggles) => void;
  onSymbolChange: (sym: string) => void;
  symbolLoading?: boolean;
}

const INDICATOR_LABELS: { key: keyof IndicatorToggles; label: string; color: string }[] = [
  { key: "volume", label: "Volume", color: "#888" },
  { key: "sma20", label: "SMA 20", color: "#22d3ee" },
  { key: "sma50", label: "SMA 50", color: "#38bdf8" },
  { key: "ema12", label: "EMA 12", color: "#00bcd4" },
  { key: "bb", label: "Bollinger", color: "#9c27b0" },
  { key: "rsi", label: "RSI 14", color: "#3ddc84" },
  { key: "macd", label: "MACD", color: "#ff5252" },
];

function fmt(val: number | null | undefined, digits = 2, suffix = ""): string {
  if (val == null || !Number.isFinite(val)) return "—";
  return `${val.toFixed(digits)}${suffix}`;
}

export default function ChartAnalysisPanel({
  symbol,
  timeframe,
  intervalLabel,
  tick,
  analysis,
  indicators,
  onIndicatorsChange,
  onSymbolChange,
  symbolLoading,
}: Props) {
  const toggle = (key: keyof IndicatorToggles) => {
    onIndicatorsChange({ ...indicators, [key]: !indicators[key] });
  };

  return (
    <aside className="fs-analysis-panel">
      <div className="fs-analysis-section">
        <div className="fs-analysis-title">Symbol</div>
        <form
          className="fs-symbol-form"
          onSubmit={(e) => {
            e.preventDefault();
            const fd = new FormData(e.currentTarget);
            const sym = String(fd.get("sym") || "").trim();
            if (sym) onSymbolChange(sym);
          }}
        >
          <input
            name="sym"
            className="fs-symbol-input mono"
            defaultValue={symbol}
            key={symbol}
            placeholder="AAPL"
            disabled={symbolLoading}
          />
          <button type="submit" className="fs-symbol-go" disabled={symbolLoading}>GO</button>
        </form>
        <div className="fs-analysis-meta mono">
          {timeframe} · {intervalLabel} · {analysis.barCount} bars
        </div>
      </div>

      <div className="fs-analysis-section">
        <div className="fs-analysis-title">Price</div>
        <div className="fs-analysis-price mono">
          {tick ? `$${tick.price.toFixed(2)}` : "—"}
        </div>
        {tick && (
          <div className={`fs-analysis-chg mono ${(tick.change ?? 0) >= 0 ? "pnl-pos" : "pnl-neg"}`}>
            {(tick.change ?? 0) >= 0 ? "+" : ""}{fmt(tick.change)} ({fmt(tick.change_pct)}%)
          </div>
        )}
        <div className="fs-kpi-grid">
          <div className="fs-kpi">
            <span className="fs-kpi-label">Period Return</span>
            <span className={`fs-kpi-val mono ${analysis.periodReturn >= 0 ? "pnl-pos" : "pnl-neg"}`}>
              {analysis.periodReturn >= 0 ? "+" : ""}{fmt(analysis.periodReturn)}%
            </span>
          </div>
          <div className="fs-kpi">
            <span className="fs-kpi-label">High</span>
            <span className="fs-kpi-val mono pnl-pos">${fmt(analysis.periodHigh)}</span>
          </div>
          <div className="fs-kpi">
            <span className="fs-kpi-label">Low</span>
            <span className="fs-kpi-val mono pnl-neg">${fmt(analysis.periodLow)}</span>
          </div>
          <div className="fs-kpi">
            <span className="fs-kpi-label">Range</span>
            <span className="fs-kpi-val mono">{fmt(analysis.rangePct)}%</span>
          </div>
          <div className="fs-kpi">
            <span className="fs-kpi-label">Avg Volume</span>
            <span className="fs-kpi-val mono">{Math.round(analysis.avgVolume).toLocaleString()}</span>
          </div>
          <div className="fs-kpi">
            <span className="fs-kpi-label">Volatility</span>
            <span className="fs-kpi-val mono">{fmt(analysis.volatility)}%</span>
          </div>
        </div>
      </div>

      <div className="fs-analysis-section">
        <div className="fs-analysis-title">Technical Signals</div>
        <div className={`fs-trend-badge fs-trend-${analysis.trend.toLowerCase()}`}>{analysis.trend}</div>
        <div className="fs-signal-list mono">
          <div className="fs-signal-row">
            <span>RSI (14)</span>
            <span className={analysis.rsi14 != null && analysis.rsi14 >= 70 ? "pnl-neg" : analysis.rsi14 != null && analysis.rsi14 <= 30 ? "pnl-pos" : ""}>
              {fmt(analysis.rsi14, 1)}
            </span>
          </div>
          <div className="fs-signal-row">
            <span>MACD</span>
            <span>{fmt(analysis.macd, 3)}</span>
          </div>
          <div className="fs-signal-row">
            <span>Signal</span>
            <span>{fmt(analysis.macdSignal, 3)}</span>
          </div>
          <div className="fs-signal-row">
            <span>Histogram</span>
            <span className={(analysis.macdHist ?? 0) >= 0 ? "pnl-pos" : "pnl-neg"}>{fmt(analysis.macdHist, 3)}</span>
          </div>
          <div className="fs-signal-row">
            <span>SMA 20</span>
            <span className={analysis.aboveSma20 ? "pnl-pos" : "pnl-neg"}>
              ${fmt(analysis.sma20)} {analysis.aboveSma20 ? "▲" : "▼"}
            </span>
          </div>
          <div className="fs-signal-row">
            <span>SMA 50</span>
            <span className={analysis.aboveSma50 ? "pnl-pos" : "pnl-neg"}>
              ${fmt(analysis.sma50)} {analysis.aboveSma50 ? "▲" : "▼"}
            </span>
          </div>
        </div>
      </div>

      <div className="fs-analysis-section">
        <div className="fs-analysis-title">Indicators</div>
        <div className="fs-indicator-toggles">
          {INDICATOR_LABELS.map(({ key, label, color }) => (
            <button
              key={key}
              type="button"
              className={`fs-ind-toggle${indicators[key] ? " fs-ind-toggle-on" : ""}`}
              onClick={() => toggle(key)}
            >
              <span className="fs-ind-dot" style={{ background: color }} />
              {label}
            </button>
          ))}
        </div>
      </div>
    </aside>
  );
}
