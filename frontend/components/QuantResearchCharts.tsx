"use client";

import { useMemo, useState } from "react";
import type { QuantResearchData } from "@/lib/quantResearchTypes";

/** Light research palette — no black backgrounds */
export const QR_COLORS = ["#2563eb", "#0891b2", "#d97706", "#7c3aed", "#059669", "#db2777"];

function HoverSlot({ text }: { text: string | null }) {
  return (
    <div className="qr-hover-slot" aria-live="polite">
      <div className={`qr-hover-info mono${text ? "" : " qr-hover-info-empty"}`}>
        {text || "\u00a0"}
      </div>
    </div>
  );
}

function ChartCard({
  title,
  subtitle,
  children,
  wide,
}: {
  title: string;
  subtitle?: string;
  children: React.ReactNode;
  wide?: boolean;
}) {
  return (
    <article className={`qr-chart-card${wide ? " qr-chart-card-wide" : ""}`}>
      <header className="qr-chart-head">
        <h3 className="qr-chart-title">{title}</h3>
        {subtitle && <p className="qr-chart-sub">{subtitle}</p>}
      </header>
      <div className="qr-chart-body">{children}</div>
    </article>
  );
}

function SvgFrame({ children, height = 260 }: { children: React.ReactNode; height?: number }) {
  return (
    <svg viewBox={`0 0 640 ${height}`} className="qr-svg" role="img" preserveAspectRatio="none">
      {children}
    </svg>
  );
}

function PriceSeriesChart({ data, primary }: { data: QuantResearchData; primary: string }) {
  const [tip, setTip] = useState<string | null>(null);
  const [crossX, setCrossX] = useState<number | null>(null);
  const series = data.charts?.price_series ?? {};
  const keys = Object.keys(series);
  const W = 640;
  const H = 260;
  const pad = { l: 48, r: 16, t: 20, b: 32 };
  const innerW = W - pad.l - pad.r;
  const innerH = H - pad.t - pad.b;

  const { paths, min, max } = useMemo(() => {
    const allVals: number[] = [];
    keys.forEach((k) => series[k].forEach((p) => { if (p.norm != null) allVals.push(p.norm); }));
    const lo = Math.min(...allVals, 95);
    const hi = Math.max(...allVals, 105);
    const range = hi - lo || 1;

    const mapped = keys.map((sym, ci) => {
      const pts = series[sym];
      const d = pts.map((p, i) => {
        const x = pad.l + (i / Math.max(pts.length - 1, 1)) * innerW;
        const y = pad.t + innerH - (((p.norm ?? 100) - lo) / range) * innerH;
        return `${i === 0 ? "M" : "L"}${x.toFixed(1)},${y.toFixed(1)}`;
      }).join(" ");
      return { sym, d, color: QR_COLORS[ci % QR_COLORS.length], pts, ci };
    });
    return { paths: mapped, min: lo, max: hi };
  }, [series, keys, innerW, innerH, pad.l, pad.t]);

  const gridY = 5;

  return (
    <ChartCard title="Normalized price performance" subtitle="Indexed to 100 · point values shown below chart">
      <div className="qr-chart-wrap">
        <SvgFrame height={H}>
          {[...Array(gridY + 1)].map((_, i) => {
            const y = pad.t + (innerH / gridY) * i;
            const val = max - ((max - min) / gridY) * i;
            return (
              <g key={i}>
                <line x1={pad.l} y1={y} x2={W - pad.r} y2={y} className="qr-grid-line" />
                <text x={pad.l - 8} y={y + 4} textAnchor="end" className="qr-axis-label">{val.toFixed(1)}</text>
              </g>
            );
          })}
          {crossX != null && (
            <line x1={crossX} y1={pad.t} x2={crossX} y2={pad.t + innerH} className="qr-crosshair" />
          )}
          {paths.map(({ sym, d, color, pts }) => (
            <g key={sym}>
              <path
                d={d}
                fill="none"
                stroke={color}
                strokeWidth={sym === primary ? 3 : 2}
                opacity={sym === primary ? 1 : 0.82}
                strokeLinecap="round"
                strokeLinejoin="round"
              />
              {pts.map((p, i) => {
                if (i % Math.ceil(pts.length / 14) !== 0 && i !== pts.length - 1) return null;
                const x = pad.l + (i / Math.max(pts.length - 1, 1)) * innerW;
                const y = pad.t + innerH - (((p.norm ?? 100) - min) / (max - min || 1)) * innerH;
                return (
                  <circle
                    key={`${sym}-${i}`}
                    cx={x}
                    cy={y}
                    r={sym === primary ? 5 : 4}
                    fill={color}
                    stroke="#fff"
                    strokeWidth={1.5}
                    className="qr-dot"
                    onMouseEnter={() => {
                      setCrossX(x);
                      setTip(`${sym} · ${p.date} · index ${p.norm?.toFixed(1)} · close $${p.close?.toFixed(2)}`);
                    }}
                    onMouseLeave={() => { setCrossX(null); setTip(null); }}
                  />
                );
              })}
            </g>
          ))}
          <text x={pad.l} y={H - 8} className="qr-axis-label">Start</text>
          <text x={W - pad.r} y={H - 8} textAnchor="end" className="qr-axis-label">Latest</text>
        </SvgFrame>
        <HoverSlot text={tip} />
        <div className="qr-legend">
          {paths.map(({ sym, color }) => (
            <span key={sym} className={`qr-legend-item${sym === primary ? " qr-legend-primary" : ""}`}>
              <i style={{ background: color }} /> {sym}
            </span>
          ))}
        </div>
      </div>
    </ChartCard>
  );
}

function FactorBarChart({ data }: { data: QuantResearchData }) {
  const [tip, setTip] = useState<string | null>(null);
  const rows = data.factor_scores;
  const maxAbs = Math.max(...rows.map((r) => Math.abs(r.composite_alpha ?? 0)), 0.01);

  return (
    <ChartCard title="Composite alpha score" subtitle="Cross-sectional factor rank">
      <div className="qr-bar-chart">
        {rows.map((r, i) => {
          const v = r.composite_alpha ?? 0;
          const pct = (Math.abs(v) / maxAbs) * 100;
          const pos = v >= 0;
          return (
            <div
              key={r.symbol}
              className="qr-hbar-row"
              onMouseEnter={() => setTip(`${r.symbol} · Mom ${((r.momentum_63d ?? 0) * 100).toFixed(1)}% · Reversal ${((r.reversal_5d ?? 0) * 100).toFixed(1)}% · RSI ${r.rsi_14?.toFixed(0) ?? "—"}`)}
              onMouseLeave={() => setTip(null)}
            >
              <span className="qr-hbar-label mono">{r.symbol}</span>
              <div className="qr-hbar-track">
                <div
                  className="qr-hbar-fill"
                  style={{
                    width: `${pct}%`,
                    background: QR_COLORS[i % QR_COLORS.length],
                    marginLeft: pos ? "50%" : `${50 - pct}%`,
                  }}
                />
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
    <ChartCard title="CAPM alpha & beta" subtitle={`vs ${data.benchmark}`}>
      <SvgFrame height={H}>
        <line x1={pad.l} y1={H / 2} x2={W - pad.r} y2={H / 2} className="qr-grid-line" />
        <text x={pad.l - 4} y={H / 2 - 4} textAnchor="end" className="qr-axis-label">0</text>
        {rows.map((r, i) => {
          const cx = pad.l + i * (barW * 2.4 + 24) + barW;
          const alphaH = ((r.alpha_ann_pct ?? 0) / maxA) * (H / 2 - pad.t - 12);
          const betaH = Math.min(((r.beta ?? 0) / 2) * (H / 2 - pad.t - 12), H / 2 - pad.t - 12);
          const alphaY = (r.alpha_ann_pct ?? 0) >= 0 ? H / 2 - alphaH : H / 2;
          return (
            <g key={r.symbol}>
              <rect
                x={cx - barW / 2}
                y={alphaY}
                width={barW * 0.45}
                height={Math.max(Math.abs(alphaH), 2)}
                fill={QR_COLORS[i % QR_COLORS.length]}
                opacity={0.92}
                rx={3}
                className="qr-bar-rect"
                onMouseEnter={() => setTip(`${r.symbol} · annualized alpha ${r.alpha_ann_pct}%`)}
                onMouseLeave={() => setTip(null)}
              />
              <rect
                x={cx + barW * 0.08}
                y={H / 2 - betaH}
                width={barW * 0.45}
                height={Math.max(betaH, 2)}
                fill="#0891b2"
                opacity={0.75}
                rx={3}
                className="qr-bar-rect"
                onMouseEnter={() => setTip(`${r.symbol} · beta ${r.beta} vs ${data.benchmark}`)}
                onMouseLeave={() => setTip(null)}
              />
              <text x={cx} y={H - 12} textAnchor="middle" className="qr-axis-label qr-axis-label-bold">{r.symbol}</text>
            </g>
          );
        })}
      </SvgFrame>
      <HoverSlot text={tip} />
      <p className="qr-chart-legend-inline">■ Alpha (color) · ■ Beta (teal)</p>
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
  const mcRow = data.monte_carlo.find((m) => m.symbol === primary) ?? data.monte_carlo[0];
  const [tip, setTip] = useState<string | null>(null);
  const [dayIdx, setDayIdx] = useState<number | null>(null);

  if (!fan) return null;

  const W = 640;
  const H = 200;
  const pad = { l: 52, r: 16, t: 20, b: 32 };
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

  const scenarios = [
    { label: "Bear (5th)", value: mcRow?.p05 ?? fan.p05[n - 1], color: "#f59e0b", pct: pctFrom(fan.current, mcRow?.p05 ?? fan.p05[n - 1]) },
    { label: "Median", value: mcRow?.p50 ?? fan.p50[n - 1], color: "#2563eb", pct: pctFrom(fan.current, mcRow?.p50 ?? fan.p50[n - 1]) },
    { label: "Bull (95th)", value: mcRow?.p95 ?? fan.p95[n - 1], color: "#059669", pct: pctFrom(fan.current, mcRow?.p95 ?? fan.p95[n - 1]) },
  ];

  return (
    <ChartCard
      wide
      title={`Monte Carlo scenarios · ${primary}`}
      subtitle="63-day GBM forecast · cone shows confidence band · scenario cards at terminal"
    >
      <div className="qr-mc-layout">
        <div className="qr-mc-scenarios">
          <div className="qr-mc-current">
            <span className="qr-mc-current-label">Current</span>
            <strong className="mono">${fan.current?.toFixed(2) ?? "—"}</strong>
          </div>
          {scenarios.map((s) => (
            <div key={s.label} className="qr-mc-scenario" style={{ borderLeftColor: s.color }}>
              <span className="qr-mc-scenario-label">{s.label}</span>
              <strong className="mono" style={{ color: s.color }}>${s.value?.toFixed(2) ?? "—"}</strong>
              <span className="mono qr-mc-scenario-pct">{s.pct}</span>
            </div>
          ))}
        </div>

        <div className="qr-chart-wrap qr-mc-chart">
          <SvgFrame height={H}>
            <defs>
              <linearGradient id="mc-band-grad" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="#2563eb" stopOpacity="0.22" />
                <stop offset="100%" stopColor="#0891b2" stopOpacity="0.08" />
              </linearGradient>
            </defs>
            {[0, 0.25, 0.5, 0.75, 1].map((f) => {
              const y = pad.t + innerH * (1 - f);
              const val = min + range * f;
              return (
                <g key={f}>
                  <line x1={pad.l} y1={y} x2={W - pad.r} y2={y} className="qr-grid-line" />
                  <text x={pad.l - 8} y={y + 4} textAnchor="end" className="qr-axis-label">${val.toFixed(0)}</text>
                </g>
              );
            })}
            <path d={bandPath()} fill="url(#mc-band-grad)" stroke="none" />
            <path d={fan.p05.map((v, i) => `${i === 0 ? "M" : "L"}${toX(i).toFixed(1)},${toY(v).toFixed(1)}`).join(" ")} fill="none" stroke="#f59e0b" strokeWidth={1.5} strokeDasharray="5 4" opacity={0.9} />
            <path d={fan.p95.map((v, i) => `${i === 0 ? "M" : "L"}${toX(i).toFixed(1)},${toY(v).toFixed(1)}`).join(" ")} fill="none" stroke="#059669" strokeWidth={1.5} strokeDasharray="5 4" opacity={0.9} />
            <path d={fan.p50.map((v, i) => `${i === 0 ? "M" : "L"}${toX(i).toFixed(1)},${toY(v).toFixed(1)}`).join(" ")} fill="none" stroke="#2563eb" strokeWidth={3} strokeLinecap="round" />
            {fan.current != null && (
              <circle cx={pad.l} cy={toY(fan.current)} r={6} fill="#7c3aed" stroke="#fff" strokeWidth={2} />
            )}
            {fan.p50.map((v, i) => {
              if (i % 6 !== 0 && i !== n - 1) return null;
              const x = toX(i);
              const y = toY(v);
              return (
                <circle
                  key={i}
                  cx={x}
                  cy={y}
                  r={dayIdx === i ? 6 : 4}
                  fill="#2563eb"
                  stroke="#fff"
                  strokeWidth={1.5}
                  className="qr-dot"
                  onMouseEnter={() => {
                    setDayIdx(i);
                    setTip(`Day ${i + 1} · median $${v?.toFixed(2)} · band $${fan.p05[i]?.toFixed(2)} – $${fan.p95[i]?.toFixed(2)}`);
                  }}
                  onMouseLeave={() => { setDayIdx(null); setTip(null); }}
                />
              );
            })}
            <text x={pad.l} y={H - 8} className="qr-axis-label">Today</text>
            <text x={W - pad.r} y={H - 8} textAnchor="end" className="qr-axis-label">Day {n}</text>
          </SvgFrame>
          <div className="qr-mc-legend">
            <span><i style={{ background: "#f59e0b" }} /> Bear p05</span>
            <span><i style={{ background: "#2563eb" }} /> Median path</span>
            <span><i style={{ background: "#059669" }} /> Bull p95</span>
            <span><i style={{ background: "#7c3aed" }} /> Spot</span>
          </div>
          <HoverSlot text={tip} />
        </div>
      </div>
    </ChartCard>
  );
}

function MacdChart({ data }: { data: QuantResearchData }) {
  const ind = data.charts?.indicators;
  const [tip, setTip] = useState<string | null>(null);
  if (!ind?.macd?.length) return null;

  const W = 640;
  const H = 200;
  const pad = { l: 44, r: 16, t: 16, b: 28 };
  const innerW = W - pad.l - pad.r;
  const innerH = H - pad.t - pad.b;
  const n = ind.macd.length;

  const all = [...ind.macd, ...ind.macd_signal, ...ind.macd_hist]
    .map((p) => p.value).filter((v): v is number => v != null);
  const min = Math.min(...all, -1);
  const max = Math.max(...all, 1);
  const range = max - min || 1;

  const pathFor = (arr: { value: number | null }[], color: string, width = 2) => {
    const d = arr.map((p, i) => {
      const x = pad.l + (i / Math.max(n - 1, 1)) * innerW;
      const y = pad.t + innerH - (((p.value ?? 0) - min) / range) * innerH;
      return `${i === 0 ? "M" : "L"}${x.toFixed(1)},${y.toFixed(1)}`;
    }).join(" ");
    return <path d={d} fill="none" stroke={color} strokeWidth={width} strokeLinecap="round" />;
  };

  return (
    <ChartCard title={`MACD · ${ind.symbol}`} subtitle="12/26/9 · line, signal, histogram">
      <SvgFrame height={H}>
        <line x1={pad.l} y1={pad.t + innerH / 2} x2={W - pad.r} y2={pad.t + innerH / 2} className="qr-grid-line" />
        {ind.macd_hist.map((p, i) => {
          if (p.value == null) return null;
          const x = pad.l + (i / Math.max(n - 1, 1)) * innerW;
          const y0 = pad.t + innerH / 2;
          const y1 = pad.t + innerH - (((p.value) - min) / range) * innerH;
          const h = Math.abs(y1 - y0);
          const y = Math.min(y0, y1);
          return (
            <rect
              key={i}
              x={x - 1.5}
              y={y}
              width={3}
              height={Math.max(h, 1)}
              fill={(p.value ?? 0) >= 0 ? "#059669" : "#dc2626"}
              opacity={0.75}
              onMouseEnter={() => setTip(`${p.date} · MACD hist ${p.value?.toFixed(3)}`)}
              onMouseLeave={() => setTip(null)}
            />
          );
        })}
        {pathFor(ind.macd, "#2563eb", 2.5)}
        {pathFor(ind.macd_signal, "#d97706", 2)}
      </SvgFrame>
      <HoverSlot text={tip} />
    </ChartCard>
  );
}

function TechnicalOverlayChart({ data }: { data: QuantResearchData }) {
  const ind = data.charts?.indicators;
  const [tip, setTip] = useState<string | null>(null);
  if (!ind?.price?.length) return null;

  const W = 640;
  const H = 260;
  const pad = { l: 48, r: 16, t: 20, b: 32 };
  const innerW = W - pad.l - pad.r;
  const innerH = H - pad.t - pad.b;
  const n = ind.price.length;

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

  const pathFor = (arr: { date: string; value?: number | null; close?: number | null }[], valKey: "value" | "close" = "value") => {
    return arr.map((p, i) => {
      const v = valKey === "close" ? p.close : p.value;
      const x = pad.l + (i / Math.max(n - 1, 1)) * innerW;
      const y = pad.t + innerH - (((v ?? min) - min) / range) * innerH;
      return `${i === 0 ? "M" : "L"}${x.toFixed(1)},${y.toFixed(1)}`;
    }).join(" ");
  };

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

  return (
    <ChartCard wide title={`Price & overlays · ${ind.symbol}`} subtitle="SMA 20/50 · Bollinger bands (20, 2σ)">
      <SvgFrame height={H}>
        {[0, 0.5, 1].map((f) => {
          const y = pad.t + innerH * (1 - f);
          const val = min + range * f;
          return (
            <g key={f}>
              <line x1={pad.l} y1={y} x2={W - pad.r} y2={y} className="qr-grid-line" />
              <text x={pad.l - 8} y={y + 4} textAnchor="end" className="qr-axis-label">${val.toFixed(0)}</text>
            </g>
          );
        })}
        <path d={bandPath()} fill="rgba(8,145,178,0.1)" stroke="none" />
        <path d={pathFor(ind.bb_upper)} fill="none" stroke="#0891b2" strokeWidth={1} strokeDasharray="4 3" opacity={0.7} />
        <path d={pathFor(ind.bb_lower)} fill="none" stroke="#0891b2" strokeWidth={1} strokeDasharray="4 3" opacity={0.7} />
        <path d={pathFor(ind.sma50)} fill="none" stroke="#d97706" strokeWidth={2} />
        <path d={pathFor(ind.sma20)} fill="none" stroke="#7c3aed" strokeWidth={2} />
        <path d={pathFor(ind.price, "close")} fill="none" stroke="#2563eb" strokeWidth={2.5} />
      </SvgFrame>
      <HoverSlot text={tip ?? `${ind.symbol} · blue price · purple SMA20 · amber SMA50 · teal Bollinger`} />
      <div className="qr-legend">
        <span className="qr-legend-item"><i style={{ background: "#2563eb" }} /> Price</span>
        <span className="qr-legend-item"><i style={{ background: "#7c3aed" }} /> SMA 20</span>
        <span className="qr-legend-item"><i style={{ background: "#d97706" }} /> SMA 50</span>
        <span className="qr-legend-item"><i style={{ background: "#0891b2" }} /> Bollinger</span>
      </div>
    </ChartCard>
  );
}

function RsiChart({ data }: { data: QuantResearchData }) {
  const rsi = data.charts?.rsi ?? [];
  const [tip, setTip] = useState<string | null>(null);
  if (!rsi.length) return null;

  const W = 640;
  const H = 200;
  const pad = { l: 40, r: 16, t: 16, b: 28 };
  const innerW = W - pad.l - pad.r;
  const innerH = H - pad.t - pad.b;

  const d = rsi.map((p, i) => {
    const x = pad.l + (i / Math.max(rsi.length - 1, 1)) * innerW;
    const y = pad.t + innerH - ((p.rsi ?? 50) / 100) * innerH;
    return `${i === 0 ? "M" : "L"}${x.toFixed(1)},${y.toFixed(1)}`;
  }).join(" ");

  const zone = (top: number, h: number, fill: string, label: string, yLabel: number) => (
    <g>
      <rect x={pad.l} y={top} width={innerW} height={h} fill={fill} rx={2} />
      <text x={W - pad.r - 4} y={yLabel} textAnchor="end" className="qr-axis-label">{label}</text>
    </g>
  );

  return (
    <ChartCard title={`RSI (14) · ${data.primary}`} subtitle="Momentum tactic · overbought / oversold zones">
      <SvgFrame height={H}>
        {zone(pad.t, innerH * 0.3, "rgba(239,68,68,0.08)", "Overbought 70", pad.t + 12)}
        {zone(pad.t + innerH * 0.7, innerH * 0.3, "rgba(16,185,129,0.08)", "Oversold 30", pad.t + innerH - 6)}
        <line x1={pad.l} y1={pad.t + innerH * 0.7} x2={W - pad.r} y2={pad.t + innerH * 0.7} stroke="#fca5a5" strokeDasharray="4 3" />
        <line x1={pad.l} y1={pad.t + innerH * 0.3} x2={W - pad.r} y2={pad.t + innerH * 0.3} stroke="#86efac" strokeDasharray="4 3" />
        <path d={d} fill="none" stroke="#7c3aed" strokeWidth={2.5} strokeLinecap="round" />
        {rsi.map((p, i) => {
          if (i % Math.ceil(rsi.length / 12) !== 0) return null;
          const x = pad.l + (i / Math.max(rsi.length - 1, 1)) * innerW;
          const y = pad.t + innerH - ((p.rsi ?? 50) / 100) * innerH;
          return (
            <circle
              key={i}
              cx={x}
              cy={y}
              r={4}
              fill="#7c3aed"
              stroke="#fff"
              strokeWidth={1.5}
              className="qr-dot"
              onMouseEnter={() => setTip(`${p.date} · RSI ${p.rsi?.toFixed(1)}`)}
              onMouseLeave={() => setTip(null)}
            />
          );
        })}
      </SvgFrame>
      <HoverSlot text={tip} />
    </ChartCard>
  );
}

function PatternChart({ data }: { data: QuantResearchData }) {
  const [tip, setTip] = useState<string | null>(null);

  return (
    <ChartCard title="Pattern probability" subtitle="Technical setup tactics">
      <div className="qr-pattern-bars">
        {data.pattern_signals.map((s, i) => (
          <div
            key={s.label}
            className="qr-pattern-row"
            onMouseEnter={() => setTip(`${s.label} (${s.probability}%) · ${s.description}`)}
            onMouseLeave={() => setTip(null)}
          >
            <span className="qr-pattern-label">{s.label}</span>
            <div className="qr-pattern-track">
              <div
                className="qr-pattern-fill"
                style={{ width: `${s.probability}%`, background: QR_COLORS[i % QR_COLORS.length] }}
              />
            </div>
            <span className="mono qr-pattern-pct">{s.probability}%</span>
          </div>
        ))}
      </div>
      <HoverSlot text={tip} />
    </ChartCard>
  );
}

function CorrHeatmap({ symbols, values }: { symbols: string[]; values: number[][] }) {
  const [tip, setTip] = useState<string | null>(null);

  const cellColor = (v: number) => {
    if (v >= 0.7) return "rgba(37,99,235,0.45)";
    if (v >= 0.3) return "rgba(8,145,178,0.3)";
    if (v >= 0) return "rgba(148,163,184,0.2)";
    if (v >= -0.3) return "rgba(217,119,6,0.22)";
    return "rgba(239,68,68,0.28)";
  };

  return (
    <ChartCard title="Correlation heatmap" subtitle="Pairwise return correlation">
      <div className="qr-heatmap">
        <div className="qr-heatmap-row qr-heatmap-head">
          <div className="qr-heatmap-cell" />
          {symbols.map((s) => <div key={s} className="qr-heatmap-cell mono">{s}</div>)}
        </div>
        {symbols.map((rowSym, i) => (
          <div key={rowSym} className="qr-heatmap-row">
            <div className="qr-heatmap-cell mono qr-heatmap-row-label">{rowSym}</div>
            {values[i]?.map((v, j) => (
              <div
                key={`${rowSym}-${symbols[j]}`}
                className="qr-heatmap-cell mono"
                style={{ background: cellColor(v) }}
                onMouseEnter={() => setTip(`${rowSym} × ${symbols[j]} · correlation ${v.toFixed(3)}`)}
                onMouseLeave={() => setTip(null)}
              >
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
      <h2 className="site-section-title">Quant charts & tactics</h2>
      <p className="site-section-lead">
        Interactive research visuals — price paths, Monte Carlo scenarios, factors, CAPM, RSI, patterns, and correlation.
      </p>
      <div className="qr-charts-grid">
        <PriceSeriesChart data={data} primary={primary} />
        <TechnicalOverlayChart data={data} />
        <MonteCarloPanel data={data} primary={primary} />
        <MacdChart data={data} />
        <FactorBarChart data={data} />
        <CapmChart data={data} />
        <RsiChart data={data} />
        <PatternChart data={data} />
        <CorrHeatmap symbols={data.correlation.symbols} values={data.correlation.values} />
      </div>
    </section>
  );
}
