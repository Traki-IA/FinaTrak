import { Suspense } from "react";
import DashboardContent from "./DashboardContent";
import DashboardSkeleton from "./DashboardSkeleton";
import {
  fetchDashboardStats,
  fetchRecentTransactions,
  fetchDepensesParCategorie,
  fetchBalanceHistory,
  fetchRevenusDepensesParMois,
  fetchDepensesParCategorieDetailed,
} from "@/lib/dashboard";
import { getActiveCompteId } from "@/lib/active-compte";
import type { TPeriod } from "@/types";

export const dynamic = "force-dynamic";

const VALID_PERIODS: TPeriod[] = ["1m", "3m", "6m", "1y"];

// ── Chargement des données côté serveur ──────────────────────────────────────

async function DashboardData({ period }: { period: TPeriod }) {
  const compteId = await getActiveCompteId();

  const [stats, transactions, categories, history, parMois, categoriesDetailed] =
    await Promise.all([
      fetchDashboardStats(compteId, period),
      fetchRecentTransactions(compteId),
      fetchDepensesParCategorie(compteId, period),
      fetchBalanceHistory(compteId, period),
      fetchRevenusDepensesParMois(compteId, period),
      fetchDepensesParCategorieDetailed(compteId, period),
    ]);

  return (
    <DashboardContent
      stats={stats}
      transactions={transactions}
      categories={categories}
      history={history}
      parMois={parMois}
      categoriesDetailed={categoriesDetailed}
      period={period}
    />
  );
}

// ── Page — Suspense affiche le skeleton pendant le fetch ─────────────────────

interface IDashboardPageProps {
  searchParams: Promise<{ period?: string }>;
}

export default async function DashboardPage({ searchParams }: IDashboardPageProps) {
  const params = await searchParams;
  const period = (VALID_PERIODS.includes(params.period as TPeriod)
    ? params.period
    : "1m") as TPeriod;

  return (
    <Suspense fallback={<DashboardSkeleton />}>
      <DashboardData period={period} />
    </Suspense>
  );
}
