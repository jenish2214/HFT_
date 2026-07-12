"use client";

import { motion } from "framer-motion";
import { fadeUp } from "@/lib/siteMotion";

interface Props {
  children: React.ReactNode;
  className?: string;
  delay?: number;
  as?: "div" | "section" | "article" | "header" | "footer" | "main";
}

export default function FadeIn({ children, className = "", delay = 0, as = "div" }: Props) {
  const Tag = motion[as];
  return (
    <Tag
      className={className}
      initial="hidden"
      animate="visible"
      custom={delay}
      variants={fadeUp}
    >
      {children}
    </Tag>
  );
}
