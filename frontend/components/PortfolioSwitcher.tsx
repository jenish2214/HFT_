import type { UserInfo } from "@/lib/marketTypes";
import UserPanelContent from "@/components/UserPanel";

interface Props {
  user: UserInfo;
}

export default function PortfolioSwitcher({ user }: Props) {
  const userPnl = user.total_pnl ?? 0;
  const equity = user.equity ?? user.initial_equity ?? 0;

  return (
    <div className="panel portfolio-switcher">
      <div className="panel-head dense-head">
        <span className="panel-title">Account</span>
        <span className="mono dense-head-val">
          ${equity.toLocaleString(undefined, { maximumFractionDigits: 0 })}
          <span className={userPnl >= 0 ? "pnl-pos" : "pnl-neg"}>
            {" "}{userPnl >= 0 ? "+" : ""}${Math.abs(userPnl).toFixed(2)}
          </span>
        </span>
      </div>
      <div className="portfolio-body dense-pad">
        <UserPanelContent user={user} />
      </div>
    </div>
  );
}
