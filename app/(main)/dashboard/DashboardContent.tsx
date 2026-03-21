"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Shell from "@/components/layout/Shell";
import LogoHeader from "@/components/ui/LogoHeader";
import TabBar from "@/components/ui/TabBar";
import BalanceLine from "@/components/charts/BalanceLine";
import type {
  TDashboardStats,
  TDepenseCategorie,
  TBalancePoint,
  TPeriod,
  TBilanMois,
} from "@/types";

// ── Types ────────────────────────────────────────────────────────────────────

interface IDashboardContentProps {
  stats: TDashboardStats;
  categories: TDepenseCategorie[];
  history: TBalancePoint[];
  parMois: TBilanMois[];
  allParMois: TBilanMois[];
  period: TPeriod;
  dateFrom?: string;
  dateTo?: string;
}

// ── Helpers ──────────────────────────────────────────────────────────────────

function fmt(n: number): string {
  return Math.abs(n).toLocaleString("fr-FR", {
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  });
}

type TPeriodTab = "1m" | "7j" | "3m" | "6m" | "1a";
const PERIOD_TABS: { key: TPeriodTab; label: string }[] = [
  { key: "1m", label: "Ce mois" },
  { key: "7j", label: "7 jours" },
  { key: "3m", label: "3 mois" },
  { key: "6m", label: "6 mois" },
  { key: "1a", label: "1 an" },
];

const PERIOD_MAP: Record<TPeriodTab, TPeriod> = {
  "1m": "1m",
  "7j": "1m", // 7j n'existe pas côté serveur, on utilise 1m
  "3m": "3m",
  "6m": "6m",
  "1a": "1a",
};

// ── Component ────────────────────────────────────────────────────────────────

export default function DashboardContent({
  stats,
  categories,
  history,
  parMois,
  allParMois,
  period,
}: IDashboardContentProps) {
  const router = useRouter();
  const [activePeriod, setActivePeriod] = useState<TPeriodTab>(
    period === "1m" ? "1m" : period === "3m" ? "3m" : period === "6m" ? "6m" : period === "1a" ? "1a" : "1m"
  );

  function handlePeriodChange(p: TPeriodTab) {
    setActivePeriod(p);
    const mapped = PERIOD_MAP[p];
    if (mapped === "1m") {
      router.push("/dashboard");
    } else {
      router.push(`/dashboard?period=${mapped}`);
    }
  }

  // Flux net de la période sélectionnée (revenus - dépenses sur la fenêtre)
  const periodNet = stats.revenus - stats.depenses;

  // Solde réel du compte (solde initial + toutes les transactions historiques)
  const soldeCourant = stats.soldeTotal;

  // Comparaison vs mois précédent (si parMois a au moins 2 entrées)
  const currentMonth = parMois.length > 0 ? parMois[parMois.length - 1] : null;
  const prevMonth = parMois.length > 1 ? parMois[parMois.length - 2] : null;

  function vsLabel(current: number, previous: number | undefined): string {
    if (previous === undefined || previous === 0) return "";
    const diff = current - previous;
    const pct = Math.round((diff / Math.abs(previous)) * 100);
    return `${pct >= 0 ? "↑ +" : "↓ "}${pct} %`;
  }

  return (
    <Shell>
      <LogoHeader />

      {/* Chart */}
      <BalanceLine data={history} />

      {/* Period tabs */}
      <div className="px-0 py-[6px]">
        <TabBar
          tabs={PERIOD_TABS}
          active={activePeriod}
          onChange={handlePeriodChange}
        />
      </div>

      {/* Légende */}
      <div className="flex justify-center gap-4 py-[5px]">
        <div className="flex items-center gap-[6px] text-[11px] text-[var(--text3)]">
          <div className="w-[18px] h-[2px] rounded-[1px] bg-[var(--orange)]" />
          Solde
        </div>
        <div className="flex items-center gap-[6px] text-[11px] text-[var(--text3)]">
          <div
            className="w-[18px] h-0"
            style={{ borderTop: "1.5px dashed #333" }}
          />
          Moyenne
        </div>
      </div>

      {/* Divider */}
      <div className="h-px bg-[var(--bg2)] mx-0 my-[5px]" />

      {/* Bilan 3 colonnes */}
      <div
        className="flex border-b border-[var(--border)]"
        style={{ background: "var(--bg2)" }}
      >
        {/* Revenus */}
        <div className="flex-1 text-center py-[10px] px-1 border-r border-[var(--border)]">
          <div className="text-[10px] text-[var(--text3)] uppercase tracking-[0.08em] mb-[3px]">
            Revenus
          </div>
          <div className="text-[17px] font-semibold text-[var(--green)] tracking-[-0.02em]">
            {fmt(stats.revenus)} €
          </div>
          {prevMonth && (
            <div className="text-[10px] font-medium text-[var(--green)] mt-0.5">
              {vsLabel(stats.revenus, prevMonth.revenus)}
            </div>
          )}
        </div>

        {/* Dépenses */}
        <div className="flex-1 text-center py-[10px] px-1 border-r border-[var(--border)]">
          <div className="text-[10px] text-[var(--text3)] uppercase tracking-[0.08em] mb-[3px]">
            Dépenses
          </div>
          <div className="text-[17px] font-semibold text-[var(--red)] tracking-[-0.02em]">
            {fmt(stats.depenses)} €
          </div>
          {prevMonth && (
            <div className="text-[10px] font-medium text-[var(--red)] mt-0.5">
              {vsLabel(stats.depenses, prevMonth.depenses)}
            </div>
          )}
        </div>

        {/* Solde courant — solde réel du compte (toutes transactions confondues) */}
        <div className="flex-1 text-center py-[10px] px-1">
          <div className="text-[10px] text-[var(--text3)] uppercase tracking-[0.08em] mb-[3px]">
            Solde
          </div>
          <div
            className={`text-[17px] font-semibold tracking-[-0.02em] ${
              soldeCourant >= 0 ? "text-[var(--orange)]" : "text-[var(--red)]"
            }`}
          >
            {soldeCourant >= 0 ? "" : "−"}{fmt(soldeCourant)} €
          </div>
          {/* Flux de la période sélectionnée en sous-titre */}
          <div
            className={`text-[10px] font-medium mt-0.5 ${
              periodNet >= 0 ? "text-[var(--green)]" : "text-[var(--red)]"
            }`}
          >
            {periodNet >= 0 ? "+" : "−"}{fmt(periodNet)} flux
          </div>
        </div>
      </div>

      {/* Historique mensuel — toujours complet, indépendant de la période */}
      <div className="flex flex-col px-0 pb-4">
        {/* En-tête colonnes */}
        <div className="flex items-center pb-[6px] pt-[2px] border-b border-[var(--border)]">
          <span className="text-[10px] text-[var(--text3)] uppercase tracking-[0.07em] flex-1">Mois</span>
          <span className="text-[10px] text-[var(--text3)] uppercase tracking-[0.07em] tabular-nums text-right w-[64px]">Revenu</span>
          <span className="text-[10px] text-[var(--text3)] uppercase tracking-[0.07em] tabular-nums text-right w-[64px]">Dépense</span>
          <span className="text-[10px] text-[var(--text3)] uppercase tracking-[0.07em] tabular-nums text-right w-[72px]">Solde</span>
        </div>

        {allParMois.map((m) => {
          const net = m.revenus - m.depenses;

          // Bornes du mois pour la navigation vers Transactions
          const [y, mo] = m.moisKey.split("-").map(Number);
          const lastDay = new Date(y, mo, 0).getDate();
          const dateFrom = `${m.moisKey}-01`;
          const dateTo   = `${m.moisKey}-${String(lastDay).padStart(2, "0")}`;

          return (
            <div
              key={m.moisKey}
              onClick={() => router.push(`/transactions?dateFrom=${dateFrom}&dateTo=${dateTo}`)}
              className="flex items-center py-[8px] border-b border-[var(--bg2)] cursor-pointer active:opacity-70 transition-opacity"
            >
              <span className="text-[13px] font-medium text-[var(--text)] flex-1">
                {m.mois}
              </span>
              <span className="text-[13px] font-medium text-[var(--green)] tabular-nums text-right w-[64px]">
                +{fmt(m.revenus)}
              </span>
              <span className="text-[13px] font-medium text-[var(--red)] tabular-nums text-right w-[64px]">
                −{fmt(m.depenses)}
              </span>
              <span
                className={`text-[13px] font-semibold tabular-nums text-right w-[72px] ${
                  net >= 0 ? "text-[var(--orange)]" : "text-[var(--red)]"
                }`}
              >
                {net >= 0 ? "+" : "−"}{fmt(net)} €
              </span>
            </div>
          );
        })}
        {allParMois.length === 0 && (
          <p className="text-[13px] text-[var(--text3)] text-center py-8">
            Aucune donnée
          </p>
        )}
      </div>
    </Shell>
  );
}
