"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import { ArrowRight } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import Shell from "@/components/layout/Shell";
import Bar from "@/components/ui/Bar";
import TabBar from "@/components/ui/TabBar";
import Sparkline from "@/components/charts/Sparkline";
import MiniDonut from "@/components/charts/MiniDonut";
import HealthRing from "@/components/charts/HealthRing";
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

// ── Helpers ──────────────────────────────────────────────────────────────────

const FADE_UP = {
  hidden: { opacity: 0, y: 16 },
  visible: { opacity: 1, y: 0 },
};

const STAGGER = {
  hidden: {},
  visible: { transition: { staggerChildren: 0.08 } },
};

const PERIOD_LABELS: Record<TPeriod, string> = {
  "1m": "mois en cours",
  "3m": "3 derniers mois",
  "6m": "6 derniers mois",
  "1y": "12 derniers mois",
};

function fmt(n: number): string {
  return n.toLocaleString("fr-FR", { minimumFractionDigits: 0, maximumFractionDigits: 0 });
}

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

// ── Mobile Transaction Row (Pulse Flat) ─────────────────────────────────────

function MobileTxRow({ tx }: { tx: TTransactionWithCategorie }) {
  const couleur = tx.categories?.couleur ?? "#94a3b8";

  return (
    <div className="flex items-center justify-between py-2.5 border-b border-white/[0.05] last:border-0">
      <div className="flex items-center gap-2.5 min-w-0">
        <div className="w-2 h-2 rounded-full shrink-0" style={{ background: couleur }} />
        <div className="min-w-0">
          <p className="text-[13px] font-[600] text-white leading-none truncate">
            {tx.description ?? "—"}
          </p>
          <span className="text-[10px] text-white/50 mt-0.5 block">
            {tx.categories?.nom ?? "—"}
          </span>
        </div>
      </div>
      <span
        className={`text-[15px] font-[800] tabular-nums tracking-tight shrink-0 ml-2 ${
          tx.type === "revenu" ? "text-emerald-400" : "text-red-400"
        }`}
      >
        {tx.type === "revenu" ? "+" : "−"}{fmt(tx.montant)} €
      </span>
    </div>
  );
}

// ── KPI Card ─────────────────────────────────────────────────────────────────

function KpiCard({
  label, value, color, pct, trend, trendUp,
}: {
  label: string; value: string; color: string; pct: number; trend?: string; trendUp?: boolean;
}) {
  return (
    <motion.div variants={FADE_UP} transition={{ duration: 0.35 }} className="flex-1 min-w-0">
      <Card>
        <CardContent>
          <div className="flex justify-between items-start mb-2">
            <p className="text-[9px] text-white/40 uppercase tracking-[0.14em] font-semibold">{label}</p>
            {trend && (
              <span className={`text-[9px] font-bold ${trendUp ? "text-emerald-400" : "text-red-400"}`}>
                {trend}
              </span>
            )}
          </div>
          <p className="text-[22px] font-black tabular-nums leading-none tracking-tight">{value}</p>
          <Bar pct={pct} color={color} className="mt-2" />
        </CardContent>
      </Card>
    </motion.div>
  );
}

// ── Transaction Row ──────────────────────────────────────────────────────────

function TxRow({ tx, compact = false }: { tx: TTransactionWithCategorie; compact?: boolean }) {
  const couleur = tx.categories?.couleur ?? "#94a3b8";
  const initiale = (tx.categories?.nom ?? tx.description ?? "?")[0].toUpperCase();
  const dateLabel = new Date(tx.date).toLocaleDateString("fr-FR", { day: "numeric", month: "short" });

  return (
    <motion.li
      variants={FADE_UP}
      transition={{ duration: 0.3 }}
      className={`flex items-center justify-between border-b border-white/[0.03] last:border-0 ${
        compact ? "py-[7px] px-3" : "py-2.5 px-4"
      }`}
    >
      <div className="flex items-center gap-2 min-w-0">
        <span
          className={`rounded-full flex items-center justify-center font-bold shrink-0 ${
            compact ? "w-7 h-7 text-[11px]" : "w-8 h-8 text-[12px]"
          }`}
          style={{ background: `${couleur}18`, color: couleur }}
        >
          {initiale}
        </span>
        <div className="min-w-0">
          <p className={`font-semibold text-white leading-none truncate ${compact ? "text-[11px]" : "text-[12px]"}`}>
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
        className={`font-extrabold tabular-nums tracking-tight shrink-0 ml-2 ${
          compact ? "text-[11px]" : "text-[12px]"
        } ${tx.type === "revenu" ? "text-emerald-400" : "text-white/60"}`}
      >
        {tx.type === "revenu" ? "+" : "−"}
        {fmt(tx.montant)} €
      </span>
    </motion.li>
  );
}

// ── MOBILE DASHBOARD ─────────────────────────────────────────────────────────

type TMobileTab = "flux" | "bilan" | "categ";

const MOBILE_TABS: { key: TMobileTab; label: string }[] = [
  { key: "flux", label: "↑↓ Flux" },
  { key: "bilan", label: "Bilan" },
  { key: "categ", label: "Catég." },
];

function MobileDashboard({
  stats, transactions, categories, history, period,
}: IDashboardContentProps) {
  const [tab, setTab] = useState<TMobileTab>("flux");
  const tauxEpargne = stats.revenus > 0
    ? Math.round(((stats.revenus - stats.depenses) / stats.revenus) * 100)
    : 0;
  const epargne = stats.revenus - stats.depenses;

  const totalDep = categories.reduce((s, c) => s + c.valeur, 0) || 1;
  const donut = categories
    .filter((c) => c.valeur > 0)
    .map((c) => ({ pct: Math.round((c.valeur / totalDep) * 100), color: c.couleur }));

  const sparkData = history.length > 1 ? history.map((h) => h.solde) : [0, 1];
  const grouped = groupByDate(transactions);

  return (
    <Shell>
      {/* Logo header */}
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <div className="w-7 h-7 rounded-lg bg-orange-500 flex items-center justify-center">
            <span className="text-[11px] font-black text-white">F</span>
          </div>
          <span className="text-[13px] font-[700] text-white tracking-tight">FinaTrak</span>
        </div>
        <HealthRing score={Math.min(98, Math.max(20, Math.abs(tauxEpargne)))} size={36} />
      </div>

      {/* Hero Solde */}
      <div className="mb-2">
        <p className="text-[9px] text-white/55 uppercase tracking-[0.14em] font-semibold">
          Solde disponible
        </p>
        <div className="flex items-baseline gap-1.5 mt-1.5">
          <span className="text-[42px] font-[900] tracking-tight leading-none">
            {fmt(stats.soldeTotal)}
          </span>
          <span className="text-[18px] text-white/28 font-light">€</span>
        </div>
        <div className="flex items-center gap-1.5 mt-1.5">
          <span className="text-[10px] text-emerald-400 font-bold">↑ +{Math.abs(tauxEpargne)}%</span>
          <span className="text-[9px] text-white/20">·</span>
          <span className="text-[10px] text-white/50">Init. {fmt(stats.soldeInitial)} €</span>
        </div>
        <div className="mt-3">
          <Sparkline data={sparkData} height={48} />
        </div>
      </div>

      <div className="border-b border-white/[0.05]" />

      {/* Tabbed KPIs */}
      <TabBar tabs={MOBILE_TABS} active={tab} onChange={setTab} />

      <div className="py-3">
        {tab === "flux" && (
          <div className="flex">
            <div className="flex-1 pr-4">
              <p className="text-[9px] text-white/55 uppercase tracking-[0.14em] font-semibold">Revenus</p>
              <p className="text-[15px] font-[800] mt-1.5 mb-2 tracking-tight text-emerald-400">{fmt(stats.revenus)} €</p>
              <Bar pct={Math.min(100, Math.round((stats.revenus / 4000) * 100))} color="#10b981" height={2} className="opacity-60" />
            </div>
            <div className="border-r border-white/[0.05]" />
            <div className="flex-1 pl-4">
              <p className="text-[9px] text-white/55 uppercase tracking-[0.14em] font-semibold">Dépenses</p>
              <p className="text-[15px] font-[800] mt-1.5 mb-2 tracking-tight text-red-400">{fmt(stats.depenses)} €</p>
              <Bar pct={Math.min(100, Math.round((stats.depenses / 2000) * 100))} color="#ef4444" height={2} className="opacity-60" />
            </div>
          </div>
        )}

        {tab === "bilan" && (
          <div className="flex">
            <div className="flex-1 pr-4">
              <p className="text-[9px] text-white/55 uppercase tracking-[0.14em] font-semibold">Épargne</p>
              <p className="text-[15px] font-[800] mt-1.5 mb-2 tracking-tight text-emerald-400">{fmt(epargne)} €</p>
              <Bar pct={Math.min(100, Math.round(Math.abs(epargne) / 2500 * 100))} color="#6366f1" height={2} className="opacity-60" />
            </div>
            <div className="border-r border-white/[0.05]" />
            <div className="flex-1 pl-4">
              <p className="text-[9px] text-white/55 uppercase tracking-[0.14em] font-semibold">Taux</p>
              <p className="text-[15px] font-[800] mt-1.5 mb-2 tracking-tight">{tauxEpargne}%</p>
              <Bar pct={Math.min(100, Math.abs(tauxEpargne))} color="#14b8a6" height={2} className="opacity-60" />
            </div>
          </div>
        )}

        {tab === "categ" && donut.length > 0 && (
          <div className="flex items-center gap-3.5">
            <MiniDonut data={donut} size={68}>
              <span className="text-[9px] font-extrabold text-white/50">{fmt(stats.depenses)}€</span>
            </MiniDonut>
            <div className="flex-1 flex flex-col gap-1.5">
              {categories.slice(0, 4).map((c) => (
                <div key={c.nom} className="flex items-center gap-1.5">
                  <div className="w-2 h-2 rounded-full shrink-0" style={{ background: c.couleur }} />
                  <span className="text-[10px] text-white/50 flex-1">{c.nom}</span>
                  <span className="text-[10px] font-bold">
                    {Math.round((c.valeur / (totalDep || 1)) * 100)}%
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}

        {tab === "categ" && donut.length === 0 && (
          <p className="text-[10px] text-white/50 text-center py-3">Aucune donnée</p>
        )}
      </div>

      <div className="border-b border-white/[0.05]" />

      {/* Transactions grouped by date */}
      <div className="mt-2">
        <div className="flex justify-between items-center mb-2">
          <p className="text-[9px] text-white/55 uppercase tracking-[0.14em] font-semibold">
            Transactions récentes
          </p>
          <a href="/transactions" className="text-[10px] text-orange-500 font-semibold">
            Voir tout →
          </a>
        </div>

        {grouped.length === 0 ? (
          <p className="text-[10px] text-white/50 py-4 text-center">Aucune transaction</p>
        ) : (
          grouped.map((group) => (
            <div key={group.label}>
              <p className="text-[10px] text-white/50 uppercase tracking-wider mt-2 mb-1">{group.label}</p>
              {group.items.slice(0, 5).map((tx) => (
                <MobileTxRow key={tx.id} tx={tx} />
              ))}
            </div>
          ))
        )}
      </div>
    </Shell>
  );
}

// ── DESKTOP DASHBOARD ────────────────────────────────────────────────────────

function DesktopDashboard({
  stats, transactions, categories, history, period,
}: IDashboardContentProps) {
  const tauxEpargne = stats.revenus > 0
    ? Math.round(((stats.revenus - stats.depenses) / stats.revenus) * 100)
    : 0;
  const epargne = stats.revenus - stats.depenses;

  const totalDep = categories.reduce((s, c) => s + c.valeur, 0) || 1;
  const donut = categories
    .filter((c) => c.valeur > 0)
    .map((c) => ({ pct: Math.round((c.valeur / totalDep) * 100), color: c.couleur }));

  const sparkData = history.length > 0 ? history.map((h) => h.solde) : [0, 0];

  return (
    <Shell>
      {/* Header */}
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
        <div className="flex items-center gap-4">
          <PeriodSelector current={period} />
          <HealthRing score={Math.min(98, Math.max(20, Math.abs(tauxEpargne)))} size={44} />
        </div>
      </motion.header>

      {/* Row 1: 4 KPI cards */}
      <motion.section
        className="flex gap-3 mb-3.5"
        variants={STAGGER}
        initial="hidden"
        animate="visible"
      >
        <KpiCard label="Solde" value={`${fmt(stats.soldeTotal)} €`} color="#f97316" pct={Math.min(100, Math.round((stats.soldeTotal / 5000) * 100))} trend="ce mois" trendUp />
        <KpiCard label="Revenus" value={`${fmt(stats.revenus)} €`} color="#10b981" pct={Math.min(100, Math.round((stats.revenus / 4000) * 100))} trend="+8%" trendUp />
        <KpiCard label="Dépenses" value={`${fmt(stats.depenses)} €`} color="#ef4444" pct={Math.min(100, Math.round((stats.depenses / 2000) * 100))} trend="-3%" trendUp={false} />
        <KpiCard label="Taux épargne" value={`${tauxEpargne} %`} color="#14b8a6" pct={Math.abs(tauxEpargne)} trend="obj. 50%" trendUp={tauxEpargne >= 50} />
      </motion.section>

      {/* Row 2: Sparkline (2) + Donut (1) + Bilan (1) */}
      <motion.section
        className="flex gap-3 mb-3.5"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.45, delay: 0.2 }}
        style={{ alignItems: "stretch" }}
      >
        {/* Sparkline card */}
        <Card className="flex-[2] min-w-0">
          <CardContent>
            <div className="flex justify-between items-start mb-2.5">
              <div>
                <p className="text-[9px] text-white/40 uppercase tracking-[0.14em] font-semibold mb-1.5">
                  Évolution solde
                </p>
                <p className="text-[26px] font-black tabular-nums leading-none tracking-tight">
                  {fmt(stats.soldeTotal)}
                  <span className="text-[13px] text-white/28 font-light ml-1">€</span>
                </p>
              </div>
              <span className="text-[11px] text-emerald-400 font-bold">↑ +{Math.abs(tauxEpargne)}%</span>
            </div>
            <Sparkline data={sparkData} height={60} />
          </CardContent>
        </Card>

        {/* Donut card */}
        <Card className="flex-1 min-w-0">
          <CardContent>
            <p className="text-[9px] text-white/40 uppercase tracking-[0.14em] font-semibold mb-2.5">
              Répartition dépenses
            </p>
            <div className="flex items-center gap-3">
              <MiniDonut data={donut.length > 0 ? donut : [{ pct: 100, color: "rgba(255,255,255,0.06)" }]} size={72}>
                <span className="text-[9px] font-extrabold text-white/50">{fmt(stats.depenses)}€</span>
              </MiniDonut>
              <div className="flex flex-col gap-1.5">
                {categories.slice(0, 4).map((c) => (
                  <div key={c.nom} className="flex items-center gap-1.5">
                    <div className="w-[3px] h-2.5 rounded-sm shrink-0" style={{ background: c.couleur }} />
                    <span className="text-[10px] text-white/50 flex-1">{c.nom}</span>
                    <span className="text-[10px] font-bold">{Math.round((c.valeur / totalDep) * 100)}%</span>
                  </div>
                ))}
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Mini bilan card */}
        <Card className="flex-1 min-w-0">
          <CardContent>
            <p className="text-[9px] text-white/40 uppercase tracking-[0.14em] font-semibold mb-2.5">
              Bilan {new Date().toLocaleDateString("fr-FR", { month: "long" })}
            </p>
            <div className="flex flex-col gap-2">
              {([
                ["Revenus", "#10b981", stats.revenus],
                ["Dépenses", "#ef4444", stats.depenses],
                ["Épargne", "#6366f1", epargne],
              ] as const).map(([label, color, value]) => (
                <div key={label}>
                  <div className="flex justify-between mb-1">
                    <span className="text-[10px] text-white/50">{label}</span>
                    <span className="text-[10px] font-bold" style={{ color }}>{fmt(value)} €</span>
                  </div>
                  <Bar pct={Math.min(100, Math.round(Math.abs(value) / 4000 * 100))} color={color} height={2} />
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </motion.section>

      {/* Row 3: Transactions récentes */}
      <motion.section
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.45, delay: 0.3 }}
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
            <div className="h-px bg-white/[0.06] -mx-3.5" />
            {transactions.length === 0 ? (
              <p className="text-[11px] text-white/30 py-4 text-center">
                Aucune transaction pour le moment
              </p>
            ) : (
              <motion.ul
                variants={STAGGER}
                initial="hidden"
                animate="visible"
                className="grid grid-cols-2"
              >
                {transactions.slice(0, 8).map((tx, i) => (
                  <li
                    key={tx.id}
                    className={i % 2 === 0 ? "border-r border-white/[0.03]" : ""}
                  >
                    <TxRow tx={tx} compact />
                  </li>
                ))}
              </motion.ul>
            )}
          </CardContent>
        </Card>
      </motion.section>
    </Shell>
  );
}

// ── Composant principal ──────────────────────────────────────────────────────

export default function DashboardContent(props: IDashboardContentProps) {
  return (
    <>
      <div className="md:hidden">
        <MobileDashboard {...props} />
      </div>
      <div className="hidden md:block">
        <DesktopDashboard {...props} />
      </div>
    </>
  );
}
