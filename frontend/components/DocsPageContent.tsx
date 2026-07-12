"use client";

import Link from "next/link";
import SiteNav from "@/components/SiteNav";
import SiteFooter from "@/components/SiteFooter";
import FadeIn from "@/components/motion/FadeIn";
import RevealOnScroll from "@/components/motion/RevealOnScroll";
import { MARKET_DOC_SECTIONS } from "@/lib/marketDocs";
import { PRODUCT_NAME, SUPPORT_EMAIL } from "@/lib/orionAlpha";

export default function DocsPageContent() {
  return (
    <div className="site-page">
      <SiteNav />
      <main className="site-docs">
        <FadeIn>
          <header className="site-docs-hero">
            <h1 className="site-docs-title">Definitions</h1>
            <p className="site-docs-lead">
              Market terms used on {PRODUCT_NAME}.
            </p>
          </header>
        </FadeIn>

        <div className="site-docs-layout site-section-wide">
          <nav className="site-docs-toc" aria-label="Documentation sections">
            <p className="site-docs-toc-title mono">Contents</p>
            <ul>
              {MARKET_DOC_SECTIONS.map((section) => (
                <li key={section.id}>
                  <a href={`#${section.id}`} className="site-docs-toc-link">
                    {section.title}
                  </a>
                </li>
              ))}
            </ul>
            <Link href="/research" className="site-btn site-btn-outline site-docs-toc-cta">
              Research
            </Link>
          </nav>

          <div className="site-docs-body">
            {MARKET_DOC_SECTIONS.map((section, si) => (
              <RevealOnScroll key={section.id} delay={si * 0.03}>
                <section id={section.id} className="site-docs-section">
                  <h2 className="site-docs-section-title">{section.title}</h2>
                  {section.intro && <p className="site-docs-section-intro">{section.intro}</p>}
                  <dl className="site-docs-list">
                    {section.terms.map((term) => (
                      <div key={term.id} id={term.id} className="site-docs-term">
                        <dt className="site-docs-term-name">{term.term}</dt>
                        <dd className="site-docs-term-body">{term.body}</dd>
                      </div>
                    ))}
                  </dl>
                </section>
              </RevealOnScroll>
            ))}

            <section className="site-docs-section site-docs-help">
              <h2 className="site-docs-section-title">Support</h2>
              <p>
                <a href={`mailto:${SUPPORT_EMAIL}`} className="site-docs-mail">{SUPPORT_EMAIL}</a>
              </p>
            </section>
          </div>
        </div>
      </main>
      <SiteFooter />
    </div>
  );
}
