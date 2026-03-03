"use client";

import { motion } from "framer-motion";
import {
  ArrowRight,
} from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import Shell from "@/components/layout/Shell";
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
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  });
}

// ── Mini progress bar ────────────────────────────────────────────────────────

function ProgressBar({ pct, color }: { pct: number; color: string }) {
  return (
    <div className="h-[3px] bg-white/[0.07] rounded-full overflow-hidden mt-2">
      <motion.div
        initial={{ width: 0 }}
        animate={{ width: `${Math.min(pct, 100)}%` }}
        transition={{ duration: 0.6, ease: "easeOut" }}
        className="h-full rounded-full"
        style={{ background: color }}
      />
    </div>
  );
}

// ── KPI Card (compact, matching reference) ───────────────────────────────────

function KpiCard({
  label,
  value,
  color,
  pct,
  trend,
  trendUp,
}: {
  label: string;
  value: string;
  color: string;
  pct: number;
  trend?: string;
  trendUp?: boolean;
}) {
  return (
    <motion.div variants={FADE_UP} transition={{ duration: 0.35 }} className="flex-1 min-w-0">
      <Card>
        <CardContent>
          <div className="flex justify-between items-start mb-2">
            <p className="text-[9px] text-white/40 uppercase tracking-[0.14em] font-semibold">
              {label}
            </p>
            {trend && (
              <span className={`text-[9px] font-bold ${trendUp ? "text-emerald-400" : "text-red-400"}`}>
                {trend}
              </span>
            )}
          </div>
          <p className="text-[22px] font-black tabular-nums leading-none tracking-tight">
            {value}
          </p>
          <ProgressBar pct={pct} color={color} />
        </CardContent>
      </Card>
    </motion.div>
  );
}

// ── Transaction Row (compact) ────────────────────────────────────────────────

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
      className="flex items-center justify-between py-2 px-3 border-b border-white/[0.03] last:border-0 odd:lg:border-r odd:lg:border-white/[0.03]"
    >
      <div className="flex items-center gap-2.5 min-w-0">
        <span
          className="w-7 h-7 rounded-full flex items-center justify-center text-[11px] font-bold shrink-0"
          style={{ background: `${couleur}18`, color: couleur }}
        >
          {initiale}
        </span>
        <div className="min-w-0">
          <p className="text-[12px] font-semibold text-white leading-none truncate">
            {tx.description ?? "—"}
          </p>
          <div className="flex items-center gap-1.5 mt-0.5">
            <span className="text-[9px] text-white/28">{dateLabel}</span>
            <span
              className="text-[9px] px-1.5 py-0.5 rounded font-bold"
              style={{ background: `${couleur}20`, color: couleur }}
            >
              {tx.categories?.nom ?? "—"}
            </span>
          </div>
        </div>
      </div>
      <span
        className={`text-[12px] font-extrabold tabular-nums tracking-tight shrink-0 ml-2 ${
          tx.type === "revenu" ? "text-emerald-400" : "text-white/60"
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
  const tauxEpargne = stats.revenus > 0
    ? Math.round(((stats.revenus - stats.depenses) / stats.revenus) * 100)
    : 0;

  return (
    <Shell>
      {/* ── Header ── */}
      <motion.header
        className="mb-4 flex items-center justify-between"
        initial={{ opacity: 0, y: -8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4 }}
      >
        <div>
          <h1 className="text-[22px] font-black tracking-tight">Dashboard</h1>
          <p className="text-[10px] text-white/28 mt-0.5">
            Vue d&apos;ensemble · {PERIOD_LABELS[period]}
          </p>
        </div>
        <PeriodSelector current={period} />
      </motion.header>

      {/* ── Row 1: KPI Cards (4 en flex row sur desktop) ── */}
      <motion.section
        className="grid grid-cols-2 lg:grid-cols-4 gap-2.5 mb-3"
        variants={STAGGER_CONTAINER}
        initial="hidden"
        animate="visible"
      >
        <KpiCard
          label="Solde"
          value={`${formatEur(stats.soldeTotal)} €`}
          color="#f97316"
          pct={Math.min(100, Math.round((stats.soldeTotal / 5000) * 100))}
          trend={PERIOD_LABELS[period]}
          trendUp
        />
        <KpiCard
          label="Revenus"
          value={`${formatEur(stats.revenus)} €`}
          color="#10b981"
          pct={Math.min(100, Math.round((stats.revenus / 4000) * 100))}
          trend="+8%"
          trendUp
        />
        <KpiCard
          label="Dépenses"
          value={`${formatEur(stats.depenses)} €`}
          color="#ef4444"
          pct={Math.min(100, Math.round((stats.depenses / 2000) * 100))}
          trend="-3%"
          trendUp={false}
        />
        <KpiCard
          label="Taux épargne"
          value={`${tauxEpargne} %`}
          color="#14b8a6"
          pct={Math.abs(tauxEpargne)}
          trend="obj. 50%"
          trendUp={tauxEpargne >= 50}
        />
      </motion.section>

      {/* ── Row 2: Charts (3-panel: Area 2/3 + Donut 1/3, + optionnel bilan) ── */}
      <motion.section
        className="grid grid-cols-1 lg:grid-cols-3 gap-2.5 mb-3"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.45, delay: 0.25 }}
      >
        {/* Area chart — prend 2 cols */}
        <Card className="lg:col-span-2">
          <CardContent>
            <div className="flex justify-between items-start mb-2">
              <div>
                <p className="text-[9px] text-white/40 uppercase tracking-[0.14em] font-semibold mb-1.5">
                  Évolution solde
                </p>
                <p className="text-[26px] font-black tabular-nums leading-none tracking-tight">
                  {formatEur(stats.soldeTotal)}
                  <span className="text-[13px] text-white/28 font-light ml-1">€</span>
                </p>
              </div>
              <span className="text-[11px] text-emerald-400 font-bold">
                ↑ +{Math.abs(tauxEpargne)}%
              </span>
            </div>
            <BalanceChart data={history} />
          </CardContent>
        </Card>

        {/* Donut chart */}
        <Card>
          <CardContent>
            <p className="text-[9px] text-white/40 uppercase tracking-[0.14em] font-semibold mb-1.5">
              Répartition dépenses
            </p>
            <p className="text-lg font-bold tabular-nums mb-2">
              {formatEur(stats.depenses)}
              <span className="text-xs text-white/28 font-light ml-1">€</span>
            </p>
            <CategoryChart data={categories} />
          </CardContent>
        </Card>
      </motion.section>

      {/* ── Row 3: Revenus vs Dépenses + Catégories ── */}
      <motion.section
        className="grid grid-cols-1 lg:grid-cols-2 gap-2.5 mb-3"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.45, delay: 0.3 }}
      >
        <Card>
          <CardContent>
            <div className="flex flex-wrap items-start justify-between gap-2 mb-3">
              <div>
                <p className="text-[9px] text-white/40 uppercase tracking-[0.14em] font-semibold mb-0.5">
                  Revenus vs Dépenses
                </p>
                <p className="text-[10px] text-white/28">{PERIOD_LABELS[period]}</p>
              </div>
              <div className="flex items-center gap-3 text-[9px] text-white/40">
                <span className="flex items-center gap-1">
                  <span className="w-2 h-2 rounded-sm bg-emerald-500" />
                  Revenus
                </span>
                <span className="flex items-center gap-1">
                  <span className="w-2 h-2 rounded-sm bg-orange-500" />
                  Dépenses
                </span>
              </div>
            </div>
            <RevenusDepensesChart data={parMois} />
          </CardContent>
        </Card>

        {/* Catégories détaillées */}
        {categoriesDetailed.length > 0 && (
          <Card>
            <CardContent>
              <p className="text-[9px] text-white/40 uppercase tracking-[0.14em] font-semibold mb-4">
                Répartition des dépenses
              </p>
              <motion.div
                variants={STAGGER_CONTAINER}
                initial="hidden"
                animate="visible"
                className="space-y-3"
              >
                {categoriesDetailed.map((cat) => (
                  <CategorieBar key={cat.nom} {...cat} />
                ))}
              </motion.div>
            </CardContent>
          </Card>
        )}
      </motion.section>

      {/* ── Row 4: Transactions récentes (2-col grid sur desktop) ── */}
      <motion.section
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.45, delay: 0.35 }}
      >
        <Card>
          <CardContent>
            <div className="flex items-center justify-between mb-2">
              <p className="text-[9px] text-white/40 uppercase tracking-[0.14em] font-semibold">
                Transactions récentes
              </p>
              <a
                href="/transactions"
                className="flex items-center gap-1 text-[10px] text-orange-500 font-semibold hover:text-orange-400 transition-colors"
              >
                Voir tout <ArrowRight size={10} />
              </a>
            </div>

            {transactions.length === 0 ? (
              <p className="text-[11px] text-white/30 py-4 text-center">
                Aucune transaction pour le moment
              </p>
            ) : (
              <motion.ul
                variants={STAGGER_CONTAINER}
                initial="hidden"
                animate="visible"
                className="lg:grid lg:grid-cols-2"
              >
                {transactions.map((tx) => (
                  <TransactionRow key={tx.id} tx={tx} />
                ))}
              </motion.ul>
            )}
          </CardContent>
        </Card>
      </motion.section>
    </Shell>
  );
}
