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

      {/* Hero Solde courant — centré */}
      <div className="py-[12px] border-b border-[var(--border)] flex flex-col items-center gap-[8px]" style={{ background: "var(--bg2)" }}>
        <div className="text-[10px] text-[var(--text3)] uppercase tracking-[0.1em]">
          Solde courant
        </div>

        <div className="flex items-center gap-[10px]">
          <div
            className={`text-[26px] font-bold tracking-[-0.03em] leading-none ${
              soldeCourant >= 0 ? "text-[var(--orange)]" : "text-[var(--red)]"
            }`}
          >
            {soldeCourant >= 0 ? "" : "−"}{fmt(soldeCourant)} €
          </div>

          {/* Badge % évolution */}
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

      {/* KPI 3 colonnes : Revenus / Dépenses / Flux net */}
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
        </div>

        {/* Dépenses */}
        <div className="flex-1 text-center py-[10px] px-1 border-r border-[var(--border)]">
          <div className="text-[10px] text-[var(--text3)] uppercase tracking-[0.08em] mb-[3px]">
            Dépenses
          </div>
          <div className="text-[17px] font-semibold text-[var(--red)] tracking-[-0.02em]">
            {fmt(stats.depenses)} €
          </div>
        </div>

        {/* Flux net de la période */}
        <div className="flex-1 text-center py-[10px] px-1">
          <div className="text-[10px] text-[var(--text3)] uppercase tracking-[0.08em] mb-[3px]">
            Flux net
          </div>
          <div
            className={`text-[17px] font-semibold tracking-[-0.02em] ${
              periodNet >= 0 ? "text-[var(--green)]" : "text-[var(--red)]"
            }`}
          >
            {periodNet >= 0 ? "+" : "−"}{fmt(periodNet)} €
          </div>
        </div>
      </div>

      {/* Historique mensuel — accordion */}
      <div className="flex flex-col gap-[6px] px-[2px] pb-4">
        <p className="text-[10px] text-[var(--text3)] uppercase tracking-[0.1em] px-[2px] pt-[2px] pb-[4px]">
          Historique
        </p>

        {allParMois.map((m, i) => {
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
                <span className="text-[14px] font-semibold text-[var(--text)] flex-1">
                  {m.mois}
                </span>
                <span
                  className="text-[14px] font-bold tabular-nums"
                  style={{ color: netColor }}
                >
                  {net >= 0 ? "+" : "−"}{fmt(net)} €
                </span>
                <span
                  className="text-[10px] font-semibold px-[7px] py-[3px] rounded-full tabular-nums"
                  style={{ background: evolBg, border: `1px solid ${evolBorder}`, color: evolColor }}
                >
                  {evol === null
                    ? "—"
                    : `${evol >= 0 ? "+" : ""}${evol.toLocaleString("fr-FR", { minimumFractionDigits: 0, maximumFractionDigits: 0 })}%`}
                </span>
                <span
                  className="text-[var(--text3)] text-[10px] transition-transform duration-200"
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

        {allParMois.length === 0 && (
          <p className="text-[13px] text-[var(--text3)] text-center py-8">
            Aucune donnée
          </p>
        )}
      </div>
    </Shell>
  );
}
