import { Suspense } from "react";
import BilanContent from "./BilanContent";
import BilanSkeleton from "./BilanSkeleton";
import {
  fetchRevenusDepensesParMois,
  fetchDashboardStats,
} from "@/lib/dashboard";
import { getActiveCompteId } from "@/lib/active-compte";

export const dynamic = "force-dynamic";

async function BilanData() {
  const compteId = await getActiveCompteId();

  const [parMois, stats] = await Promise.all([
    fetchRevenusDepensesParMois(compteId, "6m"),
    fetchDashboardStats(compteId, "6m"),
  ]);

  return <BilanContent parMois={parMois} stats={stats} />;
}

export default function BilanPage() {
  return (
    <Suspense fallback={<BilanSkeleton />}>
      <BilanData />
    </Suspense>
  );
}
