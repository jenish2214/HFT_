"use client";

import Link from "next/link";
import RevealOnScroll from "@/components/motion/RevealOnScroll";
import { COMPANY_NAME, EDUCATION_DISCLAIMER, PRODUCT_NAME, PRODUCT_VERSION, SUPPORT_EMAIL } from "@/lib/orionAlpha";

const PLATFORM_LINKS = [
  { label: "Dashboard", href: "/terminal" },
  { label: "Markets", href: "/" },
  { label: "Portfolio", href: "/terminal" },
  { label: "Watchlist", href: "/terminal" },
  { label: "Screeners", href: "/research" },
  { label: "Analytics", href: "/research" },
  { label: "Research", href: "/research" },
  { label: "AI Insights", href: "/research" },
];

const COMPANY_LINKS = [
  { label: "About", href: "/about" },
  { label: "Features", href: "/about" },
  { label: "Pricing", href: "/contact" },
  { label: "Careers", href: "/contact" },
  { label: "Contact", href: "/contact" },
  { label: "Blog", href: "/about" },
  { label: "Changelog", href: "/about" },
];

const RESOURCE_LINKS = [
  { label: "Documentation", href: "/docs" },
  { label: "Glossary", href: "/docs#monte-carlo" },
  { label: "API", href: "/about" },
  { label: "Help Center", href: "/terminal" },
  { label: "Community", href: "/contact" },
  { label: "Privacy Policy", href: "/contact" },
  { label: "Terms of Service", href: "/contact" },
  { label: "Cookie Policy", href: "/contact" },
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
              <p className="site-footer-desc">
                Educational markets platform for learning analytics, factor models,
                momentum exercises, and demo trading tools — not investment advice.
              </p>
              <span className="site-footer-badge">Built for learners</span>
              <p className="site-footer-edu-note">{EDUCATION_DISCLAIMER}</p>
              <p className="site-footer-contact mono">
                Support:{" "}
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
                Built with <span aria-hidden>❤️</span> by <strong>{displayCompany}</strong>
              </span>
            </div>
            <span className="site-footer-version mono">Version v{PRODUCT_VERSION}.0</span>
            <nav className="site-footer-bottom-links" aria-label="Footer utility">
              <Link href="/terminal" className="site-footer-bottom-link">Status</Link>
              <Link href="/about" className="site-footer-bottom-link">Security</Link>
              <Link href="/" className="site-footer-bottom-link">Sitemap</Link>
            </nav>
          </div>
        </div>
      </footer>
    </RevealOnScroll>
  );
}
