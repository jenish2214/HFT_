import type { Metadata, Viewport } from "next";
import "./globals.css";
import DevConsoleFilter from "@/components/DevConsoleFilter";

export const metadata: Metadata = {
  title: "Trading Desk",
  description: "Professional stock trading dashboard",
  icons: { icon: "/favicon.svg" },
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body className="terminal-body">
        <DevConsoleFilter />
        {children}
      </body>
    </html>
  );
}
