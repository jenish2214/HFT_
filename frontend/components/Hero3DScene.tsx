"use client";

import { useEffect, useRef } from "react";

const ORBIT_LABELS = ["Value", "Momentum", "Risk", "Macro", "Factors", "Alpha"];

export default function Hero3DScene() {
  const tiltRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const tilt = tiltRef.current;
    if (!tilt) return;

    const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    if (reduced) return;

    let raf = 0;
    const onMove = (e: PointerEvent) => {
      cancelAnimationFrame(raf);
      raf = requestAnimationFrame(() => {
        const x = (e.clientX / window.innerWidth - 0.5) * 16;
        const y = (e.clientY / window.innerHeight - 0.5) * -12;
        tilt.style.transform = `rotateY(${x}deg) rotateX(${y}deg)`;
      });
    };

    window.addEventListener("pointermove", onMove, { passive: true });
    return () => {
      window.removeEventListener("pointermove", onMove);
      cancelAnimationFrame(raf);
    };
  }, []);

  return (
    <div className="hero-3d-wrap" aria-hidden>
      <div className="hero-3d-stage">
        <div className="hero-3d-tilt" ref={tiltRef}>
          <div className="hero-3d-scene">
            <div className="hero-3d-ring hero-3d-ring-a" />
            <div className="hero-3d-ring hero-3d-ring-b" />
            <div className="hero-3d-core">
              <span className="hero-3d-logo">OA</span>
              <span className="hero-3d-motto">True Value</span>
            </div>
            {ORBIT_LABELS.map((label, i) => (
              <div
                key={label}
                className="hero-3d-orbit"
                style={{ "--orbit-i": i } as React.CSSProperties}
              >
                <span>{label}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
