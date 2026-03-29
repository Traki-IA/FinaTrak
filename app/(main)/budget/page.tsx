import { Suspense } from "react";
import { fetchBudgetItems } from "@/lib/budget";
import { fetchCategories } from "@/lib/transactions";
import { fetchObjectifs } from "@/lib/objectifs";
import { fetchComptes } from "@/lib/comptes";
import BudgetContent from "./BudgetContent";
import BudgetSkeleton from "./BudgetSkeleton";

export const revalidate = 0;

type TRawSearchParams = Record<string, string | string[] | undefined>;

async function BudgetData({ searchParams }: { searchParams: Promise<TRawSearchParams> }) {
  const [comptes, rawParams] = await Promise.all([fetchComptes(), searchParams]);
  const compteId = comptes.find((c) => c.id === rawParams.compte)?.id ?? comptes[0]?.id ?? "";

  const [items, categories, objectifs] = await Promise.all([
    fetchBudgetItems(compteId),
    fetchCategories(),
    fetchObjectifs(compteId),
  ]);

  return (
    <BudgetContent
      items={items}
      categories={categories}
      objectifs={objectifs}
      compteId={compteId}
    />
  );
}

export default function BudgetPage({ searchParams }: { searchParams: Promise<TRawSearchParams> }) {
  return (
    <Suspense fallback={<BudgetSkeleton />}>
      <BudgetData searchParams={searchParams} />
    </Suspense>
  );
}
