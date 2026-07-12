"use client";

import { useEffect, useState } from "react";
import type { Trade } from "@/lib/marketTypes";

interface Props {
  trades: Trade[];
  isLive?: boolean;
  marketClosed?: boolean;
}

const STORAGE_KEY = "oa-tape-expanded";

export default function TradeTape({ trades, isLive = false, marketClosed = false }: Props) {
  const [expanded, setExpanded] = useState(true);

  useEffect(() => {
    try {
      const v = localStorage.getItem(STORAGE_KEY);
      if (v === "0") setExpanded(false);
    } catch {
      /* ignore */
    }
  }, []);

  const toggle = () => {
    setExpanded((prev) => {
      const next = !prev;
      try {
        localStorage.setItem(STORAGE_KEY, next ? "1" : "0");
      } catch {
        /* ignore */
      }
      return next;
    });
  };

  const visible = expanded ? trades.slice(0, 12) : trades.slice(0, 3);

  return (
    <div className={`panel tape-panel${expanded ? "" : " tape-panel-collapsed"}`}>
      <div className="panel-head tape-head">
        <button type="button" className="tape-toggle" onClick={toggle} aria-expanded={expanded}>
          <span className="panel-title">T&S — Time &amp; Sales</span>
          <span className="tape-toggle-icon mono">{expanded ? "▼" : "▶"}</span>
        </button>
        <div className="tape-head-right">
          {marketClosed && !isLive && (
            <span className="tape-closed-tag mono">CLOSED</span>
          )}
          {isLive && <span className="md-live-badge">LIVE</span>}
          <span className="tape-count mono">{trades.length}</span>
        </div>
      </div>
      <div className={`panel-body tape-body${expanded ? "" : " tape-body-mini"}`}>
        <table className="tape-table">
          <thead>
            <tr>
              <th>Time</th>
              <th>Side</th>
              <th>Price</th>
              <th>Qty</th>
            </tr>
          </thead>
          <tbody>
            {visible.length === 0 && (
              <tr>
                <td colSpan={4} className="tape-empty mono">
                  {marketClosed ? "No trades — market closed" : "No trades yet"}
                </td>
              </tr>
            )}
            {visible.map((t, i) => (
              <tr key={`${t.id}-${t.timestamp_ns}`} className={i === 0 && isLive ? "tape-row-new" : ""}>
                <td className="tape-time mono">
                  {new Date(t.timestamp_ns / 1e6).toLocaleTimeString()}
                </td>
                <td className={t.side === "BUY" ? "bid" : "ask"}>{t.side || "—"}</td>
                <td className="mono">${t.price.toFixed(2)}</td>
                <td className="mono">{t.qty}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
