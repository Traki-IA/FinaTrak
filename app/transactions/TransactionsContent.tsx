"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Plus, Pencil, Trash2, Check, X } from "lucide-react";
import { toast } from "sonner";
import { useRouter, useSearchParams } from "next/navigation";
import TransactionModal from "./TransactionModal";
import FilterBar from "@/components/FilterBar";
import { deleteTransaction } from "./actions";
import { formatEur } from "@/lib/format";
import type { TTransactionWithCategorie, TCategorie, TObjectif, TBudgetItem } from "@/types";

// ── Helpers ──────────────────────────────────────────────────────────────────

function formatDate(dateStr: string): string {
  return new Date(dateStr).toLocaleDateString("fr-FR");
}

// ── Transaction Card (mobile) ─────────────────────────────────────────────────

function TransactionCard({
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
  const initiale = (
    transaction.categories?.nom ??
    transaction.description ??
    "?"
  )[0].toUpperCase();
  const isConfirming = confirmingDeleteId === transaction.id;

  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -8 }}
      transition={{ duration: 0.2, delay: Math.min(index * 0.025, 0.3) }}
      className="flex items-center gap-2.5 p-3 border-b border-white/[0.04] last:border-0"
    >
      <span
        className="w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold shrink-0"
        style={{ background: `${couleur}18`, color: couleur }}
      >
        {initiale}
      </span>

      <div className="flex-1 min-w-0">
        <p className="text-sm font-medium text-white truncate">
          {transaction.description ?? (
            <span className="text-white/25 italic">—</span>
          )}
        </p>
        <div className="flex items-center gap-1.5 mt-0.5 flex-wrap">
          <span className="text-xs text-white/35">
            {formatDate(transaction.date)}
          </span>
          {transaction.categories && (
            <span
              className="text-xs px-1.5 py-0.5 rounded-md font-medium"
              style={{
                backgroundColor: `${couleur}20`,
                color: couleur,
              }}
            >
              {transaction.categories.nom}
            </span>
          )}
          <span
            className={`text-xs px-1.5 py-0.5 rounded-md font-medium ${
              isRevenu
                ? "bg-emerald-500/10 text-emerald-400"
                : "bg-red-500/10 text-red-400"
            }`}
          >
            {isRevenu ? "Revenu" : "Dépense"}
          </span>
        </div>
      </div>

      <div className="flex items-center gap-1.5 shrink-0">
        <span
          className={`text-sm font-semibold tabular-nums whitespace-nowrap ${
            isRevenu ? "text-emerald-400" : "text-red-400"
          }`}
        >
          {isRevenu ? "+" : "−"}
          {formatEur(transaction.montant)}
        </span>

        {isConfirming ? (
          <>
            <button
              onClick={() => onDeleteConfirm(transaction.id)}
              className="p-1.5 rounded-lg bg-red-500/15 text-red-400 hover:bg-red-500/25 transition-colors"
              title="Confirmer la suppression"
            >
              <Check size={13} />
            </button>
            <button
              onClick={onDeleteCancel}
              className="p-1.5 rounded-lg bg-white/[0.05] text-white/40 hover:text-white hover:bg-white/[0.1] transition-colors"
              title="Annuler"
            >
              <X size={13} />
            </button>
          </>
        ) : (
          <>
            <button
              onClick={() => onEdit(transaction)}
              className="p-1.5 rounded-lg text-white/30 hover:text-white hover:bg-white/[0.07] transition-colors"
              title="Modifier"
            >
              <Pencil size={13} />
            </button>
            <button
              onClick={() => onDeleteRequest(transaction.id)}
              className="p-1.5 rounded-lg text-white/30 hover:text-red-400 hover:bg-red-500/[0.08] transition-colors"
              title="Supprimer"
            >
              <Trash2 size={13} />
            </button>
          </>
        )}
      </div>
    </motion.div>
  );
}

// ── Transaction Row (desktop table) ───────────────────────────────────────────

function TransactionRow({
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
  const isConfirming = confirmingDeleteId === transaction.id;

  return (
    <motion.tr
      layout
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -8 }}
      transition={{ duration: 0.2, delay: Math.min(index * 0.025, 0.3) }}
      className="border-b border-white/[0.04] hover:bg-white/[0.025] transition-colors group"
    >
      {/* Date */}
      <td className="px-4 py-3 text-white/55 text-sm whitespace-nowrap">
        {formatDate(transaction.date)}
      </td>

      {/* Description */}
      <td className="px-4 py-3 text-white text-sm max-w-[200px] truncate">
        {transaction.description ?? (
          <span className="text-white/25 italic">—</span>
        )}
      </td>

      {/* Catégorie */}
      <td className="px-4 py-3">
        {transaction.categories ? (
          <span
            className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-medium"
            style={{
              backgroundColor: `${transaction.categories.couleur}20`,
              color: transaction.categories.couleur,
            }}
          >
            <span
              className="w-1.5 h-1.5 rounded-full flex-shrink-0"
              style={{ backgroundColor: transaction.categories.couleur }}
            />
            {transaction.categories.nom}
          </span>
        ) : (
          <span className="text-white/25 text-sm">—</span>
        )}
      </td>

      {/* Type */}
      <td className="px-4 py-3">
        <span
          className={`inline-flex px-2.5 py-1 rounded-lg text-xs font-medium ${
            isRevenu
              ? "bg-emerald-500/10 text-emerald-400"
              : "bg-red-500/10 text-red-400"
          }`}
        >
          {isRevenu ? "Revenu" : "Dépense"}
        </span>
      </td>

      {/* Montant */}
      <td
        className={`px-4 py-3 text-right text-sm font-semibold whitespace-nowrap ${
          isRevenu ? "text-emerald-400" : "text-red-400"
        }`}
      >
        {isRevenu ? "+" : "−"}
        {formatEur(transaction.montant)}
      </td>

      {/* Actions */}
      <td className="px-4 py-4 text-right whitespace-nowrap">
        {isConfirming ? (
          <div className="flex items-center justify-end gap-1.5">
            <span className="text-xs text-white/40 mr-1">Supprimer ?</span>
            <button
              onClick={() => onDeleteConfirm(transaction.id)}
              className="p-1.5 rounded-lg bg-red-500/15 text-red-400 hover:bg-red-500/25 transition-colors"
              title="Confirmer"
            >
              <Check size={13} />
            </button>
            <button
              onClick={onDeleteCancel}
              className="p-1.5 rounded-lg bg-white/[0.05] text-white/40 hover:text-white hover:bg-white/[0.1] transition-colors"
              title="Annuler"
            >
              <X size={13} />
            </button>
          </div>
        ) : (
          <div className="flex items-center justify-end gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
            <button
              onClick={() => onEdit(transaction)}
              className="p-1.5 rounded-lg text-white/40 hover:text-white hover:bg-white/[0.07] transition-colors"
              title="Modifier"
            >
              <Pencil size={13} />
            </button>
            <button
              onClick={() => onDeleteRequest(transaction.id)}
              className="p-1.5 rounded-lg text-white/40 hover:text-red-400 hover:bg-red-500/[0.08] transition-colors"
              title="Supprimer"
            >
              <Trash2 size={13} />
            </button>
          </div>
        )}
      </td>
    </motion.tr>
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
  const [confirmingDeleteId, setConfirmingDeleteId] = useState<string | null>(
    null
  );

  // Les transactions sont déjà filtrées côté serveur via searchParams
  const totalFiltre = transactions.reduce(
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
    <main className="min-h-screen bg-background p-4 sm:p-6 md:p-8">
      {/* ── Header ── */}
      <motion.div
        initial={{ opacity: 0, y: -16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3 }}
        className="flex items-start justify-between mb-6 sm:mb-8"
      >
        <div>
          <h1 className="text-2xl font-bold text-white">Transactions</h1>
          <p className="text-white/40 text-sm mt-1">
            {transactions.length} transaction{transactions.length !== 1 ? "s" : ""}
            {searchParams.toString() ? " filtrées" : ""}
          </p>
        </div>

        <motion.button
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.97 }}
          onClick={openAddModal}
          className="flex items-center gap-2 bg-orange-500 hover:bg-orange-600 text-white px-4 py-2.5 rounded-xl font-medium text-sm transition-colors"
        >
          <Plus size={16} />
          <span className="hidden sm:inline">Ajouter</span>
          <span className="sm:hidden">+</span>
        </motion.button>
      </motion.div>

      {/* ── Filters ── */}
      <FilterBar categories={categories} />

      {/* ── Solde filtré ── */}
      {transactions.length > 0 && (
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          className="flex items-center mb-4"
        >
          <span className="text-white/40 text-sm mr-2">Solde :</span>
          <span
            className={`text-sm font-semibold ${
              totalFiltre >= 0 ? "text-emerald-400" : "text-red-400"
            }`}
          >
            {totalFiltre >= 0 ? "+" : ""}
            {formatEur(totalFiltre)}
          </span>
        </motion.div>
      )}

      {/* ── Mobile Cards (hidden on md+) ── */}
      <motion.div
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.15, duration: 0.3 }}
        className="md:hidden bg-white/[0.04] border border-white/[0.07] rounded-2xl overflow-hidden"
      >
        <AnimatePresence mode="popLayout">
          {transactions.length === 0 ? (
            <motion.p
              key="empty"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="text-center text-white/30 text-sm py-16"
            >
              Aucune transaction trouvée
            </motion.p>
          ) : (
            transactions.map((t, i) => (
              <TransactionCard
                key={t.id}
                transaction={t}
                index={i}
                confirmingDeleteId={confirmingDeleteId}
                onEdit={openEditModal}
                onDeleteRequest={setConfirmingDeleteId}
                onDeleteConfirm={handleDeleteConfirm}
                onDeleteCancel={() => setConfirmingDeleteId(null)}
              />
            ))
          )}
        </AnimatePresence>
      </motion.div>

      {/* ── Desktop Table (hidden on mobile) ── */}
      <motion.div
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.15, duration: 0.3 }}
        className="hidden md:block bg-white/[0.04] border border-white/[0.07] rounded-2xl overflow-hidden"
      >
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-white/[0.07]">
                {["Date", "Description", "Catégorie", "Type", "Montant", ""].map(
                  (col, i) => (
                    <th
                      key={i}
                      className={`text-white/35 text-xs font-medium px-4 py-3 uppercase tracking-wider ${
                        col === "Montant" ? "text-right" : "text-left"
                      } ${col === "" ? "px-4 w-24" : ""}`}
                    >
                      {col}
                    </th>
                  )
                )}
              </tr>
            </thead>

            <tbody>
              <AnimatePresence mode="popLayout">
                {transactions.length === 0 ? (
                  <motion.tr
                    key="empty"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                  >
                    <td
                      colSpan={6}
                      className="text-center text-white/30 text-sm py-20"
                    >
                      Aucune transaction trouvée
                    </td>
                  </motion.tr>
                ) : (
                  transactions.map((t, i) => (
                    <TransactionRow
                      key={t.id}
                      transaction={t}
                      index={i}
                      confirmingDeleteId={confirmingDeleteId}
                      onEdit={openEditModal}
                      onDeleteRequest={setConfirmingDeleteId}
                      onDeleteConfirm={handleDeleteConfirm}
                      onDeleteCancel={() => setConfirmingDeleteId(null)}
                    />
                  ))
                )}
              </AnimatePresence>
            </tbody>
          </table>
        </div>
      </motion.div>

      {/* ── Modal ── */}
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
    </main>
  );
}
