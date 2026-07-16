"use client";

import { usePathname } from "next/navigation";

const SKIP_PREFIXES = ["/terminal", "/chart"];

/** Plain wrapper — no page fade/slide animations. */
export default function SitePageTransition({ children }: { children: React.ReactNode }) {
  const pathname = usePathname() ?? "";
  const skip = SKIP_PREFIXES.some((p) => pathname === p || pathname.startsWith(`${p}/`));

  return <div className={skip ? undefined : "site-page-root"}>{children}</div>;
}
