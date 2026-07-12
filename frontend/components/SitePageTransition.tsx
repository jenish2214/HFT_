"use client";

import { AnimatePresence, motion } from "framer-motion";
import { usePathname } from "next/navigation";
import { pageTransition } from "@/lib/siteMotion";

const SKIP_PREFIXES = ["/terminal", "/chart"];

export default function SitePageTransition({ children }: { children: React.ReactNode }) {
  const pathname = usePathname() ?? "";
  const skip = SKIP_PREFIXES.some((p) => pathname === p || pathname.startsWith(`${p}/`));

  if (skip) return <>{children}</>;

  return (
    <AnimatePresence mode="wait">
      <motion.div key={pathname} {...pageTransition} style={{ minHeight: "inherit" }}>
        {children}
      </motion.div>
    </AnimatePresence>
  );
}
