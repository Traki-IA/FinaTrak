import { Skeleton } from "@/components/ui/skeleton";
import LogoHeader from "@/components/ui/LogoHeader";
import Shell from "@/components/layout/Shell";

export default function Loading() {
  return (
    <Shell>
      <LogoHeader />
      {/* Search bar */}
      <Skeleton className="h-[36px] w-full rounded-[10px] my-2" />
      {/* Filter bar */}
      <div className="flex gap-2 pb-2">
        <Skeleton className="flex-1 h-[30px] rounded-lg" />
        <Skeleton className="flex-1 h-[30px] rounded-lg" />
        <Skeleton className="flex-1 h-[30px] rounded-lg" />
        <Skeleton className="flex-1 h-[30px] rounded-lg" />
      </div>
      {/* Categories card */}
      <div className="mt-[8px] rounded-[14px] overflow-hidden" style={{ border: "1px solid #2e2e2e", background: "#1a1a1a" }}>
        <div className="px-[14px] py-[8px]" style={{ borderBottom: "1px solid #2e2e2e" }}>
          <Skeleton className="h-[10px] w-20" />
        </div>
        <div className="flex flex-col gap-[10px] px-[14px] py-[10px]">
          {[72, 13, 11, 4].map((w, i) => (
            <div key={i} className="flex items-center gap-[8px]">
              <Skeleton className="w-[7px] h-[7px] rounded-full flex-shrink-0" />
              <Skeleton className="h-[13px] w-[80px]" />
              <Skeleton className="flex-1 h-[5px] rounded-full" style={{ maxWidth: `${w}%` }} />
              <Skeleton className="h-[13px] w-[28px]" />
            </div>
          ))}
        </div>
      </div>
      {/* Transaction list card */}
      <div className="mt-[8px] rounded-[14px] overflow-hidden" style={{ border: "1px solid #2e2e2e", background: "#1a1a1a" }}>
        {[...Array(6)].map((_, i) => (
          <div key={i} className="grid py-[10px] px-[14px] gap-2 items-center" style={{ gridTemplateColumns: "54px 76px 1fr 68px", borderBottom: i < 5 ? "1px solid #2e2e2e" : "none" }}>
            <Skeleton className="h-[13px] w-full" />
            <Skeleton className="h-[20px] w-full rounded-full" />
            <Skeleton className="h-[14px] w-full" />
            <Skeleton className="h-[14px] w-full" />
          </div>
        ))}
      </div>
    </Shell>
  );
}
