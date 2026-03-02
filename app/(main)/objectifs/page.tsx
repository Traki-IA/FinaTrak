import { Suspense } from "react";
import { fetchObjectifsWithBudgetLines } from "@/lib/objectifs";
import { fetchCategories } from "@/lib/transactions";
import ObjectifsContent from "./ObjectifsContent";
import ObjectifsSkeleton from "./ObjectifsSkeleton";
import { getActiveCompteId } from "@/lib/active-compte";

export const dynamic = "force-dynamic";

type TSearchParams = Promise<Record<string, string | string[] | undefined>>;

function parseCategoryIds(
  raw: Record<string, string | string[] | undefined>
): string[] {
  const value = raw.categories;
  if (typeof value === "string" && value) {
    return value.split(",").filter(Boolean);
  }
  return [];
}

async function ObjectifsData({
  searchParams,
}: {
  searchParams: TSearchParams;
}) {
  const [compteId, rawParams] = await Promise.all([
    getActiveCompteId(),
    searchParams,
  ]);

  const categoryIds = parseCategoryIds(rawParams);

  const [objectifs, categories] = await Promise.all([
    fetchObjectifsWithBudgetLines(compteId),
    fetchCategories(),
  ]);

  // Filtrer les objectifs dont au moins 1 budget_item correspond à une catégorie sélectionnée
  const filteredObjectifs =
    categoryIds.length > 0
      ? objectifs.filter((o) =>
          o.budget_lines.some(
            (bl) => bl.categorie_id && categoryIds.includes(bl.categorie_id)
          )
        )
      : objectifs;

  return (
    <ObjectifsContent
      objectifs={filteredObjectifs}
      categories={categories}
      compteId={compteId}
    />
  );
}

export default function ObjectifsPage({
  searchParams,
}: {
  searchParams: TSearchParams;
}) {
  return (
    <Suspense fallback={<ObjectifsSkeleton />}>
      <ObjectifsData searchParams={searchParams} />
    </Suspense>
  );
}
