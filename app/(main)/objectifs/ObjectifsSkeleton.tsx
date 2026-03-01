import { Skeleton } from "@/components/ui/skeleton";

export default function ObjectifsSkeleton() {
  return (
    <main className="min-h-screen bg-background p-6 md:p-8">
      {/* Header */}
      <div className="flex items-start justify-between mb-8">
        <div>
          <Skeleton className="h-8 w-40 mb-2" />
          <Skeleton className="h-4 w-48" />
        </div>
        <Skeleton className="h-10 w-36 rounded-xl" />
      </div>

      {/* Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
        {Array.from({ length: 6 }).map((_, i) => (
          <div
            key={i}
            className="bg-white/[0.04] border border-white/[0.07] rounded-2xl p-5"
          >
            <div className="flex items-start justify-between mb-4">
              <div>
                <Skeleton className="h-5 w-36 mb-2" />
                <Skeleton className="h-4 w-20 rounded-full" />
              </div>
              <Skeleton className="h-8 w-8 rounded-lg" />
            </div>
            <Skeleton className="h-2.5 w-full rounded-full mb-3" />
            <div className="flex justify-between">
              <Skeleton className="h-4 w-24" />
              <Skeleton className="h-4 w-20" />
            </div>
          </div>
        ))}
      </div>
    </main>
  );
}
