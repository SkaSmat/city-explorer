import { cn } from "@/lib/utils";

function Skeleton({ className, ...props }: React.HTMLAttributes<HTMLDivElement>) {
  return <div className={cn("animate-pulse rounded-md bg-muted", className)} {...props} />;
}

// Preset skeleton components for common use cases

function SkeletonCard() {
  return (
    <div className="bg-card rounded-2xl border border-border p-4 space-y-3">
      <Skeleton className="h-5 w-2/3" />
      <Skeleton className="h-4 w-1/2" />
      <Skeleton className="h-8 w-full" />
    </div>
  );
}

function SkeletonStat() {
  return (
    <div className="bg-card rounded-2xl border border-border p-4 space-y-2">
      <Skeleton className="h-6 w-6 rounded-full" />
      <Skeleton className="h-8 w-20" />
      <Skeleton className="h-4 w-16" />
    </div>
  );
}

function SkeletonBadge() {
  return (
    <div className="bg-card rounded-xl border border-border p-4 space-y-2 text-center">
      <Skeleton className="h-12 w-12 rounded-full mx-auto" />
      <Skeleton className="h-3 w-16 mx-auto" />
    </div>
  );
}

function SkeletonCityCard() {
  return (
    <div className="bg-card rounded-2xl border border-border p-4">
      <div className="flex items-start gap-4">
        <Skeleton className="w-20 h-20 rounded-xl flex-shrink-0" />
        <div className="flex-1 space-y-2">
          <Skeleton className="h-5 w-32" />
          <Skeleton className="h-4 w-40" />
          <div className="space-y-1">
            <Skeleton className="h-2 w-full rounded-full" />
            <Skeleton className="h-3 w-20" />
          </div>
        </div>
      </div>
    </div>
  );
}

export { Skeleton, SkeletonCard, SkeletonStat, SkeletonBadge, SkeletonCityCard };
