import dynamic from "next/dynamic";
import LoadingSpinner from "@/components/LoadingSpinner";

const TerminalDashboard = dynamic(() => import("@/components/TerminalDashboard"), {
  ssr: false,
  loading: () => (
    <div style={{ minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center", background: "#000" }}>
      <LoadingSpinner label="Loading Orion Alpha Terminal…" />
    </div>
  ),
});

export const metadata = {
  title: "Terminal — Orion Alpha",
  description: "Orion Alpha live market research terminal",
};

export default function TerminalPage() {
  return <TerminalDashboard />;
}
