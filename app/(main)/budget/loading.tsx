import { Skeleton } from "@/components/ui/skeleton";
import LogoHeader from "@/components/ui/LogoHeader";
import Shell from "@/components/layout/Shell";

export default function Loading() {
  return (
    <Shell>
      <LogoHeader />
      {/* KPI card */}
      <div className="mt-[8px] rounded-[14px] overflow-hidden" style={{ border: "1px solid #2e2e2e", background: "#1a1a1a" }}>
        <div className="py-[3px] flex justify-center" style={{ borderBottom: "1px solid #2e2e2e" }}>
          <Skeleton className="h-[10px] w-16" />
        </div>
        <div className="flex">
          <div className="flex-1 text-center py-[6px] px-2" style={{ borderRight: "1px solid #2e2e2e" }}>
            <Skeleton className="h-[10px] w-14 mx-auto mb-[4px]" />
            <Skeleton className="h-[17px] w-24 mx-auto" />
          </div>
          <div className="flex-1 text-center py-[6px] px-2">
            <Skeleton className="h-[10px] w-10 mx-auto mb-[4px]" />
            <Skeleton className="h-[17px] w-24 mx-auto" />
          </div>
        </div>
      </div>
      {/* Category groups */}
      {[4, 3, 2].map((rows, gi) => (
        <div key={gi} className="mt-[8px] rounded-[14px] overflow-hidden" style={{ border: "1px solid #2e2e2e", background: "#1a1a1a" }}>
          <div className="py-[3px] flex justify-center" style={{ borderBottom: "1px solid #2e2e2e" }}>
            <Skeleton className="h-[10px] w-20" />
          </div>
          {[...Array(rows)].map((_, i) => (
            <div key={i} className="flex items-center justify-between px-[14px] py-[8px]" style={{ borderBottom: i < rows - 1 ? "1px solid #2e2e2e" : "none" }}>
              <div className="flex items-center gap-2">
                <Skeleton className="w-2 h-2 rounded-full" />
                <Skeleton className="h-[14px] w-28" />
              </div>
              <div className="flex items-center gap-3">
                <Skeleton className="h-[13px] w-20" />
                <Skeleton className="h-5 w-9 rounded-full" />
              </div>
            </div>
          ))}
        </div>
      ))}
    </Shell>
  );
}
