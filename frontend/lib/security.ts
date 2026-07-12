/** Orion Alpha — client-side security helpers & allowlists */

export const SYMBOL_REGEX = /^[A-Z0-9^=.-]{2,14}$/;

export const VALID_TIMEFRAMES = new Set(["1D", "1W", "1M", "3M", "1Y", "ALL"]);

/** Paths the Next.js /api proxy may forward to the backend */
export const ALLOWED_API_PATHS = new Set([
  "health",
  "security/status",
  "symbol",
  "quote",
  "state",
  "chart",
  "chart/timeframe",
  "company/report",
  "companies/reports",
  "markets/overview",
  "markets/banker",
  "research/profile",
  "research/quant",
  "demo/events",
  "book",
  "stats",
  "order",
  "order/cancel",
]);

export const SECURITY_FEATURES = [
  { id: "headers", title: "Security headers", desc: "X-Frame-Options, nosniff, referrer policy on every response." },
  { id: "proxy", title: "API proxy isolation", desc: "Browser never calls the backend directly — only allowlisted /api routes." },
  { id: "symbols", title: "Symbol validation", desc: "All ticker inputs validated against a strict pattern before API calls." },
  { id: "rate", title: "Rate limiting", desc: "Backend throttles excessive requests per client IP." },
  { id: "cors", title: "CORS restriction", desc: "Cross-origin access limited to configured dashboard origins." },
  { id: "orders", title: "Order bounds", desc: "Quantity and price limits on demo order submissions." },
  { id: "body", title: "Payload limits", desc: "Maximum request body size enforced on the API proxy." },
  { id: "ws", title: "WebSocket validation", desc: "Symbol and timeframe changes validated on live streams." },
];

export function validateSymbol(symbol: string): string | null {
  const sym = (symbol || "").toUpperCase().trim();
  if (!SYMBOL_REGEX.test(sym)) return null;
  return sym;
}

export function isAllowedApiPath(path: string): boolean {
  const normalized = path.replace(/^\/+|\/+$/g, "");
  return ALLOWED_API_PATHS.has(normalized);
}

export function sanitizeSearchParams(params: URLSearchParams): URLSearchParams {
  const out = new URLSearchParams();
  for (const [key, value] of params.entries()) {
    if (key === "symbol") {
      const sym = validateSymbol(value);
      if (sym) out.set(key, sym);
    } else if (key === "timeframe" || key === "tf") {
      const tf = value.toUpperCase().trim();
      if (VALID_TIMEFRAMES.has(tf)) out.set(key, tf);
    } else if (/^[a-z_]{1,32}$/i.test(key) && value.length <= 128) {
      out.set(key, value);
    }
  }
  return out;
}
