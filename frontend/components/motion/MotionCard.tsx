"use client";

import { motion } from "framer-motion";
import { EASE_OUT } from "@/lib/siteMotion";

interface Props {
  children: React.ReactNode;
  className?: string;
  delay?: number;
}

export default function MotionCard({ children, className = "", delay = 0 }: Props) {
  return (
    <motion.div
      className={className}
      initial={{ opacity: 0, y: 16 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: "-5% 0px" }}
      transition={{ duration: 0.45, delay, ease: EASE_OUT }}
      whileHover={{ y: -2, transition: { duration: 0.2 } }}
    >
      {children}
    </motion.div>
  );
}
