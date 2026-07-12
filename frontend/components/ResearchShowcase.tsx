"use client";

import Link from "next/link";
import RevealOnScroll from "@/components/motion/RevealOnScroll";
import MotionCard from "@/components/motion/MotionCard";
import { motion } from "framer-motion";
import { EASE_OUT } from "@/lib/siteMotion";

const RESEARCH_PURPOSE = [
  { title: "Explore", text: "Quotes, sectors, and fundamentals." },
  { title: "Analyze", text: "Charts and research profiles." },
  { title: "Monitor", text: "Terminal watchlists and depth." },
];

const PATTERN_SIGNALS = [
  { label: "Trend continuation", prob: 72, desc: "Price above moving averages" },
  { label: "Mean reversion", prob: 58, desc: "RSI stretch" },
  { label: "Breakout", prob: 64, desc: "MACD momentum" },
  { label: "Relative strength", prob: 81, desc: "Vs peer basket" },
];

const TERMINAL_FEATURES = [
  { title: "Price & depth", text: "Candlesticks and order book" },
  { title: "Fundamentals", text: "Financial statements" },
  { title: "Monitor", text: "Watchlist" },
  { title: "Research", text: "Factors and momentum on /research" },
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
          <h2 className="site-section-title">Research</h2>
          <p className="site-section-lead">Structured market analysis in one workflow.</p>
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
          <h2 className="site-section-title">Pattern scores</h2>
          <p className="site-section-lead">Technical setup scores on the research page.</p>
        </RevealOnScroll>
        <div className="site-prob-grid">
          {PATTERN_SIGNALS.map((s, i) => (
            <ProbBar key={s.label} {...s} delay={i * 0.1} />
          ))}
        </div>
      </section>

      <section className="site-section site-section-wide site-section-muted site-section-center">
        <RevealOnScroll>
          <h2 className="site-section-title">Terminal</h2>
          <p className="site-section-lead">Live desk tools.</p>
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
          <div className="site-section-actions">
            <Link href="/research" className="site-btn site-btn-primary">Research</Link>
            <Link href="/terminal" className="site-btn site-btn-outline">Terminal</Link>
          </div>
        </RevealOnScroll>
      </section>
    </>
  );
}
