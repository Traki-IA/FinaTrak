"use client";

import { useState, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Search, Plus, Calendar } from "lucide-react";
import { toast } from "sonner";
import { useRouter } from "next/navigation";
import TransactionModal from "./TransactionModal";
import Shell from "@/components/layout/Shell";
import LogoHeader from "@/components/ui/LogoHeader";
import TabBar from "@/components/ui/TabBar";
import { deleteTransaction } from "./actions";
import type { TTransactionWithCategorie, TCategorie, TObjectif, TBudgetItem } from "@/types";

// ── Helpers ──────────────────────────────────────────────────────────────────

function fmt(n: number): string {
  return Math.abs(n).toLocaleString("fr-FR", { minimumFractionDigits: 0, maximumFractionDigits: 0 });
}

function formatDate(dateStr: string): string {
  const d = new Date(dateStr);
  const day = String(d.getDate()).padStart(2, "0");
  const month = String(d.getMonth() + 1).padStart(2, "0");
  const year = String(d.getFullYear()).slice(2);
  return `${day}/${month}/${year}`;
}

type TTypeFilter = "all" | "revenu" | "depense";
const TYPE_TABS: { key: TTypeFilter; label: string }[] = [
  { key: "all", label: "Tout" },
  { key: "revenu", label: "Revenus" },
  { key: "depense", label: "Dépenses" },
];

// ── Transaction Row (4 colonnes maquette) ────────────────────────────────────

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
  const color = isRevenu ? "var(--green)" : "var(--red)";
  const bgColor = isRevenu ? "var(--revenue-bg)" : "var(--expense-bg)";
  const borderCat = isRevenu ? "#1A4428" : "#4A1A1A";

  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -8 }}
      transition={{ duration: 0.2, delay: Math.min(index * 0.02, 0.3) }}
      className="border-b border-[var(--bg2)] last:border-0"
    >
      {/* Ligne principale — tappable */}
      <div
        className="grid py-[10px] cursor-pointer select-none items-center gap-2"
        style={{ gridTemplateColumns: "54px 76px 1fr 68px" }}
        onClick={onRowTap}
      >
        {/* Col 1: date */}
        <span className="text-[12px] text-[var(--text3)] tabular-nums whitespace-nowrap">
          {formatDate(transaction.date)}
        </span>

        {/* Col 2: badge catégorie */}
        <span
          className="text-[10px] font-medium text-center block overflow-hidden truncate"
          style={{
            borderRadius: "20px",
            background: bgColor,
            border: `1px solid ${borderCat}`,
            color: color,
            padding: "2px 0",
          }}
        >
          {transaction.categories?.nom ?? "—"}
        </span>

        {/* Col 3: nom */}
        <span className="text-[13px] font-medium text-[var(--text)] truncate">
          {transaction.description ?? "—"}
        </span>

        {/* Col 4: montant */}
        <span
          className="text-[13px] font-semibold tabular-nums text-right whitespace-nowrap"
          style={{ color, letterSpacing: "-0.01em" }}
        >
          {isRevenu ? "+" : "−"}{fmt(transaction.montant)} €
        </span>
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
            <div className="border-t border-[var(--bg2)] flex gap-2 px-1 py-1.5">
              {isConfirming ? (
                <>
                  <button
                    onClick={() => onDeleteConfirm(transaction.id)}
                    className="rounded-[7px] px-3 py-[5px] text-[10px] font-bold text-[var(--red)]"
                  >
                    Confirmer la suppression
                  </button>
                  <button
                    onClick={onDeleteCancel}
                    className="rounded-[7px] px-3 py-[5px] text-[10px] font-bold text-[var(--text3)]"
                  >
                    Annuler
                  </button>
                </>
              ) : (
                <>
                  <button
                    onClick={() => { onEdit(transaction); onRowTap(); }}
                    className="rounded-[7px] px-3 py-[5px] text-[10px] font-bold text-[var(--text3)]"
                  >
                    Modifier
                  </button>
                  <button
                    onClick={() => onDeleteRequest(transaction.id)}
                    className="rounded-[7px] px-3 py-[5px] text-[10px] font-bold"
                    style={{ color: "rgba(248,113,113,0.6)" }}
                  >
                    Supprimer
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

// ── Categories Chart ─────────────────────────────────────────────────────────

function CategoriesChart({ transactions }: { transactions: TTransactionWithCategorie[] }) {
  const depenses = transactions.filter((t) => t.type === "depense");
  const total = depenses.reduce((s, t) => s + t.montant, 0) || 1;

  const byCategory = depenses.reduce<Record<string, { nom: string; couleur: string; total: number }>>((acc, t) => {
    const cat = t.categories?.nom ?? "Autre";
    const couleur = t.categories?.couleur ?? "#94a3b8";
    if (!acc[cat]) acc[cat] = { nom: cat, couleur, total: 0 };
    acc[cat].total += t.montant;
    return acc;
  }, {});

  const sorted = Object.values(byCategory).sort((a, b) => b.total - a.total);

  if (sorted.length === 0) return null;

  return (
    <div className="py-[10px] px-0 bg-[var(--bg2)] mb-[2px]">
      <div className="flex justify-between mb-2 px-0">
        <span className="text-[10px] text-[var(--text2)] uppercase tracking-[0.07em]">Catégories</span>
        <span className="text-[10px] text-[var(--text2)]">{fmt(total)} €</span>
      </div>
      <div className="flex flex-col gap-[7px]">
        {sorted.map((cat) => {
          const pct = Math.round((cat.total / total) * 100);
          return (
            <div key={cat.nom} className="flex items-center gap-2">
              <span className="text-[10px] text-[var(--text2)] w-[70px] truncate">{cat.nom}</span>
              <div className="flex-1 h-[3px] bg-[var(--bg3)] rounded-[2px] overflow-hidden">
                <div
                  className="h-full rounded-[2px] transition-all"
                  style={{ width: `${pct}%`, background: cat.couleur }}
                />
              </div>
              <span className="text-[10px] text-[var(--text2)] w-[32px] text-right">{pct}%</span>
            </div>
          );
        })}
      </div>
    </div>
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

  const [modalOpen, setModalOpen] = useState(false);
  const [editingTransaction, setEditingTransaction] =
    useState<TTransactionWithCategorie | undefined>(undefined);
  const [confirmingDeleteId, setConfirmingDeleteId] = useState<string | null>(null);
  const [activeRowId, setActiveRowId] = useState<string | null>(null);
  const [typeFilter, setTypeFilter] = useState<TTypeFilter>("all");
  const [searchQuery, setSearchQuery] = useState("");

  const filtered = useMemo(() => {
    let result = transactions;
    if (typeFilter !== "all") {
      result = result.filter((t) => t.type === typeFilter);
    }
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      result = result.filter(
        (t) =>
          (t.description ?? "").toLowerCase().includes(q) ||
          (t.categories?.nom ?? "").toLowerCase().includes(q)
      );
    }
    return result;
  }, [transactions, typeFilter, searchQuery]);

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

        {/* Search */}
        <div className="py-2">
          <div className="relative">
            <Search
              size={14}
              className="absolute left-3 top-1/2 -translate-y-1/2 text-[var(--text3)]"
            />
            <input
              type="text"
              placeholder="Rechercher..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full py-2 pl-8 pr-3 bg-[var(--bg2)] rounded-[10px] border border-[#2d2d2d] text-[var(--text)] text-[12px] font-[inherit] outline-none transition-colors focus:border-[var(--orange)] placeholder:text-[var(--text2)]"
            />
          </div>
        </div>

        {/* Filter tabs */}
        <div className="pb-2">
          <TabBar tabs={TYPE_TABS} active={typeFilter} onChange={setTypeFilter} />
        </div>

        {/* Divider */}
        <div className="h-px bg-[var(--bg2)]" />

        {/* Categories chart */}
        <CategoriesChart transactions={filtered} />

        {/* Transaction list */}
        <div>
          <AnimatePresence mode="popLayout">
            {filtered.length === 0 ? (
              <motion.div
                key="empty"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="flex flex-col items-center justify-center py-8 gap-2"
              >
                <div className="w-11 h-11 rounded-[14px] bg-[var(--bg2)] flex items-center justify-center">
                  <Search size={20} className="text-[var(--text3)]" />
                </div>
                <span className="text-[13px] text-[var(--text3)]">
                  Aucune transaction trouvée
                </span>
              </motion.div>
            ) : (
              filtered.map((t) => {
                const idx = rowIndex++;
                return (
                  <MobileTxRow
                    key={t.id}
                    transaction={t}
                    index={idx}
                    isActive={activeRowId === t.id}
                    confirmingDeleteId={confirmingDeleteId}
                    onEdit={openEditModal}
                    onDeleteRequest={setConfirmingDeleteId}
                    onDeleteConfirm={handleDeleteConfirm}
                    onDeleteCancel={() => {
                      setConfirmingDeleteId(null);
                      setActiveRowId(null);
                    }}
                    onRowTap={() => handleRowTap(t.id)}
                  />
                );
              })
            )}
          </AnimatePresence>
        </div>
      </Shell>

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
