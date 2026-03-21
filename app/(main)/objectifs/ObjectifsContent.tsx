"use client";

import { useState, useMemo } from "react";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import { Pencil, Loader2, Target, GripVertical } from "lucide-react";
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
import ConfirmDeleteButton from "@/components/ConfirmDeleteButton";
import Shell from "@/components/layout/Shell";
import LogoHeader from "@/components/ui/LogoHeader";
import Bar from "@/components/ui/Bar";
import Fab from "@/components/ui/Fab";
import ObjectifModal from "./ObjectifModal";
import {
  deleteObjectif,
  updateObjectifMontant,
  reorderObjectifs,
} from "./actions";
import { formatEur } from "@/lib/format";
import type { TObjectifWithBudgetLines, TCategorie } from "@/types";

// ── Helpers ───────────────────────────────────────────────────────────────────

function formatDate(dateStr: string): string {
  return new Date(dateStr).toLocaleDateString("fr-FR", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}

// ── Sortable Objectif Row (Pulse Flat) ────────────────────────────────────────

function SortableObjectifRow({
  objectif,
  index,
  confirmingDeleteId,
  onEdit,
  onDeleteRequest,
  onDeleteConfirm,
  onDeleteCancel,
}: {
  objectif: TObjectifWithBudgetLines;
  index: number;
  confirmingDeleteId: string | null;
  onEdit: (o: TObjectifWithBudgetLines) => void;
  onDeleteRequest: (id: string) => void;
  onDeleteConfirm: (id: string) => void;
  onDeleteCancel: () => void;
}) {
  const router = useRouter();
  const [isUpdating, setIsUpdating] = useState(false);
  const [showInput, setShowInput] = useState(false);
  const [inputValue, setInputValue] = useState(objectif.montant_actuel.toString());
  const [expanded, setExpanded] = useState(false);

  const { attributes, listeners, setNodeRef, transform, transition, isDragging } =
    useSortable({ id: objectif.id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    zIndex: isDragging ? 50 : undefined,
    opacity: isDragging ? 0.5 : undefined,
  };

  const pct = Math.min(Math.round((objectif.montant_actuel / objectif.montant_cible) * 100), 100);
  const atteint = objectif.montant_actuel >= objectif.montant_cible;
  const restant = Math.max(0, objectif.montant_cible - objectif.montant_actuel);
  const effortMensuel = Math.ceil(restant / 6);
  const isConfirming = confirmingDeleteId === objectif.id;
  const couleur = atteint ? "#22c55e" : pct >= 66 ? "#14b8a6" : pct >= 33 ? "#f97316" : "#ef4444";

  async function handleDeleteConfirm() {
    onDeleteConfirm(objectif.id);
    const result = await deleteObjectif(objectif.id);
    if ("error" in result) { toast.error(result.error); return; }
    toast.success("Objectif supprimé");
    router.refresh();
  }

  async function handleUpdate() {
    const montant = parseFloat(inputValue);
    if (isNaN(montant) || montant < 0) { toast.error("Montant invalide"); return; }
    setIsUpdating(true);
    const result = await updateObjectifMontant(objectif.id, montant);
    setIsUpdating(false);
    if ("error" in result) { toast.error(result.error); return; }
    toast.success("Progression mise à jour !");
    setShowInput(false);
    router.refresh();
  }

  return (
    <div ref={setNodeRef} style={style} className="border-b border-[var(--border)]">
      <motion.div
        layout
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.95 }}
        transition={{ duration: 0.25, delay: Math.min(index * 0.03, 0.3) }}
        className="group py-2.5 px-[14px]"
        style={{ cursor: "pointer" }}
        onClick={() => setExpanded(!expanded)}
      >
        <div className="flex items-start justify-between mb-2">
          <div className="flex items-center gap-2.5 min-w-0 flex-1">
            <button {...attributes} {...listeners} onClick={(e) => e.stopPropagation()} className="text-white/20 cursor-grab flex-shrink-0 touch-none">
              <GripVertical size={13} />
            </button>
            <div className="w-2 h-2 rounded-full flex-shrink-0 mt-0.5" style={{ background: couleur }} />
            <div className="min-w-0">
              <div className="flex items-center gap-1.5 flex-wrap">
                <p className="text-[14px] font-[600] leading-none text-white">{objectif.nom}</p>
                {atteint && <span className="text-[11px] px-1.5 py-0.5 rounded font-bold bg-emerald-500/15 text-emerald-400">✓ Atteint</span>}
              </div>
              {objectif.date_fin && <span className="text-[12px] text-[var(--text2)] mt-0.5 block">→ {formatDate(objectif.date_fin)}</span>}
            </div>
          </div>
          <div className="flex items-center gap-2 flex-shrink-0 ml-2">
            <div className="text-right">
              <p className="text-[17px] font-[800] leading-none" style={{ color: couleur }}>{pct}%</p>
              <p className="text-[13px] text-[var(--text2)] mt-0.5 whitespace-nowrap">
                {objectif.montant_actuel.toLocaleString("fr")} / {objectif.montant_cible.toLocaleString("fr")} €
              </p>
            </div>
            <div className="flex gap-0.5" onClick={(e) => e.stopPropagation()}>
              {!isConfirming && <button onClick={() => onEdit(objectif)} className="p-1 text-[var(--text3)] hover:text-white"><Pencil size={12} /></button>}
              <ConfirmDeleteButton isConfirming={isConfirming} onDeleteRequest={() => onDeleteRequest(objectif.id)} onDeleteConfirm={handleDeleteConfirm} onDeleteCancel={onDeleteCancel} size={12} />
            </div>
          </div>
        </div>

        <Bar pct={pct} color={couleur} height={2} className="opacity-60" />

        <AnimatePresence>
          {expanded && !atteint && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: "auto", opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              transition={{ duration: 0.2 }}
              className="overflow-hidden"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="mt-2.5 px-3 py-2.5 rounded-[10px]" style={{ background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.06)" }}>
                <div className="flex justify-between mb-1">
                  <span className="text-[13px] text-[var(--text2)]">Restant</span>
                  <span className="text-[13px] font-[800]" style={{ color: couleur }}>{formatEur(restant)}</span>
                </div>
                <div className="flex justify-between mb-2.5">
                  <span className="text-[13px] text-[var(--text2)]">Effort mensuel (6m)</span>
                  <span className="text-[13px] font-[800] text-white">~{formatEur(effortMensuel)}</span>
                </div>
                <AnimatePresence mode="wait">
                  {showInput ? (
                    <motion.div key="input" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="flex gap-2">
                      <input type="number" step="0.01" min="0" value={inputValue} onChange={(e) => setInputValue(e.target.value)} autoFocus onClick={(e) => e.stopPropagation()} className="flex-1 bg-white/[0.05] border border-white/[0.1] text-white rounded-xl px-3 py-1.5 text-xs outline-none focus:border-orange-500/60 transition-colors" />
                      <button onClick={handleUpdate} disabled={isUpdating} className="px-3 py-1.5 bg-orange-500 text-white rounded-xl text-xs font-medium disabled:opacity-60 flex items-center gap-1">
                        {isUpdating && <Loader2 size={11} className="animate-spin" />}OK
                      </button>
                      <button onClick={() => setShowInput(false)} className="px-2 py-1.5 bg-white/[0.05] text-[var(--text2)] rounded-xl text-xs">✕</button>
                    </motion.div>
                  ) : (
                    <motion.button key="btn" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={() => { setInputValue(objectif.montant_actuel.toString()); setShowInput(true); }} className="w-full py-1.5 rounded-lg text-[13px] text-[var(--text2)] bg-white/[0.03] hover:bg-white/[0.07] transition-all">
                      Mettre à jour la progression
                    </motion.button>
                  )}
                </AnimatePresence>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
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
        <Target size={24} className="text-orange-400" />
      </div>
      <p className="text-white font-semibold mb-1">Aucun objectif</p>
      <p className="text-white/40 text-sm mb-6">
        Créez votre premier objectif d&apos;épargne
      </p>
    </motion.div>
  );
}

// ── Shared props ──────────────────────────────────────────────────────────────

interface ISharedObjectifsProps {
  localObjectifs: TObjectifWithBudgetLines[];
  totalEpargne: number;
  done: number;
  globalPct: number;
  confirmingDeleteId: string | null;
  onEdit: (o: TObjectifWithBudgetLines) => void;
  onDeleteRequest: (id: string) => void;
  onDeleteConfirm: (id: string) => void;
  onDeleteCancel: () => void;
  onDragEnd: (event: DragEndEvent) => void;
  onAdd: () => void;
}

// ── Objectifs (Pulse Flat) ─────────────────────────────────────────────────────

function Objectifs({
  localObjectifs,
  totalEpargne,
  done,
  globalPct,
  confirmingDeleteId,
  onEdit,
  onDeleteRequest,
  onDeleteConfirm,
  onDeleteCancel,
  onDragEnd,
}: ISharedObjectifsProps) {
  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 5 } }),
    useSensor(KeyboardSensor)
  );

  return (
    <Shell>
      <LogoHeader />

      {/* KPI card */}
      {localObjectifs.length > 0 && (
        <div className="mt-[10px] rounded-[14px] overflow-hidden" style={{ border: "1px solid var(--border)", background: "var(--bg2)" }}>
          {/* Header */}
          <div className="py-[2px] flex items-center justify-center" style={{ borderBottom: "1px solid var(--border)", background: "rgba(255,255,255,0.03)" }}>
            <span className="text-[9px] font-semibold text-[var(--text2)] uppercase tracking-[0.1em]">Objectifs</span>
          </div>
          {/* Colonnes */}
          <div className="flex">
            <div className="flex-1 text-center py-[8px] px-2 min-w-0" style={{ borderRight: "1px solid var(--border)" }}>
              <div className="text-[9px] font-semibold text-[var(--text2)] uppercase tracking-[0.1em]">Total épargné</div>
              <div className="text-[16px] font-semibold text-[var(--green)] tracking-tight mt-[2px] tabular-nums truncate">{formatEur(totalEpargne)}</div>
            </div>
            <div className="flex-1 text-center py-[8px] px-2 min-w-0">
              <div className="text-[9px] font-semibold text-[var(--text2)] uppercase tracking-[0.1em]">Atteints</div>
              <div className="text-[16px] font-semibold text-[var(--text)] tracking-tight mt-[2px]">{done} / {localObjectifs.length}</div>
            </div>
          </div>
          {/* Barre progression globale */}
          <div className="px-[14px] py-[8px]" style={{ borderTop: "1px solid var(--border)" }}>
            <div className="flex justify-between items-center mb-[6px]">
              <span className="text-[9px] font-semibold text-[var(--text2)] uppercase tracking-[0.1em]">Progression globale</span>
              <span className="text-[9px] font-semibold text-[var(--text2)]">{globalPct}%</span>
            </div>
            <Bar pct={globalPct} color="#22c55e" height={3} />
          </div>
        </div>
      )}

      {localObjectifs.length === 0 ? (
        <EmptyState onAdd={() => {}} />
      ) : (
        <div
          className="mt-[10px] rounded-[14px] overflow-hidden"
          style={{ border: "1px solid var(--border)", background: "var(--bg2)" }}
        >
          <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={onDragEnd}>
            <SortableContext items={localObjectifs.map((o) => o.id)} strategy={verticalListSortingStrategy}>
              <AnimatePresence>
                {localObjectifs.map((o, i) => (
                  <SortableObjectifRow
                    key={o.id}
                    objectif={o}
                    index={i}
                    confirmingDeleteId={confirmingDeleteId}
                    onEdit={onEdit}
                    onDeleteRequest={onDeleteRequest}
                    onDeleteConfirm={onDeleteConfirm}
                    onDeleteCancel={onDeleteCancel}
                  />
                ))}
              </AnimatePresence>
            </SortableContext>
          </DndContext>
        </div>
      )}
    </Shell>
  );
}

// ── Composant principal ───────────────────────────────────────────────────────

export default function ObjectifsContent({
  objectifs: initialObjectifs,
  categories: _categories,
  compteId,
}: {
  objectifs: TObjectifWithBudgetLines[];
  categories: TCategorie[];
  compteId: string;
}) {
  const router = useRouter();

  const [modalOpen, setModalOpen] = useState(false);
  const [editingObjectif, setEditingObjectif] = useState<TObjectifWithBudgetLines | undefined>(undefined);
  const [confirmingDeleteId, setConfirmingDeleteId] = useState<string | null>(null);
  const [localObjectifs, setLocalObjectifs] = useState(initialObjectifs);

  const serverKey = initialObjectifs
    .map((o) => `${o.id}-${o.sort_order}-${o.nom}-${o.montant_cible}-${o.montant_actuel}-${o.date_fin}-${o.periode}`)
    .join("|");
  useMemo(() => {
    setLocalObjectifs(initialObjectifs);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [serverKey]);

  const totalEpargne = localObjectifs.reduce((s, o) => s + o.montant_actuel, 0);
  const done = localObjectifs.filter((o) => o.montant_actuel >= o.montant_cible).length;
  const globalPct = localObjectifs.length
    ? Math.round(localObjectifs.reduce((s, o) => s + Math.min(o.montant_actuel / o.montant_cible, 1), 0) / localObjectifs.length * 100)
    : 0;

  function openAddModal() {
    setEditingObjectif(undefined);
    setModalOpen(true);
  }

  function openEditModal(objectif: TObjectifWithBudgetLines) {
    setEditingObjectif(objectif);
    setModalOpen(true);
  }

  function handleDeleteConfirm(id: string) {
    setConfirmingDeleteId(null);
    setLocalObjectifs((prev) => prev.filter((o) => o.id !== id));
  }

  function handleDragEnd(event: DragEndEvent) {
    const { active, over } = event;
    if (!over || active.id === over.id) return;

    setLocalObjectifs((prev) => {
      const oldIndex = prev.findIndex((o) => o.id === active.id);
      const newIndex = prev.findIndex((o) => o.id === over.id);
      if (oldIndex === -1 || newIndex === -1) return prev;
      const reordered = arrayMove(prev, oldIndex, newIndex);

      reorderObjectifs(reordered.map((o) => o.id)).then((result) => {
        if ("error" in result) {
          toast.error("Erreur lors de la réorganisation");
          router.refresh();
        }
      });

      return reordered;
    });
  }

  const sharedProps: ISharedObjectifsProps = {
    localObjectifs,
    totalEpargne,
    done,
    globalPct,
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
      <Objectifs {...sharedProps} />

      {/* FAB — rendered once */}
      <Fab label="Objectif" onClick={openAddModal} />

      {/* Modal — rendered once */}
      <ObjectifModal
        key={editingObjectif?.id ?? "new"}
        open={modalOpen}
        onOpenChange={setModalOpen}
        objectif={editingObjectif}
        compteId={compteId}
      />
    </>
  );
}
