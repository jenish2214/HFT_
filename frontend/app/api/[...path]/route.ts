import { NextRequest, NextResponse } from "next/server";
import {
  ALLOWED_API_PATHS,
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
  "Cache-Control": "no-store",
};

function resolveBackend(): string {
  const raw = (process.env.API_URL || "http://127.0.0.1:8000").trim();
  if (raw.startsWith("http://") || raw.startsWith("https://")) {
    return raw.replace(/\/$/, "");
  }
  return `http://${raw.replace(/\/$/, "")}`;
}

const BACKEND = resolveBackend();

function reject(message: string, status: number) {
  return NextResponse.json({ status: "error", message }, { status, headers: SECURITY_HEADERS });
}

async function proxyRequest(req: NextRequest, pathSegments: string[]) {
  const path = pathSegments.join("/");

  if (!isAllowedApiPath(path)) {
    return reject("API path not allowed", 403);
  }

  const safeParams = sanitizeSearchParams(req.nextUrl.searchParams);
  const query = safeParams.toString();
  const target = `${BACKEND}/${path}${query ? `?${query}` : ""}`;

  try {
    const init: RequestInit = {
      method: req.method,
      headers: { Accept: "application/json" },
      signal: AbortSignal.timeout(120_000),
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

    const res = await fetch(target, init);
    const contentType = res.headers.get("content-type") || "application/json";
    const resBody = await res.text();

    return new NextResponse(resBody, {
      status: res.status,
      headers: { "Content-Type": contentType, ...SECURITY_HEADERS },
    });
  } catch {
    return NextResponse.json(
      {
        status: "error",
        message: "Market API unavailable — backend not reachable.",
      },
      { status: 503, headers: SECURITY_HEADERS },
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
