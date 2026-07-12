"use client";

import { useEffect } from "react";
import Link from "next/link";
import LoadingSpinner from "@/components/LoadingSpinner";
import { PRODUCT_NAME } from "@/lib/orionAlpha";

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error("[Orion Alpha]", error);
  }, [error]);

  return (
    <div className="error-page-root">
      <div className="error-page-card">
        <LoadingSpinner size="md" />
        <div className="error-page-code mono">500</div>
        <h1 className="error-page-title">Something Went Wrong</h1>
        <p className="error-page-msg">
          {PRODUCT_NAME} hit an unexpected error. This can happen when the market API
          is restarting or the page cache is stale.
        </p>
        <div className="error-page-actions">
          <button type="button" className="error-page-btn error-page-btn-primary mono" onClick={reset}>
            Try Again
          </button>
          <Link href="/terminal" className="error-page-btn mono">Launch Terminal</Link>
          <Link href="/" className="error-page-btn mono">Home</Link>
        </div>
        <p className="error-page-hint mono">
          If this persists: bash scripts/run.sh · hard refresh Cmd+Shift+R
        </p>
      </div>
    </div>
  );
}
