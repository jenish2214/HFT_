import type { QuantPredictions, QuantResearchData } from "@/lib/quantResearchTypes";

/** Client fallback when API cache predates predictions payload. */
export function resolvePredictions(data: QuantResearchData, primary: string): QuantPredictions {
  if (data.predictions) return data.predictions;

  const patterns = data.pattern_signals ?? [];
  const mc = data.monte_carlo.find((m) => m.symbol === primary) ?? data.monte_carlo[0];
  const factor = data.factor_scores.find((f) => f.symbol === primary) ?? data.factor_scores[0];

  const patternAvg = patterns.length
    ? patterns.reduce((s, p) => s + p.probability, 0) / patterns.length
    : 50;
  const topPattern = patterns.length
    ? [...patterns].sort((a, b) => b.probability - a.probability)[0]
    : null;

  let mcUp = 50;
  if (mc?.current && mc.p50) {
    mcUp = Math.min(88, Math.max(12, 50 + ((mc.p50 - mc.current) / mc.current) * 180));
  }

  let alphaScore = 50;
  if (factor?.composite_alpha != null) {
    alphaScore = Math.min(88, Math.max(12, 50 + factor.composite_alpha * 35));
  }

  const bullishScore = patternAvg * 0.4 + mcUp * 0.35 + alphaScore * 0.25;
  const outlook = bullishScore >= 62 ? "Bullish" : bullishScore <= 42 ? "Bearish" : "Neutral";

  let up = Math.min(78, Math.max(12, bullishScore * 0.85));
  let down = Math.min(78, Math.max(12, (100 - bullishScore) * 0.75));
  let flat = Math.max(8, 100 - up - down);
  const total = up + flat + down;
  up = Math.round((up * 100) / total);
  flat = Math.round((flat * 100) / total);
  down = 100 - up - flat;

  const confidence = Math.min(92, Math.max(38, Math.abs(bullishScore - 50) * 1.6 + 42));

  return {
    outlook,
    confidence: Math.round(confidence),
    headline:
      outlook === "Bullish"
        ? `${primary} — demo scorecard skews positive (study exercise only)`
        : outlook === "Bearish"
          ? `${primary} — demo scorecard skews defensive (study exercise only)`
          : `${primary} — mixed demo scores; for learning, not trading decisions`,
    bullish_score: Math.round(bullishScore * 10) / 10,
    scenarios: [
      { label: "Higher", probability: up, hint: "Demo exercise: price above current in simulation" },
      { label: "Range", probability: flat, hint: "Demo exercise: sideways mixed-factor scenario" },
      { label: "Lower", probability: down, hint: "Demo exercise: pullback / vol expansion study" },
    ],
    signals: patterns,
    models: [
      {
        id: "cpp-engine",
        name: "HFT Matching Engine",
        stack: "C++",
        role: "Low-latency execution & book stats",
        status: data.engine?.status ?? "offline",
      },
      {
        id: "factor-engine",
        name: "Factor Engine",
        stack: "Python",
        role: "Momentum, reversal, composite α",
        status: "live",
      },
      {
        id: "pattern-model",
        name: "Pattern Model",
        stack: "Python",
        role: "RSI, MACD, Bollinger probabilities",
        status: "live",
      },
      {
        id: "monte-carlo",
        name: "Monte Carlo GBM",
        stack: "Python",
        role: "1Y price path simulation",
        status: "live",
      },
    ],
    top_signal: topPattern ? { label: topPattern.label, probability: topPattern.probability } : null,
    price_band:
      mc?.current != null && mc.p05 != null && mc.p50 != null && mc.p95 != null
        ? { current: mc.current, low: mc.p05, mid: mc.p50, high: mc.p95 }
        : undefined,
  };
}

export function outlookClass(outlook: QuantPredictions["outlook"]): string {
  if (outlook === "Bullish") return "qr-pred-bull";
  if (outlook === "Bearish") return "qr-pred-bear";
  return "qr-pred-neutral";
}

export function scenarioClass(label: string): string {
  if (label === "Higher") return "qr-pred-scenario-up";
  if (label === "Lower") return "qr-pred-scenario-down";
  return "qr-pred-scenario-flat";
}
