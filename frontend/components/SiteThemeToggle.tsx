"use client";

import { useSiteTheme } from "@/components/SiteThemeProvider";

export default function SiteThemeToggle() {
  const { theme, toggle } = useSiteTheme();

  return (
    <button
      type="button"
      className="site-theme-toggle"
      onClick={toggle}
      aria-label={theme === "light" ? "Switch to dark mode" : "Switch to light mode"}
      title={theme === "light" ? "Dark mode" : "Light mode"}
    >
      {theme === "light" ? "Dark" : "Light"}
    </button>
  );
}
