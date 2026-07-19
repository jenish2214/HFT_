"use client";

import Image from "next/image";
import Link from "next/link";
import { Mail, Microscope } from "lucide-react";
import SiteShell from "@/components/SiteShell";
import GsapReveal from "@/components/GsapReveal";
import {
  COMPANY_DISPLAY,
  CONTACT_TOPICS,
  INSTITUTION_TAGLINE,
} from "@/lib/companyBrand";
import { PRODUCT_NAME, PRODUCT_MOTTO, SUPPORT_EMAIL } from "@/lib/orionAlpha";

/** Contact — classic layout with GSAP motion. */
export default function ContactPageContent() {
  return (
    <SiteShell>
      <div className="fof-contact">
        <GsapReveal variant="scale">
          <figure className="fof-contact-hero-fig">
            <Image
              src="/contact/hero.jpg"
              alt="Quiet research desk overlooking the city"
              width={3840}
              height={2560}
              quality={92}
              className="fof-contact-hero-img"
              priority
              sizes="(max-width: 1080px) 100vw, 1080px"
            />
            <figcaption className="fof-contact-hero-cap">
              Research before investment — {COMPANY_DISPLAY}
            </figcaption>
          </figure>
        </GsapReveal>

        <GsapReveal variant="rise" delay={80}>
          <header className="fof-contact-header">
            <p className="fof-contact-badge">Get in touch</p>
            <h1>Contact Us</h1>
            <p className="fof-contact-lead">
              Questions about investor growth, diversification, research, or portfolio goals.
            </p>
          </header>
        </GsapReveal>

        <div className="fof-contact-classic">
          <GsapReveal variant="left" delay={100}>
            <div className="fof-contact-intro">
              <p className="fof-contact-kicker">{PRODUCT_MOTTO}</p>
              <h2>{PRODUCT_NAME}</h2>
              <p className="fof-contact-company">{COMPANY_DISPLAY}</p>
              <p className="fof-contact-copy">{INSTITUTION_TAGLINE}</p>
              <p className="fof-contact-copy">
                Discuss growth goals, diversification, research methods, or risk expectations.
                Our team responds directly by email.
              </p>

              <dl className="fof-contact-defs">
                <div>
                  <dt>Email</dt>
                  <dd>
                    <a href={`mailto:${SUPPORT_EMAIL}`}>{SUPPORT_EMAIL}</a>
                  </dd>
                </div>
                <div>
                  <dt>Team</dt>
                  <dd>Direct support from the {COMPANY_DISPLAY} research desk</dd>
                </div>
              </dl>

              <div className="fof-contact-actions">
                <a href={`mailto:${SUPPORT_EMAIL}`} className="site-btn site-btn-primary">
                  <Mail size={18} aria-hidden />
                  Email us
                </a>
                <Link href="/research" className="site-btn site-btn-outline">
                  <Microscope size={18} aria-hidden />
                  Research desk
                </Link>
                <Link href="/about" className="site-btn site-btn-outline">
                  About us
                </Link>
              </div>
            </div>
          </GsapReveal>

          <GsapReveal variant="right" delay={160}>
            <aside className="fof-contact-aside">
              <Image
                src="/contact/accent.jpg"
                alt="Glass architecture reflecting soft light"
                width={2400}
                height={1600}
                quality={90}
                className="fof-contact-aside-img"
                sizes="(max-width: 900px) 100vw, 420px"
              />
            </aside>
          </GsapReveal>
        </div>

        <GsapReveal variant="rise" delay={80}>
          <section className="fof-contact-topics" aria-labelledby="contact-topics-title">
            <h2 id="contact-topics-title">What you can reach us about</h2>
            <ol className="fof-contact-classic-list">
              {CONTACT_TOPICS.map((topic, i) => (
                <li key={topic.title}>
                  <span className="fof-contact-index mono">{String(i + 1).padStart(2, "0")}</span>
                  <div>
                    <h3>{topic.title}</h3>
                    <p>{topic.text}</p>
                    <a href={`mailto:${SUPPORT_EMAIL}?subject=${encodeURIComponent(topic.title)}`}>
                      Email about {topic.title.toLowerCase()}
                    </a>
                  </div>
                </li>
              ))}
            </ol>
          </section>
        </GsapReveal>
      </div>
    </SiteShell>
  );
}
