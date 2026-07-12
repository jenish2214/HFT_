import AboutPageContent from "@/components/AboutPageContent";
import { PRODUCT_NAME } from "@/lib/orionAlpha";

export const metadata = {
  title: `About — ${PRODUCT_NAME}`,
  description: `About ${PRODUCT_NAME} research terminal`,
};

export default function AboutPage() {
  return <AboutPageContent />;
}
