"use client";

import { motion } from "framer-motion";
import { scaleIn } from "@/lib/siteMotion";

interface Props {
  lines?: number;
  className?: string;
}

export default function SiteSkeleton({ lines = 3, className = "" }: Props) {
  return (
    <motion.div
      className={`site-skeleton-stack ${className}`.trim()}
      initial="hidden"
      animate="visible"
      variants={scaleIn}
      aria-hidden
    >
      {Array.from({ length: lines }, (_, i) => (
        <div
          key={i}
          className="site-skeleton"
          style={{
            height: i === 0 ? 14 : 10,
            width: i === lines - 1 ? "72%" : "100%",
            marginBottom: i < lines - 1 ? 10 : 0,
          }}
        />
      ))}
    </motion.div>
  );
}
