"use client";

import Link from "next/link";
import { motion } from "framer-motion";
import FadeIn from "@/components/motion/FadeIn";
import { EASE_OUT } from "@/lib/siteMotion";
import { PRODUCT_NAME, PRODUCT_MOTTO, PRODUCT_TAGLINE } from "@/lib/orionAlpha";

const PURPOSE = [
  {
    step: "01",
    title: "Understand markets",
    text: "Move from raw prices to structured insight — sector context, fundamentals, and session data in one flow.",
  },
  {
    step: "02",
    title: "Validate ideas",
    text: "Test hypotheses with charts, indicators, and company reports before committing to a view.",
  },
  {
    step: "03",
    title: "Act with clarity",
    text: "Monitor quotes, depth, and research profiles from a single professional desk.",
  },
];

const PATHS = [
  { href: "/research", code: "QR", title: "Quant Research", desc: "Factors, CAPM, Monte Carlo" },
  { href: "/terminal", code: "DESK", title: "Terminal", desc: "Live quotes & market depth" },
  { href: "/chart", code: "GP", title: "Charts", desc: "Full-screen technical analysis" },
];

const cardReveal = {
  hidden: { opacity: 0, y: 20 },
  visible: (i: number) => ({
    opacity: 1,
    y: 0,
    transition: { duration: 0.5, delay: 0.35 + i * 0.12, ease: EASE_OUT },
  }),
};

export default function HomeFinanceHub() {
  return (
    <section className="home-hero-simple site-section-wide">
      <header className="home-hero-simple-head">
        <FadeIn delay={0}>
          <p className="site-hero-badge">{PRODUCT_MOTTO}</p>
        </FadeIn>
        <FadeIn delay={0.08}>
          <h1 className="home-hero-simple-title">{PRODUCT_NAME}</h1>
        </FadeIn>
        <FadeIn delay={0.16}>
          <p className="home-hero-simple-lead">{PRODUCT_TAGLINE}</p>
        </FadeIn>
        <FadeIn delay={0.24}>
          <p className="home-hero-simple-desc">
            A research-first platform for investors who want clarity — not noise.
            Explore markets, validate ideas, and trade with conviction.
          </p>
        </FadeIn>
        <FadeIn delay={0.32}>
          <div className="site-hero-actions home-hero-simple-actions">
            <Link href="/research" className="site-btn site-btn-primary">Quant Research</Link>
            <Link href="/terminal" className="site-btn site-btn-outline">Open Terminal</Link>
            <Link href="/chart" className="site-btn site-btn-outline">View Charts</Link>
          </div>
        </FadeIn>
      </header>

      <motion.div
        className="home-hero-purpose-grid"
        initial="hidden"
        animate="visible"
        variants={{ visible: { transition: { staggerChildren: 0.1, delayChildren: 0.4 } } }}
      >
        {PURPOSE.map((item, i) => (
          <motion.article
            key={item.step}
            className="home-hero-purpose-card"
            custom={i}
            variants={cardReveal}
            whileHover={{ y: -3, transition: { duration: 0.2 } }}
          >
            <span className="home-hero-purpose-step mono">{item.step}</span>
            <h2 className="home-hero-purpose-title">{item.title}</h2>
            <p className="home-hero-purpose-text">{item.text}</p>
          </motion.article>
        ))}
      </motion.div>

      <motion.div
        className="home-hero-paths"
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay: 0.85, ease: EASE_OUT }}
      >
        {PATHS.map((p, i) => (
          <motion.div
            key={p.code}
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.45, delay: 0.95 + i * 0.1, ease: EASE_OUT }}
          >
            <Link href={p.href} className="home-hero-path-card">
              <span className="home-hero-path-code mono">{p.code}</span>
              <strong>{p.title}</strong>
              <span className="home-hero-path-desc">{p.desc}</span>
            </Link>
          </motion.div>
        ))}
      </motion.div>
    </section>
  );
}
