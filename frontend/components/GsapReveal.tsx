"use client";

import { useRef, type ReactNode, type CSSProperties } from "react";
import { gsap, registerGsap, useGSAP } from "@/lib/gsapClient";

registerGsap();

type Variant = "rise" | "scale" | "fade" | "left" | "right";

interface Props {
  children: ReactNode;
  className?: string;
  variant?: Variant;
  delay?: number;
  stagger?: number;
  staggerChildren?: boolean;
  style?: CSSProperties;
}

const FROM: Record<Variant, gsap.TweenVars> = {
  rise: { opacity: 0, y: 48 },
  scale: { opacity: 0, y: 28, scale: 0.92 },
  fade: { opacity: 0 },
  left: { opacity: 0, x: -40 },
  right: { opacity: 0, x: 40 },
};

/** GSAP scroll reveal for marketing pages. */
export default function GsapReveal({
  children,
  className = "",
  variant = "rise",
  delay = 0,
  stagger = 0.1,
  staggerChildren = false,
  style,
}: Props) {
  const ref = useRef<HTMLDivElement>(null);

  useGSAP(
    () => {
      const el = ref.current;
      if (!el) return;

      if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
        gsap.set(el, { clearProps: "all" });
        return;
      }

      const targets = staggerChildren
        ? (Array.from(el.children) as HTMLElement[])
        : [el];

      gsap.set(targets, FROM[variant]);

      gsap.to(targets, {
        opacity: 1,
        x: 0,
        y: 0,
        scale: 1,
        duration: 0.85,
        delay: delay / 1000,
        stagger: staggerChildren ? stagger : 0,
        ease: "power3.out",
        scrollTrigger: {
          trigger: el,
          start: "top 88%",
          toggleActions: "play none none none",
        },
      });
    },
    { scope: ref, dependencies: [variant, delay, stagger, staggerChildren] },
  );

  return (
    <div ref={ref} className={`gsap-reveal ${className}`.trim()} style={style}>
      {children}
    </div>
  );
}
