"use client";

import LoadingSpinner from "@/components/LoadingSpinner";

export interface QuickQuote {
  symbol: string;
  price?: number;
  change?: number;
  change_pct?: number;
  name?: string;
}

interface Props {
  title?: string;
  message?: string;
  quote?: QuickQuote | null;
  variant?: "panel" | "full" | "inline";
  skeleton?: "report" | "grid" | "list" | "chart" | "desk";
}

function SkeletonReport() {
  return (
    <div className="oa-skeleton-block">
      <div className="oa-skeleton oa-skeleton-line oa-skeleton-w40" />
      <div className="oa-skeleton oa-skeleton-line oa-skeleton-w80" />
      <div className="oa-skeleton oa-skeleton-line oa-skeleton-w100" />
      <div className="oa-skeleton oa-skeleton-line oa-skeleton-w90" />
      <div className="oa-skeleton-grid">
        {[1, 2, 3, 4, 5, 6].map((i) => (
          <div key={i} className="oa-skeleton oa-skeleton-kpi" />
        ))}
      </div>
    </div>
  );
}

function SkeletonGrid() {
  return (
    <div className="oa-skeleton-grid oa-skeleton-grid-3">
      {[1, 2, 3, 4, 5, 6, 7, 8, 9].map((i) => (
        <div key={i} className="oa-skeleton oa-skeleton-kpi" />
      ))}
    </div>
  );
}

function SkeletonList() {
  return (
    <div className="oa-skeleton-block">
      {[1, 2, 3, 4, 5].map((i) => (
        <div key={i} className="oa-skeleton oa-skeleton-row" />
      ))}
    </div>
  );
}

function SkeletonDesk() {
  return (
    <div className="oa-skeleton-desk">
      <div className="oa-skeleton oa-skeleton-bar" />
      <div className="oa-skeleton-desk-cols">
        <div className="oa-skeleton oa-skeleton-col" />
        <div className="oa-skeleton oa-skeleton-col" />
      </div>
    </div>
  );
}

function FastInfo({ quote }: { quote: QuickQuote }) {
  const up = (quote.change_pct ?? quote.change ?? 0) >= 0;
  return (
    <div className="oa-fast-info mono">
      <span className="oa-fast-sym bb-orange-text">{quote.symbol}</span>
      {quote.name && quote.name !== quote.symbol && (
        <span className="oa-fast-name">{quote.name}</span>
      )}
      {quote.price != null && quote.price > 0 && (
        <span className="oa-fast-price">${quote.price.toFixed(2)}</span>
      )}
      {quote.change_pct != null && (
        <span className={up ? "pnl-pos" : "pnl-neg"}>
          {up ? "+" : ""}{quote.change_pct.toFixed(2)}%
        </span>
      )}
      <span className="oa-fast-tag">LIVE QUOTE</span>
    </div>
  );
}

export default function PanelLoading({
  title,
  message = "Fetching data…",
  quote,
  variant = "panel",
  skeleton = "report",
}: Props) {
  const skeletonEl =
    skeleton === "grid" ? <SkeletonGrid />
    : skeleton === "list" ? <SkeletonList />
    : skeleton === "desk" ? <SkeletonDesk />
    : skeleton === "chart" ? null
    : <SkeletonReport />;

  if (variant === "inline") {
    return (
      <div className="oa-loading-inline">
        <LoadingSpinner size="sm" />
        <span className="mono oa-loading-msg">{message}</span>
      </div>
    );
  }

  if (variant === "full") {
    return (
      <div className="desk-full-loading oa-loading-full">
        {quote && <FastInfo quote={quote} />}
        <LoadingSpinner size="lg" label={message} />
        {title && <div className="oa-loading-title mono">{title}</div>}
        {skeletonEl}
      </div>
    );
  }

  return (
    <div className="oa-loading-panel">
      {quote && <FastInfo quote={quote} />}
      <div className="oa-loading-head">
        <LoadingSpinner size="sm" />
        <span className="mono oa-loading-msg">{message}</span>
      </div>
      {skeletonEl}
    </div>
  );
}

export { FastInfo };
