"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import * as Dialog from "@radix-ui/react-dialog";
import { X, Loader2 } from "lucide-react";
import {
  ShoppingCart,
  Home,
  Car,
  Utensils,
  Plane,
  Heart,
  Gamepad2,
  GraduationCap,
  Dumbbell,
  Music,
  Gift,
  Briefcase,
  Zap,
  Wifi,
  Stethoscope,
  Tag,
  Shirt,
  Bus,
  Coffee,
  Scissors,
  PiggyBank,
  Banknote,
  CircleEllipsis,
  HeartPulse,
} from "lucide-react";
import { insertCategorie, updateCategorie } from "./actions";
import type { TCategorie } from "@/types";

// ── Icônes disponibles ──────────────────────────────────────────────────────

const ICONE_MAP: Record<string, React.ComponentType<{ size?: number; className?: string }>> = {
  "shopping-cart": ShoppingCart,
  home: Home,
  car: Car,
  utensils: Utensils,
  plane: Plane,
  heart: Heart,
  "heart-pulse": HeartPulse,
  "gamepad-2": Gamepad2,
  "graduation-cap": GraduationCap,
  dumbbell: Dumbbell,
  music: Music,
  gift: Gift,
  briefcase: Briefcase,
  zap: Zap,
  wifi: Wifi,
  stethoscope: Stethoscope,
  tag: Tag,
  shirt: Shirt,
  bus: Bus,
  coffee: Coffee,
  scissors: Scissors,
  "piggy-bank": PiggyBank,
  banknote: Banknote,
  "circle-ellipsis": CircleEllipsis,
};

const ICONE_KEYS = Object.keys(ICONE_MAP);

const COULEURS = [
  "#6366f1", "#f59e0b", "#10b981", "#ef4444", "#3b82f6",
  "#8b5cf6", "#ec4899", "#14b8a6", "#f97316", "#06b6d4",
  "#84cc16", "#94a3b8",
];

// ── Types ───────────────────────────────────────────────────────────────────

interface ICategorieModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  categorie?: TCategorie;
}

type TForm = {
  nom: string;
  couleur: string;
  icone: string;
};

const INITIAL_FORM: TForm = {
  nom: "",
  couleur: "#6366f1",
  icone: "tag",
};

function buildForm(c: TCategorie): TForm {
  return { nom: c.nom, couleur: c.couleur, icone: c.icone };
}

// ── Composant ───────────────────────────────────────────────────────────────

export default function CategorieModal({
  open,
  onOpenChange,
  categorie,
}: ICategorieModalProps) {
  const router = useRouter();
  const isEditMode = Boolean(categorie);

  const [form, setForm] = useState<TForm>(() =>
    categorie ? buildForm(categorie) : INITIAL_FORM
  );
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Sync quand la catégorie éditée change
  const [prevCategorieId, setPrevCategorieId] = useState(categorie?.id);
  if (categorie?.id !== prevCategorieId) {
    setPrevCategorieId(categorie?.id);
    setForm(categorie ? buildForm(categorie) : INITIAL_FORM);
    setErrors({});
  }

  function handleChange(field: keyof TForm, value: string) {
    setForm((prev) => ({ ...prev, [field]: value }));
    if (errors[field]) setErrors((prev) => ({ ...prev, [field]: "" }));
  }

  function validate(): boolean {
    const newErrors: Record<string, string> = {};
    if (!form.nom.trim()) newErrors.nom = "Le nom est requis";
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!validate()) return;

    setIsSubmitting(true);

    const result = isEditMode && categorie
      ? await updateCategorie({ id: categorie.id, ...form })
      : await insertCategorie(form);

    setIsSubmitting(false);

    if ("error" in result) {
      toast.error(result.error);
      return;
    }

    toast.success(isEditMode ? "Catégorie modifiée" : "Catégorie ajoutée");
    onOpenChange(false);
    setForm(INITIAL_FORM);
    router.refresh();
  }

  const SelectedIcon = ICONE_MAP[form.icone] ?? Tag;

  return (
    <Dialog.Root open={open} onOpenChange={onOpenChange}>
      <Dialog.Portal>
        <Dialog.Overlay className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50" />
        <Dialog.Content className="fixed left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 z-50 w-[calc(100%-2rem)] max-w-md bg-[#111122] border border-white/[0.08] rounded-2xl p-6 shadow-2xl">
          {/* Header */}
          <div className="flex items-center justify-between mb-6">
            <Dialog.Title className="text-lg font-semibold text-white">
              {isEditMode ? "Modifier la catégorie" : "Nouvelle catégorie"}
            </Dialog.Title>
            <Dialog.Close className="p-1.5 rounded-lg text-white/40 hover:text-white hover:bg-white/[0.07] transition-colors">
              <X size={18} />
            </Dialog.Close>
          </div>

          <form onSubmit={handleSubmit} className="space-y-5">
            {/* Nom */}
            <div>
              <label className="block text-sm text-white/60 mb-1.5">Nom</label>
              <input
                type="text"
                value={form.nom}
                onChange={(e) => handleChange("nom", e.target.value)}
                placeholder="Ex : Alimentation"
                className={`w-full bg-white/[0.05] border ${
                  errors.nom ? "border-red-500/60" : "border-white/[0.1]"
                } text-white rounded-xl px-3.5 py-2.5 text-sm outline-none focus:border-orange-500/60 transition-colors placeholder:text-white/20`}
              />
              {errors.nom && (
                <p className="text-red-400 text-xs mt-1">{errors.nom}</p>
              )}
            </div>

            {/* Aperçu */}
            <div className="flex items-center gap-3 p-3 bg-white/[0.03] border border-white/[0.06] rounded-xl">
              <span
                className="flex items-center justify-center w-9 h-9 rounded-lg"
                style={{ backgroundColor: `${form.couleur}20`, color: form.couleur }}
              >
                <SelectedIcon size={18} />
              </span>
              <span className="text-white text-sm font-medium">
                {form.nom || "Aperçu"}
              </span>
            </div>

            {/* Couleur */}
            <div>
              <label className="block text-sm text-white/60 mb-2">Couleur</label>
              <div className="grid grid-cols-6 gap-2">
                {COULEURS.map((c) => (
                  <button
                    key={c}
                    type="button"
                    onClick={() => handleChange("couleur", c)}
                    className={`w-full aspect-square rounded-xl transition-all ${
                      form.couleur === c
                        ? "ring-2 ring-white/60 scale-110"
                        : "ring-1 ring-white/10 hover:ring-white/30"
                    }`}
                    style={{ backgroundColor: c }}
                  />
                ))}
              </div>
            </div>

            {/* Icône */}
            <div>
              <label className="block text-sm text-white/60 mb-2">Icône</label>
              <div className="grid grid-cols-6 gap-1.5 max-h-40 overflow-y-auto pr-1">
                {ICONE_KEYS.map((key) => {
                  const Icon = ICONE_MAP[key];
                  const isSelected = form.icone === key;
                  return (
                    <button
                      key={key}
                      type="button"
                      onClick={() => handleChange("icone", key)}
                      className={`flex items-center justify-center p-2.5 rounded-xl transition-all ${
                        isSelected
                          ? "bg-orange-500/20 text-orange-400 ring-1 ring-orange-500/50"
                          : "text-white/40 hover:text-white/70 hover:bg-white/[0.05]"
                      }`}
                    >
                      <Icon size={18} />
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Submit */}
            <button
              type="submit"
              disabled={isSubmitting}
              className="w-full py-2.5 bg-orange-500 hover:bg-orange-600 disabled:opacity-60 text-white rounded-xl text-sm font-medium transition-colors flex items-center justify-center gap-2"
            >
              {isSubmitting && <Loader2 size={15} className="animate-spin" />}
              {isEditMode ? "Enregistrer" : "Ajouter"}
            </button>
          </form>
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  );
}

export { ICONE_MAP };
