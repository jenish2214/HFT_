"use client";

import Link from "next/link";
import SiteNav from "@/components/SiteNav";
import SiteFooter from "@/components/SiteFooter";
import FadeIn from "@/components/motion/FadeIn";
import RevealOnScroll from "@/components/motion/RevealOnScroll";
import { PRODUCT_NAME, PRODUCT_MOTTO, PRODUCT_TAGLINE } from "@/lib/orionAlpha";

export default function AboutPageContent() {
  return (
    <div className="site-page">
      <SiteNav />
      <main className="site-about">
        <FadeIn>
          <h1 className="site-about-title">About {PRODUCT_NAME}</h1>
          <p className="site-about-lead">{PRODUCT_MOTTO} · {PRODUCT_TAGLINE}</p>
        </FadeIn>

        <RevealOnScroll delay={0.05}>
          <section className="site-about-block">
            <h2>Overview</h2>
            <p>
              Research, charts, and a live terminal for stocks, crypto, commodities, FX, and rates.
            </p>
          </section>
        </RevealOnScroll>

        <RevealOnScroll delay={0.1}>
          <section className="site-about-block">
            <h2>Features</h2>
            <ul className="site-about-list">
              <li>Live quotes and watchlists</li>
              <li>Company fundamentals</li>
              <li>Charts with indicators</li>
              <li>Research desk</li>
            </ul>
          </section>
        </RevealOnScroll>

        <FadeIn delay={0.15}>
          <div className="site-about-actions">
            <Link href="/research" className="site-btn site-btn-primary">Research</Link>
            <Link href="/terminal" className="site-btn site-btn-outline">Terminal</Link>
            <Link href="/docs" className="site-btn site-btn-outline">Definitions</Link>
          </div>
        </FadeIn>
      </main>

      <SiteFooter />
    </div>
  );
}
