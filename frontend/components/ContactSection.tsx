"use client";

import Link from "next/link";
import { Mail, Microscope } from "lucide-react";
import { CONTACT_TOPICS } from "@/lib/companyBrand";
import { COMPANY_NAME, PRODUCT_NAME, SUPPORT_EMAIL } from "@/lib/orionAlpha";

export default function ContactSection({ id = "contact" }: { id?: string }) {
  return (
    <section id={id} className="site-section site-section-wide site-contact">
      <div className="site-contact-card site-card">
        <p className="site-contact-brand">{PRODUCT_NAME}</p>
        <p className="site-contact-company">{COMPANY_NAME}</p>
        <p className="oa-about-story">
          Discuss investor growth goals, diversification, research methods, or risk expectations.
          Our team responds directly.
        </p>
        <a href={`mailto:${SUPPORT_EMAIL}`} className="site-contact-email">
          <Mail size={18} strokeWidth={1.75} aria-hidden />
          {SUPPORT_EMAIL}
        </a>
        <div className="site-contact-links">
          <a href={`mailto:${SUPPORT_EMAIL}`} className="site-btn site-btn-primary">
            <Mail size={16} aria-hidden />
            Email
          </a>
          <Link href="/research" className="site-btn site-btn-outline">
            <Microscope size={16} aria-hidden />
            Research
          </Link>
        </div>
      </div>

      <div className="oa-contact-topics-grid site-contact-topics">
        {CONTACT_TOPICS.map((topic) => (
          <article key={topic.title} className="oa-contact-topic-card site-card">
            <h3>{topic.title}</h3>
            <p>{topic.text}</p>
            <a
              href={`mailto:${SUPPORT_EMAIL}?subject=${encodeURIComponent(topic.title)}`}
              className="oa-contact-topic-link"
            >
              Email about {topic.title.toLowerCase()}
            </a>
          </article>
        ))}
      </div>
    </section>
  );
}
