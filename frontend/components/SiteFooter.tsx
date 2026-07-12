"use client";

import Link from "next/link";
import RevealOnScroll from "@/components/motion/RevealOnScroll";
import { COMPANY_NAME, PRODUCT_NAME, PRODUCT_VERSION, SUPPORT_EMAIL } from "@/lib/orionAlpha";

const PLATFORM_LINKS = [
  { label: "Terminal", href: "/terminal" },
  { label: "Research", href: "/research" },
  { label: "Charts", href: "/chart" },
  { label: "Docs", href: "/docs" },
];

const COMPANY_LINKS = [
  { label: "About", href: "/about" },
  { label: "Contact", href: "/contact" },
];

const RESOURCE_LINKS = [
  { label: "Documentation", href: "/docs" },
  { label: "Contact", href: "/contact" },
];

function FooterLink({ href, label }: { href: string; label: string }) {
  return (
    <Link href={href} className="site-footer-link">
      {label}
    </Link>
  );
}

function FooterColumn({ title, links }: { title: string; links: { label: string; href: string }[] }) {
  return (
    <div className="site-footer-col">
      <h3 className="site-footer-col-title">{title}</h3>
      <ul className="site-footer-links">
        {links.map((l) => (
          <li key={l.label}>
            <FooterLink href={l.href} label={l.label} />
          </li>
        ))}
      </ul>
    </div>
  );
}

export default function SiteFooter() {
  const displayCompany = COMPANY_NAME.replace(/bsj/i, "BSJ").replace(/infotech/i, "Infotech");

  return (
    <RevealOnScroll>
      <footer className="site-footer-premium" aria-label="Site footer">
        <div className="site-footer-inner">
          <div className="site-footer-grid">
            <div className="site-footer-brand-col">
              <Link href="/" className="site-footer-brand">
                <span className="site-footer-logo">OA</span>
                <span className="site-footer-brand-name">{PRODUCT_NAME.toUpperCase()}</span>
              </Link>
              <p className="site-footer-desc">Markets research, charts, and terminal tools.</p>
              <p className="site-footer-contact mono">
                <a href={`mailto:${SUPPORT_EMAIL}`} className="site-footer-mail">
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
              <span className="site-footer-copy mono">© 2026 {PRODUCT_NAME.toUpperCase()}</span>
              <span className="site-footer-built">
                by <strong>{displayCompany}</strong>
              </span>
            </div>
            <span className="site-footer-version mono">v{PRODUCT_VERSION}</span>
          </div>
        </div>
      </footer>
    </RevealOnScroll>
  );
}
