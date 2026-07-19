import { permanentRedirect } from "next/navigation";

/** Docs page permanently hidden — redirect to home. */
export default function DocsPage() {
  permanentRedirect("/");
}
