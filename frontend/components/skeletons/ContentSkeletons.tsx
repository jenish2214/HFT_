"use client";

interface Props {
  rows?: number;
  cols?: number;
  className?: string;
}

export function TableSkeleton({ rows = 5, className = "" }: Props) {
  return (
    <div className={`oa-table-skeleton ${className}`.trim()} aria-hidden>
      <div className="oa-table-skeleton-head">
        {Array.from({ length: 5 }, (_, i) => (
          <div key={i} className="oa-skeleton oa-skeleton-th" />
        ))}
      </div>
      {Array.from({ length: rows }, (_, r) => (
        <div key={r} className="oa-table-skeleton-row">
          {Array.from({ length: 5 }, (_, c) => (
            <div key={c} className="oa-skeleton oa-skeleton-td" style={{ width: c === 0 ? "72%" : "100%" }} />
          ))}
        </div>
      ))}
    </div>
  );
}

export function CardSkeleton({ count = 4, className = "" }: { count?: number; className?: string }) {
  return (
    <div className={`oa-card-skeleton-grid ${className}`.trim()} aria-hidden>
      {Array.from({ length: count }, (_, i) => (
        <div key={i} className="oa-skeleton oa-skeleton-card" />
      ))}
    </div>
  );
}

export function ChartSkeleton({ className = "" }: { className?: string }) {
  return (
    <div className={`oa-chart-skeleton ${className}`.trim()} aria-hidden>
      <div className="oa-skeleton oa-chart-skeleton-title" />
      <div className="oa-chart-skeleton-bars">
        {[42, 68, 55, 82, 48, 74, 61, 88, 52, 70, 45, 78].map((h, i) => (
          <div
            key={i}
            className="oa-skeleton oa-chart-skeleton-bar"
            style={{ height: `${h}%`, animationDelay: `${i * 0.04}s` }}
          />
        ))}
      </div>
    </div>
  );
}

export function TickerSkeleton({ count = 8 }: { count?: number }) {
  return (
    <div className="oa-ticker-skeleton" aria-hidden>
      {Array.from({ length: count }, (_, i) => (
        <div key={i} className="oa-skeleton oa-ticker-skeleton-chip" />
      ))}
    </div>
  );
}

export function FinanceHubSkeleton() {
  return (
    <section className="home-finance-hub site-section-wide" aria-hidden>
      <div className="home-finance-intro">
        <div className="oa-skeleton oa-skeleton-line oa-skeleton-w40" style={{ height: 12, marginBottom: 12 }} />
        <div className="oa-skeleton oa-skeleton-line oa-skeleton-w80" style={{ height: 28, marginBottom: 10 }} />
        <div className="oa-skeleton oa-skeleton-line oa-skeleton-w90" style={{ height: 14 }} />
      </div>
      <TickerSkeleton count={10} />
      <CardSkeleton count={6} className="home-finance-class-grid" />
    </section>
  );
}

export function ResearchShowcaseSkeleton() {
  return (
    <div className="site-section site-section-wide" aria-hidden>
      <div className="oa-skeleton oa-skeleton-line oa-skeleton-w40" style={{ height: 12, margin: "0 auto 16px" }} />
      <CardSkeleton count={3} />
    </div>
  );
}

export function QuantPageSkeleton() {
  return (
    <div className="qr-page-skeleton" aria-hidden>
      <div className="oa-skeleton oa-skeleton-bar" style={{ height: 120, marginBottom: 24 }} />
      <CardSkeleton count={4} />
      <ChartSkeleton className="qr-chart-skeleton-wrap" />
      <TableSkeleton rows={6} className="qr-table-skeleton-wrap" />
    </div>
  );
}
