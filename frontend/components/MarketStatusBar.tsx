import type { MarketSession } from "@/app/page";

interface Props {
  market: MarketSession | null;
  lastUpdateTs?: number;
}

function fmtAgo(ts: number): string {
  if (!ts) return "";
  const sec = Math.max(0, Math.floor(Date.now() / 1000 - ts));
  if (sec < 2) return "just now";
  if (sec < 60) return `${sec}s ago`;
  return `${Math.floor(sec / 60)}m ago`;
}

export default function MarketStatusBar({ market, lastUpdateTs = 0 }: Props) {
  if (!market) return null;

  const cls =
    market.status === "open" ? "market-bar-open"
    : market.status === "pre" ? "market-bar-pre"
    : market.status === "after" ? "market-bar-after"
    : "market-bar-closed";

  const isRegular = market.is_regular_hours;
  const isLive = market.is_live;

  return (
    <div className={`market-bar ${cls}`}>
      <span className={isRegular ? "market-bar-live market-bar-live-pulse" : isLive ? "market-bar-ext" : "market-bar-delayed"}>
        {isRegular ? "Market Open" : isLive ? "Extended Hours" : "Market Closed"}
      </span>
      <span className="market-bar-label">{market.local_time}</span>
      {market.countdown && (
        <span className="mono" style={{ color: "var(--blue)" }}>{market.countdown}</span>
      )}
      {lastUpdateTs > 0 && (
        <span className="mono market-bar-updated" style={{ marginLeft: "auto" }}>
          Updated {fmtAgo(lastUpdateTs)}
        </span>
      )}
    </div>
  );
}
