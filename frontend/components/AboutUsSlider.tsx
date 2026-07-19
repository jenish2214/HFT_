"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { ArrowRight, ChevronLeft, ChevronRight } from "lucide-react";
import {
  ABOUT_METRICS,
  COMPANY_ABOUT,
  COMPANY_DISPLAY,
  COMPANY_VALUES,
} from "@/lib/companyBrand";
import { PRODUCT_NAME } from "@/lib/orionAlpha";

const ABOUT_SLIDES = [
  {
    kicker: "Who we are",
    title: COMPANY_ABOUT.headline,
    body: COMPANY_ABOUT.story,
  },
  {
    kicker: "Mission",
    title: "Grow assets wisely",
    body: COMPANY_ABOUT.mission,
  },
  ...COMPANY_VALUES.map((v) => ({
    kicker: "Values",
    title: v.title,
    body: v.text,
  })),
  ...ABOUT_METRICS.slice(0, 2).map((m) => ({
    kicker: m.label,
    title: m.value,
    body: m.hint,
  })),
] as const;

interface Props {
  /** Show CTA to /about */
  showCta?: boolean;
  className?: string;
}

/** Auto-advancing About Us slider — home + about pages. */
export default function AboutUsSlider({ showCta = true, className = "" }: Props) {
  const [index, setIndex] = useState(0);
  const [dir, setDir] = useState<"next" | "prev">("next");
  const total = ABOUT_SLIDES.length;
  const slide = ABOUT_SLIDES[index];

  useEffect(() => {
    const id = window.setInterval(() => {
      setDir("next");
      setIndex((i) => (i + 1) % total);
    }, 4500);
    return () => window.clearInterval(id);
  }, [total]);

  const go = (next: number, direction: "next" | "prev") => {
    setDir(direction);
    setIndex((next + total) % total);
  };

  return (
    <div className={`fof-about-slider ${className}`.trim()} aria-roledescription="carousel" aria-label="About us">
      <div className="fof-about-slider-track">
        <article
          key={`${slide.title}-${index}`}
          className={`fof-about-slider-slide fof-about-slider-${dir}`}
        >
          <p className="fof-about-slider-kicker">{slide.kicker}</p>
          <h3>{slide.title}</h3>
          <p>{slide.body}</p>
          <span className="fof-about-slider-count mono">
            {String(index + 1).padStart(2, "0")} / {String(total).padStart(2, "0")}
          </span>
        </article>
      </div>

      <div className="fof-about-slider-bar">
        <button
          type="button"
          className="fof-about-slider-btn"
          aria-label="Previous about slide"
          onClick={() => go(index - 1, "prev")}
        >
          <ChevronLeft size={20} aria-hidden />
        </button>

        <div className="fof-about-slider-dots" role="tablist" aria-label="About slides">
          {ABOUT_SLIDES.map((s, i) => (
            <button
              key={`${s.kicker}-${s.title}`}
              type="button"
              role="tab"
              aria-selected={i === index}
              aria-label={`${s.kicker}: ${s.title}`}
              className={`fof-about-slider-dot${i === index ? " is-active" : ""}`}
              onClick={() => go(i, i > index ? "next" : "prev")}
            />
          ))}
        </div>

        <button
          type="button"
          className="fof-about-slider-btn"
          aria-label="Next about slide"
          onClick={() => go(index + 1, "next")}
        >
          <ChevronRight size={20} aria-hidden />
        </button>
      </div>

      {showCta && (
        <div className="fof-about-slider-cta">
          <p>
            Operated by {COMPANY_DISPLAY} · {PRODUCT_NAME}
          </p>
          <Link href="/about" className="fof-btn fof-btn-ghost">
            <span>About us</span>
            <span className="fof-btn-icon" aria-hidden>
              <ArrowRight size={14} strokeWidth={2.5} />
            </span>
          </Link>
        </div>
      )}
    </div>
  );
}
