"use client";

import { useEffect } from "react";
import { usePathname } from "next/navigation";
import { gsap, registerGsap, ScrollTrigger } from "@/lib/gsapClient";

registerGsap();

/**
 * Site-wide GSAP — page-enter motion + ScrollTrigger refresh on navigation.
 */
export default function GsapPageMotion({ children }: { children: React.ReactNode }) {
  const path = usePathname();

  useEffect(() => {
    registerGsap();

    const shell = document.querySelector(".fof-shell");
    if (!shell) {
      ScrollTrigger.refresh();
      return undefined;
    }

    const ctx = gsap.context(() => {
      const header = shell.querySelector(
        ".oa-page-header, .fof-contact-header, .fof-hero-copy, .fof-about",
      );
      const headerTarget = shell.querySelector(".oa-page-header, .fof-contact-header, .fof-hero-copy");
      if (headerTarget) {
        gsap.fromTo(
          headerTarget,
          { opacity: 0, y: 32 },
          { opacity: 1, y: 0, duration: 0.85, ease: "power3.out", clearProps: "all" },
        );
      }

      const nav = shell.querySelector(".site-nav-bar");
      if (nav) {
        gsap.fromTo(
          nav,
          { opacity: 0, y: -16 },
          { opacity: 1, y: 0, duration: 0.6, ease: "power2.out", clearProps: "all" },
        );
      }
    }, shell);

    const t = window.setTimeout(() => ScrollTrigger.refresh(), 80);
    return () => {
      window.clearTimeout(t);
      ctx.revert();
    };
  }, [path]);

  return <>{children}</>;
}
