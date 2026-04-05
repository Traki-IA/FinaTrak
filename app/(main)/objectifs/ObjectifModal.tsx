"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "@/lib/toast";
import * as Dialog from "@radix-ui/react-dialog";
import { X, Loader2 } from "lucide-react";
import { insertObjectif, updateObjectif } from "./actions";
import type { TObjectif } from "@/types";

interface IObjectifModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  objectif?: TObjectif;
  compteId: string;
}

const INITIAL_FORM = {
  nom: "",
  montant_cible: "",
  montant_actuel: "0",
  periode: "ponctuel" as "mensuel" | "annuel" | "ponctuel",
  date_fin: "",
};

const PERIODE_LABELS: Record<string, string> = {
  mensuel: "Mensuel",
  annuel: "Annuel",
  ponctuel: "Ponctuel",
};

export default function ObjectifModal({
  open,
  onOpenChange,
  objectif,
  compteId,
}: IObjectifModalProps) {
  const router = useRouter();
  const isEditMode = Boolean(objectif);

  function buildForm(o: TObjectif) {
    return {
      nom: o.nom,
      montant_cible: o.montant_cible.toString(),
      montant_actuel: o.montant_actuel.toString(),
      periode: o.periode,
      date_fin: o.date_fin ?? "",
    };
  }

  const [form, setForm] = useState(() =>
    objectif ? buildForm(objectif) : INITIAL_FORM
  );
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Sync form when objectif prop changes (React render-time adjustment)
  const [prevObjectifId, setPrevObjectifId] = useState(objectif?.id);
  if (objectif?.id !== prevObjectifId) {
    setPrevObjectifId(objectif?.id);
    setForm(objectif ? buildForm(objectif) : INITIAL_FORM);
    setErrors({});
  }

  function set<K extends keyof typeof INITIAL_FORM>(
    key: K,
    value: (typeof INITIAL_FORM)[K]
  ) {
    setForm((prev) => ({ ...prev, [key]: value }));
    if (errors[key]) setErrors((prev) => ({ ...prev, [key]: "" }));
  }

  function handleOpenChange(nextOpen: boolean) {
    if (!nextOpen) {
      setForm(INITIAL_FORM);
      setErrors({});
    }
    onOpenChange(nextOpen);
  }

  function validate(): boolean {
    const next: Record<string, string> = {};
    if (!form.nom.trim()) next.nom = "Le nom est requis";
    const cible = parseFloat(form.montant_cible);
    if (!form.montant_cible || isNaN(cible) || cible <= 0)
      next.montant_cible = "Montant cible invalide (doit être > 0)";
    const actuel = parseFloat(form.montant_actuel);
    if (isNaN(actuel) || actuel < 0)
      next.montant_actuel = "Montant actuel invalide";
    setErrors(next);
    return Object.keys(next).length === 0;
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!validate()) return;

    setIsSubmitting(true);

    if (isEditMode && objectif) {
      const result = await updateObjectif({
        id: objectif.id,
        nom: form.nom.trim(),
        montant_cible: parseFloat(form.montant_cible),
        montant_actuel: parseFloat(form.montant_actuel),
        periode: form.periode,
        date_fin: form.date_fin || null,
      });

      setIsSubmitting(false);

      if ("error" in result) {
        toast.error(result.error);
        return;
      }

      toast.success("Objectif modifié !");
    } else {
      const result = await insertObjectif({
        nom: form.nom.trim(),
        montant_cible: parseFloat(form.montant_cible),
        montant_actuel: parseFloat(form.montant_actuel),
        periode: form.periode,
        date_fin: form.date_fin || null,
        compte_id: compteId,
      });

      setIsSubmitting(false);

      if ("error" in result) {
        toast.error(result.error);
        return;
      }

      toast.success("Objectif créé !");
    }

    handleOpenChange(false);
    router.refresh();
  }

  return (
    <Dialog.Root open={open} onOpenChange={handleOpenChange}>
      <Dialog.Portal>
        <Dialog.Overlay className="fixed inset-0 bg-black/60 backdrop-blur-sm z-40 data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0" />

        <Dialog.Content className="fixed z-50 bg-[var(--bg2)] border-[var(--border)] shadow-2xl focus:outline-none data-[state=open]:animate-in data-[state=closed]:animate-out inset-x-0 bottom-0 border-t rounded-t-2xl px-5 pt-4 pb-8 max-h-[92dvh] overflow-y-auto data-[state=closed]:slide-out-to-bottom data-[state=open]:slide-in-from-bottom sm:inset-auto sm:left-1/2 sm:top-1/2 sm:-translate-x-1/2 sm:-translate-y-1/2 sm:w-full sm:max-w-md sm:border sm:rounded-2xl sm:pb-5 sm:max-h-[90dvh] sm:data-[state=closed]:fade-out-0 sm:data-[state=open]:fade-in-0 sm:data-[state=closed]:zoom-out-95 sm:data-[state=open]:zoom-in-95">
          {/* Header */}
          <div className="flex items-center justify-between mb-4">
            <Dialog.Title className="text-base font-semibold text-[var(--text)]">
              {isEditMode ? "Modifier l'objectif" : "Nouvel objectif"}
            </Dialog.Title>
            <Dialog.Close className="text-[var(--text3)] hover:text-[var(--text)] transition-colors rounded-lg p-1 hover:bg-[var(--bg3)]">
              <X size={18} />
            </Dialog.Close>
          </div>

          <form onSubmit={handleSubmit} className="space-y-3">
            {/* Nom */}
            <div className="space-y-1">
              <label className="text-sm text-[var(--text2)] font-medium">
                Nom de l&apos;objectif
              </label>
              <input
                type="text"
                placeholder="Ex : Vacances au Japon"
                value={form.nom}
                onChange={(e) => set("nom", e.target.value)}
                className="w-full bg-[var(--bg3)] border border-[var(--border)] text-[var(--text)] placeholder:text-[var(--text3)] rounded-[10px] px-3 py-2 text-sm outline-none focus:border-[var(--orange)] transition-colors"
              />
              {errors.nom && (
                <p className="text-red-400 text-xs">{errors.nom}</p>
              )}
            </div>

            {/* Période */}
            <div className="space-y-1">
              <label className="text-sm text-[var(--text2)] font-medium">
                Période
              </label>
              <div className="flex gap-2">
                {(["ponctuel", "mensuel", "annuel"] as const).map((p) => (
                  <button
                    key={p}
                    type="button"
                    onClick={() => set("periode", p)}
                    className={`flex-1 py-2.5 rounded-[10px] text-sm font-medium transition-all border ${
                      form.periode === p
                        ? "bg-[var(--orange)]/15 border-[var(--orange)]/40 text-[var(--orange)]"
                        : "bg-[var(--bg3)] border-[var(--border)] text-[var(--text3)] hover:text-[var(--text)]/70"
                    }`}
                  >
                    {PERIODE_LABELS[p]}
                  </button>
                ))}
              </div>
            </div>

            {/* Montants */}
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1">
                <label className="text-sm text-[var(--text2)] font-medium">
                  Montant cible (€)
                </label>
                <input
                  type="number"
                  step="0.01"
                  min="0.01"
                  placeholder="1 000,00"
                  value={form.montant_cible}
                  onChange={(e) => set("montant_cible", e.target.value)}
                  className="w-full bg-[var(--bg3)] border border-[var(--border)] text-[var(--text)] placeholder:text-[var(--text3)] rounded-[10px] px-3 py-2 text-sm outline-none focus:border-[var(--orange)] transition-colors"
                />
                {errors.montant_cible && (
                  <p className="text-red-400 text-xs">{errors.montant_cible}</p>
                )}
              </div>

              <div className="space-y-1">
                <label className="text-sm text-[var(--text2)] font-medium">
                  Déjà épargné (€)
                </label>
                <input
                  type="number"
                  step="0.01"
                  min="0"
                  placeholder="0,00"
                  value={form.montant_actuel}
                  onChange={(e) => set("montant_actuel", e.target.value)}
                  className="w-full bg-[var(--bg3)] border border-[var(--border)] text-[var(--text)] placeholder:text-[var(--text3)] rounded-[10px] px-3 py-2 text-sm outline-none focus:border-[var(--orange)] transition-colors"
                />
                {errors.montant_actuel && (
                  <p className="text-red-400 text-xs">
                    {errors.montant_actuel}
                  </p>
                )}
              </div>
            </div>

            {/* Date fin */}
            <div className="space-y-1">
              <label className="text-sm text-[var(--text2)] font-medium">
                Date limite{" "}
                <span className="text-[var(--text3)] font-normal">(optionnel)</span>
              </label>
              <input
                type="date"
                value={form.date_fin}
                onChange={(e) => set("date_fin", e.target.value)}
                className="w-full bg-[var(--bg3)] border border-[var(--border)] text-[var(--text)] rounded-[10px] px-3 py-2 text-sm outline-none focus:border-[var(--orange)] transition-colors cursor-pointer"
                style={{ colorScheme: "dark" }}
              />
            </div>

            {/* Actions */}
            <div className="flex gap-3 pt-2">
              <Dialog.Close asChild>
                <button
                  type="button"
                  className="flex-1 py-2.5 rounded-[10px] text-sm font-medium text-[var(--text3)] hover:text-[var(--text)] bg-[var(--bg3)] hover:bg-[var(--bg3)] border border-[var(--border)] transition-all"
                >
                  Annuler
                </button>
              </Dialog.Close>
              <button
                type="submit"
                disabled={isSubmitting}
                className="flex-1 flex items-center justify-center gap-2 py-2.5 rounded-[10px] text-sm font-medium bg-[var(--orange)] hover:bg-orange-400 disabled:opacity-60 disabled:cursor-not-allowed text-white transition-all"
              >
                {isSubmitting && (
                  <Loader2 size={14} className="animate-spin" />
                )}
                {isSubmitting
                  ? isEditMode
                    ? "Modification…"
                    : "Création…"
                  : isEditMode
                  ? "Modifier"
                  : "Créer"}
              </button>
            </div>
          </form>
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  );
}
