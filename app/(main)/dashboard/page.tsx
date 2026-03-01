import { Suspense } from "react";

export const dynamic = "force-dynamic";
import DashboardContent from "./DashboardContent";
import DashboardSkeleton from "./DashboardSkeleton";
import {
  fetchDashboardStats,
  fetchRecentTransactions,
  fetchDepensesParCategorie,
  fetchBalanceHistory,
} from "@/lib/dashboard";
import { getActiveCompteId } from "@/lib/active-compte";

// ── Chargement des données côté serveur ──────────────────────────────────────

async function DashboardData() {
  const compteId = await getActiveCompteId();

  const [stats, transactions, categories, history] = await Promise.all([
    fetchDashboardStats(compteId),
    fetchRecentTransactions(compteId),
    fetchDepensesParCategorie(compteId),
    fetchBalanceHistory(compteId),
  ]);

  const moisLabel = new Date().toLocaleDateString("fr-FR", {
    month: "long",
    year: "numeric",
  });

  return (
    <DashboardContent
      stats={stats}
      transactions={transactions}
      categories={categories}
      history={history}
      moisLabel={moisLabel}
    />
  );
}

// ── Page — Suspense affiche le skeleton pendant le fetch ─────────────────────

export default function DashboardPage() {
  return (
    <Suspense fallback={<DashboardSkeleton />}>
      <DashboardData />
    </Suspense>
  );
}
