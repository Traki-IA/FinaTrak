"use client";

import { useState, useEffect } from "react";
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
  const catNom = item.categories?.nom ?? null;

  return (
    <motion.div
      layout
      exit={{ opacity: 0, x: -12 }}
      transition={{ duration: 0.15 }}
      onClick={() => onEdit(item)}
      className={`flex items-start gap-[10px] cursor-pointer px-[14px] py-[8px] ${!item.actif ? "opacity-40" : ""}`}
    >
      {/* Barre couleur catégorie */}
      <div className="w-[3px] self-stretch rounded-full flex-shrink-0" style={{ background: couleur }} />

      {/* Contenu — 2 lignes */}
      <div className="flex-1 min-w-0">
        {/* Ligne 1 : nom + montant mensuel + pill annuelle + toggle */}
        <div className="flex items-center gap-2">
          <span className="flex-1 text-[14px] font-[500] text-[var(--text)] truncate">{item.nom}</span>
          <div className="flex items-center gap-1.5 flex-shrink-0">
            <span className="text-[13px] font-[500] text-[var(--text)] tabular-nums">
              {formatEur(monthly)}<span className="text-[11px] text-[var(--text3)] font-normal">/mois</span>
            </span>
            {isAnnual && (
              <span
                className="text-[10px] font-medium px-[6px] py-[1px] rounded-full whitespace-nowrap"
                style={{ background: "rgba(255,255,255,0.07)", color: "var(--text3)" }}
              >
                ≈ {formatEur(item.montant)}/an
              </span>
            )}
          </div>
          <Toggle checked={item.actif} onChange={handleToggle} disabled={toggling} />
        </div>

        {/* Ligne 2 : badge catégorie */}
        <div className="flex items-center gap-1.5 mt-[3px]">
          {catNom ? (
            <span
              className="text-[10px] font-medium px-[7px] py-[1px] rounded-full"
              style={{
                background: `${couleur}20`,
                color: couleur,
              }}
            >
              {catNom}
            </span>
          ) : (
            <span className="text-[10px] text-[var(--text3)]">Sans catégorie</span>
          )}
        </div>
      </div>
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
            {/* KPIs — card harmonisée */}
            <div className="mt-[8px] rounded-[14px] overflow-hidden" style={{ border: "1px solid var(--border)", background: "var(--bg2)" }}>
              {/* Header */}
              <div className="py-[2px] flex items-center justify-center" style={{ borderBottom: "1px solid var(--border)", background: "rgba(255,255,255,0.06)" }}>
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

            {/* Liste — une seule carte */}
            <motion.div
              className="mt-[8px] rounded-[14px] overflow-hidden"
              style={{ border: "1px solid var(--border)", background: "var(--bg2)" }}
            >
              <AnimatePresence mode="popLayout">
                {localItems.map((item) => {
                  const idx = rowIndex++;
                  return (
                    <motion.div
                      key={item.id}
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      exit={{ opacity: 0, x: -12 }}
                      transition={{ duration: 0.15 }}
                      className="border-b border-[var(--border)] last:border-0"
                    >
                      <BudgetRow
                        item={item}
                        index={idx}
                        onEdit={openEditModal}
                      />
                    </motion.div>
                  );
                })}
              </AnimatePresence>
            </motion.div>
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
