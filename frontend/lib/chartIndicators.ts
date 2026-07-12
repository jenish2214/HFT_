import type { ChartBar } from "@/components/BloombergTerminalChart";

export interface IndicatorToggles {
  volume: boolean;
  sma20: boolean;
  sma50: boolean;
  ema12: boolean;
  bb: boolean;
  rsi: boolean;
  macd: boolean;
}

export const DEFAULT_INDICATORS: IndicatorToggles = {
  volume: true,
  sma20: true,
  sma50: true,
  ema12: true,
  bb: true,
  rsi: true,
  macd: true,
};

export interface ChartAnalysis {
  periodReturn: number;
  periodHigh: number;
  periodLow: number;
  rangePct: number;
  avgVolume: number;
  volatility: number;
  rsi14: number | null;
  macd: number | null;
  macdSignal: number | null;
  macdHist: number | null;
  sma20: number | null;
  sma50: number | null;
  aboveSma20: boolean;
  aboveSma50: boolean;
  trend: "Bullish" | "Bearish" | "Neutral";
  barCount: number;
}

export function sma(values: number[], period: number): (number | null)[] {
  const out: (number | null)[] = [];
  for (let i = 0; i < values.length; i++) {
    if (i < period - 1) {
      out.push(null);
      continue;
    }
    let sum = 0;
    for (let j = i - period + 1; j <= i; j++) sum += values[j];
    out.push(sum / period);
  }
  return out;
}

export function ema(values: number[], period: number): (number | null)[] {
  const out: (number | null)[] = [];
  const k = 2 / (period + 1);
  let prev: number | null = null;

  for (let i = 0; i < values.length; i++) {
    if (i < period - 1) {
      out.push(null);
      continue;
    }
    if (prev === null) {
      let sum = 0;
      for (let j = i - period + 1; j <= i; j++) sum += values[j];
      prev = sum / period;
    } else {
      prev = values[i] * k + prev * (1 - k);
    }
    out.push(prev);
  }
  return out;
}

export function rsi(closes: number[], period = 14): (number | null)[] {
  const out: (number | null)[] = [];
  if (closes.length < period + 1) return closes.map(() => null);

  let avgGain = 0;
  let avgLoss = 0;
  for (let i = 1; i <= period; i++) {
    const diff = closes[i] - closes[i - 1];
    if (diff >= 0) avgGain += diff;
    else avgLoss -= diff;
  }
  avgGain /= period;
  avgLoss /= period;

  for (let i = 0; i < period; i++) out.push(null);

  for (let i = period; i < closes.length; i++) {
    const diff = closes[i] - closes[i - 1];
    const gain = diff > 0 ? diff : 0;
    const loss = diff < 0 ? -diff : 0;
    avgGain = (avgGain * (period - 1) + gain) / period;
    avgLoss = (avgLoss * (period - 1) + loss) / period;
    const rs = avgLoss === 0 ? 100 : avgGain / avgLoss;
    out.push(100 - 100 / (1 + rs));
  }
  return out;
}

export function macd(
  closes: number[],
  fast = 12,
  slow = 26,
  signalPeriod = 9,
): { line: (number | null)[]; signal: (number | null)[]; histogram: (number | null)[] } {
  const emaFast = ema(closes, fast);
  const emaSlow = ema(closes, slow);
  const line: (number | null)[] = closes.map((_, i) => {
    if (emaFast[i] == null || emaSlow[i] == null) return null;
    return emaFast[i]! - emaSlow[i]!;
  });

  const macdValues = line.map((v) => v ?? 0);
  const signalRaw = ema(macdValues, signalPeriod);
  const signal: (number | null)[] = line.map((v, i) => (v == null ? null : signalRaw[i]));
  const histogram: (number | null)[] = line.map((v, i) => {
    if (v == null || signal[i] == null) return null;
    return v - signal[i]!;
  });

  return { line, signal, histogram };
}

export function bollinger(
  closes: number[],
  period = 20,
  stdMult = 2,
): { upper: (number | null)[]; middle: (number | null)[]; lower: (number | null)[] } {
  const middle = sma(closes, period);
  const upper: (number | null)[] = [];
  const lower: (number | null)[] = [];

  for (let i = 0; i < closes.length; i++) {
    if (middle[i] == null) {
      upper.push(null);
      lower.push(null);
      continue;
    }
    let sumSq = 0;
    for (let j = i - period + 1; j <= i; j++) {
      const d = closes[j] - middle[i]!;
      sumSq += d * d;
    }
    const std = Math.sqrt(sumSq / period);
    upper.push(middle[i]! + stdMult * std);
    lower.push(middle[i]! - stdMult * std);
  }
  return { upper, middle, lower };
}

export function computeAnalysis(bars: ChartBar[]): ChartAnalysis {
  if (bars.length === 0) {
    return {
      periodReturn: 0,
      periodHigh: 0,
      periodLow: 0,
      rangePct: 0,
      avgVolume: 0,
      volatility: 0,
      rsi14: null,
      macd: null,
      macdSignal: null,
      macdHist: null,
      sma20: null,
      sma50: null,
      aboveSma20: false,
      aboveSma50: false,
      trend: "Neutral",
      barCount: 0,
    };
  }

  const closes = bars.map((b) => b.close);
  const highs = bars.map((b) => b.high);
  const lows = bars.map((b) => b.low);
  const volumes = bars.map((b) => b.volume);
  const first = closes[0];
  const last = closes[closes.length - 1];
  const periodHigh = Math.max(...highs);
  const periodLow = Math.min(...lows);
  const periodReturn = first > 0 ? ((last - first) / first) * 100 : 0;
  const rangePct = periodLow > 0 ? ((periodHigh - periodLow) / periodLow) * 100 : 0;
  const avgVolume = volumes.reduce((a, b) => a + b, 0) / volumes.length;

  const returns: number[] = [];
  for (let i = 1; i < closes.length; i++) {
    if (closes[i - 1] > 0) returns.push((closes[i] - closes[i - 1]) / closes[i - 1]);
  }
  const volatility =
    returns.length > 1
      ? Math.sqrt(returns.reduce((s, r) => s + r * r, 0) / returns.length) * Math.sqrt(252) * 100
      : 0;

  const rsiVals = rsi(closes, 14);
  const rsi14 = rsiVals[rsiVals.length - 1];
  const { line, signal, histogram } = macd(closes);
  const sma20Vals = sma(closes, 20);
  const sma50Vals = sma(closes, 50);
  const sma20 = sma20Vals[sma20Vals.length - 1];
  const sma50 = sma50Vals[sma50Vals.length - 1];
  const aboveSma20 = sma20 != null && last >= sma20;
  const aboveSma50 = sma50 != null && last >= sma50;

  let trend: ChartAnalysis["trend"] = "Neutral";
  if (aboveSma20 && aboveSma50 && (rsi14 ?? 50) >= 50) trend = "Bullish";
  else if (!aboveSma20 && !aboveSma50 && (rsi14 ?? 50) <= 50) trend = "Bearish";

  return {
    periodReturn,
    periodHigh,
    periodLow,
    rangePct,
    avgVolume,
    volatility,
    rsi14,
    macd: line[line.length - 1],
    macdSignal: signal[signal.length - 1],
    macdHist: histogram[histogram.length - 1],
    sma20,
    sma50,
    aboveSma20,
    aboveSma50,
    trend,
    barCount: bars.length,
  };
}

export function chartPageUrl(symbol: string, timeframe: string): string {
  return `/chart?symbol=${encodeURIComponent(symbol)}&tf=${encodeURIComponent(timeframe)}`;
}
