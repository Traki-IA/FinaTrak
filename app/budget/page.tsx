import { Suspense } from "react";
import { fetchBudgetItems } from "@/lib/budget";
import { fetchCategories } from "@/lib/transactions";
import { fetchObjectifs } from "@/lib/objectifs";
import BudgetContent from "./BudgetContent";
import BudgetSkeleton from "./BudgetSkeleton";
import { getActiveCompteId } from "@/lib/active-compte";

export const dynamic = "force-dynamic";

async function BudgetData() {
  const compteId = await getActiveCompteId();

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

export default function BudgetPage() {
  return (
    <Suspense fallback={<BudgetSkeleton />}>
      <BudgetData />
    </Suspense>
  );
}
