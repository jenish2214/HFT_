import Link from "next/link";
import FullscreenIcon from "@/components/FullscreenIcon";

interface Props {
  href: string;
  title?: string;
  className?: string;
  variant?: "terminal" | "site";
  size?: number;
  external?: boolean;
}

export default function ChartFullscreenLink({
  href,
  title = "Open full-screen chart",
  className = "",
  variant = "terminal",
  size = 16,
  external = false,
}: Props) {
  const cls = [
    "chart-fs-icon-btn",
    variant === "site" ? "chart-fs-site" : "chart-fullscreen-btn",
    className,
  ].filter(Boolean).join(" ");

  const content = (
    <>
      <FullscreenIcon size={size} />
      <span className="oa-sr-only">{title}</span>
    </>
  );

  if (external || href.startsWith("http")) {
    return (
      <a
        href={href}
        target="_blank"
        rel="noopener noreferrer"
        className={cls}
        title={title}
        aria-label={title}
      >
        {content}
      </a>
    );
  }

  return (
    <Link href={href} className={cls} title={title} aria-label={title}>
      {content}
    </Link>
  );
}
