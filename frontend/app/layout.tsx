import type { Metadata, Viewport } from "next";
import "./globals.css";
import DevConsoleFilter from "@/components/DevConsoleFilter";

export const metadata: Metadata = {
  title: "Orion Alpha",
  description: "Orion Alpha — global markets research terminal with live charts, fundamentals, and multi-asset coverage",
  icons: { icon: "/favicon.svg" },
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  viewportFit: "cover",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <head>
        <script
          dangerouslySetInnerHTML={{
            __html: `(function(){var p=/MaxListenersExceededWarning|EventEmitter memory leak|ObjectMultiplex|orphaned data|contentscript\\.js|inpage\\.js|app-init-liveness|background-liveness/;["warn","error","log"].forEach(function(m){var o=console[m];console[m]=function(){if(p.test([].join.call(arguments," ")))return;o.apply(console,arguments)};});})();`,
          }}
        />
      </head>
      <body className="terminal-body">
        <DevConsoleFilter />
        {children}
      </body>
    </html>
  );
}
