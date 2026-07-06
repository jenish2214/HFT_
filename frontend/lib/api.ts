/** Resolve backend base URL for browser and server. */
export function getApiBase(): string {
  const explicit = process.env.NEXT_PUBLIC_API_URL?.trim();
  if (explicit) {
    return explicit.startsWith("http") ? stripTrailingSlash(explicit) : `https://${explicit}`;
  }

  if (typeof window !== "undefined") {
    const { hostname } = window.location;
    if (hostname !== "localhost" && hostname !== "127.0.0.1") {
      return "/api";
    }
  }

  if (process.env.NODE_ENV === "production") {
    const serverUrl = process.env.API_URL?.trim();
    if (serverUrl) {
      return stripTrailingSlash(serverUrl);
    }
    return "/api";
  }

  return "http://localhost:8000";
}

export function getWsUrl(): string {
  const explicit = process.env.NEXT_PUBLIC_WS_URL?.trim();
  if (explicit) return explicit;

  const base = process.env.NEXT_PUBLIC_API_URL?.trim();
  if (base) {
    const normalized = base.startsWith("http") ? base : `https://${base}`;
    return `${normalized.replace(/^http/, "ws").replace(/\/$/, "")}/ws`;
  }

  if (typeof window !== "undefined") {
    const { hostname, protocol } = window.location;
    if (hostname !== "localhost" && hostname !== "127.0.0.1") {
      const wsProto = protocol === "https:" ? "wss:" : "ws:";
      return `${wsProto}//${hostname}/api/ws`;
    }
  }

  return "ws://localhost:8000/ws";
}

export function useWebSocket(): boolean {
  return process.env.NEXT_PUBLIC_USE_WS === "1";
}

function stripTrailingSlash(url: string): string {
  return url.replace(/\/$/, "");
}
