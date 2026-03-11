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
      className={`min-h-screen bg-[#0a0a0f] text-white pl-[calc(14px+env(safe-area-inset-left))] pr-[calc(14px+env(safe-area-inset-right))] pt-[calc(1rem+env(safe-area-inset-top))] pb-20 md:pl-[calc(1.25rem+env(safe-area-inset-left))] md:pr-[calc(1.25rem+env(safe-area-inset-right))] md:py-5 lg:pl-[calc(1.5rem+env(safe-area-inset-left))] lg:pr-[calc(1.5rem+env(safe-area-inset-right))] lg:py-6 ${className}`}
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.25 }}
    >
      {children}
    </motion.main>
  );
}
