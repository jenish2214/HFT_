"use client";

import Link from "next/link";
import type { LucideIcon } from "lucide-react";
import {
  BarChart3,
  BookOpen,
  Info,
  Mail,
  Microscope,
  Terminal,
} from "lucide-react";
import { COMPANY_NAME, PRODUCT_NAME, PRODUCT_VERSION, SUPPORT_EMAIL } from "@/lib/orionAlpha";

const PLATFORM_LINKS = [
  { label: "Terminal", href: "/terminal", icon: Terminal },
  { label: "Research", href: "/research", icon: Microscope },
  { label: "Charts", href: "/chart", icon: BarChart3 },
  { label: "Docs", href: "/docs", icon: BookOpen },
];

const COMPANY_LINKS = [
  { label: "About", href: "/about", icon: Info },
  { label: "Contact", href: "/contact", icon: Mail },
];

const RESOURCE_LINKS = [
  { label: "Documentation", href: "/docs", icon: BookOpen },
  { label: "Contact", href: "/contact", icon: Mail },
];

function FooterLink({
  href,
  label,
  icon: Icon,
}: {
  href: string;
  label: string;
  icon: LucideIcon;
}) {
  return (
    <Link href={href} className="site-footer-link">
      <Icon size={14} strokeWidth={2} aria-hidden />
      {label}
    </Link>
  );
}

function FooterColumn({
  title,
  links,
}: {
  title: string;
  links: { label: string; href: string; icon: LucideIcon }[];
}) {
  return (
    <div className="site-footer-col">
      <h3 className="site-footer-col-title">{title}</h3>
      <ul className="site-footer-links">
        {links.map((l) => (
          <li key={l.label}>
            <FooterLink href={l.href} label={l.label} icon={l.icon} />
          </li>
        ))}
      </ul>
    </div>
  );
}

export default function SiteFooter() {
  const displayCompany = COMPANY_NAME.replace(/bsj/i, "BSJ").replace(/infotech/i, "Infotech");

  return (
    <footer className="site-footer-premium" aria-label="Site footer">
      <div className="site-footer-inner">
        <div className="site-footer-grid">
          <div className="site-footer-brand-col">
            <Link href="/" className="site-footer-brand">
              <span className="site-footer-logo">OA</span>
              <span className="site-footer-brand-name">{PRODUCT_NAME.toUpperCase()}</span>
            </Link>
            <p className="site-footer-desc">Markets research, charts, and terminal tools.</p>
            <p className="site-footer-contact">
              <a href={`mailto:${SUPPORT_EMAIL}`} className="site-footer-mail">
                <Mail size={14} strokeWidth={2} aria-hidden />
                {SUPPORT_EMAIL}
              </a>
            </p>
          </div>

          <FooterColumn title="Platform" links={PLATFORM_LINKS} />
          <FooterColumn title="Company" links={COMPANY_LINKS} />
          <FooterColumn title="Resources" links={RESOURCE_LINKS} />
        </div>

        <div className="site-footer-divider" aria-hidden />

        <div className="site-footer-bottom">
          <div className="site-footer-bottom-left">
            <span className="site-footer-copy">© 2026 {PRODUCT_NAME.toUpperCase()}</span>
            <span className="site-footer-built">
              by <strong>{displayCompany}</strong>
            </span>
          </div>
          <span className="site-footer-version">v{PRODUCT_VERSION}</span>
        </div>
      </div>
    </footer>
  );
}
