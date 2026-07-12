#!/usr/bin/env bash
# Orion Alpha — start all services with auto-restart if any process dies.

ROOT="$(cd "$(dirname "$0")/.." && pwd)"
CHECK_INTERVAL=30
STARTUP_GRACE=120

ENGINE_PID=""
API_PID=""
UI_PID=""
SHUTTING_DOWN=0

ENGINE_STARTED=0
API_STARTED=0
UI_STARTED=0
API_FAIL_STREAK=0
UI_FAIL_STREAK=0

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

within_grace() {
  local started=$1
  [ "$started" -gt 0 ] && [ $(( $(date +%s) - started )) -lt "$STARTUP_GRACE" ]
}

api_healthy() {
  if curl -sf --max-time 10 "http://127.0.0.1:8000/health" >/dev/null 2>&1; then
    API_FAIL_STREAK=0
    return 0
  fi
  API_FAIL_STREAK=$((API_FAIL_STREAK + 1))
  [ "$API_FAIL_STREAK" -lt 3 ]
}

# UI health: process alive + homepage responds (not /api — avoids false restarts when API is slow).
ui_healthy() {
  if ! kill -0 "$UI_PID" 2>/dev/null || ! port_open 3000; then
    UI_FAIL_STREAK=$((UI_FAIL_STREAK + 1))
    return 1
  fi
  if within_grace "$UI_STARTED"; then
    UI_FAIL_STREAK=0
    return 0
  fi
  local code
  code=$(curl -s --max-time 15 -o /dev/null -w "%{http_code}" "http://127.0.0.1:3000/" 2>/dev/null || echo "000")
  if [ "$code" = "200" ] || [ "$code" = "304" ]; then
    UI_FAIL_STREAK=0
    return 0
  fi
  UI_FAIL_STREAK=$((UI_FAIL_STREAK + 1))
  [ "$UI_FAIL_STREAK" -lt 3 ]
}

start_engine() {
  if [ ! -f "$ROOT/cpp/build/hft_engine" ]; then
    bash "$ROOT/scripts/build.sh"
  fi
  echo "==> Starting C++ matching engine (port 9001)..."
  "$ROOT/cpp/build/hft_engine" &
  ENGINE_PID=$!
  ENGINE_STARTED=$(date +%s)
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
  API_STARTED=$(date +%s)
  API_FAIL_STREAK=0
  sleep 2
}

start_ui() {
  local fresh_cache=${1:-0}
  echo "==> Starting Next.js dashboard (port 3000)..."
  cd "$ROOT/frontend"
  if [ ! -d "node_modules" ]; then
    npm install --silent
  fi
  if [ "$fresh_cache" -eq 1 ]; then
    echo "==> Clearing .next cache..."
    rm -rf .next
  fi
  npm run dev &
  UI_PID=$!
  UI_STARTED=$(date +%s)
  UI_FAIL_STREAK=0
  sleep 4
}

restart_engine() {
  if within_grace "$ENGINE_STARTED"; then
    return
  fi
  echo "[watchdog] C++ engine down — restarting..."
  kill "$ENGINE_PID" 2>/dev/null || true
  free_port 9001
  start_engine
}

restart_api() {
  if within_grace "$API_STARTED"; then
    return
  fi
  echo "[watchdog] API unhealthy (${API_FAIL_STREAK} failures) — restarting..."
  kill "$API_PID" 2>/dev/null || true
  free_port 8000
  start_api
}

restart_ui() {
  if within_grace "$UI_STARTED"; then
    return
  fi
  echo "[watchdog] Dashboard unhealthy (${UI_FAIL_STREAK} failures) — restarting (fresh .next cache)..."
  kill "$UI_PID" 2>/dev/null || true
  free_port 3000
  start_ui 1
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

    if ! ui_healthy; then
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
start_ui 1

echo ""
echo "============================================"
echo "  Orion Alpha is running (auto-restart ON)"
echo "  Dashboard:  http://localhost:3000"
echo "  API:        http://localhost:8000"
echo "  Engine:     localhost:9001 (C++)"
echo "============================================"
echo "Press Ctrl+C to stop all services."
echo ""

watchdog
