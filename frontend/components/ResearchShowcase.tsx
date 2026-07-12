"use client";

import Link from "next/link";
import RevealOnScroll from "@/components/motion/RevealOnScroll";
import MotionCard from "@/components/motion/MotionCard";
import { motion } from "framer-motion";
import { EASE_OUT } from "@/lib/siteMotion";

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
  { title: "Price & depth", text: "Candlesticks, Level II book, time & sales" },
  { title: "Fundamentals", text: "Income, balance sheet, cash flow tabs" },
  { title: "Monitor", text: "Multi-asset watchlist with live filters" },
  { title: "Quant research", text: "Factor engine, CAPM, Monte Carlo on /research" },
];

function ProbBar({ label, prob, desc, delay }: {
  label: string; prob: number; desc: string; delay: number;
}) {
  return (
    <MotionCard className="site-prob-card" delay={delay}>
      <div className="site-prob-head">
        <h3>{label}</h3>
        <span className="site-prob-value">{prob}%</span>
      </div>
      <div className="site-prob-track">
        <motion.div
          className="site-prob-fill"
          initial={{ width: 0 }}
          whileInView={{ width: `${prob}%` }}
          viewport={{ once: true }}
          transition={{ duration: 0.8, delay: delay + 0.15, ease: EASE_OUT }}
        />
      </div>
      <p>{desc}</p>
    </MotionCard>
  );
}

export default function ResearchShowcase() {
  return (
    <>
      <section className="site-section site-section-wide site-section-muted">
        <RevealOnScroll>
          <h2 className="site-section-title">Purpose of research</h2>
          <p className="site-section-lead">
            Orion Alpha exists to turn market noise into research you can trust —
            structured, repeatable, and grounded in data.
          </p>
        </RevealOnScroll>
        <div className="site-purpose-grid">
          {RESEARCH_PURPOSE.map((item, i) => (
            <MotionCard key={item.title} className="site-purpose-card site-pillar-3d" delay={i * 0.08}>
              <span className="site-purpose-num">{i + 1}</span>
              <h3>{item.title}</h3>
              <p>{item.text}</p>
            </MotionCard>
          ))}
        </div>
      </section>

      <section className="site-section site-section-wide">
        <RevealOnScroll>
          <h2 className="site-section-title">Pattern recognition & probability</h2>
          <p className="site-section-lead">
            Screen setups with probability-weighted signals — trend, reversion, breakout,
            and relative strength — inside the research workflow.
          </p>
        </RevealOnScroll>
        <div className="site-prob-grid">
          {PATTERN_SIGNALS.map((s, i) => (
            <ProbBar key={s.label} {...s} delay={i * 0.1} />
          ))}
        </div>
      </section>

      <section className="site-section site-section-wide site-section-muted">
        <RevealOnScroll>
          <h2 className="site-section-title">Financial research terminal</h2>
          <p className="site-section-lead">
            Professional desk functions for deep research — from live quotes to full fundamentals.
          </p>
        </RevealOnScroll>
        <div className="site-terminal-grid">
          {TERMINAL_FEATURES.map((f, i) => (
            <MotionCard key={f.title} className="site-terminal-card" delay={i * 0.07}>
              <h3>{f.title}</h3>
              <p>{f.text}</p>
            </MotionCard>
          ))}
        </div>
        <RevealOnScroll delay={0.1}>
          <div className="site-hero-actions site-cta-actions" style={{ marginTop: 32 }}>
            <Link href="/research" className="site-btn site-btn-primary">View Quant Research</Link>
            <Link href="/terminal" className="site-btn site-btn-outline">Launch Terminal</Link>
            <Link href="/chart" className="site-btn site-btn-outline">Open Charts</Link>
          </div>
        </RevealOnScroll>
      </section>
    </>
  );
}
