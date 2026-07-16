"use client";

import SiteShell from "@/components/SiteShell";
import SitePageHeader from "@/components/SitePageHeader";
import ContactSection from "@/components/ContactSection";
import { Mail } from "lucide-react";

export default function ContactPageContent() {
  return (
    <SiteShell>
      <SitePageHeader
        badge="Get in touch"
        title="Contact Us"
        lead="Questions about investor growth, diversification, research, or portfolio goals."
        icon={Mail}
      />
      <ContactSection id="contact" />
    </SiteShell>
  );
}
