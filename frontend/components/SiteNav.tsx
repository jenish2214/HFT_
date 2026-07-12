"use client";

import Link from "next/link";
import { motion, useScroll, useSpring } from "framer-motion";
import { usePathname } from "next/navigation";
import { EASE_OUT } from "@/lib/siteMotion";
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
  const { scrollYProgress } = useScroll();
  const scaleX = useSpring(scrollYProgress, { stiffness: 120, damping: 28, restDelta: 0.001 });

  const isActive = (href: string) => {
    if (href === "/") return path === "/";
    return path === href || path.startsWith(`${href}/`) || path.startsWith(href);
  };

  return (
    <motion.header
      className="site-nav-wrap"
      initial={{ opacity: 0, y: -8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.28, ease: EASE_OUT }}
    >
      <motion.div className="site-scroll-progress" style={{ scaleX }} />
      <div className="site-nav-bar">
        <Link href="/" className="site-nav-brand" prefetch>
          <span className="site-nav-logo">OA</span>
          <span className="site-nav-name">{PRODUCT_NAME}</span>
        </Link>

        <nav className="site-nav-menu" aria-label="Main">
          {NAV_ITEMS.map(({ href, label }) => (
            <Link
              key={href}
              href={href}
              prefetch
              className={`site-nav-link${isActive(href) ? " site-nav-active" : ""}`}
            >
              {label}
            </Link>
          ))}
        </nav>

        <div className="site-nav-actions">
          <motion.div whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.97 }}>
            <Link href="/terminal" className="site-nav-cta" prefetch>
              Open Terminal
            </Link>
          </motion.div>
        </div>
      </div>
    </motion.header>
  );
}
