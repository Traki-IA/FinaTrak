"use client";

import { motion } from "framer-motion";
import {
  TrendingUp,
  TrendingDown,
  PiggyBank,
  Percent,
} from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import RevenusDepensesChart from "./RevenusDepensesChart";
import type { TBilanData } from "@/lib/bilan";

// ── Helpers ───────────────────────────────────────────────────────────────────

function formatEur(n: number) {
  return new Intl.NumberFormat("fr-FR", {
    style: "currency",
    currency: "EUR",
  }).format(n);
}

// ── Animations ────────────────────────────────────────────────────────────────

const FADE_UP = {
  hidden: { opacity: 0, y: 16 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.35 } },
};

const STAGGER = {
  hidden: {},
  visible: { transition: { staggerChildren: 0.07 } },
};

// ── KPI Card ──────────────────────────────────────────────────────────────────

function KpiCard({
  label,
  value,
  icon,
  color,
  isPercent = false,
}: {
  label: string;
  value: number;
  icon: React.ReactNode;
  color: string;
  isPercent?: boolean;
}) {
  return (
    <motion.div variants={FADE_UP}>
      <Card>
        <CardContent>
          <div className="flex items-center justify-between mb-3">
            <p className="text-[10px] text-white/40 uppercase tracking-widest">
              {label}
            </p>
            <span
              className="p-1.5 rounded-lg"
              style={{
                background: `${color}18`,
                color,
              }}
            >
              {icon}
            </span>
          </div>
          <p className="text-2xl font-bold text-white tabular-nums leading-none">
            {isPercent ? `${value.toFixed(1)} %` : formatEur(value)}
          </p>
        </CardContent>
      </Card>
    </motion.div>
  );
}

// ── Barre catégorie ───────────────────────────────────────────────────────────

function CategorieBar({
  nom,
  couleur,
  total,
  pourcentage,
}: {
  nom: string;
  couleur: string;
  total: number;
  pourcentage: number;
}) {
  return (
    <motion.div
      variants={FADE_UP}
      className="flex items-center gap-4 group"
    >
      <div className="w-28 flex-shrink-0 flex items-center gap-2">
        <span
          className="w-2 h-2 rounded-full flex-shrink-0"
          style={{ background: couleur }}
        />
        <span className="text-sm text-white/70 truncate">{nom}</span>
      </div>

      <div className="flex-1 h-2 bg-white/[0.06] rounded-full overflow-hidden">
        <motion.div
          initial={{ width: 0 }}
          animate={{ width: `${pourcentage}%` }}
          transition={{ duration: 0.7, ease: "easeOut", delay: 0.2 }}
          className="h-full rounded-full"
          style={{ background: couleur }}
        />
      </div>

      <div className="w-32 flex-shrink-0 flex items-center justify-end gap-3">
        <span className="text-xs text-white/35">{pourcentage.toFixed(1)} %</span>
        <span className="text-sm font-medium text-white tabular-nums">
          {formatEur(total)}
        </span>
      </div>
    </motion.div>
  );
}

// ── Composant principal ───────────────────────────────────────────────────────

export default function BilanContent({ data }: { data: TBilanData }) {
  const { totaux, parMois, parCategorie } = data;

  const kpis = [
    {
      label: "Revenus totaux",
      value: totaux.revenus,
      icon: <TrendingUp size={16} />,
      color: "#22c55e",
    },
    {
      label: "Dépenses totales",
      value: totaux.depenses,
      icon: <TrendingDown size={16} />,
      color: "#f97316",
    },
    {
      label: "Épargne nette",
      value: totaux.epargne,
      icon: <PiggyBank size={16} />,
      color: totaux.epargne >= 0 ? "#14b8a6" : "#ef4444",
    },
    {
      label: "Taux d'épargne",
      value: totaux.tauxEpargne,
      icon: <Percent size={16} />,
      color: totaux.tauxEpargne >= 20 ? "#22c55e" : "#f97316",
      isPercent: true,
    },
  ];

  return (
    <main className="min-h-screen bg-background p-6 md:p-8">
      {/* ── Header ── */}
      <motion.div
        initial={{ opacity: 0, y: -16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3 }}
        className="mb-8"
      >
        <h1 className="text-2xl font-bold text-white">Bilan financier</h1>
        <p className="text-white/40 text-sm mt-1">
          Vue d'ensemble sur toutes les transactions
        </p>
      </motion.div>

      {/* ── KPI Cards ── */}
      <motion.div
        variants={STAGGER}
        initial="hidden"
        animate="visible"
        className="grid grid-cols-2 lg:grid-cols-4 gap-3 mb-5"
      >
        {kpis.map((k) => (
          <KpiCard key={k.label} {...k} />
        ))}
      </motion.div>

      {/* ── Bar Chart ── */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.25, duration: 0.4 }}
        className="mb-4"
      >
        <Card>
          <CardContent>
            <div className="flex items-start justify-between mb-5">
              <div>
                <p className="text-[10px] text-white/40 uppercase tracking-widest mb-1">
                  Revenus vs Dépenses
                </p>
                <p className="text-sm text-white/55">12 derniers mois</p>
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
      </motion.div>

      {/* ── Catégories ── */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.35, duration: 0.4 }}
      >
        <Card>
          <CardContent>
            <p className="text-[10px] text-white/40 uppercase tracking-widest mb-6">
              Dépenses par catégorie
            </p>

            {parCategorie.length === 0 ? (
              <p className="text-white/30 text-sm text-center py-8">
                Aucune dépense enregistrée
              </p>
            ) : (
              <motion.div
                variants={STAGGER}
                initial="hidden"
                animate="visible"
                className="space-y-4"
              >
                {parCategorie.map((cat) => (
                  <CategorieBar key={cat.nom} {...cat} />
                ))}
              </motion.div>
            )}
          </CardContent>
        </Card>
      </motion.div>
    </main>
  );
}
