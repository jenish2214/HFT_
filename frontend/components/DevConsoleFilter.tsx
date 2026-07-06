"use client";

import { useEffect } from "react";

/**
 * Wallet extensions (MetaMask, etc.) inject contentscript.js and spam the console.
 * Filters only known extension noise in dev — not app errors.
 */
export default function DevConsoleFilter() {
  useEffect(() => {
    if (process.env.NODE_ENV !== "development") return;

    const extPattern =
      /MaxListenersExceededWarning|ObjectMultiplex|malformed chunk|contentscript\.js|inpage\.js|ChromeTransport|app-init-liveness|background-liveness|chromePort disconnected|Resetting the streams/;

    const origWarn = console.warn;
    const origError = console.error;
    const origLog = console.log;

    const shouldFilter = (args: unknown[]) => extPattern.test(args.map(String).join(" "));

    console.warn = (...args: unknown[]) => {
      if (shouldFilter(args)) return;
      origWarn.apply(console, args);
    };

    console.error = (...args: unknown[]) => {
      if (shouldFilter(args)) return;
      origError.apply(console, args);
    };

    console.log = (...args: unknown[]) => {
      if (shouldFilter(args)) return;
      origLog.apply(console, args);
    };

    return () => {
      console.warn = origWarn;
      console.error = origError;
      console.log = origLog;
    };
  }, []);

  return null;
}
