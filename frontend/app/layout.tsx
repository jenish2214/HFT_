import type { Metadata, Viewport } from "next";
import { Poppins } from "next/font/google";
import "./globals.css";
import "./site-premium.css";
import "./ui-system.css";
import "./quant-geometry.css";
import "./terminal-theme.css";
import "./fof.css";
import DevConsoleFilter from "@/components/DevConsoleFilter";
import SitePageTransition from "@/components/SitePageTransition";

const poppins = Poppins({
  subsets: ["latin"],
  weight: ["300", "400", "500", "600", "700", "800"],
  variable: "--font-poppins",
  display: "swap",
});

export const metadata: Metadata = {
  title: "Orion Alpha — Market Research Terminal",
  description: "Orion Alpha — Research every investor before investment. Find true value, not speculation.",
  icons: { icon: "/favicon.svg" },
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  viewportFit: "cover",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={poppins.variable} suppressHydrationWarning>
      <head>
        <script
          dangerouslySetInnerHTML={{
            __html: `(function(){var p=/MaxListenersExceededWarning|EventEmitter memory leak|ObjectMultiplex|orphaned data|contentscript\\.js|inpage\\.js|app-init-liveness|background-liveness|Resetting the streams|runtime\\.lastError|Could not establish connection|Receiving end does not exist|\\[object Object\\]/;function s(a){return a.map(function(x){if(typeof x==="string")return x;try{return JSON.stringify(x)}catch(e){return String(x)}}).join(" ")}["warn","error","log"].forEach(function(m){var o=console[m];console[m]=function(){if(p.test(s([].slice.call(arguments))))return;o.apply(console,arguments)};});})();`,
          }}
        />
      </head>
      <body className={poppins.className}>
        <DevConsoleFilter />
        <SitePageTransition>{children}</SitePageTransition>
      </body>
    </html>
  );
}
