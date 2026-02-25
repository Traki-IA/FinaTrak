import { Suspense } from "react";
import { fetchAllTransactions, fetchCategories } from "@/lib/transactions";
import { fetchObjectifs } from "@/lib/objectifs";
import { fetchBudgetItems } from "@/lib/budget";
import TransactionsContent from "./TransactionsContent";
import TransactionsSkeleton from "./TransactionsSkeleton";
import { getActiveCompteId } from "@/lib/active-compte";

export const dynamic = "force-dynamic";

async function TransactionsData() {
  const compteId = await getActiveCompteId();

  const [transactions, categories, objectifs, budgetItems] = await Promise.all([
    fetchAllTransactions(compteId),
    fetchCategories(),
    fetchObjectifs(compteId),
    fetchBudgetItems(compteId),
  ]);

  return (
    <TransactionsContent
      transactions={transactions}
      categories={categories}
      objectifs={objectifs}
      budgetItems={budgetItems}
      compteId={compteId}
    />
  );
}

export default function TransactionsPage() {
  return (
    <Suspense fallback={<TransactionsSkeleton />}>
      <TransactionsData />
    </Suspense>
  );
}
