"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Pencil, Trash2, Check, X, SlidersHorizontal } from "lucide-react";
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
  return new Date(dateStr).toLocaleDateString("fr-FR", { day: "numeric", month: "short" });
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

// ── Desktop TxRow ─────────────────────────────────────────────────────────────

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
        compact ? "py-[7px] px-3" : "py-4 px-4"
      }`}
    >
      <div className="flex items-center gap-2 min-w-0">
        <span
          className={`rounded-full flex items-center justify-center font-bold shrink-0 ${
            compact ? "w-7 h-7 text-[11px]" : "w-10 h-10 text-[14px]"
          }`}
          style={{ background: `${couleur}18`, color: couleur }}
        >
          {initiale}
        </span>
        <div className="min-w-0">
          <p className={`text-white leading-none truncate ${compact ? "text-[11px] font-semibold" : "text-[15px] font-bold"}`}>
            {transaction.description ?? "—"}
          </p>
          <div className={`flex mt-0.5 ${compact ? "items-center gap-1.5" : "flex-col items-center gap-0.5 mt-1"}`}>
            <span className={`${compact ? "text-[9px]" : "text-[11px]"} text-white/28`}>{formatDate(transaction.date)}</span>
            <span
              className={`${compact ? "text-[9px]" : "text-[11px]"} px-1.5 py-0.5 rounded font-bold`}
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
            compact ? "text-[11px]" : "text-[15px]"
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

// ── Mobile TxRow (Pulse Flat) ─────────────────────────────────────────────────

function MobileTxRow({
  transaction,
  index,
  confirmingDeleteId,
  onEdit,
  onDeleteRequest,
  onDeleteConfirm,
  onDeleteCancel,
}: {
  transaction: TTransactionWithCategorie;
  index: number;
  confirmingDeleteId: string | null;
  onEdit: (t: TTransactionWithCategorie) => void;
  onDeleteRequest: (id: string) => void;
  onDeleteConfirm: (id: string) => void;
  onDeleteCancel: () => void;
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
      className="flex items-center justify-between py-4 border-b border-white/[0.05] last:border-0 group"
    >
      <div className="flex items-center gap-2 min-w-0">
        <div className="w-2.5 h-2.5 rounded-full shrink-0" style={{ background: couleur }} />
        <p className="text-[15px] font-[600] text-white leading-none truncate min-w-0">
          {transaction.description ?? "—"}
        </p>
        <span className="text-[11px] text-white/30 shrink-0">
          {transaction.categories?.nom ?? "—"}
        </span>
      </div>

      <div className="flex items-center gap-1 shrink-0 ml-3">
        <span
          className={`text-[15px] font-[800] tabular-nums tracking-tight ${
            isRevenu ? "text-emerald-400" : "text-red-400"
          }`}
        >
          {isRevenu ? "+" : "−"}{formatEur(transaction.montant)}
        </span>

        {isConfirming ? (
          <>
            <button
              onClick={() => onDeleteConfirm(transaction.id)}
              className="p-1 rounded-lg bg-red-500/15 text-red-400"
            >
              <Check size={12} />
            </button>
            <button
              onClick={onDeleteCancel}
              className="p-1 rounded-lg bg-white/[0.05] text-white/40"
            >
              <X size={12} />
            </button>
          </>
        ) : (
          <div className="flex gap-0.5 opacity-0 group-hover:opacity-100 transition-opacity">
            <button
              onClick={() => onEdit(transaction)}
              className="p-1 rounded-lg text-white/30 hover:text-white"
            >
              <Pencil size={12} />
            </button>
            <button
              onClick={() => onDeleteRequest(transaction.id)}
              className="p-1 rounded-lg text-white/30 hover:text-red-400"
            >
              <Trash2 size={12} />
            </button>
          </div>
        )}
      </div>
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
  confirmingDeleteId: string | null;
  onEdit: (t: TTransactionWithCategorie) => void;
  onDeleteRequest: (id: string) => void;
  onDeleteConfirm: (id: string) => void;
  onDeleteCancel: () => void;
  searchParams: ReturnType<typeof useSearchParams>;
}

// ── Desktop Transactions ──────────────────────────────────────────────────────

function DesktopTransactions({
  filtered,
  categories,
  typeFilter,
  setTypeFilter,
  totalFiltre,
  confirmingDeleteId,
  onEdit,
  onDeleteRequest,
  onDeleteConfirm,
  onDeleteCancel,
  searchParams,
}: ISharedProps) {
  return (
    <Shell>
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
      <TabBar tabs={TYPE_TABS} active={typeFilter} onChange={setTypeFilter} />

      <div className="mt-3 mb-3">
        <FilterBar categories={categories} />
      </div>

      <div className="h-px bg-white/[0.06] mb-0" />

      <div className="grid grid-cols-2" style={{ alignContent: "start" }}>
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
              <div key={t.id} className={i % 2 === 0 ? "border-r border-white/[0.03]" : ""}>
                <TxRow
                  transaction={t}
                  index={i}
                  compact
                  confirmingDeleteId={confirmingDeleteId}
                  onEdit={onEdit}
                  onDeleteRequest={onDeleteRequest}
                  onDeleteConfirm={onDeleteConfirm}
                  onDeleteCancel={onDeleteCancel}
                />
              </div>
            ))
          )}
        </AnimatePresence>
      </div>
    </Shell>
  );
}

// ── Mobile Transactions ───────────────────────────────────────────────────────

function MobileTransactions({
  filtered,
  categories,
  typeFilter,
  setTypeFilter,
  totalFiltre,
  confirmingDeleteId,
  onEdit,
  onDeleteRequest,
  onDeleteConfirm,
  onDeleteCancel,
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
          <p className="text-[11px] text-white/55 uppercase tracking-[0.14em] font-semibold">Transactions</p>
          <p className="text-[12px] text-white/50 mt-0.5">
            {filtered.length} opération{filtered.length !== 1 ? "s" : ""}
            {searchParams.toString() ? " · filtrées" : ""}
          </p>
        </div>
        <div className="flex items-center gap-2">
          <span
            className={`text-[16px] font-[800] ${
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
                      confirmingDeleteId={confirmingDeleteId}
                      onEdit={onEdit}
                      onDeleteRequest={onDeleteRequest}
                      onDeleteConfirm={onDeleteConfirm}
                      onDeleteCancel={onDeleteCancel}
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

  const sharedProps: ISharedProps = {
    filtered,
    categories,
    typeFilter,
    setTypeFilter,
    totalFiltre,
    confirmingDeleteId,
    onEdit: openEditModal,
    onDeleteRequest: setConfirmingDeleteId,
    onDeleteConfirm: handleDeleteConfirm,
    onDeleteCancel: () => setConfirmingDeleteId(null),
    searchParams,
  };

  return (
    <>
      <div className="lg:hidden">
        <MobileTransactions {...sharedProps} />
      </div>
      <div className="hidden lg:block">
        <DesktopTransactions {...sharedProps} />
      </div>

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
