"use client";

import { useState, useMemo } from "react";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import {
  Plus,
  Pencil,
  Loader2,
  Target,
  Calendar,
  GripVertical,
  ChevronDown,
  TrendingUp,
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
import type { TObjectifWithBudgetLines } from "@/types";

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

function moisRestants(dateFin: string): number {
  const now = new Date();
  const fin = new Date(dateFin);
  const mois =
    (fin.getFullYear() - now.getFullYear()) * 12 +
    (fin.getMonth() - now.getMonth());
  return Math.max(1, mois);
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
  objectif: TObjectifWithBudgetLines;
  confirmingDeleteId: string | null;
  onEdit: (o: TObjectifWithBudgetLines) => void;
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
  const [budgetLinesOpen, setBudgetLinesOpen] = useState(false);

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
  const restant = Math.max(0, objectif.montant_cible - objectif.montant_actuel);
  const isConfirming = confirmingDeleteId === objectif.id;

  const jours = objectif.date_fin ? joursRestants(objectif.date_fin) : null;
  const objectifMensuel =
    !atteint && objectif.date_fin && jours !== null && jours > 0
      ? restant / moisRestants(objectif.date_fin)
      : null;

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

        {/* Progress — Refactorisé */}
        <div>
          <div className="flex items-center justify-between mb-2 text-xs">
            <span className="text-white/50">
              {formatEur(objectif.montant_actuel)} sur{" "}
              {formatEur(objectif.montant_cible)}
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
          <div className="mt-2 text-xs">
            {atteint ? (
              <span className="text-emerald-400 font-medium">
                ✓ Objectif atteint !
              </span>
            ) : (
              <span className="text-white/40">
                Il reste {formatEur(restant)} à couvrir
              </span>
            )}
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

        {/* Objectif mensuel */}
        {objectifMensuel !== null && (
          <div className="bg-orange-500/10 border border-orange-500/20 rounded-xl px-3.5 py-2.5 flex items-center gap-2.5">
            <TrendingUp size={14} className="text-orange-400 flex-shrink-0" />
            <div className="text-xs">
              <span className="text-orange-300/70">Objectif mensuel : </span>
              <span className="text-orange-300 font-semibold">
                {formatEur(objectifMensuel)}
              </span>
              <span className="text-orange-300/50"> / mois</span>
            </div>
          </div>
        )}

        {/* Accordéon lignes de budget */}
        {objectif.budget_lines.length > 0 && (
          <div>
            <button
              onClick={() => setBudgetLinesOpen(!budgetLinesOpen)}
              className="flex items-center gap-1.5 text-xs text-white/40 hover:text-white/70 transition-colors w-full"
            >
              <ChevronDown
                size={13}
                className={`transition-transform duration-200 ${
                  budgetLinesOpen ? "rotate-180" : ""
                }`}
              />
              Voir les lignes de budget ({objectif.budget_lines.length})
            </button>

            <AnimatePresence>
              {budgetLinesOpen && (
                <motion.div
                  initial={{ height: 0, opacity: 0 }}
                  animate={{ height: "auto", opacity: 1 }}
                  exit={{ height: 0, opacity: 0 }}
                  transition={{ duration: 0.2 }}
                  className="overflow-hidden"
                >
                  <div className="mt-2.5 space-y-2">
                    {objectif.budget_lines.map((line) => {
                      const linePct = Math.min(
                        (line.consomme / line.montant) * 100,
                        100
                      );
                      const lineColor =
                        linePct >= 100
                          ? "#22c55e"
                          : linePct >= 50
                          ? "#f97316"
                          : "#ef4444";

                      return (
                        <div
                          key={line.id}
                          className="bg-white/[0.03] border border-white/[0.06] rounded-xl px-3 py-2.5"
                        >
                          <div className="flex items-center justify-between mb-1.5">
                            <span className="text-xs text-white/60 font-medium truncate">
                              {line.nom}
                            </span>
                            <span className="text-xs text-white/40 flex-shrink-0 ml-2">
                              {formatEur(line.consomme)} /{" "}
                              {formatEur(line.montant)}
                            </span>
                          </div>
                          <div className="h-1.5 bg-white/[0.06] rounded-full overflow-hidden">
                            <motion.div
                              initial={{ width: 0 }}
                              animate={{ width: `${linePct}%` }}
                              transition={{
                                duration: 0.6,
                                ease: "easeOut",
                              }}
                              className="h-full rounded-full"
                              style={{ background: lineColor }}
                            />
                          </div>
                          <div className="flex items-center justify-between mt-1 text-[10px]">
                            <span className="text-white/30">
                              {line.frequence === "mensuel"
                                ? "Mensuel"
                                : "Annuel"}
                            </span>
                            <span className="text-white/40 font-medium">
                              {linePct.toFixed(0)} %
                            </span>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
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
  compteId,
}: {
  objectifs: TObjectifWithBudgetLines[];
  compteId: string;
}) {
  const router = useRouter();
  const [modalOpen, setModalOpen] = useState(false);
  const [editingObjectif, setEditingObjectif] = useState<
    TObjectifWithBudgetLines | undefined
  >(undefined);
  const [confirmingDeleteId, setConfirmingDeleteId] = useState<string | null>(
    null
  );
  const [localObjectifs, setLocalObjectifs] = useState(initialObjectifs);

  // Sync when server data changes (including field edits)
  const serverKey = initialObjectifs
    .map((o) => `${o.id}-${o.sort_order}-${o.nom}-${o.montant_cible}-${o.montant_actuel}-${o.date_fin}-${o.periode}`)
    .join("|");
  useMemo(() => {
    setLocalObjectifs(initialObjectifs);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [serverKey]);

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
        compteId={compteId}
      />
    </main>
  );
}
