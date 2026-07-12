import type { QuantResearchData } from "@/lib/quantResearchTypes";

export type RiskPerspective = "trader" | "investor";
export type RiskPriority = "high" | "medium" | "low";

export interface RiskTactic {
  id: string;
  perspective: RiskPerspective;
  priority: RiskPriority;
  title: string;
  action: string;
  rationale: string;
}

function avgCorrelation(data: QuantResearchData, symbol: string): number | null {
  const idx = data.correlation.symbols.indexOf(symbol);
  if (idx < 0 || !data.correlation.values[idx]) return null;
  const row = data.correlation.values[idx].filter((_, j) => j !== idx);
  if (!row.length) return null;
  return row.reduce((s, v) => s + Math.abs(v), 0) / row.length;
}

export function buildRiskTactics(data: QuantResearchData, primary: string): RiskTactic[] {
  const tactics: RiskTactic[] = [];
  const risk = data.risk_metrics.find((r) => r.symbol === primary);
  const capm = data.capm.find((c) => c.symbol === primary);
  const mc = data.monte_carlo.find((m) => m.symbol === primary);
  const factor = data.factor_scores.find((f) => f.symbol === primary);
  const port = data.portfolio.equal_weight;
  const corr = avgCorrelation(data, primary);

  const vol = risk?.ann_vol_pct ?? null;
  const sharpe = risk?.sharpe ?? null;
  const maxDd = risk?.max_drawdown_pct ?? null;
  const var95 = risk?.var_95_pct ?? null;
  const beta = capm?.beta ?? null;
  const alpha = capm?.alpha_ann_pct ?? null;
  const rsi = factor?.rsi_14 ?? null;

  if (vol != null) {
    const sizePct = vol > 35 ? "0.5–1.0%" : vol > 25 ? "1.0–2.0%" : "2.0–3.0%";
    tactics.push({
      id: "vol-size",
      perspective: "trader",
      priority: vol > 30 ? "high" : "medium",
      title: "Vol-target position sizing",
      action: `Cap single-name risk at ${sizePct} of portfolio NAV per ${vol.toFixed(0)}% ann vol.`,
      rationale: "Citadel-style desks scale exposure inversely to realizable volatility — high vol names get smaller tickets.",
    });
  }

  if (var95 != null && risk?.latest_price) {
    tactics.push({
      id: "var-stop",
      perspective: "trader",
      priority: "high",
      title: "Daily VaR guardrail",
      action: `Treat ${Math.abs(var95).toFixed(1)}% daily VaR (95%) as soft stop — reduce if two consecutive breach days.`,
      rationale: "Jane Street risk pods cut gross when short-horizon tail loss exceeds calibrated VaR bands.",
    });
  }

  if (beta != null) {
    const hedge = beta > 1.2 ? `Overweight ${data.benchmark} short or puts` : beta < 0.8 ? "Run unhedged — low systematic load" : `Beta-neutral vs ${data.benchmark}`;
    tactics.push({
      id: "beta-hedge",
      perspective: "trader",
      priority: Math.abs(beta - 1) > 0.25 ? "high" : "low",
      title: "Systematic exposure hedge",
      action: hedge,
      rationale: `β ${beta.toFixed(2)} vs ${data.benchmark} — isolate alpha from market factor before sizing directional bets.`,
    });
  }

  if (mc?.current && mc.p05) {
    const dd = ((mc.p05 - mc.current) / mc.current) * 100;
    tactics.push({
      id: "mc-stop",
      perspective: "trader",
      priority: dd < -15 ? "high" : "medium",
      title: "Monte Carlo downside fence",
      action: `Hard review if price breaks MC p05 ($${mc.p05.toFixed(2)}, ${dd.toFixed(1)}% from spot).`,
      rationale: "Simulation cone defines acceptable tail — traders treat p05 breach as regime change, not noise.",
    });
  }

  if (rsi != null) {
    tactics.push({
      id: "rsi-tactic",
      perspective: "trader",
      priority: rsi >= 70 || rsi <= 30 ? "medium" : "low",
      title: rsi >= 70 ? "Overbought — tighten stops" : rsi <= 30 ? "Oversold — scale in slowly" : "Momentum neutral",
      action: rsi >= 70 ? "Trail stops 1.5× ATR; avoid adding long delta." : rsi <= 30 ? "Stagger entries; confirm reversal before size-up." : "Standard risk budget; no RSI override.",
      rationale: `RSI ${rsi.toFixed(0)} — tactical desks use mean-reversion flags to modulate intraday risk, not strategic view.`,
    });
  }

  if (maxDd != null) {
    tactics.push({
      id: "dd-tolerance",
      perspective: "investor",
      priority: maxDd < -25 ? "high" : "medium",
      title: "Drawdown tolerance band",
      action: maxDd < -25
        ? `Historical max DD ${maxDd.toFixed(1)}% — size for ½ that draw in base case allocation.`
        : `Max DD ${maxDd.toFixed(1)}% — suitable for core sleeve if paired with diversifiers.`,
      rationale: "Long-horizon books size to worst observed path, not average return.",
    });
  }

  if (sharpe != null) {
    tactics.push({
      id: "sharpe-sleeve",
      perspective: "investor",
      priority: sharpe >= 1 ? "medium" : sharpe < 0.5 ? "high" : "low",
      title: "Risk-adjusted sleeve weight",
      action: sharpe >= 1
        ? `Sharpe ${sharpe.toFixed(2)} — eligible for overweight vs universe (target +20–40% vs EW).`
        : sharpe < 0.5
          ? `Sharpe ${sharpe.toFixed(2)} — underweight; require alpha catalyst before adding.`
          : `Sharpe ${sharpe.toFixed(2)} — hold at equal-weight benchmark allocation.`,
      rationale: "Institutional allocators rank names by Sharpe within factor and sector constraints.",
    });
  }

  if (corr != null) {
    tactics.push({
      id: "corr-div",
      perspective: "investor",
      priority: corr > 0.75 ? "high" : "low",
      title: "Diversification check",
      action: corr > 0.75
        ? `Avg |ρ| ${corr.toFixed(2)} — pair with low-correlation names; avoid stacking same factor bet.`
        : `Correlation ${corr.toFixed(2)} — acceptable diversifier within current universe.`,
      rationale: "Citadel portfolio construction penalizes redundant factor exposure across holdings.",
    });
  }

  if (port.sharpe != null) {
    tactics.push({
      id: "ew-benchmark",
      perspective: "investor",
      priority: "medium",
      title: "Universe equal-weight anchor",
      action: `EW book: ${port.return_pct}% ret · ${port.vol_pct}% vol · Sharpe ${port.sharpe} — rebalance quarterly.`,
      rationale: "Use equal-weight portfolio as investable benchmark; active bets are deviations with explicit risk budget.",
    });
  }

  if (alpha != null) {
    tactics.push({
      id: "alpha-view",
      perspective: "investor",
      priority: Math.abs(alpha) > 5 ? "medium" : "low",
      title: "CAPM alpha conviction",
      action: alpha > 3
        ? `+${alpha.toFixed(1)}% ann alpha — justify active overweight vs ${data.benchmark}.`
        : alpha < -3
          ? `${alpha.toFixed(1)}% alpha — prefer passive beta or swap into stronger factor name.`
          : `Alpha ${alpha.toFixed(1)}% — neutral vs benchmark; focus on idiosyncratic catalysts.`,
      rationale: "Investors fund idiosyncratic risk only when regression alpha covers liquidity and tax frictions.",
    });
  }

  const topPattern = [...data.pattern_signals].sort((a, b) => b.probability - a.probability)[0];
  if (topPattern) {
    tactics.push({
      id: "pattern-risk",
      perspective: "trader",
      priority: topPattern.probability >= 65 ? "medium" : "low",
      title: `Setup: ${topPattern.label}`,
      action: topPattern.probability >= 65
        ? `${topPattern.probability}% probability — size ½ normal until confirmation; widen stop if false break.`
        : "Low conviction setup — paper trade or skip; preserve risk budget.",
      rationale: topPattern.description,
    });
  }

  const order = { high: 0, medium: 1, low: 2 };
  return tactics.sort((a, b) => order[a.priority] - order[b.priority]);
}
