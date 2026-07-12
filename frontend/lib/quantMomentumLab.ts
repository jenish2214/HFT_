import type { QuantMomentumLab, QuantResearchData } from "@/lib/quantResearchTypes";

function lastIndicatorValue(
  series: { value: number | null }[] | undefined,
): number | null {
  if (!series?.length) return null;
  for (let i = series.length - 1; i >= 0; i -= 1) {
    const v = series[i]?.value;
    if (v != null) return v;
  }
  return null;
}

/** Client fallback when API cache predates momentum_lab payload. */
export function resolveMomentumLab(data: QuantResearchData, primary: string): QuantMomentumLab {
  if (data.momentum_lab?.data_found) return data.momentum_lab;

  const factor = data.factor_scores.find((f) => f.symbol === primary) ?? data.factor_scores[0];
  const risk = data.risk_metrics.find((r) => r.symbol === primary);
  const ind = data.charts?.indicators;
  const current = risk?.latest_price ?? ind?.price?.[ind.price.length - 1]?.close ?? null;
  const sma20 = lastIndicatorValue(ind?.sma20);
  const sma50 = lastIndicatorValue(ind?.sma50);
  const mom63 = factor?.momentum_63d ?? 0;

  if (current == null || sma20 == null || sma50 == null) {
    return { data_found: false };
  }

  let regime = "Weak / below trend";
  let studyBuy = Math.min(sma50, current * 0.97);
  let lesson =
    "Weaker momentum vs SMA50 — study waiting for trend repair before sizing risk in paper portfolios.";

  if (current > sma20 && sma20 > sma50 && mom63 > 0.03) {
    regime = "Strong momentum";
    studyBuy = sma20;
    lesson = `Strong momentum — study level near SMA20 ($${sma20.toFixed(2)}).`;
  } else if (current > sma50 && mom63 > 0) {
    regime = "Moderate momentum";
    studyBuy = sma50;
    lesson = `Moderate momentum — study level near SMA50 ($${sma50.toFixed(2)}).`;
  } else {
    studyBuy = Math.min(sma50, current * 0.97);
    lesson = `Weaker momentum — study level near $${studyBuy.toFixed(2)}.`;
  }

  const distPct = Math.round(((studyBuy - current) / current) * 10000) / 100;

  return {
    data_found: true,
    symbol: primary,
    current_price: current,
    momentum_regime: regime,
    momentum_63d_pct: Math.round(mom63 * 10000) / 100,
    rsi_14: factor?.rsi_14 ?? null,
    study_buy_price: Math.round(studyBuy * 100) / 100,
    distance_from_current_pct: distPct,
    zones: [
      { label: "SMA20 study level", price: Math.round(sma20 * 100) / 100, role: "Short-term momentum pullback" },
      { label: "SMA50 study level", price: Math.round(sma50 * 100) / 100, role: "Medium-term trend support" },
      {
        label: "Momentum study entry",
        price: Math.round(studyBuy * 100) / 100,
        role: `Demo level for ${regime.toLowerCase()}`,
        highlight: true,
      },
    ],
    lesson,
  };
}

export function regimeClass(regime?: string): string {
  if (!regime) return "qr-edu-regime-neutral";
  if (regime.toLowerCase().includes("strong")) return "qr-edu-regime-strong";
  if (regime.toLowerCase().includes("moderate")) return "qr-edu-regime-moderate";
  return "qr-edu-regime-weak";
}
