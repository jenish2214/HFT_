import type { MarketSession } from "@/lib/marketTypes";

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
  if (!market || market.status !== "open") return null;

  return (
    <div className="market-bar market-bar-open">
      <span className="market-bar-pill market-bar-live market-bar-live-pulse">
        LIVE
      </span>
      <span className="market-bar-label">{market.label}</span>
      {market.session_detail && (
        <span className="market-bar-detail">{market.session_detail}</span>
      )}
      {market.countdown && (
        <span className="market-bar-countdown mono">{market.countdown}</span>
      )}
      <span className="market-bar-clock mono">{market.local_time}</span>
      {lastUpdateTs > 0 && (
        <span className="mono market-bar-updated">
          Feed {fmtAgo(lastUpdateTs)}
        </span>
      )}
    </div>
  );
}
