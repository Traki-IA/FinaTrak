"use client";

import { useState, useTransition } from "react";
import { motion } from "framer-motion";
import {
  Wallet,
  TrendingUp,
  TrendingDown,
  PiggyBank,
  ArrowRight,
  Pencil,
  Check,
  X,
} from "lucide-react";
import { toast } from "sonner";
import { Card, CardContent } from "@/components/ui/card";
import BalanceChart from "./BalanceChart";
import CategoryChart from "./CategoryChart";
import { updateSoldeInitial } from "./actions";
import type {
  TDashboardStats,
  TTransactionWithCategorie,
  TDepenseCategorie,
  TBalancePoint,
} from "@/types";

// ── Types ────────────────────────────────────────────────────────────────────

interface IDashboardContentProps {
  stats: TDashboardStats;
  transactions: TTransactionWithCategorie[];
  categories: TDepenseCategorie[];
  history: TBalancePoint[];
  moisLabel: string;
}

interface IKpiCard {
  label: string;
  valeur: number;
  positif: boolean;
  icon: React.ReactNode;
  subtitle: string;
}

// ── Constantes & helpers ─────────────────────────────────────────────────────

const FADE_UP = {
  hidden: { opacity: 0, y: 16 },
  visible: { opacity: 1, y: 0 },
};

const STAGGER_CONTAINER = {
  hidden: {},
  visible: { transition: { staggerChildren: 0.08 } },
};

function formatEur(n: number): string {
  return n.toLocaleString("fr-FR", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });
}

function buildKpiCards(stats: TDashboardStats): IKpiCard[] {
  return [
    {
      label: "Revenus du mois",
      valeur: stats.revenus,
      positif: true,
      icon: <TrendingUp size={16} />,
      subtitle: "mois en cours",
    },
    {
      label: "Dépenses du mois",
      valeur: stats.depenses,
      positif: false,
      icon: <TrendingDown size={16} />,
      subtitle: "mois en cours",
    },
    {
      label: "Épargne nette",
      valeur: stats.epargne,
      positif: stats.epargne >= 0,
      icon: <PiggyBank size={16} />,
      subtitle: "revenus − dépenses du mois",
    },
  ];
}

// ── Sous-composants ──────────────────────────────────────────────────────────

/**
 * Carte "Solde total" avec éditeur inline du solde initial.
 * Le solde affiché = solde initial + tous les revenus − toutes les dépenses.
 */
function SoldeCard({ stats }: { stats: TDashboardStats }) {
  const [editing, setEditing] = useState(false);
  const [inputValue, setInputValue] = useState("");
  const [isPending, startTransition] = useTransition();

  function handleEditStart() {
    setInputValue(String(stats.soldeInitial));
    setEditing(true);
  }

  function handleCancel() {
    setEditing(false);
  }

  function handleSubmit() {
    const montant = parseFloat(inputValue.replace(",", "."));
    if (isNaN(montant)) {
      toast.error("Montant invalide");
      return;
    }
    startTransition(async () => {
      const result = await updateSoldeInitial(montant);
      if (result.success) {
        setEditing(false);
        toast.success("Solde initial mis à jour");
      } else {
        toast.error(result.error ?? "Erreur lors de la mise à jour");
      }
    });
  }

  return (
    <motion.div variants={FADE_UP} transition={{ duration: 0.35 }}>
      <motion.div
        whileHover={{ scale: 1.02, borderColor: "rgba(249,115,22,0.25)" }}
        transition={{ type: "spring", stiffness: 300, damping: 20 }}
      >
        <Card>
          <CardContent>
            <div className="flex items-center justify-between mb-3">
              <p className="text-[10px] text-white/40 uppercase tracking-widest">
                Solde total
              </p>
              <span className="p-1.5 rounded-lg bg-emerald-500/10 text-emerald-400">
                <Wallet size={16} />
              </span>
            </div>

            <p className="text-2xl font-bold tabular-nums leading-none text-white">
              {formatEur(stats.soldeTotal)}
              <span className="text-sm text-white/35 font-normal ml-1">€</span>
            </p>

            {editing ? (
              <div className="flex items-center gap-1.5 mt-2.5">
                <input
                  type="number"
                  value={inputValue}
                  onChange={(e) => setInputValue(e.target.value)}
                  onKeyDown={(e: { key: string }) => {
                    if (e.key === "Enter") handleSubmit();
                    if (e.key === "Escape") handleCancel();
                  }}
                  className="flex-1 min-w-0 text-xs bg-white/[0.06] border border-white/10 rounded-lg px-2 py-1 text-white outline-none focus:border-orange-500/50 [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                  placeholder="Solde initial (€)"
                  disabled={isPending}
                  autoFocus
                />
                <button
                  onClick={handleSubmit}
                  disabled={isPending}
                  className="p-1 rounded text-emerald-400 hover:bg-emerald-500/10 transition-colors"
                  title="Valider"
                >
                  <Check size={14} />
                </button>
                <button
                  onClick={handleCancel}
                  className="p-1 rounded text-rose-400 hover:bg-rose-500/10 transition-colors"
                  title="Annuler"
                >
                  <X size={14} />
                </button>
              </div>
            ) : (
              <div className="flex items-center gap-1.5 mt-2.5">
                <p className="text-xs text-white/35 font-medium">
                  Solde initial : {formatEur(stats.soldeInitial)} €
                </p>
                <button
                  onClick={handleEditStart}
                  className="p-0.5 rounded text-white/25 hover:text-orange-400 transition-colors"
                  title="Modifier le solde initial"
                >
                  <Pencil size={11} />
                </button>
              </div>
            )}
          </CardContent>
        </Card>
      </motion.div>
    </motion.div>
  );
}

function KpiCard({ kpi }: { kpi: IKpiCard }) {
  return (
    <motion.div variants={FADE_UP} transition={{ duration: 0.35 }}>
      <motion.div
        whileHover={{ scale: 1.02, borderColor: "rgba(249,115,22,0.25)" }}
        transition={{ type: "spring", stiffness: 300, damping: 20 }}
      >
        <Card>
          <CardContent>
            <div className="flex items-center justify-between mb-3">
              <p className="text-[10px] text-white/40 uppercase tracking-widest">
                {kpi.label}
              </p>
              <span
                className={`p-1.5 rounded-lg ${
                  kpi.positif
                    ? "bg-emerald-500/10 text-emerald-400"
                    : "bg-rose-500/10 text-rose-400"
                }`}
              >
                {kpi.icon}
              </span>
            </div>
            <p className="text-2xl font-bold tabular-nums leading-none text-white">
              {formatEur(kpi.valeur)}
              <span className="text-sm text-white/35 font-normal ml-1">€</span>
            </p>
            <p className="text-xs mt-2.5 font-medium text-white/35">
              {kpi.subtitle}
            </p>
          </CardContent>
        </Card>
      </motion.div>
    </motion.div>
  );
}

function TransactionRow({ tx }: { tx: TTransactionWithCategorie }) {
  const couleur = tx.categories?.couleur ?? "#94a3b8";
  const initiale = (tx.categories?.nom ?? tx.description ?? "?")[0].toUpperCase();
  const dateLabel = new Date(tx.date).toLocaleDateString("fr-FR", {
    day: "numeric",
    month: "short",
  });

  return (
    <motion.li
      variants={FADE_UP}
      transition={{ duration: 0.3 }}
      className="flex items-center justify-between py-3 border-b border-white/[0.05] last:border-0"
      whileHover={{ x: 4 }}
    >
      <div className="flex items-center gap-3">
        <span
          className="w-9 h-9 rounded-full flex items-center justify-center text-xs font-bold shrink-0"
          style={{ background: `${couleur}18`, color: couleur }}
        >
          {initiale}
        </span>
        <div>
          <p className="text-sm font-medium text-white leading-tight">
            {tx.description ?? "—"}
          </p>
          <p className="text-xs text-white/35 mt-0.5">
            {dateLabel} · {tx.categories?.nom ?? "Sans catégorie"}
          </p>
        </div>
      </div>
      <span
        className={`text-sm font-semibold tabular-nums ${
          tx.type === "revenu" ? "text-emerald-400" : "text-white/65"
        }`}
      >
        {tx.type === "revenu" ? "+" : "−"}
        {formatEur(tx.montant)} €
      </span>
    </motion.li>
  );
}

// ── Composant principal ──────────────────────────────────────────────────────

export default function DashboardContent({
  stats,
  transactions,
  categories,
  history,
  moisLabel,
}: IDashboardContentProps) {
  const kpiCards = buildKpiCards(stats);

  return (
    <div className="min-h-screen bg-[#0a0a0f] text-white px-4 py-6 lg:px-8 lg:py-8">

      {/* ── Header ── */}
      <motion.header
        className="mb-8"
        initial={{ opacity: 0, y: -8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4 }}
      >
        <p className="text-xs text-white/35 uppercase tracking-widest font-medium mb-1">
          {moisLabel}
        </p>
        <h1 className="text-2xl font-bold tracking-tight">Tableau de bord</h1>
      </motion.header>

      {/* ── KPI Cards ── */}
      <motion.section
        className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 mb-5"
        variants={STAGGER_CONTAINER}
        initial="hidden"
        animate="visible"
      >
        {/* Solde total — carte éditable (solde initial + flux cumulés) */}
        <SoldeCard stats={stats} />

        {/* Revenus, Dépenses, Épargne du mois */}
        {kpiCards.map((kpi) => (
          <KpiCard key={kpi.label} kpi={kpi} />
        ))}
      </motion.section>

      {/* ── Charts row ── */}
      <motion.section
        className="grid grid-cols-1 lg:grid-cols-3 gap-3 mb-5"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.45, delay: 0.25 }}
      >
        {/* Area chart */}
        <Card className="lg:col-span-2">
          <CardContent>
            <p className="text-[10px] text-white/40 uppercase tracking-widest mb-1">
              Évolution du solde
            </p>
            <p className="text-xl font-bold tabular-nums mb-4">
              {formatEur(stats.soldeTotal)}
              <span className="text-sm text-white/35 font-normal ml-1">€</span>
            </p>
            <div className="flex gap-4 mb-4">
              {[
                { label: "Solde", couleur: "#f97316" },
                { label: "Dépenses", couleur: "#6366f1" },
              ].map((l) => (
                <div
                  key={l.label}
                  className="flex items-center gap-1.5 text-xs text-white/40"
                >
                  <span
                    className="w-2 h-2 rounded-full"
                    style={{ background: l.couleur }}
                  />
                  {l.label}
                </div>
              ))}
            </div>
            <BalanceChart data={history} />
          </CardContent>
        </Card>

        {/* Donut chart */}
        <Card>
          <CardContent>
            <p className="text-[10px] text-white/40 uppercase tracking-widest mb-1">
              Dépenses par catégorie
            </p>
            <p className="text-xl font-bold tabular-nums mb-4">
              {formatEur(stats.depenses)}
              <span className="text-sm text-white/35 font-normal ml-1">€</span>
            </p>
            <CategoryChart data={categories} />
          </CardContent>
        </Card>
      </motion.section>

      {/* ── Dernières transactions ── */}
      <motion.section
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.45, delay: 0.35 }}
      >
        <Card>
          <CardContent>
            <div className="flex items-center justify-between mb-4">
              <p className="text-[10px] text-white/40 uppercase tracking-widest">
                Dernières transactions
              </p>
              <a
                href="/transactions"
                className="flex items-center gap-1 text-xs text-white/35 hover:text-white/80 transition-colors"
              >
                Voir tout <ArrowRight size={12} />
              </a>
            </div>

            {transactions.length === 0 ? (
              <p className="text-sm text-white/30 py-4 text-center">
                Aucune transaction pour le moment
              </p>
            ) : (
              <motion.ul
                variants={STAGGER_CONTAINER}
                initial="hidden"
                animate="visible"
              >
                {transactions.map((tx) => (
                  <TransactionRow key={tx.id} tx={tx} />
                ))}
              </motion.ul>
            )}
          </CardContent>
        </Card>
      </motion.section>
    </div>
  );
}
