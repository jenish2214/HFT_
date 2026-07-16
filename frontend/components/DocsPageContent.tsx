"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { BookOpen, Mail, Microscope, Search } from "lucide-react";
import SiteShell from "@/components/SiteShell";
import SitePageHeader from "@/components/SitePageHeader";
import { DOCS_HIGHLIGHTS } from "@/lib/companyBrand";
import { MARKET_DOC_SECTIONS } from "@/lib/marketDocs";
import { SUPPORT_EMAIL } from "@/lib/orionAlpha";

export default function DocsPageContent() {
  const [query, setQuery] = useState("");
  const [activeSection, setActiveSection] = useState<string | "all">("all");

  const normalized = query.trim().toLowerCase();

  const filteredSections = useMemo(() => {
    return MARKET_DOC_SECTIONS.map((section) => {
      const terms = section.terms.filter((term) => {
        if (activeSection !== "all" && section.id !== activeSection) return false;
        if (!normalized) return true;
        return (
          term.term.toLowerCase().includes(normalized) ||
          term.body.toLowerCase().includes(normalized) ||
          term.realWorld.toLowerCase().includes(normalized) ||
          (term.short?.toLowerCase().includes(normalized) ?? false)
        );
      });
      return { ...section, terms };
    }).filter((s) => s.terms.length > 0);
  }, [normalized, activeSection]);

  const totalMatches = filteredSections.reduce((n, s) => n + s.terms.length, 0);

  return (
    <SiteShell>
      <SitePageHeader
        badge="Institutional glossary"
        title="Market definitions"
        lead="What each metric means — and how funds, banks, and traders use it in the real world."
        icon={BookOpen}
      />

      <div className="site-docs site-section-wide">
        <div className="oa-docs-highlights">
          {DOCS_HIGHLIGHTS.map((h) => (
            <a key={h.sectionId} href={`#${h.sectionId}`} className="oa-docs-highlight-card site-card">
              <h3>{h.title}</h3>
              <p>{h.desc}</p>
            </a>
          ))}
        </div>

        <div className="oa-docs-toolbar site-card">
          <div className="oa-docs-search-wrap">
            <Search size={18} className="oa-docs-search-icon" aria-hidden />
            <input
              type="search"
              className="oa-docs-search"
              placeholder="Search terms — Sharpe, beta, momentum…"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              aria-label="Search glossary"
            />
          </div>
          <div className="oa-docs-filters" role="tablist" aria-label="Filter by section">
            <button
              type="button"
              className={`oa-docs-filter${activeSection === "all" ? " is-active" : ""}`}
              onClick={() => setActiveSection("all")}
            >
              All
            </button>
            {MARKET_DOC_SECTIONS.map((s) => (
              <button
                key={s.id}
                type="button"
                className={`oa-docs-filter${activeSection === s.id ? " is-active" : ""}`}
                onClick={() => setActiveSection(s.id)}
              >
                {s.title}
              </button>
            ))}
          </div>
          <p className="oa-docs-result-count">
            {totalMatches} {totalMatches === 1 ? "definition" : "definitions"}
            {normalized ? ` matching “${query.trim()}”` : ""}
          </p>
        </div>

        <div className="site-docs-layout">
          <nav className="site-docs-toc site-card" aria-label="Documentation sections">
            <p className="site-docs-toc-title">Jump to</p>
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
              <Microscope size={16} aria-hidden />
              Open research desk
            </Link>
          </nav>

          <div className="site-docs-body">
            {filteredSections.length === 0 && (
              <div className="oa-docs-empty site-card">
                <p>No definitions match your search.</p>
                <button type="button" className="site-btn site-btn-outline" onClick={() => { setQuery(""); setActiveSection("all"); }}>
                  Clear filters
                </button>
              </div>
            )}

            {filteredSections.map((section) => (
              <section key={section.id} id={section.id} className="site-docs-section site-card">
                <h2 className="site-docs-section-title">{section.title}</h2>
                {section.intro && <p className="site-docs-section-intro">{section.intro}</p>}
                <dl className="site-docs-list">
                  {section.terms.map((term) => (
                    <div key={term.id} id={term.id} className="site-docs-term oa-docs-term-interactive">
                      <dt className="site-docs-term-name">{term.term}</dt>
                      {term.short && <span className="oa-docs-term-short mono">{term.short}</span>}
                      <dd className="site-docs-term-body">{term.body}</dd>
                      <div className="oa-docs-real-world">
                        <span className="oa-docs-real-world-label">Real-world use</span>
                        <p>{term.realWorld}</p>
                      </div>
                    </div>
                  ))}
                </dl>
              </section>
            ))}

            <section className="site-docs-section site-docs-help site-card">
              <h2 className="site-docs-section-title">Research support</h2>
              <p className="site-docs-section-intro">
                Questions about metrics or desk setup? Contact the BSJ Infotech team directly.
              </p>
              <a href={`mailto:${SUPPORT_EMAIL}`} className="site-docs-mail">
                <Mail size={16} aria-hidden />
                {SUPPORT_EMAIL}
              </a>
            </section>
          </div>
        </div>
      </div>
    </SiteShell>
  );
}
