"use client";

import Link from "next/link";
import RevealOnScroll from "@/components/motion/RevealOnScroll";
import { COMPANY_NAME, PRODUCT_NAME } from "@/lib/orionAlpha";

export default function ContactSection({ id = "contact" }: { id?: string }) {
  return (
    <section id={id} className="site-section site-section-wide site-contact">
      <RevealOnScroll>
        <h2 className="site-section-title">Contact Us</h2>
        <div className="site-contact-card">
          <p className="site-contact-brand">{PRODUCT_NAME} Professional Services</p>
          <p className="site-contact-company">Made by {COMPANY_NAME}</p>
          <p className="site-contact-text">
            For platform access, research desk support, or general inquiries about Orion Alpha,
            reach out through the links below.
          </p>
          <div className="site-contact-links">
            <Link href="/terminal" className="site-btn site-btn-primary">Open Terminal</Link>
            <Link href="/about" className="site-btn site-btn-outline">About Us</Link>
          </div>
        </div>
      </RevealOnScroll>
    </section>
  );
}
