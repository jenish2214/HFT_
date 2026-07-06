# HFT Demo — How High-Frequency Trading Works

An educational simulator showing the core loop of high-frequency trading:
**market data → strategy → order → C++ matching engine → fill**.

Built to help you understand what firms like Jane Street and Jump Trading actually do at a systems level.

## Architecture

```
┌─────────────┐     ┌──────────────┐     ┌─────────────────┐     ┌──────────────┐
│ Market Feed │ ──► │   Strategy   │ ──► │  Python Gateway │ ──► │ C++ Engine   │
│ (yfinance)  │     │  (Python)    │     │   (FastAPI)     │     │ (Order Book) │
└─────────────┘     └──────────────┘     └─────────────────┘     └──────────────┘
                                                │                        │
                                                ▼                        ▼
                                         ┌──────────────┐          nanosecond
                                         │  Dashboard   │          latency stats
                                         │  (Next.js)   │
                                         └──────────────┘
```

| Layer | Tech | Role |
|-------|------|------|
| Matching Engine | **C++17** | Order book with price-time priority, sub-µs matching |
| Market Feed | **Python/yfinance** | Real quotes, intraday chart bars, live session detection |
| Strategy | **Python** | Market-making algo — posts bid/ask, manages inventory |
| API + WebSocket | **Python/FastAPI** | Orchestrates the loop, streams data to UI |
| Dashboard | **Next.js/React** | Bloomberg-style desk: chart, book, tape, order ticket |

### Highlights
- **Live streaming** during US market hours (9:30 AM – 4:00 PM ET)
- **Chart** with timeframes 1D / 1W / 1M / 3M / 1Y / All + live price line & tick trail
- **Level II order book**, Time & Sales, compact order ticket
- **Market maker** strategy with realized / unrealized P&L
- **Activity log** showing Feed → Strategy → Gateway → Engine → Fill

## Quick Start

**Requirements:** C++17 compiler (clang/g++), Python 3.10+, Node.js 18+

```bash
chmod +x scripts/run.sh
./scripts/run.sh
```

Open **http://localhost:3000**

### Manual Start (3 terminals)

```bash
# Terminal 1 — C++ engine
./scripts/build.sh
./cpp/build/hft_engine

# Terminal 2 — Python API
cd python && python3 -m venv .venv && .venv/bin/pip install -r requirements.txt
.venv/bin/uvicorn api_server:app --reload --port 8000

# Terminal 3 — Dashboard
cd frontend && npm install && npm run dev
```

## Project Structure

```
HFT/
├── cpp/                    # C++ matching engine
├── python/                 # API, yfinance feed, strategy
├── frontend/               # Next.js dashboard
└── scripts/run.sh
```

## How the C++ Engine Works

The matching engine implements **price-time priority**:

- **Price priority**: Best bid/ask matched first
- **Time priority**: At the same price, first order in queue gets filled first
- Supports **LIMIT** and **MARKET** orders
- Tracks matching latency in nanoseconds

## License

MIT — for educational use.

## Deploy (Vercel + Render)

This app splits across two hosts:

| Service | Platform | What runs |
|---------|----------|-----------|
| **Dashboard** | [Vercel](https://vercel.com) | Next.js frontend (`frontend/`) |
| **API + Engine** | [Render](https://render.com) | C++ matching engine + FastAPI (Docker) |

### 1. Push to GitHub

```bash
git add .
git commit -m "Add deployment config"
git push origin main
```

`.gitignore` excludes `node_modules/`, `.venv/`, `cpp/build/`, `.next/`, and `.env` files.

### 2. Deploy backend on Render

1. [Render Dashboard](https://dashboard.render.com) → **New** → **Blueprint**
2. Connect your GitHub repo and select `render.yaml`
3. Wait for the `hft-api` service to build (Docker builds C++ + Python)
4. Copy the service URL, e.g. `https://hft-api.onrender.com`
5. Check health: `https://hft-api.onrender.com/health`

### 3. Deploy frontend on Vercel

1. [Vercel Dashboard](https://vercel.com/new) → Import your GitHub repo
2. Set **Root Directory** to `frontend`
3. Add environment variable (required for production API):

   | Name | Value |
   |------|-------|
   | `API_URL` | `https://hft-api.onrender.com` (your Render backend URL) |

   The dashboard uses `/api` in the browser; Vercel rewrites `/api/*` to `API_URL`. You do **not** need `NEXT_PUBLIC_API_URL` unless you want the browser to call Render directly.

4. Redeploy after saving env vars.

**Alternative — deploy frontend on Render:** use the `hft-dashboard` service in `render.yaml` (API URL is wired automatically).

**Optional WebSocket** (live streaming instead of polling):

| Name | Value |
|------|-------|
| `NEXT_PUBLIC_USE_WS` | `1` |
| `NEXT_PUBLIC_WS_URL` | `wss://hft-api.onrender.com/ws` |

### Local production build

```bash
./scripts/build-prod.sh   # build C++ + Next.js
./scripts/run-prod.sh     # run all services locally
```

### Docker (backend only)

```bash
docker build -t hft-api .
docker run -p 8000:8000 hft-api
```
