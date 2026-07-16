import type { LucideIcon } from "lucide-react";
import {
  BarChart3,
  BookOpen,
  Home,
  Info,
  LineChart,
  Mail,
  Microscope,
  Terminal,
} from "lucide-react";

export interface NavItem {
  href: string;
  label: string;
  icon: LucideIcon;
  short?: string;
}

export const MAIN_NAV: NavItem[] = [
  { href: "/", label: "Home", icon: Home, short: "Home" },
  { href: "/research", label: "Research", icon: Microscope, short: "Research" },
  { href: "/terminal", label: "Terminal", icon: Terminal, short: "Desk" },
  { href: "/chart", label: "Charts", icon: LineChart, short: "Charts" },
  { href: "/docs", label: "Docs", icon: BookOpen, short: "Docs" },
  { href: "/about", label: "About", icon: Info, short: "About" },
  { href: "/contact", label: "Contact", icon: Mail, short: "Contact" },
];

export const HOME_PATHS = [
  { href: "/research", icon: Microscope, title: "Research", desc: "Factors, risk & momentum", code: "QR" },
  { href: "/terminal", icon: Terminal, title: "Terminal", desc: "Live quotes & depth", code: "DESK" },
  { href: "/chart", icon: BarChart3, title: "Charts", desc: "Indicators & analysis", code: "GP" },
] as const;
