"use client";

import { useEffect } from "react";
import { ErrorState } from "@/components/ui/error-state";
import { Button } from "@/components/ui/button";
import Link from "next/link";

export default function AdminError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error("Admin page error:", error);
  }, [error]);

  return (
    <div className="container mx-auto px-4 py-16">
      <ErrorState
        title="Admin Panel Error"
        message={error.message || "An error occurred in the admin panel. Please try again."}
        onRetry={reset}
        action={{
          label: "Go to Dashboard",
          href: "/admin",
        }}
      />
    </div>
  );
}

