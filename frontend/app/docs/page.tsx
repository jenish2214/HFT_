import DocsPageContent from "@/components/DocsPageContent";
import { PRODUCT_NAME } from "@/lib/orionAlpha";

export const metadata = {
  title: `Docs — ${PRODUCT_NAME}`,
  description: `Market definitions and glossary for ${PRODUCT_NAME}.`,
};

export default function DocsPage() {
  return <DocsPageContent />;
}
