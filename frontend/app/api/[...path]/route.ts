import { NextRequest, NextResponse } from "next/server";

export const dynamic = "force-dynamic";

function resolveBackend(): string {
  const raw = (process.env.API_URL || "http://127.0.0.1:8000").trim();
  if (raw.startsWith("http://") || raw.startsWith("https://")) {
    return raw.replace(/\/$/, "");
  }
  return `http://${raw.replace(/\/$/, "")}`;
}

const BACKEND = resolveBackend();

async function proxyRequest(req: NextRequest, pathSegments: string[]) {
  const path = pathSegments.join("/");
  const target = `${BACKEND}/${path}${req.nextUrl.search}`;

  try {
    const init: RequestInit = {
      method: req.method,
      headers: { Accept: "application/json" },
      signal: AbortSignal.timeout(120_000),
      cache: "no-store",
    };

    if (req.method !== "GET" && req.method !== "HEAD") {
      const body = await req.text();
      init.headers = { ...init.headers, "Content-Type": "application/json" };
      init.body = body;
    }

    const res = await fetch(target, init);
    const contentType = res.headers.get("content-type") || "application/json";
    const body = await res.text();

    return new NextResponse(body, {
      status: res.status,
      headers: { "Content-Type": contentType },
    });
  } catch {
    return NextResponse.json(
      {
        status: "error",
        message: "Market API unavailable — backend not reachable. Check orion-alpha-api on Render.",
      },
      { status: 503 },
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
  return proxyRequest(req, ctx.params.path);
}

export async function DELETE(req: NextRequest, ctx: RouteCtx) {
  return proxyRequest(req, ctx.params.path);
}
