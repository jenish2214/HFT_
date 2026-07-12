"use client";

import { useMemo } from "react";
import { ASSET_CLASS_LABELS } from "@/lib/marketDeskTypes";
import { getSymbolEntry } from "@/lib/symbolCatalog";
import type { QuantResearchData } from "@/lib/quantResearchTypes";
import { QR_COLORS } from "@/components/QuantResearchCharts";

interface Props {
  data: QuantResearchData;
  primary: string;
  onSelect?: (symbol: string) => void;
}

interface Row {
  sym: string;
  color: string;
  name: string;
  category: string;
  price: number | null;
  perf: number | null;
  sharpe: number | null;
  vol: number | null;
  alpha: number | null;
  beta: number | null;
  isPrimary: boolean;
}

export default function QuantSymbolCards({ data, primary, onSelect }: Props) {
  const rows = useMemo<Row[]>(() => data.tickers.map((sym, i) => {
    const entry = getSymbolEntry(sym);
    const company = data.company_profiles?.[sym];
    const risk = data.risk_metrics.find((r) => r.symbol === sym);
    const capm = data.capm.find((c) => c.symbol === sym);
    const series = data.charts?.price_series?.[sym];
    const firstNorm = series?.[0]?.norm ?? 100;
    const lastNorm = series?.[series.length - 1]?.norm ?? 100;
    const perf = firstNorm && lastNorm ? ((lastNorm - firstNorm) / firstNorm) * 100 : null;
    const assetClass = entry?.assetClass;
    const category = assetClass ? ASSET_CLASS_LABELS[assetClass] : (company?.sector ?? "Other");

    return {
      sym,
      color: QR_COLORS[i % QR_COLORS.length],
      name: company?.name ?? entry?.name ?? sym,
      category,
      price: series?.[series.length - 1]?.close ?? risk?.latest_price ?? null,
      perf,
      sharpe: risk?.sharpe ?? null,
      vol: risk?.ann_vol_pct ?? null,
      alpha: capm?.alpha_ann_pct ?? null,
      beta: capm?.beta ?? null,
      isPrimary: sym === primary,
    };
  }), [data, primary]);

  const categories = useMemo(() => {
    const map = new Map<string, Row[]>();
    rows.forEach((row) => {
      const list = map.get(row.category) ?? [];
      list.push(row);
      map.set(row.category, list);
    });
    return [...map.entries()];
  }, [rows]);

  return (
    <section className="site-section site-section-wide">
      <h2 className="site-section-title">Universe overview</h2>
      <p className="site-section-lead">
        Category-wise comparison across the research universe — click a row to select a symbol, then press GO.
      </p>

      {categories.map(([category, items]) => {
        const avgPerf = items.reduce((s, r) => s + (r.perf ?? 0), 0) / Math.max(items.filter((r) => r.perf != null).length, 1);
        const best = [...items].sort((a, b) => (b.perf ?? -999) - (a.perf ?? -999))[0];

        return (
          <div key={category} className="qr-universe-block">
            <header className="qr-universe-head">
              <h3 className="qr-universe-cat">{category}</h3>
              <div className="qr-universe-summary mono">
                <span>{items.length} symbols</span>
                <span>Avg period {avgPerf >= 0 ? "+" : ""}{avgPerf.toFixed(1)}%</span>
                {best && <span>Leader {best.sym} {best.perf != null ? `${best.perf >= 0 ? "+" : ""}${best.perf.toFixed(1)}%` : ""}</span>}
              </div>
            </header>

            <div className="qr-table-wrap">
              <table className="qr-table qr-universe-table">
                <thead>
                  <tr>
                    <th>Symbol</th>
                    <th>Name</th>
                    <th>Price</th>
                    <th>Period %</th>
                    <th>Sharpe</th>
                    <th>Vol %</th>
                    <th>Alpha %</th>
                    <th>Beta</th>
                  </tr>
                </thead>
                <tbody>
                  {items.map((r) => (
                    <tr
                      key={r.sym}
                      className={`qr-universe-row${r.isPrimary ? " qr-row-primary" : ""}${onSelect ? " qr-universe-click" : ""}`}
                      onClick={() => onSelect?.(r.sym)}
                      onKeyDown={(e) => { if (onSelect && (e.key === "Enter" || e.key === " ")) onSelect(r.sym); }}
                      tabIndex={onSelect ? 0 : undefined}
                      role={onSelect ? "button" : undefined}
                    >
                      <td className="mono qr-universe-sym">
                        <span className="qr-universe-dot" style={{ background: r.color }} />
                        {r.sym}
                        {r.isPrimary && <span className="qr-universe-pin">Primary</span>}
                      </td>
                      <td className="qr-universe-name">{r.name}</td>
                      <td className="mono">{r.price != null ? `$${r.price.toFixed(2)}` : "—"}</td>
                      <td className={`mono ${(r.perf ?? 0) >= 0 ? "pnl-pos" : "pnl-neg"}`}>
                        {r.perf != null ? `${r.perf >= 0 ? "+" : ""}${r.perf.toFixed(1)}%` : "—"}
                      </td>
                      <td className="mono">{r.sharpe ?? "—"}</td>
                      <td className="mono">{r.vol != null ? `${r.vol}%` : "—"}</td>
                      <td className={`mono ${(r.alpha ?? 0) >= 0 ? "pnl-pos" : "pnl-neg"}`}>{r.alpha ?? "—"}</td>
                      <td className="mono">{r.beta ?? "—"}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        );
      })}
    </section>
  );
}
