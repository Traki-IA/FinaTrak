import { Skeleton } from "@/components/ui/skeleton";

export default function TransactionsSkeleton() {
  return (
    <main className="min-h-screen bg-background p-6 md:p-8">
      {/* Header */}
      <div className="flex items-start justify-between mb-8">
        <div>
          <Skeleton className="h-8 w-48 mb-2" />
          <Skeleton className="h-4 w-32" />
        </div>
        <Skeleton className="h-10 w-36 rounded-xl" />
      </div>

      {/* Filters */}
      <div className="flex flex-wrap gap-3 mb-6">
        <Skeleton className="h-10 w-44 rounded-xl" />
        <Skeleton className="h-10 w-52 rounded-xl" />
        <Skeleton className="h-10 w-36 rounded-xl" />
      </div>

      {/* Table */}
      <div className="bg-white/[0.04] border border-white/[0.07] rounded-2xl overflow-hidden">
        {/* Table header */}
        <div className="flex gap-4 px-6 py-4 border-b border-white/[0.07]">
          <Skeleton className="h-4 w-20" />
          <Skeleton className="h-4 flex-1" />
          <Skeleton className="h-4 w-28" />
          <Skeleton className="h-4 w-20" />
          <Skeleton className="h-4 w-24 ml-auto" />
        </div>

        {/* Rows */}
        <div className="divide-y divide-white/[0.04]">
          {Array.from({ length: 8 }).map((_, i) => (
            <div key={i} className="flex items-center gap-4 px-6 py-4">
              <Skeleton className="h-4 w-24" />
              <Skeleton className="h-4 flex-1" />
              <Skeleton className="h-6 w-28 rounded-lg" />
              <Skeleton className="h-6 w-20 rounded-lg" />
              <Skeleton className="h-4 w-24 ml-auto" />
            </div>
          ))}
        </div>
      </div>
    </main>
  );
}
