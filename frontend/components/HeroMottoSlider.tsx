"use client";

import { useCallback, useEffect, useState, type ReactNode } from "react";
import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import { ChevronLeft, ChevronRight } from "lucide-react";
import {
  PRODUCT_MOTTO,
  PRODUCT_MOTTO_LONG,
  PRODUCT_NAME,
  PRODUCT_TAGLINE,
} from "@/lib/orionAlpha";
import { INVESTMENT_PHILOSOPHY } from "@/lib/companyBrand";
import { EASE_OUT } from "@/lib/siteMotion";

const ROLES = ["researchers", "analysts", "strategists", "risk managers", "investors"];

const SLIDES = [
  {
    id: "motto",
    badge: PRODUCT_MOTTO,
    title: "Research before every investment",
    body: PRODUCT_MOTTO_LONG,
    highlights: ["true value", "not speculation", "returns wisely"],
  },
  {
    id: "tagline",
    badge: PRODUCT_TAGLINE,
    title: PRODUCT_NAME,
    body: "A quantitative markets desk for investors who want clarity — not noise — before allocating capital.",
    highlights: [] as string[],
  },
  {
    id: "roles",
    badge: "Our approach",
    title: "Built for serious market participants",
    body: `We are ${ROLES.join(", ")} who believe every investment decision deserves rigorous research first.`,
    highlights: ROLES,
  },
  {
    id: "philosophy",
    badge: "Philosophy",
    title: INVESTMENT_PHILOSOPHY[0].title,
    body: INVESTMENT_PHILOSOPHY[0].text,
    highlights: ["fundamentals", "factors", "risk metrics"],
  },
] as const;

function highlightText(text: string, phrases: readonly string[]) {
  if (!phrases.length) return text;
  const lower = text.toLowerCase();
  const nodes: ReactNode[] = [];
  let cursor = 0;
  let key = 0;

  while (cursor < text.length) {
    let best: { idx: number; phrase: string } | null = null;
    for (const phrase of phrases) {
      const idx = lower.indexOf(phrase.toLowerCase(), cursor);
      if (idx !== -1 && (best === null || idx < best.idx)) best = { idx, phrase };
    }
    if (!best) {
      nodes.push(text.slice(cursor));
      break;
    }
    if (best.idx > cursor) nodes.push(text.slice(cursor, best.idx));
    nodes.push(
      <mark key={key++} className="oa-hero-slide-mark">
        {text.slice(best.idx, best.idx + best.phrase.length)}
      </mark>,
    );
    cursor = best.idx + best.phrase.length;
  }
  return nodes;
}

const slideVariants = {
  enter: (dir: number) => ({ opacity: 0, x: dir > 0 ? 48 : -48 }),
  center: { opacity: 1, x: 0 },
  exit: (dir: number) => ({ opacity: 0, x: dir > 0 ? -48 : 48 }),
};

export default function HeroMottoSlider() {
  const reduceMotion = useReducedMotion();
  const [index, setIndex] = useState(0);
  const [direction, setDirection] = useState(1);
  const [paused, setPaused] = useState(false);

  const go = useCallback(
    (next: number) => {
      setDirection(next > index ? 1 : -1);
      setIndex((next + SLIDES.length) % SLIDES.length);
    },
    [index],
  );

  const next = useCallback(() => go(index + 1), [go, index]);
  const prev = useCallback(() => go(index - 1), [go, index]);

  useEffect(() => {
    if (reduceMotion || paused) return;
    const t = window.setInterval(() => {
      setDirection(1);
      setIndex((i) => (i + 1) % SLIDES.length);
    }, 5500);
    return () => window.clearInterval(t);
  }, [reduceMotion, paused]);

  const slide = SLIDES[index];

  return (
    <div
      className="oa-hero-slider"
      onMouseEnter={() => setPaused(true)}
      onMouseLeave={() => setPaused(false)}
      onFocus={() => setPaused(true)}
      onBlur={() => setPaused(false)}
    >
      <div className="oa-hero-slider-head">
        <motion.span
          className="oa-glass-badge oa-hero-slider-brand"
          initial={{ opacity: 0, y: -8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4 }}
        >
          {PRODUCT_MOTTO} · BSJ Infotech
          <span className="oa-demo-pill">Demo</span>
        </motion.span>
        <h1 className="oa-home-title oa-hero-slider-title">{PRODUCT_NAME}</h1>
      </div>

      <div className="oa-hero-slider-viewport oa-glass-card">
        <button type="button" className="oa-hero-slider-arrow oa-hero-slider-prev" onClick={prev} aria-label="Previous slide">
          <ChevronLeft size={20} />
        </button>

        <div className="oa-hero-slider-track">
          <AnimatePresence mode="wait" custom={direction}>
            <motion.div
              key={slide.id}
              className="oa-hero-slide"
              custom={direction}
              variants={slideVariants}
              initial="enter"
              animate="center"
              exit="exit"
              transition={{ duration: 0.45, ease: EASE_OUT }}
            >
              <span className="oa-hero-slide-badge">{slide.badge}</span>
              <h2 className="oa-hero-slide-title">{slide.title}</h2>
              <p className="oa-hero-slide-body">{highlightText(slide.body, slide.highlights)}</p>
            </motion.div>
          </AnimatePresence>
        </div>

        <button type="button" className="oa-hero-slider-arrow oa-hero-slider-next" onClick={next} aria-label="Next slide">
          <ChevronRight size={20} />
        </button>
      </div>

      <div className="oa-hero-slider-dots" role="tablist" aria-label="Motto slides">
        {SLIDES.map((s, i) => (
          <button
            key={s.id}
            type="button"
            role="tab"
            aria-selected={i === index}
            aria-label={`Slide ${i + 1}: ${s.title}`}
            className={`oa-hero-slider-dot${i === index ? " is-active" : ""}`}
            onClick={() => go(i)}
          />
        ))}
      </div>

      <p className="oa-hero-slider-tagline">{PRODUCT_TAGLINE}</p>
    </div>
  );
}
