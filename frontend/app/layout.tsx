import type { Metadata, Viewport } from "next";
import { Poppins } from "next/font/google";
import "./globals.css";
import DevConsoleFilter from "@/components/DevConsoleFilter";
import { SiteThemeProvider } from "@/components/SiteThemeProvider";

const poppins = Poppins({
  subsets: ["latin"],
  weight: ["300", "400", "500", "600", "700", "800"],
  variable: "--font-poppins",
  display: "swap",
});

export const metadata: Metadata = {
  title: "Orion Alpha — Market Research Terminal",
  description: "Orion Alpha — professional market research terminal for equities, crypto, commodities, FX, and fundamentals",
  icons: { icon: "/favicon.svg" },
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  viewportFit: "cover",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={poppins.variable} data-site-theme="light" suppressHydrationWarning>
      <head>
        <script
          dangerouslySetInnerHTML={{
            __html: `(function(){try{var t=localStorage.getItem("orion-site-theme");document.documentElement.setAttribute("data-site-theme",t==="dark"?"dark":"light")}catch(e){document.documentElement.setAttribute("data-site-theme","light")}var p=/MaxListenersExceededWarning|EventEmitter memory leak|ObjectMultiplex|orphaned data|contentscript\\.js|inpage\\.js|app-init-liveness|background-liveness|Resetting the streams|runtime\\.lastError|Could not establish connection|Receiving end does not exist|\\[object Object\\]/;function s(a){return a.map(function(x){if(typeof x==="string")return x;try{return JSON.stringify(x)}catch(e){return String(x)}}).join(" ")}["warn","error","log"].forEach(function(m){var o=console[m];console[m]=function(){if(p.test(s([].slice.call(arguments))))return;o.apply(console,arguments)};});})();`,
          }}
        />
      </head>
      <body>
        <SiteThemeProvider>
          <DevConsoleFilter />
          {children}
        </SiteThemeProvider>
      </body>
    </html>
  );
}
