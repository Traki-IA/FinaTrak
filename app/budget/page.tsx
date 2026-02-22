import { Suspense } from "react";
import { fetchBudgetItems } from "@/lib/budget";
import { fetchCategories } from "@/lib/transactions";
import { fetchObjectifs } from "@/lib/objectifs";
import BudgetContent from "./BudgetContent";
import BudgetSkeleton from "./BudgetSkeleton";

export const dynamic = "force-dynamic";

async function BudgetData() {
  const [items, categories, objectifs] = await Promise.all([
    fetchBudgetItems(),
    fetchCategories(),
    fetchObjectifs(),
  ]);

  return (
    <BudgetContent
      items={items}
      categories={categories}
      objectifs={objectifs}
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
