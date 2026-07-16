"use client";

import Link from "next/link";
import { useCallback, useEffect, useState } from "react";
import { Mail, Microscope, TrendingUp, Users } from "lucide-react";
import SiteShell from "@/components/SiteShell";
import SitePageHeader from "@/components/SitePageHeader";
import AboutTabNav, { AboutTabPanel, type AboutTabId, ABOUT_TABS } from "@/components/AboutTabNav";
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

const TAB_IDS = new Set(ABOUT_TABS.map((t) => t.id));

function parseTabFromHash(): AboutTabId {
  if (typeof window === "undefined") return "overview";
  const raw = window.location.hash.replace(/^#/, "");
  return TAB_IDS.has(raw as AboutTabId) ? (raw as AboutTabId) : "overview";
}

export default function AboutPageContent() {
  const [activeTab, setActiveTab] = useState<AboutTabId>("overview");

  const selectTab = useCallback((tab: AboutTabId) => {
    setActiveTab(tab);
    if (typeof window !== "undefined") {
      const url = new URL(window.location.href);
      url.hash = tab;
      window.history.replaceState(null, "", url.toString());
    }
  }, []);

  useEffect(() => {
    setActiveTab(parseTabFromHash());
    const onHashChange = () => setActiveTab(parseTabFromHash());
    window.addEventListener("hashchange", onHashChange);
    return () => window.removeEventListener("hashchange", onHashChange);
  }, []);

  return (
    <SiteShell>
      <SitePageHeader
        badge={`${COMPANY_DISPLAY} · ${PRODUCT_MOTTO}`}
        title={`About ${PRODUCT_NAME}`}
        lead={INSTITUTION_TAGLINE}
      />

      <AboutTabNav active={activeTab} onChange={selectTab} />

      <div className="site-about site-section-wide">
        <AboutTabPanel id="overview" active={activeTab}>
          <section className="oa-demo-banner site-card" aria-label="Demo notice">
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

          <section className="oa-about-hero site-card">
            <p className="oa-about-eyebrow">{COMPANY_DISPLAY}</p>
            <h2>{COMPANY_ABOUT.headline}</h2>
            <p className="oa-about-story">{COMPANY_ABOUT.story}</p>
            <p className="oa-about-mission"><strong>Mission:</strong> {COMPANY_ABOUT.mission}</p>
          </section>

          <div className="oa-about-metrics">
            {ABOUT_METRICS.map((m) => (
              <div key={m.label} className="oa-about-metric site-card">
                <strong className="oa-about-metric-value">{m.value}</strong>
                <span className="oa-about-metric-label">{m.label}</span>
                <span className="oa-about-metric-hint">{m.hint}</span>
              </div>
            ))}
          </div>
        </AboutTabPanel>

        <AboutTabPanel id="team" active={activeTab}>
          <section className="site-about-block site-card oa-team-section">
            <div className="oa-team-section-head">
              <Users size={24} className="oa-team-icon" aria-hidden />
              <div>
                <h2>{TEAM_OVERVIEW.headline}</h2>
                <p className="oa-about-story">{TEAM_OVERVIEW.intro}</p>
                <p className="oa-team-scale">{TEAM_OVERVIEW.scale}</p>
              </div>
            </div>
            <div className="oa-team-expertise-grid">
              {TEAM_EXPERTISE.map((item) => (
                <article key={item.area} className="oa-team-expertise-card">
                  <h3>{item.area}</h3>
                  <p>{item.detail}</p>
                </article>
              ))}
            </div>
          </section>
        </AboutTabPanel>

        <AboutTabPanel id="strategy" active={activeTab}>
          <section className="site-about-block site-card">
            <div className="oa-team-section-head">
              <TrendingUp size={24} className="oa-team-icon" aria-hidden />
              <div>
                <h2>{INVESTOR_GROWTH_APPROACH.headline}</h2>
                <p className="oa-about-story">{INVESTOR_GROWTH_APPROACH.intro}</p>
              </div>
            </div>
            <ul className="oa-about-deliverables">
              {INVESTOR_GROWTH_APPROACH.points.map((point) => (
                <li key={point}>{point}</li>
              ))}
            </ul>
          </section>

          <section className="site-about-block site-card">
            <h2>Diversification at the core</h2>
            <p className="oa-about-story">
              We do not rely on one market, one factor, or one narrative. Our research model is built
              to spread risk and seek growth across a broad, diversified universe.
            </p>
            <div className="oa-team-expertise-grid">
              {DIVERSIFICATION_FOCUS.map((item) => (
                <article key={item.title} className="oa-team-expertise-card">
                  <h3>{item.title}</h3>
                  <p>{item.text}</p>
                </article>
              ))}
            </div>
          </section>

          <section className="site-about-block site-card">
            <h2>How we support investors</h2>
            <p>
              {PRODUCT_NAME} is a research platform operated by {COMPANY_DISPLAY}. We help investors
              manage and grow assets through algorithm-wise analysis, diversification, and ongoing
              performance review — aligned with what each investor expects from their capital.
            </p>
            <ul className="oa-about-deliverables">
              {TEAM_SERVICES.map((s) => (
                <li key={s}>{s}</li>
              ))}
            </ul>
          </section>
        </AboutTabPanel>

        <AboutTabPanel id="values" active={activeTab}>
          <section className="site-about-block site-card">
            <h2>Our values</h2>
            <div className="oa-values-grid">
              {COMPANY_VALUES.map((v) => (
                <article key={v.title} className="oa-value-item">
                  <h3>{v.title}</h3>
                  <p>{v.text}</p>
                </article>
              ))}
            </div>
          </section>
        </AboutTabPanel>

        <AboutTabPanel id="contact" active={activeTab}>
          <section className="site-about-block site-card oa-contact-topics">
            <h2>Contact us about</h2>
            <p className="oa-about-story">
              Whether you want to discuss growth goals, diversification, research methods, or risk
              limits — our team responds directly. Share your expectations and we will explain how
              our research model can support your asset growth plan.
            </p>
            <div className="oa-contact-topics-grid">
              {CONTACT_TOPICS.map((topic) => (
                <article key={topic.title} className="oa-contact-topic-card">
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

          <section className="site-about-block site-card oa-about-contact">
            <h2>Contact BSJ Infotech</h2>
            <p>
              Email our team to discuss investor growth goals, diversification, research partnerships,
              or any question about how Orion Alpha supports asset management.
            </p>
            <div className="oa-about-contact-row">
              <a href={`mailto:${SUPPORT_EMAIL}`} className="site-btn site-btn-primary">
                <Mail size={16} aria-hidden />
                {SUPPORT_EMAIL}
              </a>
              <Link href="/contact" className="site-btn site-btn-outline">Contact page</Link>
            </div>
          </section>
        </AboutTabPanel>

        <div className="site-about-actions">
          <Link href="/research" className="site-btn site-btn-primary">
            <Microscope size={16} aria-hidden />
            Research desk
          </Link>
          <Link href="/contact" className="site-btn site-btn-outline">
            <Mail size={16} aria-hidden />
            Contact us
          </Link>
          <Link href="/docs" className="site-btn site-btn-outline">Definitions</Link>
        </div>
      </div>
    </SiteShell>
  );
}
