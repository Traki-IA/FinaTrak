"use client";

import { useState, useMemo, useEffect } from "react";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import { Receipt, Plus } from "lucide-react";
import { toast } from "sonner";
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
      className={`relative inline-flex h-5 w-9 items-center rounded-full transition-colors flex-shrink-0 ${
        checked ? "bg-orange-500" : "bg-white/20"
      } disabled:opacity-50 disabled:cursor-not-allowed`}
    >
      <span
        className={`inline-block h-3.5 w-3.5 rounded-full shadow transition-transform ${
          checked ? "translate-x-[18px] bg-white" : "translate-x-[2px] bg-[var(--text2)]"
        }`}
      />
    </button>
  );
}

// ── Budget Row ────────────────────────────────────────────────────────────────

function BudgetRow({
  item,
  index,
  onEdit,
}: {
  item: TBudgetItemWithRelations;
  index: number;
  onEdit: (item: TBudgetItemWithRelations) => void;
}) {
  const router = useRouter();
  const [toggling, setToggling] = useState(false);

  async function handleToggle(actif: boolean) {
    setToggling(true);
    const result = await toggleBudgetItem(item.id, actif);
    setToggling(false);
    if ("error" in result) { toast.error(result.error); return; }
    router.refresh();
  }

  const couleur = item.categories?.couleur ?? "#94a3b8";
  const isAnnual = item.frequence === "annuel";
  const monthly = mensualise(item.montant, item.frequence);
  const annual = annualise(item.montant, item.frequence);
  const badgeBg = isAnnual ? "var(--green-bg, rgba(74,222,128,0.1))" : "var(--orange-bg, rgba(249,115,22,0.1))";
  const badgeColor = isAnnual ? "var(--green, #4ADE80)" : "var(--orange, #F97316)";
  const badgeLabel = isAnnual ? "annuel" : "mensuel";
  const mainValue = isAnnual ? formatEur(annual) : formatEur(monthly);
  const mainSuffix = isAnnual ? "/an" : "/mois";
  const subValue = isAnnual ? formatEur(monthly) : formatEur(annual);
  const subSuffix = isAnnual ? "/mois" : "/an";

  return (
    <motion.div
      layout
      exit={{ opacity: 0, x: -12 }}
      transition={{ duration: 0.15 }}
      onClick={() => onEdit(item)}
      className="flex items-center cursor-pointer"
      style={{
        padding: "8px 14px",
        gap: "9px",
        opacity: 1,
      }}
    >
      {/* Nom */}
      <div
        className="flex-1 min-w-0 text-[14px] font-[500] text-[var(--text)] truncate"
        style={{ whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}
      >
        {item.nom}
      </div>

      {/* Montants */}
      <div
        className="text-right flex-shrink-0 whitespace-nowrap"
      >
        <div
          className="text-[var(--text)] flex items-baseline justify-end"
          style={{ fontSize: 13, fontWeight: 500, letterSpacing: "-0.01em" }}
        >
          <span className="tabular-nums">{mainValue}</span>
          <span className="inline-block w-[34px] text-left text-[11px]">{mainSuffix}</span>
        </div>
        <div
          className="text-[var(--text3)] flex items-baseline justify-end"
          style={{ fontSize: 10 }}
        >
          <span className="tabular-nums">{subValue}</span>
          <span className="inline-block w-[34px] text-left text-[9px]">{subSuffix}</span>
        </div>
      </div>

      {/* Toggle */}
      <Toggle checked={item.actif} onChange={handleToggle} disabled={toggling} />
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
  let rowIndex = 0;

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
            {/* KPIs — card harmonisée */}
            <div className="mt-[8px] rounded-[14px] overflow-hidden" style={{ border: "1px solid var(--border)", background: "var(--bg2)" }}>
              {/* Header */}
              <div className="py-[2px] flex items-center justify-center" style={{ borderBottom: "1px solid var(--border)", background: "rgba(255,255,255,0.03)" }}>
                <span className="text-[10px] font-semibold text-[var(--text2)] uppercase tracking-[0.1em]">Budget</span>
              </div>
              {/* Colonnes */}
              <div className="flex">
                <div className="flex-1 text-center py-[8px] px-2 min-w-0" style={{ borderRight: "1px solid var(--border)" }}>
                  <div className="text-[10px] font-semibold text-[var(--text2)] uppercase tracking-[0.1em]">/ mois</div>
                  <div className="text-[17px] font-semibold text-[var(--text)] tracking-tight mt-[2px] tabular-nums truncate">
                    {formatEur(totalMensuel)}
                  </div>
                </div>
                <div className="flex-1 text-center py-[8px] px-2 min-w-0">
                  <div className="text-[10px] font-semibold text-[var(--text2)] uppercase tracking-[0.1em]">/ an</div>
                  <div className="text-[17px] font-semibold text-[var(--text)] tracking-tight mt-[2px] tabular-nums truncate">
                    {formatEur(totalAnnuel)}
                  </div>
                </div>
              </div>
            </div>

            {/* Liste groupée par catégorie */}
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
                  <div className="py-[2px] flex items-center justify-center" style={{ borderBottom: "1px solid var(--border)", background: "rgba(255,255,255,0.03)" }}>
                    <span className="text-[10px] font-semibold text-[var(--text2)] uppercase tracking-[0.1em]">{cat}</span>
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
