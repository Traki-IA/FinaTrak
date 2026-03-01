import { Skeleton } from "@/components/ui/skeleton";
import { Card, CardContent } from "@/components/ui/card";

export default function DashboardSkeleton() {
  return (
    <div className="min-h-screen bg-[#0a0a0f] px-4 py-6 lg:px-8 lg:py-8">
      {/* Header */}
      <div className="mb-8 space-y-2">
        <Skeleton className="h-3 w-24" />
        <Skeleton className="h-7 w-48" />
      </div>

      {/* KPI cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 mb-5">
        {Array.from({ length: 4 }).map((_, i) => (
          <Card key={i}>
            <CardContent className="space-y-3">
              <Skeleton className="h-2.5 w-20" />
              <Skeleton className="h-8 w-32" />
              <Skeleton className="h-2.5 w-16" />
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Charts row */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-3 mb-5">
        <Card className="lg:col-span-2">
          <CardContent className="space-y-4">
            <Skeleton className="h-2.5 w-28" />
            <Skeleton className="h-7 w-36" />
            <Skeleton className="h-48 w-full rounded-xl" />
          </CardContent>
        </Card>
        <Card>
          <CardContent className="space-y-4">
            <Skeleton className="h-2.5 w-28" />
            <Skeleton className="h-7 w-36" />
            <Skeleton className="h-36 w-full rounded-full mx-auto" style={{ maxWidth: 144 }} />
            <div className="space-y-2">
              {Array.from({ length: 4 }).map((_, i) => (
                <div key={i} className="flex justify-between">
                  <Skeleton className="h-2.5 w-24" />
                  <Skeleton className="h-2.5 w-16" />
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Transactions */}
      <Card>
        <CardContent className="space-y-4">
          <div className="flex justify-between">
            <Skeleton className="h-2.5 w-36" />
            <Skeleton className="h-2.5 w-16" />
          </div>
          {Array.from({ length: 5 }).map((_, i) => (
            <div key={i} className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <Skeleton className="w-9 h-9 rounded-full" />
                <div className="space-y-1.5">
                  <Skeleton className="h-3 w-36" />
                  <Skeleton className="h-2.5 w-24" />
                </div>
              </div>
              <Skeleton className="h-3 w-16" />
            </div>
          ))}
        </CardContent>
      </Card>
    </div>
  );
}
