"use client";

import { ORION_UNIVERSE } from "@/lib/orionAlpha";

const QUICK = [
  ...ORION_UNIVERSE.equities.slice(0, 4),
  "BTC-USD",
  "SPY",
  "GC=F",
];

interface Props {
  symbol: string;
  onChange: (sym: string) => void;
  loading?: boolean;
  compact?: boolean;
}

export default function ChartSymbolBar({ symbol, onChange, loading, compact }: Props) {
  return (
    <form
      className={`chart-symbol-bar${compact ? " chart-symbol-bar-compact" : ""}`}
      onSubmit={(e) => {
        e.preventDefault();
        const fd = new FormData(e.currentTarget);
        const sym = String(fd.get("sym") || "").trim().toUpperCase();
        if (sym) onChange(sym);
      }}
    >
      <input
        name="sym"
        className="chart-symbol-input mono"
        defaultValue={symbol}
        key={symbol}
        placeholder="AAPL · BTC-USD · GC=F"
        maxLength={14}
        disabled={loading}
        aria-label="Chart symbol"
      />
      <button type="submit" className="chart-symbol-go" disabled={loading}>GO</button>
      {!compact && (
        <div className="chart-symbol-quick">
          {QUICK.map((s) => (
            <button
              key={s}
              type="button"
              className={`chart-symbol-chip mono${s === symbol ? " chart-symbol-chip-on" : ""}`}
              disabled={loading}
              onClick={() => onChange(s)}
            >
              {s}
            </button>
          ))}
        </div>
      )}
    </form>
  );
}
