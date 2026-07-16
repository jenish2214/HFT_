"use client";

import dynamic from "next/dynamic";
import SiteShell from "@/components/SiteShell";
import HomeFinanceHub from "@/components/HomeFinanceHub";
import { ResearchShowcaseSkeleton } from "@/components/skeletons/ContentSkeletons";

const ResearchShowcase = dynamic(() => import("@/components/ResearchShowcase"), {
  loading: () => <ResearchShowcaseSkeleton />,
  ssr: true,
});

export default function HomePage() {
  return (
    <SiteShell>
      <HomeFinanceHub />
      <ResearchShowcase />
    </SiteShell>
  );
}
