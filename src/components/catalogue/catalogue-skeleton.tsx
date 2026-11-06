import { Skeleton } from "@/components/ui/skeleton";

export function VehicleCardSkeleton() {
  return (
    <div className="overflow-hidden rounded-lg bg-card ring-1 ring-ink/[0.07]">
      <Skeleton className="aspect-[3/2] rounded-none" />
      <div className="space-y-3 p-5">
        <Skeleton className="h-3 w-24" />
        <Skeleton className="h-5 w-3/4" />
        <Skeleton className="h-3 w-1/2" />
        <div className="flex justify-between border-t border-dashed pt-4">
          <Skeleton className="h-5 w-20" />
          <Skeleton className="h-5 w-24" />
        </div>
      </div>
    </div>
  );
}

export function CatalogueSkeleton() {
  return (
    <div
      className="grid gap-8 lg:grid-cols-[17rem_1fr] lg:gap-10"
      aria-busy="true"
      aria-label="Loading vehicles"
    >
      <Skeleton className="h-12 lg:h-[34rem]" />
      <div className="space-y-6">
        <Skeleton className="h-10 w-full max-w-sm" />
        <div className="grid gap-6 sm:grid-cols-2 xl:grid-cols-3">
          {Array.from({ length: 6 }, (_, index) => (
            <VehicleCardSkeleton key={index} />
          ))}
        </div>
      </div>
    </div>
  );
}
