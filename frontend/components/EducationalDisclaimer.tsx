import { EDUCATION_DISCLAIMER } from "@/lib/orionAlpha";

interface Props {
  compact?: boolean;
  className?: string;
}

export default function EducationalDisclaimer({ compact = false, className = "" }: Props) {
  return (
    <aside
      className={`qr-edu-disclaimer${compact ? " qr-edu-disclaimer-compact" : ""} ${className}`.trim()}
      role="note"
    >
      <span className="qr-edu-disclaimer-badge mono">Education only</span>
      <p>{EDUCATION_DISCLAIMER}</p>
    </aside>
  );
}
