"use client";

import { motion } from "framer-motion";
import { Plus } from "lucide-react";
import { useSidebar } from "@/components/SidebarContext";

interface IFabProps {
  label?: string;
  onClick: () => void;
}

export default function Fab({ label, onClick }: IFabProps) {
  const { breakpoint } = useSidebar();
  const isDesktop = breakpoint === "desktop";

  return (
    <motion.button
      initial={{ scale: 0, opacity: 0 }}
      animate={{ scale: 1, opacity: 1 }}
      transition={{ delay: 0.3, type: "spring", stiffness: 260, damping: 20 }}
      onClick={onClick}
      className="fixed z-40 cursor-pointer"
      style={{
        bottom: breakpoint === "mobile" ? 72 : 20,
        right: 20,
      }}
    >
      {isDesktop && label ? (
        <div className="flex items-center gap-2 px-[18px] py-2.5 rounded-3xl bg-orange-500 text-white shadow-[0_4px_20px_rgba(249,115,22,0.4)] hover:bg-orange-400 transition-colors">
          <Plus size={18} strokeWidth={2.5} />
          <span className="text-[12px] font-bold">{label}</span>
        </div>
      ) : (
        <div className="w-11 h-11 rounded-full bg-orange-500 flex items-center justify-center text-white shadow-[0_4px_20px_rgba(249,115,22,0.45)] hover:bg-orange-400 transition-colors">
          <Plus size={22} strokeWidth={2.5} />
        </div>
      )}
    </motion.button>
  );
}
