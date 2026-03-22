"use client";

import type { ReactNode } from "react";

interface ILogoHeaderProps {
  rightSlot?: ReactNode;
}

export default function LogoHeader({ rightSlot }: ILogoHeaderProps) {
  return (
    <div className="flex items-center justify-center gap-[9px] py-1 border-b border-[var(--bg2)] relative">
      <div className="w-[26px] h-[26px] rounded-[7px] bg-[var(--orange)] flex items-center justify-center text-[13px] font-semibold text-white">
        F
      </div>
      <div className="text-[15px] font-medium tracking-[-0.02em] text-[var(--text)]">
        Fina<span className="text-[var(--orange)] font-medium">Trak</span>
      </div>
      {rightSlot && (
        <div className="absolute right-0 top-1/2 -translate-y-1/2">
          {rightSlot}
        </div>
      )}
    </div>
  );
}
