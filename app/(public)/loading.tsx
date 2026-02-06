import { PageSkeleton } from "@/components/ui/loading-skeleton";

export default function Loading() {
  return (
    <div className="container mx-auto px-4 py-8">
      <PageSkeleton />
    </div>
  );
}

