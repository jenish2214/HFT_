#!/usr/bin/env bash
# HFT Demo — production build (C++ engine + Python deps + Next.js static build)
set -e

ROOT="$(cd "$(dirname "$0")/.." && pwd)"

echo "==> [1/3] Building C++ matching engine (release -O3)..."
bash "$ROOT/scripts/build.sh"

echo "==> [2/3] Setting up Python environment..."
cd "$ROOT/python"
if [ ! -d ".venv" ] || ! .venv/bin/python -c "import uvicorn" 2>/dev/null; then
  rm -rf .venv
  python3 -m venv .venv
fi
.venv/bin/pip install -q -r requirements.txt

echo "==> [3/3] Building Next.js dashboard (production)..."
cd "$ROOT/frontend"
if [ ! -d "node_modules" ]; then
  npm install --silent
fi
npm run build

echo ""
echo "============================================"
echo "  Production build complete"
echo "  Run:  ./scripts/run-prod.sh"
echo "============================================"
