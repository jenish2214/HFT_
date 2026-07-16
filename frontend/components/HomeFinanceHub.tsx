"use client";

import Link from "next/link";
import { useState } from "react";
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
import Hero3DScene from "@/components/Hero3DScene";
import {
  ASSET_SERVICES,
  INVESTMENT_PHILOSOPHY,
  MARKET_ANALYSIS_STRATEGIES,
  PLATFORM_STATS,
} from "@/lib/companyBrand";
import { HOME_PATHS } from "@/lib/navConfig";
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

export default function HomeFinanceHub() {
  return (
    <div className="oa-home-page">
      <section className="site-hero">
        <div className="site-section-wide site-hero-grid">
          <div className="site-hero-copy">
            <p className="site-hero-badge">{PRODUCT_MOTTO}</p>
            <h1 className="site-hero-title">
              Find true value.
              <span> Invest with evidence.</span>
            </h1>
            <p className="site-hero-tagline">{PRODUCT_NAME} · {PRODUCT_TAGLINE}</p>
            <p className="site-hero-lead">{PRODUCT_MOTTO_LONG}</p>

            <div className="site-hero-actions">
              {HOME_PATHS.map(({ href, title, icon: Icon }, i) => (
                <Link
                  key={href}
                  href={href}
                  className={`site-btn ${i === 0 ? "site-btn-primary" : "site-btn-outline"}`}
                >
                  <Icon size={17} aria-hidden />
                  {title}
                </Link>
              ))}
            </div>
          </div>

          <div className="site-hero-visual">
            <Hero3DScene />
          </div>

          <div className="site-stats-row">
            {PLATFORM_STATS.map((s) => (
              <div key={s.label} className="site-stat">
                <strong className="site-stat-value">{s.value}</strong>
                <span className="site-stat-label">{s.label}</span>
                <span className="site-stat-detail">{s.detail}</span>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="site-section site-section-wide">
        <p className="site-section-kicker">Research framework</p>
        <h2 className="site-section-title">More ways to understand the market</h2>
        <p className="site-section-lead">
          No single signal tells the whole story. Orion Alpha brings multiple analysis
          strategies together so opportunity and risk can be judged in context.
        </p>
        <div className="oa-strategy-grid">
          {MARKET_ANALYSIS_STRATEGIES.map((strategy, index) => {
            const Icon = STRATEGY_ICONS[index];
            return (
              <article key={strategy.code} className="site-card oa-strategy-card">
                <div className="oa-strategy-card-head">
                  <span className="oa-strategy-icon"><Icon size={21} aria-hidden /></span>
                  <span className="oa-strategy-code mono">{strategy.code}</span>
                </div>
                <h3>{strategy.title}</h3>
                <p>{strategy.desc}</p>
              </article>
            );
          })}
        </div>
      </section>

      <section className="site-section site-section-wide">
        <h2 className="site-section-title">Asset management capabilities</h2>
        <p className="site-section-lead">Institutional workflows — research to live desk.</p>
        <div className="oa-services-grid">
          {ASSET_SERVICES.map((s) => (
            <article key={s.title} className="site-card oa-service-card">
              <span className="oa-service-tag mono">{s.tag}</span>
              <h3>{s.title}</h3>
              <p>{s.desc}</p>
            </article>
          ))}
        </div>
      </section>

      <section className="site-section site-section-wide site-section-alt">
        <h2 className="site-section-title">Market universe</h2>
        <p className="site-section-lead">Select an asset class to browse symbols.</p>
        <HomeUniverseExplorer />
      </section>

      <section className="site-section site-section-wide">
        <div className="oa-purpose-grid">
          {PURPOSE.map((item) => (
            <article key={item.step} className="site-card oa-purpose-card">
              <div className="oa-purpose-icon-wrap">
                <item.icon size={22} strokeWidth={1.75} aria-hidden />
              </div>
              <span className="home-hero-purpose-step mono">{item.step}</span>
              <h2 className="home-hero-purpose-title">{item.title}</h2>
              <p className="home-hero-purpose-text">{item.text}</p>
            </article>
          ))}
        </div>
      </section>

      <section className="site-section site-section-wide site-section-alt">
        <h2 className="site-section-title">Investment philosophy</h2>
        <div className="oa-philosophy-grid">
          {INVESTMENT_PHILOSOPHY.map((p) => (
            <article key={p.title} className="site-card oa-philosophy-card">
              <Shield size={22} className="oa-philosophy-icon" aria-hidden />
              <h3>{p.title}</h3>
              <p>{p.text}</p>
            </article>
          ))}
        </div>
      </section>

      <section className="site-section site-section-wide">
        <div className="oa-path-grid">
          {HOME_PATHS.map((p) => (
            <Link key={p.code} href={p.href} className="site-card oa-path-card">
              <div className="home-hero-path-icon">
                <p.icon size={20} strokeWidth={1.75} aria-hidden />
              </div>
              <span className="home-hero-path-code mono">{p.code}</span>
              <strong>{p.title}</strong>
              <span className="home-hero-path-desc">{p.desc}</span>
              <ArrowRight size={16} className="home-hero-path-arrow" aria-hidden />
            </Link>
          ))}
        </div>
        <div className="site-section-actions">
          <Link href="/research" className="site-btn site-btn-primary">
            <Microscope size={16} aria-hidden />
            Start research
          </Link>
          <Link href="/about" className="site-btn site-btn-outline">About BSJ Infotech</Link>
        </div>
      </section>
    </div>
  );
}

function HomeUniverseExplorer() {
  const [active, setActive] = useState<(typeof UNIVERSE_TABS)[number]["id"]>("equities");
  const tab = UNIVERSE_TABS.find((t) => t.id === active)!;

  return (
    <div className="site-card oa-universe">
      <div className="oa-universe-tabs" role="tablist" aria-label="Asset classes">
        {UNIVERSE_TABS.map((t) => (
          <button
            key={t.id}
            type="button"
            role="tab"
            aria-selected={active === t.id}
            className={`oa-universe-tab${active === t.id ? " is-active" : ""}`}
            onClick={() => setActive(t.id)}
          >
            {t.label}
          </button>
        ))}
      </div>
      <div className="oa-universe-symbols" role="tabpanel">
        {tab.symbols.map((sym) => (
          <Link key={sym} href="/research" className="oa-universe-chip mono">{sym}</Link>
        ))}
      </div>
      <p className="oa-universe-hint">
        <LineChart size={14} aria-hidden />
        Open Research, enter a symbol, and press GO.
      </p>
    </div>
  );
}
