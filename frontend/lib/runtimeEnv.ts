/** Browser/runtime helpers for local vs deployed lab behavior. */

export function isBrowserLocalhost(): boolean {
  if (typeof window === "undefined") return false;
  const host = window.location.hostname;
  return host === "localhost" || host === "127.0.0.1";
}

export type LabDataQuality =
  | "full-local"
  | "full-remote"
  | "delayed"
  | "partial"
  | "unavailable";

const DELAY_MS = 8000;

export function classifyLabQuality(opts: {
  isLocal: boolean;
  mode: "full" | "lite" | "error";
  latencyMs: number;
}): LabDataQuality {
  if (opts.mode === "error") return "unavailable";
  if (opts.mode === "lite") return opts.isLocal ? "partial" : "delayed";
  if (opts.mode === "full" && opts.latencyMs >= DELAY_MS) {
    return opts.isLocal ? "full-local" : "delayed";
  }
  if (opts.mode === "full" && opts.isLocal) return "full-local";
  if (opts.mode === "full") return "full-remote";
  return "unavailable";
}
