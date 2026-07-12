/** Resolve backend base URL for browser and server. */
export function getApiBase(): string {
  // Browser always uses same-origin /api proxy (works in dev and production).
  if (typeof window !== "undefined") {
    return "/api";
  }

  const serverUrl = process.env.API_URL?.trim();
  if (serverUrl) {
    return normalizeUrl(serverUrl);
  }

  if (process.env.NODE_ENV === "production") {
    return "/api";
  }

  return normalizeUrl(process.env.API_URL?.trim() || "http://127.0.0.1:8000");
}

export function getWsUrl(): string {
  const explicit = process.env.NEXT_PUBLIC_WS_URL?.trim();
  if (explicit) {
    if (explicit.startsWith("ws://") || explicit.startsWith("wss://")) {
      return explicit.endsWith("/ws") ? explicit : `${explicit.replace(/\/$/, "")}/ws`;
    }
    const base = explicit.startsWith("http") ? explicit : `https://${explicit}`;
    return `${base.replace(/^http/, "ws").replace(/\/$/, "")}/ws`;
  }

  if (typeof window !== "undefined") {
    const { hostname, protocol } = window.location;
    if (hostname !== "localhost" && hostname !== "127.0.0.1") {
      const wsProto = protocol === "https:" ? "wss:" : "ws:";
      return `${wsProto}//${hostname}/api/ws`;
    }
  }

  return "ws://127.0.0.1:8000/ws";
}

export function useWebSocket(): boolean {
  return process.env.NEXT_PUBLIC_USE_WS === "1";
}

function stripTrailingSlash(url: string): string {
  return url.replace(/\/$/, "");
}

function normalizeUrl(url: string): string {
  const trimmed = stripTrailingSlash(url.trim());
  if (trimmed.startsWith("http://") || trimmed.startsWith("https://")) {
    return trimmed;
  }
  return `http://${trimmed}`;
}
