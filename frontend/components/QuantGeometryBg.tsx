"use client";

/** Subtle mixed-shape grid — quant firm aesthetic */
export default function QuantGeometryBg() {
  return (
    <div className="oa-quant-geo" aria-hidden>
      <svg className="oa-quant-geo-svg" viewBox="0 0 1200 800" preserveAspectRatio="xMidYMid slice">
        <defs>
          <pattern id="oa-shape-grid" width="80" height="80" patternUnits="userSpaceOnUse">
            <rect x="0" y="0" width="6" height="6" fill="currentColor" opacity="0.08" />
            <circle cx="60" cy="20" r="3" fill="none" stroke="currentColor" strokeWidth="0.5" opacity="0.12" />
            <rect x="40" y="50" width="5" height="5" fill="none" stroke="currentColor" strokeWidth="0.5" opacity="0.1" transform="rotate(45 42.5 52.5)" />
          </pattern>
        </defs>
        <rect width="100%" height="100%" fill="url(#oa-shape-grid)" />
      </svg>
    </div>
  );
}
