import type { TickInfo, StrategyInfo, Book } from "@/lib/marketTypes";

interface Props {
  tick: TickInfo | null;
  book: Book;
  strategy: StrategyInfo;
}

export default function DemoWalkthrough({ tick, book, strategy }: Props) {
  const mid = book.mid || tick?.price || 0;
  const bid = tick?.bid || mid - 0.01;
  const ask = tick?.ask || mid + 0.01;
  const quoteBid = mid > 0 ? (mid - 0.05).toFixed(2) : "—";
  const quoteAsk = mid > 0 ? (mid + 0.05).toFixed(2) : "—";

  const steps = [
    {
      n: 1,
      title: "Exchange sends a tick",
      body: tick
        ? `${tick.symbol}: last $${tick.price.toFixed(2)}, bid $${bid.toFixed(2)}, ask $${ask.toFixed(2)}`
        : "Waiting for market data…",
    },
    {
      n: 2,
      title: "Strategy posts quotes",
      body: mid > 0
        ? `mm_alpha quotes BUY $${quoteBid} and SELL $${quoteAsk} around mid $${mid.toFixed(2)}`
        : "Strategy waiting for mid price…",
    },
    {
      n: 3,
      title: "Someone hits our quote",
      body: "External trader sends MARKET order → C++ engine matches instantly",
    },
    {
      n: 4,
      title: "We capture the spread",
      body: `Position: ${strategy.position} shrs · Total P&L: $${(strategy.total_pnl ?? strategy.cash ?? 0).toFixed(2)}`,
    },
  ];

  return (
    <div className="panel">
      <div className="panel-title">Example — One HFT Cycle</div>
      <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
        {steps.map((s) => (
          <div key={s.n} style={{ display: "flex", gap: 10, alignItems: "flex-start" }}>
            <span
              style={{
                width: 22,
                height: 22,
                border: "1px solid #d4d4d4",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                fontSize: 11,
                fontWeight: 600,
                flexShrink: 0,
              }}
            >
              {s.n}
            </span>
            <div>
              <div style={{ fontSize: 12, fontWeight: 600 }}>{s.title}</div>
              <div style={{ fontSize: 11, color: "#666", marginTop: 2 }}>{s.body}</div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
