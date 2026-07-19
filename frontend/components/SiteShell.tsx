"use client";

import type { ReactNode } from "react";
import SiteNav from "@/components/SiteNav";
import SiteFooter from "@/components/SiteFooter";
import GsapPageMotion from "@/components/GsapPageMotion";

interface Props {
  children: ReactNode;
  className?: string;
}

/** Marketing shell — Future of Finance style. Not used by terminal/chart. */
export default function SiteShell({ children, className = "" }: Props) {
  return (
    <div className={`site-page oa-ui fof-shell ${className}`.trim()}>
      <GsapPageMotion>
        <SiteNav />
        <main className="site-main">{children}</main>
        <SiteFooter />
      </GsapPageMotion>
    </div>
  );
}
