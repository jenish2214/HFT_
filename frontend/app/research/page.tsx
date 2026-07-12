import ResearchPageContent from "@/components/ResearchPageContent";
import { PRODUCT_NAME } from "@/lib/orionAlpha";

export const metadata = {
  title: `Research — ${PRODUCT_NAME}`,
  description: `Research — factors, risk, charts, and company data`,
};

export default function ResearchPage() {
  return <ResearchPageContent />;
}
