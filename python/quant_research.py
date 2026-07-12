"""
Quantitative stock research — ported from QuantResearch.ipynb.
Alpha models, factor engine, CAPM, risk metrics, Monte Carlo, pattern signals.
"""

from __future__ import annotations

import math
import time
from concurrent.futures import ThreadPoolExecutor, as_completed
from typing import Any

import numpy as np
import pandas as pd
import yfinance as yf

try:
    import statsmodels.api as sm
    HAS_STATSMODELS = True
except ImportError:
    HAS_STATSMODELS = False

DEFAULT_TICKERS = ["AAPL", "MSFT", "NVDA", "GOOGL"]
DEFAULT_BENCHMARK = "SPY"
DEFAULT_PERIOD = "2y"
RISK_FREE_RATE = 0.04
RF_DAILY = (1 + RISK_FREE_RATE) ** (1 / 252) - 1
RANDOM_SEED = 42

_quant_cache: dict[str, dict] = {}
_quant_cache_ts: dict[str, float] = {}
_QUANT_TTL = 300.0


def _safe_float(v: Any, decimals: int = 4) -> float | None:
    try:
        if v is None or (isinstance(v, float) and (math.isnan(v) or math.isinf(v))):
            return None
        return round(float(v), decimals)
    except (TypeError, ValueError):
        return None


def _get_close(df: pd.DataFrame) -> pd.Series:
    if df is None or df.empty:
        return pd.Series(dtype=float)
    if isinstance(df.columns, pd.MultiIndex):
        if "Close" in df.columns.get_level_values(0):
            close = df["Close"]
            if isinstance(close, pd.DataFrame):
                close = close.iloc[:, 0]
            return close.dropna()
    if "Close" in df.columns:
        close = df["Close"]
        if isinstance(close, pd.DataFrame):
            close = close.iloc[:, 0]
        return close.dropna()
    if len(df.columns) == 1:
        return df.iloc[:, 0].dropna()
    raise KeyError("Close column not found")


def download_prices(tickers: list[str], period: str = DEFAULT_PERIOD) -> pd.DataFrame:
    prices: dict[str, pd.Series] = {}
    for t in tickers:
        try:
            raw = yf.download(t, period=period, auto_adjust=True, progress=False)
            if raw is None or raw.empty:
                continue
            s = _get_close(raw)
            if len(s) >= 30:
                prices[t] = s
        except Exception as exc:
            print(f"[quant] download failed {t}: {exc}")
    if not prices:
        raise ValueError("No valid price data downloaded")
    return pd.DataFrame(prices).sort_index().ffill().dropna(how="all")


def daily_returns(prices: pd.DataFrame) -> pd.DataFrame:
    return prices.pct_change().dropna()


def annualized_vol(returns: pd.Series) -> float:
    return float(returns.std() * np.sqrt(252))


def cagr(prices: pd.Series) -> float:
    n = len(prices)
    if n < 2:
        return 0.0
    return float((prices.iloc[-1] / prices.iloc[0]) ** (252 / n) - 1)


def sharpe_ratio(returns: pd.Series, rf_daily: float = RF_DAILY) -> float:
    if returns.std() == 0:
        return 0.0
    excess = returns.mean() - rf_daily
    return float(excess / returns.std() * np.sqrt(252))


def sortino_ratio(returns: pd.Series, rf_daily: float = RF_DAILY) -> float:
    downside = returns[returns < rf_daily]
    ds = downside.std()
    if ds == 0:
        return 0.0
    return float((returns.mean() - rf_daily) / ds * np.sqrt(252))


def max_drawdown(prices: pd.Series) -> float:
    cum = prices / prices.iloc[0]
    return float((cum / cum.cummax() - 1).min())


def value_at_risk(returns: pd.Series, alpha: float = 0.05) -> float:
    return float(np.percentile(returns, alpha * 100))


def sma(series: pd.Series, window: int) -> pd.Series:
    return series.rolling(window).mean()


def rsi(series: pd.Series, window: int = 14) -> pd.Series:
    delta = series.diff()
    gain = delta.clip(lower=0).rolling(window).mean()
    loss = (-delta.clip(upper=0)).rolling(window).mean()
    rs = gain / loss.replace(0, np.nan)
    return 100 - (100 / (1 + rs))


def macd(series: pd.Series, fast: int = 12, slow: int = 26, signal: int = 9):
    ema_fast = series.ewm(span=fast, adjust=False).mean()
    ema_slow = series.ewm(span=slow, adjust=False).mean()
    line = ema_fast - ema_slow
    sig = line.ewm(span=signal, adjust=False).mean()
    return line, sig


def bollinger_bands(series: pd.Series, window: int = 20, num_std: float = 2):
    mid = sma(series, window)
    std = series.rolling(window).std()
    return mid + num_std * std, mid, mid - num_std * std


def capm_regression(asset_rets: pd.Series, mkt_rets: pd.Series, rf_daily: float = RF_DAILY):
    df = pd.concat([asset_rets.rename("asset"), mkt_rets.rename("mkt")], axis=1).dropna()
    if len(df) < 30:
        return 0.0, 1.0
    y = df["asset"] - rf_daily
    x = df["mkt"] - rf_daily
    if HAS_STATSMODELS:
        model = sm.OLS(y, sm.add_constant(x)).fit()
        alpha_daily = float(model.params.iloc[0])
        beta = float(model.params.iloc[1])
    else:
        cov = np.cov(y, x)
        beta = cov[0, 1] / cov[1, 1] if cov[1, 1] else 1.0
        alpha_daily = float(y.mean() - beta * x.mean())
    return alpha_daily * 252, beta


def monte_carlo_gbm(s0: float, mu: float, sigma: float, days: int, n_sims: int = 2000, seed: int = RANDOM_SEED):
    paths = _simulate_gbm_paths(s0, mu, sigma, days, n_sims, seed)
    end = paths[-1]
    return {
        "p05": float(np.percentile(end, 5)),
        "p50": float(np.median(end)),
        "p95": float(np.percentile(end, 95)),
    }


def _simulate_gbm_paths(s0: float, mu: float, sigma: float, days: int, n_sims: int, seed: int) -> np.ndarray:
    rng = np.random.default_rng(seed)
    paths = np.zeros((days, n_sims))
    paths[0] = s0
    for t in range(1, days):
        z = rng.standard_normal(n_sims)
        paths[t] = paths[t - 1] * np.exp((mu - 0.5 * sigma ** 2) + sigma * z)
    return paths


def compute_factor_scores(prices: pd.DataFrame, rets: pd.DataFrame) -> pd.DataFrame:
    rows = []
    for t in prices.columns:
        p, r = prices[t], rets[t]
        sma50 = sma(p, 50).iloc[-1]
        rows.append({
            "symbol": t,
            "momentum_63d": _safe_float(p.pct_change(63).iloc[-1], 4),
            "reversal_5d": _safe_float(-p.pct_change(5).iloc[-1], 4),
            "low_vol_21d": _safe_float(-r.rolling(21).std().iloc[-1], 6),
            "trend_sma50": _safe_float(p.iloc[-1] / sma50 - 1 if sma50 else 0, 4),
            "rsi_14": _safe_float(rsi(p, 14).iloc[-1], 2),
        })
    df = pd.DataFrame(rows).set_index("symbol")
    factor_cols = ["momentum_63d", "reversal_5d", "low_vol_21d", "trend_sma50"]
    for c in factor_cols:
        std = df[c].std(ddof=0)
        df[f"{c}_z"] = (df[c] - df[c].mean()) / std if std else 0
    z_cols = [f"{c}_z" for c in factor_cols]
    df["composite_alpha"] = df[z_cols].mean(axis=1)
    return df.sort_values("composite_alpha", ascending=False)


def factor_ic(prices: pd.DataFrame, rets: pd.DataFrame, forward_days: int = 5) -> list[dict]:
    records = []
    for t in prices.columns:
        p, r = prices[t], rets[t]
        mom = p.pct_change(63)
        rev = -p.pct_change(5)
        lvol = -r.rolling(21).std()
        fwd = p.pct_change(forward_days).shift(-forward_days)
        for name, fac in [("Momentum", mom), ("Reversal", rev), ("LowVol", lvol)]:
            valid = pd.concat([fac, fwd], axis=1).dropna()
            ic = float(valid.corr(method="spearman").iloc[0, 1]) if len(valid) >= 30 else None
            records.append({"symbol": t, "factor": name, "ic": _safe_float(ic, 3)})
    return records


def pattern_signals(prices: pd.DataFrame, rets: pd.DataFrame, primary: str) -> list[dict]:
    """Probability-weighted pattern signals from technicals (notebook Section 8)."""
    if primary not in prices.columns:
        primary = prices.columns[0]
    p = prices[primary]
    r = rets[primary]
    rsi_v = float(rsi(p, 14).iloc[-1])
    macd_line, macd_sig = macd(p)
    macd_hist = float(macd_line.iloc[-1] - macd_sig.iloc[-1])
    upper, mid, lower = bollinger_bands(p)
    price = float(p.iloc[-1])
    sma20 = float(sma(p, 20).iloc[-1])
    sma50 = float(sma(p, 50).iloc[-1])
    vol_rising = float(r.rolling(5).std().iloc[-1]) > float(r.rolling(21).std().iloc[-1])

    signals = []

    trend_prob = 72 if price > sma20 and price > sma50 and vol_rising else 45 if price > sma50 else 28
    signals.append({
        "label": "Trend continuation",
        "probability": trend_prob,
        "description": "Price holds above SMA with rising volume" if vol_rising else "Price vs SMA trend alignment",
    })

    rev_prob = 58 if rsi_v > 70 or rsi_v < 30 else 35
    bb_touch = price >= float(upper.iloc[-1]) or price <= float(lower.iloc[-1])
    if bb_touch:
        rev_prob = min(85, rev_prob + 15)
    signals.append({
        "label": "Mean reversion",
        "probability": rev_prob,
        "description": "RSI stretch with Bollinger band touch" if bb_touch else f"RSI at {rsi_v:.0f}",
    })

    breakout_prob = 64 if macd_hist > 0 and price > float(mid.iloc[-1]) else 40
    signals.append({
        "label": "Breakout confirmation",
        "probability": breakout_prob,
        "description": "Range break + MACD momentum align" if macd_hist > 0 else "MACD momentum pending",
    })

    peer_rets = {t: float(prices[t].pct_change(21).iloc[-1]) for t in prices.columns if t != primary}
    if peer_rets:
        primary_ret = float(prices[primary].pct_change(21).iloc[-1])
        beat = sum(1 for v in peer_rets.values() if primary_ret > v)
        rs_prob = int(50 + (beat / len(peer_rets)) * 40)
    else:
        rs_prob = 50
    signals.append({
        "label": "Sector relative strength",
        "probability": min(95, rs_prob),
        "description": f"{primary} vs peer basket (21d)",
    })

    return signals


def compute_momentum_buy_lab(
    primary: str,
    price_series: pd.Series,
    factor_row: dict | None,
) -> dict:
    """Educational momentum entry study — SMA pullback levels, not buy advice."""
    p = price_series.dropna()
    if len(p) < 50:
        return {"data_found": False, "disclaimer": "For education only. Not investment advice."}

    current = float(p.iloc[-1])
    sma20 = float(sma(p, 20).iloc[-1])
    sma50 = float(sma(p, 50).iloc[-1])
    mom_63 = float((factor_row or {}).get("momentum_63d") or 0)
    rsi_v = (factor_row or {}).get("rsi_14")

    if current > sma20 > sma50 and mom_63 > 0.03:
        regime = "Strong momentum"
        study_buy = round(sma20, 2)
        lesson = (
            f"In a strong momentum uptrend, textbooks often study pullbacks to the 20-day average "
            f"({study_buy:.2f}) before trend continuation — a learning exercise, not a trade signal."
        )
    elif current > sma50 and mom_63 > 0:
        regime = "Moderate momentum"
        study_buy = round(sma50, 2)
        lesson = (
            f"Moderate momentum: students commonly map trend support at the 50-day average "
            f"({study_buy:.2f}) when price holds above it."
        )
    else:
        regime = "Weak / below trend"
        study_buy = round(min(sma50, current * 0.97), 2)
        lesson = (
            f"Weaker momentum vs SMA50 — study waiting for trend repair near {study_buy:.2f} "
            f"before sizing risk in paper portfolios."
        )

    dist_pct = round((study_buy - current) / current * 100, 2) if current else 0

    zones = [
        {"label": "SMA20 study level", "price": round(sma20, 2), "role": "Short-term momentum pullback"},
        {"label": "SMA50 study level", "price": round(sma50, 2), "role": "Medium-term trend support"},
        {
            "label": "Momentum study entry",
            "price": study_buy,
            "role": f"Demo level for {regime.lower()}",
            "highlight": True,
        },
    ]

    return {
        "data_found": True,
        "symbol": primary,
        "current_price": round(current, 2),
        "momentum_regime": regime,
        "momentum_63d_pct": _safe_float(mom_63 * 100, 2),
        "rsi_14": rsi_v,
        "study_buy_price": study_buy,
        "distance_from_current_pct": dist_pct,
        "zones": zones,
        "lesson": lesson,
        "disclaimer": "For education only. Not investment advice or a price forecast.",
    }


def compute_predictions(
    primary: str,
    patterns: list[dict],
    mc_row: dict | None,
    factor_row: dict | None,
    engine: dict | None = None,
) -> dict:
    """Demo learning scorecard — pattern + factor + Monte Carlo blend (not a forecast)."""
    current = (mc_row or {}).get("current")
    p05 = (mc_row or {}).get("p05")
    p50 = (mc_row or {}).get("p50")
    p95 = (mc_row or {}).get("p95")

    pattern_avg = sum(p["probability"] for p in patterns) / len(patterns) if patterns else 50.0
    top_pattern = max(patterns, key=lambda p: p["probability"]) if patterns else None

    mc_up = 50.0
    if current and p50:
        move = (float(p50) - float(current)) / float(current)
        mc_up = min(88.0, max(12.0, 50.0 + move * 180.0))

    alpha_score = 50.0
    composite = (factor_row or {}).get("composite_alpha")
    if composite is not None:
        alpha_score = min(88.0, max(12.0, 50.0 + float(composite) * 35.0))

    bullish_score = pattern_avg * 0.40 + mc_up * 0.35 + alpha_score * 0.25

    if bullish_score >= 62:
        outlook = "Bullish"
        headline = f"{primary} — demo scorecard skews positive (study exercise only)"
    elif bullish_score <= 42:
        outlook = "Bearish"
        headline = f"{primary} — demo scorecard skews defensive (study exercise only)"
    else:
        outlook = "Neutral"
        headline = f"{primary} — mixed demo scores; use for learning, not trading decisions"

    confidence = int(min(92, max(38, abs(bullish_score - 50) * 1.6 + 42)))

    up = int(min(78, max(12, bullish_score * 0.85)))
    down = int(min(78, max(12, (100 - bullish_score) * 0.75)))
    flat = max(8, 100 - up - down)
    total = up + flat + down
    up = round(up * 100 / total)
    flat = round(flat * 100 / total)
    down = 100 - up - flat

    scenarios = [
        {
            "label": "Higher",
            "probability": up,
            "hint": "Price above current in 1Y (MC median + pattern stack)",
        },
        {
            "label": "Range",
            "probability": flat,
            "hint": "Sideways — mixed factor and technical signals",
        },
        {
            "label": "Lower",
            "probability": down,
            "hint": "Pullback risk — mean reversion or vol expansion",
        },
    ]

    models = [
        {
            "id": "cpp-engine",
            "name": "HFT Matching Engine",
            "stack": "C++",
            "role": "Low-latency execution & book stats",
            "status": (engine or {}).get("status", "offline"),
        },
        {
            "id": "factor-engine",
            "name": "Factor Engine",
            "stack": "Python",
            "role": "Momentum, reversal, composite α",
            "status": "live",
        },
        {
            "id": "pattern-model",
            "name": "Pattern Model",
            "stack": "Python",
            "role": "RSI, MACD, Bollinger probabilities",
            "status": "live",
        },
        {
            "id": "monte-carlo",
            "name": "Monte Carlo GBM",
            "stack": "Python",
            "role": "1Y price path simulation (1500 paths)",
            "status": "live",
        },
    ]

    payload: dict[str, Any] = {
        "outlook": outlook,
        "confidence": confidence,
        "headline": headline,
        "bullish_score": _safe_float(bullish_score, 1),
        "scenarios": scenarios,
        "signals": [
            {"label": p["label"], "probability": p["probability"], "description": p["description"]}
            for p in patterns
        ],
        "models": models,
        "top_signal": {
            "label": top_pattern["label"],
            "probability": top_pattern["probability"],
        } if top_pattern else None,
    }

    if current and p05 is not None and p50 is not None and p95 is not None:
        payload["price_band"] = {
            "current": _safe_float(current, 2),
            "low": _safe_float(p05, 2),
            "mid": _safe_float(p50, 2),
            "high": _safe_float(p95, 2),
        }

    return payload


def _company_snapshot(symbol: str) -> dict[str, Any]:
    """Slim company profile for quant research universe cards."""
    from yfinance_feed import fetch_company_report

    try:
        r = fetch_company_report(symbol)
    except Exception:
        return {"symbol": symbol, "data_found": False}

    annual = r.get("annual_reports") or []
    latest = annual[0] if annual else {}
    key_stats = (r.get("key_stats") or [])[:8]

    return {
        "symbol": symbol,
        "name": r.get("name") or symbol,
        "sector": r.get("sector"),
        "industry": r.get("industry"),
        "description": (r.get("description") or "")[:500] or None,
        "website": r.get("website"),
        "employees": r.get("employees"),
        "market_cap_fmt": r.get("market_cap_fmt"),
        "pe_ratio": r.get("pe_ratio"),
        "eps": r.get("eps"),
        "dividend_yield": r.get("dividend_yield"),
        "fifty_two_week_high": r.get("fifty_two_week_high"),
        "fifty_two_week_low": r.get("fifty_two_week_low"),
        "latest_revenue_fmt": latest.get("revenue_fmt"),
        "latest_net_income_fmt": latest.get("net_income_fmt"),
        "report_year": latest.get("year"),
        "key_stats": key_stats,
        "data_found": r.get("data_found", False),
        "partial": r.get("partial", False),
    }


def _company_profiles_parallel(tickers: list[str]) -> dict[str, dict[str, Any]]:
    unique = list(dict.fromkeys(tickers))
    profiles: dict[str, dict[str, Any]] = {}
    workers = min(6, max(1, len(unique)))
    with ThreadPoolExecutor(max_workers=workers) as pool:
        futures = {pool.submit(_company_snapshot, sym): sym for sym in unique}
        for fut in as_completed(futures):
            sym = futures[fut]
            try:
                profiles[sym] = fut.result()
            except Exception:
                profiles[sym] = {"symbol": sym, "data_found": False}
    return profiles


def run_quant_research(
    primary: str = "AAPL",
    tickers: list[str] | None = None,
    benchmark: str = DEFAULT_BENCHMARK,
    period: str = DEFAULT_PERIOD,
) -> dict:
    """Full quant research payload — JSON-serializable."""
    sym = primary.upper().strip()
    universe = [t.upper().strip() for t in (tickers or DEFAULT_TICKERS)]
    if sym not in universe:
        universe.insert(0, sym)
    universe = list(dict.fromkeys(universe))[:8]

    cache_key = f"{sym}|{','.join(universe)}|{period}"
    now = time.time()
    if cache_key in _quant_cache and now - _quant_cache_ts.get(cache_key, 0) < _QUANT_TTL:
        return _quant_cache[cache_key]

    all_tickers = list(dict.fromkeys(universe + [benchmark]))
    all_prices = download_prices(all_tickers, period)
    available = [t for t in universe if t in all_prices.columns]
    if not available:
        raise ValueError(f"No price data for {universe}")
    if sym not in available:
        sym = available[0]

    prices = all_prices[available]
    rets = daily_returns(prices)

    if benchmark in all_prices.columns:
        mkt_series = daily_returns(all_prices[[benchmark]])[benchmark]
    else:
        mkt_series = None

    factor_df = compute_factor_scores(prices, rets)
    ic_rows = factor_ic(prices, rets)
    patterns = pattern_signals(prices, rets, sym)

    risk_rows = []
    capm_rows = []
    mc_rows = []
    for t in available:
        p, r = prices[t], rets[t]
        alpha, beta = capm_regression(r, mkt_series) if mkt_series is not None else (0.0, 1.0)
        lr = np.log(p / p.shift(1)).dropna()
        mu, sig = float(lr.mean()), float(lr.std())
        mc = monte_carlo_gbm(float(p.iloc[-1]), mu, sig, 252, 1500)

        risk_rows.append({
            "symbol": t,
            "cagr_pct": _safe_float(cagr(p) * 100, 2),
            "ann_vol_pct": _safe_float(annualized_vol(r) * 100, 2),
            "sharpe": _safe_float(sharpe_ratio(r), 2),
            "sortino": _safe_float(sortino_ratio(r), 2),
            "max_drawdown_pct": _safe_float(max_drawdown(p) * 100, 2),
            "var_95_pct": _safe_float(value_at_risk(r) * 100, 3),
            "latest_price": _safe_float(p.iloc[-1], 2),
        })
        capm_rows.append({
            "symbol": t,
            "alpha_ann_pct": _safe_float(alpha * 100, 2),
            "beta": _safe_float(beta, 2),
            "benchmark": benchmark,
        })
        mc_rows.append({
            "symbol": t,
            "current": _safe_float(p.iloc[-1], 2),
            **{k: _safe_float(v, 2) for k, v in mc.items()},
        })

    factor_rows = []
    for t, row in factor_df.iterrows():
        factor_rows.append({
            "symbol": t,
            "momentum_63d": _safe_float(row["momentum_63d"], 4),
            "reversal_5d": _safe_float(row["reversal_5d"], 4),
            "low_vol_21d": _safe_float(row["low_vol_21d"], 6),
            "trend_sma50": _safe_float(row["trend_sma50"], 4),
            "rsi_14": _safe_float(row["rsi_14"], 1),
            "composite_alpha": _safe_float(row["composite_alpha"], 3),
        })

    corr = rets.corr().round(3)
    corr_matrix = {
        "symbols": list(corr.columns),
        "values": corr.values.tolist(),
    }

    n = len(available)
    ew_ret = float(rets.mean(axis=1).mean() * 252 * 100)
    ew_vol = float(rets.mean(axis=1).std() * np.sqrt(252) * 100)
    ew_sharpe = _safe_float(sharpe_ratio(rets.mean(axis=1)), 2)

    best_sh = max(risk_rows, key=lambda x: x.get("sharpe") or 0)
    top_factor = factor_rows[0] if factor_rows else None
    best_alpha = max(capm_rows, key=lambda x: x.get("alpha_ann_pct") or 0)

    recommendation = f"Monitor {sym}"
    if top_factor and top_factor["composite_alpha"] and top_factor["composite_alpha"] > 0.3:
        recommendation = f"Factor leader: {top_factor['symbol']} (composite α {top_factor['composite_alpha']:.2f})"
    elif best_alpha.get("alpha_ann_pct", 0) and best_alpha["alpha_ann_pct"] > 5:
        recommendation = f"CAPM alpha leader: {best_alpha['symbol']} ({best_alpha['alpha_ann_pct']:.1f}% vs {benchmark})"

    # Chart payloads for interactive research UI (downsampled)
    chart_window = min(120, len(prices))
    price_chart: dict[str, list[dict]] = {}
    for t in available:
        s = prices[t].iloc[-chart_window:]
        base = float(s.iloc[0]) if len(s) else 1.0
        price_chart[t] = [
            {
                "date": str(idx.date()) if hasattr(idx, "date") else str(idx)[:10],
                "close": _safe_float(v, 2),
                "norm": _safe_float(float(v) / base * 100, 2) if base else 100.0,
            }
            for idx, v in s.items()
        ]

    primary_prices = prices[sym]
    rsi_series = rsi(primary_prices, 14).iloc[-chart_window:]
    rsi_chart = [
        {
            "date": str(idx.date()) if hasattr(idx, "date") else str(idx)[:10],
            "rsi": _safe_float(v, 1),
        }
        for idx, v in rsi_series.dropna().items()
    ]

    def _ts(series: pd.Series) -> list[dict]:
        s = series.iloc[-chart_window:]
        return [
            {
                "date": str(idx.date()) if hasattr(idx, "date") else str(idx)[:10],
                "value": _safe_float(v, 2),
            }
            for idx, v in s.dropna().items()
        ]

    bb_u, bb_m, bb_l = bollinger_bands(primary_prices)
    macd_line, macd_sig = macd(primary_prices)
    macd_hist = macd_line - macd_sig

    indicators_chart = {
        "symbol": sym,
        "price": [
            {
                "date": str(idx.date()) if hasattr(idx, "date") else str(idx)[:10],
                "close": _safe_float(v, 2),
            }
            for idx, v in primary_prices.iloc[-chart_window:].items()
        ],
        "sma20": _ts(sma(primary_prices, 20)),
        "sma50": _ts(sma(primary_prices, 50)),
        "bb_upper": _ts(bb_u),
        "bb_mid": _ts(bb_m),
        "bb_lower": _ts(bb_l),
        "macd": _ts(macd_line),
        "macd_signal": _ts(macd_sig),
        "macd_hist": _ts(macd_hist),
    }

    lr = np.log(primary_prices / primary_prices.shift(1)).dropna()
    mu, sig = float(lr.tail(63).mean()), float(lr.tail(63).std())
    s0 = float(primary_prices.iloc[-1])
    mc_paths = _simulate_gbm_paths(s0, mu, sig, 63, 400, RANDOM_SEED)
    mc_fan = {
        "symbol": sym,
        "current": _safe_float(s0, 2),
        "days": 63,
        "p05": [_safe_float(v, 2) for v in np.percentile(mc_paths, 5, axis=1).tolist()],
        "p50": [_safe_float(v, 2) for v in np.percentile(mc_paths, 50, axis=1).tolist()],
        "p95": [_safe_float(v, 2) for v in np.percentile(mc_paths, 95, axis=1).tolist()],
    }

    cum_ret = (1 + rets).cumprod()
    returns_chart = [
        {
            "date": str(idx.date()) if hasattr(idx, "date") else str(idx)[:10],
            **{t: _safe_float(float(cum_ret.loc[idx, t]) * 100, 2) for t in available if t in cum_ret.columns},
        }
        for idx in cum_ret.iloc[-chart_window:].index
    ]

    primary_mc = next((m for m in mc_rows if m["symbol"] == sym), mc_rows[0] if mc_rows else None)
    primary_factor = next((f for f in factor_rows if f["symbol"] == sym), factor_rows[0] if factor_rows else None)

    result = {
        "primary": sym,
        "tickers": available,
        "benchmark": benchmark,
        "period": period,
        "trading_days": len(prices),
        "date_range": {
            "start": str(prices.index[0].date()) if hasattr(prices.index[0], "date") else str(prices.index[0]),
            "end": str(prices.index[-1].date()) if hasattr(prices.index[-1], "date") else str(prices.index[-1]),
        },
        "data_found": True,
        "data_source": "quant-research",
        "sources_tried": ["yfinance"],
        "factor_scores": factor_rows,
        "capm": capm_rows,
        "risk_metrics": risk_rows,
        "monte_carlo": mc_rows,
        "factor_ic": ic_rows,
        "pattern_signals": patterns,
        "correlation": corr_matrix,
        "company_profiles": (profiles := _company_profiles_parallel(available)),
        "primary_profile": profiles.get(sym) or _company_snapshot(sym),
        "charts": {
            "price_series": price_chart,
            "cumulative_returns": returns_chart,
            "rsi": rsi_chart,
            "indicators": indicators_chart,
            "monte_carlo_fan": mc_fan,
        },
        "portfolio": {
            "equal_weight": {"return_pct": _safe_float(ew_ret, 2), "vol_pct": _safe_float(ew_vol, 2), "sharpe": ew_sharpe},
        },
        "summary": {
            "best_sharpe": best_sh["symbol"],
            "top_factor_pick": top_factor["symbol"] if top_factor else sym,
            "best_capm_alpha": best_alpha["symbol"],
            "recommendation": recommendation,
            "universe_vol_pct": _safe_float(np.mean([r["ann_vol_pct"] for r in risk_rows if r["ann_vol_pct"]]), 2),
        },
        "predictions": compute_predictions(sym, patterns, primary_mc, primary_factor),
        "momentum_lab": compute_momentum_buy_lab(sym, prices[sym], primary_factor),
        "methodology": "Educational quant lab — factor engine, CAPM, Monte Carlo GBM (demo)",
        "updated_ts": now,
    }

    _quant_cache[cache_key] = result
    _quant_cache_ts[cache_key] = now
    return result
