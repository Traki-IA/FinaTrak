"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import * as Dialog from "@radix-ui/react-dialog";
import { X, Loader2 } from "lucide-react";
import { insertTransaction, updateTransaction } from "./actions";
import type { TCategorie, TObjectif, TTransactionWithCategorie } from "@/types";

interface ITransactionModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  categories: TCategorie[];
  objectifs: TObjectif[];
  /** Si fourni, le modal s'ouvre en mode édition */
  transaction?: TTransactionWithCategorie | null;
}

const INITIAL_FORM = {
  montant: "",
  type: "depense" as "revenu" | "depense",
  categorie_id: "",
  description: "",
  date: new Date().toISOString().split("T")[0],
  objectif_id: "",
};

export default function TransactionModal({
  open,
  onOpenChange,
  categories,
  objectifs,
  transaction,
}: ITransactionModalProps) {
  const router = useRouter();
  const isEditing = Boolean(transaction);

  const [form, setForm] = useState(INITIAL_FORM);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Pré-remplir le formulaire à l'ouverture selon le mode
  useEffect(() => {
    if (open) {
      if (transaction) {
        setForm({
          montant: String(transaction.montant),
          type: transaction.type,
          categorie_id: transaction.categorie_id ?? "",
          description: transaction.description ?? "",
          date: transaction.date,
          objectif_id: "",
        });
      } else {
        setForm(INITIAL_FORM);
      }
      setErrors({});
    }
  }, [open, transaction]);

  function set<K extends keyof typeof INITIAL_FORM>(
    key: K,
    value: (typeof INITIAL_FORM)[K]
  ) {
    setForm((prev) => ({ ...prev, [key]: value }));
    if (errors[key]) setErrors((prev) => ({ ...prev, [key]: "" }));
  }

  function validate(): boolean {
    const next: Record<string, string> = {};

    const montant = parseFloat(form.montant);
    if (!form.montant || isNaN(montant) || montant <= 0)
      next.montant = "Montant invalide (doit être > 0)";
    if (!form.date) next.date = "La date est requise";

    setErrors(next);
    return Object.keys(next).length === 0;
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!validate()) return;

    setIsSubmitting(true);

    if (isEditing && transaction) {
      const result = await updateTransaction({
        id: transaction.id,
        montant: parseFloat(form.montant),
        type: form.type,
        categorie_id: form.categorie_id || null,
        description: form.description || null,
        date: form.date,
      });

      setIsSubmitting(false);

      if ("error" in result) {
        toast.error(result.error);
        return;
      }

      toast.success("Transaction modifiée !");
    } else {
      const result = await insertTransaction({
        montant: parseFloat(form.montant),
        type: form.type,
        categorie_id: form.categorie_id || null,
        description: form.description || null,
        date: form.date,
        objectif_id: form.objectif_id || null,
      });

      setIsSubmitting(false);

      if ("error" in result) {
        toast.error(result.error);
        return;
      }

      if (result.objectifUpdated) {
        const objectif = objectifs.find((o) => o.id === form.objectif_id);
        toast.success(
          `Transaction ajoutée · Progression de « ${objectif?.nom} » mise à jour`
        );
      } else {
        toast.success("Transaction ajoutée !");
      }
    }

    onOpenChange(false);
    router.refresh();
  }

  return (
    <Dialog.Root open={open} onOpenChange={onOpenChange}>
      <Dialog.Portal>
        {/* Overlay */}
        <Dialog.Overlay className="fixed inset-0 bg-black/60 backdrop-blur-sm z-40 data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0" />

        {/* Content */}
        <Dialog.Content className="fixed z-50 bg-[#0f0f1a] border-white/[0.1] shadow-2xl focus:outline-none data-[state=open]:animate-in data-[state=closed]:animate-out inset-x-0 bottom-0 border-t rounded-t-2xl p-6 pb-10 max-h-[92dvh] overflow-y-auto data-[state=closed]:slide-out-to-bottom data-[state=open]:slide-in-from-bottom sm:inset-auto sm:left-1/2 sm:top-1/2 sm:-translate-x-1/2 sm:-translate-y-1/2 sm:w-full sm:max-w-md sm:border sm:rounded-2xl sm:pb-6 sm:max-h-[90dvh] sm:data-[state=closed]:fade-out-0 sm:data-[state=open]:fade-in-0 sm:data-[state=closed]:zoom-out-95 sm:data-[state=open]:zoom-in-95">
          {/* Header */}
          <div className="flex items-center justify-between mb-6">
            <Dialog.Title className="text-lg font-semibold text-white">
              {isEditing ? "Modifier la transaction" : "Nouvelle transaction"}
            </Dialog.Title>
            <Dialog.Close className="text-white/40 hover:text-white transition-colors rounded-lg p-1 hover:bg-white/[0.06]">
              <X size={18} />
            </Dialog.Close>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            {/* Montant */}
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

            {/* Type */}
            <div className="space-y-1.5">
              <label className="text-sm text-white/60 font-medium">Type</label>
              <div className="flex gap-2">
                {(["depense", "revenu"] as const).map((t) => (
                  <button
                    key={t}
                    type="button"
                    onClick={() => set("type", t)}
                    className={`flex-1 py-2.5 rounded-xl text-sm font-medium transition-all border ${
                      form.type === t
                        ? t === "revenu"
                          ? "bg-emerald-500/15 border-emerald-500/40 text-emerald-400"
                          : "bg-red-500/15 border-red-500/40 text-red-400"
                        : "bg-white/[0.04] border-white/[0.08] text-white/40 hover:text-white/70"
                    }`}
                  >
                    {t === "revenu" ? "Revenu" : "Dépense"}
                  </button>
                ))}
              </div>
            </div>

            {/* Catégorie */}
            <div className="space-y-1.5">
              <label className="text-sm text-white/60 font-medium">
                Catégorie
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

            {/* Description */}
            <div className="space-y-1.5">
              <label className="text-sm text-white/60 font-medium">
                Description{" "}
                <span className="text-white/30 font-normal">(optionnel)</span>
              </label>
              <input
                type="text"
                placeholder="Ex : Courses Monoprix"
                value={form.description}
                onChange={(e) => set("description", e.target.value)}
                maxLength={255}
                className="w-full bg-white/[0.05] border border-white/[0.1] text-white placeholder:text-white/25 rounded-xl px-4 py-2.5 text-sm outline-none focus:border-orange-500/60 transition-colors"
              />
            </div>

            {/* Date */}
            <div className="space-y-1.5">
              <label className="text-sm text-white/60 font-medium">Date</label>
              <input
                type="date"
                value={form.date}
                onChange={(e) => set("date", e.target.value)}
                className="w-full bg-white/[0.05] border border-white/[0.1] text-white rounded-xl px-4 py-2.5 text-sm outline-none focus:border-orange-500/60 transition-colors cursor-pointer"
                style={{ colorScheme: "dark" }}
              />
              {errors.date && (
                <p className="text-red-400 text-xs">{errors.date}</p>
              )}
            </div>

            {/* Objectif lié — création uniquement */}
            {!isEditing && objectifs.length > 0 && (
              <div className="space-y-1.5">
                <label className="text-sm text-white/60 font-medium">
                  Lier à un objectif{" "}
                  <span className="text-white/30 font-normal">(optionnel)</span>
                </label>
                <select
                  value={form.objectif_id}
                  onChange={(e) => set("objectif_id", e.target.value)}
                  className="w-full bg-white/[0.05] border border-white/[0.1] text-white rounded-xl px-4 py-2.5 text-sm outline-none focus:border-orange-500/60 transition-colors cursor-pointer appearance-none"
                  style={{ colorScheme: "dark" }}
                >
                  <option value="" className="bg-[#0f0f1a]">
                    Aucun objectif
                  </option>
                  {objectifs.map((obj) => {
                    const pct = Math.min(
                      Math.round(
                        (obj.montant_actuel / obj.montant_cible) * 100
                      ),
                      100
                    );
                    return (
                      <option
                        key={obj.id}
                        value={obj.id}
                        className="bg-[#0f0f1a]"
                      >
                        {obj.nom} ({pct}%)
                      </option>
                    );
                  })}
                </select>

                {/* Aperçu de la progression si un objectif est sélectionné */}
                {form.objectif_id &&
                  (() => {
                    const obj = objectifs.find((o) => o.id === form.objectif_id);
                    const montantSaisi = parseFloat(form.montant) || 0;
                    if (!obj) return null;
                    const apres = Math.min(
                      obj.montant_actuel + montantSaisi,
                      obj.montant_cible
                    );
                    const pctApres = Math.round(
                      (apres / obj.montant_cible) * 100
                    );
                    return (
                      <div className="bg-white/[0.03] border border-white/[0.07] rounded-xl px-3 py-2.5 text-xs space-y-1.5">
                        <p className="text-white/50">
                          Progression après ajout :
                        </p>
                        <div className="h-1.5 bg-white/[0.07] rounded-full overflow-hidden">
                          <div
                            className="h-full rounded-full bg-orange-500 transition-all duration-300"
                            style={{ width: `${pctApres}%` }}
                          />
                        </div>
                        <p className="text-white/70 font-medium">
                          {new Intl.NumberFormat("fr-FR", {
                            style: "currency",
                            currency: "EUR",
                          }).format(apres)}{" "}
                          /{" "}
                          {new Intl.NumberFormat("fr-FR", {
                            style: "currency",
                            currency: "EUR",
                          }).format(obj.montant_cible)}{" "}
                          <span className="text-orange-400">({pctApres}%)</span>
                        </p>
                      </div>
                    );
                  })()}
              </div>
            )}

            {/* Actions */}
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
                {isSubmitting && <Loader2 size={14} className="animate-spin" />}
                {isSubmitting
                  ? isEditing
                    ? "Modification…"
                    : "Ajout en cours…"
                  : isEditing
                  ? "Modifier"
                  : "Ajouter"}
              </button>
            </div>
          </form>
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  );
}
