"use client";

import Link from "next/link";
import RevealOnScroll from "@/components/motion/RevealOnScroll";
import { COMPANY_NAME, PRODUCT_NAME, SUPPORT_EMAIL } from "@/lib/orionAlpha";

export default function ContactSection({ id = "contact" }: { id?: string }) {
  return (
    <section id={id} className="site-section site-section-wide site-contact">
      <RevealOnScroll>
        <h2 className="site-section-title">Contact</h2>
        <div className="site-contact-card">
          <p className="site-contact-brand">{PRODUCT_NAME}</p>
          <p className="site-contact-company">{COMPANY_NAME}</p>
          <a href={`mailto:${SUPPORT_EMAIL}`} className="site-contact-email mono">
            {SUPPORT_EMAIL}
          </a>
          <div className="site-contact-links">
            <a href={`mailto:${SUPPORT_EMAIL}`} className="site-btn site-btn-primary">Email</a>
            <Link href="/research" className="site-btn site-btn-outline">Research</Link>
          </div>
        </div>
      </RevealOnScroll>
    </section>
  );
}
