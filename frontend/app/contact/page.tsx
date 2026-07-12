import ContactPageContent from "@/components/ContactPageContent";
import { PRODUCT_NAME } from "@/lib/orionAlpha";

export const metadata = {
  title: `Contact — ${PRODUCT_NAME}`,
  description: `Contact ${PRODUCT_NAME} Professional Services`,
};

export default function ContactPage() {
  return <ContactPageContent />;
}
