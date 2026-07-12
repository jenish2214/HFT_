"use client";

import { useMemo, useState } from "react";
import {
  ChartDeskHeader,
  ChartFootnote,
  ChartKpiStrip,
  type KpiItem,
} from "@/components/QuantResearchDesk";
import type { QuantResearchData } from "@/lib/quantResearchTypes";

/** Institutional research palette */
export const QR_COLORS = ["#1d4ed8", "#0e7490", "#b45309", "#6d28d9", "#047857", "#be185d"];

function HoverSlot({ text }: { text: string | null }) {
  return (
    <div className="qr-hover-slot" aria-live="polite">
      <div className={`qr-hover-info mono${text ? "" : " qr-hover-info-empty"}`}>{text || "\u00a0"}</div>
    </div>
  );
}

function ChartCard({
  code,
  title,
  subtitle,
  tags,
  kpis,
  footnote,
  children,
  wide,
}: {
  code: string;
  title: string;
  subtitle?: string;
  tags?: string[];
  kpis?: KpiItem[];
  footnote?: string;
  children: React.ReactNode;
  wide?: boolean;
}) {
  return (
    <article className={`qr-chart-card${wide ? " qr-chart-card-wide" : ""}`}>
      <ChartDeskHeader code={code} title={title} subtitle={subtitle} tags={tags} />
      {kpis && kpis.length > 0 && <ChartKpiStrip items={kpis} />}
      <div className="qr-chart-body">{children}</div>
      {footnote && <ChartFootnote>{footnote}</ChartFootnote>}
    </article>
  );
}

function SvgFrame({ children, height = 260 }: { children: React.ReactNode; height?: number }) {
  return (
    <div className="qr-svg-frame" style={{ height }}>
      <svg viewBox={`0 0 640 ${height}`} className="qr-svg" preserveAspectRatio="xMidYMid meet" role="img">
        {children}
      </svg>
    </div>
  );
}

function pctChange(from: number | null | undefined, to: number | null | undefined): string {
  if (from == null || to == null || from === 0) return "—";
  const ch = ((to - from) / from) * 100;
  return `${ch >= 0 ? "+" : ""}${ch.toFixed(1)}%`;
}

function PriceSeriesChart({ data, primary }: { data: QuantResearchData; primary: string }) {
  const [tip, setTip] = useState<string | null>(null);
  const series = data.charts?.price_series ?? {};
  const keys = Object.keys(series);
  const W = 640;
  const H = 260;
  const pad = { l: 48, r: 72, t: 20, b: 36 };
  const innerW = W - pad.l - pad.r;
  const innerH = H - pad.t - pad.b;

  const { paths, min, max, stats } = useMemo(() => {
    const allVals: number[] = [];
    keys.forEach((k) => series[k].forEach((p) => { if (p.norm != null) allVals.push(p.norm); }));
    const lo = Math.min(...allVals, 98);
    const hi = Math.max(...allVals, 102);
    const range = hi - lo || 1;

    const mapped = keys.map((sym, ci) => {
      const pts = series[sym];
      const last = pts[pts.length - 1];
      const first = pts[0];
      const ret = first?.norm && last?.norm ? ((last.norm - first.norm) / first.norm) * 100 : null;
      const d = pts.map((p, i) => {
        const x = pad.l + (i / Math.max(pts.length - 1, 1)) * innerW;
        const y = pad.t + innerH - (((p.norm ?? 100) - lo) / range) * innerH;
        return `${i === 0 ? "M" : "L"}${x.toFixed(1)},${y.toFixed(1)}`;
      }).join(" ");
      const endY = pad.t + innerH - (((last?.norm ?? 100) - lo) / range) * innerH;
      return { sym, d, color: QR_COLORS[ci % QR_COLORS.length], pts, ci, ret, endY, last };
    });

    const sorted = [...mapped].sort((a, b) => (b.ret ?? 0) - (a.ret ?? 0));
    return { paths: mapped, min: lo, max: hi, stats: { best: sorted[0], worst: sorted[sorted.length - 1] } };
  }, [series, keys, innerW, innerH, pad.l, pad.t]);

  const startDate = series[keys[0]]?.[0]?.date ?? "";
  const endDate = series[keys[0]]?.[series[keys[0]]?.length - 1]?.date ?? "";

  const kpis: KpiItem[] = [
    { label: "Best", value: stats.best ? `${stats.best.sym} ${stats.best.ret != null ? `${stats.best.ret >= 0 ? "+" : ""}${stats.best.ret.toFixed(1)}%` : ""}` : "—", tone: "pos" },
    { label: "Worst", value: stats.worst ? `${stats.worst.sym} ${stats.worst.ret != null ? `${stats.worst.ret >= 0 ? "+" : ""}${stats.worst.ret.toFixed(1)}%` : ""}` : "—", tone: "neg" },
    { label: "Primary", value: paths.find((p) => p.sym === primary)?.ret != null ? `${paths.find((p) => p.sym === primary)!.ret! >= 0 ? "+" : ""}${paths.find((p) => p.sym === primary)!.ret!.toFixed(1)}%` : "—", tone: (paths.find((p) => p.sym === primary)?.ret ?? 0) >= 0 ? "pos" : "neg" },
    { label: "Universe", value: `${keys.length} names` },
  ];

  return (
    <ChartCard
      code="PX-NORM"
      title="Normalized price performance"
      subtitle="Cross-sectional return index · base 100"
      tags={[data.period, `${data.trading_days}d`, `Bench ${data.benchmark}`]}
      kpis={kpis}
      footnote={`Window ${startDate} → ${endDate} · Indexed rebased performance for relative strength analysis`}
      wide
    >
      <div className="qr-chart-wrap">
        <SvgFrame height={H}>
          {[0, 0.25, 0.5, 0.75, 1].map((f) => {
            const y = pad.t + innerH * (1 - f);
            const val = min + (max - min) * f;
            return (
              <g key={f}>
                <line x1={pad.l} y1={y} x2={W - pad.r} y2={y} className="qr-grid-line" />
                <text x={pad.l - 6} y={y + 4} textAnchor="end" className="qr-axis-label">{val.toFixed(1)}</text>
              </g>
            );
          })}
          {paths.map(({ sym, d, color, ret, endY, last }) => (
            <g key={sym}>
              <path
                d={d}
                fill="none"
                stroke={color}
                strokeWidth={sym === primary ? 2.5 : 1.75}
                opacity={sym === primary ? 1 : 0.78}
                strokeLinecap="round"
                onMouseEnter={() => setTip(`${sym} · ${last?.date} · idx ${last?.norm?.toFixed(2)} · $${last?.close?.toFixed(2)} · ${ret != null ? `${ret >= 0 ? "+" : ""}${ret.toFixed(2)}%` : ""}`)}
                onMouseLeave={() => setTip(null)}
              />
              <text x={W - pad.r + 6} y={endY + 4} className="qr-end-label mono" fill={color}>
                {sym} {ret != null ? `${ret >= 0 ? "+" : ""}${ret.toFixed(1)}%` : ""}
              </text>
            </g>
          ))}
          <text x={pad.l} y={H - 10} className="qr-axis-label">{startDate}</text>
          <text x={W - pad.r} y={H - 10} textAnchor="end" className="qr-axis-label">{endDate}</text>
        </SvgFrame>
        <HoverSlot text={tip} />
      </div>
    </ChartCard>
  );
}

function TechnicalOverlayChart({ data, primary }: { data: QuantResearchData; primary: string }) {
  const ind = data.charts?.indicators;
  const [tip, setTip] = useState<string | null>(null);
  if (!ind?.price?.length) return null;

  const W = 640;
  const H = 280;
  const pad = { l: 52, r: 12, t: 20, b: 36 };
  const innerW = W - pad.l - pad.r;
  const innerH = H - pad.t - pad.b;
  const n = ind.price.length;
  const last = n - 1;

  const lastClose = ind.price[last]?.close;
  const sma20 = ind.sma20[last]?.value;
  const sma50 = ind.sma50[last]?.value;
  const bbUp = ind.bb_upper[last]?.value;
  const bbLo = ind.bb_lower[last]?.value;
  let bbPos = "—";
  if (lastClose != null && bbUp != null && bbLo != null && bbUp > bbLo) {
    bbPos = `${(((lastClose - bbLo) / (bbUp - bbLo)) * 100).toFixed(0)}% band`;
  }

  const series = [
    ...ind.price.map((p) => p.close),
    ...ind.sma20.map((p) => p.value),
    ...ind.sma50.map((p) => p.value),
    ...ind.bb_upper.map((p) => p.value),
    ...ind.bb_lower.map((p) => p.value),
  ].filter((v): v is number => v != null);
  const min = Math.min(...series);
  const max = Math.max(...series);
  const range = max - min || 1;

  const pathFor = (arr: { value?: number | null; close?: number | null }[], valKey: "value" | "close" = "value") =>
    arr.map((p, i) => {
      const v = valKey === "close" ? p.close : p.value;
      const x = pad.l + (i / Math.max(n - 1, 1)) * innerW;
      const y = pad.t + innerH - (((v ?? min) - min) / range) * innerH;
      return `${i === 0 ? "M" : "L"}${x.toFixed(1)},${y.toFixed(1)}`;
    }).join(" ");

  const bandPath = () => {
    const top = ind.bb_upper.map((p, i) => {
      const x = pad.l + (i / Math.max(n - 1, 1)) * innerW;
      const y = pad.t + innerH - (((p.value ?? min) - min) / range) * innerH;
      return `${i === 0 ? "M" : "L"}${x.toFixed(1)},${y.toFixed(1)}`;
    }).join(" ");
    const bot = [...ind.bb_lower].reverse().map((p, ri) => {
      const i = n - 1 - ri;
      const x = pad.l + (i / Math.max(n - 1, 1)) * innerW;
      const y = pad.t + innerH - (((p.value ?? min) - min) / range) * innerH;
      return `L${x.toFixed(1)},${y.toFixed(1)}`;
    }).join(" ");
    return `${top} ${bot} Z`;
  };

  const kpis: KpiItem[] = [
    { label: "Last", value: lastClose != null ? `$${lastClose.toFixed(2)}` : "—" },
    { label: "vs SMA20", value: lastClose != null && sma20 != null ? pctChange(sma20, lastClose) : "—", tone: lastClose != null && sma20 != null && lastClose >= sma20 ? "pos" : "neg" },
    { label: "vs SMA50", value: lastClose != null && sma50 != null ? pctChange(sma50, lastClose) : "—", tone: lastClose != null && sma50 != null && lastClose >= sma50 ? "pos" : "neg" },
    { label: "SMA20", value: sma20 != null ? `$${sma20.toFixed(2)}` : "—" },
    { label: "SMA50", value: sma50 != null ? `$${sma50.toFixed(2)}` : "—" },
    { label: "BB position", value: bbPos },
  ];

  return (
    <ChartCard
      code="TA-OVR"
      title={`Price & technical overlays · ${ind.symbol}`}
      subtitle="Trend, mean-reversion, and volatility envelope"
      tags={["SMA 20/50", "Bollinger 20,2σ", primary === ind.symbol ? "Primary" : ind.symbol]}
      kpis={kpis}
      footnote={`As of ${ind.price[last]?.date ?? "—"} · Overlays computed on daily closes`}
      wide
    >
      <SvgFrame height={H}>
        {[0, 0.5, 1].map((f) => {
          const y = pad.t + innerH * (1 - f);
          const val = min + range * f;
          return (
            <g key={f}>
              <line x1={pad.l} y1={y} x2={W - pad.r} y2={y} className="qr-grid-line" />
              <text x={pad.l - 6} y={y + 4} textAnchor="end" className="qr-axis-label">${val.toFixed(0)}</text>
            </g>
          );
        })}
        <path d={bandPath()} fill="rgba(8,145,178,0.07)" stroke="none" />
        <path d={pathFor(ind.bb_upper)} fill="none" stroke="#0e7490" strokeWidth={1} strokeDasharray="3 3" opacity={0.65} />
        <path d={pathFor(ind.bb_lower)} fill="none" stroke="#0e7490" strokeWidth={1} strokeDasharray="3 3" opacity={0.65} />
        <path d={pathFor(ind.sma50)} fill="none" stroke="#b45309" strokeWidth={1.75} />
        <path d={pathFor(ind.sma20)} fill="none" stroke="#6d28d9" strokeWidth={1.75} />
        <path
          d={pathFor(ind.price, "close")}
          fill="none"
          stroke="#1d4ed8"
          strokeWidth={2.25}
          onMouseEnter={() => setTip(`${ind.symbol} · $${lastClose?.toFixed(2)} · SMA20 $${sma20?.toFixed(2)} · SMA50 $${sma50?.toFixed(2)}`)}
          onMouseLeave={() => setTip(null)}
        />
        {lastClose != null && (
          <circle
            cx={pad.l + innerW}
            cy={pad.t + innerH - ((lastClose - min) / range) * innerH}
            r={4}
            fill="#1d4ed8"
          />
        )}
      </SvgFrame>
      <HoverSlot text={tip} />
      <div className="qr-legend">
        <span className="qr-legend-item"><i style={{ background: "#1d4ed8" }} /> Close</span>
        <span className="qr-legend-item"><i style={{ background: "#6d28d9" }} /> SMA 20</span>
        <span className="qr-legend-item"><i style={{ background: "#b45309" }} /> SMA 50</span>
        <span className="qr-legend-item"><i style={{ background: "#0e7490" }} /> Bollinger</span>
      </div>
    </ChartCard>
  );
}

function pctFrom(current: number | null | undefined, target: number | null | undefined): string {
  if (current == null || target == null || current === 0) return "—";
  const ch = ((target - current) / current) * 100;
  return `${ch >= 0 ? "+" : ""}${ch.toFixed(1)}%`;
}

function MonteCarloPanel({ data, primary }: { data: QuantResearchData; primary: string }) {
  const fan = data.charts?.monte_carlo_fan;
  const mcRow = data.monte_carlo.find((m) => m.symbol === primary);
  if (!fan || !mcRow) return null;

  const W = 640;
  const H = 200;
  const pad = { l: 52, r: 12, t: 16, b: 28 };
  const innerW = W - pad.l - pad.r;
  const innerH = H - pad.t - pad.b;
  const all = [...fan.p05, ...fan.p50, ...fan.p95, fan.current ?? 0].filter((v): v is number => v != null);
  const min = Math.min(...all) * 0.98;
  const max = Math.max(...all) * 1.02;
  const range = max - min || 1;
  const n = fan.p50.length;

  const toY = (v: number | null) => pad.t + innerH - (((v ?? min) - min) / range) * innerH;
  const toX = (i: number) => pad.l + (i / Math.max(n - 1, 1)) * innerW;

  const bandPath = () => {
    const top = fan.p95.map((v, i) => `${i === 0 ? "M" : "L"}${toX(i).toFixed(1)},${toY(v).toFixed(1)}`).join(" ");
    const bot = [...fan.p05].reverse().map((v, ri) => {
      const i = n - 1 - ri;
      return `L${toX(i).toFixed(1)},${toY(v).toFixed(1)}`;
    }).join(" ");
    return `${top} ${bot} Z`;
  };

  const kpis: KpiItem[] = [
    { label: "Spot", value: `$${mcRow.current?.toFixed(2) ?? "—"}` },
    { label: "P05", value: `$${mcRow.p05?.toFixed(2) ?? "—"}`, tone: "neg" },
    { label: "Median", value: `$${mcRow.p50?.toFixed(2) ?? "—"}` },
    { label: "P95", value: `$${mcRow.p95?.toFixed(2) ?? "—"}`, tone: "pos" },
    { label: "Downside", value: pctFrom(mcRow.current, mcRow.p05), tone: "neg" },
    { label: "Upside", value: pctFrom(mcRow.current, mcRow.p95), tone: "pos" },
  ];

  return (
    <ChartCard
      code="MC-GBM"
      title="Monte Carlo simulation"
      subtitle="Geometric Brownian motion · 252-day horizon · 10k paths"
      tags={[primary, "GBM", "Risk-neutral drift from hist vol"]}
      kpis={kpis}
      footnote={`Universe EW portfolio: ${data.portfolio.equal_weight.return_pct}% ret · ${data.portfolio.equal_weight.vol_pct}% vol · Sharpe ${data.portfolio.equal_weight.sharpe}`}
      wide
    >
      <div className="qr-mc-simple">
        <div className="qr-table-wrap qr-mc-table-wrap">
          <table className="qr-table qr-table-compact">
            <thead>
              <tr>
                <th>Symbol</th><th>Spot</th><th>P05</th><th>Median</th><th>P95</th><th>Downside</th><th>Upside</th>
              </tr>
            </thead>
            <tbody>
              {data.monte_carlo.map((m) => (
                <tr key={m.symbol} className={m.symbol === primary ? "qr-row-primary" : ""}>
                  <td className="mono">{m.symbol}</td>
                  <td className="mono">${m.current?.toFixed(2) ?? "—"}</td>
                  <td className="mono">${m.p05?.toFixed(2) ?? "—"}</td>
                  <td className="mono">${m.p50?.toFixed(2) ?? "—"}</td>
                  <td className="mono">${m.p95?.toFixed(2) ?? "—"}</td>
                  <td className="mono pnl-neg">{pctFrom(m.current, m.p05)}</td>
                  <td className="mono pnl-pos">{pctFrom(m.current, m.p95)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <SvgFrame height={H}>
          <path d={bandPath()} fill="rgba(29,78,216,0.1)" stroke="none" />
          <path d={fan.p05.map((v, i) => `${i === 0 ? "M" : "L"}${toX(i).toFixed(1)},${toY(v).toFixed(1)}`).join(" ")} fill="none" stroke="#b45309" strokeWidth={1.5} strokeDasharray="4 3" />
          <path d={fan.p50.map((v, i) => `${i === 0 ? "M" : "L"}${toX(i).toFixed(1)},${toY(v).toFixed(1)}`).join(" ")} fill="none" stroke="#1d4ed8" strokeWidth={2.5} />
          <path d={fan.p95.map((v, i) => `${i === 0 ? "M" : "L"}${toX(i).toFixed(1)},${toY(v).toFixed(1)}`).join(" ")} fill="none" stroke="#047857" strokeWidth={1.5} strokeDasharray="4 3" />
          {fan.current != null && <circle cx={pad.l} cy={toY(fan.current)} r={4} fill="#6d28d9" />}
          <text x={pad.l} y={H - 8} className="qr-axis-label">T+0</text>
          <text x={W - pad.r} y={H - 8} textAnchor="end" className="qr-axis-label">T+{n}d</text>
        </SvgFrame>
      </div>
    </ChartCard>
  );
}

function FactorBarChart({ data }: { data: QuantResearchData }) {
  const [tip, setTip] = useState<string | null>(null);
  const rows = data.factor_scores;
  const maxAbs = Math.max(...rows.map((r) => Math.abs(r.composite_alpha ?? 0)), 0.01);
  const top = [...rows].sort((a, b) => (b.composite_alpha ?? 0) - (a.composite_alpha ?? 0))[0];

  return (
    <ChartCard
      code="FCTR-α"
      title="Composite factor alpha"
      subtitle="Cross-sectional z-score blend · momentum, reversal, vol, trend"
      tags={["63d momentum", "5d reversal", "SMA50 trend", "RSI 14"]}
      kpis={[{ label: "Top rank", value: top ? `${top.symbol} ${top.composite_alpha?.toFixed(3)}` : "—", tone: "pos" }]}
    >
      <div className="qr-bar-chart">
        {rows.map((r, i) => {
          const v = r.composite_alpha ?? 0;
          const pct = (Math.abs(v) / maxAbs) * 100;
          const pos = v >= 0;
          return (
            <div
              key={r.symbol}
              className="qr-hbar-row"
              onMouseEnter={() => setTip(`${r.symbol} · Mom ${((r.momentum_63d ?? 0) * 100).toFixed(1)}% · Rev ${((r.reversal_5d ?? 0) * 100).toFixed(1)}% · Trend ${((r.trend_sma50 ?? 0) * 100).toFixed(1)}% · RSI ${r.rsi_14?.toFixed(0) ?? "—"}`)}
              onMouseLeave={() => setTip(null)}
            >
              <span className="qr-hbar-label mono">{r.symbol}</span>
              <div className="qr-hbar-track">
                <div className="qr-hbar-fill" style={{ width: `${pct}%`, background: QR_COLORS[i % QR_COLORS.length], marginLeft: pos ? "50%" : `${50 - pct}%` }} />
              </div>
              <span className="qr-hbar-val mono">{v.toFixed(3)}</span>
            </div>
          );
        })}
      </div>
      <HoverSlot text={tip} />
    </ChartCard>
  );
}

function CapmChart({ data }: { data: QuantResearchData }) {
  const [tip, setTip] = useState<string | null>(null);
  const rows = data.capm;
  const W = 640;
  const H = 220;
  const pad = { l: 44, r: 16, t: 24, b: 40 };
  const barW = Math.min(52, (W - pad.l - pad.r) / Math.max(rows.length * 2.2, 1));
  const maxA = Math.max(...rows.map((r) => Math.abs(r.alpha_ann_pct ?? 0)), 1);

  return (
    <ChartCard
      code="CAPM"
      title="CAPM regression metrics"
      subtitle={`Excess return vs ${data.benchmark} · OLS alpha & beta`}
      tags={["Daily returns", "RF 4% ann", data.benchmark]}
      kpis={rows.map((r) => ({ label: r.symbol, value: `α ${r.alpha_ann_pct ?? "—"}% · β ${r.beta ?? "—"}` }))}
    >
      <SvgFrame height={H}>
        <line x1={pad.l} y1={H / 2} x2={W - pad.r} y2={H / 2} className="qr-grid-line" />
        {rows.map((r, i) => {
          const cx = pad.l + i * (barW * 2.4 + 24) + barW;
          const alphaH = ((r.alpha_ann_pct ?? 0) / maxA) * (H / 2 - pad.t - 12);
          const betaH = Math.min(((r.beta ?? 0) / 2) * (H / 2 - pad.t - 12), H / 2 - pad.t - 12);
          const alphaY = (r.alpha_ann_pct ?? 0) >= 0 ? H / 2 - alphaH : H / 2;
          return (
            <g key={r.symbol}>
              <rect x={cx - barW / 2} y={alphaY} width={barW * 0.45} height={Math.max(Math.abs(alphaH), 2)} fill={QR_COLORS[i % QR_COLORS.length]} className="qr-bar-rect" onMouseEnter={() => setTip(`${r.symbol} · α ann ${r.alpha_ann_pct}%`)} onMouseLeave={() => setTip(null)} />
              <rect x={cx + barW * 0.08} y={H / 2 - betaH} width={barW * 0.45} height={Math.max(betaH, 2)} fill="#0e7490" opacity={0.8} className="qr-bar-rect" onMouseEnter={() => setTip(`${r.symbol} · β ${r.beta}`)} onMouseLeave={() => setTip(null)} />
              <text x={cx} y={H - 12} textAnchor="middle" className="qr-axis-label qr-axis-label-bold">{r.symbol}</text>
            </g>
          );
        })}
      </SvgFrame>
      <HoverSlot text={tip} />
    </ChartCard>
  );
}

function MacdChart({ data }: { data: QuantResearchData }) {
  const ind = data.charts?.indicators;
  const [tip, setTip] = useState<string | null>(null);
  if (!ind?.macd?.length) return null;
  const last = ind.macd.length - 1;
  const macdVal = ind.macd[last]?.value;
  const sigVal = ind.macd_signal[last]?.value;
  const histVal = ind.macd_hist[last]?.value;

  const W = 640; const H = 200;
  const pad = { l: 44, r: 16, t: 16, b: 28 };
  const innerW = W - pad.l - pad.r; const innerH = H - pad.t - pad.b; const n = ind.macd.length;
  const all = [...ind.macd, ...ind.macd_signal, ...ind.macd_hist].map((p) => p.value).filter((v): v is number => v != null);
  const min = Math.min(...all, -1); const max = Math.max(...all, 1); const range = max - min || 1;
  const pathFor = (arr: { value: number | null }[], color: string, width = 2) => {
    const d = arr.map((p, i) => {
      const x = pad.l + (i / Math.max(n - 1, 1)) * innerW;
      const y = pad.t + innerH - (((p.value ?? 0) - min) / range) * innerH;
      return `${i === 0 ? "M" : "L"}${x.toFixed(1)},${y.toFixed(1)}`;
    }).join(" ");
    return <path d={d} fill="none" stroke={color} strokeWidth={width} strokeLinecap="round" />;
  };

  return (
    <ChartCard
      code="MACD"
      title={`MACD · ${ind.symbol}`}
      subtitle="12 / 26 / 9 exponential moving average convergence"
      tags={[ind.macd[last]?.date ?? "", histVal != null && histVal >= 0 ? "Bullish hist" : "Bearish hist"]}
      kpis={[
        { label: "MACD", value: macdVal?.toFixed(3) ?? "—" },
        { label: "Signal", value: sigVal?.toFixed(3) ?? "—" },
        { label: "Histogram", value: histVal?.toFixed(3) ?? "—", tone: (histVal ?? 0) >= 0 ? "pos" : "neg" },
      ]}
    >
      <SvgFrame height={H}>
        <line x1={pad.l} y1={pad.t + innerH / 2} x2={W - pad.r} y2={pad.t + innerH / 2} className="qr-grid-line" />
        {ind.macd_hist.map((p, i) => {
          if (p.value == null) return null;
          const x = pad.l + (i / Math.max(n - 1, 1)) * innerW;
          const y0 = pad.t + innerH / 2;
          const y1 = pad.t + innerH - (((p.value) - min) / range) * innerH;
          const h = Math.abs(y1 - y0); const y = Math.min(y0, y1);
          return <rect key={i} x={x - 1.5} y={y} width={3} height={Math.max(h, 1)} fill={(p.value ?? 0) >= 0 ? "#047857" : "#dc2626"} opacity={0.75} onMouseEnter={() => setTip(`${p.date} · hist ${p.value?.toFixed(3)}`)} onMouseLeave={() => setTip(null)} />;
        })}
        {pathFor(ind.macd, "#1d4ed8", 2.5)}
        {pathFor(ind.macd_signal, "#b45309", 2)}
      </SvgFrame>
      <HoverSlot text={tip} />
    </ChartCard>
  );
}

function RsiChart({ data }: { data: QuantResearchData }) {
  const rsi = data.charts?.rsi ?? [];
  const latest = rsi[rsi.length - 1]?.rsi;
  if (!rsi.length) return null;
  const W = 640; const H = 200;
  const pad = { l: 40, r: 16, t: 16, b: 28 };
  const innerW = W - pad.l - pad.r; const innerH = H - pad.t - pad.b;
  const d = rsi.map((p, i) => {
    const x = pad.l + (i / Math.max(rsi.length - 1, 1)) * innerW;
    const y = pad.t + innerH - ((p.rsi ?? 50) / 100) * innerH;
    return `${i === 0 ? "M" : "L"}${x.toFixed(1)},${y.toFixed(1)}`;
  }).join(" ");

  let regime = "Neutral";
  if (latest != null) {
    if (latest >= 70) regime = "Overbought";
    else if (latest <= 30) regime = "Oversold";
  }

  return (
    <ChartCard
      code="RSI"
      title={`RSI (14) · ${data.primary}`}
      subtitle="Wilder smoothed relative strength index"
      tags={[regime, latest != null ? `Level ${latest.toFixed(1)}` : ""]}
      kpis={[
        { label: "Latest", value: latest?.toFixed(1) ?? "—" },
        { label: "Regime", value: regime, tone: regime === "Overbought" ? "neg" : regime === "Oversold" ? "pos" : "neutral" },
      ]}
    >
      <SvgFrame height={H}>
        <rect x={pad.l} y={pad.t} width={innerW} height={innerH * 0.3} fill="rgba(239,68,68,0.06)" />
        <rect x={pad.l} y={pad.t + innerH * 0.7} width={innerW} height={innerH * 0.3} fill="rgba(16,185,129,0.06)" />
        <line x1={pad.l} y1={pad.t + innerH * 0.7} x2={W - pad.r} y2={pad.t + innerH * 0.7} stroke="#fca5a5" strokeDasharray="4 3" />
        <line x1={pad.l} y1={pad.t + innerH * 0.3} x2={W - pad.r} y2={pad.t + innerH * 0.3} stroke="#86efac" strokeDasharray="4 3" />
        <text x={W - pad.r - 4} y={pad.t + 12} textAnchor="end" className="qr-axis-label">70 OB</text>
        <text x={W - pad.r - 4} y={pad.t + innerH - 4} textAnchor="end" className="qr-axis-label">30 OS</text>
        <path d={d} fill="none" stroke="#6d28d9" strokeWidth={2} strokeLinecap="round" />
      </SvgFrame>
    </ChartCard>
  );
}

function PatternChart({ data }: { data: QuantResearchData }) {
  const [tip, setTip] = useState<string | null>(null);
  const top = [...data.pattern_signals].sort((a, b) => b.probability - a.probability)[0];

  return (
    <ChartCard
      code="PATT"
      title="Pattern recognition"
      subtitle="Rule-based technical setup probabilities"
      kpis={[{ label: "Highest", value: top ? `${top.label} ${top.probability}%` : "—" }]}
    >
      <div className="qr-pattern-bars">
        {data.pattern_signals.map((s, i) => (
          <div key={s.label} className="qr-pattern-row" onMouseEnter={() => setTip(`${s.label} (${s.probability}%) · ${s.description}`)} onMouseLeave={() => setTip(null)}>
            <span className="qr-pattern-label">{s.label}</span>
            <div className="qr-pattern-track"><div className="qr-pattern-fill" style={{ width: `${s.probability}%`, background: QR_COLORS[i % QR_COLORS.length] }} /></div>
            <span className="mono qr-pattern-pct">{s.probability}%</span>
          </div>
        ))}
      </div>
      <HoverSlot text={tip} />
    </ChartCard>
  );
}

function CorrHeatmap({ data }: { data: QuantResearchData }) {
  const [tip, setTip] = useState<string | null>(null);
  const { symbols, values } = data.correlation;

  const cellColor = (v: number) => {
    if (v >= 0.7) return "rgba(29,78,216,0.42)";
    if (v >= 0.3) return "rgba(14,116,144,0.28)";
    if (v >= 0) return "rgba(148,163,184,0.18)";
    if (v >= -0.3) return "rgba(217,119,6,0.2)";
    return "rgba(220,38,38,0.25)";
  };

  return (
    <ChartCard
      code="CORR"
      title="Return correlation matrix"
      subtitle="Pearson pairwise correlation · daily log returns"
      tags={[`${symbols.length}×${symbols.length}`, data.period]}
      footnote="High correlation → reduced diversification benefit in portfolio construction"
    >
      <div className="qr-heatmap">
        <div className="qr-heatmap-row qr-heatmap-head">
          <div className="qr-heatmap-cell" />
          {symbols.map((s) => <div key={s} className="qr-heatmap-cell mono">{s}</div>)}
        </div>
        {symbols.map((rowSym, i) => (
          <div key={rowSym} className="qr-heatmap-row">
            <div className="qr-heatmap-cell mono qr-heatmap-row-label">{rowSym}</div>
            {values[i]?.map((v, j) => (
              <div key={`${rowSym}-${symbols[j]}`} className="qr-heatmap-cell mono" style={{ background: cellColor(v) }} onMouseEnter={() => setTip(`${rowSym} × ${symbols[j]} · ρ = ${v.toFixed(3)}`)} onMouseLeave={() => setTip(null)}>
                {v.toFixed(2)}
              </div>
            ))}
          </div>
        ))}
      </div>
      <HoverSlot text={tip} />
    </ChartCard>
  );
}

interface Props {
  data: QuantResearchData;
  primary: string;
}

export default function QuantResearchCharts({ data, primary }: Props) {
  return (
    <section className="site-section site-section-wide qr-charts-section">
      <div className="qr-analytics-head">
        <span className="qr-analytics-code mono">ANALYTICS</span>
        <div>
          <h2 className="site-section-title">Research analytics</h2>
          <p className="site-section-lead">
            Institutional-grade factor, risk, and simulation outputs — all panels tagged with model, horizon, and as-of context.
          </p>
        </div>
      </div>
      <div className="qr-charts-grid">
        <PriceSeriesChart data={data} primary={primary} />
        <TechnicalOverlayChart data={data} primary={primary} />
        <MonteCarloPanel data={data} primary={primary} />
        <MacdChart data={data} />
        <FactorBarChart data={data} />
        <CapmChart data={data} />
        <RsiChart data={data} />
        <PatternChart data={data} />
        <CorrHeatmap data={data} />
      </div>
    </section>
  );
}
