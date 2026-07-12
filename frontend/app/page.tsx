"use client";

import dynamic from "next/dynamic";
import SiteNav from "@/components/SiteNav";
import HomeFinanceHub from "@/components/HomeFinanceHub";
import { ResearchShowcaseSkeleton } from "@/components/skeletons/ContentSkeletons";
import SiteFooter from "@/components/SiteFooter";

const ResearchShowcase = dynamic(() => import("@/components/ResearchShowcase"), {
  loading: () => <ResearchShowcaseSkeleton />,
  ssr: true,
});

export default function HomePage() {
  return (
    <div className="site-page">
      <SiteNav />
      <main>
        <HomeFinanceHub />
        <ResearchShowcase />
      </main>
      <SiteFooter />
    </div>
  );
}
