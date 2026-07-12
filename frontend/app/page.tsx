"use client";

import Link from "next/link";
import SiteNav from "@/components/SiteNav";
import Hero3DScene from "@/components/Hero3DScene";
import ResearchShowcase from "@/components/ResearchShowcase";
import { PRODUCT_NAME, PRODUCT_MOTTO, PRODUCT_TAGLINE } from "@/lib/orionAlpha";

export default function HomePage() {
  return (
    <div className="site-page">
      <SiteNav />

      <main className="site-hero site-hero-3d">
        <div className="site-hero-split">
          <div className="site-hero-copy">
            <p className="site-hero-badge site-fade-up">{PRODUCT_MOTTO}</p>
            <h1 className="site-hero-title site-fade-up" style={{ animationDelay: "0.06s" }}>
              {PRODUCT_NAME}
            </h1>
            <p className="site-hero-sub site-fade-up" style={{ animationDelay: "0.12s" }}>
              {PRODUCT_TAGLINE}
            </p>
            <p className="site-hero-desc site-fade-up" style={{ animationDelay: "0.18s" }}>
              A research-first financial terminal — pattern recognition, probability-weighted
              signals, and deep fundamentals for global markets.
            </p>
            <div className="site-hero-actions site-fade-up" style={{ animationDelay: "0.24s" }}>
              <Link href="/research" className="site-btn site-btn-primary">Quant Research</Link>
              <Link href="/terminal" className="site-btn site-btn-outline">Open Terminal</Link>
              <Link href="/chart" className="site-btn site-btn-outline">View Charts</Link>
            </div>
          </div>
          <div className="site-hero-visual site-fade-up" style={{ animationDelay: "0.1s" }}>
            <Hero3DScene />
          </div>
        </div>
      </main>

      <ResearchShowcase />

      <footer className="site-footer">{PRODUCT_NAME} · {PRODUCT_MOTTO}</footer>
    </div>
  );
}
