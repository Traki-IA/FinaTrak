"use client";

import { useState } from "react";
import Shell from "@/components/layout/Shell";
import Bar from "@/components/ui/Bar";
import TabBar from "@/components/ui/TabBar";
import Sparkline from "@/components/charts/Sparkline";
import MiniDonut from "@/components/charts/MiniDonut";
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

function fmt(n: number): string {
  return n.toLocaleString("fr-FR", { minimumFractionDigits: 0, maximumFractionDigits: 0 });
}

function formatDate(dateStr: string): string {
  return new Date(dateStr).toLocaleDateString("fr-FR", { day: "numeric", month: "short" });
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

// ── Transaction Row (Pulse Flat) ─────────────────────────────────────────────

function MobileTxRow({ tx }: { tx: TTransactionWithCategorie }) {
  const isRevenu = tx.type === "revenu";
  const couleur = tx.categories?.couleur ?? "#94a3b8";

  return (
    <div className="flex gap-3 py-3 border-b border-white/[0.05] last:border-0">
      {/* Dot coloré */}
      <div className="w-2.5 h-2.5 rounded-full shrink-0 mt-[6px]" style={{ background: couleur }} />

      {/* Contenu : gauche (nom + catégorie) | droite (montant) */}
      <div className="flex-1 min-w-0 flex items-start justify-between gap-3">
        {/* Gauche */}
        <div className="min-w-0 flex-1">
          <p className="text-[17px] font-[600] text-white leading-tight truncate">
            {tx.description ?? "—"}
          </p>
          <p className="text-[13px] mt-0.5 leading-none flex items-center gap-1">
            <span style={{ color: couleur }}>{tx.categories?.nom ?? "—"}</span>
            <span className="text-white/25">·</span>
            <span className="text-white/40">{formatDate(tx.date)}</span>
          </p>
        </div>

        {/* Droite */}
        <span
          className={`text-[17px] font-[800] tabular-nums tracking-tight shrink-0 ${
            isRevenu ? "text-emerald-400" : "text-red-400"
          }`}
        >
          {isRevenu ? "+" : "−"}{fmt(tx.montant)} €
        </span>
      </div>
    </div>
  );
}

// ── Dashboard ─────────────────────────────────────────────────────────────────

type TMobileTab = "flux" | "bilan" | "categ";

const MOBILE_TABS: { key: TMobileTab; label: string }[] = [
  { key: "flux", label: "↑↓ Flux" },
  { key: "bilan", label: "Bilan" },
  { key: "categ", label: "Catég." },
];

export default function DashboardContent({
  stats, transactions, categories, history,
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

  const sparkData = (() => {
    if (history.length >= 2) return history.map((h) => h.solde);
    const sorted = [...transactions].sort((a, b) => a.date.localeCompare(b.date));
    let running = stats.soldeInitial;
    const points: number[] = [running];
    for (const tx of sorted) {
      running += tx.type === "revenu" ? Number(tx.montant) : -Number(tx.montant);
      points.push(running);
    }
    return points.length >= 2 ? points : [stats.soldeInitial, stats.soldeTotal];
  })();
  const grouped = groupByDate(transactions);

  return (
    <>
      {/* Sticky header */}
      <div className="fixed top-0 left-0 right-0 z-50 bg-[#080810] border-b border-white/[0.05] pt-[calc(0px+env(safe-area-inset-top))]">
        <div className="h-14 flex items-center pl-[calc(1.25rem+env(safe-area-inset-left))] pr-[calc(1.25rem+env(safe-area-inset-right))]">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-[9px] bg-orange-500 flex items-center justify-center font-black text-[15px] text-white">
              F
            </div>
            <span className="text-[17px] font-black tracking-tight text-white">
              Fina<span className="text-orange-500">Trak</span>
            </span>
          </div>
        </div>
      </div>

      <Shell>
        {/* Spacer pour le header sticky */}
        <div className="h-10" />

        {/* Hero Solde */}
        <div className="mb-2">
          <p className="text-[11px] text-white/55 uppercase tracking-[0.14em] font-semibold">
            Solde disponible
          </p>
          <div className="flex items-baseline gap-1.5 mt-1.5">
            <span className="text-[42px] font-[900] tracking-tight leading-none">
              {fmt(stats.soldeTotal)}
            </span>
            <span className="text-[22px] text-white/28 font-light">€</span>
          </div>
          <div className="flex items-center gap-1.5 mt-1.5">
            <span className="text-[12px] text-emerald-400 font-bold">↑ +{Math.abs(tauxEpargne)}%</span>
            <span className="text-[10px] text-white/20">·</span>
            <span className="text-[12px] text-white/50">Init. {fmt(stats.soldeInitial)} €</span>
          </div>
          <div className="mt-4 -mx-1">
            <Sparkline data={sparkData} height={72} />
          </div>
        </div>

        <div className="border-b border-white/[0.05]" />

        {/* Tabbed KPIs */}
        <TabBar tabs={MOBILE_TABS} active={tab} onChange={setTab} />

        <div className="py-4">
          {tab === "flux" && (
            <div className="flex">
              <div className="flex-1 pr-4 flex flex-col items-center">
                <p className="text-[11px] text-white/55 uppercase tracking-[0.14em] font-semibold">Revenus</p>
                <p className="text-[28px] font-[900] mt-2 mb-2.5 tracking-tight text-emerald-400">{fmt(stats.revenus)} €</p>
                <Bar pct={Math.min(100, Math.round((stats.revenus / 4000) * 100))} color="#10b981" height={3} className="opacity-60 w-full" />
              </div>
              <div className="border-r border-white/[0.05]" />
              <div className="flex-1 pl-4 flex flex-col items-center">
                <p className="text-[11px] text-white/55 uppercase tracking-[0.14em] font-semibold">Dépenses</p>
                <p className="text-[28px] font-[900] mt-2 mb-2.5 tracking-tight text-red-400">{fmt(stats.depenses)} €</p>
                <Bar pct={Math.min(100, Math.round((stats.depenses / 2000) * 100))} color="#ef4444" height={3} className="opacity-60 w-full" />
              </div>
            </div>
          )}

          {tab === "bilan" && (
            <div className="flex">
              <div className="flex-1 pr-4 flex flex-col items-center">
                <p className="text-[11px] text-white/55 uppercase tracking-[0.14em] font-semibold">Épargne</p>
                <p className="text-[28px] font-[900] mt-2 mb-2.5 tracking-tight text-emerald-400">{fmt(epargne)} €</p>
                <Bar pct={Math.min(100, Math.round(Math.abs(epargne) / 2500 * 100))} color="#6366f1" height={3} className="opacity-60 w-full" />
              </div>
              <div className="border-r border-white/[0.05]" />
              <div className="flex-1 pl-4 flex flex-col items-center">
                <p className="text-[11px] text-white/55 uppercase tracking-[0.14em] font-semibold">Taux</p>
                <p className="text-[28px] font-[900] mt-2 mb-2.5 tracking-tight">{tauxEpargne}%</p>
                <Bar pct={Math.min(100, Math.abs(tauxEpargne))} color="#14b8a6" height={3} className="opacity-60 w-full" />
              </div>
            </div>
          )}

          {tab === "categ" && donut.length > 0 && (
            <div className="flex items-center gap-3.5">
              <MiniDonut data={donut} size={68}>
                <span className="text-[11px] font-extrabold text-white/50">{fmt(stats.depenses)}€</span>
              </MiniDonut>
              <div className="flex-1 flex flex-col gap-1.5">
                {categories.slice(0, 4).map((c) => (
                  <div key={c.nom} className="flex items-center gap-1.5">
                    <div className="w-2 h-2 rounded-full shrink-0" style={{ background: c.couleur }} />
                    <span className="text-[12px] text-white/50 flex-1">{c.nom}</span>
                    <span className="text-[12px] font-bold">
                      {Math.round((c.valeur / (totalDep || 1)) * 100)}%
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {tab === "categ" && donut.length === 0 && (
            <p className="text-[12px] text-white/50 text-center py-3">Aucune donnée</p>
          )}
        </div>

        <div className="border-b border-white/[0.05]" />

        {/* Transactions grouped by date */}
        <div className="mt-2">
          <div className="flex justify-between items-center mb-2">
            <p className="text-[11px] text-white/55 uppercase tracking-[0.14em] font-semibold">
              Transactions récentes
            </p>
            <a href="/transactions" className="text-[12px] text-orange-500 font-semibold">
              Voir tout →
            </a>
          </div>

          {grouped.length === 0 ? (
            <p className="text-[12px] text-white/50 py-4 text-center">Aucune transaction</p>
          ) : (
            grouped.map((group) => (
              <div key={group.label}>
                <p className="text-[11px] text-white/50 uppercase tracking-wider mt-2 mb-1">{group.label}</p>
                {group.items.slice(0, 5).map((tx) => (
                  <MobileTxRow key={tx.id} tx={tx} />
                ))}
              </div>
            ))
          )}
        </div>
      </Shell>
    </>
  );
}
