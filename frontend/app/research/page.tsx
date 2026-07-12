import ResearchPageContent from "@/components/ResearchPageContent";
import { PRODUCT_NAME } from "@/lib/orionAlpha";

export const metadata = {
  title: `Research — ${PRODUCT_NAME}`,
  description: `Quant research — factor engine, CAPM, risk metrics, Monte Carlo, pattern probability`,
};

export default function ResearchPage() {
  return <ResearchPageContent />;
}
