import type { LucideIcon } from "lucide-react";

interface Props {
  badge?: string;
  title: string;
  lead?: string;
  icon?: LucideIcon;
}

export default function SitePageHeader({ badge, title, lead, icon: Icon }: Props) {
  return (
    <header className="oa-page-header">
      {Icon && (
        <div className="oa-page-header-icon" aria-hidden>
          <Icon size={22} strokeWidth={1.75} />
        </div>
      )}
      <div className="oa-page-header-text">
        {badge && <p className="site-hero-badge">{badge}</p>}
        <h1 className="oa-page-header-title">{title}</h1>
        {lead && <p className="oa-page-header-lead">{lead}</p>}
      </div>
    </header>
  );
}
