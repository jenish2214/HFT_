"use client";

import { useEffect, useRef } from "react";

const POPULAR = ["AAPL", "MSFT", "GOOGL", "TSLA", "AMZN", "NVDA", "META", "SPY"];

interface Props {
  symbol: string;
  price: number | null;
  change?: number;
  changePct?: number;
  onChange: (symbol: string) => void;
  loading?: boolean;
  dark?: boolean;
  isLive?: boolean;
  isRegularHours?: boolean;
}

export default function SymbolSelector({
  symbol, price, change, changePct, onChange, loading, dark,
  isLive = false, isRegularHours = false,
}: Props) {
  const prevPrice = useRef<number | null>(null);
  const flashRef = useRef<HTMLSpanElement>(null);
  const cls = dark ? "symbol-select-dark" : "";
  const ch = change ?? 0;
  const chCls = ch >= 0 ? "pnl-pos" : "pnl-neg";

  useEffect(() => {
    if (price == null || price <= 0) return;
    if (prevPrice.current != null && prevPrice.current !== price && flashRef.current) {
      const up = price >= prevPrice.current;
      flashRef.current.classList.remove("price-flash-up", "price-flash-down");
      void flashRef.current.offsetWidth;
      flashRef.current.classList.add(up ? "price-flash-up" : "price-flash-down");
    }
    prevPrice.current = price;
  }, [price]);

  return (
    <div className={`symbol-select ${cls}`}>
      {isRegularHours && <span className="symbol-live-dot" title="Regular session — live stream" />}
      <select
        value={POPULAR.includes(symbol) ? symbol : ""}
        onChange={(e) => e.target.value && onChange(e.target.value)}
        disabled={loading}
        className="symbol-select-dropdown"
      >
        {!POPULAR.includes(symbol) && <option value="" disabled>{symbol}</option>}
        {POPULAR.map((s) => <option key={s} value={s}>{s}</option>)}
      </select>
      <input
        type="text"
        defaultValue={symbol}
        key={symbol}
        placeholder="SYM"
        maxLength={6}
        disabled={loading}
        onKeyDown={(e) => {
          if (e.key === "Enter") {
            const val = (e.target as HTMLInputElement).value.toUpperCase().trim();
            if (val) onChange(val);
          }
        }}
        className="symbol-select-input mono"
      />
      {price != null && price > 0 && (
        <>
          <span ref={flashRef} className="symbol-select-price mono">${price.toFixed(2)}</span>
          {change !== undefined && (
            <span className={`symbol-select-change mono ${chCls}`}>
              {ch >= 0 ? "+" : ""}{ch.toFixed(2)} ({changePct?.toFixed(2)}%)
            </span>
          )}
          {isLive && isRegularHours && (
            <span className="symbol-live-label">LIVE</span>
          )}
        </>
      )}
      {loading && <span style={{ fontSize: 10, color: "var(--header-muted)" }}>…</span>}
    </div>
  );
}

export { POPULAR };
