import { Skeleton } from "@/components/ui/skeleton";

export default function BudgetSkeleton() {
  return (
    <main className="min-h-screen bg-background p-6 md:p-8">
      {/* Header */}
      <div className="flex items-start justify-between mb-8">
        <div>
          <Skeleton className="h-8 w-44 mb-2" />
          <Skeleton className="h-4 w-56" />
        </div>
        <Skeleton className="h-10 w-36 rounded-xl" />
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 mb-8">
        {Array.from({ length: 3 }).map((_, i) => (
          <div
            key={i}
            className="bg-white/[0.04] border border-white/[0.07] rounded-2xl p-5"
          >
            <Skeleton className="h-3 w-28 mb-4" />
            <Skeleton className="h-7 w-36 mb-2" />
            <Skeleton className="h-3 w-24" />
          </div>
        ))}
      </div>

      {/* Sections */}
      {["Charges mensuelles", "Charges annuelles"].map((section) => (
        <div key={section} className="mb-6">
          <Skeleton className="h-5 w-48 mb-4" />
          <div className="space-y-3">
            {Array.from({ length: 3 }).map((_, i) => (
              <div
                key={i}
                className="bg-white/[0.04] border border-white/[0.07] rounded-2xl p-4 flex items-center gap-4"
              >
                <Skeleton className="h-9 w-9 rounded-xl flex-shrink-0" />
                <div className="flex-1">
                  <Skeleton className="h-4 w-40 mb-2" />
                  <Skeleton className="h-3 w-24" />
                </div>
                <Skeleton className="h-5 w-24" />
                <Skeleton className="h-8 w-12 rounded-full" />
                <Skeleton className="h-8 w-8 rounded-lg" />
              </div>
            ))}
          </div>
        </div>
      ))}
    </main>
  );
}
