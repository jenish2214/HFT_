"use client";

import { useEffect, useState } from "react";
import { getApiBase } from "@/lib/api";
import type { BankerDeskData, AssetClass } from "@/lib/marketDeskTypes";
import { ASSET_CLASS_ORDER } from "@/lib/marketDeskTypes";
import { PRODUCT_NAME } from "@/lib/orionAlpha";
import PanelLoading from "@/components/PanelLoading";
import { MarketAssetTable } from "@/components/MarketAssetTable";

interface Props {
  active: string;
  onSelect: (sym: string) => void;
}

export default function InvestmentBankerDesk({ active, onSelect }: Props) {
  const [data, setData] = useState<BankerDeskData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setLoading(true);
    fetch(`${getApiBase()}/markets/banker`, { cache: "no-store" })
      .then((r) => r.json())
      .then((d) => setData(d as BankerDeskData))
      .catch(() => setData(null))
      .finally(() => setLoading(false));

    const id = setInterval(() => {
      fetch(`${getApiBase()}/markets/banker`, { cache: "no-store" })
        .then((r) => r.json())
        .then((d) => setData(d as BankerDeskData))
        .catch(() => {});
    }, 60000);
    return () => clearInterval(id);
  }, []);

  if (loading && !data) {
    return (
      <div className="desk-full ib-desk">
        <PanelLoading
          variant="full"
          title="IB — Global Markets Desk"
          message="Loading markets overview…"
          skeleton="desk"
        />
      </div>
    );
  }

  if (!data) {
    return (
      <div className="desk-full ib-desk">
        <div className="desk-full-loading mono">Market data unavailable</div>
      </div>
    );
  }

  const { macro, breadth, categories, top_gainers, top_losers } = data;
  const sentimentClass =
    macro.sentiment === "Risk-On" ? "ib-sentiment-on"
    : macro.sentiment === "Risk-Off" ? "ib-sentiment-off"
    : "ib-sentiment-neutral";

  return (
    <div className="desk-full ib-desk">
      <div className="ib-macro-bar">
        <div className="ib-macro-left">
          <span className="panel-title">IB — {PRODUCT_NAME} Markets</span>
          <span className={`ib-sentiment-badge ${sentimentClass}`}>{macro.sentiment}</span>
          <span className="ib-macro-score mono">Risk {macro.risk_score >= 0 ? "+" : ""}{macro.risk_score}</span>
        </div>
        <div className="ib-breadth mono">
          <span className="pnl-pos">▲ {breadth.up}</span>
          <span className="pnl-neg">▼ {breadth.down}</span>
          <span className="ib-flat">— {breadth.flat}</span>
          <span className="ib-total">{breadth.total} assets</span>
        </div>
      </div>

      <div className="ib-sector-chips mono">
        <span className="ib-chip">Equity avg <b className={macro.equity_avg_chg >= 0 ? "pnl-pos" : "pnl-neg"}>{macro.equity_avg_chg >= 0 ? "+" : ""}{macro.equity_avg_chg}%</b></span>
        <span className="ib-chip">Index avg <b className={macro.index_avg_chg >= 0 ? "pnl-pos" : "pnl-neg"}>{macro.index_avg_chg >= 0 ? "+" : ""}{macro.index_avg_chg}%</b></span>
        <span className="ib-chip">Crypto avg <b className={macro.crypto_avg_chg >= 0 ? "pnl-pos" : "pnl-neg"}>{macro.crypto_avg_chg >= 0 ? "+" : ""}{macro.crypto_avg_chg}%</b></span>
        <span className="ib-chip">Commodity avg <b className={macro.commodity_avg_chg >= 0 ? "pnl-pos" : "pnl-neg"}>{macro.commodity_avg_chg >= 0 ? "+" : ""}{macro.commodity_avg_chg}%</b></span>
      </div>

      <div className="ib-movers-row">
        <div className="panel ib-mover-panel">
          <div className="panel-head"><span className="panel-title">Top Gainers</span></div>
          <div className="panel-body ib-mover-body">
            {top_gainers.map((a) => (
              <button key={a.symbol} type="button" className="ib-mover-row" onClick={() => onSelect(a.symbol)}>
                <span className="mono">{a.symbol}</span>
                <span className="pnl-pos">+{a.change_pct.toFixed(2)}%</span>
              </button>
            ))}
          </div>
        </div>
        <div className="panel ib-mover-panel">
          <div className="panel-head"><span className="panel-title">Top Losers</span></div>
          <div className="panel-body ib-mover-body">
            {top_losers.map((a) => (
              <button key={a.symbol} type="button" className="ib-mover-row" onClick={() => onSelect(a.symbol)}>
                <span className="mono">{a.symbol}</span>
                <span className="pnl-neg">{a.change_pct.toFixed(2)}%</span>
              </button>
            ))}
          </div>
        </div>
        <div className="panel ib-mover-panel ib-headline-panel">
          <div className="panel-head"><span className="panel-title">Macro Headlines</span></div>
          <div className="panel-body ib-mover-body">
            {macro.headline_assets.map((a) => (
              <button key={a.symbol} type="button" className="ib-mover-row" onClick={() => onSelect(a.symbol)}>
                <span><b className="mono">{a.symbol}</b> {a.name}</span>
                <span className={a.change_pct >= 0 ? "pnl-pos" : "pnl-neg"}>{a.change_pct >= 0 ? "+" : ""}{a.change_pct.toFixed(2)}%</span>
              </button>
            ))}
          </div>
        </div>
      </div>

      <div className="ib-categories-grid">
        {ASSET_CLASS_ORDER.map((catId) => {
          const cat = categories[catId as AssetClass];
          if (!cat?.assets?.length) return null;
          return (
            <div key={catId} className="panel ib-cat-panel">
              <div className="panel-head">
                <span className="panel-title">{cat.label}</span>
                <span className="bb-fn">{catId.toUpperCase()}</span>
              </div>
              <div className="panel-body ib-cat-body">
                <MarketAssetTable assets={cat.assets} active={active} onSelect={onSelect} />
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
