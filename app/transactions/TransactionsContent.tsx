"use client";

import { useState, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Plus, Pencil } from "lucide-react";
import TransactionModal from "./TransactionModal";
import type { TTransactionWithCategorie, TCategorie, TObjectif } from "@/types";

// ── Helpers ──────────────────────────────────────────────────────────────────

function formatEur(amount: number): string {
  return new Intl.NumberFormat("fr-FR", {
    style: "currency",
    currency: "EUR",
  }).format(amount);
}

function formatDate(dateStr: string): string {
  return new Date(dateStr).toLocaleDateString("fr-FR");
}

function getMoisKey(dateStr: string): string {
  return dateStr.slice(0, 7); // "YYYY-MM"
}

function getMoisLabel(dateStr: string): string {
  const [year, month] = dateStr.split("-");
  return new Date(Number(year), Number(month) - 1).toLocaleDateString("fr-FR", {
    month: "long",
    year: "numeric",
  });
}

// ── Filter Select ─────────────────────────────────────────────────────────────

function FilterSelect({
  value,
  onChange,
  children,
}: {
  value: string;
  onChange: (v: string) => void;
  children: React.ReactNode;
}) {
  return (
    <select
      value={value}
      onChange={(e) => onChange(e.target.value)}
      className="bg-white/[0.05] border border-white/[0.1] text-white text-sm rounded-xl px-3 py-2 outline-none focus:border-orange-500/50 transition-colors cursor-pointer"
      style={{ colorScheme: "dark" }}
    >
      {children}
    </select>
  );
}

// ── Transaction Card (mobile) ─────────────────────────────────────────────────

function TransactionCard({
  transaction,
  index,
  onEdit,
}: {
  transaction: TTransactionWithCategorie;
  index: number;
  onEdit: (t: TTransactionWithCategorie) => void;
}) {
  const isRevenu = transaction.type === "revenu";
  const couleur = transaction.categories?.couleur ?? "#94a3b8";
  const initiale = (
    transaction.categories?.nom ??
    transaction.description ??
    "?"
  )[0].toUpperCase();

  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -8 }}
      transition={{ duration: 0.2, delay: Math.min(index * 0.025, 0.3) }}
      className="flex items-center gap-3 p-4 border-b border-white/[0.04] last:border-0"
    >
      <span
        className="w-9 h-9 rounded-full flex items-center justify-center text-xs font-bold shrink-0"
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

      <div className="flex items-center gap-2 flex-shrink-0">
        <span
          className={`text-sm font-semibold tabular-nums whitespace-nowrap ${
            isRevenu ? "text-emerald-400" : "text-red-400"
          }`}
        >
          {isRevenu ? "+" : "−"}
          {formatEur(transaction.montant)}
        </span>
        <button
          onClick={() => onEdit(transaction)}
          className="text-white/25 hover:text-orange-400 transition-colors p-1.5 rounded-lg hover:bg-orange-500/10"
        >
          <Pencil size={13} />
        </button>
      </div>
    </motion.div>
  );
}

// ── Transaction Row (desktop table) ───────────────────────────────────────────

function TransactionRow({
  transaction,
  index,
  onEdit,
}: {
  transaction: TTransactionWithCategorie;
  index: number;
  onEdit: (t: TTransactionWithCategorie) => void;
}) {
  const isRevenu = transaction.type === "revenu";

  return (
    <motion.tr
      layout
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -8 }}
      transition={{ duration: 0.2, delay: Math.min(index * 0.025, 0.3) }}
      className="border-b border-white/[0.04] hover:bg-white/[0.025] transition-colors"
    >
      {/* Date */}
      <td className="px-6 py-4 text-white/55 text-sm whitespace-nowrap">
        {formatDate(transaction.date)}
      </td>

      {/* Description */}
      <td className="px-6 py-4 text-white text-sm max-w-[200px] truncate">
        {transaction.description ?? (
          <span className="text-white/25 italic">—</span>
        )}
      </td>

      {/* Catégorie */}
      <td className="px-6 py-4">
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
      <td className="px-6 py-4">
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
        className={`px-6 py-4 text-right text-sm font-semibold whitespace-nowrap ${
          isRevenu ? "text-emerald-400" : "text-red-400"
        }`}
      >
        {isRevenu ? "+" : "−"}
        {formatEur(transaction.montant)}
      </td>

      {/* Actions */}
      <td className="px-4 py-4 text-center">
        <button
          onClick={() => onEdit(transaction)}
          className="text-white/25 hover:text-orange-400 transition-colors p-1.5 rounded-lg hover:bg-orange-500/10"
        >
          <Pencil size={13} />
        </button>
      </td>
    </motion.tr>
  );
}

// ── Main Component ────────────────────────────────────────────────────────────

interface ITransactionsContentProps {
  transactions: TTransactionWithCategorie[];
  categories: TCategorie[];
  objectifs: TObjectif[];
}

export default function TransactionsContent({
  transactions,
  categories,
  objectifs,
}: ITransactionsContentProps) {
  const [modalOpen, setModalOpen] = useState(false);
  const [editingTransaction, setEditingTransaction] =
    useState<TTransactionWithCategorie | null>(null);
  const [filterMois, setFilterMois] = useState("all");
  const [filterCategorie, setFilterCategorie] = useState("all");
  const [filterType, setFilterType] = useState("all");

  function handleEdit(transaction: TTransactionWithCategorie) {
    setEditingTransaction(transaction);
    setModalOpen(true);
  }

  function handleModalOpenChange(open: boolean) {
    setModalOpen(open);
    if (!open) setEditingTransaction(null);
  }

  // Unique month options extracted from transactions, preserving sort order
  const moisOptions = useMemo(() => {
    const seen = new Set<string>();
    const options: { key: string; label: string }[] = [];
    for (const t of transactions) {
      const key = getMoisKey(t.date);
      if (!seen.has(key)) {
        seen.add(key);
        options.push({ key, label: getMoisLabel(t.date) });
      }
    }
    return options;
  }, [transactions]);

  // Filtered + sorted (already sorted desc from server)
  const filtered = useMemo(
    () =>
      transactions.filter((t) => {
        if (filterMois !== "all" && getMoisKey(t.date) !== filterMois)
          return false;
        if (filterCategorie !== "all" && t.categorie_id !== filterCategorie)
          return false;
        if (filterType !== "all" && t.type !== filterType) return false;
        return true;
      }),
    [transactions, filterMois, filterCategorie, filterType]
  );

  const totalFiltre = filtered.reduce(
    (acc, t) => acc + (t.type === "revenu" ? t.montant : -t.montant),
    0
  );

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
            {filtered.length} transaction{filtered.length !== 1 ? "s" : ""}
            {filterMois !== "all" ||
            filterCategorie !== "all" ||
            filterType !== "all"
              ? " filtrées"
              : ""}
          </p>
        </div>

        <motion.button
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.97 }}
          onClick={() => {
            setEditingTransaction(null);
            setModalOpen(true);
          }}
          className="flex items-center gap-2 bg-orange-500 hover:bg-orange-600 text-white px-4 py-2.5 rounded-xl font-medium text-sm transition-colors"
        >
          <Plus size={16} />
          <span className="hidden sm:inline">Ajouter</span>
          <span className="sm:hidden">+</span>
        </motion.button>
      </motion.div>

      {/* ── Filters ── */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.1, duration: 0.3 }}
        className="flex flex-wrap gap-2 sm:gap-3 mb-5"
      >
        <FilterSelect value={filterMois} onChange={setFilterMois}>
          <option value="all" className="bg-[#0f0f1a]">
            Tous les mois
          </option>
          {moisOptions.map((m) => (
            <option key={m.key} value={m.key} className="bg-[#0f0f1a]">
              {m.label}
            </option>
          ))}
        </FilterSelect>

        <FilterSelect value={filterCategorie} onChange={setFilterCategorie}>
          <option value="all" className="bg-[#0f0f1a]">
            Catégories
          </option>
          {categories.map((cat) => (
            <option key={cat.id} value={cat.id} className="bg-[#0f0f1a]">
              {cat.nom}
            </option>
          ))}
        </FilterSelect>

        <FilterSelect value={filterType} onChange={setFilterType}>
          <option value="all" className="bg-[#0f0f1a]">
            Tous types
          </option>
          <option value="revenu" className="bg-[#0f0f1a]">
            Revenus
          </option>
          <option value="depense" className="bg-[#0f0f1a]">
            Dépenses
          </option>
        </FilterSelect>

        {/* Solde filtré */}
        {filtered.length > 0 && (
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            className="flex items-center ml-auto"
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
      </motion.div>

      {/* ── Mobile Cards (hidden on md+) ── */}
      <motion.div
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.15, duration: 0.3 }}
        className="md:hidden bg-white/[0.04] border border-white/[0.07] rounded-2xl overflow-hidden"
      >
        <AnimatePresence mode="popLayout">
          {filtered.length === 0 ? (
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
            filtered.map((t, i) => (
              <TransactionCard
                key={t.id}
                transaction={t}
                index={i}
                onEdit={handleEdit}
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
                {["Date", "Description", "Catégorie", "Type", "Montant"].map(
                  (col) => (
                    <th
                      key={col}
                      className={`text-white/35 text-xs font-medium px-6 py-4 uppercase tracking-wider ${
                        col === "Montant" ? "text-right" : "text-left"
                      }`}
                    >
                      {col}
                    </th>
                  )
                )}
                {/* Colonne actions */}
                <th className="px-4 py-4 w-12" />
              </tr>
            </thead>

            <tbody>
              <AnimatePresence mode="popLayout">
                {filtered.length === 0 ? (
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
                  filtered.map((t, i) => (
                    <TransactionRow
                      key={t.id}
                      transaction={t}
                      index={i}
                      onEdit={handleEdit}
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
        open={modalOpen}
        onOpenChange={handleModalOpenChange}
        categories={categories}
        objectifs={objectifs}
        transaction={editingTransaction}
      />
    </main>
  );
}
