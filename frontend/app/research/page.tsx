import ResearchPageContent from "@/components/ResearchPageContent";
import { PRODUCT_NAME } from "@/lib/orionAlpha";

export const metadata = {
  title: `Research — ${PRODUCT_NAME}`,
  description: `Educational quant lab — momentum study levels, factor models, CAPM, Monte Carlo demos (not investment advice)`,
};

export default function ResearchPage() {
  return <ResearchPageContent />;
}
