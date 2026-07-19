"use client";

import Link from "next/link";
import { Mail, Microscope } from "lucide-react";
import { COMPANY_DISPLAY } from "@/lib/companyBrand";
import { PRODUCT_NAME, SUPPORT_EMAIL } from "@/lib/orionAlpha";

/** Compact classic contact block for reuse. */
export default function ContactSection({ id = "contact" }: { id?: string }) {
  return (
    <section id={id} className="site-section site-section-wide fof-contact-embed">
      <p className="fof-contact-kicker">Contact</p>
      <h2>{PRODUCT_NAME}</h2>
      <p className="fof-contact-company">{COMPANY_DISPLAY}</p>
      <p className="fof-contact-copy">
        Discuss investor growth goals, diversification, research methods, or risk expectations.
      </p>
      <dl className="fof-contact-defs">
        <div>
          <dt>Email</dt>
          <dd>
            <a href={`mailto:${SUPPORT_EMAIL}`}>{SUPPORT_EMAIL}</a>
          </dd>
        </div>
      </dl>
      <div className="fof-contact-actions">
        <a href={`mailto:${SUPPORT_EMAIL}`} className="site-btn site-btn-primary">
          <Mail size={16} aria-hidden />
          Email
        </a>
        <Link href="/research" className="site-btn site-btn-outline">
          <Microscope size={16} aria-hidden />
          Research
        </Link>
      </div>
    </section>
  );
}
