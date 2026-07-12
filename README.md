# Orion Alpha — Deep Research Terminal

**Orion Alpha** is a professional market research platform and financial terminal for equities, crypto, commodities, FX, and rates. Built by **BSj infotech**.

**Motto:** *Deep Research*

## Site structure

| Route | Description |
|-------|-------------|
| `/` | Home — research purpose, pattern probability, 3D hero |
| `/research` | Quant research — factor model, CAPM, risk, Monte Carlo (QuantResearch.ipynb) |
| `/about` | About Orion Alpha & terminal shortcuts |
| `/contact` | Contact — BSj infotech / Professional Services |
| `/terminal` | Full-screen research terminal (no site navbar) |
| `/chart` | Full-screen chart workspace (no site navbar) |
| `/fundamentals` | Company fundamentals page |

## Architecture

```
┌──────────────┐     ┌───────────────┐     ┌─────────────────┐     ┌──────────────┐
│ Market Feed  │ ──► │  FastAPI API  │ ──► │  C++ Engine     │     │  Next.js UI  │
│ (yfinance)   │     │  + WebSocket  │     │  (Order book)   │ ◄── │  Orion Alpha │
└──────────────┘     └───────────────┘     └─────────────────┘     └──────────────┘
```

| Layer | Tech | Role |
|-------|------|------|
| Dashboard | **Next.js 14 / React** | Home, About, Contact, Terminal, Charts |
| API | **Python / FastAPI** | Market state, fundamentals, WebSocket stream |
| Engine | **C++17** | Matching engine, Level II book, latency stats |
| Data | **yfinance** + **Google Finance** fallback | Live quotes, charts, fundamentals |

## Features

- **Quant research page** — factor engine, CAPM alpha/beta, Sharpe/Sortino/VaR, Monte Carlo, pattern probability (from QuantResearch.ipynb)
- **Data not found UI** — clear “try again later” message with source info and retry button
- **Orion Alpha Terminal** — GP, FA, MON, IB, RES, DES, CN, HP function keys
- **33+ instruments** — equities, crypto, commodities, indices, FX, rates
- **Charts** — candlesticks, SMA, EMA, Bollinger, RSI, MACD; timeframes 1D–ALL
- **Fundamentals** — income, balance sheet, cash flow, key stats
- **Light / dark theme** on marketing pages
- **Security (code-level)** — API allowlist, input validation, rate limits, security headers (not shown on public pages)
- **LIVE badge** — only during US regular market hours (9:30–16:00 ET)

## Quick start

**Requirements:** C++17 (clang/g++), Python 3.10+, Node.js 18+

```bash
chmod +x scripts/run.sh
./scripts/run.sh
```

- **Home:** http://localhost:3000  
- **Terminal:** http://localhost:3000/terminal  
- **API:** http://localhost:8000  

### Manual start

```bash
# C++ engine
./scripts/build.sh && ./cpp/build/hft_engine

# Python API
cd python && python3 -m venv .venv && .venv/bin/pip install -r requirements.txt
.venv/bin/uvicorn api_server:app --reload --port 8000

# Frontend
cd frontend && npm install && npm run dev
```

## Project structure

```
HFT_/
├── cpp/                 # C++ matching engine
├── python/              # FastAPI, yfinance feed, market hours, security
├── frontend/            # Next.js — Orion Alpha dashboard & site
│   ├── app/             # Routes: /, /about, /contact, /terminal, /chart
│   ├── components/      # Terminal UI, Hero3DScene, ResearchShowcase
│   └── lib/             # orionAlpha, security, marketTypes
├── scripts/run.sh
└── render.yaml          # Render Blueprint (API + dashboard)
```

## Environment variables

| Variable | Service | Description |
|----------|---------|-------------|
| `API_URL` | Frontend | Backend URL for `/api` proxy |
| `ALLOWED_ORIGINS` | API | CORS origins (comma-separated) |
| `HFT_SYMBOL` | API | Default symbol (e.g. AAPL) |
| `HFT_ENGINE_HOST` | API | C++ engine host |
| `HFT_ENGINE_PORT` | API | C++ engine port (9001) |

See `.env.example` and `frontend/.env.example`.

## Deploy (Render)

1. Push to GitHub  
2. [Render Blueprint](https://dashboard.render.com/blueprint/new) → connect repo → use `render.yaml`  
3. Services: `orion-alpha-api` (Docker) + `orion-alpha-dashboard` (Node)

Or deploy frontend on **Vercel** with `API_URL` pointing to your Render API.

## License

MIT — educational and research use.

---

*Last updated: July 2026 — Orion Alpha · Deep Research · BSj infotech*
