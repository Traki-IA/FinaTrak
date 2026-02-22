import { Suspense } from "react";
import { fetchAllTransactions, fetchCategories } from "@/lib/transactions";
import { fetchObjectifs } from "@/lib/objectifs";
import TransactionsContent from "./TransactionsContent";
import TransactionsSkeleton from "./TransactionsSkeleton";

export const dynamic = "force-dynamic";

async function TransactionsData() {
  const [transactions, categories, objectifs] = await Promise.all([
    fetchAllTransactions(),
    fetchCategories(),
    fetchObjectifs(),
  ]);

  return (
    <TransactionsContent
      transactions={transactions}
      categories={categories}
      objectifs={objectifs}
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
