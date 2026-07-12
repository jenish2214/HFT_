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
            <h2>What is Orion Alpha?</h2>
            <p>
              Orion Alpha is a market research platform for studying live prices,
              company fundamentals, and charts across equities, crypto, commodities,
              FX, and rates — all in one place.
            </p>
          </section>
        </RevealOnScroll>

        <RevealOnScroll delay={0.1}>
          <section className="site-about-block">
            <h2>What you can do</h2>
            <ul className="site-about-list">
              <li>View live quotes and watchlists</li>
              <li>Read company fundamentals and reports</li>
              <li>Open full-screen charts with indicators</li>
              <li>Use the research terminal for deeper analysis</li>
            </ul>
          </section>
        </RevealOnScroll>

        <FadeIn delay={0.15}>
          <div className="site-about-actions">
            <Link href="/terminal" className="site-btn site-btn-primary">Open Terminal</Link>
            <Link href="/chart" className="site-btn site-btn-outline">View Charts</Link>
            <Link href="/" className="site-btn site-btn-outline">Home</Link>
          </div>
        </FadeIn>
      </main>

      <SiteFooter />
    </div>
  );
}
