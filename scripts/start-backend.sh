#!/usr/bin/env bash
# Start C++ engine + FastAPI (used by Docker / Render)
set -e

ROOT="$(cd "$(dirname "$0")/.." && pwd)"
PORT="${PORT:-8000}"

echo "==> Starting C++ matching engine (port ${HFT_ENGINE_PORT:-9001})..."
"$ROOT/cpp/build/hft_engine" &
ENGINE_PID=$!

cleanup() {
  kill "$ENGINE_PID" 2>/dev/null || true
}
trap cleanup EXIT INT TERM

sleep 0.5

echo "==> Starting Python API (port $PORT)..."
cd "$ROOT/python"
exec python -m uvicorn api_server:app --host 0.0.0.0 --port "$PORT"
