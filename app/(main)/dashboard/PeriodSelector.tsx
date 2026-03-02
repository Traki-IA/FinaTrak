"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { motion } from "framer-motion";
import type { TPeriod } from "@/types";

const PERIODS: { value: TPeriod; label: string }[] = [
  { value: "1m", label: "Ce mois" },
  { value: "3m", label: "3 mois" },
  { value: "6m", label: "6 mois" },
  { value: "1y", label: "1 an" },
];

export default function PeriodSelector({ current }: { current: TPeriod }) {
  const router = useRouter();
  const searchParams = useSearchParams();

  function handleChange(period: TPeriod) {
    const params = new URLSearchParams(searchParams.toString());
    if (period === "1m") {
      params.delete("period");
    } else {
      params.set("period", period);
    }
    const qs = params.toString();
    router.replace(qs ? `?${qs}` : "/dashboard", { scroll: false });
  }

  return (
    <div className="flex gap-1 bg-white/[0.04] rounded-xl p-1">
      {PERIODS.map((p) => (
        <button
          key={p.value}
          onClick={() => handleChange(p.value)}
          className={`relative px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${
            current === p.value
              ? "text-white"
              : "text-white/40 hover:text-white/60"
          }`}
        >
          {current === p.value && (
            <motion.div
              layoutId="period-indicator"
              className="absolute inset-0 bg-orange-500/20 border border-orange-500/30 rounded-lg"
              transition={{ type: "spring", stiffness: 300, damping: 25 }}
            />
          )}
          <span className="relative z-10">{p.label}</span>
        </button>
      ))}
    </div>
  );
}
