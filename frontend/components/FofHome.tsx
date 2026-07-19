"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import {
  ArrowRight,
  BarChart3,
  BrainCircuit,
  ChartNoAxesCombined,
  Gauge,
  LineChart,
  Microscope,
  Radar,
  Shield,
  Terminal,
  TrendingUp,
} from "lucide-react";
import {
  COMPANY_DISPLAY,
  INVESTMENT_PHILOSOPHY,
  MARKET_ANALYSIS_STRATEGIES,
  PLATFORM_STATS,
} from "@/lib/companyBrand";
import { HOME_PATHS } from "@/lib/navConfig";
import SectionImage from "@/components/SectionImage";
import GsapReveal from "@/components/GsapReveal";
import {
  ORION_UNIVERSE,
  PRODUCT_MOTTO,
  PRODUCT_MOTTO_LONG,
  PRODUCT_NAME,
  PRODUCT_TAGLINE,
} from "@/lib/orionAlpha";

const PURPOSE = [
  { step: "01", title: "Discover", text: "Screen equities, crypto, commodities, FX, indices, and rates.", icon: TrendingUp },
  { step: "02", title: "Analyze", text: "Performance metrics, factor tables, CAPM, and momentum studies.", icon: BarChart3 },
  { step: "03", title: "Monitor", text: "Live terminal with depth, charts, and fundamentals.", icon: Terminal },
];

const UNIVERSE_TABS = [
  { id: "equities", label: "Equities", symbols: ORION_UNIVERSE.equities },
  { id: "crypto", label: "Crypto", symbols: ORION_UNIVERSE.crypto },
  { id: "commodities", label: "Commodities", symbols: ORION_UNIVERSE.commodities },
  { id: "indices", label: "Indices", symbols: ORION_UNIVERSE.indices },
  { id: "fx", label: "FX", symbols: ORION_UNIVERSE.fx },
  { id: "rates", label: "Rates", symbols: ORION_UNIVERSE.rates },
] as const;

const STRATEGY_ICONS = [
  Microscope,
  TrendingUp,
  ChartNoAxesCombined,
  BrainCircuit,
  Radar,
  Shield,
  Gauge,
  BarChart3,
] as const;

const STRATEGY_CARDS = MARKET_ANALYSIS_STRATEGIES.slice(0, 4);

function WorkflowPager() {
  const [page, setPage] = useState(0);
  const item = PURPOSE[page];
  const Icon = item.icon;

  useEffect(() => {
    const id = window.setInterval(() => {
      setPage((p) => (p + 1) % PURPOSE.length);
    }, 3800);
    return () => window.clearInterval(id);
  }, []);

  return (
    <div className="fof-pager">
      <div className="fof-pager-stage">
        <article key={item.step} className="fof-pager-slide">
          <span className="fof-pager-step mono">{item.step}</span>
          <div className="fof-pager-icon" aria-hidden>
            <Icon size={28} strokeWidth={1.75} />
          </div>
          <h3>{item.title}</h3>
          <p>{item.text}</p>
        </article>
      </div>
      <div className="fof-pager-nav" role="tablist" aria-label="Workflow steps">
        {PURPOSE.map((p, i) => (
          <button
            key={p.step}
            type="button"
            role="tab"
            aria-selected={i === page}
            className={`fof-pager-tab${i === page ? " is-active" : ""}`}
            onClick={() => setPage(i)}
          >
            <span className="mono">{p.step}</span>
            {p.title}
          </button>
        ))}
      </div>
    </div>
  );
}

/** Home — FoF shell; animated post-hero sections. */
export default function FofHome() {
  return (
    <div className="fof-home">
      <section className="fof-hero">
        <div className="fof-hero-bg" aria-hidden />
        <div className="fof-hero-inner">
          <div className="fof-hero-copy">
            <p className="fof-kicker fof-hero-anim">{PRODUCT_MOTTO}</p>
            <h1 className="fof-hero-title fof-hero-anim">
              Find true value.
              <br />
              Invest with evidence.
            </h1>
            <p className="fof-hero-sub fof-hero-anim">
              {PRODUCT_NAME} · {PRODUCT_TAGLINE}
            </p>
            <p className="fof-hero-lead fof-hero-anim">{PRODUCT_MOTTO_LONG}</p>
            <div className="fof-actions fof-hero-anim">
              {HOME_PATHS.map(({ href, title, icon: Icon }, i) => (
                <Link
                  key={href}
                  href={href}
                  className={`fof-btn ${i === 0 ? "fof-btn-primary" : "fof-btn-ghost"}`}
                >
                  <Icon size={18} aria-hidden />
                  <span>{title}</span>
                  {i === 0 && (
                    <span className="fof-btn-icon" aria-hidden>
                      <ArrowRight size={14} strokeWidth={2.5} />
                    </span>
                  )}
                </Link>
              ))}
            </div>
          </div>
        </div>
      </section>

      <section className="fof-section-alt fof-section-stage">
        <div className="fof-section-alt-inner">
          <GsapReveal variant="rise">
            <p className="fof-label">Platform at a glance</p>
            <h2 className="fof-h2">Four pillars of the desk</h2>
          </GsapReveal>
          <div className="fof-grid-4">
            {PLATFORM_STATS.map((s, i) => (
              <GsapReveal key={s.label} variant="scale" delay={i * 90}>
                <div className="fof-stat fof-box-hover fof-stat-glow">
                  <strong>{s.value}</strong>
                  <span className="fof-stat-label">{s.label}</span>
                  <span className="fof-stat-detail">{s.detail}</span>
                </div>
              </GsapReveal>
            ))}
          </div>
        </div>
      </section>

      <section className="fof-section fof-section-stage" id="research-framework">
        <GsapReveal variant="rise">
          <p className="fof-label">Research framework</p>
          <h2 className="fof-h2">More ways to understand the market</h2>
          <p className="fof-lead">
            No single signal tells the whole story. {PRODUCT_NAME} brings multiple analysis
            strategies together so opportunity and risk can be judged in context.
          </p>
        </GsapReveal>
        <GsapReveal variant="scale" delay={60}>
          <SectionImage
            src="/sections/home-hero.jpg"
            alt="Market charts and research atmosphere"
            size="hero"
            priority
            className="fof-home-media"
          />
        </GsapReveal>
        <div className="fof-grid-4">
          {STRATEGY_CARDS.map((strategy, index) => {
            const Icon = STRATEGY_ICONS[index];
            return (
              <GsapReveal key={strategy.code} variant="right" delay={index * 100}>
                <article className="fof-card fof-box-hover fof-card-lift">
                  <span className="fof-card-num mono">{strategy.code}</span>
                  <div className="fof-card-head">
                    <Icon size={20} aria-hidden />
                    <h3>{strategy.title}</h3>
                  </div>
                  <p>{strategy.desc}</p>
                </article>
              </GsapReveal>
            );
          })}
        </div>
      </section>

      <section className="fof-section-alt fof-section-stage" id="universe">
        <div className="fof-section-alt-inner">
          <GsapReveal variant="rise">
            <p className="fof-label">Market universe</p>
            <h2 className="fof-h2">Select an asset class to browse symbols</h2>
            <p className="fof-lead">Open Research, enter a symbol, and press GO.</p>
          </GsapReveal>
          <GsapReveal variant="scale" delay={120}>
            <HomeUniverseExplorer />
          </GsapReveal>
        </div>
      </section>

      <section className="fof-section fof-section-stage" id="purpose">
        <GsapReveal variant="rise">
          <p className="fof-label">Workflow</p>
          <h2 className="fof-h2">Discover · Analyze · Monitor</h2>
          <p className="fof-lead">A clear path from idea to live desk monitoring.</p>
        </GsapReveal>
        <GsapReveal variant="right" delay={80}>
          <WorkflowPager />
        </GsapReveal>
      </section>

      <section className="fof-section-alt fof-section-stage" id="philosophy">
        <div className="fof-section-alt-inner">
          <GsapReveal variant="rise">
            <p className="fof-label">Investment philosophy</p>
            <h2 className="fof-h2">Research before investment</h2>
          </GsapReveal>
          <div className="fof-philo-grid">
            {INVESTMENT_PHILOSOPHY.map((p, i) => (
              <GsapReveal key={p.title} variant="scale" delay={i * 110}>
                <article className="fof-philo-card fof-box-hover">
                  <span className="fof-philo-index mono">{String(i + 1).padStart(2, "0")}</span>
                  <Shield size={22} aria-hidden />
                  <h3>{p.title}</h3>
                  <p>{p.text}</p>
                </article>
              </GsapReveal>
            ))}
          </div>
        </div>
      </section>

      <section className="fof-section fof-section-stage" id="paths">
        <GsapReveal variant="rise">
          <p className="fof-label">Platform</p>
          <h2 className="fof-h2">Research · Terminal · Charts</h2>
        </GsapReveal>
        <div className="fof-path-grid">
          {HOME_PATHS.map((p, i) => (
            <GsapReveal key={p.code} variant="right" delay={i * 100}>
              <Link href={p.href} className="fof-path-card fof-box-hover">
                <span className="fof-path-code mono">{p.code}</span>
                <span className="fof-path-icon" aria-hidden>
                  <p.icon size={22} strokeWidth={1.75} />
                </span>
                <strong>{p.title}</strong>
                <span className="fof-path-desc">{p.desc}</span>
                <span className="fof-path-go">
                  Open <ArrowRight size={16} aria-hidden />
                </span>
              </Link>
            </GsapReveal>
          ))}
        </div>
      </section>

      <GsapReveal variant="scale">
        <section className="fof-cta-band fof-cta-pulse">
          <h2>Start research with {PRODUCT_NAME}</h2>
          <p>
            Operated by {COMPANY_DISPLAY}. Open the research desk or learn how we approach
            diversified asset growth.
          </p>
          <div className="fof-actions">
            <Link href="/research" className="fof-btn fof-btn-primary">
              <Microscope size={18} aria-hidden />
              <span>Start research</span>
              <span className="fof-btn-icon" aria-hidden>
                <ArrowRight size={14} strokeWidth={2.5} />
              </span>
            </Link>
            <Link href="/about" className="fof-btn fof-btn-ghost">
              <span>About {COMPANY_DISPLAY}</span>
            </Link>
          </div>
        </section>
      </GsapReveal>
    </div>
  );
}

function HomeUniverseExplorer() {
  const [active, setActive] = useState<(typeof UNIVERSE_TABS)[number]["id"]>("equities");
  const tab = UNIVERSE_TABS.find((t) => t.id === active)!;

  return (
    <div className="fof-card fof-universe fof-box-hover fof-universe-stage">
      <div className="fof-universe-tabs" role="tablist" aria-label="Asset classes">
        {UNIVERSE_TABS.map((t) => (
          <button
            key={t.id}
            type="button"
            role="tab"
            aria-selected={active === t.id}
            className={`fof-universe-tab${active === t.id ? " is-active" : ""}`}
            onClick={() => setActive(t.id)}
          >
            {t.label}
          </button>
        ))}
      </div>
      <div className="fof-universe-symbols" role="tabpanel" key={active}>
        {tab.symbols.map((sym, i) => (
          <Link
            key={sym}
            href="/research"
            className="fof-universe-chip mono"
            style={{ animationDelay: `${i * 40}ms` }}
          >
            {sym}
          </Link>
        ))}
      </div>
      <p className="fof-universe-hint">
        <LineChart size={14} aria-hidden />
        Open Research, enter a symbol, and press GO.
      </p>
    </div>
  );
}
