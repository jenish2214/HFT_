"use client";

/** Subtle Amex-style blue accent — no gradients */
export default function HomeAnimatedBackdrop() {
  return (
    <div className="oa-home-backdrop" aria-hidden>
      <div className="oa-home-accent-bar oa-home-accent-bar-top" />
      <div className="oa-home-accent-bar oa-home-accent-bar-side" />
    </div>
  );
}
