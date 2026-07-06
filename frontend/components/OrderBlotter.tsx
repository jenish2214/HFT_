"use client";

import { useState } from "react";

export interface UserOrder {
  id: number;
  side: string;
  type: string;
  price: number;
  qty: number;
  filled: number;
  status: string;
  created_at: number;
  updated_at: number;
}

interface Props {
  pending: UserOrder[];
  history: UserOrder[];
  onCancel: (id: number) => void;
}

export default function OrderBlotter({ pending, history, onCancel }: Props) {
  const [tab, setTab] = useState<"working" | "history">("working");
  const rows = tab === "working" ? pending : history;

  return (
    <div className="panel bb-panel order-blotter">
      <div className="panel-head">
        <span className="panel-title">Order Blotter</span>
        <div className="ob-tabs">
          <button type="button" className={`ob-tab ${tab === "working" ? "ob-tab-on" : ""}`} onClick={() => setTab("working")}>
            Working ({pending.length})
          </button>
          <button type="button" className={`ob-tab ${tab === "history" ? "ob-tab-on" : ""}`} onClick={() => setTab("history")}>
            History
          </button>
        </div>
      </div>
      <div className="panel-body blotter-body">
        <table>
          <thead>
            <tr>
              <th style={{ textAlign: "left" }}>Time</th>
              <th>Side</th>
              <th>Type</th>
              <th>Px</th>
              <th>Qty</th>
              <th>Sts</th>
              <th />
            </tr>
          </thead>
          <tbody>
            {rows.length === 0 && (
              <tr><td colSpan={7} style={{ textAlign: "center", color: "var(--text-muted)", padding: 14 }}>No orders</td></tr>
            )}
            {rows.map((o) => (
              <tr key={`${o.id}-${o.updated_at}`}>
                <td style={{ textAlign: "left", fontSize: 10, color: "var(--text-muted)" }}>
                  {new Date(o.created_at * 1000).toLocaleTimeString()}
                </td>
                <td className={o.side === "BUY" ? "bid" : "ask"}>{o.side}</td>
                <td>{o.type}</td>
                <td>{o.type === "MARKET" ? "MKT" : o.price.toFixed(2)}</td>
                <td>{o.filled ? `${o.filled}/${o.qty}` : o.qty}</td>
                <td className={o.status === "FILLED" ? "pnl-pos" : o.status === "PENDING" ? "bb-warn" : ""}>{o.status}</td>
                <td>
                  {tab === "working" && (o.status === "PENDING" || o.status === "PARTIAL") && (
                    <button type="button" className="ob-cancel" onClick={() => onCancel(o.id)}>X</button>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
