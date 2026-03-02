"use client";

import { useState, useRef, useEffect, useCallback } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Tag, ChevronDown, Check } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import type { TCategorie } from "@/types";

interface ICategoryFilterProps {
  categories: TCategorie[];
}

export default function CategoryFilter({ categories }: ICategoryFilterProps) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  const selectedIds =
    searchParams.get("categories")?.split(",").filter(Boolean) ?? [];

  // Fermer au clic extérieur
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (ref.current && !ref.current.contains(event.target as Node)) {
        setOpen(false);
      }
    }
    if (open) {
      document.addEventListener("mousedown", handleClickOutside);
      return () =>
        document.removeEventListener("mousedown", handleClickOutside);
    }
  }, [open]);

  const updateParam = useCallback(
    (nextIds: string[]) => {
      const params = new URLSearchParams(searchParams.toString());
      if (nextIds.length === 0) {
        params.delete("categories");
      } else {
        params.set("categories", nextIds.join(","));
      }
      router.push(`?${params.toString()}`);
    },
    [router, searchParams]
  );

  function toggleCategory(catId: string) {
    const next = selectedIds.includes(catId)
      ? selectedIds.filter((id) => id !== catId)
      : [...selectedIds, catId];
    updateParam(next);
  }

  function clearAll() {
    updateParam([]);
    setOpen(false);
  }

  if (categories.length === 0) return null;

  return (
    <div className="relative" ref={ref}>
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className={`flex items-center gap-2 px-3 py-2 rounded-xl text-sm border transition-colors cursor-pointer ${
          selectedIds.length > 0
            ? "border-orange-500/50 bg-orange-500/10 text-orange-300"
            : "border-white/[0.08] bg-white/[0.04] text-white/50 hover:text-white/70 hover:border-white/[0.15]"
        }`}
      >
        <Tag size={14} />
        <span>
          {selectedIds.length === 0
            ? "Catégories"
            : `${selectedIds.length} sél.`}
        </span>
        <ChevronDown
          size={14}
          className={`transition-transform ${open ? "rotate-180" : ""}`}
        />
      </button>

      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0, y: -4 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -4 }}
            transition={{ duration: 0.15 }}
            className="absolute top-full mt-1 right-0 z-50 w-56 bg-[#1a1a2e] border border-white/[0.1] rounded-xl shadow-xl overflow-hidden"
          >
            <div className="max-h-56 overflow-y-auto py-1">
              {categories.map((cat) => {
                const isSelected = selectedIds.includes(cat.id);
                return (
                  <button
                    key={cat.id}
                    type="button"
                    onClick={() => toggleCategory(cat.id)}
                    className={`w-full flex items-center gap-2.5 px-3 py-2 hover:bg-white/[0.05] transition-colors text-left ${
                      isSelected ? "bg-white/[0.03]" : ""
                    }`}
                  >
                    <span
                      className="w-3 h-3 rounded-full shrink-0 ring-1 ring-white/10"
                      style={{ backgroundColor: cat.couleur }}
                    />
                    <span className="text-sm text-white/80 flex-1 truncate">
                      {cat.nom}
                    </span>
                    {isSelected && (
                      <Check size={14} className="text-orange-400 shrink-0" />
                    )}
                  </button>
                );
              })}
            </div>

            {selectedIds.length > 0 && (
              <div className="border-t border-white/[0.06] p-1.5">
                <button
                  type="button"
                  onClick={clearAll}
                  className="w-full text-xs text-white/40 hover:text-white/70 py-1.5 rounded-lg hover:bg-white/[0.05] transition-colors"
                >
                  Effacer les filtres
                </button>
              </div>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
