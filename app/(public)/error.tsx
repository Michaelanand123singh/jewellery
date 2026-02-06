"use client";

import { useEffect } from "react";
import { ErrorState } from "@/components/ui/error-state";
import { Button } from "@/components/ui/button";
import Link from "next/link";

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    // Log the error to an error reporting service
    console.error("Page error:", error);
  }, [error]);

  return (
    <div className="container mx-auto px-4 py-16">
      <ErrorState
        title="Something went wrong"
        message={error.message || "An unexpected error occurred. Please try again."}
        onRetry={reset}
        action={{
          label: "Go Home",
          href: "/",
        }}
      />
    </div>
  );
}

