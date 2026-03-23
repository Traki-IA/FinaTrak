import { Suspense } from "react";
import DashboardContent from "./DashboardContent";
import DashboardSkeleton from "./DashboardSkeleton";
import {
  fetchDashboardStats,
  fetchDepensesParCategorie,
  fetchBalanceHistory,
  fetchRevenusDepensesParMois,
  fetchAllRevenusDepensesParMois,
} from "@/lib/dashboard";
import { getActiveCompteId } from "@/lib/active-compte";
import type { TPeriod } from "@/types";

export const revalidate = 30;

const VALID_PERIODS: TPeriod[] = ["1m", "3m", "6m", "1a"];
const DATE_RE = /^\d{4}-\d{2}-\d{2}$/;

// ── Chargement des données côté serveur ──────────────────────────────────────

async function DashboardData({
  period,
  dateFrom,
  dateTo,
}: {
  period: TPeriod;
  dateFrom?: string;
  dateTo?: string;
}) {
  const compteId = (await getActiveCompteId()) ?? "";

  if (!compteId) {
    return (
      <DashboardContent
        stats={{ soldeInitial: 0, soldeTotal: 0, revenus: 0, depenses: 0, epargne: 0, tauxEpargne: 0 }}
        categories={[]}
        history={[]}
        parMois={[]}
        allParMois={[]}
        period={period}
        dateFrom={dateFrom}
        dateTo={dateTo}
      />
    );
  }

  const [stats, categories, history, parMois, allParMois] = await Promise.all([
    fetchDashboardStats(compteId, period, dateFrom, dateTo),
    fetchDepensesParCategorie(compteId, period, dateFrom, dateTo),
    fetchBalanceHistory(compteId, period, dateFrom, dateTo),
    fetchRevenusDepensesParMois(compteId, period, dateFrom, dateTo),
    fetchAllRevenusDepensesParMois(compteId),
  ]);

  return (
    <DashboardContent
      stats={stats}
      categories={categories}
      history={history}
      parMois={parMois}
      allParMois={allParMois}
      period={period}
      dateFrom={dateFrom}
      dateTo={dateTo}
    />
  );
}

// ── Page — Suspense affiche le skeleton pendant le fetch ─────────────────────

interface IDashboardPageProps {
  searchParams: Promise<{ period?: string; dateFrom?: string; dateTo?: string }>;
}

export default async function DashboardPage({ searchParams }: IDashboardPageProps) {
  const params = await searchParams;

  const dateFrom = DATE_RE.test(params.dateFrom ?? "") ? params.dateFrom : undefined;
  const dateTo   = DATE_RE.test(params.dateTo ?? "")   ? params.dateTo   : undefined;

  let period: TPeriod;
  if (params.period === "custom" && dateFrom && dateTo) {
    period = "custom";
  } else if (VALID_PERIODS.includes(params.period as TPeriod)) {
    period = params.period as TPeriod;
  } else {
    period = "1m";
  }

  return (
    <Suspense fallback={<DashboardSkeleton />}>
      <DashboardData period={period} dateFrom={dateFrom} dateTo={dateTo} />
    </Suspense>
  );
}
