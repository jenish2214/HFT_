"use client";

import { useEffect, useRef, useState, useCallback } from "react";
import { getApiBase, getWsUrl, useWebSocket } from "@/lib/api";

function apiBase() {
  return getApiBase();
}

/** WebSocket off by default — wallet extensions (MetaMask) hook WS and spam console warnings. */
const USE_WS = useWebSocket();

function pollIntervalMs(regular: boolean, live: boolean): number {
  let base = 2000;
  if (regular) base = 400;
  else if (live) base = 800;
  if (pollFailures >= 3) return Math.min(15000, base * 2 ** Math.min(pollFailures - 2, 4));
  return base;
}

let pollTimer: ReturnType<typeof setInterval> | null = null;
let pollRescheduler: ReturnType<typeof setInterval> | null = null;
let ws: WebSocket | null = null;
let wsReconnectTimer: ReturnType<typeof setTimeout> | null = null;
let subscribers = 0;
let pollOnly = !USE_WS;

const messageHandlers = new Set<(data: Record<string, unknown>) => void>();
const marketRegularRef = { current: false };
const marketLiveRef = { current: false };
const streamHealthyRef = { current: false };
let pollFailures = 0;

function notifyHandlers(data: Record<string, unknown>) {
  const m = data.market as { is_regular_hours?: boolean; is_live?: boolean } | undefined;
  if (m) {
    marketRegularRef.current = !!m.is_regular_hours;
    marketLiveRef.current = !!m.is_live;
  }
  if (data.is_streaming_live !== undefined) {
    marketLiveRef.current = !!data.is_streaming_live;
  }
  streamHealthyRef.current = true;
  messageHandlers.forEach((fn) => fn(data));
}

async function fetchState(): Promise<boolean> {
  try {
    const res = await fetch(`${apiBase()}/state`, {
      cache: "no-store",
      signal: AbortSignal.timeout(25_000),
    });
    if (!res.ok) {
      pollFailures += 1;
      if (pollTimer) schedulePolling();
      return false;
    }
    pollFailures = 0;
    notifyHandlers(await res.json());
    return true;
  } catch {
    pollFailures += 1;
    if (pollTimer) schedulePolling();
    return false;
  }
}

function stopPolling() {
  if (pollTimer) {
    clearInterval(pollTimer);
    pollTimer = null;
  }
}

function schedulePolling() {
  stopPolling();
  pollTimer = setInterval(() => {
    void fetchState();
  }, pollIntervalMs(marketRegularRef.current, marketLiveRef.current));
}

function startPolling() {
  if (pollTimer) return;
  void fetchState();
  schedulePolling();
}

function closeWs() {
  if (wsReconnectTimer) {
    clearTimeout(wsReconnectTimer);
    wsReconnectTimer = null;
  }
  if (!ws) return;
  const socket = ws;
  ws = null;
  socket.onopen = null;
  socket.onmessage = null;
  socket.onerror = null;
  socket.onclose = null;
  if (socket.readyState === WebSocket.OPEN || socket.readyState === WebSocket.CONNECTING) {
    socket.close();
  }
}

function connectWs(onMode: (mode: "ws" | "poll", ok: boolean) => void) {
  if (pollOnly || ws?.readyState === WebSocket.OPEN || ws?.readyState === WebSocket.CONNECTING) {
    return;
  }
  closeWs();

  const socket = new WebSocket(getWsUrl());
  ws = socket;

  socket.onopen = () => {
    if (ws !== socket) return;
    onMode("ws", true);
    stopPolling();
  };

  socket.onmessage = (evt) => {
    if (ws !== socket) return;
    try {
      const data = JSON.parse(evt.data);
      if (data.type === "ping" || data.type === "pong") return;
      notifyHandlers(data);
    } catch {
      // ignore
    }
  };

  socket.onerror = () => {
    if (ws !== socket) return;
    pollOnly = true;
    onMode("poll", false);
    startPolling();
  };

  socket.onclose = () => {
    if (ws !== socket) return;
    ws = null;
    onMode("poll", false);
    startPolling();
    if (!pollOnly && subscribers > 0) {
      wsReconnectTimer = setTimeout(() => connectWs(onMode), 5000);
    }
  };
}

function startStream(onMode: (mode: "ws" | "poll", ok: boolean) => void) {
  if (pollOnly) {
    startPolling();
    void fetchState().then((ok) => onMode("poll", ok));
    return;
  }

  startPolling();
  connectWs(onMode);

  if (!pollRescheduler) {
    pollRescheduler = setInterval(() => {
      if (pollTimer) schedulePolling();
    }, 30000);
  }
}

function stopStream() {
  if (subscribers > 0) return;
  stopPolling();
  closeWs();
  if (pollRescheduler) {
    clearInterval(pollRescheduler);
    pollRescheduler = null;
  }
}

export function useMarketStream<T extends Record<string, unknown>>(
  onMessage: (data: T) => void,
) {
  const onMessageRef = useRef(onMessage);
  const [connected, setConnected] = useState(false);
  const [mode, setMode] = useState<"ws" | "poll">(pollOnly ? "poll" : "ws");

  onMessageRef.current = onMessage;

  const applyMode = useCallback((nextMode: "ws" | "poll", ok: boolean) => {
    setMode(nextMode);
    setConnected(ok || streamHealthyRef.current || nextMode === "poll");
  }, []);

  useEffect(() => {
    const handler = (data: Record<string, unknown>) => {
      onMessageRef.current(data as T);
    };

    messageHandlers.add(handler);
    subscribers += 1;
    startStream(applyMode);

    return () => {
      messageHandlers.delete(handler);
      subscribers -= 1;
      stopStream();
    };
  }, [applyMode]);

  const send = useCallback((payload: Record<string, unknown>) => {
    const action = payload.action as string | undefined;

    if (action === "symbol") {
      const sym = String(payload.symbol || "").toUpperCase();
      if (!pollOnly && ws?.readyState === WebSocket.OPEN) {
        ws.send(JSON.stringify(payload));
        return;
      }
      fetch(`${apiBase()}/symbol`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ symbol: sym }),
      })
        .then((r) => r.json())
        .then((data) => { if (data.status === "ok") void fetchState(); })
        .catch(() => {});
      return;
    }

    if (action === "timeframe") {
      if (!pollOnly && ws?.readyState === WebSocket.OPEN) {
        ws.send(JSON.stringify(payload));
        return;
      }
      fetch(`${apiBase()}/chart/timeframe`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ timeframe: payload.timeframe }),
      })
        .then((r) => r.json())
        .then((data) => { if (data.status === "ok") void fetchState(); })
        .catch(() => {});
      return;
    }

    const order = {
      side: payload.side,
      type: payload.type,
      price: payload.price,
      qty: payload.qty,
    };

    if (!pollOnly && ws?.readyState === WebSocket.OPEN) {
      ws.send(JSON.stringify({ action: "order", ...order }));
      return;
    }

    fetch(`${apiBase()}/order`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(order),
    }).catch(() => {});
  }, []);

  return { connected, send, mode };
}
