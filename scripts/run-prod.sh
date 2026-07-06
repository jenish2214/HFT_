#!/usr/bin/env bash
# HFT Demo — production run (no hot-reload, optimized builds)
set -e

ROOT="$(cd "$(dirname "$0")/.." && pwd)"

ENGINE_PID=""
API_PID=""
UI_PID=""
SHUTTING_DOWN=0

free_port() {
  local port=$1
  local pids
  pids=$(lsof -ti tcp:"$port" 2>/dev/null || true)
  if [ -n "$pids" ]; then
    echo "==> Freeing port $port..."
    kill $pids 2>/dev/null || true
    sleep 0.5
  fi
}

ensure_built() {
  if [ ! -f "$ROOT/cpp/build/hft_engine" ]; then
    echo "==> C++ engine not built — running build-prod.sh..."
    bash "$ROOT/scripts/build-prod.sh"
    return
  fi
  if [ ! -d "$ROOT/frontend/.next" ] || [ ! -f "$ROOT/frontend/.next/BUILD_ID" ]; then
    echo "==> Next.js not built — running build-prod.sh..."
    bash "$ROOT/scripts/build-prod.sh"
    return
  fi
  if [ ! -d "$ROOT/python/.venv" ] || ! "$ROOT/python/.venv/bin/python" -c "import uvicorn" 2>/dev/null; then
    echo "==> Python venv missing — running build-prod.sh..."
    bash "$ROOT/scripts/build-prod.sh"
  fi
}

start_engine() {
  echo "==> Starting C++ matching engine (port 9001)..."
  "$ROOT/cpp/build/hft_engine" &
  ENGINE_PID=$!
  sleep 0.5
}

start_api() {
  echo "==> Starting Python API server (port 8000, production)..."
  cd "$ROOT/python"
  # Single worker — WebSocket + in-memory state must stay on one process
  .venv/bin/uvicorn api_server:app --host 0.0.0.0 --port 8000 --workers 1 &
  API_PID=$!
  sleep 1
}

start_ui() {
  echo "==> Starting Next.js dashboard (port 3000, production)..."
  cd "$ROOT/frontend"
  npm run start &
  UI_PID=$!
  sleep 2
}

cleanup() {
  SHUTTING_DOWN=1
  echo ""
  echo "Shutting down..."
  kill "$ENGINE_PID" "$API_PID" "$UI_PID" 2>/dev/null || true
  free_port 9001
  free_port 8000
  free_port 3000
}
trap cleanup EXIT INT TERM

ensure_built

free_port 9001
free_port 8000
free_port 3000

start_engine
start_api
start_ui

echo ""
echo "============================================"
echo "  HFT Demo — PRODUCTION mode"
echo "  Dashboard:  http://localhost:3000"
echo "  API:        http://localhost:8000"
echo "  Engine:     localhost:9001 (C++)"
echo "============================================"
echo "Press Ctrl+C to stop all services."
echo ""

wait
