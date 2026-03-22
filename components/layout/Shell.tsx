"use client";

import { motion } from "framer-motion";
import type { ReactNode } from "react";

interface IShellProps {
  children: ReactNode;
  className?: string;
}

export default function Shell({ children, className = "" }: IShellProps) {
  return (
    <motion.main
      className={`min-h-screen bg-[#111111] text-[var(--text)] pl-[calc(10px+env(safe-area-inset-left))] pr-[calc(10px+env(safe-area-inset-right))] pt-[calc(1rem+env(safe-area-inset-top))] pb-20 ${className}`}
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.1 }}
    >
      {children}
    </motion.main>
  );
}
