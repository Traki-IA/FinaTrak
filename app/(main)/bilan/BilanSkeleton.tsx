import { Skeleton } from "@/components/ui/skeleton";

export default function BilanSkeleton() {
  return (
    <main className="min-h-screen bg-background p-6 md:p-8">
      {/* Header */}
      <div className="mb-8">
        <Skeleton className="h-8 w-44 mb-2" />
        <Skeleton className="h-4 w-56" />
      </div>

      {/* KPI cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 mb-6">
        {Array.from({ length: 4 }).map((_, i) => (
          <div
            key={i}
            className="bg-white/[0.04] border border-white/[0.07] rounded-2xl p-5"
          >
            <Skeleton className="h-3 w-24 mb-4" />
            <Skeleton className="h-7 w-32 mb-2" />
            <Skeleton className="h-3 w-20" />
          </div>
        ))}
      </div>

      {/* Bar chart */}
      <div className="bg-white/[0.04] border border-white/[0.07] rounded-2xl p-6 mb-4">
        <Skeleton className="h-4 w-48 mb-6" />
        <Skeleton className="h-56 w-full rounded-xl" />
      </div>

      {/* Categories */}
      <div className="bg-white/[0.04] border border-white/[0.07] rounded-2xl p-6">
        <Skeleton className="h-4 w-52 mb-6" />
        <div className="space-y-4">
          {Array.from({ length: 5 }).map((_, i) => (
            <div key={i} className="flex items-center gap-4">
              <Skeleton className="h-4 w-28" />
              <div className="flex-1">
                <Skeleton className="h-2.5 w-full rounded-full" />
              </div>
              <Skeleton className="h-4 w-20" />
            </div>
          ))}
        </div>
      </div>
    </main>
  );
}
