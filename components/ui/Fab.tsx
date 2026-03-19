"use client";

import { motion } from "framer-motion";
import { Plus } from "lucide-react";

interface IFabProps {
  label?: string;
  onClick: () => void;
}

export default function Fab({ onClick }: IFabProps) {
  return (
    <motion.button
      initial={{ scale: 0, opacity: 0 }}
      animate={{ scale: 1, opacity: 1 }}
      transition={{ delay: 0.3, type: "spring", stiffness: 260, damping: 20 }}
      onClick={onClick}
      className="fixed z-40 cursor-pointer"
      style={{ bottom: 76, right: 16 }}
    >
      <div className="w-12 h-12 rounded-full bg-[var(--orange)] flex items-center justify-center text-white shadow-[0_4px_16px_rgba(249,115,22,0.4)]">
        <Plus size={20} strokeWidth={2.5} />
      </div>
    </motion.button>
  );
}
