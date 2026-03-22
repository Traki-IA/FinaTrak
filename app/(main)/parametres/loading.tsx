import { Skeleton } from "@/components/ui/skeleton";
import LogoHeader from "@/components/ui/LogoHeader";
import Shell from "@/components/layout/Shell";

export default function Loading() {
  return (
    <Shell>
      <LogoHeader />
      {[
        { label: "COMPTE", rows: 2 },
        { label: "PRÉFÉRENCES", rows: 4 },
        { label: "DONNÉES", rows: 1 },
      ].map(({ label, rows }) => (
        <div key={label} className="mt-[8px] rounded-[14px] overflow-hidden" style={{ border: "1px solid #2e2e2e", background: "#1a1a1a" }}>
          <div className="py-[3px] flex justify-center" style={{ borderBottom: "1px solid #2e2e2e" }}>
            <Skeleton className="h-[10px] w-16" />
          </div>
          {[...Array(rows)].map((_, i) => (
            <div key={i} className="flex items-center justify-between px-[14px] py-[12px]" style={{ borderBottom: i < rows - 1 ? "1px solid #2e2e2e" : "none" }}>
              <div className="flex items-center gap-3">
                <Skeleton className="w-[32px] h-[32px] rounded-[8px]" />
                <div>
                  <Skeleton className="h-[14px] w-24 mb-1" />
                  <Skeleton className="h-[12px] w-16" />
                </div>
              </div>
              <Skeleton className="h-[20px] w-[36px] rounded-full" />
            </div>
          ))}
        </div>
      ))}
    </Shell>
  );
}
