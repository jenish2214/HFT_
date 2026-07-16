"use client";

import type { ReactNode } from "react";
import SiteNav from "@/components/SiteNav";
import SiteFooter from "@/components/SiteFooter";

interface Props {
  children: ReactNode;
  className?: string;
}

/** Shared layout shell for all marketing / site pages. */
export default function SiteShell({ children, className = "" }: Props) {
  return (
    <div className={`site-page oa-ui ${className}`.trim()}>
      <SiteNav />
      <main className="site-main">{children}</main>
      <SiteFooter />
    </div>
  );
}
