"use client";

import Link from "next/link";
import { Menu, Terminal, X } from "lucide-react";
import { usePathname } from "next/navigation";
import { useCallback, useEffect, useState } from "react";
import { MAIN_NAV } from "@/lib/navConfig";
import { PRODUCT_NAME } from "@/lib/orionAlpha";

export default function SiteNav() {
  const path = usePathname();
  const [open, setOpen] = useState(false);

  const isActive = useCallback(
    (href: string) => {
      if (href === "/") return path === "/";
      return path === href || path.startsWith(`${href}/`);
    },
    [path],
  );

  useEffect(() => {
    setOpen(false);
  }, [path]);

  useEffect(() => {
    document.body.style.overflow = open ? "hidden" : "";
    return () => {
      document.body.style.overflow = "";
    };
  }, [open]);

  return (
    <header className="site-nav-wrap">
      <div className="site-nav-bar">
        <Link href="/" className="site-nav-brand" prefetch onClick={() => setOpen(false)}>
          <span className="site-nav-logo">OA</span>
          <span className="site-nav-name">{PRODUCT_NAME}</span>
        </Link>

        <nav className={`site-nav-menu${open ? " site-nav-menu-open" : ""}`} aria-label="Main">
          {MAIN_NAV.map(({ href, label }) => (
            <Link
              key={href}
              href={href}
              prefetch
              className={`site-nav-link${isActive(href) ? " site-nav-active" : ""}`}
              onClick={() => setOpen(false)}
            >
              {label}
            </Link>
          ))}
          <Link
            href="/terminal"
            className="site-nav-cta site-nav-mobile-cta"
            prefetch
            onClick={() => setOpen(false)}
          >
            <Terminal size={16} aria-hidden />
            Open Terminal
          </Link>
        </nav>

        <div className="site-nav-actions">
          <Link href="/terminal" className="site-nav-cta" prefetch>
            <Terminal size={16} aria-hidden />
            Open Terminal
          </Link>
        </div>

        <button
          type="button"
          className="site-nav-toggle"
          aria-label={open ? "Close menu" : "Open menu"}
          aria-expanded={open}
          onClick={() => setOpen((v) => !v)}
        >
          {open ? <X size={20} /> : <Menu size={20} />}
        </button>
      </div>
    </header>
  );
}
