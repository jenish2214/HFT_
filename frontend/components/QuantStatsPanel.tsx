"use client";

import type { QuantResearchData, QuantStatsHeadline } from "@/lib/quantResearchTypes";

interface Props {
  data: QuantResearchData;
  primary: string;
}

function fmtHeadline(h: QuantStatsHeadline): string {
  if (h.value == null) return "—";
  if (h.fmt === "pct") return `${h.value}%`;
  return Number(h.value).toFixed(3);
}

function fmtNum(v: number | null | undefined, digits = 2): string {
  if (v == null) return "—";
  return v.toFixed(digits);
}

function MiniLine({
  points,
  stroke,
  fill,
}: {
  points: { date: string; value: number | null }[];
  stroke: string;
  fill?: string;
}) {
  const vals = points.map((p) => p.value).filter((v): v is number => v != null);
  if (vals.length < 2) return <p className="qr-qs-empty">No series</p>;

  const w = 640;
  const h = 140;
  const pad = 8;
  const min = Math.min(...vals);
  const max = Math.max(...vals);
  const span = max - min || 1;

  const coords = points
    .map((p, i) => {
      if (p.value == null) return null;
      const x = pad + (i / Math.max(points.length - 1, 1)) * (w - pad * 2);
      const y = h - pad - ((p.value - min) / span) * (h - pad * 2);
      return `${x.toFixed(1)},${y.toFixed(1)}`;
    })
    .filter(Boolean) as string[];

  const line = coords.join(" ");
  const area = fill
    ? `M ${coords[0]} L ${line.replace(/ /g, " L ")} L ${coords[coords.length - 1].split(",")[0]},${h - pad} L ${coords[0].split(",")[0]},${h - pad} Z`
    : undefined;

  return (
    <svg viewBox={`0 0 ${w} ${h}`} className="qr-qs-svg" role="img" aria-hidden>
      {area && <path d={area} fill={fill} opacity={0.15} />}
      <polyline points={line} fill="none" stroke={stroke} strokeWidth={2} />
    </svg>
  );
}

function HeatCell({ value }: { value: number | null }) {
  if (value == null) {
    return <td className="qr-qs-heat-cell is-empty">—</td>;
  }
  const intensity = Math.min(1, Math.abs(value) / 12);
  const bg =
    value >= 0
      ? `rgba(34, 197, 94, ${0.12 + intensity * 0.55})`
      : `rgba(239, 68, 68, ${0.12 + intensity * 0.55})`;
  return (
    <td className="qr-qs-heat-cell" style={{ background: bg }}>
      {value >= 0 ? "+" : ""}
      {value.toFixed(1)}
    </td>
  );
}

export default function QuantStatsPanel({ data, primary }: Props) {
  const qs = data.quantstats;
  if (!qs || qs.data_found === false) return null;

  const headlines = (qs.headlines ?? []).filter((h) => h.value != null).slice(0, 12);
  const heat = qs.monthly_heatmap;
  const mc = qs.montecarlo;

  return (
    <section className="site-section site-section-wide qr-qs-panel" aria-label="QuantStats full report">
      <div className="qr-qs-head">
        <div>
          <p className="qr-edu-eyebrow mono">QuantStats</p>
          <h2 className="site-section-title qr-edu-title">Full performance report — {primary}</h2>
          <p className="site-section-lead qr-edu-lead">
            One place for Sharpe, risk, monthly returns, drawdown, and Monte Carlo probs.
          </p>
        </div>
        <div className="qr-qs-score">
          <span className="qr-qs-badge mono">{qs.source === "quantstats" ? "qs.stats" : "fallback"}</span>
          {qs.score_label && <strong className="qr-qs-score-label">{qs.score_label}</strong>}
          {qs.score_hint && <p className="qr-qs-score-hint">{qs.score_hint}</p>}
        </div>
      </div>

      {/* 1. Easy headline grid */}
      <div className="qr-qs-block">
        <h3 className="qr-qs-block-title">Key numbers</h3>
        <div className="qr-qs-grid qr-qs-grid-dense">
          {headlines.map((h) => (
            <div key={h.id} className="qr-qs-cell" title={h.tip}>
              <span className="qr-qs-label">{h.label}</span>
              <strong className="mono qr-qs-val">{fmtHeadline(h)}</strong>
              {h.tip && <span className="qr-qs-tip">{h.tip}</span>}
            </div>
          ))}
        </div>
      </div>

      {/* 2. Equity + drawdown */}
      <div className="qr-qs-charts">
        <div className="qr-qs-chart-card">
          <h3 className="qr-qs-block-title">Growth of $100</h3>
          <MiniLine points={qs.equity_curve ?? []} stroke="#0f172a" fill="#0f172a" />
        </div>
        <div className="qr-qs-chart-card">
          <h3 className="qr-qs-block-title">Drawdown %</h3>
          <MiniLine points={qs.drawdown_curve ?? []} stroke="#ef4444" fill="#ef4444" />
        </div>
      </div>

      {/* 3. Monte Carlo bust/goal */}
      {mc && (
        <div className="qr-qs-block qr-qs-mc">
          <h3 className="qr-qs-block-title">Monte Carlo (QuantStats)</h3>
          <p className="qr-qs-mc-hint">{mc.hint}</p>
          <div className="qr-qs-mc-row">
            <div className="qr-qs-mc-card is-bust">
              <span className="qr-qs-label">Bust chance ({mc.bust_threshold_pct}%)</span>
              <strong className="mono qr-qs-val">{fmtNum(mc.bust_probability_pct, 1)}%</strong>
            </div>
            <div className="qr-qs-mc-card is-goal">
              <span className="qr-qs-label">Goal chance (+{mc.goal_threshold_pct}%)</span>
              <strong className="mono qr-qs-val">{fmtNum(mc.goal_probability_pct, 1)}%</strong>
            </div>
            <div className="qr-qs-mc-card">
              <span className="qr-qs-label">Simulations</span>
              <strong className="mono qr-qs-val">{mc.sims}</strong>
            </div>
          </div>
        </div>
      )}

      {/* 4. Monthly heatmap */}
      {heat && heat.years.length > 0 && (
        <div className="qr-qs-block">
          <h3 className="qr-qs-block-title">Monthly returns %</h3>
          <div className="qr-qs-heat-wrap">
            <table className="qr-qs-heat">
              <thead>
                <tr>
                  <th>Year</th>
                  {heat.months.map((m) => (
                    <th key={m}>{m}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {heat.years.map((y, yi) => (
                  <tr key={y}>
                    <td className="mono qr-qs-heat-year">{y}</td>
                    {(heat.values[yi] ?? []).map((v, mi) => (
                      <HeatCell key={`${y}-${heat.months[mi]}`} value={v} />
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* 5. Grouped report tables */}
      {qs.metric_groups && qs.metric_groups.length > 0 && (
        <div className="qr-qs-groups">
          {qs.metric_groups.map((g) => (
            <div key={g.title} className="qr-qs-group-card">
              <h3 className="qr-qs-block-title">{g.title}</h3>
              <table className="qr-qs-table">
                <tbody>
                  {g.rows.map((row) => (
                    <tr key={row.label}>
                      <td>{row.label}</td>
                      <td className="mono">
                        {typeof row.value === "number" ? row.value : row.value ?? "—"}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ))}
        </div>
      )}
    </section>
  );
}
