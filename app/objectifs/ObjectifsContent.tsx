"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import {
  Plus,
  Pencil,
  Loader2,
  Target,
  Calendar,
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
  rectSortingStrategy,
  useSortable,
  arrayMove,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import ConfirmDeleteButton from "@/components/ConfirmDeleteButton";
import ObjectifModal from "./ObjectifModal";
import {
  deleteObjectif,
  updateObjectifMontant,
  reorderObjectifs,
} from "./actions";
import { formatEur } from "@/lib/format";
import type { TObjectif } from "@/types";

// ── Helpers ───────────────────────────────────────────────────────────────────

function formatDate(dateStr: string): string {
  return new Date(dateStr).toLocaleDateString("fr-FR", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}

function joursRestants(dateFin: string): number {
  const diff = new Date(dateFin).getTime() - Date.now();
  return Math.ceil(diff / (1000 * 60 * 60 * 24));
}

const PERIODE_COLORS: Record<string, string> = {
  mensuel: "bg-blue-500/15 text-blue-400",
  annuel: "bg-violet-500/15 text-violet-400",
  ponctuel: "bg-teal-500/15 text-teal-400",
};

const PERIODE_LABELS: Record<string, string> = {
  mensuel: "Mensuel",
  annuel: "Annuel",
  ponctuel: "Ponctuel",
};

// ── Sortable Objectif Card ──────────────────────────────────────────────────

function SortableObjectifCard({
  objectif,
  confirmingDeleteId,
  onEdit,
  onDeleteRequest,
  onDeleteConfirm,
  onDeleteCancel,
}: {
  objectif: TObjectif;
  confirmingDeleteId: string | null;
  onEdit: (o: TObjectif) => void;
  onDeleteRequest: (id: string) => void;
  onDeleteConfirm: (id: string) => void;
  onDeleteCancel: () => void;
}) {
  const router = useRouter();
  const [isUpdating, setIsUpdating] = useState(false);
  const [showInput, setShowInput] = useState(false);
  const [inputValue, setInputValue] = useState(
    objectif.montant_actuel.toString()
  );

  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: objectif.id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    zIndex: isDragging ? 50 : undefined,
    opacity: isDragging ? 0.5 : undefined,
  };

  const pct = Math.min(
    (objectif.montant_actuel / objectif.montant_cible) * 100,
    100
  );
  const atteint = objectif.montant_actuel >= objectif.montant_cible;
  const restant = objectif.montant_cible - objectif.montant_actuel;
  const isConfirming = confirmingDeleteId === objectif.id;

  async function handleDeleteConfirm() {
    onDeleteConfirm(objectif.id);
    const result = await deleteObjectif(objectif.id);
    if ("error" in result) {
      toast.error(result.error);
      return;
    }
    toast.success("Objectif supprimé");
    router.refresh();
  }

  async function handleUpdate() {
    const montant = parseFloat(inputValue);
    if (isNaN(montant) || montant < 0) {
      toast.error("Montant invalide");
      return;
    }
    setIsUpdating(true);
    const result = await updateObjectifMontant(objectif.id, montant);
    setIsUpdating(false);

    if ("error" in result) {
      toast.error(result.error);
      return;
    }
    toast.success("Progression mise à jour !");
    setShowInput(false);
    router.refresh();
  }

  const barColor = atteint
    ? "#22c55e"
    : pct >= 66
    ? "#14b8a6"
    : pct >= 33
    ? "#f97316"
    : "#ef4444";

  const jours = objectif.date_fin ? joursRestants(objectif.date_fin) : null;

  return (
    <div ref={setNodeRef} style={style}>
      <motion.div
        layout
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.95 }}
        transition={{ duration: 0.25 }}
        className="bg-white/[0.04] border border-white/[0.07] rounded-2xl p-5 flex flex-col gap-4 hover:border-white/[0.12] transition-colors"
      >
        {/* Header */}
        <div className="flex items-start justify-between gap-2">
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-1.5">
              {/* Drag handle */}
              <button
                {...attributes}
                {...listeners}
                className="text-white/20 hover:text-white/50 cursor-grab active:cursor-grabbing flex-shrink-0 touch-none"
              >
                <GripVertical size={14} />
              </button>
              {atteint && (
                <span className="text-xs bg-emerald-500/15 text-emerald-400 px-2 py-0.5 rounded-full font-medium">
                  ✓ Atteint
                </span>
              )}
            </div>
            <h3 className="text-white font-semibold text-base truncate">
              {objectif.nom}
            </h3>
            <span
              className={`inline-flex text-xs px-2.5 py-0.5 rounded-full font-medium mt-1 ${
                PERIODE_COLORS[objectif.periode]
              }`}
            >
              {PERIODE_LABELS[objectif.periode]}
            </span>
          </div>

          {/* Actions */}
          <div className="flex items-center gap-0.5 flex-shrink-0">
            {!isConfirming && (
              <button
                onClick={() => onEdit(objectif)}
                className="p-1.5 rounded-lg text-white/25 hover:text-white hover:bg-white/[0.07] transition-colors"
                title="Modifier"
              >
                <Pencil size={13} />
              </button>
            )}
            <ConfirmDeleteButton
              isConfirming={isConfirming}
              onDeleteRequest={() => onDeleteRequest(objectif.id)}
              onDeleteConfirm={handleDeleteConfirm}
              onDeleteCancel={onDeleteCancel}
              size={13}
            />
          </div>
        </div>

        {/* Progress */}
        <div>
          <div className="flex items-center justify-between mb-2 text-xs">
            <span className="text-white/50">
              {formatEur(objectif.montant_actuel)} épargnés
            </span>
            <span className="text-white/70 font-medium">
              {pct.toFixed(0)} %
            </span>
          </div>
          <div className="h-2 bg-white/[0.07] rounded-full overflow-hidden">
            <motion.div
              initial={{ width: 0 }}
              animate={{ width: `${pct}%` }}
              transition={{ duration: 0.8, ease: "easeOut", delay: 0.1 }}
              className="h-full rounded-full"
              style={{ background: barColor }}
            />
          </div>
          <div className="flex items-center justify-between mt-2 text-xs text-white/40">
            <span>
              {atteint
                ? "Objectif atteint !"
                : `${formatEur(restant)} restants`}
            </span>
            <span className="font-medium text-white/60">
              {formatEur(objectif.montant_cible)}
            </span>
          </div>
        </div>

        {/* Date fin */}
        {objectif.date_fin && (
          <div
            className={`flex items-center gap-1.5 text-xs ${
              jours !== null && jours < 0
                ? "text-red-400"
                : jours !== null && jours <= 30
                ? "text-orange-400"
                : "text-white/35"
            }`}
          >
            <Calendar size={12} />
            {jours !== null && jours < 0
              ? `Échéance dépassée (${formatDate(objectif.date_fin)})`
              : `Échéance : ${formatDate(objectif.date_fin)}${
                  jours !== null ? ` · ${jours} j` : ""
                }`}
          </div>
        )}

        {/* Mise à jour progression */}
        <AnimatePresence mode="wait">
          {showInput ? (
            <motion.div
              key="input"
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: "auto" }}
              exit={{ opacity: 0, height: 0 }}
              className="flex gap-2"
            >
              <input
                type="number"
                step="0.01"
                min="0"
                value={inputValue}
                onChange={(e) => setInputValue(e.target.value)}
                autoFocus
                className="flex-1 bg-white/[0.05] border border-white/[0.1] text-white rounded-xl px-3 py-2 text-sm outline-none focus:border-orange-500/60 transition-colors"
              />
              <button
                onClick={handleUpdate}
                disabled={isUpdating}
                className="px-4 py-2 bg-orange-500 hover:bg-orange-600 text-white rounded-xl text-sm font-medium transition-colors disabled:opacity-60 flex items-center gap-1.5"
              >
                {isUpdating && <Loader2 size={13} className="animate-spin" />}
                OK
              </button>
              <button
                onClick={() => setShowInput(false)}
                className="px-3 py-2 bg-white/[0.05] text-white/50 hover:text-white rounded-xl text-sm transition-colors"
              >
                ✕
              </button>
            </motion.div>
          ) : (
            <motion.button
              key="btn"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => {
                setInputValue(objectif.montant_actuel.toString());
                setShowInput(true);
              }}
              className="w-full py-2 rounded-xl text-sm text-white/45 hover:text-white bg-white/[0.03] hover:bg-white/[0.07] border border-white/[0.06] transition-all"
            >
              Mettre à jour la progression
            </motion.button>
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
      <button
        onClick={onAdd}
        className="flex items-center gap-2 bg-orange-500 hover:bg-orange-600 text-white px-5 py-2.5 rounded-xl font-medium text-sm transition-colors"
      >
        <Plus size={16} />
        Créer un objectif
      </button>
    </motion.div>
  );
}

// ── Composant principal ───────────────────────────────────────────────────────

export default function ObjectifsContent({
  objectifs: initialObjectifs,
}: {
  objectifs: TObjectif[];
}) {
  const router = useRouter();
  const [modalOpen, setModalOpen] = useState(false);
  const [editingObjectif, setEditingObjectif] = useState<
    TObjectif | undefined
  >(undefined);
  const [confirmingDeleteId, setConfirmingDeleteId] = useState<string | null>(
    null
  );
  const [localObjectifs, setLocalObjectifs] = useState(initialObjectifs);

  // Sync when server data changes
  if (
    initialObjectifs.length !== localObjectifs.length ||
    initialObjectifs.map((o) => o.id).join(",") !==
      localObjectifs.map((o) => o.id).join(",")
  ) {
    setLocalObjectifs(initialObjectifs);
  }

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 5 } }),
    useSensor(KeyboardSensor)
  );

  const atteints = localObjectifs.filter(
    (o) => o.montant_actuel >= o.montant_cible
  ).length;

  function openAddModal() {
    setEditingObjectif(undefined);
    setModalOpen(true);
  }

  function openEditModal(objectif: TObjectif) {
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
          <h1 className="text-2xl font-bold text-white">Objectifs</h1>
          <p className="text-white/40 text-sm mt-1">
            {localObjectifs.length} objectif
            {localObjectifs.length !== 1 ? "s" : ""}
            {atteints > 0 && (
              <span className="text-emerald-400 ml-1">
                · {atteints} atteint{atteints > 1 ? "s" : ""}
              </span>
            )}
          </p>
        </div>

        {localObjectifs.length > 0 && (
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

      {/* ── Content ── */}
      {localObjectifs.length === 0 ? (
        <EmptyState onAdd={openAddModal} />
      ) : (
        <DndContext
          sensors={sensors}
          collisionDetection={closestCenter}
          onDragEnd={handleDragEnd}
        >
          <SortableContext
            items={localObjectifs.map((o) => o.id)}
            strategy={rectSortingStrategy}
          >
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.1 }}
              className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4"
            >
              <AnimatePresence>
                {localObjectifs.map((o) => (
                  <SortableObjectifCard
                    key={o.id}
                    objectif={o}
                    confirmingDeleteId={confirmingDeleteId}
                    onEdit={openEditModal}
                    onDeleteRequest={setConfirmingDeleteId}
                    onDeleteConfirm={handleDeleteConfirm}
                    onDeleteCancel={() => setConfirmingDeleteId(null)}
                  />
                ))}
              </AnimatePresence>
            </motion.div>
          </SortableContext>
        </DndContext>
      )}

      {/* ── Modal ── */}
      <ObjectifModal
        key={editingObjectif?.id ?? "new"}
        open={modalOpen}
        onOpenChange={setModalOpen}
        objectif={editingObjectif}
      />
    </main>
  );
}
