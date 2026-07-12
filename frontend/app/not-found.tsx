"use client";

import Link from "next/link";
import { motion } from "framer-motion";
import { scaleIn } from "@/lib/siteMotion";
import { PRODUCT_NAME } from "@/lib/orionAlpha";

export default function NotFound() {
  return (
    <div className="error-page-root">
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
          The route you requested does not exist on {PRODUCT_NAME}.
          Check the symbol or return to the terminal.
        </p>
        <div className="error-page-actions">
          <Link href="/terminal" className="error-page-btn error-page-btn-primary mono">Launch Terminal</Link>
          <Link href="/" className="error-page-btn mono">Home</Link>
          <Link href="/fundamentals?symbol=AAPL" className="error-page-btn mono">Fundamentals</Link>
        </div>
        <p className="error-page-hint mono">
          CMD: AAPL &lt;GO&gt; · FA · GP · HELP
        </p>
      </motion.div>
    </div>
  );
}
