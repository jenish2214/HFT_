"use client";

import { motion, useReducedMotion } from "framer-motion";
import { PRODUCT_MOTTO, PRODUCT_MOTTO_LONG } from "@/lib/orionAlpha";
import { EASE_OUT } from "@/lib/siteMotion";

const HIGHLIGHTS = ["true value", "not speculation", "returns wisely"];

function splitMottoWithHighlights(text: string) {
  const parts: { text: string; highlight: boolean }[] = [];
  let remaining = text;
  const lower = text.toLowerCase();

  while (remaining.length > 0) {
    let found: { idx: number; phrase: string } | null = null;
    for (const phrase of HIGHLIGHTS) {
      const idx = remaining.toLowerCase().indexOf(phrase);
      if (idx !== -1 && (found === null || idx < found.idx)) {
        found = { idx, phrase };
      }
    }
    if (!found) {
      parts.push({ text: remaining, highlight: false });
      break;
    }
    if (found.idx > 0) {
      parts.push({ text: remaining.slice(0, found.idx), highlight: false });
    }
    parts.push({
      text: remaining.slice(found.idx, found.idx + found.phrase.length),
      highlight: true,
    });
    remaining = remaining.slice(found.idx + found.phrase.length);
  }
  return parts;
}

const container = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: { staggerChildren: 0.06, delayChildren: 0.2 },
  },
};

const word = {
  hidden: { opacity: 0, y: 14, filter: "blur(4px)" },
  visible: {
    opacity: 1,
    y: 0,
    filter: "blur(0px)",
    transition: { duration: 0.45, ease: EASE_OUT },
  },
};

const highlight = {
  hidden: { opacity: 0, y: 10, scale: 0.96 },
  visible: {
    opacity: 1,
    y: 0,
    scale: 1,
    transition: { duration: 0.5, ease: EASE_OUT },
  },
};

interface Props {
  compact?: boolean;
  className?: string;
}

export default function AnimatedMottoBanner({ compact = false, className = "" }: Props) {
  const reduceMotion = useReducedMotion();
  const parts = splitMottoWithHighlights(PRODUCT_MOTTO_LONG);

  return (
    <motion.div
      className={`oa-motto-banner oa-motto-animated site-section-wide ${compact ? "oa-motto-compact" : ""} ${className}`.trim()}
      initial={{ opacity: 0, y: reduceMotion ? 0 : 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.55, ease: EASE_OUT }}
    >
      <div className="oa-motto-animated-shapes" aria-hidden>
        <motion.span
          className="oa-motto-shape oa-motto-shape-sq"
          animate={reduceMotion ? {} : { rotate: [0, 90, 0], opacity: [0.3, 0.6, 0.3] }}
          transition={{ duration: 8, repeat: Infinity, ease: "easeInOut" }}
        />
        <motion.span
          className="oa-motto-shape oa-motto-shape-ci"
          animate={reduceMotion ? {} : { scale: [1, 1.15, 1], opacity: [0.25, 0.5, 0.25] }}
          transition={{ duration: 6, repeat: Infinity, ease: "easeInOut", delay: 1 }}
        />
      </div>

      <motion.div
        className="oa-motto-label-wrap"
        initial={{ opacity: 0, x: reduceMotion ? 0 : -12 }}
        animate={{ opacity: 1, x: 0 }}
        transition={{ duration: 0.4, delay: 0.1 }}
      >
        <motion.strong
          className="oa-motto-label"
          animate={
            reduceMotion
              ? {}
              : {
                  boxShadow: [
                    "0 0 0 0 rgba(0, 111, 207, 0.35)",
                    "0 0 0 8px rgba(0, 111, 207, 0)",
                  ],
                }
          }
          transition={{ duration: 2.2, repeat: Infinity, ease: "easeOut" }}
        >
          {PRODUCT_MOTTO}
        </motion.strong>
        <motion.span
          className="oa-motto-label-line"
          initial={{ scaleX: 0 }}
          animate={{ scaleX: 1 }}
          transition={{ duration: 0.6, delay: 0.35, ease: EASE_OUT }}
        />
      </motion.div>

      <motion.p
        className="oa-motto-animated-text"
        variants={container}
        initial="hidden"
        animate="visible"
        aria-label={PRODUCT_MOTTO_LONG}
      >
        {parts.map((part, pi) =>
          part.highlight ? (
            <motion.span
              key={`h-${pi}`}
              className="oa-motto-highlight"
              variants={highlight}
              whileHover={reduceMotion ? {} : { scale: 1.03 }}
            >
              {part.text.split(" ").map((w, wi) => (
                <motion.span key={wi} className="oa-motto-word" variants={word}>
                  {w}
                  {wi < part.text.split(" ").length - 1 ? " " : ""}
                </motion.span>
              ))}
            </motion.span>
          ) : (
            part.text.split(" ").map((w, wi) => (
              <motion.span key={`${pi}-${wi}`} className="oa-motto-word" variants={word}>
                {w}{" "}
              </motion.span>
            ))
          ),
        )}
      </motion.p>
    </motion.div>
  );
}

const ROLES = ["researchers", "analysts", "strategists", "risk managers", "investors"];

export function AnimatedIdentityStrip() {
  const reduceMotion = useReducedMotion();

  return (
    <motion.div
      className="oa-identity-strip oa-identity-animated site-section-wide"
      initial={{ opacity: 0 }}
      whileInView={{ opacity: 1 }}
      viewport={{ once: true, margin: "-40px" }}
      transition={{ duration: 0.5 }}
    >
      <span className="oa-identity-prefix">We are</span>
      <span className="oa-identity-roles">
        {ROLES.map((role, i) => (
          <motion.em
            key={role}
            initial={{ opacity: 0, y: 8 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: 0.15 + i * 0.08, duration: 0.4 }}
            whileHover={reduceMotion ? {} : { color: "var(--amex-blue)", y: -2 }}
          >
            {role}
          </motion.em>
        ))}
      </span>
      <motion.span
        className="oa-identity-suffix"
        initial={{ opacity: 0 }}
        whileInView={{ opacity: 1 }}
        viewport={{ once: true }}
        transition={{ delay: 0.6, duration: 0.5 }}
      >
        — research before every investment.
      </motion.span>
    </motion.div>
  );
}
