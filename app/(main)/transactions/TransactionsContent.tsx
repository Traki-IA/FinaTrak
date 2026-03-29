"use client";

import { useState, useMemo, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Search, Plus, Calendar, Upload } from "lucide-react";
import { toast } from "sonner";
import { useRouter } from "next/navigation";
import TransactionModal from "./TransactionModal";
import ImportCSVModal from "./ImportCSVModal";
import Shell from "@/components/layout/Shell";
import LogoHeader from "@/components/ui/LogoHeader";
import { deleteTransaction } from "./actions";
import type { TTransactionWithCategorie, TCategorie, TObjectif, TBudgetItem } from "@/types";

// ── Helpers ──────────────────────────────────────────────────────────────────

const MOIS_COMPLETS = ["Janvier", "Février", "Mars", "Avril", "Mai", "Juin", "Juillet", "Août", "Septembre", "Octobre", "Novembre", "Décembre"];

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
      // 3 mois calendaires complets incluant le mois courant
      from = new Date(now.getFullYear(), now.getMonth() - 2, 1);
      break;
    }
    case "6m": {
      from = new Date(now.getFullYear(), now.getMonth() - 5, 1);
      break;
    }
    case "1a": {
      from = new Date(now.getFullYear(), now.getMonth() - 11, 1);
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
            <h3 className="text-[18px] font-semibold text-[var(--text)] mb-4">
              Choisir une période
            </h3>

            {/* Presets */}
            <div className="flex flex-wrap gap-2 mb-4">
              {PERIOD_PRESETS.map((preset) => (
                <button
                  key={preset.key}
                  onClick={() => setPending(preset.key)}
                  className={`px-4 py-2 rounded-full border text-[14px] font-medium transition-all ${
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
                      <label className="text-[11px] text-[var(--text3)] uppercase tracking-[0.08em] mb-1.5 block">
                        DU
                      </label>
                      <input
                        type="date"
                        value={from}
                        onChange={(e) => setFrom(e.target.value)}
                        className="w-full py-3 px-3 rounded-[10px] border text-[14px] outline-none transition-colors"
                        style={{
                          background: "var(--bg3)",
                          borderColor: "var(--border)",
                          color: "var(--text)",
                        }}
                      />
                    </div>
                    <div className="flex-1">
                      <label className="text-[11px] text-[var(--text3)] uppercase tracking-[0.08em] mb-1.5 block">
                        AU
                      </label>
                      <input
                        type="date"
                        value={to}
                        onChange={(e) => setTo(e.target.value)}
                        className="w-full py-3 px-3 rounded-[10px] border text-[14px] outline-none transition-colors"
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
                className="flex-1 py-3 rounded-[12px] border border-[var(--border)] text-[var(--text2)] text-[15px] font-medium"
              >
                Réinitialiser
              </button>
              <button
                onClick={handleApply}
                className="flex-1 py-3 rounded-[12px] text-white text-[15px] font-semibold"
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
  const catColor = transaction.categories?.couleur;
  const bgColor = catColor ? `${catColor}20` : (isRevenu ? "var(--revenue-bg)" : "var(--expense-bg)");
  const borderCat = catColor ? `${catColor}50` : (isRevenu ? "#1A4428" : "#4A1A1A");
  const catTextColor = catColor ?? color;

  return (
    <motion.div
      layout
      exit={{ opacity: 0, y: -4 }}
      transition={{ duration: 0.15 }}
      className="border-b border-[var(--bg2)] last:border-0"
    >
      {/* Ligne principale */}
      <div
        className="grid py-[10px] px-[14px] cursor-pointer select-none items-center gap-2"
        style={{ gridTemplateColumns: "54px 76px 1fr 68px" }}
        onClick={onRowTap}
      >
        <span className="text-[13px] text-[var(--text2)] tabular-nums whitespace-nowrap">
          {formatDate(transaction.date)}
        </span>
        <span
          className="text-[11px] font-medium text-center block overflow-hidden truncate"
          style={{ borderRadius: "20px", background: bgColor, border: `1px solid ${borderCat}`, color: catTextColor, padding: "2px 0" }}
        >
          {transaction.categories?.nom ?? "—"}
        </span>
        <span className="text-[14px] font-medium text-[var(--text)] truncate">
          {transaction.description ?? "—"}
        </span>
        <span
          className="text-[14px] font-semibold tabular-nums text-right whitespace-nowrap"
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
            <div className="border-t border-[var(--border)] flex gap-2 px-[14px] py-1.5">
              {isConfirming ? (
                <>
                  <button
                    onClick={() => onDeleteConfirm(transaction.id)}
                    className="rounded-[7px] px-3 py-[5px] text-[11px] font-bold text-[var(--red)]"
                  >
                    Confirmer la suppression
                  </button>
                  <button
                    onClick={onDeleteCancel}
                    className="rounded-[7px] px-3 py-[5px] text-[11px] font-bold text-[var(--text3)]"
                  >
                    Annuler
                  </button>
                </>
              ) : (
                <>
                  <button
                    onClick={() => { onEdit(transaction); onRowTap(); }}
                    className="rounded-[7px] px-3 py-[5px] text-[11px] font-bold text-[var(--text3)]"
                  >
                    Modifier
                  </button>
                  <button
                    onClick={() => onDeleteRequest(transaction.id)}
                    className="rounded-[7px] px-3 py-[5px] text-[11px] font-bold"
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
    <div className="mt-[8px] rounded-[14px] overflow-hidden" style={{ border: "1px solid var(--border)", background: "var(--bg2)" }}>
      <div className="flex justify-center py-[2px]" style={{ borderBottom: "1px solid var(--border)", background: "rgba(255,255,255,0.06)" }}>
        <span className="text-[10px] font-semibold text-[var(--text2)] uppercase tracking-[0.1em]">Catégories</span>
      </div>
      <div className="flex flex-col gap-[10px] px-[14px] py-[10px]">
        {sorted.map((cat) => {
          const pct = Math.round((cat.total / total) * 100);
          if (pct === 0) return null;
          return (
            <div key={cat.nom} className="flex items-center gap-[8px]">
              <span className="w-[7px] h-[7px] rounded-full flex-shrink-0" style={{ background: cat.couleur }} />
              <span className="text-[13px] text-[var(--text)] w-[80px] flex-shrink-0 truncate">{cat.nom}</span>
              <div className="flex-1 h-[5px] bg-[var(--bg3)] rounded-full overflow-hidden">
                <div className="h-full rounded-full transition-all" style={{ width: `${pct}%`, background: cat.couleur }} />
              </div>
              <span className="text-[11px] text-[var(--text2)] tabular-nums w-[52px] text-right flex-shrink-0">{fmt(cat.total)} €</span>
              <span className="text-[12px] font-semibold w-[28px] text-right tabular-nums flex-shrink-0" style={{ color: cat.couleur }}>{pct}%</span>
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
  initialFrom?: string;
  initialTo?: string;
}

export default function TransactionsContent({
  transactions,
  categories,
  objectifs,
  budgetItems,
  compteId,
  initialFrom,
  initialTo,
}: ITransactionsContentProps) {
  const router = useRouter();

  const [modalOpen, setModalOpen] = useState(false);
  const [importModalOpen, setImportModalOpen] = useState(false);
  const [editingTransaction, setEditingTransaction] = useState<TTransactionWithCategorie | undefined>(undefined);
  const [confirmingDeleteId, setConfirmingDeleteId] = useState<string | null>(null);
  const [activeRowId, setActiveRowId] = useState<string | null>(null);
  const [collapsedYears, setCollapsedYears] = useState<Set<string>>(new Set());
  const [typeFilter, setTypeFilter] = useState<TTypeFilter>("all");
  const [searchQuery, setSearchQuery] = useState("");

  // Period filter state — initialisé depuis les URL params si fournis
  const [periodFilter, setPeriodFilter] = useState<TPeriodFilter>(
    initialFrom && initialTo ? "custom" : "all"
  );
  const [customFrom, setCustomFrom] = useState(initialFrom ?? "");
  const [customTo,   setCustomTo]   = useState(initialTo   ?? "");
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

  // Group filtered transactions by year → month (desc)
  const byYearMonth = useMemo(() => {
    const groups: Record<string, Record<string, TTransactionWithCategorie[]>> = {};
    for (const t of filtered) {
      const [y, m] = t.date.split("-");
      if (!groups[y]) groups[y] = {};
      const monthKey = `${y}-${m}`;
      if (!groups[y][monthKey]) groups[y][monthKey] = [];
      groups[y][monthKey].push(t);
    }
    return groups;
  }, [filtered]);

  const years = useMemo(
    () => Object.keys(byYearMonth).sort((a, b) => Number(b) - Number(a)),
    [byYearMonth]
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

  function handlePeriodApply(period: TPeriodFilter, from: string, to: string) {
    setPeriodFilter(period);
    setCustomFrom(from);
    setCustomTo(to);
  }

  const isPeriodActive = periodFilter !== "all";

  return (
    <>
      <Shell>
        <LogoHeader
          rightSlot={
            <div className="flex items-center gap-1.5">
              <button
                onClick={() => setImportModalOpen(true)}
                className="w-[28px] h-[28px] rounded-lg bg-[var(--bg3)] border-none cursor-pointer flex items-center justify-center text-[var(--text2)]"
                title="Importer CSV"
              >
                <Upload size={13} />
              </button>
              <button
                onClick={openAddModal}
                className="w-[28px] h-[28px] rounded-lg bg-[var(--bg3)] border-none cursor-pointer flex items-center justify-center text-[var(--text2)]"
              >
                <Plus size={14} />
              </button>
            </div>
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
              className="w-full py-2 pl-8 pr-3 bg-[var(--bg2)] rounded-[10px] border border-[var(--border)] text-[var(--text)] text-[13px] font-[inherit] outline-none transition-colors focus:border-[var(--orange)] placeholder:text-[var(--text2)]"
            />
          </div>
        </div>

        {/* Filter bar: période + type */}
        <div className="pb-2 flex gap-2">
          {/* Période button */}
          <button
            onClick={() => setPeriodSheetOpen(true)}
            className={`flex-1 flex items-center justify-center gap-1.5 py-[5px] text-[12px] font-medium rounded-lg border transition-all whitespace-nowrap ${
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
              className={`flex-1 py-[5px] text-[12px] font-medium cursor-pointer rounded-lg border transition-all bg-transparent ${
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

        {/* Transaction list — grouped by year / month */}
        {filtered.length === 0 ? (
          <div className="mt-[8px] rounded-[14px] overflow-hidden flex flex-col items-center justify-center py-8 gap-2" style={{ border: "1px solid var(--border)", background: "var(--bg2)" }}>
            <div className="w-11 h-11 rounded-[14px] bg-[var(--bg3)] flex items-center justify-center">
              <Search size={20} className="text-[var(--text3)]" />
            </div>
            <span className="text-[14px] text-[var(--text3)]">Aucune transaction trouvée</span>
          </div>
        ) : (
          <div className="flex flex-col gap-[6px] pb-4 mt-[8px]">
            {years.map((year) => {
              const isYearCollapsed = collapsedYears.has(year);
              const months = Object.keys(byYearMonth[year]).sort((a, b) => b.localeCompare(a));
              return (
                <div key={year} className="flex flex-col gap-[6px]">
                  {/* Year separator */}
                  <div
                    className="flex items-center gap-[8px] px-[2px] pt-[6px] pb-[2px] cursor-pointer select-none"
                    onClick={() =>
                      setCollapsedYears((prev) => {
                        const next = new Set(prev);
                        if (next.has(year)) next.delete(year); else next.add(year);
                        return next;
                      })
                    }
                  >
                    <span className="text-[12px] font-semibold text-[var(--text3)] tracking-[0.06em] leading-none">{year}</span>
                    <div className="flex-1 h-[1px]" style={{ background: "var(--border)" }} />
                    <span
                      className="text-[var(--text3)] text-[11px] leading-none transition-transform duration-200 shrink-0"
                      style={{ transform: isYearCollapsed ? "rotate(-90deg)" : "rotate(0deg)" }}
                    >▼</span>
                  </div>

                  {!isYearCollapsed && months.map((monthKey) => {
                    const monthTxs = byYearMonth[year][monthKey];
                    const [, mo] = monthKey.split("-");
                    const moisNom = MOIS_COMPLETS[Number(mo) - 1];
                    const net = monthTxs.reduce((s, t) => s + (t.type === "revenu" ? t.montant : -t.montant), 0);
                    const netColor = net >= 0 ? "var(--green)" : "var(--red)";

                    return (
                      <div key={monthKey} className="rounded-[14px] overflow-hidden" style={{ border: "1px solid var(--border)", background: "var(--bg2)" }}>
                        {/* Month header */}
                        <div
                          className="flex items-center justify-between px-[14px] py-[6px]"
                          style={{ borderBottom: "1px solid var(--border)", background: "rgba(255,255,255,0.06)" }}
                        >
                          <span className="text-[11px] font-semibold text-[var(--text2)] tracking-[0.06em]">{moisNom}</span>
                          <span className="text-[12px] font-semibold tabular-nums" style={{ color: netColor }}>
                            {net >= 0 ? "+" : "−"}{fmt(Math.abs(net))} €
                          </span>
                        </div>
                        {/* Rows */}
                        <AnimatePresence mode="popLayout">
                          <div className="divide-y divide-[var(--border)]">
                            {monthTxs.map((t, idx) => (
                              <MobileTxRow
                                key={t.id}
                                transaction={t}
                                index={idx}
                                isActive={activeRowId === t.id}
                                confirmingDeleteId={confirmingDeleteId}
                                onEdit={openEditModal}
                                onDeleteRequest={setConfirmingDeleteId}
                                onDeleteConfirm={handleDeleteConfirm}
                                onDeleteCancel={() => { setConfirmingDeleteId(null); setActiveRowId(null); }}
                                onRowTap={() => handleRowTap(t.id)}
                              />
                            ))}
                          </div>
                        </AnimatePresence>
                      </div>
                    );
                  })}
                </div>
              );
            })}
          </div>
        )}
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
      <ImportCSVModal
        open={importModalOpen}
        onOpenChange={setImportModalOpen}
        categories={categories}
        compteId={compteId}
      />
    </>
  );
}
