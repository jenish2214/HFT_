import type { Book } from "@/app/page";

interface Props {
  book: Book;
  symbol?: string;
}

export default function OrderBook({ book, symbol = "AAPL" }: Props) {
  const maxQty = Math.max(
    ...book.bids.map((b) => b.qty),
    ...book.asks.map((a) => a.qty),
    1
  );

  return (
    <div className="panel">
      <div className="panel-head">
        <span className="panel-title">GP — Level II · {symbol}</span>
        <span className="mono" style={{ fontSize: 11, color: "var(--text-muted)" }}>
          Mid {book.mid > 0 ? book.mid.toFixed(2) : "—"} · Spr {book.spread > 0 ? book.spread.toFixed(2) : "—"}
        </span>
      </div>
      <div className="panel-body" style={{ padding: 0 }}>
        <table>
          <thead>
            <tr>
              <th style={{ textAlign: "left" }}>Bid Size</th>
              <th>Bid</th>
              <th>Ask</th>
              <th style={{ textAlign: "right" }}>Ask Size</th>
            </tr>
          </thead>
          <tbody>
            {Array.from({ length: 15 }).map((_, i) => {
              const bid = book.bids[i];
              const ask = book.asks[i];
              const bidPct = bid ? (bid.qty / maxQty) * 100 : 0;
              const askPct = ask ? (ask.qty / maxQty) * 100 : 0;
              return (
                <tr key={i}>
                  <td style={{ textAlign: "left", position: "relative" }}>
                    {bid && (
                      <>
                        <span style={{
                          position: "absolute", left: 0, top: 0, bottom: 0,
                          width: `${bidPct}%`, background: "rgba(255,140,0,0.1)", zIndex: 0,
                        }} />
                        <span className="bid" style={{ position: "relative", zIndex: 1 }}>{bid.qty}</span>
                      </>
                    )}
                  </td>
                  <td className="bid">{bid ? bid.price.toFixed(2) : ""}</td>
                  <td className="ask">{ask ? ask.price.toFixed(2) : ""}</td>
                  <td style={{ textAlign: "right", position: "relative" }}>
                    {ask && (
                      <>
                        <span style={{
                          position: "absolute", right: 0, top: 0, bottom: 0,
                          width: `${askPct}%`, background: "rgba(255,82,82,0.1)", zIndex: 0,
                        }} />
                        <span className="ask" style={{ position: "relative", zIndex: 1 }}>{ask.qty}</span>
                      </>
                    )}
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
