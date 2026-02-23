"use client";

import { useState, useEffect, useMemo } from "react";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence, Reorder, useDragControls } from "framer-motion";
import {
  Plus,
  Trash2,
  Loader2,
  Receipt,
  TrendingDown,
  CalendarDays,
  Link2,
  Pencil,
  GripVertical,
  Filter,
  ArrowUpDown,
  X,
} from "lucide-react";
import { toast } from "sonner";
import { Card, CardContent } from "@/components/ui/card";
import BudgetModal from "./BudgetModal";
import { toggleBudgetItem, deleteBudgetItem } from "./actions";
import type { TBudgetItemWithRelations, TCategorie, TObjectif } from "@/types";

const STORAGE_KEY_MENSUEL = "finatrak_budget_mensuel_order";
const STORAGE_KEY_ANNUEL = "finatrak_budget_annuel_order";

// ── Helpers ───────────────────────────────────────────────────────────────────

function formatEur(n: number) {
  return new Intl.NumberFormat("fr-FR", {
    style: "currency",
    currency: "EUR",
  }).format(n);
}

function annualise(montant: number, frequence: "mensuel" | "annuel"): number {
  return frequence === "mensuel" ? montant * 12 : montant;
}

function mensualise(montant: number, frequence: "mensuel" | "annuel"): number {
  return frequence === "annuel" ? montant / 12 : montant;
}

function applyStoredOrder(
  items: TBudgetItemWithRelations[],
  storageKey: string
): TBudgetItemWithRelations[] {
  try {
    const stored = localStorage.getItem(storageKey);
    if (stored) {
      const order: string[] = JSON.parse(stored);
      return [...items].sort((a, b) => {
        const ia = order.indexOf(a.id);
        const ib = order.indexOf(b.id);
        if (ia === -1) return 1;
        if (ib === -1) return -1;
        return ia - ib;
      });
    }
  } catch {
    // ignore
  }
  return items;
}

// ── KPI Card ──────────────────────────────────────────────────────────────────

function KpiCard({
  label,
  value,
  sub,
  icon,
  color,
}: {
  label: string;
  value: string;
  sub: string;
  icon: React.ReactNode;
  color: string;
}) {
  return (
    <Card>
      <CardContent>
        <div className="flex items-center justify-between mb-3">
          <p className="text-[10px] text-white/40 uppercase tracking-widest">
            {label}
          </p>
          <span
            className="p-1.5 rounded-lg"
            style={{ background: `${color}18`, color }}
          >
            {icon}
          </span>
        </div>
        <p className="text-2xl font-bold text-white tabular-nums leading-none">
          {value}
        </p>
        <p className="text-xs text-white/35 mt-2">{sub}</p>
      </CardContent>
    </Card>
  );
}

// ── Toggle switch ─────────────────────────────────────────────────────────────

function Toggle({
  checked,
  onChange,
  disabled,
}: {
  checked: boolean;
  onChange: (v: boolean) => void;
  disabled?: boolean;
}) {
  return (
    <button
      type="button"
      disabled={disabled}
      onClick={() => onChange(!checked)}
      className={`relative inline-flex h-5 w-9 items-center rounded-full transition-colors flex-shrink-0 ${
        checked ? "bg-orange-500" : "bg-white/[0.15]"
      } disabled:opacity-50 disabled:cursor-not-allowed`}
    >
      <span
        className={`inline-block h-3.5 w-3.5 rounded-full bg-white shadow transition-transform ${
          checked ? "translate-x-[18px]" : "translate-x-[2px]"
        }`}
      />
    </button>
  );
}

// ── Budget Item Row ───────────────────────────────────────────────────────────

function BudgetItemRow({
  item,
  onEdit,
  isDraggable,
}: {
  item: TBudgetItemWithRelations;
  onEdit: () => void;
  isDraggable: boolean;
}) {
  const controls = useDragControls();
  const router = useRouter();
  const [toggling, setToggling] = useState(false);
  const [deleting, setDeleting] = useState(false);

  async function handleToggle(actif: boolean) {
    setToggling(true);
    const result = await toggleBudgetItem(item.id, actif);
    setToggling(false);
    if ("error" in result) {
      toast.error(result.error);
      return;
    }
    router.refresh();
  }

  async function handleDelete() {
    setDeleting(true);
    const result = await deleteBudgetItem(item.id);
    setDeleting(false);
    if ("error" in result) {
      toast.error(result.error);
      return;
    }
    toast.success("Charge supprimée");
    router.refresh();
  }

  const couleur = item.categories?.couleur ?? "#94a3b8";

  const rowContent = (
    <div
      className={`flex items-center gap-3 px-3 py-2.5 rounded-xl border transition-colors w-full ${
        item.actif
          ? "bg-white/[0.04] border-white/[0.07] hover:border-white/[0.12]"
          : "bg-white/[0.01] border-white/[0.04] opacity-50"
      }`}
    >
      {/* Drag handle */}
      {isDraggable && (
        <GripVertical
          size={15}
          className="text-white/20 hover:text-white/50 cursor-grab active:cursor-grabbing flex-shrink-0 touch-none"
          onPointerDown={(e) => controls.start(e)}
        />
      )}

      {/* Category icon */}
      <div
        className="w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0 text-xs font-bold"
        style={{ background: `${couleur}18`, color: couleur }}
      >
        {item.nom[0]?.toUpperCase()}
      </div>

      {/* Info */}
      <div className="flex-1 min-w-0">
        <p className="text-sm font-medium text-white truncate">{item.nom}</p>
        <div className="flex items-center flex-wrap gap-x-1.5 gap-y-0.5 mt-0.5">
          {item.categories && (
            <span
              className="text-[10px] px-1.5 py-0.5 rounded-md font-medium"
              style={{
                background: `${couleur}18`,
                color: couleur,
              }}
            >
              {item.categories.nom}
            </span>
          )}
          {item.objectifs && (
            <span className="text-[10px] px-1.5 py-0.5 rounded-md bg-orange-500/10 text-orange-400 flex items-center gap-1">
              <Link2 size={9} />
              {item.objectifs.nom}
            </span>
          )}
        </div>
      </div>

      {/* Amount */}
      <div className="text-right flex-shrink-0">
        <p className="text-sm font-semibold text-white tabular-nums">
          {formatEur(item.montant)}
        </p>
        <p className="text-[10px] text-white/35">
          /{item.frequence === "mensuel" ? "mois" : "an"}
        </p>
      </div>

      {/* Toggle */}
      <Toggle
        checked={item.actif}
        onChange={handleToggle}
        disabled={toggling}
      />

      {/* Edit */}
      <button
        onClick={onEdit}
        className="text-white/25 hover:text-white transition-colors p-1.5 rounded-lg hover:bg-white/[0.07] flex-shrink-0"
        title="Modifier"
      >
        <Pencil size={13} />
      </button>

      {/* Delete */}
      <button
        onClick={handleDelete}
        disabled={deleting}
        className="text-white/25 hover:text-red-400 transition-colors p-1.5 rounded-lg hover:bg-red-500/10 flex-shrink-0 disabled:opacity-50"
        title="Supprimer"
      >
        {deleting ? (
          <Loader2 size={13} className="animate-spin" />
        ) : (
          <Trash2 size={13} />
        )}
      </button>
    </div>
  );

  if (!isDraggable) {
    return (
      <motion.div
        layout
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, x: -16 }}
        transition={{ duration: 0.22 }}
      >
        {rowContent}
      </motion.div>
    );
  }

  return (
    <Reorder.Item
      value={item}
      dragListener={false}
      dragControls={controls}
      layout
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, x: -16 }}
      transition={{ duration: 0.22 }}
      as="div"
    >
      {rowContent}
    </Reorder.Item>
  );
}

// ── Empty state ───────────────────────────────────────────────────────────────

function EmptyState({ onAdd }: { onAdd: () => void }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="flex flex-col items-center justify-center py-24 text-center"
    >
      <div className="w-14 h-14 rounded-2xl bg-orange-500/10 flex items-center justify-center mb-4">
        <Receipt size={24} className="text-orange-400" />
      </div>
      <p className="text-white font-semibold mb-1">Aucune charge planifiée</p>
      <p className="text-white/40 text-sm mb-6">
        Ajoutez vos charges fixes pour visualiser votre budget annuel
      </p>
      <button
        onClick={onAdd}
        className="flex items-center gap-2 bg-orange-500 hover:bg-orange-600 text-white px-5 py-2.5 rounded-xl font-medium text-sm transition-colors"
      >
        <Plus size={16} />
        Ajouter une charge
      </button>
    </motion.div>
  );
}

// ── Section with drag-and-drop ────────────────────────────────────────────────

function Section({
  title,
  icon,
  items,
  totalLabel,
  total,
  storageKey,
  onEdit,
  isDraggable,
}: {
  title: string;
  icon: React.ReactNode;
  items: TBudgetItemWithRelations[];
  totalLabel: string;
  total: number;
  storageKey: string;
  onEdit: (item: TBudgetItemWithRelations) => void;
  isDraggable: boolean;
}) {
  const [orderedItems, setOrderedItems] = useState<TBudgetItemWithRelations[]>(
    () => applyStoredOrder(items, storageKey)
  );

  useEffect(() => {
    setOrderedItems(applyStoredOrder(items, storageKey));
  }, [items, storageKey]);

  function handleReorder(newItems: TBudgetItemWithRelations[]) {
    setOrderedItems(newItems);
    try {
      localStorage.setItem(
        storageKey,
        JSON.stringify(newItems.map((i) => i.id))
      );
    } catch {
      // ignore
    }
  }

  if (items.length === 0) return null;

  return (
    <div className="mb-6">
      <div className="flex items-center justify-between mb-2">
        <div className="flex items-center gap-2 text-white/60 text-sm font-medium">
          {icon}
          {title}
          <span className="text-white/25 text-xs font-normal ml-1">
            ({items.length})
          </span>
        </div>
        <span className="text-xs text-white/40">
          {totalLabel} :{" "}
          <span className="text-white/70 font-medium">{formatEur(total)}</span>
        </span>
      </div>

      {isDraggable ? (
        <Reorder.Group
          axis="y"
          values={orderedItems}
          onReorder={handleReorder}
          as="div"
          className="space-y-1.5"
        >
          <AnimatePresence>
            {orderedItems.map((item) => (
              <BudgetItemRow
                key={item.id}
                item={item}
                onEdit={() => onEdit(item)}
                isDraggable
              />
            ))}
          </AnimatePresence>
        </Reorder.Group>
      ) : (
        <div className="space-y-1.5">
          <AnimatePresence>
            {orderedItems.map((item) => (
              <BudgetItemRow
                key={item.id}
                item={item}
                onEdit={() => onEdit(item)}
                isDraggable={false}
              />
            ))}
          </AnimatePresence>
        </div>
      )}
    </div>
  );
}

// ── Filter bar ────────────────────────────────────────────────────────────────

function FilterSelect({
  value,
  onChange,
  children,
}: {
  value: string;
  onChange: (v: string) => void;
  children: React.ReactNode;
}) {
  return (
    <select
      value={value}
      onChange={(e) => onChange(e.target.value)}
      className="bg-white/[0.05] border border-white/[0.1] text-white text-xs rounded-xl px-3 py-2 outline-none focus:border-orange-500/50 transition-colors cursor-pointer"
      style={{ colorScheme: "dark" }}
    >
      {children}
    </select>
  );
}

// ── Composant principal ───────────────────────────────────────────────────────

interface IBudgetContentProps {
  items: TBudgetItemWithRelations[];
  categories: TCategorie[];
  objectifs: TObjectif[];
}

type TSortKey = "default" | "nom_asc" | "nom_desc" | "montant_asc" | "montant_desc";

export default function BudgetContent({
  items,
  categories,
  objectifs,
}: IBudgetContentProps) {
  const [modalOpen, setModalOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<
    TBudgetItemWithRelations | undefined
  >(undefined);

  // Filters
  const [filterCategorie, setFilterCategorie] = useState("all");
  const [filterStatut, setFilterStatut] = useState("all");
  const [sortKey, setSortKey] = useState<TSortKey>("default");

  const hasActiveFilters =
    filterCategorie !== "all" || filterStatut !== "all" || sortKey !== "default";

  const isDefaultOrder = sortKey === "default" && !hasActiveFilters;

  // Categories present in budget items (for filter dropdown)
  const budgetCategories = useMemo(() => {
    const seen = new Set<string>();
    const cats: TCategorie[] = [];
    for (const item of items) {
      if (item.categories && !seen.has(item.categories.id)) {
        seen.add(item.categories.id);
        cats.push(item.categories);
      }
    }
    return cats.sort((a, b) => a.nom.localeCompare(b.nom));
  }, [items]);

  // Apply filters and sort
  const filteredItems = useMemo(() => {
    let result = [...items];

    if (filterCategorie !== "all") {
      result = result.filter((i) => i.categorie_id === filterCategorie);
    }
    if (filterStatut === "actif") {
      result = result.filter((i) => i.actif);
    } else if (filterStatut === "inactif") {
      result = result.filter((i) => !i.actif);
    }

    if (sortKey === "nom_asc") {
      result.sort((a, b) => a.nom.localeCompare(b.nom));
    } else if (sortKey === "nom_desc") {
      result.sort((a, b) => b.nom.localeCompare(a.nom));
    } else if (sortKey === "montant_asc") {
      result.sort(
        (a, b) =>
          mensualise(a.montant, a.frequence) -
          mensualise(b.montant, b.frequence)
      );
    } else if (sortKey === "montant_desc") {
      result.sort(
        (a, b) =>
          mensualise(b.montant, b.frequence) -
          mensualise(a.montant, a.frequence)
      );
    }

    return result;
  }, [items, filterCategorie, filterStatut, sortKey]);

  const mensuels = filteredItems.filter((i) => i.frequence === "mensuel");
  const annuels = filteredItems.filter((i) => i.frequence === "annuel");

  const actifs = items.filter((i) => i.actif);
  const budgetMensuel = actifs.reduce(
    (sum, i) => sum + mensualise(i.montant, i.frequence),
    0
  );
  const budgetAnnuel = actifs.reduce(
    (sum, i) => sum + annualise(i.montant, i.frequence),
    0
  );

  const totalMensuels = mensuels
    .filter((i) => i.actif)
    .reduce((s, i) => s + i.montant, 0);
  const totalAnnuels = annuels
    .filter((i) => i.actif)
    .reduce((s, i) => s + i.montant, 0);

  const linkedObjectifs = new Set(
    items.filter((i) => i.objectif_id).map((i) => i.objectif_id)
  ).size;

  function openAddModal() {
    setEditingItem(undefined);
    setModalOpen(true);
  }

  function openEditModal(item: TBudgetItemWithRelations) {
    setEditingItem(item);
    setModalOpen(true);
  }

  function resetFilters() {
    setFilterCategorie("all");
    setFilterStatut("all");
    setSortKey("default");
  }

  return (
    <main className="min-h-screen bg-background p-6 md:p-8">
      {/* ── Header ── */}
      <motion.div
        initial={{ opacity: 0, y: -16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3 }}
        className="flex items-start justify-between mb-8"
      >
        <div>
          <h1 className="text-2xl font-bold text-white">Budget annuel</h1>
          <p className="text-white/40 text-sm mt-1">
            {items.length} charge{items.length !== 1 ? "s" : ""} planifiée
            {items.length !== 1 ? "s" : ""}
            {actifs.length !== items.length && (
              <span className="text-white/25 ml-1">
                · {actifs.length} active{actifs.length !== 1 ? "s" : ""}
              </span>
            )}
          </p>
        </div>

        {items.length > 0 && (
          <motion.button
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.97 }}
            onClick={openAddModal}
            className="flex items-center gap-2 bg-orange-500 hover:bg-orange-600 text-white px-4 py-2.5 rounded-xl font-medium text-sm transition-colors"
          >
            <Plus size={16} />
            Ajouter
          </motion.button>
        )}
      </motion.div>

      {items.length === 0 ? (
        <EmptyState onAdd={openAddModal} />
      ) : (
        <>
          {/* ── KPIs ── */}
          <motion.div
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.08, duration: 0.35 }}
            className="grid grid-cols-1 sm:grid-cols-3 gap-3 mb-8"
          >
            <KpiCard
              label="Budget mensuel"
              value={formatEur(budgetMensuel)}
              sub="Charges fixes / mois"
              icon={<TrendingDown size={16} />}
              color="#f97316"
            />
            <KpiCard
              label="Budget annuel"
              value={formatEur(budgetAnnuel)}
              sub="Projection sur 12 mois"
              icon={<CalendarDays size={16} />}
              color="#6366f1"
            />
            <KpiCard
              label="Objectifs liés"
              value={String(linkedObjectifs)}
              sub={`sur ${items.length} charge${items.length !== 1 ? "s" : ""}`}
              icon={<Link2 size={16} />}
              color="#14b8a6"
            />
          </motion.div>

          {/* ── Filter bar ── */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.12, duration: 0.3 }}
            className="flex flex-wrap items-center gap-2 mb-5"
          >
            <Filter size={13} className="text-white/30 flex-shrink-0" />

            {/* Category filter */}
            <FilterSelect
              value={filterCategorie}
              onChange={setFilterCategorie}
            >
              <option value="all" className="bg-[#0f0f1a]">
                Toutes catégories
              </option>
              {budgetCategories.map((cat) => (
                <option key={cat.id} value={cat.id} className="bg-[#0f0f1a]">
                  {cat.nom}
                </option>
              ))}
            </FilterSelect>

            {/* Status filter */}
            <FilterSelect value={filterStatut} onChange={setFilterStatut}>
              <option value="all" className="bg-[#0f0f1a]">
                Tous statuts
              </option>
              <option value="actif" className="bg-[#0f0f1a]">
                Actifs
              </option>
              <option value="inactif" className="bg-[#0f0f1a]">
                Inactifs
              </option>
            </FilterSelect>

            {/* Sort */}
            <div className="flex items-center gap-1.5">
              <ArrowUpDown size={13} className="text-white/30 flex-shrink-0" />
              <FilterSelect
                value={sortKey}
                onChange={(v) => setSortKey(v as TSortKey)}
              >
                <option value="default" className="bg-[#0f0f1a]">
                  Tri par défaut
                </option>
                <option value="nom_asc" className="bg-[#0f0f1a]">
                  Nom A → Z
                </option>
                <option value="nom_desc" className="bg-[#0f0f1a]">
                  Nom Z → A
                </option>
                <option value="montant_asc" className="bg-[#0f0f1a]">
                  Montant croissant
                </option>
                <option value="montant_desc" className="bg-[#0f0f1a]">
                  Montant décroissant
                </option>
              </FilterSelect>
            </div>

            {/* Reset filters */}
            <AnimatePresence>
              {hasActiveFilters && (
                <motion.button
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.9 }}
                  onClick={resetFilters}
                  className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg bg-white/[0.06] text-white/50 hover:text-white hover:bg-white/[0.1] text-xs transition-colors"
                >
                  <X size={11} />
                  Réinitialiser
                </motion.button>
              )}
            </AnimatePresence>

            {/* Drag hint */}
            {isDefaultOrder && items.length > 1 && (
              <span className="ml-auto text-[10px] text-white/20 hidden sm:flex items-center gap-1">
                <GripVertical size={11} />
                Glisser pour réorganiser
              </span>
            )}
          </motion.div>

          {/* ── Sections ── */}
          <motion.div
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.18, duration: 0.35 }}
          >
            {filteredItems.length === 0 ? (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="text-center text-white/30 text-sm py-16"
              >
                Aucune charge ne correspond aux filtres
              </motion.div>
            ) : (
              <>
                <Section
                  title="Charges mensuelles"
                  icon={<CalendarDays size={15} />}
                  items={mensuels}
                  totalLabel="Total actif / mois"
                  total={totalMensuels}
                  storageKey={STORAGE_KEY_MENSUEL}
                  onEdit={openEditModal}
                  isDraggable={isDefaultOrder}
                />
                <Section
                  title="Charges annuelles"
                  icon={<Receipt size={15} />}
                  items={annuels}
                  totalLabel="Total actif / an"
                  total={totalAnnuels}
                  storageKey={STORAGE_KEY_ANNUEL}
                  onEdit={openEditModal}
                  isDraggable={isDefaultOrder}
                />
              </>
            )}
          </motion.div>
        </>
      )}

      <BudgetModal
        open={modalOpen}
        onOpenChange={setModalOpen}
        categories={categories}
        objectifs={objectifs}
        item={editingItem}
      />
    </main>
  );
}
