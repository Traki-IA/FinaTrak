import { Suspense } from "react";
import { fetchObjectifsWithBudgetLines } from "@/lib/objectifs";
import { fetchCategories } from "@/lib/transactions";
import { fetchComptes } from "@/lib/comptes";
import ObjectifsContent from "./ObjectifsContent";
import ObjectifsSkeleton from "./ObjectifsSkeleton";

export const revalidate = 0;

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
  const [comptes, rawParams] = await Promise.all([fetchComptes(), searchParams]);
  const compteId = comptes.find((c) => c.id === rawParams.compte)?.id ?? comptes[0]?.id ?? "";

  const categoryIds = parseCategoryIds(rawParams);

  const [objectifs, categories] = await Promise.all([
    fetchObjectifsWithBudgetLines(compteId),
    fetchCategories(),
  ]);

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
