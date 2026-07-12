"use client";

import type { MarketAsset } from "@/lib/marketDeskTypes";

interface Props {
  asset: MarketAsset;
  active?: boolean;
  onSelect?: (sym: string) => void;
  compact?: boolean;
}

function fmtPrice(asset: MarketAsset): string {
  const d = asset.asset_class === "fx" || asset.asset_class === "rates" ? 4 : 2;
  if (asset.price >= 1000) return asset.price.toLocaleString(undefined, { maximumFractionDigits: d });
  return asset.price.toFixed(d);
}

export function MarketAssetRow({ asset, active, onSelect, compact }: Props) {
  const up = asset.change_pct >= 0;
  return (
    <button
      type="button"
      className={`mkt-asset-row${active ? " mkt-asset-active" : ""}`}
      onClick={() => onSelect?.(asset.symbol)}
    >
      <div className="mkt-asset-left">
        <span className="mkt-asset-sym mono">{asset.symbol}</span>
        {!compact && <span className="mkt-asset-name">{asset.name}</span>}
      </div>
      <div className="mkt-asset-right mono">
        <span className="mkt-asset-price">{fmtPrice(asset)}</span>
        <span className={up ? "pnl-pos" : "pnl-neg"}>
          {up ? "+" : ""}{asset.change_pct.toFixed(2)}%
        </span>
      </div>
    </button>
  );
}

interface TableProps {
  assets: MarketAsset[];
  active?: string;
  onSelect?: (sym: string) => void;
}

export function MarketAssetTable({ assets, active, onSelect }: TableProps) {
  return (
    <div className="mkt-asset-table">
      <div className="mkt-asset-head mono">
        <span>Symbol</span>
        <span>Last</span>
        <span>Chg%</span>
        <span>Vol</span>
      </div>
      {assets.map((a) => {
        const up = a.change_pct >= 0;
        return (
          <button
            key={a.symbol}
            type="button"
            className={`mkt-asset-table-row${a.symbol === active ? " mkt-asset-active" : ""}`}
            onClick={() => onSelect?.(a.symbol)}
          >
            <span className="mkt-t-sym">
              <b className="mono">{a.symbol}</b>
              <small>{a.name}</small>
            </span>
            <span className="mono mkt-t-price">{a.price.toFixed(a.asset_class === "fx" ? 4 : 2)}</span>
            <span className={`mono ${up ? "pnl-pos" : "pnl-neg"}`}>
              {up ? "+" : ""}{a.change_pct.toFixed(2)}
            </span>
            <span className="mono mkt-t-vol">{a.volume ? (a.volume / 1000).toFixed(0) + "K" : "—"}</span>
          </button>
        );
      })}
    </div>
  );
}
