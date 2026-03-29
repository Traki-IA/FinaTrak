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
import { fetchComptes } from "@/lib/comptes";
import type { TPeriod } from "@/types";

export const revalidate = 0;

const VALID_PERIODS: TPeriod[] = ["1m", "3m", "6m", "1a"];
const DATE_RE = /^\d{4}-\d{2}-\d{2}$/;

interface IDashboardPageProps {
  searchParams: Promise<{ compte?: string; period?: string; dateFrom?: string; dateTo?: string }>;
}

async function DashboardData({
  compteId,
  period,
  dateFrom,
  dateTo,
}: {
  compteId: string;
  period: TPeriod;
  dateFrom?: string;
  dateTo?: string;
}) {
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

export default async function DashboardPage({ searchParams }: IDashboardPageProps) {
  const params = await searchParams;

  // Résolution du compte actif depuis l'URL
  const comptes = await fetchComptes();
  const compteId = comptes.find((c) => c.id === params.compte)?.id ?? comptes[0]?.id ?? "";
  if (!compteId) return null;

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
      <DashboardData compteId={compteId} period={period} dateFrom={dateFrom} dateTo={dateTo} />
    </Suspense>
  );
}
