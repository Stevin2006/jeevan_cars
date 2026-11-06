import { Skeleton } from "@/components/ui/skeleton";

export function VehicleDetailSkeleton() {
  return (
    <div
      className="container-page pt-[calc(var(--nav-height)+1.5rem)] pb-16"
      aria-busy="true"
      aria-label="Loading vehicle"
    >
      <Skeleton className="mb-6 h-4 w-56" />
      <div className="grid gap-10 lg:grid-cols-12 lg:gap-12">
        <div className="min-w-0 space-y-3 lg:col-span-7">
          <Skeleton className="aspect-[3/2] w-full" />
          <div className="flex gap-2 overflow-hidden">
            {Array.from({ length: 4 }, (_, index) => (
              <Skeleton key={index} className="aspect-[3/2] w-24 sm:w-28" />
            ))}
          </div>
        </div>
        <div className="space-y-6 lg:col-span-5">
          <Skeleton className="h-4 w-32" />
          <Skeleton className="h-10 w-3/4" />
          <Skeleton className="h-6 w-1/2" />
          <Skeleton className="h-20 w-full" />
          <Skeleton className="h-16 w-full" />
          <Skeleton className="h-12 w-full" />
        </div>
      </div>
    </div>
  );
}
