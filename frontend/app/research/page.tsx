import SiteNav from "@/components/SiteNav";
import QuantResearchDashboard from "@/components/QuantResearchDashboard";
import { PRODUCT_NAME, PRODUCT_MOTTO } from "@/lib/orionAlpha";

export const metadata = {
  title: `Research — ${PRODUCT_NAME}`,
  description: `Quant research — factor engine, CAPM, risk metrics, Monte Carlo, pattern probability`,
};

export default function ResearchPage() {
  return (
    <div className="site-page">
      <SiteNav />
      <QuantResearchDashboard />
      <footer className="site-footer">{PRODUCT_NAME} · {PRODUCT_MOTTO} · Quant Research</footer>
    </div>
  );
}
