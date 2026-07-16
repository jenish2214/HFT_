"use client";

import Link from "next/link";
import { BarChart3, Microscope, Shield, Terminal, TrendingUp } from "lucide-react";
import { INVESTMENT_PHILOSOPHY } from "@/lib/companyBrand";

const CAPABILITIES = [
  { icon: TrendingUp, title: "Factor research", text: "Momentum, reversal, composite alpha, and peer baskets on /research." },
  { icon: BarChart3, title: "Performance report", text: "Sharpe, drawdown curves, monthly heatmap, and Monte Carlo scenarios." },
  { icon: Terminal, title: "Live terminal", text: "Watchlists, order book, time & sales, and fundamentals desk." },
  { icon: Shield, title: "Risk framework", text: "VaR, max drawdown, CAPM alpha/beta, and scenario probabilities." },
];

export default function ResearchShowcase() {
  return (
    <>
      <section className="site-section site-section-wide site-section-alt">
        <h2 className="site-section-title">Platform capabilities</h2>
        <p className="site-section-lead">Institutional-grade modules across research and execution context.</p>
        <div className="oa-capabilities-grid">
          {CAPABILITIES.map((item) => (
            <article key={item.title} className="site-card oa-capability-card">
              <item.icon size={22} className="oa-capability-icon" aria-hidden />
              <h3>{item.title}</h3>
              <p>{item.text}</p>
            </article>
          ))}
        </div>
      </section>

      <section className="site-section site-section-wide">
        <h2 className="site-section-title">How teams use Orion Alpha</h2>
        <div className="oa-philosophy-grid">
          {INVESTMENT_PHILOSOPHY.map((p) => (
            <article key={p.title} className="site-card oa-philosophy-card">
              <h3>{p.title}</h3>
              <p>{p.text}</p>
            </article>
          ))}
        </div>
      </section>

      <section className="site-section site-section-wide site-section-alt site-section-center">
        <div className="site-card oa-cta-block">
          <h2 className="site-section-title">Get started</h2>
          <p className="site-section-lead">Open the research desk or launch the live terminal.</p>
          <div className="site-section-actions">
            <Link href="/research" className="site-btn site-btn-primary">
              <Microscope size={16} aria-hidden />
              Research desk
            </Link>
            <Link href="/terminal" className="site-btn site-btn-outline">
              <Terminal size={16} aria-hidden />
              Live terminal
            </Link>
            <Link href="/about" className="site-btn site-btn-outline">About BSJ Infotech</Link>
          </div>
        </div>
      </section>
    </>
  );
}
