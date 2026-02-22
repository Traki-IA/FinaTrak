"use client";

import { useState } from "react";
import { toast } from "sonner";
import * as Dialog from "@radix-ui/react-dialog";
import { X, Loader2 } from "lucide-react";
import { insertObjectif } from "./actions";

interface IObjectifModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
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
}: IObjectifModalProps) {
  const [form, setForm] = useState(INITIAL_FORM);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);

  function set<K extends keyof typeof INITIAL_FORM>(
    key: K,
    value: (typeof INITIAL_FORM)[K]
  ) {
    setForm((prev) => ({ ...prev, [key]: value }));
    if (errors[key]) setErrors((prev) => ({ ...prev, [key]: "" }));
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
    const result = await insertObjectif({
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

    toast.success("Objectif créé !");
    onOpenChange(false);
    setForm(INITIAL_FORM);
    setErrors({});
  }

  return (
    <Dialog.Root open={open} onOpenChange={onOpenChange}>
      <Dialog.Portal>
        <Dialog.Overlay className="fixed inset-0 bg-black/60 backdrop-blur-sm z-40 data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0" />

        <Dialog.Content className="fixed left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 z-50 w-full max-w-md bg-[#0f0f1a] border border-white/[0.1] rounded-2xl p-6 shadow-2xl focus:outline-none data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0 data-[state=closed]:zoom-out-95 data-[state=open]:zoom-in-95 data-[state=closed]:slide-out-to-top-[2%] data-[state=open]:slide-in-from-top-[2%]">
          {/* Header */}
          <div className="flex items-center justify-between mb-6">
            <Dialog.Title className="text-lg font-semibold text-white">
              Nouvel objectif
            </Dialog.Title>
            <Dialog.Close className="text-white/40 hover:text-white transition-colors rounded-lg p-1 hover:bg-white/[0.06]">
              <X size={18} />
            </Dialog.Close>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            {/* Nom */}
            <div className="space-y-1.5">
              <label className="text-sm text-white/60 font-medium">
                Nom de l'objectif
              </label>
              <input
                type="text"
                placeholder="Ex : Vacances au Japon"
                value={form.nom}
                onChange={(e) => set("nom", e.target.value)}
                className="w-full bg-white/[0.05] border border-white/[0.1] text-white placeholder:text-white/25 rounded-xl px-4 py-2.5 text-sm outline-none focus:border-orange-500/60 transition-colors"
              />
              {errors.nom && (
                <p className="text-red-400 text-xs">{errors.nom}</p>
              )}
            </div>

            {/* Période */}
            <div className="space-y-1.5">
              <label className="text-sm text-white/60 font-medium">
                Période
              </label>
              <div className="flex gap-2">
                {(["ponctuel", "mensuel", "annuel"] as const).map((p) => (
                  <button
                    key={p}
                    type="button"
                    onClick={() => set("periode", p)}
                    className={`flex-1 py-2.5 rounded-xl text-sm font-medium transition-all border ${
                      form.periode === p
                        ? "bg-orange-500/15 border-orange-500/40 text-orange-400"
                        : "bg-white/[0.04] border-white/[0.08] text-white/40 hover:text-white/70"
                    }`}
                  >
                    {PERIODE_LABELS[p]}
                  </button>
                ))}
              </div>
            </div>

            {/* Montants */}
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <label className="text-sm text-white/60 font-medium">
                  Montant cible (€)
                </label>
                <input
                  type="number"
                  step="0.01"
                  min="0.01"
                  placeholder="1 000,00"
                  value={form.montant_cible}
                  onChange={(e) => set("montant_cible", e.target.value)}
                  className="w-full bg-white/[0.05] border border-white/[0.1] text-white placeholder:text-white/25 rounded-xl px-4 py-2.5 text-sm outline-none focus:border-orange-500/60 transition-colors"
                />
                {errors.montant_cible && (
                  <p className="text-red-400 text-xs">{errors.montant_cible}</p>
                )}
              </div>

              <div className="space-y-1.5">
                <label className="text-sm text-white/60 font-medium">
                  Déjà épargné (€)
                </label>
                <input
                  type="number"
                  step="0.01"
                  min="0"
                  placeholder="0,00"
                  value={form.montant_actuel}
                  onChange={(e) => set("montant_actuel", e.target.value)}
                  className="w-full bg-white/[0.05] border border-white/[0.1] text-white placeholder:text-white/25 rounded-xl px-4 py-2.5 text-sm outline-none focus:border-orange-500/60 transition-colors"
                />
                {errors.montant_actuel && (
                  <p className="text-red-400 text-xs">
                    {errors.montant_actuel}
                  </p>
                )}
              </div>
            </div>

            {/* Date fin (optionnelle) */}
            <div className="space-y-1.5">
              <label className="text-sm text-white/60 font-medium">
                Date limite{" "}
                <span className="text-white/30 font-normal">(optionnel)</span>
              </label>
              <input
                type="date"
                value={form.date_fin}
                onChange={(e) => set("date_fin", e.target.value)}
                className="w-full bg-white/[0.05] border border-white/[0.1] text-white rounded-xl px-4 py-2.5 text-sm outline-none focus:border-orange-500/60 transition-colors cursor-pointer"
                style={{ colorScheme: "dark" }}
              />
            </div>

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
                {isSubmitting && (
                  <Loader2 size={14} className="animate-spin" />
                )}
                {isSubmitting ? "Création…" : "Créer"}
              </button>
            </div>
          </form>
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  );
}
