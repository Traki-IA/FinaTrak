"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import { Plus, Trash2, Loader2, Target, Calendar } from "lucide-react";
import { toast } from "sonner";
import ObjectifModal from "./ObjectifModal";
import { deleteObjectif, updateObjectifMontant } from "./actions";
import type { TObjectif } from "@/types";

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

// ── Objectif Card ─────────────────────────────────────────────────────────────

function ObjectifCard({ objectif }: { objectif: TObjectif }) {
  const router = useRouter();
  const [isDeleting, setIsDeleting] = useState(false);
  const [isUpdating, setIsUpdating] = useState(false);
  const [showInput, setShowInput] = useState(false);
  const [inputValue, setInputValue] = useState(
    objectif.montant_actuel.toString()
  );

  const pct = Math.min(
    (objectif.montant_actuel / objectif.montant_cible) * 100,
    100
  );
  const atteint = objectif.montant_actuel >= objectif.montant_cible;
  const restant = objectif.montant_cible - objectif.montant_actuel;

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

  // Progress bar color
  const barColor = atteint
    ? "#22c55e"
    : pct >= 66
    ? "#14b8a6"
    : pct >= 33
    ? "#f97316"
    : "#ef4444";

  const jours =
    objectif.date_fin ? joursRestants(objectif.date_fin) : null;

  return (
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

        <button
          onClick={handleDelete}
          disabled={isDeleting}
          className="text-white/25 hover:text-red-400 transition-colors p-1.5 rounded-lg hover:bg-red-500/10 flex-shrink-0 disabled:opacity-50"
        >
          {isDeleting ? (
            <Loader2 size={15} className="animate-spin" />
          ) : (
            <Trash2 size={15} />
          )}
        </button>
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
            {atteint ? "Objectif atteint !" : `${formatEur(restant)} restants`}
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
        Créez votre premier objectif d'épargne
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
            onClick={() => setModalOpen(true)}
            className="flex items-center gap-2 bg-orange-500 hover:bg-orange-600 text-white px-4 py-2.5 rounded-xl font-medium text-sm transition-colors"
          >
            <Plus size={16} />
            Ajouter
          </motion.button>
        )}
      </motion.div>

      {/* ── Content ── */}
      {objectifs.length === 0 ? (
        <EmptyState onAdd={() => setModalOpen(true)} />
      ) : (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.1 }}
          className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4"
        >
          <AnimatePresence>
            {objectifs.map((o) => (
              <ObjectifCard key={o.id} objectif={o} />
            ))}
          </AnimatePresence>
        </motion.div>
      )}

      {/* ── Modal ── */}
      <ObjectifModal open={modalOpen} onOpenChange={setModalOpen} />
    </main>
  );
}
