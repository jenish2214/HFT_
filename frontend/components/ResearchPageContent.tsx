"use client";

import SiteNav from "@/components/SiteNav";
import QuantResearchDashboard from "@/components/QuantResearchDashboard";
import SiteFooter from "@/components/SiteFooter";
import FadeIn from "@/components/motion/FadeIn";

export default function ResearchPageContent() {
  return (
    <div className="site-page">
      <SiteNav />
      <FadeIn>
        <QuantResearchDashboard />
      </FadeIn>
      <SiteFooter />
    </div>
  );
}
