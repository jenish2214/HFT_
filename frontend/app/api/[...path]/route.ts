import { NextRequest, NextResponse } from "next/server";
import {
  isAllowedApiPath,
  sanitizeSearchParams,
  validateSymbol,
} from "@/lib/security";

export const dynamic = "force-dynamic";

const MAX_BODY_BYTES = 16_384;

const SECURITY_HEADERS = {
  "X-Content-Type-Options": "nosniff",
  "X-Frame-Options": "DENY",
  "Referrer-Policy": "strict-origin-when-cross-origin",
};

/** Short TTL cache for research GETs — faster repeat loads on Render. */
const RESEARCH_CACHE_TTL_MS = 5 * 60 * 1000;
const researchCache = new Map<string, { body: string; status: number; contentType: string; ts: number }>();

const CACHEABLE_PREFIXES = ["research/quant", "research/profile", "company/report"];

function resolveBackend(): string {
  const raw = (process.env.API_URL || "http://127.0.0.1:8000").trim();
  if (raw.startsWith("http://") || raw.startsWith("https://")) {
    return raw.replace(/\/$/, "");
  }
  return `http://${raw.replace(/\/$/, "")}`;
}

function reject(message: string, status: number) {
  return NextResponse.json(
    { status: "error", message },
    { status, headers: { ...SECURITY_HEADERS, "Cache-Control": "no-store" } },
  );
}

function isCacheableGet(path: string) {
  return CACHEABLE_PREFIXES.some((p) => path === p || path.startsWith(`${p}/`));
}

function getCached(key: string) {
  const hit = researchCache.get(key);
  if (!hit) return null;
  if (Date.now() - hit.ts > RESEARCH_CACHE_TTL_MS) {
    researchCache.delete(key);
    return null;
  }
  return hit;
}

function setCached(key: string, body: string, status: number, contentType: string) {
  if (researchCache.size > 80) {
    const oldest = researchCache.keys().next().value;
    if (oldest) researchCache.delete(oldest);
  }
  researchCache.set(key, { body, status, contentType, ts: Date.now() });
}

async function fetchBackend(target: string, init: RequestInit, retries = 1): Promise<Response> {
  let lastErr: unknown;
  for (let attempt = 0; attempt <= retries; attempt++) {
    try {
      return await fetch(target, init);
    } catch (err) {
      lastErr = err;
      if (attempt < retries) {
        await new Promise((r) => setTimeout(r, 1200));
      }
    }
  }
  throw lastErr;
}

async function proxyRequest(req: NextRequest, pathSegments: string[]) {
  const path = pathSegments.join("/");

  if (!isAllowedApiPath(path)) {
    return reject("API path not allowed", 403);
  }

  const backend = resolveBackend();
  const safeParams = sanitizeSearchParams(req.nextUrl.searchParams);
  const query = safeParams.toString();
  const target = `${backend}/${path}${query ? `?${query}` : ""}`;
  const cacheKey = `${req.method}:${path}?${query}`;

  if (req.method === "GET" && isCacheableGet(path)) {
    const hit = getCached(cacheKey);
    if (hit) {
      return new NextResponse(hit.body, {
        status: hit.status,
        headers: {
          "Content-Type": hit.contentType,
          ...SECURITY_HEADERS,
          "Cache-Control": "private, max-age=60",
          "X-Research-Cache": "HIT",
        },
      });
    }
  }

  try {
    const init: RequestInit = {
      method: req.method,
      headers: { Accept: "application/json" },
      signal: AbortSignal.timeout(90_000),
      cache: "no-store",
    };

    if (req.method !== "GET" && req.method !== "HEAD") {
      const body = await req.text();
      if (body.length > MAX_BODY_BYTES) {
        return reject("Request body too large", 413);
      }
      if (body) {
        try {
          const parsed = JSON.parse(body) as Record<string, unknown>;
          if (path === "symbol" && typeof parsed.symbol === "string") {
            if (!validateSymbol(parsed.symbol)) {
              return reject("Invalid symbol", 400);
            }
          }
          if (path === "order") {
            const side = String(parsed.side || "").toUpperCase();
            if (side !== "BUY" && side !== "SELL") {
              return reject("Invalid order side", 400);
            }
          }
        } catch {
          return reject("Invalid JSON body", 400);
        }
      }
      init.headers = { ...init.headers, "Content-Type": "application/json" };
      init.body = body;
    }

    const res = await fetchBackend(target, init, 1);
    const contentType = res.headers.get("content-type") || "application/json";
    const resBody = await res.text();

    if (req.method === "GET" && isCacheableGet(path) && res.ok) {
      setCached(cacheKey, resBody, res.status, contentType);
    }

    return new NextResponse(resBody, {
      status: res.status,
      headers: {
        "Content-Type": contentType,
        ...SECURITY_HEADERS,
        "Cache-Control": isCacheableGet(path) ? "private, max-age=60" : "no-store",
        "X-Research-Cache": "MISS",
      },
    });
  } catch {
    return NextResponse.json(
      {
        status: "error",
        message: "Market API unavailable — backend not reachable.",
      },
      { status: 503, headers: { ...SECURITY_HEADERS, "Cache-Control": "no-store" } },
    );
  }
}

type RouteCtx = { params: { path: string[] } };

export async function GET(req: NextRequest, ctx: RouteCtx) {
  return proxyRequest(req, ctx.params.path);
}

export async function POST(req: NextRequest, ctx: RouteCtx) {
  return proxyRequest(req, ctx.params.path);
}

export async function PUT(req: NextRequest, ctx: RouteCtx) {
  return reject("Method not allowed", 405);
}

export async function DELETE(req: NextRequest, ctx: RouteCtx) {
  return reject("Method not allowed", 405);
}
