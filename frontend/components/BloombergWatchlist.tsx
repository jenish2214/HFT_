"use client";

import { useMemo, useState } from "react";
import SymbolSearchInput from "@/components/SymbolSearchInput";
import {
  ASSET_CLASS_FILTERS,
  ASSET_CLASS_SHORT,
  PRODUCT_NAME,
  type AssetClassFilter,
} from "@/lib/orionAlpha";

export interface WatchRow {
  symbol: string;
  name?: string;
  sector?: string | null;
  asset_class?: string;
  asset_class_label?: string;
  price: number;
  change: number;
  change_pct: number;
}

interface Props {
  rows: WatchRow[];
  active: string;
  onSelect: (sym: string) => void;
  loading?: boolean;
}

function priceDecimals(row: WatchRow): number {
  return row.asset_class === "fx" ? 4 : 2;
}

export default function BloombergWatchlist({ rows, active, onSelect, loading = false }: Props) {
  const [filter, setFilter] = useState<AssetClassFilter>("all");

  const filtered = useMemo(() => {
    if (filter === "all") return rows;
    return rows.filter((r) => r.asset_class === filter);
  }, [rows, filter]);

  const counts = useMemo(() => {
    const map: Record<string, number> = { all: rows.length };
    for (const r of rows) {
      const k = r.asset_class || "other";
      map[k] = (map[k] || 0) + 1;
    }
    return map;
  }, [rows]);

  return (
    <div className="panel bb-panel wl-panel">
      <div className="panel-head">
        <span className="panel-title">MON — {PRODUCT_NAME} Monitor</span>
        <span className="bb-fn mono">{filtered.length}/{rows.length}</span>
      </div>
      <div className="wl-filter-bar">
        {ASSET_CLASS_FILTERS.map((f) => (
          <button
            key={f.id}
            type="button"
            className={`wl-filter-btn${filter === f.id ? " wl-filter-active" : ""}`}
            onClick={() => setFilter(f.id)}
          >
            {f.label}
            {f.id !== "all" && counts[f.id] ? ` ${counts[f.id]}` : f.id === "all" ? ` ${counts.all}` : ""}
          </button>
        ))}
      </div>
      <div className="wl-search-wrap">
        <SymbolSearchInput
          onSelect={onSelect}
          dark
          compact
          placeholder="Search stocks, forex, crypto…"
          className="wl-symbol-search"
          ariaLabel="Search watchlist universe"
        />
      </div>
      <div className="panel-body wl-body">
        <table className="wl-table">
          <thead>
            <tr>
              <th style={{ textAlign: "left" }}>Cls</th>
              <th style={{ textAlign: "left" }}>Sym</th>
              <th style={{ textAlign: "left" }}>Name</th>
              <th>Last</th>
              <th>%</th>
            </tr>
          </thead>
          <tbody>
            {loading && rows.length === 0
              ? Array.from({ length: 8 }).map((_, i) => (
                <tr key={`sk-${i}`} className="wl-skeleton-row">
                  {[1, 2, 3, 4, 5].map((c) => (
                    <td key={c}><span className="oa-skeleton wl-skeleton-cell" /></td>
                  ))}
                </tr>
              ))
              : filtered.map((r) => {
              const up = (r.change_pct ?? 0) >= 0;
              const isActive = r.symbol === active;
              const dec = priceDecimals(r);
              const cls = r.asset_class ? ASSET_CLASS_SHORT[r.asset_class] || "—" : "—";
              return (
                <tr
                  key={r.symbol}
                  className={`wl-row ${isActive ? "wl-active" : ""}`}
                  onClick={() => onSelect(r.symbol)}
                  title={[r.asset_class_label, r.sector].filter(Boolean).join(" · ")}
                >
                  <td className="wl-cls mono">{cls}</td>
                  <td className="wl-sym">{r.symbol}</td>
                  <td className="wl-name">{r.name ?? r.symbol}</td>
                  <td className="mono">{r.price > 0 ? r.price.toFixed(dec) : "—"}</td>
                  <td className={`mono ${up ? "report-emphasis" : "report-dim"}`}>
                    {r.price > 0 ? `${up ? "+" : ""}${r.change_pct.toFixed(2)}` : "—"}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}
