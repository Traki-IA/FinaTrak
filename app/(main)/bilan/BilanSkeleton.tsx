export default function BilanSkeleton() {
  return (
    <div className="flex-1 flex flex-col overflow-hidden animate-pulse">
      {/* Header */}
      <div className="flex items-center justify-between px-4 pt-4 pb-3 border-b border-white/[0.06]">
        <div>
          <div className="h-6 w-24 bg-white/10 rounded-lg" />
          <div className="h-3 w-36 bg-white/[0.06] rounded mt-1" />
        </div>
        <div className="flex gap-2">
          <div className="h-6 w-10 bg-white/[0.06] rounded-md" />
          <div className="h-6 w-10 bg-white/[0.06] rounded-md" />
        </div>
      </div>

      {/* KPIs */}
      <div className="p-4 border-b border-white/[0.06]">
        <div className="flex gap-3">
          {[...Array(3)].map((_, i) => (
            <div key={i} className="flex-1 bg-white/[0.04] rounded-xl p-3 h-20" />
          ))}
        </div>
      </div>

      {/* Chart */}
      <div className="flex-1 p-4">
        <div className="h-40 bg-white/[0.04] rounded-xl mb-4" />
        <div className="space-y-3">
          {[...Array(4)].map((_, i) => (
            <div key={i} className="h-10 bg-white/[0.04] rounded-xl" />
          ))}
        </div>
      </div>
    </div>
  );
}
