"use client";

import Image from "next/image";
import Link from "next/link";
import { Mail, Microscope } from "lucide-react";
import { motion, useReducedMotion } from "framer-motion";
import SiteShell from "@/components/SiteShell";
import {
  COMPANY_DISPLAY,
  CONTACT_TOPICS,
  INSTITUTION_TAGLINE,
} from "@/lib/companyBrand";
import { PRODUCT_NAME, PRODUCT_MOTTO, SUPPORT_EMAIL } from "@/lib/orionAlpha";
import { EASE_OUT } from "@/lib/siteMotion";

const ease = EASE_OUT;

/** Contact — classic layout with framer-motion (from package.json). */
export default function ContactPageContent() {
  const reduce = useReducedMotion();

  const enter = (delay = 0, x = 0, y = 28, scale = 1) =>
    reduce
      ? { initial: false as const, animate: { opacity: 1 } }
      : {
          initial: { opacity: 0, x, y, scale },
          animate: { opacity: 1, x: 0, y: 0, scale: 1 },
          transition: { duration: 0.7, delay, ease },
        };

  const inView = (delay = 0, y = 24) =>
    reduce
      ? {}
      : {
          initial: { opacity: 0, y },
          whileInView: { opacity: 1, y: 0 },
          viewport: { once: true, amount: 0.25 },
          transition: { duration: 0.55, delay, ease },
        };

  return (
    <SiteShell>
      <div className="fof-contact">
        <motion.figure className="fof-contact-hero-fig" {...enter(0.05, 0, 20, 0.96)}>
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
        </motion.figure>

        <motion.header className="fof-contact-header" {...enter(0.15, 0, 32)}>
          <p className="fof-contact-badge">Get in touch</p>
          <h1>Contact Us</h1>
          <p className="fof-contact-lead">
            Questions about investor growth, diversification, research, or portfolio goals.
          </p>
        </motion.header>

        <div className="fof-contact-classic">
          <motion.div className="fof-contact-intro" {...enter(0.28, -36, 0)}>
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
              <motion.a
                href={`mailto:${SUPPORT_EMAIL}`}
                className="site-btn site-btn-primary"
                whileHover={reduce ? undefined : { y: -2, scale: 1.02 }}
                whileTap={reduce ? undefined : { scale: 0.98 }}
              >
                <Mail size={18} aria-hidden />
                Email us
              </motion.a>
              <Link href="/research" className="site-btn site-btn-outline">
                <Microscope size={18} aria-hidden />
                Research desk
              </Link>
              <Link href="/about" className="site-btn site-btn-outline">
                About us
              </Link>
            </div>
          </motion.div>

          <motion.aside className="fof-contact-aside" {...enter(0.38, 40, 0, 0.96)}>
            <Image
              src="/contact/accent.jpg"
              alt="Glass architecture reflecting soft light"
              width={2400}
              height={1600}
              quality={90}
              className="fof-contact-aside-img"
              sizes="(max-width: 900px) 100vw, 420px"
            />
          </motion.aside>
        </div>

        <motion.section
          className="fof-contact-topics"
          aria-labelledby="contact-topics-title"
          {...inView(0.05)}
        >
          <h2 id="contact-topics-title">What you can reach us about</h2>
          <ol className="fof-contact-classic-list">
            {CONTACT_TOPICS.map((topic, i) => (
              <motion.li
                key={topic.title}
                initial={reduce ? false : { opacity: 0, x: -16 }}
                whileInView={reduce ? undefined : { opacity: 1, x: 0 }}
                viewport={{ once: true, amount: 0.4 }}
                transition={{ duration: 0.45, delay: i * 0.08, ease }}
              >
                <span className="fof-contact-index mono">{String(i + 1).padStart(2, "0")}</span>
                <div>
                  <h3>{topic.title}</h3>
                  <p>{topic.text}</p>
                  <a href={`mailto:${SUPPORT_EMAIL}?subject=${encodeURIComponent(topic.title)}`}>
                    Email about {topic.title.toLowerCase()}
                  </a>
                </div>
              </motion.li>
            ))}
          </ol>
        </motion.section>
      </div>
    </SiteShell>
  );
}
