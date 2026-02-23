"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence, Reorder, useDragControls } from "framer-motion";
import {
  Plus,
  Trash2,
  Loader2,
  Target,
  Calendar,
  Pencil,
  GripVertical,
} from "lucide-react";
import { toast } from "sonner";
import ObjectifModal from "./ObjectifModal";
import { deleteObjectif } from "./actions";
import type { TObjectif } from "@/types";

const STORAGE_KEY = "finatrak_objectifs_order";

// ── Helpers ───────────────────────────────────────────────────────────────────

function formatEur(n: number) {
  return new Intl.NumberFormat("fr-FR", {
    style: "currency",
    currency: "EUR",
  }).format(n);
}

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

// ── Objectif Row (compact, drag-and-drop) ─────────────────────────────────────

function ObjectifRow({
  objectif,
  onEdit,
}: {
  objectif: TObjectif;
  onEdit: () => void;
}) {
  const controls = useDragControls();
  const router = useRouter();
  const [isDeleting, setIsDeleting] = useState(false);

  const pct = Math.min(
    (objectif.montant_actuel / objectif.montant_cible) * 100,
    100
  );
  const atteint = objectif.montant_actuel >= objectif.montant_cible;

  const barColor = atteint
    ? "#22c55e"
    : pct >= 66
    ? "#14b8a6"
    : pct >= 33
    ? "#f97316"
    : "#ef4444";

  const jours =
    objectif.date_fin ? joursRestants(objectif.date_fin) : null;

  async function handleDelete() {
    setIsDeleting(true);
    const result = await deleteObjectif(objectif.id);
    if ("error" in result) {
      toast.error(result.error);
      setIsDeleting(false);
      return;
    }
    toast.success("Objectif supprimé");
    router.refresh();
  }

  return (
    <Reorder.Item
      value={objectif}
      dragListener={false}
      dragControls={controls}
      layout
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, x: -16 }}
      transition={{ duration: 0.22 }}
      as="div"
      className="flex items-center gap-3 px-3 py-2.5 rounded-xl border bg-white/[0.04] border-white/[0.07] hover:border-white/[0.12] transition-colors"
    >
      {/* Drag handle */}
      <GripVertical
        size={15}
        className="text-white/20 hover:text-white/50 cursor-grab active:cursor-grabbing flex-shrink-0 touch-none"
        onPointerDown={(e) => controls.start(e)}
      />

      {/* Icon */}
      <div
        className="w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0"
        style={{ background: `${barColor}22`, color: barColor }}
      >
        <Target size={14} />
      </div>

      {/* Main info */}
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 mb-1">
          <p className="text-sm font-medium text-white truncate">
            {objectif.nom}
          </p>
          {atteint && (
            <span className="text-[10px] bg-emerald-500/15 text-emerald-400 px-1.5 py-0.5 rounded-full font-medium flex-shrink-0">
              ✓
            </span>
          )}
          <span
            className={`text-[10px] px-1.5 py-0.5 rounded-md font-medium flex-shrink-0 ${PERIODE_COLORS[objectif.periode]}`}
          >
            {PERIODE_LABELS[objectif.periode]}
          </span>
        </div>

        {/* Progress bar */}
        <div className="flex items-center gap-2">
          <div className="flex-1 h-1.5 bg-white/[0.07] rounded-full overflow-hidden">
            <motion.div
              initial={{ width: 0 }}
              animate={{ width: `${pct}%` }}
              transition={{ duration: 0.6, ease: "easeOut" }}
              className="h-full rounded-full"
              style={{ background: barColor }}
            />
          </div>
          <span className="text-[10px] text-white/50 tabular-nums flex-shrink-0 w-8 text-right">
            {pct.toFixed(0)}%
          </span>
        </div>
      </div>

      {/* Amounts */}
      <div className="text-right flex-shrink-0 hidden sm:block">
        <p className="text-sm font-semibold text-white tabular-nums">
          {formatEur(objectif.montant_actuel)}
        </p>
        <p className="text-[10px] text-white/35 tabular-nums">
          / {formatEur(objectif.montant_cible)}
        </p>
      </div>

      {/* Days remaining */}
      {jours !== null && (
        <div
          className={`text-[10px] hidden md:block flex-shrink-0 w-10 text-right ${
            jours < 0
              ? "text-red-400"
              : jours <= 30
              ? "text-orange-400"
              : "text-white/30"
          }`}
          title={
            objectif.date_fin
              ? `Échéance : ${formatDate(objectif.date_fin)}`
              : undefined
          }
        >
          {jours < 0 ? (
            <span className="flex items-center justify-end gap-1">
              <Calendar size={10} />
              Échue
            </span>
          ) : (
            <span className="flex items-center justify-end gap-1">
              <Calendar size={10} />
              {jours}j
            </span>
          )}
        </div>
      )}

      {/* Actions */}
      <div className="flex items-center gap-1 flex-shrink-0">
        <button
          onClick={onEdit}
          className="p-1.5 rounded-lg text-white/25 hover:text-white hover:bg-white/[0.07] transition-colors"
          title="Modifier"
        >
          <Pencil size={13} />
        </button>
        <button
          onClick={handleDelete}
          disabled={isDeleting}
          className="p-1.5 rounded-lg text-white/25 hover:text-red-400 hover:bg-red-500/10 transition-colors disabled:opacity-50"
          title="Supprimer"
        >
          {isDeleting ? (
            <Loader2 size={13} className="animate-spin" />
          ) : (
            <Trash2 size={13} />
          )}
        </button>
      </div>
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
  objectifs,
}: {
  objectifs: TObjectif[];
}) {
  const [modalOpen, setModalOpen] = useState(false);
  const [editingObjectif, setEditingObjectif] = useState<
    TObjectif | undefined
  >(undefined);
  const [items, setItems] = useState<TObjectif[]>(objectifs);

  // Restore order from localStorage and sync with fresh server data
  useEffect(() => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (stored) {
        const order: string[] = JSON.parse(stored);
        const sorted = [...objectifs].sort((a, b) => {
          const ia = order.indexOf(a.id);
          const ib = order.indexOf(b.id);
          if (ia === -1) return 1;
          if (ib === -1) return -1;
          return ia - ib;
        });
        setItems(sorted);
        return;
      }
    } catch {
      // ignore
    }
    setItems(objectifs);
  }, [objectifs]);

  function handleReorder(newItems: TObjectif[]) {
    setItems(newItems);
    try {
      localStorage.setItem(
        STORAGE_KEY,
        JSON.stringify(newItems.map((o) => o.id))
      );
    } catch {
      // ignore
    }
  }

  function openAddModal() {
    setEditingObjectif(undefined);
    setModalOpen(true);
  }

  function openEditModal(objectif: TObjectif) {
    setEditingObjectif(objectif);
    setModalOpen(true);
  }

  const atteints = objectifs.filter(
    (o) => o.montant_actuel >= o.montant_cible
  ).length;

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
          <h1 className="text-2xl font-bold text-white">Objectifs</h1>
          <p className="text-white/40 text-sm mt-1">
            {objectifs.length} objectif{objectifs.length !== 1 ? "s" : ""}
            {atteints > 0 && (
              <span className="text-emerald-400 ml-1">
                · {atteints} atteint{atteints > 1 ? "s" : ""}
              </span>
            )}
          </p>
        </div>

        {objectifs.length > 0 && (
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

      {/* ── Content ── */}
      {objectifs.length === 0 ? (
        <EmptyState onAdd={openAddModal} />
      ) : (
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1, duration: 0.3 }}
        >
          {/* Column headers hint */}
          <div className="flex items-center gap-3 px-3 mb-2 text-[10px] text-white/25 uppercase tracking-wider">
            <span className="w-3.5 flex-shrink-0" />
            <span className="w-8 flex-shrink-0" />
            <span className="flex-1">Objectif</span>
            <span className="hidden sm:block w-24 text-right">Épargné / Cible</span>
            <span className="hidden md:block w-10 text-right">Échéance</span>
            <span className="w-16 text-right">Actions</span>
          </div>

          <Reorder.Group
            axis="y"
            values={items}
            onReorder={handleReorder}
            as="div"
            className="space-y-1.5"
          >
            <AnimatePresence>
              {items.map((o) => (
                <ObjectifRow
                  key={o.id}
                  objectif={o}
                  onEdit={() => openEditModal(o)}
                />
              ))}
            </AnimatePresence>
          </Reorder.Group>
        </motion.div>
      )}

      {/* ── Modal ── */}
      <ObjectifModal
        open={modalOpen}
        onOpenChange={setModalOpen}
        objectif={editingObjectif}
      />
    </main>
  );
}
