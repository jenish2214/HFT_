import DocsPageContent from "@/components/DocsPageContent";
import { PRODUCT_NAME } from "@/lib/orionAlpha";

export const metadata = {
  title: `Docs — ${PRODUCT_NAME}`,
  description: "Market glossary — Monte Carlo, CAPM, momentum, risk metrics, pattern scores, and platform definitions for learning.",
};

export default function DocsPage() {
  return <DocsPageContent />;
}
