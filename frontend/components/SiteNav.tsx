"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import SiteThemeToggle from "@/components/SiteThemeToggle";
import { PRODUCT_NAME } from "@/lib/orionAlpha";

const NAV_ITEMS = [
  { href: "/", label: "Home" },
  { href: "/research", label: "Research" },
  { href: "/about", label: "About" },
  { href: "/terminal", label: "Terminal" },
  { href: "/chart", label: "Charts" },
  { href: "/contact", label: "Contact Us" },
];

export default function SiteNav() {
  const path = usePathname();

  const isActive = (href: string) => {
    if (href === "/") return path === "/";
    return path === href || path.startsWith(`${href}/`) || path.startsWith(href);
  };

  return (
    <header className="site-nav-wrap">
      <div className="site-nav-bar">
        <Link href="/" className="site-nav-brand">
          <span className="site-nav-logo">OA</span>
          <span className="site-nav-name">{PRODUCT_NAME}</span>
        </Link>

        <nav className="site-nav-menu" aria-label="Main">
          {NAV_ITEMS.map(({ href, label }) => (
            <Link
              key={href}
              href={href}
              className={`site-nav-link${isActive(href) ? " site-nav-active" : ""}`}
            >
              {label}
            </Link>
          ))}
        </nav>

        <div className="site-nav-actions">
          <SiteThemeToggle />
          <Link href="/terminal" className="site-nav-cta">
            Open Terminal
          </Link>
        </div>
      </div>
    </header>
  );
}
