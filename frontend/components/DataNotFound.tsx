"use client";

interface Props {
  symbol?: string;
  title?: string;
  message?: string;
  sourcesTried?: string[];
  source?: string;
  onRetry?: () => void;
  compact?: boolean;
  hideSources?: boolean;
  className?: string;
}

const DEFAULT_MSG = "Data not found. Please try again later.";
const DEFAULT_SOURCES = ["yfinance", "Google Finance"];

function formatSource(src: string): string {
  if (src === "google-finance") return "Google Finance";
  if (src === "yfinance") return "Yahoo Finance";
  return src;
}

export default function DataNotFound({
  symbol,
  title = "Data not found",
  message = DEFAULT_MSG,
  sourcesTried = DEFAULT_SOURCES,
  source,
  onRetry,
  compact = false,
  hideSources = false,
  className = "",
}: Props) {
  return (
    <div className={`oa-data-not-found${compact ? " oa-data-not-found-compact" : ""} ${className}`.trim()}>
      <div className="oa-data-not-found-icon" aria-hidden>!</div>
      <h3 className="oa-data-not-found-title mono">{title}</h3>
      {symbol && <p className="oa-data-not-found-symbol mono">{symbol}</p>}
      <p className="oa-data-not-found-msg">{message}</p>
      {!hideSources && (
        <p className="oa-data-not-found-sources mono">
          Sources checked: {sourcesTried.map(formatSource).join(" · ")}
          {source && source !== "none" ? ` · Using ${formatSource(source)}` : ""}
        </p>
      )}
      {onRetry && (
        <button type="button" className="oa-data-not-found-retry mono" onClick={onRetry}>
          Try again
        </button>
      )}
    </div>
  );
}

export { DEFAULT_MSG as DATA_NOT_FOUND_MSG, DEFAULT_SOURCES as DATA_SOURCES };
