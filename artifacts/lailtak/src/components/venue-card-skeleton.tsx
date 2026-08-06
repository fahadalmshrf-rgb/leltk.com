import { VenueCard } from "@/components/venue-card";
import { Skeleton } from "@/components/ui/skeleton";

export function VenueCardSkeleton() {
  return (
    <div className="w-full rounded-xl border border-border/50 overflow-hidden bg-card">
      <Skeleton className="w-full aspect-[4/3]" />
      <div className="p-4 space-y-3">
        <div className="flex justify-between items-start">
          <Skeleton className="h-6 w-1/2" />
          <Skeleton className="h-6 w-16" />
        </div>
        <div className="flex gap-4">
          <Skeleton className="h-4 w-20" />
          <Skeleton className="h-4 w-20" />
        </div>
      </div>
    </div>
  );
}
