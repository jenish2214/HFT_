"use client";

import { ORION_UNIVERSE } from "@/lib/orionAlpha";
import SymbolSearchInput from "@/components/SymbolSearchInput";

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
    <div className={`chart-symbol-bar${compact ? " chart-symbol-bar-compact" : ""}`}>
      <SymbolSearchInput
        value={symbol}
        onSelect={onChange}
        loading={loading}
        dark
        compact={compact}
        showGoButton
        placeholder="AAPL · EURUSD · BTC-USD"
        className="chart-symbol-search"
        inputClassName="chart-symbol-input"
        ariaLabel="Chart symbol search"
      />
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
    </div>
  );
}
