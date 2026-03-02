"use client";

import { motion } from "framer-motion";
import {
  Wallet,
  TrendingUp,
  TrendingDown,
  PiggyBank,
  Percent,
  ArrowRight,
} from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import BalanceChart from "./BalanceChart";
import CategoryChart from "./CategoryChart";
import RevenusDepensesChart from "./RevenusDepensesChart";
import CategorieBar from "./CategorieBar";
import PeriodSelector from "./PeriodSelector";
import type {
  TDashboardStats,
  TTransactionWithCategorie,
  TDepenseCategorie,
  TBalancePoint,
  TPeriod,
  TBilanMois,
  TBilanCategorie,
} from "@/types";

// ── Types ────────────────────────────────────────────────────────────────────

interface IDashboardContentProps {
  stats: TDashboardStats;
  transactions: TTransactionWithCategorie[];
  categories: TDepenseCategorie[];
  history: TBalancePoint[];
  parMois: TBilanMois[];
  categoriesDetailed: TBilanCategorie[];
  period: TPeriod;
}

interface IKpiCard {
  label: string;
  valeur: number;
  positif: boolean;
  icon: React.ReactNode;
  subtitle: string;
  isPercent?: boolean;
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

const PERIOD_LABELS: Record<TPeriod, string> = {
  "1m": "mois en cours",
  "3m": "3 derniers mois",
  "6m": "6 derniers mois",
  "1y": "12 derniers mois",
};

function formatEur(n: number): string {
  return n.toLocaleString("fr-FR", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });
}

function buildKpiCards(stats: TDashboardStats, period: TPeriod): IKpiCard[] {
  const subtitle = PERIOD_LABELS[period];
  return [
    {
      label: "Revenus",
      valeur: stats.revenus,
      positif: true,
      icon: <TrendingUp size={16} />,
      subtitle,
    },
    {
      label: "Dépenses",
      valeur: stats.depenses,
      positif: false,
      icon: <TrendingDown size={16} />,
      subtitle,
    },
    {
      label: "Épargne nette",
      valeur: stats.epargne,
      positif: stats.epargne >= 0,
      icon: <PiggyBank size={16} />,
      subtitle,
    },
    {
      label: "Taux d'épargne",
      valeur: stats.tauxEpargne,
      positif: stats.tauxEpargne >= 0,
      icon: <Percent size={16} />,
      subtitle,
      isPercent: true,
    },
  ];
}

// ── Sous-composants ──────────────────────────────────────────────────────────

function SoldeCard({ stats }: { stats: TDashboardStats }) {
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

            <p className="text-xl sm:text-2xl font-bold tabular-nums leading-none text-white">
              {formatEur(stats.soldeTotal)}
              <span className="text-sm text-white/35 font-normal ml-1">€</span>
            </p>

            <p className="text-xs text-white/35 font-medium mt-2.5">
              Solde initial : {formatEur(stats.soldeInitial)} €
            </p>
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
            <p className="text-xl sm:text-2xl font-bold tabular-nums leading-none text-white">
              {kpi.isPercent ? (
                `${kpi.valeur.toFixed(1)} %`
              ) : (
                <>
                  {formatEur(kpi.valeur)}
                  <span className="text-sm text-white/35 font-normal ml-1">€</span>
                </>
              )}
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
  parMois,
  categoriesDetailed,
  period,
}: IDashboardContentProps) {
  const kpiCards = buildKpiCards(stats, period);

  return (
    <div className="min-h-screen bg-[#0a0a0f] text-white px-4 py-6 lg:px-8 lg:py-8">

      {/* ── Header ── */}
      <motion.header
        className="mb-8 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4"
        initial={{ opacity: 0, y: -8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4 }}
      >
        <div>
          <p className="text-xs text-white/35 uppercase tracking-widest font-medium mb-1">
            Vue d&apos;ensemble
          </p>
          <h1 className="text-2xl font-bold tracking-tight">Tableau de bord</h1>
        </div>
        <PeriodSelector current={period} />
      </motion.header>

      {/* ── KPI Cards ── */}
      <motion.section
        className="grid grid-cols-2 lg:grid-cols-5 gap-2 sm:gap-3 mb-3 sm:mb-5"
        variants={STAGGER_CONTAINER}
        initial="hidden"
        animate="visible"
      >
        <SoldeCard stats={stats} />
        {kpiCards.map((kpi) => (
          <KpiCard key={kpi.label} kpi={kpi} />
        ))}
      </motion.section>

      {/* ── Charts row 1: Area + Donut ── */}
      <motion.section
        className="grid grid-cols-1 lg:grid-cols-3 gap-2 sm:gap-3 mb-3 sm:mb-5"
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

      {/* ── Charts row 2: Bar chart revenus vs dépenses ── */}
      <motion.section
        className="mb-3 sm:mb-5"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.45, delay: 0.3 }}
      >
        <Card>
          <CardContent>
            <div className="flex flex-wrap items-start justify-between gap-3 mb-5">
              <div>
                <p className="text-[10px] text-white/40 uppercase tracking-widest mb-1">
                  Revenus vs Dépenses
                </p>
                <p className="text-sm text-white/55">{PERIOD_LABELS[period]}</p>
              </div>
              <div className="flex items-center gap-4 text-xs text-white/40">
                <span className="flex items-center gap-1.5">
                  <span className="w-2.5 h-2.5 rounded-sm bg-emerald-500" />
                  Revenus
                </span>
                <span className="flex items-center gap-1.5">
                  <span className="w-2.5 h-2.5 rounded-sm bg-orange-500" />
                  Dépenses
                </span>
              </div>
            </div>
            <RevenusDepensesChart data={parMois} />
          </CardContent>
        </Card>
      </motion.section>

      {/* ── Catégories détaillées (barres horizontales) ── */}
      {categoriesDetailed.length > 0 && (
        <motion.section
          className="mb-5"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.45, delay: 0.35 }}
        >
          <Card>
            <CardContent>
              <p className="text-[10px] text-white/40 uppercase tracking-widest mb-6">
                Répartition des dépenses
              </p>
              <motion.div
                variants={STAGGER_CONTAINER}
                initial="hidden"
                animate="visible"
                className="space-y-4"
              >
                {categoriesDetailed.map((cat) => (
                  <CategorieBar key={cat.nom} {...cat} />
                ))}
              </motion.div>
            </CardContent>
          </Card>
        </motion.section>
      )}

      {/* ── Dernières transactions ── */}
      <motion.section
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.45, delay: 0.4 }}
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
