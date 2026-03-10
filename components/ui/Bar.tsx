"use client";

import { motion } from "framer-motion";

interface IBarProps {
  pct: number;
  color: string;
  height?: number;
  className?: string;
}

export default function Bar({
  pct,
  color,
  height = 3,
  className = "",
}: IBarProps) {
  return (
    <div
      className={`bg-white/[0.07] rounded-full overflow-hidden ${className}`}
      style={{ height }}
    >
      <motion.div
        initial={{ width: 0 }}
        animate={{ width: `${Math.min(pct, 100)}%` }}
        transition={{ duration: 0.6, ease: "easeOut" }}
        className="h-full rounded-full"
        style={{ background: color }}
      />
    </div>
  );
}
