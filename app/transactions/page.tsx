import { Suspense } from "react";
import { fetchAllTransactions, fetchCategories } from "@/lib/transactions";
import TransactionsContent from "./TransactionsContent";
import TransactionsSkeleton from "./TransactionsSkeleton";

export const dynamic = "force-dynamic";

async function TransactionsData() {
  const [transactions, categories] = await Promise.all([
    fetchAllTransactions(),
    fetchCategories(),
  ]);

  return (
    <TransactionsContent transactions={transactions} categories={categories} />
  );
}

export default function TransactionsPage() {
  return (
    <Suspense fallback={<TransactionsSkeleton />}>
      <TransactionsData />
    </Suspense>
  );
}
