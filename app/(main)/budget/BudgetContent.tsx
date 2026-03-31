"use client";

import { useState, useEffect, useMemo } from "react";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import { Receipt, Plus } from "lucide-react";
import { toast } from "@/lib/toast";
import Shell from "@/components/layout/Shell";
import LogoHeader from "@/components/ui/LogoHeader";
import BudgetModal from "./BudgetModal";
import { toggleBudgetItem, deleteBudgetItem } from "./actions";
import { formatEur } from "@/lib/format";
import type { TBudgetItemWithRelations, TCategorie, TObjectif } from "@/types";

// ── Helpers ───────────────────────────────────────────────────────────────────

function annualise(montant: number, frequence: "mensuel" | "annuel"): number {
  return frequence === "mensuel" ? montant * 12 : montant;
}

function mensualise(montant: number, frequence: "mensuel" | "annuel"): number {
  return frequence === "annuel" ? montant / 12 : montant;
}

// ── Toggle switch ─────────────────────────────────────────────────────────────

function Toggle({
  checked,
  onChange,
  disabled,
}: {
  checked: boolean;
  onChange: (v: boolean) => void;
  disabled?: boolean;
}) {
  return (
    <button
      type="button"
      disabled={disabled}
      onClick={(e) => { e.stopPropagation(); onChange(!checked); }}
      className={`relative inline-flex h-7 w-12 items-center rounded-full transition-colors flex-shrink-0 ${
        checked ? "bg-orange-500" : "bg-white/20"
      } disabled:opacity-50 disabled:cursor-not-allowed`}
    >
      <span
        className={`inline-block h-5 w-5 rounded-full shadow transition-transform ${
          checked ? "translate-x-[26px] bg-white" : "translate-x-[2px] bg-[var(--text2)]"
        }`}
      />
    </button>
  );
}

// ── Budget Row ────────────────────────────────────────────────────────────────

function BudgetRow({
  item,
  index,
  viewMode,
  onEdit,
}: {
  item: TBudgetItemWithRelations;
  index: number;
  viewMode: "mensuel" | "annuel";
  onEdit: (item: TBudgetItemWithRelations) => void;
}) {
  const router = useRouter();
  const [optimisticActif, setOptimisticActif] = useState(item.actif);

  async function handleToggle(actif: boolean) {
    setOptimisticActif(actif); // visuel immédiat
    const result = await toggleBudgetItem(item.id, actif);
    if ("error" in result) {
      setOptimisticActif(!actif); // revert si erreur
      toast.error(result.error);
      return;
    }
    router.refresh();
  }

  const couleur = item.categories?.couleur ?? "#94a3b8";
  const value = viewMode === "mensuel"
    ? mensualise(item.montant, item.frequence)
    : annualise(item.montant, item.frequence);
  const suffix = viewMode === "mensuel" ? "/mois" : "/an";

  return (
    <motion.div
      layout
      exit={{ opacity: 0, x: -12 }}
      transition={{ duration: 0.15 }}
      onClick={() => onEdit(item)}
      className={`flex items-center gap-[10px] cursor-pointer px-[14px] py-[7px] ${!optimisticActif ? "opacity-40" : ""}`}
    >
      {/* Barre couleur catégorie */}
      <div className="w-[3px] self-stretch rounded-full flex-shrink-0" style={{ background: couleur }} />

      {/* Contenu 2 lignes */}
      <div className="flex-1 min-w-0">
        <div className="text-[15px] font-[500] text-[var(--text)] truncate">{item.nom}</div>
        <div className="text-[15px] font-[500] text-[var(--text)] tabular-nums mt-[2px]">
          {formatEur(value)}<span className="text-[12px] text-[var(--text3)] font-normal">{suffix}</span>
        </div>
      </div>

      {/* Toggle centré verticalement sur les 2 lignes */}
      <Toggle checked={optimisticActif} onChange={handleToggle} />
    </motion.div>
  );
}

// ── Empty state ───────────────────────────────────────────────────────────────

function EmptyState({ onAdd }: { onAdd: () => void }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="flex flex-col items-center justify-center py-24 text-center px-6"
    >
      <div className="w-14 h-14 rounded-2xl bg-orange-500/10 flex items-center justify-center mb-4">
        <Receipt size={24} className="text-orange-400" />
      </div>
      <p className="text-[var(--text)] font-semibold mb-1">Aucune charge planifiée</p>
      <p className="text-[var(--text3)] text-[14px] mb-6">
        Ajoutez vos charges fixes pour visualiser votre budget
      </p>
      <button
        onClick={onAdd}
        className="flex items-center gap-2 bg-orange-500 hover:bg-orange-600 text-white px-5 py-2.5 rounded-xl font-medium text-sm transition-colors"
      >
        Ajouter une charge
      </button>
    </motion.div>
  );
}

// ── Composant principal ───────────────────────────────────────────────────────

interface IBudgetContentProps {
  items: TBudgetItemWithRelations[];
  categories: TCategorie[];
  objectifs: TObjectif[];
  compteId: string;
}

export default function BudgetContent({
  items: initialItems,
  categories,
  objectifs,
  compteId,
}: IBudgetContentProps) {
  const router = useRouter();

  const [modalOpen, setModalOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<TBudgetItemWithRelations | undefined>(undefined);
  const [localItems, setLocalItems] = useState(initialItems);
  const [viewMode, setViewMode] = useState<"mensuel" | "annuel">("mensuel");

  // Sync depuis le serveur
  // Sync depuis le serveur — clé string pour comparer les contenus (pas les références)
  const serverKey = initialItems.map((i) => `${i.id}:${i.actif}:${i.montant}`).join(",");
  useEffect(() => {
    setLocalItems(initialItems);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [serverKey]);

  // ── KPIs ─────────────────────────────────────────────────────────────────
  const actifs = localItems.filter((i) => i.actif);
  const totalMensuel = actifs.reduce((sum, i) => sum + mensualise(i.montant, i.frequence), 0);
  const totalAnnuel = actifs.reduce((sum, i) => sum + annualise(i.montant, i.frequence), 0);

  // ── Groupement par catégorie ──────────────────────────────────────────────
  const grouped = useMemo(() => {
    const map = new Map<string, TBudgetItemWithRelations[]>();
    for (const item of localItems) {
      const key = item.categories?.nom ?? "Sans catégorie";
      if (!map.has(key)) map.set(key, []);
      map.get(key)!.push(item);
    }
    return map;
  }, [localItems]);

  // ── Handlers ──────────────────────────────────────────────────────────────
  function openAddModal() {
    setEditingItem(undefined);
    setModalOpen(true);
  }

  function openEditModal(item: TBudgetItemWithRelations) {
    setEditingItem(item);
    setModalOpen(true);
  }

  async function handleDeleteFromModal(id: string) {
    setLocalItems((prev) => prev.filter((i) => i.id !== id));
    const result = await deleteBudgetItem(id);
    if ("error" in result) {
      toast.error(result.error);
      router.refresh();
      return;
    }
    toast.success("Charge supprimée");
    router.refresh();
  }

  // ── Render ────────────────────────────────────────────────────────────────
  let rowIndex = 0; // eslint-disable-line prefer-const

  return (
    <>
      <Shell>
        <LogoHeader
          rightSlot={
            <button
              onClick={openAddModal}
              className="w-[28px] h-[28px] rounded-lg bg-[var(--bg3)] border-none cursor-pointer flex items-center justify-center text-[var(--text2)]"
            >
              <Plus size={14} />
            </button>
          }
        />

        {localItems.length === 0 ? (
          <EmptyState onAdd={openAddModal} />
        ) : (
          <>
            {/* KPI + toggle vue */}
            <div className="mt-[8px] rounded-[14px] overflow-hidden" style={{ border: "1px solid var(--border)", background: "var(--bg2)" }}>
              <div className="px-4 pt-2 pb-2">
                {/* Ligne 1 : label + toggle */}
                <div className="flex items-center justify-between mb-1">
                  <span className="text-[11px] font-semibold text-[var(--text3)] uppercase tracking-[0.1em]">Budget total</span>
                  <div className="flex rounded-lg overflow-hidden border border-[var(--border)]">
                    {(["mensuel", "annuel"] as const).map((mode) => (
                      <button
                        key={mode}
                        type="button"
                        onClick={() => setViewMode(mode)}
                        className={`px-2.5 py-[3px] text-[11px] font-semibold transition-colors ${
                          viewMode === mode
                            ? "bg-orange-500 text-white"
                            : "text-[var(--text3)] hover:text-[var(--text)]"
                        }`}
                      >
                        {mode === "mensuel" ? "/mois" : "/an"}
                      </button>
                    ))}
                  </div>
                </div>
                {/* Ligne 2 : montant */}
                <div className="text-[32px] font-bold text-[var(--text)] tracking-tight tabular-nums leading-none">
                  {formatEur(viewMode === "mensuel" ? totalMensuel : totalAnnuel)}
                  <span className="text-[16px] font-normal text-[var(--text3)] ml-1.5">{viewMode === "mensuel" ? "/mois" : "/an"}</span>
                </div>
              </div>
            </div>

            {/* Cards groupées par catégorie */}
            <AnimatePresence mode="popLayout">
              {Array.from(grouped.entries()).map(([cat, items]) => (
                <motion.div
                  key={cat}
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  className="mt-[8px] rounded-[14px] overflow-hidden"
                  style={{ border: "1px solid var(--border)", background: "var(--bg2)" }}
                >
                  {/* En-tête catégorie */}
                  <div className="py-[4px] flex items-center justify-center" style={{ borderBottom: "1px solid var(--border)", background: "rgba(255,255,255,0.06)" }}>
                    <span className="text-[11px] font-semibold text-[var(--text2)] uppercase tracking-[0.1em]">{cat}</span>
                  </div>
                  {/* Rows */}
                  <div className="divide-y divide-[var(--border)]">
                    {items.map((item) => {
                      const idx = rowIndex++;
                      return (
                        <BudgetRow
                          key={item.id}
                          item={item}
                          index={idx}
                          viewMode={viewMode}
                          onEdit={openEditModal}
                        />
                      );
                    })}
                  </div>
                </motion.div>
              ))}
            </AnimatePresence>
          </>
        )}
      </Shell>

      {/* Modal */}
      <BudgetModal
        key={editingItem?.id ?? "new"}
        open={modalOpen}
        onOpenChange={setModalOpen}
        categories={categories}
        objectifs={objectifs}
        budgetItem={editingItem}
        compteId={compteId}
        onDelete={handleDeleteFromModal}
      />
    </>
  );
}
