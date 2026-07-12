"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { getApiBase } from "@/lib/api";
import type { BankerDeskData, MarketAsset } from "@/lib/marketDeskTypes";
import LoadingSpinner from "@/components/LoadingSpinner";
import RevealOnScroll from "@/components/motion/RevealOnScroll";
import MotionCard from "@/components/motion/MotionCard";
import SiteSkeleton from "@/components/SiteSkeleton";

function MoverChip({ asset, gain }: { asset: MarketAsset; gain: boolean }) {
  return (
    <div className={`home-mover-chip${gain ? " home-mover-up" : " home-mover-down"}`}>
      <span className="mono home-mover-sym">{asset.symbol}</span>
      <span className={`mono ${gain ? "pnl-pos" : "pnl-neg"}`}>
        {asset.change_pct >= 0 ? "+" : ""}{asset.change_pct.toFixed(2)}%
      </span>
    </div>
  );
}

export default function HomeMarketDesk() {
  const [data, setData] = useState<BankerDeskData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch(`${getApiBase()}/markets/banker`, { cache: "no-store" })
      .then((r) => r.json())
      .then((d) => setData(d as BankerDeskData))
      .catch(() => setData(null))
      .finally(() => setLoading(false));
  }, []);

  if (loading) {
    return (
      <section className="home-market-desk site-section-wide">
        <div className="home-market-loading">
          <LoadingSpinner size="md" label="Loading global markets…" />
          <SiteSkeleton lines={4} className="home-market-skeleton" />
        </div>
      </section>
    );
  }

  if (!data) return null;

  const { macro, breadth, top_gainers, top_losers } = data;
  const sentimentClass =
    macro.sentiment === "Risk-On" ? "home-sentiment-on"
    : macro.sentiment === "Risk-Off" ? "home-sentiment-off"
    : "home-sentiment-neutral";

  return (
    <section className="home-market-desk site-section-wide">
      <div className="home-market-inner">
        <RevealOnScroll>
          <header className="home-market-head">
            <div className="home-market-head-left">
              <span className="home-market-code mono">MKTS</span>
              <div>
                <h2 className="home-market-title">Global markets desk</h2>
                <p className="home-market-sub">Cross-asset snapshot · macro sentiment · top movers</p>
              </div>
            </div>
            <div className="home-market-macro mono">
              <span className={`home-sentiment-badge ${sentimentClass}`}>{macro.sentiment}</span>
              <span className="home-macro-stat">Risk {macro.risk_score >= 0 ? "+" : ""}{macro.risk_score}</span>
              <span className="home-macro-stat pnl-pos">▲ {breadth.up}</span>
              <span className="home-macro-stat pnl-neg">▼ {breadth.down}</span>
              <span className="home-macro-stat">Eq {macro.equity_avg_chg >= 0 ? "+" : ""}{macro.equity_avg_chg}%</span>
              <span className="home-macro-stat">Idx {macro.index_avg_chg >= 0 ? "+" : ""}{macro.index_avg_chg}%</span>
            </div>
          </header>
        </RevealOnScroll>

        <div className="home-market-grid">
          <MotionCard className="home-market-panel home-market-movers" delay={0.05}>
            <h3 className="home-panel-title mono">Top movers</h3>
            <div className="home-mover-section">
              <span className="home-mover-label pnl-pos">Gainers</span>
              <div className="home-mover-grid">
                {top_gainers.map((a) => <MoverChip key={a.symbol} asset={a} gain />)}
              </div>
            </div>
            <div className="home-mover-section">
              <span className="home-mover-label pnl-neg">Losers</span>
              <div className="home-mover-grid">
                {top_losers.map((a) => <MoverChip key={a.symbol} asset={a} gain={false} />)}
              </div>
            </div>
          </MotionCard>

          <MotionCard className="home-market-panel home-market-macro-panel" delay={0.12}>
            <h3 className="home-panel-title mono">Macro context</h3>
            <ul className="home-macro-list mono">
              <li><span>Equities avg</span><strong className={macro.equity_avg_chg >= 0 ? "pnl-pos" : "pnl-neg"}>{macro.equity_avg_chg >= 0 ? "+" : ""}{macro.equity_avg_chg}%</strong></li>
              <li><span>Crypto avg</span><strong className={macro.crypto_avg_chg >= 0 ? "pnl-pos" : "pnl-neg"}>{macro.crypto_avg_chg >= 0 ? "+" : ""}{macro.crypto_avg_chg}%</strong></li>
              <li><span>Commodities avg</span><strong className={macro.commodity_avg_chg >= 0 ? "pnl-pos" : "pnl-neg"}>{macro.commodity_avg_chg >= 0 ? "+" : ""}{macro.commodity_avg_chg}%</strong></li>
              <li><span>Indices avg</span><strong className={macro.index_avg_chg >= 0 ? "pnl-pos" : "pnl-neg"}>{macro.index_avg_chg >= 0 ? "+" : ""}{macro.index_avg_chg}%</strong></li>
            </ul>
            <div className="home-market-actions">
              <Link href="/research" className="site-btn site-btn-primary">Quant Research</Link>
              <Link href="/terminal" className="site-btn site-btn-outline">Open Terminal</Link>
            </div>
          </MotionCard>
        </div>
      </div>
    </section>
  );
}
