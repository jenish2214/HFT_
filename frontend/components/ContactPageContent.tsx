"use client";

import SiteNav from "@/components/SiteNav";
import ContactSection from "@/components/ContactSection";
import SiteFooter from "@/components/SiteFooter";
import FadeIn from "@/components/motion/FadeIn";

export default function ContactPageContent() {
  return (
    <div className="site-page">
      <SiteNav />
      <main className="site-about">
        <FadeIn>
          <h1 className="site-about-title">Contact Us</h1>
          <p className="site-about-lead">Contact</p>
        </FadeIn>
      </main>
      <ContactSection id="contact" />
      <SiteFooter />
    </div>
  );
}
