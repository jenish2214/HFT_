"use client";

import Link from "next/link";
import { motion } from "framer-motion";
import { Home, Microscope, Terminal } from "lucide-react";
import { scaleIn } from "@/lib/siteMotion";
import { PRODUCT_NAME } from "@/lib/orionAlpha";

export default function NotFound() {
  return (
    <div className="error-page-root oa-ui">
      <motion.div
        className="error-page-card"
        initial="hidden"
        animate="visible"
        custom={0}
        variants={scaleIn}
      >
        <div className="error-page-code mono">404</div>
        <h1 className="error-page-title">Page Not Found</h1>
        <p className="error-page-msg">
          The page you requested does not exist on {PRODUCT_NAME}.
        </p>
        <div className="error-page-actions">
          <Link href="/" className="error-page-btn error-page-btn-primary">
            <Home size={16} aria-hidden />
            Home
          </Link>
          <Link href="/research" className="error-page-btn">
            <Microscope size={16} aria-hidden />
            Research
          </Link>
          <Link href="/terminal" className="error-page-btn">
            <Terminal size={16} aria-hidden />
            Terminal
          </Link>
        </div>
      </motion.div>
    </div>
  );
}
