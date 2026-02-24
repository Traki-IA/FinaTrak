"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import * as Dialog from "@radix-ui/react-dialog";
import { X, Loader2, Plus, Link2, Target } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { insertBudgetItem, updateBudgetItem } from "./actions";
import type { TCategorie, TObjectif, TBudgetItemWithRelations } from "@/types";

// ── Types ─────────────────────────────────────────────────────────────────────

type ObjectifMode = "none" | "existing" | "new";

interface IBudgetModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  categories: TCategorie[];
  objectifs: TObjectif[];
  budgetItem?: TBudgetItemWithRelations;
}

const INITIAL_FORM = {
  nom: "",
  montant: "",
  frequence: "mensuel" as "mensuel" | "annuel",
  categorie_id: "",
  objectifMode: "none" as ObjectifMode,
  objectif_id: "",
  objectif_nom: "",
  objectif_cible: "",
  objectif_periode: "ponctuel" as "mensuel" | "annuel" | "ponctuel",
};

// ── Section objectif mode button ──────────────────────────────────────────────

function ModeButton({
  active,
  onClick,
  icon,
  label,
}: {
  active: boolean;
  onClick: () => void;
  icon: React.ReactNode;
  label: string;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl text-xs font-medium transition-all border ${
        active
          ? "bg-orange-500/15 border-orange-500/40 text-orange-400"
          : "bg-white/[0.04] border-white/[0.08] text-white/40 hover:text-white/70"
      }`}
    >
      {icon}
      {label}
    </button>
  );
}

// ── Composant principal ───────────────────────────────────────────────────────

export default function BudgetModal({
  open,
  onOpenChange,
  categories,
  objectifs,
  budgetItem,
}: IBudgetModalProps) {
  const router = useRouter();
  const isEditMode = Boolean(budgetItem);
  const [form, setForm] = useState(() =>
    budgetItem
      ? {
          nom: budgetItem.nom,
          montant: budgetItem.montant.toString(),
          frequence: budgetItem.frequence,
          categorie_id: budgetItem.categorie_id ?? "",
          objectifMode: (budgetItem.objectif_id ? "existing" : "none") as ObjectifMode,
          objectif_id: budgetItem.objectif_id ?? "",
          objectif_nom: "",
          objectif_cible: "",
          objectif_periode: "ponctuel" as "mensuel" | "annuel" | "ponctuel",
        }
      : INITIAL_FORM
  );
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);

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
    const m = parseFloat(form.montant);
    if (!form.montant || isNaN(m) || m <= 0)
      next.montant = "Montant invalide (doit être > 0)";
    if (form.objectifMode === "new") {
      if (!form.objectif_nom.trim())
        next.objectif_nom = "Le nom de l'objectif est requis";
      const c = parseFloat(form.objectif_cible);
      if (!form.objectif_cible || isNaN(c) || c <= 0)
        next.objectif_cible = "Montant cible invalide";
    }
    setErrors(next);
    return Object.keys(next).length === 0;
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!validate()) return;

    setIsSubmitting(true);

    if (isEditMode && budgetItem) {
      const result = await updateBudgetItem({
        id: budgetItem.id,
        nom: form.nom.trim(),
        montant: parseFloat(form.montant),
        frequence: form.frequence,
        categorie_id: form.categorie_id || null,
        objectif_id:
          form.objectifMode === "existing" ? form.objectif_id || null : null,
      });

      setIsSubmitting(false);

      if ("error" in result) {
        toast.error(result.error);
        return;
      }

      toast.success("Charge modifiée !");
    } else {
      const result = await insertBudgetItem({
        nom: form.nom.trim(),
        montant: parseFloat(form.montant),
        frequence: form.frequence,
        categorie_id: form.categorie_id || null,
        objectif_id:
          form.objectifMode === "existing" ? form.objectif_id || null : null,
        creer_objectif: form.objectifMode === "new",
        objectif_nom:
          form.objectifMode === "new" ? form.objectif_nom.trim() : null,
        objectif_cible:
          form.objectifMode === "new" ? parseFloat(form.objectif_cible) : null,
        objectif_periode:
          form.objectifMode === "new" ? form.objectif_periode : null,
      });

      setIsSubmitting(false);

      if ("error" in result) {
        toast.error(result.error);
        return;
      }

      const successMsg =
        form.objectifMode === "new"
          ? `Charge ajoutée · Objectif « ${form.objectif_nom} » créé !`
          : "Charge budgétaire ajoutée !";
      toast.success(successMsg);
    }

    handleOpenChange(false);
    router.refresh();
  }

  const objectifMode = form.objectifMode;

  return (
    <Dialog.Root open={open} onOpenChange={handleOpenChange}>
      <Dialog.Portal>
        <Dialog.Overlay className="fixed inset-0 bg-black/60 backdrop-blur-sm z-40 data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0" />

        <Dialog.Content className="fixed left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 z-50 w-full max-w-lg bg-[#0f0f1a] border border-white/[0.1] rounded-2xl p-6 shadow-2xl focus:outline-none max-h-[90vh] overflow-y-auto data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0 data-[state=closed]:zoom-out-95 data-[state=open]:zoom-in-95">
          {/* Header */}
          <div className="flex items-center justify-between mb-6">
            <Dialog.Title className="text-lg font-semibold text-white">
              {isEditMode ? "Modifier la charge" : "Nouvelle charge budgétaire"}
            </Dialog.Title>
            <Dialog.Close className="text-white/40 hover:text-white transition-colors rounded-lg p-1 hover:bg-white/[0.06]">
              <X size={18} />
            </Dialog.Close>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            {/* ── Nom ── */}
            <div className="space-y-1.5">
              <label className="text-sm text-white/60 font-medium">
                Nom de la charge
              </label>
              <input
                type="text"
                placeholder="Ex : Loyer, Abonnement Netflix…"
                value={form.nom}
                onChange={(e) => set("nom", e.target.value)}
                className="w-full bg-white/[0.05] border border-white/[0.1] text-white placeholder:text-white/25 rounded-xl px-4 py-2.5 text-sm outline-none focus:border-orange-500/60 transition-colors"
              />
              {errors.nom && (
                <p className="text-red-400 text-xs">{errors.nom}</p>
              )}
            </div>

            {/* ── Montant + Fréquence ── */}
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <label className="text-sm text-white/60 font-medium">
                  Montant (€)
                </label>
                <input
                  type="number"
                  step="0.01"
                  min="0.01"
                  placeholder="0,00"
                  value={form.montant}
                  onChange={(e) => set("montant", e.target.value)}
                  className="w-full bg-white/[0.05] border border-white/[0.1] text-white placeholder:text-white/25 rounded-xl px-4 py-2.5 text-sm outline-none focus:border-orange-500/60 transition-colors"
                />
                {errors.montant && (
                  <p className="text-red-400 text-xs">{errors.montant}</p>
                )}
              </div>

              <div className="space-y-1.5">
                <label className="text-sm text-white/60 font-medium">
                  Fréquence
                </label>
                <div className="flex gap-2 h-[42px]">
                  {(["mensuel", "annuel"] as const).map((f) => (
                    <button
                      key={f}
                      type="button"
                      onClick={() => set("frequence", f)}
                      className={`flex-1 rounded-xl text-sm font-medium transition-all border ${
                        form.frequence === f
                          ? "bg-orange-500/15 border-orange-500/40 text-orange-400"
                          : "bg-white/[0.04] border-white/[0.08] text-white/40 hover:text-white/70"
                      }`}
                    >
                      {f === "mensuel" ? "/ mois" : "/ an"}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            {/* ── Catégorie ── */}
            <div className="space-y-1.5">
              <label className="text-sm text-white/60 font-medium">
                Catégorie{" "}
                <span className="text-white/30 font-normal">(optionnel)</span>
              </label>
              <select
                value={form.categorie_id}
                onChange={(e) => set("categorie_id", e.target.value)}
                className="w-full bg-white/[0.05] border border-white/[0.1] text-white rounded-xl px-4 py-2.5 text-sm outline-none focus:border-orange-500/60 transition-colors cursor-pointer appearance-none"
                style={{ colorScheme: "dark" }}
              >
                <option value="" className="bg-[#0f0f1a]">
                  Aucune catégorie
                </option>
                {categories.map((cat) => (
                  <option key={cat.id} value={cat.id} className="bg-[#0f0f1a]">
                    {cat.nom}
                  </option>
                ))}
              </select>
            </div>

            {/* ── Objectif financier ── */}
            <div className="space-y-3 pt-1">
              <div className="flex items-center gap-2">
                <Target size={14} className="text-white/40" />
                <label className="text-sm text-white/60 font-medium">
                  Objectif financier lié
                </label>
              </div>

              <div className="flex gap-2">
                <ModeButton
                  active={objectifMode === "none"}
                  onClick={() => set("objectifMode", "none")}
                  icon={<X size={13} />}
                  label="Aucun"
                />
                <ModeButton
                  active={objectifMode === "existing"}
                  onClick={() => set("objectifMode", "existing")}
                  icon={<Link2 size={13} />}
                  label="Lier un existant"
                />
                {!isEditMode && (
                  <ModeButton
                    active={objectifMode === "new"}
                    onClick={() => set("objectifMode", "new")}
                    icon={<Plus size={13} />}
                    label="Créer un objectif"
                  />
                )}
              </div>

              <AnimatePresence>
                {objectifMode === "existing" && (
                  <motion.div
                    key="existing"
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: "auto" }}
                    exit={{ opacity: 0, height: 0 }}
                    transition={{ duration: 0.2 }}
                    className="overflow-hidden"
                  >
                    <select
                      value={form.objectif_id}
                      onChange={(e) => set("objectif_id", e.target.value)}
                      className="w-full bg-white/[0.05] border border-white/[0.1] text-white rounded-xl px-4 py-2.5 text-sm outline-none focus:border-orange-500/60 transition-colors cursor-pointer appearance-none"
                      style={{ colorScheme: "dark" }}
                    >
                      <option value="" className="bg-[#0f0f1a]">
                        Sélectionner un objectif…
                      </option>
                      {objectifs.map((obj) => {
                        const pct = Math.round(
                          (obj.montant_actuel / obj.montant_cible) * 100
                        );
                        return (
                          <option
                            key={obj.id}
                            value={obj.id}
                            className="bg-[#0f0f1a]"
                          >
                            {obj.nom} · {pct}%
                          </option>
                        );
                      })}
                    </select>
                    {objectifs.length === 0 && (
                      <p className="text-white/30 text-xs mt-1.5">
                        Aucun objectif existant. Utilisez « Créer un objectif »
                        pour en définir un.
                      </p>
                    )}
                  </motion.div>
                )}

                {objectifMode === "new" && !isEditMode && (
                  <motion.div
                    key="new"
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: "auto" }}
                    exit={{ opacity: 0, height: 0 }}
                    transition={{ duration: 0.2 }}
                    className="overflow-hidden"
                  >
                    <div className="bg-white/[0.03] border border-orange-500/20 rounded-xl p-4 space-y-3">
                      <p className="text-xs text-orange-400/80 font-medium">
                        Un nouvel objectif sera créé et lié à cette charge
                      </p>

                      <div className="space-y-1.5">
                        <label className="text-xs text-white/50 font-medium">
                          Nom de l&apos;objectif
                        </label>
                        <input
                          type="text"
                          placeholder="Ex : Épargne vacances, Fonds urgence…"
                          value={form.objectif_nom}
                          onChange={(e) => set("objectif_nom", e.target.value)}
                          className="w-full bg-white/[0.05] border border-white/[0.1] text-white placeholder:text-white/20 rounded-xl px-3 py-2 text-sm outline-none focus:border-orange-500/60 transition-colors"
                        />
                        {errors.objectif_nom && (
                          <p className="text-red-400 text-xs">
                            {errors.objectif_nom}
                          </p>
                        )}
                      </div>

                      <div className="grid grid-cols-2 gap-3">
                        <div className="space-y-1.5">
                          <label className="text-xs text-white/50 font-medium">
                            Montant cible (€)
                          </label>
                          <input
                            type="number"
                            step="0.01"
                            min="0.01"
                            placeholder="5 000,00"
                            value={form.objectif_cible}
                            onChange={(e) =>
                              set("objectif_cible", e.target.value)
                            }
                            className="w-full bg-white/[0.05] border border-white/[0.1] text-white placeholder:text-white/20 rounded-xl px-3 py-2 text-sm outline-none focus:border-orange-500/60 transition-colors"
                          />
                          {errors.objectif_cible && (
                            <p className="text-red-400 text-xs">
                              {errors.objectif_cible}
                            </p>
                          )}
                        </div>

                        <div className="space-y-1.5">
                          <label className="text-xs text-white/50 font-medium">
                            Période
                          </label>
                          <select
                            value={form.objectif_periode}
                            onChange={(e) =>
                              set(
                                "objectif_periode",
                                e.target.value as
                                  | "mensuel"
                                  | "annuel"
                                  | "ponctuel"
                              )
                            }
                            className="w-full bg-white/[0.05] border border-white/[0.1] text-white rounded-xl px-3 py-2 text-sm outline-none focus:border-orange-500/60 transition-colors cursor-pointer"
                            style={{ colorScheme: "dark" }}
                          >
                            <option value="ponctuel" className="bg-[#0f0f1a]">
                              Ponctuel
                            </option>
                            <option value="mensuel" className="bg-[#0f0f1a]">
                              Mensuel
                            </option>
                            <option value="annuel" className="bg-[#0f0f1a]">
                              Annuel
                            </option>
                          </select>
                        </div>
                      </div>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>

            {/* ── Actions ── */}
            <div className="flex gap-3 pt-2">
              <Dialog.Close asChild>
                <button
                  type="button"
                  className="flex-1 py-2.5 rounded-xl text-sm font-medium text-white/50 hover:text-white bg-white/[0.04] hover:bg-white/[0.08] border border-white/[0.07] transition-all"
                >
                  Annuler
                </button>
              </Dialog.Close>
              <button
                type="submit"
                disabled={isSubmitting}
                className="flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl text-sm font-medium bg-orange-500 hover:bg-orange-600 disabled:opacity-60 disabled:cursor-not-allowed text-white transition-all"
              >
                {isSubmitting && (
                  <Loader2 size={14} className="animate-spin" />
                )}
                {isSubmitting
                  ? isEditMode
                    ? "Modification…"
                    : "Enregistrement…"
                  : isEditMode
                  ? "Modifier"
                  : "Ajouter la charge"}
              </button>
            </div>
          </form>
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  );
}
