"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";

const RESEARCH_PURPOSE = [
  {
    title: "Understand markets",
    text: "Move from raw prices to structured insight — sector context, fundamentals, and live session data in one flow.",
  },
  {
    title: "Validate ideas",
    text: "Test hypotheses with charts, indicators, and company reports before committing to a view.",
  },
  {
    title: "Act with clarity",
    text: "Use the terminal desk to monitor quotes, depth, and research profiles without switching tools.",
  },
];

const PATTERN_SIGNALS = [
  { label: "Trend continuation", prob: 72, desc: "Price holds above SMA with rising volume" },
  { label: "Mean reversion", prob: 58, desc: "RSI stretch with Bollinger band touch" },
  { label: "Breakout confirmation", prob: 64, desc: "Range break + MACD momentum align" },
  { label: "Sector relative strength", prob: 81, desc: "Symbol outperforms peer basket" },
];

const TERMINAL_FEATURES = [
  { key: "GP", title: "Price & depth", text: "Candlesticks, Level II book, time & sales" },
  { key: "FA", title: "Fundamentals", text: "Income, balance sheet, cash flow tabs" },
  { key: "MON", title: "Monitor", text: "Multi-asset watchlist with live filters" },
  { key: "QR", title: "Quant research", text: "Factor engine, CAPM, Monte Carlo on /research" },
];

function useInView(threshold = 0.15) {
  const ref = useRef<HTMLDivElement>(null);
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const obs = new IntersectionObserver(
      ([entry]) => { if (entry.isIntersecting) setVisible(true); },
      { threshold },
    );
    obs.observe(el);
    return () => obs.disconnect();
  }, [threshold]);

  return { ref, visible };
}

function ProbBar({ label, prob, desc, delay, animate }: {
  label: string; prob: number; desc: string; delay: number; animate: boolean;
}) {
  return (
    <article className={`site-prob-card site-fade-up${animate ? " site-in-view" : ""}`} style={{ animationDelay: `${delay}s` }}>
      <div className="site-prob-head">
        <h3>{label}</h3>
        <span className="site-prob-value">{prob}%</span>
      </div>
      <div className="site-prob-track">
        <div className="site-prob-fill" style={{ width: animate ? `${prob}%` : "0%" }} />
      </div>
      <p>{desc}</p>
    </article>
  );
}

export default function ResearchShowcase() {
  const purpose = useInView();
  const patterns = useInView();
  const terminal = useInView();

  return (
    <>
      <section className="site-section site-section-wide site-section-muted" ref={purpose.ref}>
        <h2 className="site-section-title">Purpose of research</h2>
        <p className="site-section-lead">
          Orion Alpha exists to turn market noise into research you can trust —
          structured, repeatable, and grounded in data.
        </p>
        <div className="site-purpose-grid">
          {RESEARCH_PURPOSE.map((item, i) => (
            <article
              key={item.title}
              className={`site-purpose-card site-fade-up site-pillar-3d${purpose.visible ? " site-in-view" : ""}`}
              style={{ animationDelay: `${i * 0.08}s` }}
            >
              <span className="site-purpose-num">{i + 1}</span>
              <h3>{item.title}</h3>
              <p>{item.text}</p>
            </article>
          ))}
        </div>
      </section>

      <section className="site-section site-section-wide" ref={patterns.ref}>
        <h2 className="site-section-title">Pattern recognition & probability</h2>
        <p className="site-section-lead">
          Screen setups with probability-weighted signals — trend, reversion, breakout,
          and relative strength — inside the research workflow.
        </p>
        <div className="site-prob-grid">
          {PATTERN_SIGNALS.map((s, i) => (
            <ProbBar key={s.label} {...s} delay={i * 0.1} animate={patterns.visible} />
          ))}
        </div>
      </section>

      <section className="site-section site-section-wide site-section-muted" ref={terminal.ref}>
        <h2 className="site-section-title">Financial research terminal</h2>
        <p className="site-section-lead">
          Professional desk functions for deep research — from live quotes to full fundamentals.
        </p>
        <div className="site-terminal-grid">
          {TERMINAL_FEATURES.map((f, i) => (
            <article
              key={f.key}
              className={`site-terminal-card site-fade-up${terminal.visible ? " site-in-view" : ""}`}
              style={{ animationDelay: `${i * 0.07}s` }}
            >
              <span className="site-terminal-key">{f.key}</span>
              <h3>{f.title}</h3>
              <p>{f.text}</p>
            </article>
          ))}
        </div>
        <div className="site-hero-actions site-cta-actions site-fade-up" style={{ marginTop: 32 }}>
          <Link href="/research" className="site-btn site-btn-primary">View Quant Research</Link>
          <Link href="/terminal" className="site-btn site-btn-outline">Launch Terminal</Link>
          <Link href="/chart" className="site-btn site-btn-outline">Open Charts</Link>
        </div>
      </section>
    </>
  );
}
