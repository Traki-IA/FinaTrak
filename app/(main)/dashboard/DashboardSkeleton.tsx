import { Skeleton } from "@/components/ui/skeleton";

export default function DashboardSkeleton() {
  return (
    <div className="min-h-screen bg-[#111111] px-[14px] pt-4 pb-20">
      {/* Logo header */}
      <div className="flex items-center justify-center gap-2 py-2 border-b border-[#181818] mb-2">
        <Skeleton className="w-[26px] h-[26px] rounded-[7px]" />
        <Skeleton className="h-4 w-24" />
      </div>

      {/* Period tabs */}
      <div className="flex gap-[6px] py-[6px]">
        {Array.from({ length: 5 }).map((_, i) => (
          <Skeleton key={i} className="flex-1 h-[28px] rounded-lg" />
        ))}
      </div>

      {/* Chart */}
      <Skeleton className="h-[190px] w-full rounded-lg mt-2" />

      {/* Legend */}
      <div className="flex justify-center gap-4 py-2">
        <Skeleton className="h-3 w-16" />
        <Skeleton className="h-3 w-16" />
      </div>

      {/* Divider */}
      <div className="h-px bg-[#181818] my-1" />

      {/* Bilan 3 cols */}
      <div className="flex bg-[#181818] rounded-none">
        {Array.from({ length: 3 }).map((_, i) => (
          <div key={i} className="flex-1 py-[10px] flex flex-col items-center gap-1">
            <Skeleton className="h-2.5 w-14" />
            <Skeleton className="h-5 w-16" />
          </div>
        ))}
      </div>

      {/* Monthly detail */}
      <div className="mt-4 space-y-3">
        {Array.from({ length: 3 }).map((_, i) => (
          <div key={i} className="flex justify-between">
            <Skeleton className="h-3 w-12" />
            <Skeleton className="h-3 w-14" />
            <Skeleton className="h-3 w-14" />
            <Skeleton className="h-3 w-16" />
          </div>
        ))}
      </div>
    </div>
  );
}
