"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Pencil, Trash2, Check, X } from "lucide-react";
import { toast } from "sonner";
import { useRouter, useSearchParams } from "next/navigation";
import TransactionModal from "./TransactionModal";
import Shell from "@/components/layout/Shell";
import FilterBar from "@/components/FilterBar";
import TabBar from "@/components/ui/TabBar";
import Fab from "@/components/ui/Fab";
import { deleteTransaction } from "./actions";
import { formatEur } from "@/lib/format";
import { useSidebar } from "@/components/SidebarContext";
import type { TTransactionWithCategorie, TCategorie, TObjectif, TBudgetItem } from "@/types";

// ── Helpers ──────────────────────────────────────────────────────────────────

function formatDate(dateStr: string): string {
  return new Date(dateStr).toLocaleDateString("fr-FR", { day: "numeric", month: "short" });
}

type TTypeFilter = "all" | "revenu" | "depense";
const TYPE_TABS: { key: TTypeFilter; label: string }[] = [
  { key: "all", label: "Tout" },
  { key: "revenu", label: "Revenus" },
  { key: "depense", label: "Dépenses" },
];

// ── Compact TxRow (used in both mobile and desktop grid) ─────────────────────

function TxRow({
  transaction,
  index,
  compact,
  confirmingDeleteId,
  onEdit,
  onDeleteRequest,
  onDeleteConfirm,
  onDeleteCancel,
}: {
  transaction: TTransactionWithCategorie;
  index: number;
  compact?: boolean;
  confirmingDeleteId: string | null;
  onEdit: (t: TTransactionWithCategorie) => void;
  onDeleteRequest: (id: string) => void;
  onDeleteConfirm: (id: string) => void;
  onDeleteCancel: () => void;
}) {
  const isRevenu = transaction.type === "revenu";
  const couleur = transaction.categories?.couleur ?? "#94a3b8";
  const initiale = (transaction.categories?.nom ?? transaction.description ?? "?")[0].toUpperCase();
  const isConfirming = confirmingDeleteId === transaction.id;

  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -8 }}
      transition={{ duration: 0.2, delay: Math.min(index * 0.02, 0.3) }}
      className={`flex items-center justify-between border-b border-white/[0.03] group ${
        compact ? "py-[7px] px-3" : "py-2.5 px-4"
      }`}
    >
      <div className="flex items-center gap-2 min-w-0">
        <span
          className={`rounded-full flex items-center justify-center font-bold shrink-0 ${
            compact ? "w-7 h-7 text-[11px]" : "w-8 h-8 text-[12px]"
          }`}
          style={{ background: `${couleur}18`, color: couleur }}
        >
          {initiale}
        </span>
        <div className="min-w-0">
          <p className={`font-semibold text-white leading-none truncate ${compact ? "text-[11px]" : "text-[12px]"}`}>
            {transaction.description ?? "—"}
          </p>
          <div className="flex items-center gap-1.5 mt-0.5">
            <span className="text-[9px] text-white/28">{formatDate(transaction.date)}</span>
            <span
              className="text-[9px] px-1.5 py-0.5 rounded font-bold"
              style={{ background: `${couleur}20`, color: couleur }}
            >
              {transaction.categories?.nom ?? "—"}
            </span>
          </div>
        </div>
      </div>

      <div className="flex items-center gap-1 shrink-0 ml-2">
        <span
          className={`font-extrabold tabular-nums tracking-tight ${
            compact ? "text-[11px]" : "text-[12px]"
          } ${isRevenu ? "text-emerald-400" : "text-white/60"}`}
        >
          {isRevenu ? "+" : "−"}
          {formatEur(transaction.montant)}
        </span>

        {isConfirming ? (
          <>
            <button
              onClick={() => onDeleteConfirm(transaction.id)}
              className="p-1 rounded-lg bg-red-500/15 text-red-400 hover:bg-red-500/25 transition-colors"
            >
              <Check size={12} />
            </button>
            <button
              onClick={onDeleteCancel}
              className="p-1 rounded-lg bg-white/[0.05] text-white/40 hover:text-white transition-colors"
            >
              <X size={12} />
            </button>
          </>
        ) : (
          <div className="flex gap-0.5 opacity-0 group-hover:opacity-100 transition-opacity">
            <button
              onClick={() => onEdit(transaction)}
              className="p-1 rounded-lg text-white/30 hover:text-white hover:bg-white/[0.07] transition-colors"
            >
              <Pencil size={12} />
            </button>
            <button
              onClick={() => onDeleteRequest(transaction.id)}
              className="p-1 rounded-lg text-white/30 hover:text-red-400 hover:bg-red-500/[0.08] transition-colors"
            >
              <Trash2 size={12} />
            </button>
          </div>
        )}
      </div>
    </motion.div>
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
  const { breakpoint } = useSidebar();
  const isDesktop = breakpoint === "desktop";

  const [modalOpen, setModalOpen] = useState(false);
  const [editingTransaction, setEditingTransaction] =
    useState<TTransactionWithCategorie | undefined>(undefined);
  const [confirmingDeleteId, setConfirmingDeleteId] = useState<string | null>(null);
  const [typeFilter, setTypeFilter] = useState<TTypeFilter>("all");

  // Apply local type filter on top of server-side filters
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

  async function handleDeleteConfirm(id: string) {
    setConfirmingDeleteId(null);
    const result = await deleteTransaction(id);
    if ("error" in result) {
      toast.error(result.error);
    } else {
      toast.success("Transaction supprimée");
      router.refresh();
    }
  }

  return (
    <Shell>
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: -8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3 }}
        className="flex items-center justify-between mb-0"
      >
        <div>
          <h1 className="text-[22px] font-black tracking-tight">Transactions</h1>
          <p className="text-[10px] text-white/28 mt-0.5">
            {filtered.length} opération{filtered.length !== 1 ? "s" : ""}
            {searchParams.toString() ? " · filtrées" : ""}
          </p>
        </div>
        <span
          className={`text-[13px] font-extrabold ${
            totalFiltre >= 0 ? "text-emerald-400" : "text-red-400"
          }`}
        >
          {totalFiltre >= 0 ? "+" : ""}
          {totalFiltre.toFixed(0)} €
        </span>
      </motion.div>

      <div className="h-px bg-white/[0.06] mt-3 mb-0" />

      {/* Filter tabs */}
      <TabBar tabs={TYPE_TABS} active={typeFilter} onChange={setTypeFilter} />

      {/* Advanced filters (collapsed on mobile) */}
      <div className="mt-3 mb-3">
        <FilterBar categories={categories} />
      </div>

      <div className="h-px bg-white/[0.06] mb-0" />

      {/* Transaction list — 2-col grid on desktop */}
      <div
        className={isDesktop ? "grid grid-cols-2" : ""}
        style={isDesktop ? { alignContent: "start" } : undefined}
      >
        <AnimatePresence mode="popLayout">
          {filtered.length === 0 ? (
            <motion.p
              key="empty"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="text-center text-white/30 text-[11px] py-12 col-span-2"
            >
              Aucune transaction
            </motion.p>
          ) : (
            filtered.map((t, i) => (
              <div
                key={t.id}
                className={isDesktop && i % 2 === 0 ? "border-r border-white/[0.03]" : ""}
              >
                <TxRow
                  transaction={t}
                  index={i}
                  compact={isDesktop}
                  confirmingDeleteId={confirmingDeleteId}
                  onEdit={openEditModal}
                  onDeleteRequest={setConfirmingDeleteId}
                  onDeleteConfirm={handleDeleteConfirm}
                  onDeleteCancel={() => setConfirmingDeleteId(null)}
                />
              </div>
            ))
          )}
        </AnimatePresence>
      </div>

      {/* FAB */}
      <Fab label="Transaction" onClick={openAddModal} />

      {/* Modal */}
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
    </Shell>
  );
}
