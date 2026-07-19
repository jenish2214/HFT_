"use client";

import Link from "next/link";
import { Mail, Microscope, TrendingUp, Users } from "lucide-react";
import SiteShell from "@/components/SiteShell";
import SitePageHeader from "@/components/SitePageHeader";
import SectionImage from "@/components/SectionImage";
import GsapReveal from "@/components/GsapReveal";
import {
  ABOUT_METRICS,
  COMPANY_ABOUT,
  COMPANY_DISPLAY,
  COMPANY_VALUES,
  CONTACT_TOPICS,
  DIVERSIFICATION_FOCUS,
  INSTITUTION_TAGLINE,
  INVESTOR_GROWTH_APPROACH,
  TEAM_EXPERTISE,
  TEAM_OVERVIEW,
  TEAM_SERVICES,
} from "@/lib/companyBrand";
import { DEMO_NOTICE } from "@/lib/demoNotice";
import { PRODUCT_NAME, PRODUCT_MOTTO, SUPPORT_EMAIL } from "@/lib/orionAlpha";

/** About — all details on one page with section-width images. */
export default function AboutPageContent() {
  return (
    <SiteShell>
      <div className="fof-about">
        <SitePageHeader
          badge={`${COMPANY_DISPLAY} · ${PRODUCT_MOTTO}`}
          title={`About ${PRODUCT_NAME}`}
          lead={INSTITUTION_TAGLINE}
        />

        <div className="site-about site-section-wide fof-about-body">
          <GsapReveal variant="scale">
            <SectionImage
              src="/sections/team.jpg"
              alt="Modern research workspace with soft ambient light"
              size="lg"
              priority
              className="fof-about-top-media"
            />
          </GsapReveal>

          <GsapReveal variant="rise">
            <section className="oa-demo-banner site-card fof-about-card" aria-label="Demo notice">
            <span className="oa-demo-banner-badge">{DEMO_NOTICE.badge}</span>
            <h2>{DEMO_NOTICE.title}</h2>
            {DEMO_NOTICE.paragraphs.map((p) => (
              <p key={p.slice(0, 40)} className="oa-demo-banner-text">{p}</p>
            ))}
            <div className="oa-demo-points">
              {DEMO_NOTICE.points.map((pt) => (
                <div key={pt.label} className="oa-demo-point">
                  <span className="oa-demo-point-label">{pt.label}</span>
                  <strong>{pt.value}</strong>
                </div>
              ))}
            </div>
          </section>
          </GsapReveal>

          <GsapReveal variant="rise">
            <section className="oa-about-hero site-card fof-about-card fof-about-story-card">
            <p className="oa-about-eyebrow">{COMPANY_DISPLAY}</p>
            <h2>{COMPANY_ABOUT.headline}</h2>
            <p className="oa-about-story">{COMPANY_ABOUT.story}</p>
            <p className="oa-about-mission">
              <strong>Mission</strong>
              {COMPANY_ABOUT.mission}
            </p>
          </section></GsapReveal>

          <GsapReveal variant="scale" staggerChildren>
          <div className="oa-about-metrics fof-about-metrics">
            {ABOUT_METRICS.map((m) => (
              <div key={m.label} className="oa-about-metric site-card fof-about-metric">
                <strong className="oa-about-metric-value">{m.value}</strong>
                <span className="oa-about-metric-label">{m.label}</span>
                <span className="oa-about-metric-hint">{m.hint}</span>
              </div>
            ))}
          </div>
          </GsapReveal>

          <GsapReveal variant="rise"><section className="site-about-block site-card oa-team-section fof-about-card">
            <div className="oa-team-section-head">
              <span className="fof-about-icon" aria-hidden>
                <Users size={26} strokeWidth={1.75} />
              </span>
              <div>
                <h2>{TEAM_OVERVIEW.headline}</h2>
                <p className="oa-about-story">{TEAM_OVERVIEW.intro}</p>
                <p className="oa-team-scale">{TEAM_OVERVIEW.scale}</p>
              </div>
            </div>
            <div className="oa-team-expertise-grid fof-about-grid">
              {TEAM_EXPERTISE.map((item) => (
                <article key={item.area} className="oa-team-expertise-card fof-about-tile">
                  <h3>{item.area}</h3>
                  <p>{item.detail}</p>
                </article>
              ))}
            </div>
          </section></GsapReveal>

          <GsapReveal variant="rise"><section className="site-about-block site-card fof-about-card">
            <div className="oa-team-section-head">
              <span className="fof-about-icon" aria-hidden>
                <TrendingUp size={26} strokeWidth={1.75} />
              </span>
              <div>
                <h2>{INVESTOR_GROWTH_APPROACH.headline}</h2>
                <p className="oa-about-story">{INVESTOR_GROWTH_APPROACH.intro}</p>
              </div>
            </div>
            <ul className="oa-about-deliverables fof-about-list">
              {INVESTOR_GROWTH_APPROACH.points.map((point) => (
                <li key={point}>{point}</li>
              ))}
            </ul>
          </section></GsapReveal>

          <GsapReveal variant="rise"><section className="site-about-block site-card fof-about-card">
            <h2>Diversification at the core</h2>
            <p className="oa-about-story">
              We do not rely on one market, one factor, or one narrative. Our research model is built
              to spread risk and seek growth across a broad, diversified universe.
            </p>
            <div className="oa-team-expertise-grid fof-about-grid">
              {DIVERSIFICATION_FOCUS.map((item) => (
                <article key={item.title} className="oa-team-expertise-card fof-about-tile">
                  <h3>{item.title}</h3>
                  <p>{item.text}</p>
                </article>
              ))}
            </div>
          </section></GsapReveal>

          <GsapReveal variant="rise"><section className="site-about-block site-card fof-about-card">
            <h2>How we support investors</h2>
            <p className="oa-about-story">
              {PRODUCT_NAME} is a research platform operated by {COMPANY_DISPLAY}. We help investors
              manage and grow assets through algorithm-wise analysis, diversification, and ongoing
              performance review — aligned with what each investor expects from their capital.
            </p>
            <ul className="oa-about-deliverables fof-about-list">
              {TEAM_SERVICES.map((s) => (
                <li key={s}>{s}</li>
              ))}
            </ul>
          </section></GsapReveal>

          <GsapReveal variant="rise"><section className="site-about-block site-card fof-about-card">
            <h2>Our values</h2>
            <div className="oa-values-grid fof-about-grid fof-about-values">
              {COMPANY_VALUES.map((v, i) => (
                <article key={v.title} className="oa-value-item fof-about-tile">
                  <span className="fof-about-tile-num mono">{String(i + 1).padStart(2, "0")}</span>
                  <h3>{v.title}</h3>
                  <p>{v.text}</p>
                </article>
              ))}
            </div>
          </section></GsapReveal>

          <GsapReveal variant="rise"><section className="site-about-block site-card oa-contact-topics fof-about-card">
            <h2>Contact us about</h2>
            <p className="oa-about-story">
              Whether you want to discuss growth goals, diversification, research methods, or risk
              limits — our team responds directly. Share your expectations and we will explain how
              our research model can support your asset growth plan.
            </p>
            <div className="oa-contact-topics-grid fof-about-grid">
              {CONTACT_TOPICS.map((topic) => (
                <article key={topic.title} className="oa-contact-topic-card fof-about-tile">
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
          </section></GsapReveal>

          <GsapReveal variant="rise"><section className="site-about-block site-card oa-about-contact fof-about-card">
            <h2>Contact {COMPANY_DISPLAY}</h2>
            <p className="oa-about-story">
              Email our team to discuss investor growth goals, diversification, research partnerships,
              or any question about how {PRODUCT_NAME} supports asset management.
            </p>
            <div className="oa-about-contact-row">
              <a href={`mailto:${SUPPORT_EMAIL}`} className="site-btn site-btn-primary">
                <Mail size={18} aria-hidden />
                {SUPPORT_EMAIL}
              </a>
              <Link href="/contact" className="site-btn site-btn-outline">
                Contact page
              </Link>
            </div>
          </section></GsapReveal>

          <GsapReveal variant="rise">
          <div className="site-about-actions fof-about-actions">
            <Link href="/research" className="site-btn site-btn-primary">
              <Microscope size={18} aria-hidden />
              Research desk
            </Link>
            <Link href="/contact" className="site-btn site-btn-outline">
              <Mail size={18} aria-hidden />
              Contact us
            </Link>
          </div>
          </GsapReveal>
        </div>
      </div>
    </SiteShell>
  );
}
