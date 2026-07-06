"use client";

import { useState } from "react";

interface Props {
  mid: number;
  connected: boolean;
  onSubmit: (order: { side: string; type: string; price: number; qty: number }) => void;
}

export default function OrderForm({ mid, connected, onSubmit }: Props) {
  const [side, setSide] = useState<"BUY" | "SELL">("BUY");
  const [type, setType] = useState<"LIMIT" | "MARKET">("LIMIT");
  const [price, setPrice] = useState("");
  const [qty, setQty] = useState("100");

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSubmit({
      side, type,
      price: type === "LIMIT" ? parseFloat(price) || mid : 0,
      qty: parseInt(qty) || 100,
    });
  };

  return (
    <div className="panel">
      <div className="panel-head"><span className="panel-title">Order Entry</span></div>
      <div className="panel-body">
        <form onSubmit={handleSubmit} className="order-form-grid">
          <div className="order-side-row">
            <button type="button" className={`btn btn-buy ${side === "BUY" ? "order-side-active-buy" : ""}`} onClick={() => setSide("BUY")}>BUY</button>
            <button type="button" className={`btn btn-sell ${side === "SELL" ? "order-side-active-sell" : ""}`} onClick={() => setSide("SELL")}>SELL</button>
          </div>
          <select value={type} onChange={(e) => setType(e.target.value as "LIMIT" | "MARKET")}>
            <option value="LIMIT">LIMIT</option>
            <option value="MARKET">MARKET</option>
          </select>
          {type === "LIMIT" && (
            <input type="number" step="0.01" placeholder={`Limit @ ${mid > 0 ? mid.toFixed(2) : "—"}`} value={price} onChange={(e) => setPrice(e.target.value)} />
          )}
          <input type="number" placeholder="Quantity" value={qty} onChange={(e) => setQty(e.target.value)} />
          <button type="submit" className="btn" disabled={!connected} style={{ borderColor: "var(--blue)", color: "var(--blue)" }}>
            SEND ORDER
          </button>
        </form>
      </div>
    </div>
  );
}
