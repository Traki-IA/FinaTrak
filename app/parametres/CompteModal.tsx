"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import * as Dialog from "@radix-ui/react-dialog";
import { X, Loader2 } from "lucide-react";
import { insertCompte, updateCompte } from "@/app/comptes/actions";
import { CompteIcon, ICON_MAP } from "@/components/AccountSwitcher";
import type { TCompte } from "@/types";

interface ICompteModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  compte?: TCompte;
}

const INITIAL_FORM = {
  nom: "",
  couleur: "#6366f1",
  icone: "landmark",
  solde_initial: "0",
};

const COULEURS = [
  "#6366f1", "#f59e0b", "#10b981", "#ef4444", "#3b82f6",
  "#8b5cf6", "#ec4899", "#14b8a6", "#f97316", "#06b6d4",
];

const ICONES = Object.keys(ICON_MAP);

function buildForm(c: TCompte) {
  return {
    nom: c.nom,
    couleur: c.couleur,
    icone: c.icone,
    solde_initial: c.solde_initial.toString(),
  };
}

export default function CompteModal({ open, onOpenChange, compte }: ICompteModalProps) {
  const router = useRouter();
  const isEditMode = Boolean(compte);

  const [form, setForm] = useState(() => (compte ? buildForm(compte) : INITIAL_FORM));
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);

  const [prevCompteId, setPrevCompteId] = useState(compte?.id);
  if (compte?.id !== prevCompteId) {
    setPrevCompteId(compte?.id);
    setForm(compte ? buildForm(compte) : INITIAL_FORM);
    setErrors({});
  }

  function set<K extends keyof typeof INITIAL_FORM>(key: K, value: (typeof INITIAL_FORM)[K]) {
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
    const montant = parseFloat(form.solde_initial);
    if (isNaN(montant)) next.solde_initial = "Montant invalide";
    setErrors(next);
    return Object.keys(next).length === 0;
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!validate()) return;

    setIsSubmitting(true);

    if (isEditMode && compte) {
      const result = await updateCompte({
        id: compte.id,
        nom: form.nom.trim(),
        couleur: form.couleur,
        icone: form.icone,
        solde_initial: parseFloat(form.solde_initial),
      });

      setIsSubmitting(false);
      if ("error" in result) {
        toast.error(result.error);
        return;
      }
      toast.success("Compte modifié !");
    } else {
      const result = await insertCompte({
        nom: form.nom.trim(),
        couleur: form.couleur,
        icone: form.icone,
        solde_initial: parseFloat(form.solde_initial),
      });

      setIsSubmitting(false);
      if ("error" in result) {
        toast.error(result.error);
        return;
      }
      toast.success("Compte créé !");
    }

    router.refresh();
    handleOpenChange(false);
  }

  return (
    <Dialog.Root open={open} onOpenChange={handleOpenChange}>
      <Dialog.Portal>
        <Dialog.Overlay className="fixed inset-0 bg-black/60 backdrop-blur-sm z-40" />
        <Dialog.Content className="fixed left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 w-full max-w-md bg-[#12121f] border border-white/10 rounded-2xl p-6 z-50 max-h-[90vh] overflow-y-auto">
          <Dialog.Title className="text-lg font-bold text-white mb-6">
            {isEditMode ? "Modifier le compte" : "Nouveau compte"}
          </Dialog.Title>
          <Dialog.Close className="absolute top-4 right-4 text-white/40 hover:text-white">
            <X size={18} />
          </Dialog.Close>

          <form onSubmit={handleSubmit} className="space-y-5">
            {/* Nom */}
            <div>
              <label className="block text-xs text-white/40 uppercase tracking-widest mb-2">
                Nom du compte
              </label>
              <input
                type="text"
                value={form.nom}
                onChange={(e) => set("nom", e.target.value)}
                className="w-full bg-white/[0.06] border border-white/10 rounded-xl px-4 py-3 text-white outline-none focus:border-orange-500/50 transition-colors"
                placeholder="Ex: Compte courant"
              />
              {errors.nom && <p className="text-red-400 text-xs mt-1">{errors.nom}</p>}
            </div>

            {/* Solde initial */}
            <div>
              <label className="block text-xs text-white/40 uppercase tracking-widest mb-2">
                Solde initial (€)
              </label>
              <input
                type="number"
                step="0.01"
                value={form.solde_initial}
                onChange={(e) => set("solde_initial", e.target.value)}
                className="w-full bg-white/[0.06] border border-white/10 rounded-xl px-4 py-3 text-white outline-none focus:border-orange-500/50 transition-colors [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                placeholder="0.00"
              />
              {errors.solde_initial && (
                <p className="text-red-400 text-xs mt-1">{errors.solde_initial}</p>
              )}
            </div>

            {/* Couleur */}
            <div>
              <label className="block text-xs text-white/40 uppercase tracking-widest mb-2">
                Couleur
              </label>
              <div className="flex gap-2 flex-wrap">
                {COULEURS.map((c) => (
                  <button
                    key={c}
                    type="button"
                    onClick={() => set("couleur", c)}
                    className={`w-8 h-8 rounded-lg transition-all ${
                      form.couleur === c
                        ? "ring-2 ring-white ring-offset-2 ring-offset-[#12121f] scale-110"
                        : "hover:scale-105"
                    }`}
                    style={{ backgroundColor: c }}
                  />
                ))}
              </div>
            </div>

            {/* Icône */}
            <div>
              <label className="block text-xs text-white/40 uppercase tracking-widest mb-2">
                Icône
              </label>
              <div className="flex gap-2 flex-wrap">
                {ICONES.map((iconKey) => (
                  <button
                    key={iconKey}
                    type="button"
                    onClick={() => set("icone", iconKey)}
                    className={`flex items-center justify-center w-10 h-10 rounded-xl transition-all ${
                      form.icone === iconKey
                        ? "bg-white/15 text-white ring-1 ring-white/30"
                        : "bg-white/[0.04] text-white/40 hover:text-white/70 hover:bg-white/[0.08]"
                    }`}
                  >
                    <CompteIcon icone={iconKey} size={18} />
                  </button>
                ))}
              </div>
            </div>

            {/* Submit */}
            <button
              type="submit"
              disabled={isSubmitting}
              className="w-full flex items-center justify-center gap-2 py-3 rounded-xl bg-orange-500 hover:bg-orange-400 text-white font-semibold text-sm transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isSubmitting ? (
                <Loader2 size={16} className="animate-spin" />
              ) : isEditMode ? (
                "Enregistrer"
              ) : (
                "Créer le compte"
              )}
            </button>
          </form>
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  );
}
