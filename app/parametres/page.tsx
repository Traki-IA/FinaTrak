import { Suspense } from "react";
import ParametresContent from "./ParametresContent";
import { fetchSoldeInitial, fetchSoldeInitialIsSet } from "@/lib/dashboard";

export const dynamic = "force-dynamic";

async function ParametresData() {
  const [soldeInitial, isLocked] = await Promise.all([
    fetchSoldeInitial(),
    fetchSoldeInitialIsSet(),
  ]);
  return <ParametresContent soldeInitial={soldeInitial} isLocked={isLocked} />;
}

export default function ParametresPage() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-[#0a0a0f]" />}>
      <ParametresData />
    </Suspense>
  );
}
