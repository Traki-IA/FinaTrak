"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { SlidersHorizontal } from "lucide-react";
import { toast } from "sonner";
import { useRouter, useSearchParams } from "next/navigation";
import TransactionModal from "./TransactionModal";
import Shell from "@/components/layout/Shell";
import FilterBar from "@/components/FilterBar";
import TabBar from "@/components/ui/TabBar";
import Fab from "@/components/ui/Fab";
import { deleteTransaction } from "./actions";
import { formatEur } from "@/lib/format";
import type { TTransactionWithCategorie, TCategorie, TObjectif, TBudgetItem } from "@/types";

// ── Helpers ──────────────────────────────────────────────────────────────────

function formatDate(dateStr: string): string {
  return new Date(dateStr).toLocaleDateString("fr-FR", { day: "2-digit", month: "2-digit", year: "numeric" });
}

type TTypeFilter = "all" | "revenu" | "depense";
const TYPE_TABS: { key: TTypeFilter; label: string }[] = [
  { key: "all", label: "Tout" },
  { key: "revenu", label: "Revenus" },
  { key: "depense", label: "Dépenses" },
];

function groupByDate(transactions: TTransactionWithCategorie[]): { label: string; items: TTransactionWithCategorie[] }[] {
  const now = new Date();
  const today = now.toDateString();
  const yesterday = new Date(now.getFullYear(), now.getMonth(), now.getDate() - 1).toDateString();
  const weekAgo = new Date(now.getFullYear(), now.getMonth(), now.getDate() - 7).getTime();

  const groups: Record<string, TTransactionWithCategorie[]> = {};
  const order = ["Aujourd'hui", "Hier", "Cette semaine", "Plus ancien"];

  for (const tx of transactions) {
    const d = new Date(tx.date);
    let label: string;
    if (d.toDateString() === today) label = "Aujourd'hui";
    else if (d.toDateString() === yesterday) label = "Hier";
    else if (d.getTime() >= weekAgo) label = "Cette semaine";
    else label = "Plus ancien";

    if (!groups[label]) groups[label] = [];
    groups[label].push(tx);
  }

  return order.filter((l) => groups[l]?.length).map((l) => ({ label: l, items: groups[l] }));
}

// ── Transaction Row (Pulse Flat) ──────────────────────────────────────────────

function MobileTxRow({
  transaction,
  index,
  isActive,
  confirmingDeleteId,
  onEdit,
  onDeleteRequest,
  onDeleteConfirm,
  onDeleteCancel,
  onRowTap,
}: {
  transaction: TTransactionWithCategorie;
  index: number;
  isActive: boolean;
  confirmingDeleteId: string | null;
  onEdit: (t: TTransactionWithCategorie) => void;
  onDeleteRequest: (id: string) => void;
  onDeleteConfirm: (id: string) => void;
  onDeleteCancel: () => void;
  onRowTap: () => void;
}) {
  const isRevenu = transaction.type === "revenu";
  const couleur = transaction.categories?.couleur ?? "#94a3b8";
  const isConfirming = confirmingDeleteId === transaction.id;

  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -8 }}
      transition={{ duration: 0.2, delay: Math.min(index * 0.02, 0.3) }}
      className="border-b border-white/[0.05] last:border-0"
    >
      {/* Ligne principale — tappable */}
      <div
        className="flex gap-3 py-3 cursor-pointer select-none"
        onClick={onRowTap}
      >
        {/* Dot coloré */}
        <div className="w-2.5 h-2.5 rounded-full shrink-0 mt-[6px]" style={{ background: couleur }} />

        {/* Contenu : gauche (nom + méta) | droite (montant) */}
        <div className="flex-1 min-w-0 flex items-start justify-between gap-3">
          <div className="min-w-0 flex-1">
            <p className="text-[17px] font-[600] text-white leading-tight truncate">
              {transaction.description ?? "—"}
            </p>
            <p className="text-[13px] mt-0.5 leading-none">
              <span className="text-white/40">{formatDate(transaction.date)}</span>
              <span className="text-white/25"> · </span>
              <span style={{ color: couleur }}>{transaction.categories?.nom ?? "—"}</span>
            </p>
          </div>
          <span
            className={`text-[17px] font-[800] tabular-nums tracking-tight shrink-0 ${
              isRevenu ? "text-emerald-400" : "text-red-400"
            }`}
          >
            {isRevenu ? "+" : "−"}{formatEur(transaction.montant)}
          </span>
        </div>
      </div>

      {/* Strip d'actions */}
      <AnimatePresence>
        {isActive && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.18, ease: "easeOut" }}
            className="overflow-hidden"
          >
            <div className="border-t flex gap-2 px-1 py-1.5" style={{ borderColor: "rgba(255,255,255,0.04)" }}>
              {isConfirming ? (
                <>
                  <button
                    onClick={() => onDeleteConfirm(transaction.id)}
                    className="rounded-[7px] px-3 py-[5px] text-[10px] font-[700] text-red-400"
                  >
                    ✓ Confirmer la suppression
                  </button>
                  <button
                    onClick={onDeleteCancel}
                    className="rounded-[7px] px-3 py-[5px] text-[10px] font-[700]"
                    style={{ color: "rgba(255,255,255,0.35)" }}
                  >
                    ✕ Annuler
                  </button>
                </>
              ) : (
                <>
                  <button
                    onClick={() => { onEdit(transaction); onRowTap(); }}
                    className="rounded-[7px] px-3 py-[5px] text-[10px] font-[700]"
                    style={{ color: "rgba(255,255,255,0.35)" }}
                  >
                    ✎ Modifier
                  </button>
                  <button
                    onClick={() => onDeleteRequest(transaction.id)}
                    className="rounded-[7px] px-3 py-[5px] text-[10px] font-[700]"
                    style={{ color: "rgba(239,68,68,0.45)" }}
                  >
                    ✕ Supprimer
                  </button>
                </>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}

// ── Shared props ──────────────────────────────────────────────────────────────

interface ISharedProps {
  filtered: TTransactionWithCategorie[];
  categories: TCategorie[];
  typeFilter: TTypeFilter;
  setTypeFilter: (v: TTypeFilter) => void;
  totalFiltre: number;
  activeRowId: string | null;
  confirmingDeleteId: string | null;
  onEdit: (t: TTransactionWithCategorie) => void;
  onDeleteRequest: (id: string) => void;
  onDeleteConfirm: (id: string) => void;
  onDeleteCancel: () => void;
  onRowTap: (id: string) => void;
  searchParams: ReturnType<typeof useSearchParams>;
}

// ── Transactions ───────────────────────────────────────────────────────────────

function Transactions({
  filtered,
  categories,
  typeFilter,
  setTypeFilter,
  totalFiltre,
  activeRowId,
  confirmingDeleteId,
  onEdit,
  onDeleteRequest,
  onDeleteConfirm,
  onDeleteCancel,
  onRowTap,
  searchParams,
}: ISharedProps) {
  const [filterOpen, setFilterOpen] = useState(false);
  const grouped = groupByDate(filtered);
  let rowIndex = 0;

  return (
    <Shell>
      {/* Header */}
      <div className="flex items-center justify-between mb-0">
        <div>
          <p className="text-[13px] text-white/55 uppercase tracking-[0.14em] font-semibold">Transactions</p>
          <p className="text-[14px] text-white/50 mt-0.5">
            {filtered.length} opération{filtered.length !== 1 ? "s" : ""}
            {searchParams.toString() ? " · filtrées" : ""}
          </p>
        </div>
        <div className="flex items-center gap-2">
          <span
            className={`text-[18px] font-[800] ${
              totalFiltre >= 0 ? "text-emerald-400" : "text-red-400"
            }`}
          >
            {totalFiltre >= 0 ? "+" : ""}
            {totalFiltre.toFixed(0)} €
          </span>
          <button
            onClick={() => setFilterOpen((v) => !v)}
            className={`p-1.5 rounded-lg transition-colors ${
              filterOpen
                ? "bg-orange-500/20 text-orange-400"
                : "bg-white/[0.05] text-white/40"
            }`}
          >
            <SlidersHorizontal size={14} />
          </button>
        </div>
      </div>

      <div className="border-b border-white/[0.05] mt-3 mb-0" />

      {/* Type tabs */}
      <TabBar tabs={TYPE_TABS} active={typeFilter} onChange={setTypeFilter} />

      {/* Filter bar (toggle) */}
      <AnimatePresence>
        {filterOpen && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="overflow-hidden"
          >
            <div className="py-3">
              <FilterBar categories={categories} />
            </div>
            <div className="border-b border-white/[0.05]" />
          </motion.div>
        )}
      </AnimatePresence>

      {/* Transactions grouped by date */}
      <div className="mt-2">
        <AnimatePresence mode="popLayout">
          {filtered.length === 0 ? (
            <motion.p
              key="empty"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="text-center text-white/50 text-[12px] py-12"
            >
              Aucune transaction
            </motion.p>
          ) : (
            grouped.map((group) => (
              <div key={group.label}>
                <p className="text-[11px] text-white/50 uppercase tracking-wider mt-3 mb-1">
                  {group.label}
                </p>
                {group.items.map((t) => {
                  const idx = rowIndex++;
                  return (
                    <MobileTxRow
                      key={t.id}
                      transaction={t}
                      index={idx}
                      isActive={activeRowId === t.id}
                      confirmingDeleteId={confirmingDeleteId}
                      onEdit={onEdit}
                      onDeleteRequest={onDeleteRequest}
                      onDeleteConfirm={onDeleteConfirm}
                      onDeleteCancel={onDeleteCancel}
                      onRowTap={() => onRowTap(t.id)}
                    />
                  );
                })}
              </div>
            ))
          )}
        </AnimatePresence>
      </div>
    </Shell>
  );
}

// ── Main Component ────────────────────────────────────────────────────────────

interface ITransactionsContentProps {
  transactions: TTransactionWithCategorie[];
  categories: TCategorie[];
  objectifs: TObjectif[];
  budgetItems: TBudgetItem[];
  compteId: string;
}

export default function TransactionsContent({
  transactions,
  categories,
  objectifs,
  budgetItems,
  compteId,
}: ITransactionsContentProps) {
  const router = useRouter();
  const searchParams = useSearchParams();

  const [modalOpen, setModalOpen] = useState(false);
  const [editingTransaction, setEditingTransaction] =
    useState<TTransactionWithCategorie | undefined>(undefined);
  const [confirmingDeleteId, setConfirmingDeleteId] = useState<string | null>(null);
  const [activeRowId, setActiveRowId] = useState<string | null>(null);
  const [typeFilter, setTypeFilter] = useState<TTypeFilter>("all");

  const filtered = typeFilter === "all"
    ? transactions
    : transactions.filter((t) => t.type === typeFilter);

  const totalFiltre = filtered.reduce(
    (acc, t) => acc + (t.type === "revenu" ? t.montant : -t.montant),
    0
  );

  function openAddModal() {
    setEditingTransaction(undefined);
    setModalOpen(true);
  }

  function openEditModal(transaction: TTransactionWithCategorie) {
    setEditingTransaction(transaction);
    setModalOpen(true);
  }

  function handleRowTap(id: string) {
    setActiveRowId((prev) => {
      if (prev === id) return null;
      if (confirmingDeleteId) setConfirmingDeleteId(null);
      return id;
    });
  }

  async function handleDeleteConfirm(id: string) {
    setConfirmingDeleteId(null);
    setActiveRowId(null);
    const result = await deleteTransaction(id);
    if ("error" in result) {
      toast.error(result.error);
    } else {
      toast.success("Transaction supprimée");
      router.refresh();
    }
  }

  const sharedProps: ISharedProps = {
    filtered,
    categories,
    typeFilter,
    setTypeFilter,
    totalFiltre,
    activeRowId,
    confirmingDeleteId,
    onEdit: openEditModal,
    onDeleteRequest: setConfirmingDeleteId,
    onDeleteConfirm: handleDeleteConfirm,
    onDeleteCancel: () => { setConfirmingDeleteId(null); setActiveRowId(null); },
    onRowTap: handleRowTap,
    searchParams,
  };

  return (
    <>
      <Transactions {...sharedProps} />

      {/* FAB — rendered once */}
      <Fab label="Transaction" onClick={openAddModal} />

      {/* Modal — rendered once */}
      <TransactionModal
        key={editingTransaction?.id ?? "new"}
        open={modalOpen}
        onOpenChange={setModalOpen}
        categories={categories}
        objectifs={objectifs}
        budgetItems={budgetItems}
        transaction={editingTransaction}
        compteId={compteId}
      />
    </>
  );
}
