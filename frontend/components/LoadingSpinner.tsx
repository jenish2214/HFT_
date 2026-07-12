"use client";

interface SpinnerProps {
  size?: "sm" | "md" | "lg";
  label?: string;
  className?: string;
}

const SIZE: Record<NonNullable<SpinnerProps["size"]>, number> = {
  sm: 14,
  md: 22,
  lg: 32,
};

export default function LoadingSpinner({ size = "md", label, className = "" }: SpinnerProps) {
  const px = SIZE[size];
  return (
    <span className={`oa-spinner-wrap ${className}`} role="status" aria-label={label || "Loading"}>
      <span className="oa-spinner" style={{ width: px, height: px }} />
      {label && <span className="oa-spinner-label mono">{label}</span>}
    </span>
  );
}
