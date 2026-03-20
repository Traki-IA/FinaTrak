"use client";

import { useState, useMemo, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Search, Plus, Calendar } from "lucide-react";
import { toast } from "sonner";
import { useRouter } from "next/navigation";
import TransactionModal from "./TransactionModal";
import Shell from "@/components/layout/Shell";
import LogoHeader from "@/components/ui/LogoHeader";
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

// ── Period filter ─────────────────────────────────────────────────────────────

type TPeriodFilter = "all" | "7j" | "1m" | "3m" | "6m" | "1a" | "custom";

const PERIOD_PRESETS: { key: TPeriodFilter; label: string }[] = [
  { key: "all",    label: "Tout" },
  { key: "7j",     label: "7 jours" },
  { key: "1m",     label: "Ce mois" },
  { key: "3m",     label: "3 mois" },
  { key: "6m",     label: "6 mois" },
  { key: "1a",     label: "1 an" },
  { key: "custom", label: "Personnalisé" },
];

function getPeriodLabel(period: TPeriodFilter): string {
  return PERIOD_PRESETS.find((p) => p.key === period)?.label ?? "Péri.";
}

function filterByPeriod(
  transactions: TTransactionWithCategorie[],
  period: TPeriodFilter,
  customFrom: string,
  customTo: string
): TTransactionWithCategorie[] {
  if (period === "all") return transactions;

  const now = new Date();
  let from: Date | null = null;
  let to: Date | null = null;

  switch (period) {
    case "7j": {
      from = new Date(now);
      from.setDate(from.getDate() - 7);
      break;
    }
    case "1m": {
      from = new Date(now.getFullYear(), now.getMonth(), 1);
      break;
    }
    case "3m": {
      from = new Date(now);
      from.setMonth(from.getMonth() - 3);
      break;
    }
    case "6m": {
      from = new Date(now);
      from.setMonth(from.getMonth() - 6);
      break;
    }
    case "1a": {
      from = new Date(now);
      from.setFullYear(from.getFullYear() - 1);
      break;
    }
    case "custom": {
      if (customFrom) from = new Date(customFrom + "T00:00:00");
      if (customTo)   to   = new Date(customTo   + "T23:59:59");
      break;
    }
  }

  return transactions.filter((t) => {
    const d = new Date(t.date + "T00:00:00");
    if (from && d < from) return false;
    if (to   && d > to)   return false;
    return true;
  });
}

// ── Type filter ───────────────────────────────────────────────────────────────

type TTypeFilter = "all" | "revenu" | "depense";

const TYPE_TABS: { key: TTypeFilter; label: string }[] = [
  { key: "all",     label: "Tout" },
  { key: "revenu",  label: "Rev." },
  { key: "depense", label: "Dép." },
];

// ── Period bottom sheet ───────────────────────────────────────────────────────

function PeriodSheet({
  open,
  onClose,
  activePeriod,
  activeFrom,
  activeTo,
  onApply,
}: {
  open: boolean;
  onClose: () => void;
  activePeriod: TPeriodFilter;
  activeFrom: string;
  activeTo: string;
  onApply: (period: TPeriodFilter, from: string, to: string) => void;
}) {
  const [pending, setPending] = useState<TPeriodFilter>(activePeriod);
  const [from, setFrom] = useState(activeFrom);
  const [to,   setTo]   = useState(activeTo);

  useEffect(() => {
    if (open) {
      setPending(activePeriod);
      setFrom(activeFrom);
      setTo(activeTo);
    }
  }, [open, activePeriod, activeFrom, activeTo]);

  function handleApply() {
    onApply(pending, from, to);
    onClose();
  }

  function handleReset() {
    onApply("all", "", "");
    onClose();
  }

  return (
    <AnimatePresence>
      {open && (
        <>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="fixed inset-0 bg-black/60 z-40"
            onClick={onClose}
          />

          {/* Sheet */}
          <motion.div
            initial={{ y: "100%" }}
            animate={{ y: 0 }}
            exit={{ y: "100%" }}
            transition={{ type: "spring", damping: 32, stiffness: 320 }}
            className="fixed bottom-0 left-0 right-0 z-50 rounded-t-[20px] p-5 pb-10"
            style={{ background: "var(--bg2)" }}
          >
            {/* Handle */}
            <div className="w-10 h-1 rounded-full bg-[var(--border2)] mx-auto mb-5" />

            {/* Title */}
            <h3 className="text-[17px] font-semibold text-[var(--text)] mb-4">
              Choisir une période
            </h3>

            {/* Presets */}
            <div className="flex flex-wrap gap-2 mb-4">
              {PERIOD_PRESETS.map((preset) => (
                <button
                  key={preset.key}
                  onClick={() => setPending(preset.key)}
                  className={`px-4 py-2 rounded-full border text-[13px] font-medium transition-all ${
                    pending === preset.key
                      ? "border-[var(--orange)] text-[var(--orange)] bg-[rgba(249,115,22,0.10)]"
                      : "border-[var(--border)] text-[var(--text2)] bg-transparent"
                  }`}
                >
                  {preset.label}
                </button>
              ))}
            </div>

            {/* Custom range */}
            <AnimatePresence>
              {pending === "custom" && (
                <motion.div
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: "auto" }}
                  exit={{ opacity: 0, height: 0 }}
                  transition={{ duration: 0.18 }}
                  className="overflow-hidden mb-4"
                >
                  <div className="flex gap-3 pt-1">
                    <div className="flex-1">
                      <label className="text-[10px] text-[var(--text3)] uppercase tracking-[0.08em] mb-1.5 block">
                        DU
                      </label>
                      <input
                        type="date"
                        value={from}
                        onChange={(e) => setFrom(e.target.value)}
                        className="w-full py-3 px-3 rounded-[10px] border text-[13px] outline-none transition-colors"
                        style={{
                          background: "var(--bg3)",
                          borderColor: "var(--border)",
                          color: "var(--text)",
                        }}
                      />
                    </div>
                    <div className="flex-1">
                      <label className="text-[10px] text-[var(--text3)] uppercase tracking-[0.08em] mb-1.5 block">
                        AU
                      </label>
                      <input
                        type="date"
                        value={to}
                        onChange={(e) => setTo(e.target.value)}
                        className="w-full py-3 px-3 rounded-[10px] border text-[13px] outline-none transition-colors"
                        style={{
                          background: "var(--bg3)",
                          borderColor: "var(--border)",
                          color: "var(--text)",
                        }}
                      />
                    </div>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>

            {/* Actions */}
            <div className="flex gap-3">
              <button
                onClick={handleReset}
                className="flex-1 py-3 rounded-[12px] border border-[var(--border)] text-[var(--text2)] text-[14px] font-medium"
              >
                Réinitialiser
              </button>
              <button
                onClick={handleApply}
                className="flex-1 py-3 rounded-[12px] text-white text-[14px] font-semibold"
                style={{ background: "var(--orange)" }}
              >
                Appliquer
              </button>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}

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
      {/* Ligne principale */}
      <div
        className="grid py-[10px] cursor-pointer select-none items-center gap-2"
        style={{ gridTemplateColumns: "54px 76px 1fr 68px" }}
        onClick={onRowTap}
      >
        <span className="text-[12px] text-[var(--text3)] tabular-nums whitespace-nowrap">
          {formatDate(transaction.date)}
        </span>
        <span
          className="text-[10px] font-medium text-center block overflow-hidden truncate"
          style={{ borderRadius: "20px", background: bgColor, border: `1px solid ${borderCat}`, color, padding: "2px 0" }}
        >
          {transaction.categories?.nom ?? "—"}
        </span>
        <span className="text-[13px] font-medium text-[var(--text)] truncate">
          {transaction.description ?? "—"}
        </span>
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
        <span className="text-[10px] text-[var(--text2)]">{fmt(total)} € total</span>
      </div>
      <div className="flex flex-col gap-[7px]">
        {sorted.map((cat) => {
          const pct = Math.round((cat.total / total) * 100);
          return (
            <div key={cat.nom} className="flex items-center gap-2">
              <span className="text-[10px] text-[var(--text2)] w-[70px] truncate">{cat.nom}</span>
              <div className="flex-1 h-[3px] bg-[var(--bg3)] rounded-[2px] overflow-hidden">
                <div className="h-full rounded-[2px] transition-all" style={{ width: `${pct}%`, background: cat.couleur }} />
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
  const [editingTransaction, setEditingTransaction] = useState<TTransactionWithCategorie | undefined>(undefined);
  const [confirmingDeleteId, setConfirmingDeleteId] = useState<string | null>(null);
  const [activeRowId, setActiveRowId] = useState<string | null>(null);
  const [typeFilter, setTypeFilter] = useState<TTypeFilter>("all");
  const [searchQuery, setSearchQuery] = useState("");

  // Period filter state
  const [periodFilter, setPeriodFilter] = useState<TPeriodFilter>("all");
  const [customFrom, setCustomFrom] = useState("");
  const [customTo,   setCustomTo]   = useState("");
  const [periodSheetOpen, setPeriodSheetOpen] = useState(false);

  const filtered = useMemo(() => {
    let result = filterByPeriod(transactions, periodFilter, customFrom, customTo);
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
  }, [transactions, typeFilter, searchQuery, periodFilter, customFrom, customTo]);

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

  function handlePeriodApply(period: TPeriodFilter, from: string, to: string) {
    setPeriodFilter(period);
    setCustomFrom(from);
    setCustomTo(to);
  }

  const isPeriodActive = periodFilter !== "all";
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
            <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-[var(--text3)]" />
            <input
              type="text"
              placeholder="Rechercher..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full py-2 pl-8 pr-3 bg-[var(--bg2)] rounded-[10px] border border-[var(--border)] text-[var(--text)] text-[12px] font-[inherit] outline-none transition-colors focus:border-[var(--orange)] placeholder:text-[var(--text2)]"
            />
          </div>
        </div>

        {/* Filter bar: période + type */}
        <div className="pb-2 flex gap-2">
          {/* Période button */}
          <button
            onClick={() => setPeriodSheetOpen(true)}
            className={`flex items-center gap-1.5 px-3 py-[5px] text-[11px] font-medium rounded-lg border transition-all whitespace-nowrap ${
              isPeriodActive
                ? "border-[var(--orange)] text-[var(--orange)] bg-[rgba(249,115,22,0.10)]"
                : "border-[var(--border)] text-[var(--text2)] bg-transparent"
            }`}
          >
            <Calendar size={11} />
            <span>{isPeriodActive ? getPeriodLabel(periodFilter) : "Péri."}</span>
          </button>

          {/* Type tabs */}
          {TYPE_TABS.map((tab) => (
            <button
              key={tab.key}
              onClick={() => setTypeFilter(tab.key)}
              className={`flex-1 py-[5px] text-[11px] font-medium cursor-pointer rounded-lg border transition-all bg-transparent ${
                typeFilter === tab.key
                  ? "border-[var(--orange)] text-[var(--orange)] bg-[rgba(249,115,22,0.10)]"
                  : "border-[var(--border)] text-[var(--text2)] hover:border-[var(--border2)] hover:text-[var(--text)]"
              }`}
            >
              {tab.label}
            </button>
          ))}
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

      {/* Period sheet */}
      <PeriodSheet
        open={periodSheetOpen}
        onClose={() => setPeriodSheetOpen(false)}
        activePeriod={periodFilter}
        activeFrom={customFrom}
        activeTo={customTo}
        onApply={handlePeriodApply}
      />

      {/* Transaction modal */}
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
