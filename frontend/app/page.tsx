"use client";

import Link from "next/link";
import SiteNav from "@/components/SiteNav";
import ContactSection from "@/components/ContactSection";
import { PRODUCT_NAME, PRODUCT_TAGLINE } from "@/lib/orionAlpha";

const PILLARS = [
  {
    title: "Extensive coverage",
    text: "Markets and instruments across equities, crypto, commodities, indices, FX, and rates.",
  },
  {
    title: "Research & fundamentals",
    text: "Company profiles, financial statements, and key stats in one research workspace.",
  },
  {
    title: "Charts & monitors",
    text: "Live candlestick charts, indicators, watchlists, and market status at a glance.",
  },
  {
    title: "Terminal in action",
    text: "Open the desk to analyze symbols, review depth, and explore professional workflows.",
  },
];

const HIGHLIGHTS = [
  {
    title: "Research at your fingertips",
    text: "Pull company data, sector context, and fundamentals without leaving the platform.",
  },
  {
    title: "Make fast decisions",
    text: "Use the terminal monitor, charts, and quote panels to compare symbols quickly.",
  },
  {
    title: "One integrated view",
    text: "Home, About, Terminal, and Charts share the same navigation — start anywhere, go anywhere.",
  },
];

const STEPS = [
  { num: "1", title: "Overview", text: "Start on Home to see what Orion Alpha offers." },
  { num: "2", title: "Terminal", text: "Open the live research desk for quotes and analysis." },
  { num: "3", title: "Charts", text: "Switch to full-screen charts for deeper technical review." },
];

export default function HomePage() {
  return (
    <div className="site-page">
      <SiteNav />

      <main className="site-hero">
        <div className="site-hero-inner site-hero-wide">
          <p className="site-hero-badge site-fade-up">Market Research Platform</p>
          <h1 className="site-hero-title site-fade-up" style={{ animationDelay: "0.08s" }}>
            The financial world in focus — built for research
          </h1>
          <p className="site-hero-sub site-fade-up" style={{ animationDelay: "0.14s" }}>
            {PRODUCT_NAME} · {PRODUCT_TAGLINE}
          </p>
          <p className="site-hero-desc site-fade-up" style={{ animationDelay: "0.2s" }}>
            Power your market research with live data, fundamentals, charts, and a professional
            terminal — all from one integrated solution.
          </p>
          <div className="site-hero-actions site-fade-up" style={{ animationDelay: "0.26s" }}>
            <Link href="/terminal" className="site-btn site-btn-primary">Open Terminal</Link>
            <Link href="/about" className="site-btn site-btn-outline">Learn More</Link>
          </div>
        </div>
      </main>

      <section className="site-section site-section-wide">
        <h2 className="site-section-title">Why Orion Alpha</h2>
        <div className="site-pillar-grid">
          {PILLARS.map((item, i) => (
            <article
              key={item.title}
              className="site-pillar-card site-fade-up"
              style={{ animationDelay: `${i * 0.06}s` }}
            >
              <h3>{item.title}</h3>
              <p>{item.text}</p>
            </article>
          ))}
        </div>
      </section>

      <section className="site-section site-section-muted site-section-wide">
        <h2 className="site-section-title">Terminal in action</h2>
        <p className="site-section-lead">
          Highlights of what you can do inside the platform — inspired by professional
          market research workflows.
        </p>
        <div className="site-highlight-grid">
          {HIGHLIGHTS.map((item, i) => (
            <article
              key={item.title}
              className="site-highlight-card site-fade-up"
              style={{ animationDelay: `${i * 0.08}s` }}
            >
              <h3>{item.title}</h3>
              <p>{item.text}</p>
            </article>
          ))}
        </div>
      </section>

      <section className="site-section site-section-wide">
        <h2 className="site-section-title">How to get started</h2>
        <div className="site-workflow">
          {STEPS.map((s, i) => (
            <div
              key={s.num}
              className="site-workflow-step site-fade-up"
              style={{ animationDelay: `${i * 0.08}s` }}
            >
              <span className="site-workflow-num">{s.num}</span>
              <h3>{s.title}</h3>
              <p>{s.text}</p>
            </div>
          ))}
        </div>
      </section>

      <ContactSection />

      <footer className="site-footer">{PRODUCT_NAME}</footer>
    </div>
  );
}
