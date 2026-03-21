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
  const [openMonth, setOpenMonth] = useState<string | null>(null);
  const [collapsedYears, setCollapsedYears] = useState<Set<string>>(new Set());

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

  // % d'évolution du solde sur la période : periodNet / solde_début_période × 100
  const soldeDebutPeriode = soldeCourant - periodNet;
  const evolutionPct =
    soldeDebutPeriode !== 0
      ? (periodNet / Math.abs(soldeDebutPeriode)) * 100
      : null;

  return (
    <Shell>
      <LogoHeader />

      {/* Carte Chart + Period tabs */}
      <div
        className="rounded-[14px] overflow-hidden"
        style={{ background: "var(--bg2)", border: "1px solid var(--border)" }}
      >
        <BalanceLine data={history} />
        <div className="px-[6px] pb-[6px]">
          <TabBar
            tabs={PERIOD_TABS}
            active={activePeriod}
            onChange={handlePeriodChange}
          />
        </div>
      </div>

      {/* Carte KPI principale */}
      <div
        className="mt-[10px] rounded-[14px] overflow-hidden"
        style={{ background: "var(--bg2)", border: "1px solid var(--border)" }}
      >
        {/* Solde courant */}
        {/* Header */}
        <div className="py-[5px] text-center" style={{ borderBottom: "1px solid var(--border)", background: "rgba(255,255,255,0.03)" }}>
          <span className="text-[9px] font-semibold text-[var(--text3)] uppercase tracking-[0.1em]">Solde courant</span>
        </div>
        {/* Valeur */}
        <div className="py-[8px] flex items-center justify-center gap-[10px]" style={{ borderBottom: "1px solid var(--border)" }}>
          <div className="flex items-center gap-[10px]">
            <div
              className={`text-[26px] font-bold tracking-[-0.03em] leading-none ${
                soldeCourant >= 0 ? "text-[var(--orange)]" : "text-[var(--red)]"
              }`}
            >
              {soldeCourant >= 0 ? "" : "−"}{fmt(soldeCourant)} €
            </div>
            {evolutionPct !== null && (
              <div
                className="inline-flex items-center gap-[3px] px-[8px] py-[4px] rounded-full text-[10px] font-semibold"
                style={{
                  background: evolutionPct >= 0 ? "rgba(74,222,128,0.10)" : "rgba(248,113,113,0.10)",
                  border: `1px solid ${evolutionPct >= 0 ? "rgba(74,222,128,0.25)" : "rgba(248,113,113,0.25)"}`,
                  color: evolutionPct >= 0 ? "var(--green)" : "var(--red)",
                }}
              >
                <span>{evolutionPct >= 0 ? "↑" : "↓"}</span>
                <span>
                  {evolutionPct >= 0 ? "+" : "−"}
                  {Math.abs(evolutionPct).toLocaleString("fr-FR", { minimumFractionDigits: 1, maximumFractionDigits: 1 })}%
                </span>
              </div>
            )}
          </div>
        </div>

        {/* Header colonnes */}
        <div className="flex" style={{ borderBottom: "1px solid var(--border)", background: "rgba(255,255,255,0.03)" }}>
          <div className="flex-1 text-center px-1 py-[4px]" style={{ borderRight: "1px solid var(--border)" }}>
            <span className="text-[9px] font-semibold text-[var(--text3)] uppercase tracking-[0.1em]">Revenus</span>
          </div>
          <div className="flex-1 text-center px-1 py-[4px]" style={{ borderRight: "1px solid var(--border)" }}>
            <span className="text-[9px] font-semibold text-[var(--text3)] uppercase tracking-[0.1em]">Dépenses</span>
          </div>
          <div className="flex-1 text-center px-1 py-[4px]">
            <span className="text-[9px] font-semibold text-[var(--text3)] uppercase tracking-[0.1em]">Flux net</span>
          </div>
        </div>

        {/* KPI 3 colonnes : valeurs */}
        <div className="flex">
          <div className="flex-1 text-center py-[7px] px-1" style={{ borderRight: "1px solid var(--border)" }}>
            <div className={`text-[16px] font-semibold tracking-[-0.02em] ${stats.revenus === 0 ? "text-[var(--text3)]" : "text-[var(--green)]"}`}>
              {fmt(stats.revenus)} €
            </div>
          </div>
          <div className="flex-1 text-center py-[7px] px-1" style={{ borderRight: "1px solid var(--border)" }}>
            <div className="text-[16px] font-semibold text-[var(--red)] tracking-[-0.02em]">
              {fmt(stats.depenses)} €
            </div>
          </div>
          <div className="flex-1 text-center py-[7px] px-1">
            <div className={`text-[16px] font-semibold tracking-[-0.02em] ${periodNet >= 0 ? "text-[var(--green)]" : "text-[var(--red)]"}`}>
              {periodNet >= 0 ? "+" : "−"}{fmt(periodNet)} €
            </div>
          </div>
        </div>
      </div>

      {/* Historique mensuel — accordion groupé par année */}
      <div className="flex flex-col gap-[6px] px-[2px] pb-4 mt-[10px]">


        {(() => {
          // Grouper par année
          const byYear: Record<string, number[]> = {};
          allParMois.forEach((m, i) => {
            const year = m.moisKey.split("-")[0];
            if (!byYear[year]) byYear[year] = [];
            byYear[year].push(i);
          });
          const years = Object.keys(byYear).sort((a, b) => Number(b) - Number(a));

          return years.map(year => {
            const isYearCollapsed = collapsedYears.has(year);
            return (
            <div key={year} className="flex flex-col gap-[6px]">
              {/* Séparateur année cliquable */}
              <div
                className="flex items-center gap-[8px] px-[2px] pt-[6px] pb-[2px] cursor-pointer select-none"
                onClick={() => setCollapsedYears(prev => {
                  const next = new Set(prev);
                  if (next.has(year)) next.delete(year); else next.add(year);
                  return next;
                })}
              >
                <span className="text-[11px] font-semibold text-[var(--text3)] tracking-[0.06em]">
                  {year}
                </span>
                <div className="flex-1 h-[1px]" style={{ background: "var(--border)" }} />
                <span
                  className="text-[var(--text3)] text-[10px] leading-none transition-transform duration-200 shrink-0"
                  style={{ transform: isYearCollapsed ? "rotate(-90deg)" : "rotate(0deg)" }}
                >
                  ▼
                </span>
              </div>

              {!isYearCollapsed && byYear[year].map(i => {
                const m = allParMois[i];
                const net = m.revenus - m.depenses;
                const prevNet = i < allParMois.length - 1 ? allParMois[i + 1].revenus - allParMois[i + 1].depenses : null;
                const evol =
                  prevNet !== null && prevNet !== 0
                    ? ((net - prevNet) / Math.abs(prevNet)) * 100
                    : null;
                const tauxEpargne =
                  m.revenus > 0 ? Math.round(((m.revenus - m.depenses) / m.revenus) * 100) : null;

                const isOpen = openMonth === m.moisKey;
                const dotColor = net >= 0 ? "var(--orange)" : "var(--red)";
                const netColor = net >= 0 ? "var(--orange)" : "var(--red)";
                const evolColor = evol === null ? "var(--text3)" : evol >= 0 ? "var(--green)" : "var(--red)";
                const evolBg = evol === null
                  ? "rgba(255,255,255,0.06)"
                  : evol >= 0
                  ? "rgba(74,222,128,0.10)"
                  : "rgba(248,113,113,0.10)";
                const evolBorder = evol === null
                  ? "rgba(255,255,255,0.10)"
                  : evol >= 0
                  ? "rgba(74,222,128,0.25)"
                  : "rgba(248,113,113,0.25)";

                const [y, mo] = m.moisKey.split("-").map(Number);
                const lastDay = new Date(y, mo, 0).getDate();
                const dateFrom = `${m.moisKey}-01`;
                const dateTo = `${m.moisKey}-${String(lastDay).padStart(2, "0")}`;

                return (
                  <div
                    key={m.moisKey}
                    className="rounded-[14px] overflow-hidden"
                    style={{ background: "var(--bg2)", border: "1px solid var(--border)" }}
                  >
                    {/* Header row */}
                    <div
                      className="flex items-center gap-[10px] px-[14px] py-[12px] cursor-pointer active:opacity-70 transition-opacity"
                      onClick={() => setOpenMonth(isOpen ? null : m.moisKey)}
                    >
                      <span
                        className="w-[7px] h-[7px] rounded-full shrink-0"
                        style={{ background: dotColor }}
                      />
                      <span className="text-[14px] font-semibold text-[var(--text)] flex-1 leading-none">
                        {m.mois}
                      </span>
                      <span
                        className="text-[14px] font-bold tabular-nums leading-none"
                        style={{ color: netColor }}
                      >
                        {net >= 0 ? "+" : "−"}{fmt(net)} €
                      </span>
                      <span
                        className="inline-flex items-center justify-center h-[20px] w-[60px] rounded-full text-[11px] font-semibold tabular-nums shrink-0"
                        style={{ background: evolBg, border: `1px solid ${evolBorder}`, color: evolColor }}
                      >
                        {evol === null
                          ? "—"
                          : `${evol >= 0 ? "+" : ""}${evol.toLocaleString("fr-FR", { minimumFractionDigits: 0, maximumFractionDigits: 0 })}%`}
                      </span>
                      <span
                        className="text-[var(--text3)] text-[10px] leading-none transition-transform duration-200 shrink-0"
                        style={{ transform: isOpen ? "rotate(180deg)" : "rotate(0deg)" }}
                      >
                        ▼
                      </span>
                    </div>

                    {/* Expanded detail */}
                    {isOpen && (
                      <div
                        className="px-[14px] pb-[14px] flex flex-col gap-[6px]"
                        style={{ borderTop: "1px solid var(--border)" }}
                      >
                        <div className="flex justify-between pt-[10px]">
                          <span className="text-[13px] text-[var(--text3)]">Revenus</span>
                          <span className="text-[13px] font-medium text-[var(--green)] tabular-nums">
                            {fmt(m.revenus)} €
                          </span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-[13px] text-[var(--text3)]">Dépenses</span>
                          <span className="text-[13px] font-medium text-[var(--red)] tabular-nums">
                            {fmt(m.depenses)} €
                          </span>
                        </div>
                        {tauxEpargne !== null && (
                          <div className="flex justify-between">
                            <span className="text-[13px] text-[var(--text3)]">Taux d&apos;épargne</span>
                            <span className="text-[13px] font-medium text-[var(--text)] tabular-nums">
                              {tauxEpargne}%
                            </span>
                          </div>
                        )}
                        {evol !== null && (
                          <div
                            className="flex justify-between pt-[6px]"
                            style={{ borderTop: "1px solid var(--border)" }}
                          >
                            <span className="text-[12px] text-[var(--text3)]">vs mois précédent</span>
                            <span
                              className="text-[12px] font-semibold tabular-nums"
                              style={{ color: evolColor }}
                            >
                              {evol >= 0 ? "+" : ""}{evol.toLocaleString("fr-FR", { minimumFractionDigits: 1, maximumFractionDigits: 1 })}%
                            </span>
                          </div>
                        )}
                        <button
                          className="mt-[4px] text-[11px] text-[var(--text3)] underline text-left"
                          onClick={() => router.push(`/transactions?dateFrom=${dateFrom}&dateTo=${dateTo}`)}
                        >
                          Voir les transactions →
                        </button>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          );
        });
        })()}

        {allParMois.length === 0 && (
          <p className="text-[13px] text-[var(--text3)] text-center py-8">
            Aucune donnée
          </p>
        )}
      </div>
    </Shell>
  );
}
