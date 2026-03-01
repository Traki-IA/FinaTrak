"use client";

import { useState, useMemo } from "react";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import {
  Plus,
  Pencil,
  Receipt,
  TrendingDown,
  CalendarDays,
  Link2,
  GripVertical,
} from "lucide-react";
import { toast } from "sonner";
import {
  DndContext,
  closestCenter,
  PointerSensor,
  KeyboardSensor,
  useSensor,
  useSensors,
} from "@dnd-kit/core";
import type { DragEndEvent } from "@dnd-kit/core";
import {
  SortableContext,
  verticalListSortingStrategy,
  useSortable,
  arrayMove,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { Card, CardContent } from "@/components/ui/card";
import ConfirmDeleteButton from "@/components/ConfirmDeleteButton";
import FilterSelect from "@/components/FilterSelect";
import BudgetModal from "./BudgetModal";
import {
  toggleBudgetItem,
  deleteBudgetItem,
  reorderBudgetItems,
} from "./actions";
import { formatEur } from "@/lib/format";
import type { TBudgetItemWithRelations, TCategorie, TObjectif } from "@/types";

// ── Helpers ───────────────────────────────────────────────────────────────────

function annualise(montant: number, frequence: "mensuel" | "annuel"): number {
  return frequence === "mensuel" ? montant * 12 : montant;
}

function mensualise(montant: number, frequence: "mensuel" | "annuel"): number {
  return frequence === "annuel" ? montant / 12 : montant;
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

// ── Sortable Budget Item Row ─────────────────────────────────────────────────

function SortableBudgetItemRow({
  item,
  confirmingDeleteId,
  onEdit,
  onDeleteRequest,
  onDeleteConfirm,
  onDeleteCancel,
  dragEnabled,
}: {
  item: TBudgetItemWithRelations;
  confirmingDeleteId: string | null;
  onEdit: (item: TBudgetItemWithRelations) => void;
  onDeleteRequest: (id: string) => void;
  onDeleteConfirm: (id: string) => void;
  onDeleteCancel: () => void;
  dragEnabled: boolean;
}) {
  const router = useRouter();
  const [toggling, setToggling] = useState(false);

  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: item.id, disabled: !dragEnabled });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    zIndex: isDragging ? 50 : undefined,
    opacity: isDragging ? 0.5 : undefined,
  };

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

  async function handleDeleteConfirm() {
    onDeleteConfirm(item.id);
    const result = await deleteBudgetItem(item.id);
    if ("error" in result) {
      toast.error(result.error);
      return;
    }
    toast.success("Charge supprimée");
    router.refresh();
  }

  const couleur = item.categories?.couleur ?? "#94a3b8";
  const isConfirming = confirmingDeleteId === item.id;

  return (
    <div ref={setNodeRef} style={style}>
      <motion.div
        layout
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, x: -16 }}
        transition={{ duration: 0.22 }}
        className={`flex items-center gap-3 p-3 rounded-2xl border transition-colors ${
          item.actif
            ? "bg-white/[0.04] border-white/[0.07] hover:border-white/[0.12]"
            : "bg-white/[0.01] border-white/[0.04] opacity-50"
        }`}
      >
        {/* Drag handle */}
        {dragEnabled && (
          <button
            {...attributes}
            {...listeners}
            className="text-white/20 hover:text-white/50 cursor-grab active:cursor-grabbing flex-shrink-0 touch-none"
          >
            <GripVertical size={14} />
          </button>
        )}

        {/* Icône catégorie */}
        <div
          className="w-8 h-8 rounded-xl flex items-center justify-center flex-shrink-0 text-xs font-bold"
          style={{ background: `${couleur}18`, color: couleur }}
        >
          {item.nom[0]?.toUpperCase()}
        </div>

        {/* Info */}
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-1.5">
            <p className="text-sm font-medium text-white truncate">
              {item.nom}
            </p>
            {item.categories && (
              <span
                className="text-[10px] px-1.5 py-0.5 rounded-md font-medium flex-shrink-0 hidden sm:inline-block"
                style={{
                  background: `${couleur}18`,
                  color: couleur,
                }}
              >
                {item.categories.nom}
              </span>
            )}
            {item.objectifs && (
              <span className="text-[10px] px-1.5 py-0.5 rounded-md bg-orange-500/10 text-orange-400 flex items-center gap-1 flex-shrink-0 hidden sm:inline-flex">
                <Link2 size={9} />
                {item.objectifs.nom}
              </span>
            )}
          </div>
        </div>

        {/* Montant */}
        <div className="text-right flex-shrink-0">
          <p className="text-sm font-semibold text-white tabular-nums whitespace-nowrap">
            {formatEur(item.montant)}
            <span className="text-[10px] text-white/35 ml-0.5">
              /{item.frequence === "mensuel" ? "mois" : "an"}
            </span>
          </p>
        </div>

        {/* Toggle */}
        <Toggle
          checked={item.actif}
          onChange={handleToggle}
          disabled={toggling}
        />

        {/* Actions */}
        <div className="flex items-center gap-0.5 flex-shrink-0">
          {!isConfirming && (
            <button
              onClick={() => onEdit(item)}
              className="p-1.5 rounded-lg text-white/25 hover:text-white hover:bg-white/[0.07] transition-colors"
              title="Modifier"
            >
              <Pencil size={13} />
            </button>
          )}
          <ConfirmDeleteButton
            isConfirming={isConfirming}
            onDeleteRequest={() => onDeleteRequest(item.id)}
            onDeleteConfirm={handleDeleteConfirm}
            onDeleteCancel={onDeleteCancel}
            size={13}
          />
        </div>
      </motion.div>
    </div>
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

// ── Section with DnD ─────────────────────────────────────────────────────────

function Section({
  title,
  icon,
  items,
  totalLabel,
  total,
  confirmingDeleteId,
  onEdit,
  onDeleteRequest,
  onDeleteConfirm,
  onDeleteCancel,
  onReorder,
  dragEnabled,
}: {
  title: string;
  icon: React.ReactNode;
  items: TBudgetItemWithRelations[];
  totalLabel: string;
  total: number;
  confirmingDeleteId: string | null;
  onEdit: (item: TBudgetItemWithRelations) => void;
  onDeleteRequest: (id: string) => void;
  onDeleteConfirm: (id: string) => void;
  onDeleteCancel: () => void;
  onReorder: (activeId: string, overId: string) => void;
  dragEnabled: boolean;
}) {
  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 5 } }),
    useSensor(KeyboardSensor)
  );

  if (items.length === 0) return null;

  function handleDragEnd(event: DragEndEvent) {
    const { active, over } = event;
    if (over && active.id !== over.id) {
      onReorder(active.id as string, over.id as string);
    }
  }

  return (
    <div className="mb-6">
      <div className="flex items-center justify-between mb-3">
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

      <DndContext
        sensors={sensors}
        collisionDetection={closestCenter}
        onDragEnd={handleDragEnd}
      >
        <SortableContext
          items={items.map((i) => i.id)}
          strategy={verticalListSortingStrategy}
        >
          <div className="space-y-1.5">
            <AnimatePresence>
              {items.map((item) => (
                <SortableBudgetItemRow
                  key={item.id}
                  item={item}
                  confirmingDeleteId={confirmingDeleteId}
                  onEdit={onEdit}
                  onDeleteRequest={onDeleteRequest}
                  onDeleteConfirm={onDeleteConfirm}
                  onDeleteCancel={onDeleteCancel}
                  dragEnabled={dragEnabled}
                />
              ))}
            </AnimatePresence>
          </div>
        </SortableContext>
      </DndContext>
    </div>
  );
}

// ── Composant principal ───────────────────────────────────────────────────────

interface IBudgetContentProps {
  items: TBudgetItemWithRelations[];
  categories: TCategorie[];
  objectifs: TObjectif[];
  compteId: string;
}

export default function BudgetContent({
  items: initialItems,
  categories,
  objectifs,
  compteId,
}: IBudgetContentProps) {
  const router = useRouter();
  const [modalOpen, setModalOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<
    TBudgetItemWithRelations | undefined
  >(undefined);
  const [confirmingDeleteId, setConfirmingDeleteId] = useState<string | null>(
    null
  );
  const [localItems, setLocalItems] = useState(initialItems);

  // Filters
  const [filterCategorie, setFilterCategorie] = useState("all");
  const [filterStatus, setFilterStatus] = useState<
    "all" | "actif" | "inactif"
  >("all");
  const [sortBy, setSortBy] = useState<
    "sort_order" | "montant_asc" | "montant_desc" | "nom"
  >("sort_order");

  // Sync when server data changes
  const serverKey = initialItems.map((i) => `${i.id}-${i.sort_order}-${i.actif}-${i.montant}`).join("|");
  useMemo(() => {
    setLocalItems(initialItems);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [serverKey]);

  const dragEnabled = sortBy === "sort_order";

  // Filtered + sorted
  const filteredItems = useMemo(() => {
    let result = [...localItems];

    if (filterCategorie !== "all") {
      result = result.filter((i) => i.categorie_id === filterCategorie);
    }

    if (filterStatus === "actif") {
      result = result.filter((i) => i.actif);
    } else if (filterStatus === "inactif") {
      result = result.filter((i) => !i.actif);
    }

    if (sortBy === "montant_desc") {
      result.sort((a, b) => b.montant - a.montant);
    } else if (sortBy === "montant_asc") {
      result.sort((a, b) => a.montant - b.montant);
    } else if (sortBy === "nom") {
      result.sort((a, b) => a.nom.localeCompare(b.nom, "fr"));
    }

    return result;
  }, [localItems, filterCategorie, filterStatus, sortBy]);

  const isFiltered = filterCategorie !== "all" || filterStatus !== "all";

  const actifs = filteredItems.filter((i) => i.actif);
  const mensuels = filteredItems.filter((i) => i.frequence === "mensuel");
  const annuels = filteredItems.filter((i) => i.frequence === "annuel");

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
    filteredItems.filter((i) => i.objectif_id).map((i) => i.objectif_id)
  ).size;

  function openAddModal() {
    setEditingItem(undefined);
    setModalOpen(true);
  }

  function openEditModal(item: TBudgetItemWithRelations) {
    setEditingItem(item);
    setModalOpen(true);
  }

  function handleDeleteConfirm(id: string) {
    setConfirmingDeleteId(null);
    setLocalItems((prev) => prev.filter((i) => i.id !== id));
  }

  function handleReorder(activeId: string, overId: string) {
    setLocalItems((prev) => {
      const oldIndex = prev.findIndex((i) => i.id === activeId);
      const newIndex = prev.findIndex((i) => i.id === overId);
      if (oldIndex === -1 || newIndex === -1) return prev;
      const reordered = arrayMove(prev, oldIndex, newIndex);

      reorderBudgetItems(reordered.map((i) => i.id)).then((result) => {
        if ("error" in result) {
          toast.error("Erreur lors de la réorganisation");
          router.refresh();
        }
      });

      return reordered;
    });
  }

  return (
    <main className="min-h-screen bg-background p-4 sm:p-6 md:p-8">
      {/* ── Header ── */}
      <motion.div
        initial={{ opacity: 0, y: -16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3 }}
        className="flex items-start justify-between mb-6 sm:mb-8"
      >
        <div>
          <h1 className="text-2xl font-bold text-white">Budget annuel</h1>
          <p className="text-white/40 text-sm mt-1">
            {filteredItems.length} charge
            {filteredItems.length !== 1 ? "s" : ""}
            {isFiltered ? " filtrées" : " planifiées"}
            {actifs.length !== filteredItems.length && (
              <span className="text-white/25 ml-1">
                · {actifs.length} active{actifs.length !== 1 ? "s" : ""}
              </span>
            )}
          </p>
        </div>

        {localItems.length > 0 && (
          <motion.button
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.97 }}
            onClick={openAddModal}
            className="flex items-center gap-2 bg-orange-500 hover:bg-orange-600 text-white px-4 py-2.5 rounded-xl font-medium text-sm transition-colors"
          >
            <Plus size={16} />
            <span className="hidden sm:inline">Ajouter</span>
          </motion.button>
        )}
      </motion.div>

      {localItems.length === 0 ? (
        <EmptyState onAdd={openAddModal} />
      ) : (
        <>
          {/* ── Filters ── */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.05, duration: 0.3 }}
            className="flex flex-wrap gap-2 sm:gap-3 mb-5"
          >
            <FilterSelect
              value={filterCategorie}
              onChange={setFilterCategorie}
            >
              <option value="all" className="bg-[#0f0f1a]">
                Toutes les catégories
              </option>
              {categories.map((cat) => (
                <option key={cat.id} value={cat.id} className="bg-[#0f0f1a]">
                  {cat.nom}
                </option>
              ))}
            </FilterSelect>

            <FilterSelect
              value={filterStatus}
              onChange={(v) =>
                setFilterStatus(v as "all" | "actif" | "inactif")
              }
            >
              <option value="all" className="bg-[#0f0f1a]">
                Toutes
              </option>
              <option value="actif" className="bg-[#0f0f1a]">
                Actives
              </option>
              <option value="inactif" className="bg-[#0f0f1a]">
                Inactives
              </option>
            </FilterSelect>

            <FilterSelect
              value={sortBy}
              onChange={(v) =>
                setSortBy(
                  v as "sort_order" | "montant_asc" | "montant_desc" | "nom"
                )
              }
            >
              <option value="sort_order" className="bg-[#0f0f1a]">
                Ordre personnalisé
              </option>
              <option value="montant_desc" className="bg-[#0f0f1a]">
                Montant ↓
              </option>
              <option value="montant_asc" className="bg-[#0f0f1a]">
                Montant ↑
              </option>
              <option value="nom" className="bg-[#0f0f1a]">
                Nom (A-Z)
              </option>
            </FilterSelect>
          </motion.div>

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
              sub={
                isFiltered
                  ? "Charges filtrées / mois"
                  : "Charges fixes / mois"
              }
              icon={<TrendingDown size={16} />}
              color="#f97316"
            />
            <KpiCard
              label="Budget annuel"
              value={formatEur(budgetAnnuel)}
              sub={
                isFiltered ? "Projection filtrée" : "Projection sur 12 mois"
              }
              icon={<CalendarDays size={16} />}
              color="#6366f1"
            />
            <KpiCard
              label="Objectifs liés"
              value={String(linkedObjectifs)}
              sub={`sur ${filteredItems.length} charge${filteredItems.length !== 1 ? "s" : ""}`}
              icon={<Link2 size={16} />}
              color="#14b8a6"
            />
          </motion.div>

          {/* ── Sections ── */}
          <motion.div
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.18, duration: 0.35 }}
          >
            <Section
              title="Charges mensuelles"
              icon={<CalendarDays size={15} />}
              items={mensuels}
              totalLabel="Total actif / mois"
              total={totalMensuels}
              confirmingDeleteId={confirmingDeleteId}
              onEdit={openEditModal}
              onDeleteRequest={setConfirmingDeleteId}
              onDeleteConfirm={handleDeleteConfirm}
              onDeleteCancel={() => setConfirmingDeleteId(null)}
              onReorder={handleReorder}
              dragEnabled={dragEnabled}
            />
            <Section
              title="Charges annuelles"
              icon={<Receipt size={15} />}
              items={annuels}
              totalLabel="Total actif / an"
              total={totalAnnuels}
              confirmingDeleteId={confirmingDeleteId}
              onEdit={openEditModal}
              onDeleteRequest={setConfirmingDeleteId}
              onDeleteConfirm={handleDeleteConfirm}
              onDeleteCancel={() => setConfirmingDeleteId(null)}
              onReorder={handleReorder}
              dragEnabled={dragEnabled}
            />
          </motion.div>
        </>
      )}

      <BudgetModal
        key={editingItem?.id ?? "new"}
        open={modalOpen}
        onOpenChange={setModalOpen}
        categories={categories}
        objectifs={objectifs}
        budgetItem={editingItem}
        compteId={compteId}
      />
    </main>
  );
}
