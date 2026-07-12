"use client";

import { createContext, useCallback, useContext, useEffect, useState } from "react";

export type SiteTheme = "light" | "dark";

const STORAGE_KEY = "orion-site-theme";

const SiteThemeContext = createContext<{
  theme: SiteTheme;
  toggle: () => void;
} | null>(null);

function applyTheme(theme: SiteTheme) {
  document.documentElement.setAttribute("data-site-theme", theme);
  try {
    localStorage.setItem(STORAGE_KEY, theme);
  } catch {
    /* ignore */
  }
}

export function SiteThemeProvider({ children }: { children: React.ReactNode }) {
  const [theme, setTheme] = useState<SiteTheme>("light");

  useEffect(() => {
    const stored = localStorage.getItem(STORAGE_KEY) as SiteTheme | null;
    const initial = stored === "dark" ? "dark" : "light";
    setTheme(initial);
    applyTheme(initial);
  }, []);

  const toggle = useCallback(() => {
    setTheme((prev) => {
      const next = prev === "light" ? "dark" : "light";
      applyTheme(next);
      return next;
    });
  }, []);

  return (
    <SiteThemeContext.Provider value={{ theme, toggle }}>
      {children}
    </SiteThemeContext.Provider>
  );
}

export function useSiteTheme() {
  const ctx = useContext(SiteThemeContext);
  if (!ctx) throw new Error("useSiteTheme must be used within SiteThemeProvider");
  return ctx;
}
