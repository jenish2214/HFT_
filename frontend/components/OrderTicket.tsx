"use client";

import { useEffect, useState } from "react";
import type { UserInfo } from "@/app/page";

export interface OrderResult {
  ok: boolean;
  message: string;
}

interface Props {
  symbol: string;
  mid: number;
  bid: number;
  ask: number;
  connected: boolean;
  canTrade: boolean;
  user: UserInfo;
  onSubmit: (order: {
    side: string;
    type: string;
    price: number;
    qty: number;
  }) => Promise<OrderResult> | void;
}

const QTY_PRESETS = [100, 500, 1000];

export default function OrderTicket({
  symbol,
  mid,
  bid,
  ask,
  connected,
  canTrade,
  user,
  onSubmit,
}: Props) {
  const [side, setSide] = useState<"BUY" | "SELL">("BUY");
  const [type, setType] = useState<"MARKET" | "LIMIT">("MARKET");
  const [price, setPrice] = useState("");
  const [qty, setQty] = useState("100");
  const [status, setStatus] = useState<OrderResult | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const isBuy = side === "BUY";
  const orderQty = parseInt(qty, 10) || 0;
  const position = user.position;
  const hasPosition = position !== 0;
  const ready = connected && canTrade && !submitting;

  const fillPrice = isBuy ? ask : bid;
  const fillLabel = isBuy ? "Ask" : "Bid";

  useEffect(() => {
    if (type === "LIMIT" && fillPrice > 0) {
      setPrice(fillPrice.toFixed(2));
    }
  }, [side, type, fillPrice]);

  const submit = async (override?: { side: "BUY" | "SELL"; qty: number; type: "MARKET" | "LIMIT" }) => {
    if (!ready && !override) {
      setStatus({ ok: false, message: !connected ? "Not connected" : "Waiting for quotes" });
      return;
    }

    const tradeSide = override?.side ?? side;
    const tradeType = override?.type ?? type;
    const tradeQty = override?.qty ?? orderQty;

    if (tradeQty <= 0) {
      setStatus({ ok: false, message: "Enter quantity" });
      return;
    }

    let orderPrice = 0;
    if (tradeType === "LIMIT") {
      orderPrice = parseFloat(price) || 0;
      if (orderPrice <= 0) {
        setStatus({ ok: false, message: "Enter limit price" });
        return;
      }
    }

    setSubmitting(true);
    setStatus(null);

    try {
      const result = await onSubmit({
        side: tradeSide,
        type: tradeType,
        price: orderPrice,
        qty: tradeQty,
      });
      setStatus(result ?? { ok: true, message: "Order sent" });
    } catch {
      setStatus({ ok: false, message: "Order failed" });
    } finally {
      setSubmitting(false);
    }
  };

  const exitPosition = () => {
    if (!hasPosition || !ready) return;
    void submit({
      side: position > 0 ? "SELL" : "BUY",
      qty: Math.abs(position),
      type: "MARKET",
    });
  };

  const submitLabel = (() => {
    if (submitting) return "Sending…";
    const action = isBuy ? "Buy" : "Sell";
    if (type === "MARKET") {
      const px = fillPrice > 0 ? ` @ ${fillLabel} $${fillPrice.toFixed(2)}` : " @ MKT";
      return `${action} ${orderQty}${px}`;
    }
    const px = price || (fillPrice > 0 ? fillPrice.toFixed(2) : "—");
    return `${action} ${orderQty} Limit $${px}`;
  })();

  return (
    <div className="panel order-ticket">
      <div className="ot-header">
        <span className="ot-title">{symbol}</span>
        <span className={`ot-conn ot-conn-${ready ? "online" : "offline"}`}>
          {ready ? "Ready" : connected ? "Quotes" : "Offline"}
        </span>
      </div>

      <div className="ot-side-tabs">
        <button
          type="button"
          className={`ot-side-tab ${isBuy ? "ot-buy-active" : ""}`}
          onClick={() => setSide("BUY")}
        >
          Buy
        </button>
        <button
          type="button"
          className={`ot-side-tab ${!isBuy ? "ot-sell-active" : ""}`}
          onClick={() => setSide("SELL")}
        >
          Sell
        </button>
      </div>

      <div className="ot-body">
        <div className="ot-row">
          <button
            type="button"
            className={`ot-pill ${type === "MARKET" ? "ot-pill-active" : ""}`}
            onClick={() => setType("MARKET")}
          >
            Market
          </button>
          <button
            type="button"
            className={`ot-pill ${type === "LIMIT" ? "ot-pill-active" : ""}`}
            onClick={() => setType("LIMIT")}
          >
            Limit
          </button>
        </div>

        <div className={`ot-fill-price mono ${isBuy ? "ot-fill-ask" : "ot-fill-bid"}`}>
          <span className="ot-fill-label">
            {type === "MARKET" ? `Market fills at ${fillLabel}` : `Limit ${fillLabel}`}
          </span>
          <span className="ot-fill-value">
            ${fillPrice > 0 ? fillPrice.toFixed(2) : "—"}
          </span>
        </div>

        {type === "LIMIT" && (
          <div className="ot-field">
            <label className="ot-label">Limit price</label>
            <input
              type="number"
              step="0.01"
              className="ot-input mono"
              value={price}
              onChange={(e) => setPrice(e.target.value)}
              disabled={submitting}
            />
          </div>
        )}

        <div className="ot-field">
          <label className="ot-label">Quantity</label>
          <input
            type="number"
            className="ot-input mono"
            value={qty}
            onChange={(e) => setQty(e.target.value)}
            min={1}
            disabled={submitting}
          />
          <div className="ot-quick-row">
            {QTY_PRESETS.map((q) => (
              <button key={q} type="button" className="ot-chip" onClick={() => setQty(String(q))}>
                {q}
              </button>
            ))}
          </div>
        </div>

        <div className="ot-position-line mono">
          <span>Pos {position > 0 ? "+" : ""}{position}</span>
          <span className={(user.total_pnl ?? 0) >= 0 ? "pnl-pos" : "pnl-neg"}>
            P&L {(user.total_pnl ?? 0) >= 0 ? "+" : ""}${Math.abs(user.total_pnl ?? 0).toFixed(2)}
          </span>
        </div>

        <button
          type="button"
          className={`ot-submit ${isBuy ? "ot-submit-buy" : "ot-submit-sell"}`}
          disabled={!ready}
          onClick={() => submit()}
        >
          {submitLabel}
        </button>

        {hasPosition && (
          <button type="button" className="ot-exit" disabled={!ready} onClick={exitPosition}>
            Exit {Math.abs(position)} @ Market
          </button>
        )}

        {status && (
          <div className={`ot-status ${status.ok ? "ot-status-ok" : "ot-status-err"}`}>
            {status.message}
          </div>
        )}
      </div>
    </div>
  );
}
