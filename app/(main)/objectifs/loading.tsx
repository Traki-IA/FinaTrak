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
          <Skeleton className="h-[10px] w-20" />
        </div>
        <div className="flex">
          <div className="flex-1 text-center py-[6px] px-2" style={{ borderRight: "1px solid #2e2e2e" }}>
            <Skeleton className="h-[10px] w-20 mx-auto mb-[4px]" />
            <Skeleton className="h-[17px] w-24 mx-auto" />
          </div>
          <div className="flex-1 text-center py-[6px] px-2">
            <Skeleton className="h-[10px] w-14 mx-auto mb-[4px]" />
            <Skeleton className="h-[17px] w-16 mx-auto" />
          </div>
        </div>
        <div className="px-[14px] py-[8px]" style={{ borderTop: "1px solid #2e2e2e" }}>
          <Skeleton className="h-[10px] w-32 mb-[6px]" />
          <Skeleton className="h-[3px] w-full rounded-full" />
        </div>
      </div>
      {/* Objectifs list card */}
      <div className="mt-[8px] rounded-[14px] overflow-hidden" style={{ border: "1px solid #2e2e2e", background: "#1a1a1a" }}>
        {[...Array(4)].map((_, i) => (
          <div key={i} className="px-[14px] py-[10px]" style={{ borderBottom: i < 3 ? "1px solid #2e2e2e" : "none" }}>
            <div className="flex items-start justify-between mb-2">
              <div className="flex items-center gap-2.5">
                <Skeleton className="w-2 h-2 rounded-full" />
                <div>
                  <Skeleton className="h-[14px] w-28 mb-1" />
                  <Skeleton className="h-[12px] w-20" />
                </div>
              </div>
              <Skeleton className="h-[18px] w-10" />
            </div>
            <Skeleton className="h-[3px] w-full rounded-full" />
          </div>
        ))}
      </div>
    </Shell>
  );
}
