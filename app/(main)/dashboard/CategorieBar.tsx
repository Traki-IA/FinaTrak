"use client";

import { motion } from "framer-motion";
import type { TBilanCategorie } from "@/types";

const FADE_UP = {
  hidden: { opacity: 0, y: 16 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.35 } },
};

function formatEur(n: number) {
  return new Intl.NumberFormat("fr-FR", {
    style: "currency",
    currency: "EUR",
  }).format(n);
}

export default function CategorieBar({
  nom,
  couleur,
  total,
  pourcentage,
}: TBilanCategorie) {
  return (
    <motion.div
      variants={FADE_UP}
      className="flex items-center gap-4 group"
    >
      <div className="w-20 sm:w-28 flex-shrink-0 flex items-center gap-2">
        <span
          className="w-2 h-2 rounded-full flex-shrink-0"
          style={{ background: couleur }}
        />
        <span className="text-sm text-white/70 truncate">{nom}</span>
      </div>

      <div className="flex-1 h-2 bg-white/[0.06] rounded-full overflow-hidden">
        <motion.div
          initial={{ width: 0 }}
          animate={{ width: `${pourcentage}%` }}
          transition={{ duration: 0.7, ease: "easeOut", delay: 0.2 }}
          className="h-full rounded-full"
          style={{ background: couleur }}
        />
      </div>

      <div className="w-24 sm:w-32 flex-shrink-0 flex items-center justify-end gap-2 sm:gap-3">
        <span className="hidden sm:inline text-xs text-white/35">
          {pourcentage.toFixed(1)} %
        </span>
        <span className="text-sm font-medium text-white tabular-nums">
          {formatEur(total)}
        </span>
      </div>
    </motion.div>
  );
}
