"use client";

import { useEffect, useState } from "react";
import { getApiBase } from "@/lib/api";
import CompanyFundamentalsTabs from "@/components/CompanyFundamentalsTabs";
import type { CompanyReport } from "@/components/CompanyReportPanel";
import type { ResearchProfile } from "@/lib/marketDeskTypes";
import { ASSET_CLASS_LABELS } from "@/lib/marketDeskTypes";
import { PRODUCT_NAME } from "@/lib/orionAlpha";
import PanelLoading, { type QuickQuote } from "@/components/PanelLoading";
import DataNotFound from "@/components/DataNotFound";
import { MarketAssetTable } from "@/components/MarketAssetTable";
import { chartPageUrl } from "@/lib/chartIndicators";
import ChartFullscreenLink from "@/components/ChartFullscreenLink";

interface Props {
  symbol: string;
  onSelect: (sym: string) => void;
  quickQuote?: QuickQuote | null;
  marketOpen?: boolean;
}

function fmt(val: string | number | null | undefined, suffix = ""): string {
  if (val == null || val === "") return "—";
  return `${val}${suffix}`;
}

export default function ProResearchDesk({ symbol, onSelect, quickQuote, marketOpen = false }: Props) {
  const [profile, setProfile] = useState<ResearchProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [retryKey, setRetryKey] = useState(0);

  useEffect(() => {
    setLoading(true);
    fetch(`${getApiBase()}/research/profile?symbol=${encodeURIComponent(symbol)}`, { cache: "no-store" })
      .then((r) => r.json())
      .then((d) => setProfile(d as ResearchProfile))
      .catch(() => setProfile(null))
      .finally(() => setLoading(false));
  }, [symbol, retryKey]);

  if (loading && !profile) {
    const quote: QuickQuote = quickQuote ?? { symbol };
    return (
      <div className="desk-full res-desk">
        <PanelLoading
          variant="full"
          title={`RES — ${symbol}`}
          message={`Loading research profile…`}
          quote={quote.price ? quote : { symbol }}
          skeleton="desk"
          marketOpen={marketOpen}
        />
      </div>
    );
  }

  if (!profile || (profile.data_found === false && !profile.quote?.price)) {
    return (
      <div className="desk-full res-desk">
        <DataNotFound
          symbol={symbol}
          title="Research data not found"
          message={profile?.message ?? undefined}
          sourcesTried={profile?.sources_tried}
          source={profile?.data_source}
          onRetry={() => setRetryKey((k) => k + 1)}
        />
      </div>
    );
  }

  const { quote, report, technicals, peer_comparison, sector_peers, market_breadth } = profile;
  const isEquity = profile.asset_class === "equity" && report;

  return (
    <div className="desk-full res-desk">
      <div className="res-header-bar">
        <div className="res-header-left">
          <span className="panel-title">RES — {PRODUCT_NAME} Research</span>
          <span className="res-asset-class">{profile.asset_class_label}</span>
        </div>
        <div className="res-header-right mono">
          <span className="res-symbol bb-orange-text">{symbol}</span>
          <span className="res-price">${quote.price.toFixed(quote.asset_class === "fx" ? 4 : 2)}</span>
          <span className={quote.change_pct >= 0 ? "pnl-pos" : "pnl-neg"}>
            {quote.change_pct >= 0 ? "+" : ""}{quote.change_pct.toFixed(2)}%
          </span>
          <ChartFullscreenLink href={chartPageUrl(symbol, "1Y")} title="Open full-screen chart" external />
        </div>
      </div>

      <div className="res-grid">
        <div className="panel res-panel">
          <div className="panel-head"><span className="panel-title">Quote &amp; Technicals</span></div>
          <div className="panel-body res-body">
            <div className="res-name">{report?.name || quote.name}</div>
            {report?.sector && (
              <div className="res-meta mono">{report.sector}{report.industry ? ` · ${report.industry}` : ""}</div>
            )}
            <div className="res-kpi-grid">
              <div className="res-kpi"><span>Day Range</span><b className="mono">{technicals.day_range ?? "—"}</b></div>
              <div className="res-kpi"><span>52W High</span><b className="mono">{fmt(technicals.fifty_two_week_high)}</b></div>
              <div className="res-kpi"><span>52W Low</span><b className="mono">{fmt(technicals.fifty_two_week_low)}</b></div>
              <div className="res-kpi"><span>Range Position</span><b className="mono">{technicals.range_position_pct != null ? `${technicals.range_position_pct}%` : "—"}</b></div>
              <div className="res-kpi"><span>From 52W High</span><b className={`mono ${(technicals.from_52w_high_pct ?? 0) >= 0 ? "pnl-pos" : "pnl-neg"}`}>{fmt(technicals.from_52w_high_pct, "%")}</b></div>
              <div className="res-kpi"><span>Volume</span><b className="mono">{quote.volume ? quote.volume.toLocaleString() : "—"}</b></div>
            </div>
            {!isEquity && (
              <div className="res-alt-asset mono">
                <p><b>{ASSET_CLASS_LABELS[profile.asset_class]}</b> — {quote.name}</p>
                <p>Select an equity for full balance sheet &amp; cash flow coverage.</p>
              </div>
            )}
            <div className="res-section-title">Global Breadth</div>
            <div className="res-breadth mono">
              <span className="pnl-pos">▲ {market_breadth.up}</span>
              <span className="pnl-neg">▼ {market_breadth.down}</span>
              <span>{market_breadth.total} tracked</span>
            </div>
          </div>
        </div>

        <div className="panel res-panel res-peers-panel">
          <div className="panel-head">
            <span className="panel-title">{ASSET_CLASS_LABELS[profile.asset_class]} Peers</span>
          </div>
          <div className="panel-body res-peers-body">
            <MarketAssetTable assets={peer_comparison} active={symbol} onSelect={onSelect} />
          </div>
        </div>

        {sector_peers.length > 0 && (
          <div className="panel res-panel res-peers-panel">
            <div className="panel-head">
              <span className="panel-title">Sector Peers — {report?.sector}</span>
            </div>
            <div className="panel-body res-peers-body">
              <MarketAssetTable assets={sector_peers} active={symbol} onSelect={onSelect} />
            </div>
          </div>
        )}

        {isEquity && report && (
          <div className="panel res-panel res-fundamentals-panel">
            <div className="panel-head">
              <span className="panel-title">Full Fundamentals — {symbol}</span>
              <a href={`/fundamentals?symbol=${encodeURIComponent(symbol)}`} target="_blank" rel="noopener noreferrer" className="chart-fullscreen-btn">
                FULL FA ↗
              </a>
            </div>
            <div className="panel-body res-fa-body">
              <CompanyFundamentalsTabs report={report as CompanyReport} />
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
