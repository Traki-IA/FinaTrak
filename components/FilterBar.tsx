"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { useCallback, useEffect, useRef, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  CalendarDays,
  SlidersHorizontal,
  Tag,
  X,
  ChevronDown,
  Check,
} from "lucide-react";
import type { TCategorie } from "@/types";

// ── Types ────────────────────────────────────────────────────────────────────

interface IFilterBarProps {
  categories: TCategorie[];
}

// ── Component ────────────────────────────────────────────────────────────────

export default function FilterBar({ categories }: IFilterBarProps) {
  const router = useRouter();
  const searchParams = useSearchParams();

  // Keep a ref to the latest searchParams so debounced callbacks never go stale
  const searchParamsRef = useRef(searchParams);
  useEffect(() => {
    searchParamsRef.current = searchParams;
  });

  // ── Read current filter values from URL ────────────────────────────────────

  const dateDebut = searchParams.get("dateDebut") ?? "";
  const dateFin = searchParams.get("dateFin") ?? "";
  const type = searchParams.get("type") ?? "all";
  const selectedCategories =
    searchParams.get("categories")?.split(",").filter(Boolean) ?? [];
  const montantMin = searchParams.get("montantMin") ?? "";
  const montantMax = searchParams.get("montantMax") ?? "";

  // ── Local state for debounced number inputs ────────────────────────────────

  const [localMin, setLocalMin] = useState(montantMin);
  const [localMax, setLocalMax] = useState(montantMax);

  // Sync URL → local when searchParams change externally (e.g. clear all)
  useEffect(() => setLocalMin(montantMin), [montantMin]);
  useEffect(() => setLocalMax(montantMax), [montantMax]);

  // ── Category dropdown state ────────────────────────────────────────────────

  const [catOpen, setCatOpen] = useState(false);
  const catRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!catOpen) return;
    function handleClick(e: MouseEvent) {
      if (catRef.current && !catRef.current.contains(e.target as Node)) {
        setCatOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, [catOpen]);

  // ── URL update helper ──────────────────────────────────────────────────────

  const updateParam = useCallback(
    (key: string, value: string) => {
      const params = new URLSearchParams(searchParamsRef.current.toString());
      if (value && value !== "all") {
        params.set(key, value);
      } else {
        params.delete(key);
      }
      router.replace(`?${params.toString()}`, { scroll: false });
    },
    [router]
  );

  // ── Debounced sync: local number inputs → URL ──────────────────────────────

  useEffect(() => {
    if (localMin === montantMin) return;
    const t = setTimeout(() => updateParam("montantMin", localMin), 400);
    return () => clearTimeout(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [localMin]);

  useEffect(() => {
    if (localMax === montantMax) return;
    const t = setTimeout(() => updateParam("montantMax", localMax), 400);
    return () => clearTimeout(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [localMax]);

  // ── Category toggle ────────────────────────────────────────────────────────

  const toggleCategory = useCallback(
    (catId: string) => {
      const current =
        searchParamsRef.current
          .get("categories")
          ?.split(",")
          .filter(Boolean) ?? [];
      const next = current.includes(catId)
        ? current.filter((id) => id !== catId)
        : [...current, catId];
      updateParam("categories", next.join(","));
    },
    [updateParam]
  );

  // ── Clear all filters ──────────────────────────────────────────────────────

  const clearAll = useCallback(() => {
    setLocalMin("");
    setLocalMax("");
    router.replace("?", { scroll: false });
  }, [router]);

  // ── Active filter count ────────────────────────────────────────────────────

  const activeCount = [
    dateDebut,
    dateFin,
    type !== "all" ? type : "",
    selectedCategories.length > 0 ? "yes" : "",
    montantMin,
    montantMax,
  ].filter(Boolean).length;

  // ── Styles ─────────────────────────────────────────────────────────────────

  const inputClass =
    "bg-white/[0.05] border border-white/[0.1] text-white text-sm rounded-xl px-3 py-2 outline-none focus:border-orange-500/50 transition-colors";

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ delay: 0.1, duration: 0.3 }}
      className="flex flex-wrap gap-2 sm:gap-3 items-center mb-5"
    >
      {/* ── Période ── */}
      <div className="flex items-center gap-1.5">
        <CalendarDays size={14} className="text-white/40 shrink-0" />
        <input
          type="date"
          value={dateDebut}
          onChange={(e) => updateParam("dateDebut", e.target.value)}
          className={inputClass}
          style={{ colorScheme: "dark" }}
        />
        <span className="text-white/30 text-xs">→</span>
        <input
          type="date"
          value={dateFin}
          onChange={(e) => updateParam("dateFin", e.target.value)}
          className={inputClass}
          style={{ colorScheme: "dark" }}
        />
      </div>

      {/* ── Type ── */}
      <select
        value={type}
        onChange={(e) => updateParam("type", e.target.value)}
        className={`${inputClass} cursor-pointer`}
        style={{ colorScheme: "dark" }}
      >
        <option value="all" className="bg-[#0f0f1a]">
          Tous types
        </option>
        <option value="revenu" className="bg-[#0f0f1a]">
          Revenus
        </option>
        <option value="depense" className="bg-[#0f0f1a]">
          Dépenses
        </option>
      </select>

      {/* ── Catégories (multi-select) ── */}
      <div className="relative" ref={catRef}>
        <button
          type="button"
          onClick={() => setCatOpen((v) => !v)}
          className={`${inputClass} flex items-center gap-2 cursor-pointer ${
            selectedCategories.length > 0 ? "border-orange-500/50" : ""
          }`}
        >
          <Tag size={14} className="text-white/40" />
          <span>
            {selectedCategories.length === 0
              ? "Catégories"
              : `${selectedCategories.length} sél.`}
          </span>
          <ChevronDown
            size={14}
            className={`text-white/40 transition-transform ${
              catOpen ? "rotate-180" : ""
            }`}
          />
        </button>

        <AnimatePresence>
          {catOpen && (
            <motion.div
              initial={{ opacity: 0, y: -4 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -4 }}
              transition={{ duration: 0.15 }}
              className="absolute top-full mt-1 left-0 z-50 w-56 bg-[#1a1a2e] border border-white/[0.1] rounded-xl shadow-xl overflow-hidden"
            >
              <div className="max-h-56 overflow-y-auto py-1">
                {categories.map((cat) => {
                  const isSelected = selectedCategories.includes(cat.id);
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
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* ── Montant min / max ── */}
      <div className="flex items-center gap-1.5">
        <SlidersHorizontal size={14} className="text-white/40 shrink-0" />
        <input
          type="number"
          value={localMin}
          onChange={(e) => setLocalMin(e.target.value)}
          placeholder="Min €"
          min="0"
          step="0.01"
          className={`${inputClass} w-24`}
          style={{ colorScheme: "dark" }}
        />
        <span className="text-white/30 text-xs">—</span>
        <input
          type="number"
          value={localMax}
          onChange={(e) => setLocalMax(e.target.value)}
          placeholder="Max €"
          min="0"
          step="0.01"
          className={`${inputClass} w-24`}
          style={{ colorScheme: "dark" }}
        />
      </div>

      {/* ── Réinitialiser ── */}
      {activeCount > 0 && (
        <motion.button
          initial={{ opacity: 0, scale: 0.8 }}
          animate={{ opacity: 1, scale: 1 }}
          type="button"
          onClick={clearAll}
          className="flex items-center gap-1 text-xs text-orange-400 hover:text-orange-300 transition-colors px-2 py-1.5 rounded-lg hover:bg-orange-500/10"
        >
          <X size={12} />
          Effacer ({activeCount})
        </motion.button>
      )}
    </motion.div>
  );
}
