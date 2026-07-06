#!/usr/bin/env bash
# HFT Demo — start all services with auto-restart if any process dies.

ROOT="$(cd "$(dirname "$0")/.." && pwd)"
CHECK_INTERVAL=8

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

port_open() {
  lsof -ti tcp:"$1" >/dev/null 2>&1
}

api_healthy() {
  curl -sf --max-time 3 "http://127.0.0.1:8000/health" >/dev/null 2>&1
}

ui_healthy() {
  curl -sf --max-time 3 "http://127.0.0.1:3000" >/dev/null 2>&1
}

start_engine() {
  if [ ! -f "$ROOT/cpp/build/hft_engine" ]; then
    bash "$ROOT/scripts/build.sh"
  fi
  echo "==> Starting C++ matching engine (port 9001)..."
  "$ROOT/cpp/build/hft_engine" &
  ENGINE_PID=$!
  sleep 0.5
}

venv_ok() {
  [ -x ".venv/bin/python" ] && .venv/bin/python -c "import uvicorn" 2>/dev/null
}

start_api() {
  echo "==> Starting Python API server (port 8000)..."
  cd "$ROOT/python"
  if ! venv_ok; then
    echo "==> Recreating Python venv..."
    rm -rf .venv
    python3 -m venv .venv
    .venv/bin/pip install -q -r requirements.txt
  fi
  .venv/bin/uvicorn api_server:app --host 0.0.0.0 --port 8000 &
  API_PID=$!
  sleep 1
}

start_ui() {
  echo "==> Starting Next.js dashboard (port 3000)..."
  cd "$ROOT/frontend"
  if [ ! -d "node_modules" ]; then
    npm install --silent
  fi
  # Prevent stale webpack chunks (Cannot find module './819.js') after long dev sessions
  rm -rf .next
  npm run dev &
  UI_PID=$!
  sleep 2
}

restart_engine() {
  echo "[watchdog] C++ engine down — restarting..."
  kill "$ENGINE_PID" 2>/dev/null || true
  free_port 9001
  start_engine
}

restart_api() {
  echo "[watchdog] API unhealthy — restarting..."
  kill "$API_PID" 2>/dev/null || true
  free_port 8000
  start_api
}

restart_ui() {
  echo "[watchdog] Dashboard unhealthy — restarting (fresh .next cache)..."
  kill "$UI_PID" 2>/dev/null || true
  free_port 3000
  start_ui
}

watchdog() {
  while [ "$SHUTTING_DOWN" -eq 0 ]; do
    sleep "$CHECK_INTERVAL"

    if ! kill -0 "$ENGINE_PID" 2>/dev/null || ! port_open 9001; then
      restart_engine
    fi

    if ! kill -0 "$API_PID" 2>/dev/null || ! api_healthy; then
      restart_api
    fi

    if ! kill -0 "$UI_PID" 2>/dev/null || ! ui_healthy; then
      restart_ui
    fi
  done
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

free_port 9001
free_port 8000
free_port 3000

start_engine
start_api
start_ui

echo ""
echo "============================================"
echo "  HFT Demo is running (auto-restart ON)"
echo "  Dashboard:  http://localhost:3000"
echo "  API:        http://localhost:8000"
echo "  Engine:     localhost:9001 (C++)"
echo "============================================"
echo "Press Ctrl+C to stop all services."
echo ""

watchdog
