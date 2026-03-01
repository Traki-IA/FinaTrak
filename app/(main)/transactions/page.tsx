import { Suspense } from "react";
import { fetchAllTransactions, fetchCategories } from "@/lib/transactions";
import { fetchObjectifs } from "@/lib/objectifs";
import { fetchBudgetItems } from "@/lib/budget";
import TransactionsContent from "./TransactionsContent";
import TransactionsSkeleton from "./TransactionsSkeleton";
import { getActiveCompteId } from "@/lib/active-compte";
import type { TTransactionFilters } from "@/types";

export const dynamic = "force-dynamic";

// ── Helpers ──────────────────────────────────────────────────────────────────

type TRawSearchParams = Record<string, string | string[] | undefined>;

function parseFilters(params: TRawSearchParams): TTransactionFilters {
  const filters: TTransactionFilters = {};

  if (typeof params.dateDebut === "string" && params.dateDebut) {
    filters.dateDebut = params.dateDebut;
  }
  if (typeof params.dateFin === "string" && params.dateFin) {
    filters.dateFin = params.dateFin;
  }
  if (params.type === "depense" || params.type === "revenu") {
    filters.type = params.type;
  }
  if (typeof params.categories === "string" && params.categories) {
    const ids = params.categories.split(",").filter(Boolean);
    if (ids.length > 0) filters.categorie_ids = ids;
  }
  if (typeof params.montantMin === "string" && params.montantMin) {
    const n = Number(params.montantMin);
    if (!Number.isNaN(n)) filters.montant_min = n;
  }
  if (typeof params.montantMax === "string" && params.montantMax) {
    const n = Number(params.montantMax);
    if (!Number.isNaN(n)) filters.montant_max = n;
  }

  return filters;
}

// ── Data fetcher (inside Suspense) ───────────────────────────────────────────

async function TransactionsData({
  searchParams,
}: {
  searchParams: Promise<TRawSearchParams>;
}) {
  const [compteId, rawParams] = await Promise.all([
    getActiveCompteId(),
    searchParams,
  ]);

  const filters = parseFilters(rawParams);

  const [transactions, categories, objectifs, budgetItems] = await Promise.all([
    fetchAllTransactions(compteId, filters),
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

// ── Page ──────────────────────────────────────────────────────────────────────

export default async function TransactionsPage({
  searchParams,
}: {
  searchParams: Promise<TRawSearchParams>;
}) {
  return (
    <Suspense fallback={<TransactionsSkeleton />}>
      <TransactionsData searchParams={searchParams} />
    </Suspense>
  );
}
