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
      className={`min-h-screen bg-[#0a0a0f] text-white px-4 py-6 md:px-5 md:py-5 lg:px-6 lg:py-6 ${className}`}
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.25 }}
    >
      {children}
    </motion.main>
  );
}
