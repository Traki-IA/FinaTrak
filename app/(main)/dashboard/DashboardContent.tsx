"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
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
  dateFrom?: string;
  dateTo?: string;
}

// ── Helpers ──────────────────────────────────────────────────────────────────

function fmt(n: number): string {
  return n.toLocaleString("fr-FR", { minimumFractionDigits: 0, maximumFractionDigits: 0 });
}

function formatDate(dateStr: string): string {
  return new Date(dateStr).toLocaleDateString("fr-FR", { day: "numeric", month: "short" });
}

function fmtShort(d: string): string {
  return new Date(d).toLocaleDateString("fr-FR", { day: "numeric", month: "short" });
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
    <div
      className="grid py-3 border-b border-white/[0.05] last:border-0 items-center"
      style={{ gridTemplateColumns: "1fr 110px 1fr", minHeight: "56px" }}
    >
      {/* Colonne gauche : dot + nom + date */}
      <div className="flex flex-col justify-center min-w-0 pr-2">
        <div className="flex gap-3 min-w-0">
          <div className="w-2.5 h-2.5 rounded-full shrink-0 mt-[3px]" style={{ background: couleur }} />
          <div className="min-w-0 flex-1">
            <p className="text-[17px] font-[600] text-white leading-tight truncate">
              {tx.description ?? "—"}
            </p>
            <span className="text-[9px] text-white/55 leading-none mt-0.5 block">
              {formatDate(tx.date)}
            </span>
          </div>
        </div>
      </div>

      {/* Colonne centrale : bulle catégorie */}
      <div className="flex items-center justify-center h-full">
        <span
          className="w-full block text-[10px] font-[700] text-center overflow-hidden truncate"
          style={{
            borderRadius: "9999px",
            background: `${couleur}26`,
            color: couleur,
            padding: "4px 0",
          }}
        >
          {tx.categories?.nom ?? "—"}
        </span>
      </div>

      {/* Colonne droite : montant */}
      <div className="flex items-center justify-end h-full pl-2">
        <span
          className={`text-[17px] font-[800] tabular-nums tracking-tight ${
            isRevenu ? "text-emerald-400" : "text-red-400"
          }`}
        >
          {isRevenu ? "+" : "−"}{fmt(tx.montant)} €
        </span>
      </div>
    </div>
  );
}

// ── Period Pill ───────────────────────────────────────────────────────────────

function PeriodPill({
  label,
  active,
  isCustom,
  onClick,
}: {
  label: string;
  active: boolean;
  isCustom?: boolean;
  onClick: () => void;
}) {
  const base: React.CSSProperties = {
    borderRadius: "9999px",
    padding: "6px 0",
    textAlign: "center",
    fontSize: "10px",
    fontWeight: 700,
    width: "100%",
    border: "1px solid",
    transition: "background 0.15s, color 0.15s",
    overflow: "hidden",
    textOverflow: "ellipsis",
    whiteSpace: "nowrap",
  };

  if (isCustom) {
    return (
      <button
        onClick={onClick}
        style={{
          ...base,
          background: "rgba(249,115,22,0.12)",
          borderColor: "rgba(249,115,22,0.3)",
          color: "#f97316",
        }}
      >
        {label}
      </button>
    );
  }

  return (
    <button
      onClick={onClick}
      style={{
        ...base,
        background: active ? "rgba(255,255,255,0.10)" : "transparent",
        borderColor: active ? "rgba(255,255,255,0.18)" : "rgba(255,255,255,0.08)",
        color: active ? "#ffffff" : "rgba(255,255,255,0.50)",
      }}
    >
      {label}
    </button>
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
  stats, transactions, categories, history, period, dateFrom, dateTo,
}: IDashboardContentProps) {
  const router = useRouter();
  const [tab, setTab] = useState<TMobileTab>("flux");
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [customFrom, setCustomFrom] = useState(dateFrom ?? "");
  const [customTo, setCustomTo] = useState(dateTo ?? "");

  const epargne = stats.revenus - stats.depenses;
  const tauxEpargne = stats.revenus > 0
    ? Math.round(((stats.revenus - stats.depenses) / stats.revenus) * 100)
    : stats.depenses > 0
      ? -100
      : 0;

  // Label du mois courant pour la pill "1m"
  const labelMoisCourant = new Date()
    .toLocaleDateString("fr-FR", { month: "long", year: "numeric" })
    .replace(/^\w/, (c) => c.toUpperCase());

  // Label de la plage custom quand active
  const labelCustom =
    period === "custom" && dateFrom && dateTo
      ? `${fmtShort(dateFrom)} → ${fmtShort(dateTo)}`
      : "Perso. ⚙";

  function handlePeriod(p: TPeriod) {
    if (p === "1m") {
      router.push("/dashboard");
    } else {
      router.push(`/dashboard?period=${p}`);
    }
    setDrawerOpen(false);
  }

  function handleApplyCustom() {
    if (customFrom && customTo) {
      router.push(`/dashboard?period=custom&dateFrom=${customFrom}&dateTo=${customTo}`);
      setDrawerOpen(false);
    }
  }

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
          <div className="flex items-baseline gap-2 mt-1.5">
            <span className="text-[42px] font-[900] tracking-tight leading-none">
              {fmt(stats.soldeTotal)}
            </span>
            <span className="text-[22px] text-white/28 font-light">€</span>
            <span className={`text-[20px] font-[900] tracking-tight leading-none ml-1 ${tauxEpargne >= 0 ? "text-emerald-400" : "text-red-400"}`}>
              {tauxEpargne >= 0 ? "↑" : "↓"} {tauxEpargne > 0 ? "+" : ""}{tauxEpargne}%
            </span>
          </div>
          <div className="mt-4 -mx-1">
            <Sparkline data={sparkData} height={72} />
          </div>

          {/* Sélecteur de période — mobile uniquement */}
          <div className="md:hidden mt-4">
            <div style={{ display: "grid", gridTemplateColumns: "2fr 1fr 1fr 1fr 1.5fr", gap: "5px", padding: "0 14px" }}>
              <PeriodPill
                label={labelMoisCourant}
                active={period === "1m"}
                onClick={() => handlePeriod("1m")}
              />
              <PeriodPill
                label="3m"
                active={period === "3m"}
                onClick={() => handlePeriod("3m")}
              />
              <PeriodPill
                label="6m"
                active={period === "6m"}
                onClick={() => handlePeriod("6m")}
              />
              <PeriodPill
                label="1a"
                active={period === "1a"}
                onClick={() => handlePeriod("1a")}
              />
              <PeriodPill
                label={labelCustom}
                active={period === "custom"}
                isCustom
                onClick={() => setDrawerOpen((o) => !o)}
              />
            </div>

            {/* Drawer inline */}
            {drawerOpen && (
              <div className="mt-3 rounded-xl border border-white/[0.08] bg-white/[0.04] p-4">
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "8px" }}>
                  <div style={{ display: "flex", flexDirection: "column", gap: "5px" }}>
                    <label style={{ fontSize: "9px", fontWeight: 700, textTransform: "uppercase", color: "rgba(255,255,255,0.35)", letterSpacing: "0.1em" }}>
                      Du
                    </label>
                    <input
                      type="date"
                      value={customFrom}
                      onChange={(e) => setCustomFrom(e.target.value)}
                      style={{ background: "rgba(255,255,255,0.06)", border: "1px solid rgba(255,255,255,0.10)", borderRadius: "9px", padding: "9px 12px", fontSize: "12px", color: "#fff", width: "100%", outline: "none" }}
                    />
                  </div>
                  <div style={{ display: "flex", flexDirection: "column", gap: "5px" }}>
                    <label style={{ fontSize: "9px", fontWeight: 700, textTransform: "uppercase", color: "rgba(255,255,255,0.35)", letterSpacing: "0.1em" }}>
                      Au
                    </label>
                    <input
                      type="date"
                      value={customTo}
                      onChange={(e) => setCustomTo(e.target.value)}
                      style={{ background: "rgba(255,255,255,0.06)", border: "1px solid rgba(255,255,255,0.10)", borderRadius: "9px", padding: "9px 12px", fontSize: "12px", color: "#fff", width: "100%", outline: "none" }}
                    />
                  </div>
                </div>
                <button
                  onClick={handleApplyCustom}
                  disabled={!customFrom || !customTo}
                  style={{ marginTop: "10px", width: "100%", background: "#f97316", borderRadius: "10px", padding: "11px", fontSize: "12px", fontWeight: 800, color: "#fff", opacity: (!customFrom || !customTo) ? 0.4 : 1, transition: "opacity 0.15s" }}
                >
                  Appliquer
                </button>
              </div>
            )}
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
                <p className={`text-[28px] font-[900] mt-2 mb-2.5 tracking-tight ${epargne >= 0 ? "text-emerald-400" : "text-red-400"}`}>{fmt(epargne)} €</p>
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
