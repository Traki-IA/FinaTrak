"use client";

import { useState, useMemo } from "react";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import { Pencil, Receipt, GripVertical } from "lucide-react";
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
import Shell from "@/components/layout/Shell";
import ConfirmDeleteButton from "@/components/ConfirmDeleteButton";
import TabBar from "@/components/ui/TabBar";
import Bar from "@/components/ui/Bar";
import Fab from "@/components/ui/Fab";
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
      onClick={(e) => { e.stopPropagation(); onChange(!checked); }}
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

// ── Section tab type ──────────────────────────────────────────────────────────

type TSectionFilter = "mensuel" | "annuel";
const SECTION_TABS: { key: TSectionFilter; label: string }[] = [
  { key: "mensuel", label: "Mensuelles" },
  { key: "annuel", label: "Annuelles" },
];

// ── Sortable Budget Row (Pulse Flat) ──────────────────────────────────────────

function SortableBudgetRow({
  item,
  maxAmount,
  index,
  confirmingDeleteId,
  onEdit,
  onDeleteRequest,
  onDeleteConfirm,
  onDeleteCancel,
  dragEnabled,
}: {
  item: TBudgetItemWithRelations;
  maxAmount: number;
  index: number;
  confirmingDeleteId: string | null;
  onEdit: (item: TBudgetItemWithRelations) => void;
  onDeleteRequest: (id: string) => void;
  onDeleteConfirm: (id: string) => void;
  onDeleteCancel: () => void;
  dragEnabled: boolean;
}) {
  const router = useRouter();
  const [toggling, setToggling] = useState(false);

  const { attributes, listeners, setNodeRef, transform, transition, isDragging } =
    useSortable({ id: item.id, disabled: !dragEnabled });

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
    if ("error" in result) { toast.error(result.error); return; }
    router.refresh();
  }

  async function handleDeleteConfirm() {
    onDeleteConfirm(item.id);
    const result = await deleteBudgetItem(item.id);
    if ("error" in result) { toast.error(result.error); return; }
    toast.success("Charge supprimée");
    router.refresh();
  }

  const couleur = item.categories?.couleur ?? "#94a3b8";
  const isConfirming = confirmingDeleteId === item.id;
  const barPct = maxAmount > 0 ? Math.round((item.montant / maxAmount) * 100) : 0;

  return (
    <div ref={setNodeRef} style={style} className="border-b border-white/[0.05]">
      <motion.div
        layout
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, x: -16 }}
        transition={{ duration: 0.22, delay: Math.min(index * 0.02, 0.3) }}
        className="group py-2.5"
        style={{ opacity: item.actif ? 1 : 0.45 }}
      >
        <div className="flex items-center justify-between" style={{ marginBottom: item.actif ? 6 : 0 }}>
          <div className="flex items-center gap-2.5 min-w-0">
            {dragEnabled && (
              <button {...attributes} {...listeners} className="text-white/20 cursor-grab flex-shrink-0 touch-none">
                <GripVertical size={13} />
              </button>
            )}
            <div className="w-2 h-2 rounded-full flex-shrink-0" style={{ background: couleur }} />
            <div className="min-w-0">
              <p className="text-[14px] font-[600] text-white leading-none truncate">{item.nom}</p>
              <span className="text-[12px] text-white/50 mt-0.5 block">{item.categories?.nom ?? "—"}</span>
            </div>
          </div>
          <div className="flex items-center gap-2 shrink-0 ml-2">
            <span className="text-[16px] font-[800] tracking-tight">
              {formatEur(item.montant)}{" "}
              <span className="text-[12px] text-white/50 font-normal">
                €/{item.frequence === "mensuel" ? "m" : "an"}
              </span>
            </span>
            <Toggle checked={item.actif} onChange={handleToggle} disabled={toggling} />
            <div className="flex gap-0.5 opacity-0 group-hover:opacity-100 transition-opacity">
              {!isConfirming && (
                <button onClick={() => onEdit(item)} className="p-1 text-white/30 hover:text-white">
                  <Pencil size={12} />
                </button>
              )}
              <ConfirmDeleteButton
                isConfirming={isConfirming}
                onDeleteRequest={() => onDeleteRequest(item.id)}
                onDeleteConfirm={handleDeleteConfirm}
                onDeleteCancel={onDeleteCancel}
                size={12}
              />
            </div>
          </div>
        </div>
        {item.actif && <Bar pct={barPct} color={couleur} height={2} className="opacity-60" />}
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
        Ajouter une charge
      </button>
    </motion.div>
  );
}

// ── Shared props ──────────────────────────────────────────────────────────────

interface ISharedBudgetProps {
  localItems: TBudgetItemWithRelations[];
  sectionItems: TBudgetItemWithRelations[];
  section: TSectionFilter;
  setSection: (s: TSectionFilter) => void;
  totalMensuel: number;
  totalAnnuel: number;
  maxAmount: number;
  confirmingDeleteId: string | null;
  onEdit: (item: TBudgetItemWithRelations) => void;
  onDeleteRequest: (id: string) => void;
  onDeleteConfirm: (id: string) => void;
  onDeleteCancel: () => void;
  onDragEnd: (event: DragEndEvent) => void;
  onAdd: () => void;
}

// ── Budget (Pulse Flat) ────────────────────────────────────────────────────────

function Budget({
  localItems,
  sectionItems,
  section,
  setSection,
  totalMensuel,
  totalAnnuel,
  maxAmount,
  confirmingDeleteId,
  onEdit,
  onDeleteRequest,
  onDeleteConfirm,
  onDeleteCancel,
  onDragEnd,
  onAdd,
}: ISharedBudgetProps) {
  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 5 } }),
    useSensor(KeyboardSensor)
  );

  return (
    <Shell>
      {/* Header */}
      <div className="flex items-center justify-between mb-0">
        <div>
          <h1 className="text-[22px] font-black tracking-tight">Budget</h1>
          <p className="text-[10px] text-white/50 mt-0.5">Charges récurrentes</p>
        </div>
      </div>

      {localItems.length === 0 ? (
        <EmptyState onAdd={onAdd} />
      ) : (
        <>
          {/* KPIs — 2 colonnes Pulse Flat */}
          <div className="border-b border-white/[0.05] mt-3 mb-0" />
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.05, duration: 0.3 }}
            className="py-3"
          >
            <div className="flex">
              <div className="flex-1 pr-[18px]">
                <p className="text-[11px] text-white/55 uppercase tracking-[0.14em] font-semibold">Charges / mois</p>
                <p className="text-[18px] font-[900] tracking-tight mt-1 mb-1.5 leading-none text-orange-500">
                  {formatEur(totalMensuel)} €
                </p>
                <Bar pct={Math.min(100, Math.round(totalMensuel / 2000 * 100))} color="#f97316" height={2} className="opacity-60" />
              </div>
              <div className="border-r border-white/[0.05]" />
              <div className="flex-1 pl-[18px]">
                <p className="text-[11px] text-white/55 uppercase tracking-[0.14em] font-semibold">Projection ann.</p>
                <p className="text-[18px] font-[900] tracking-tight mt-1 mb-1.5 leading-none text-indigo-400">
                  {formatEur(totalAnnuel)} €
                </p>
                <Bar pct={Math.min(100, Math.round(totalAnnuel / 20000 * 100))} color="#6366f1" height={2} className="opacity-60" />
              </div>
            </div>
          </motion.div>

          <div className="border-b border-white/[0.05] mb-0" />
          <TabBar tabs={SECTION_TABS} active={section} onChange={setSection} />

          <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={onDragEnd}>
            <SortableContext items={sectionItems.map((i) => i.id)} strategy={verticalListSortingStrategy}>
              <AnimatePresence mode="popLayout">
                {sectionItems.length === 0 ? (
                  <motion.p key="empty" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="text-center text-white/50 text-[12px] py-12">
                    Aucune charge {section === "mensuel" ? "mensuelle" : "annuelle"}
                  </motion.p>
                ) : (
                  sectionItems.map((item, i) => (
                    <SortableBudgetRow
                      key={item.id}
                      item={item}
                      maxAmount={maxAmount}
                      index={i}
                      confirmingDeleteId={confirmingDeleteId}
                      onEdit={onEdit}
                      onDeleteRequest={onDeleteRequest}
                      onDeleteConfirm={onDeleteConfirm}
                      onDeleteCancel={onDeleteCancel}
                      dragEnabled={true}
                    />
                  ))
                )}
              </AnimatePresence>
            </SortableContext>
          </DndContext>
        </>
      )}
    </Shell>
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
  const [editingItem, setEditingItem] = useState<TBudgetItemWithRelations | undefined>(undefined);
  const [confirmingDeleteId, setConfirmingDeleteId] = useState<string | null>(null);
  const [localItems, setLocalItems] = useState(initialItems);
  const [section, setSection] = useState<TSectionFilter>("mensuel");

  const serverKey = initialItems.map((i) => `${i.id}-${i.sort_order}-${i.actif}-${i.montant}`).join("|");
  useMemo(() => {
    setLocalItems(initialItems);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [serverKey]);

  const actifs = localItems.filter((i) => i.actif);
  const totalMensuel = actifs.reduce((sum, i) => sum + mensualise(i.montant, i.frequence), 0);
  const totalAnnuel = actifs.reduce((sum, i) => sum + annualise(i.montant, i.frequence), 0);
  const sectionItems = localItems.filter((i) => i.frequence === section);
  const maxAmount = Math.max(...sectionItems.map((i) => i.montant), 1);

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

  function handleDragEnd(event: DragEndEvent) {
    const { active, over } = event;
    if (!over || active.id === over.id) return;

    setLocalItems((prev) => {
      const oldIndex = prev.findIndex((i) => i.id === active.id);
      const newIndex = prev.findIndex((i) => i.id === over.id);
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

  const sharedProps: ISharedBudgetProps = {
    localItems,
    sectionItems,
    section,
    setSection,
    totalMensuel,
    totalAnnuel,
    maxAmount,
    confirmingDeleteId,
    onEdit: openEditModal,
    onDeleteRequest: setConfirmingDeleteId,
    onDeleteConfirm: handleDeleteConfirm,
    onDeleteCancel: () => setConfirmingDeleteId(null),
    onDragEnd: handleDragEnd,
    onAdd: openAddModal,
  };

  return (
    <>
      <Budget {...sharedProps} />

      {/* FAB — rendered once */}
      <Fab label="Charge" onClick={openAddModal} />

      {/* Modal — rendered once */}
      <BudgetModal
        key={editingItem?.id ?? "new"}
        open={modalOpen}
        onOpenChange={setModalOpen}
        categories={categories}
        objectifs={objectifs}
        budgetItem={editingItem}
        compteId={compteId}
      />
    </>
  );
}
