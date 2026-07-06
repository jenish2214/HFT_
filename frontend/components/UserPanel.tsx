import type { UserInfo } from "@/app/page";

interface Props {
  user: UserInfo;
}

export default function UserPanelContent({ user }: Props) {
  const total = user.total_pnl ?? 0;
  const equity = user.equity ?? user.initial_equity ?? 0;
  const realized = user.realized_pnl ?? 0;
  const unrealized = user.unrealized_pnl ?? 0;

  const fields = [
    { label: "Equity", value: `$${equity.toLocaleString(undefined, { maximumFractionDigits: 0 })}` },
    { label: "Total P&L", value: `${total >= 0 ? "+" : ""}$${Math.abs(total).toFixed(2)}`, cls: total >= 0 ? "pnl-pos" : "pnl-neg" },
    { label: "Realized", value: `$${realized.toFixed(2)}`, cls: realized >= 0 ? "pnl-pos" : "pnl-neg" },
    { label: "Unrealized", value: `$${unrealized.toFixed(2)}`, cls: unrealized >= 0 ? "pnl-pos" : "pnl-neg" },
    { label: "Position", value: `${user.position >= 0 ? "+" : ""}${user.position}` },
    { label: "Avg Entry", value: user.avg_entry ? `$${user.avg_entry.toFixed(2)}` : "—" },
    { label: "Cash", value: `$${(user.cash ?? 0).toLocaleString(undefined, { maximumFractionDigits: 0 })}` },
    { label: "Buying Pwr", value: `$${(user.buying_power ?? 0).toLocaleString(undefined, { maximumFractionDigits: 0 })}` },
    { label: "Orders", value: String(user.orders_sent ?? 0) },
    { label: "Fills", value: String(user.fills ?? 0) },
  ];

  return (
    <div className="data-grid data-grid-dense account-grid">
      {fields.map((f) => (
        <div key={f.label} className="data-cell data-cell-dense">
          <div className="data-cell-label">{f.label}</div>
          <div className={`data-cell-value mono ${f.cls || ""}`}>{f.value}</div>
        </div>
      ))}
    </div>
  );
}
