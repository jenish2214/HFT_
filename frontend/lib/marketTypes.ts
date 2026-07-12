/** Shared market / terminal types */

export interface BookLevel {
  price: number;
  qty: number;
  orders: number;
}

export interface Book {
  bids: BookLevel[];
  asks: BookLevel[];
  mid: number;
  spread: number;
}

export interface Trade {
  id: number;
  price: number;
  qty: number;
  buy_order: number;
  sell_order: number;
  timestamp_ns: number;
  side?: string;
  strategy?: string;
}

export interface StrategyInfo {
  name: string;
  position: number;
  cash: number;
  orders_sent: number;
  fills: number;
  realized_pnl?: number;
  unrealized_pnl?: number;
  total_pnl?: number;
  exposure?: number;
  avg_entry?: number;
}

export interface UserInfo extends StrategyInfo {
  initial_equity?: number;
  equity?: number;
  buying_power?: number;
}

export interface Stats {
  avg_latency_ns: number;
  total_orders: number;
  total_trades: number;
}

export interface MarketSession {
  status: "open" | "pre" | "after" | "closed";
  label: string;
  session_detail?: string;
  day_name?: string;
  is_weekend?: boolean;
  is_live: boolean;
  is_regular_hours: boolean;
  exchange: string;
  timezone: string;
  local_time: string;
  countdown: string;
}

export interface TickInfo {
  symbol: string;
  price: number;
  bid: number;
  ask: number;
  volume: number;
  source?: string;
  change?: number;
  change_pct?: number;
  day_high?: number;
  day_low?: number;
  open?: number;
  prev_close?: number;
}
