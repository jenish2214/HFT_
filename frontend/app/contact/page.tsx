import SiteNav from "@/components/SiteNav";
import ContactSection from "@/components/ContactSection";
import { PRODUCT_NAME } from "@/lib/orionAlpha";

export const metadata = {
  title: `Contact — ${PRODUCT_NAME}`,
  description: `Contact ${PRODUCT_NAME} Professional Services`,
};

export default function ContactPage() {
  return (
    <div className="site-page">
      <SiteNav />
      <main className="site-about">
        <h1 className="site-about-title">Contact Us</h1>
        <p className="site-about-lead">Get in touch with the Orion Alpha team</p>
      </main>
      <ContactSection id="contact" />
      <footer className="site-footer">{PRODUCT_NAME}</footer>
    </div>
  );
}
