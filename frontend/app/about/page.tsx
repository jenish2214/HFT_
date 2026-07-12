import Link from "next/link";
import SiteNav from "@/components/SiteNav";
import { ORION_FEATURES, PRODUCT_NAME, PRODUCT_MOTTO, PRODUCT_TAGLINE } from "@/lib/orionAlpha";

export const metadata = {
  title: `About — ${PRODUCT_NAME}`,
  description: `About ${PRODUCT_NAME} research terminal`,
};

export default function AboutPage() {
  return (
    <div className="site-page">
      <SiteNav />
      <main className="site-about">
        <h1 className="site-about-title">About {PRODUCT_NAME}</h1>
        <p className="site-about-lead">{PRODUCT_MOTTO} · {PRODUCT_TAGLINE}</p>

        <section className="site-about-block">
          <h2>What is Orion Alpha?</h2>
          <p>
            Orion Alpha is a market research platform for studying live prices,
            company fundamentals, and charts across equities, crypto, commodities,
            FX, and rates — all in one place.
          </p>
        </section>

        <section className="site-about-block">
          <h2>What you can do</h2>
          <ul className="site-about-list">
            <li>View live quotes and watchlists</li>
            <li>Read company fundamentals and reports</li>
            <li>Open full-screen charts with indicators</li>
            <li>Use the research terminal for deeper analysis</li>
          </ul>
        </section>

        <section className="site-about-block">
          <h2>Terminal shortcuts</h2>
          <ul className="site-about-features">
            {ORION_FEATURES.slice(0, 8).map((f) => (
              <li key={f.id}>
                <span className="site-accent-text">{f.key}</span> — {f.title}
              </li>
            ))}
          </ul>
        </section>

        <div className="site-about-actions">
          <Link href="/terminal" className="site-btn site-btn-primary">Open Terminal</Link>
          <Link href="/chart" className="site-btn site-btn-outline">View Charts</Link>
          <Link href="/" className="site-btn site-btn-outline">Home</Link>
        </div>
      </main>

      <footer className="site-footer">{PRODUCT_NAME}</footer>
    </div>
  );
}
