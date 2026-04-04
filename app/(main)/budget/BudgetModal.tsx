"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "@/lib/toast";
import * as Dialog from "@radix-ui/react-dialog";
import { X, Loader2, Plus, Link2, Target, ArrowLeft, Check, Pencil } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { insertBudgetItem, updateBudgetItem } from "./actions";
import { upsertCategorie, deleteCategorie } from "@/lib/categories";
import type { TCategorie, TObjectif, TBudgetItemWithRelations } from "@/types";

const COLOR_PALETTE = [
  "#ef4444", "#f97316", "#eab308", "#22c55e",
  "#14b8a6", "#3b82f6", "#8b5cf6", "#ec4899",
  "#f43f5e", "#06b6d4", "#84cc16", "#6b7280",
];

// ── Types ─────────────────────────────────────────────────────────────────────

type ObjectifMode = "none" | "existing" | "new";

interface IBudgetModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  categories: TCategorie[];
  objectifs: TObjectif[];
  budgetItem?: TBudgetItemWithRelations;
  compteId: string;
  onDelete?: (id: string) => void;
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
  compteId,
  onDelete,
}: IBudgetModalProps) {
  const router = useRouter();
  const isEditMode = Boolean(budgetItem);

  function buildForm(item: TBudgetItemWithRelations) {
    return {
      nom: item.nom,
      montant: item.montant.toString(),
      frequence: item.frequence,
      categorie_id: item.categorie_id ?? "",
      objectifMode: (item.objectif_id ? "existing" : "none") as ObjectifMode,
      objectif_id: item.objectif_id ?? "",
      objectif_nom: "",
      objectif_cible: "",
      objectif_periode: "ponctuel" as "mensuel" | "annuel" | "ponctuel",
    };
  }

  const [localCategories, setLocalCategories] = useState<TCategorie[]>(categories);
  const [catPickerOpen, setCatPickerOpen] = useState(false);
  const [catForm, setCatForm] = useState<{ id?: string; nom: string; couleur: string } | null>(null);
  const [catSaving, setCatSaving] = useState(false);

  const [form, setForm] = useState(() =>
    budgetItem ? buildForm(budgetItem) : INITIAL_FORM
  );
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Sync form when budgetItem prop changes (React render-time adjustment)
  const [prevItemId, setPrevItemId] = useState(budgetItem?.id);
  if (budgetItem?.id !== prevItemId) {
    setPrevItemId(budgetItem?.id);
    setForm(budgetItem ? buildForm(budgetItem) : INITIAL_FORM);
    setErrors({});
  }

  function set<K extends keyof typeof INITIAL_FORM>(
    key: K,
    value: (typeof INITIAL_FORM)[K]
  ) {
    setForm((prev) => ({ ...prev, [key]: value }));
    if (errors[key]) setErrors((prev) => ({ ...prev, [key]: "" }));
  }

  async function handleCatSave() {
    if (!catForm || !catForm.nom.trim()) return;
    setCatSaving(true);
    const result = await upsertCategorie({ id: catForm.id, nom: catForm.nom.trim(), couleur: catForm.couleur });
    setCatSaving(false);
    if ("error" in result) { toast.error(result.error); return; }
    if (catForm.id) {
      setLocalCategories((prev) => prev.map((c) => c.id === catForm.id ? { ...c, nom: catForm.nom.trim(), couleur: catForm.couleur } : c));
    } else {
      const newCat: TCategorie = { id: result.id, nom: catForm.nom.trim(), couleur: catForm.couleur, icone: "", sort_order: 0, created_at: new Date().toISOString() };
      setLocalCategories((prev) => [...prev, newCat]);
      set("categorie_id", result.id);
    }
    setCatForm(null);
  }

  async function handleCatDelete(id: string) {
    const result = await deleteCategorie(id);
    if ("error" in result) { toast.error(result.error); return; }
    setLocalCategories((prev) => prev.filter((c) => c.id !== id));
    if (form.categorie_id === id) set("categorie_id", "");
    setCatForm(null);
  }

  function handleOpenChange(nextOpen: boolean) {
    if (!nextOpen) {
      setForm(INITIAL_FORM);
      setErrors({});
      setCatPickerOpen(false);
      setCatForm(null);
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
        compte_id: compteId,
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

        <Dialog.Content className="fixed z-50 bg-[#0f0f1a] border-white/[0.1] shadow-2xl focus:outline-none data-[state=open]:animate-in data-[state=closed]:animate-out inset-x-0 bottom-0 border-t rounded-t-2xl px-5 pt-4 pb-8 max-h-[92dvh] overflow-y-auto data-[state=closed]:slide-out-to-bottom data-[state=open]:slide-in-from-bottom sm:inset-auto sm:left-1/2 sm:top-1/2 sm:-translate-x-1/2 sm:-translate-y-1/2 sm:w-full sm:max-w-md sm:border sm:rounded-2xl sm:pb-5 sm:max-h-[90dvh] sm:data-[state=closed]:fade-out-0 sm:data-[state=open]:fade-in-0 sm:data-[state=closed]:zoom-out-95 sm:data-[state=open]:zoom-in-95">
          {/* Header */}
          <div className="flex items-center justify-between mb-4">
            <Dialog.Title className="text-base font-semibold text-white">
              {isEditMode ? "Modifier la charge" : "Nouvelle charge budgétaire"}
            </Dialog.Title>
            <Dialog.Close className="text-white/40 hover:text-white transition-colors rounded-lg p-1 hover:bg-white/[0.06]">
              <X size={18} />
            </Dialog.Close>
          </div>

          <form onSubmit={handleSubmit} className="space-y-3">
            {/* ── Nom ── */}
            <div className="space-y-1">
              <label className="text-sm text-white/60 font-medium">
                Nom de la charge
              </label>
              <input
                type="text"
                placeholder="Ex : Loyer, Abonnement Netflix…"
                value={form.nom}
                onChange={(e) => set("nom", e.target.value)}
                className="w-full bg-white/[0.05] border border-white/[0.1] text-white placeholder:text-white/25 rounded-xl px-3 py-2 text-sm outline-none focus:border-orange-500/60 transition-colors"
              />
              {errors.nom && (
                <p className="text-red-400 text-xs">{errors.nom}</p>
              )}
            </div>

            {/* ── Montant + Fréquence ── */}
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1">
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
                  className="w-full bg-white/[0.05] border border-white/[0.1] text-white placeholder:text-white/25 rounded-xl px-3 py-2 text-sm outline-none focus:border-orange-500/60 transition-colors"
                />
                {errors.montant && (
                  <p className="text-red-400 text-xs">{errors.montant}</p>
                )}
              </div>

              <div className="space-y-1">
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
            <div className="space-y-1">
              <label className="text-sm text-white/60 font-medium">
                Catégorie{" "}
                <span className="text-white/30 font-normal">(optionnel)</span>
              </label>

              {/* Bouton sélection */}
              <button
                type="button"
                onClick={() => { setCatPickerOpen((v) => !v); setCatForm(null); }}
                className="w-full bg-white/[0.05] border border-white/[0.1] text-white rounded-xl px-3 py-2 text-sm flex items-center gap-2 text-left transition-colors hover:border-white/20"
              >
                {form.categorie_id ? (
                  <>
                    <span className="w-3 h-3 rounded-full shrink-0" style={{ background: localCategories.find((c) => c.id === form.categorie_id)?.couleur ?? "#6b7280" }} />
                    <span>{localCategories.find((c) => c.id === form.categorie_id)?.nom ?? "—"}</span>
                  </>
                ) : (
                  <span className="text-white/40">Aucune catégorie</span>
                )}
                <span className="ml-auto text-white/30 text-xs">{catPickerOpen ? "▲" : "▼"}</span>
              </button>

              {/* Picker inline */}
              <AnimatePresence>
                {catPickerOpen && (
                  <motion.div
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: "auto" }}
                    exit={{ opacity: 0, height: 0 }}
                    transition={{ duration: 0.18 }}
                    className="overflow-hidden"
                  >
                    <div className="rounded-xl border border-white/[0.1] overflow-hidden bg-white/[0.03]">
                      <AnimatePresence mode="wait">
                        {catForm ? (
                          /* ── Formulaire catégorie ── */
                          <motion.div key="form" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: 20 }} transition={{ duration: 0.15 }} className="p-3 space-y-3">
                            <div className="flex items-center gap-2">
                              <button type="button" onClick={() => setCatForm(null)} className="text-white/40 hover:text-white transition-colors">
                                <ArrowLeft size={14} />
                              </button>
                              <span className="text-sm font-medium text-white">{catForm.id ? "Modifier" : "Nouvelle catégorie"}</span>
                            </div>
                            <input
                              type="text"
                              placeholder="Nom de la catégorie"
                              value={catForm.nom}
                              onChange={(e) => setCatForm((f) => f ? { ...f, nom: e.target.value } : f)}
                              className="w-full bg-white/[0.05] border border-white/[0.1] text-white placeholder:text-white/25 rounded-lg px-3 py-2 text-sm outline-none focus:border-orange-500/60"
                            />
                            <div>
                              <p className="text-[11px] text-white/40 uppercase tracking-[0.08em] mb-2">Couleur</p>
                              <div className="grid grid-cols-7 gap-2">
                                {COLOR_PALETTE.map((col) => (
                                  <button
                                    key={col}
                                    type="button"
                                    onClick={() => setCatForm((f) => f ? { ...f, couleur: col } : f)}
                                    className="w-8 h-8 rounded-full flex items-center justify-center transition-transform hover:scale-110"
                                    style={{ background: col, outline: catForm.couleur === col ? `2px solid white` : "none", outlineOffset: "2px" }}
                                  >
                                    {catForm.couleur === col && <Check size={12} className="text-white" />}
                                  </button>
                                ))}
                                <label className="relative w-8 h-8 rounded-full flex items-center justify-center cursor-pointer transition-transform hover:scale-110 border-2 border-dashed border-white/30 hover:border-white/60"
                                  style={!COLOR_PALETTE.includes(catForm.couleur) ? { background: catForm.couleur, border: "2px solid white" } : {}}>
                                  {!COLOR_PALETTE.includes(catForm.couleur)
                                    ? <Check size={12} className="text-white" />
                                    : <Plus size={12} className="text-white/50" />}
                                  <input
                                    type="color"
                                    value={catForm.couleur}
                                    onChange={(e) => setCatForm((f) => f ? { ...f, couleur: e.target.value } : f)}
                                    className="absolute inset-0 opacity-0 cursor-pointer w-full h-full"
                                  />
                                </label>
                              </div>
                            </div>
                            <div className="flex gap-2">
                              {catForm.id && (
                                <button type="button" onClick={() => handleCatDelete(catForm.id!)} className="px-3 py-2 rounded-lg text-[13px] font-medium text-red-400 border border-red-400/20 hover:bg-red-400/10 transition-colors">
                                  Supprimer
                                </button>
                              )}
                              <button
                                type="button"
                                onClick={handleCatSave}
                                disabled={catSaving || !catForm.nom.trim()}
                                className="flex-1 py-2 rounded-lg text-[13px] font-semibold bg-orange-500 hover:bg-orange-600 disabled:opacity-50 text-white transition-colors flex items-center justify-center gap-1"
                              >
                                {catSaving && <Loader2 size={11} className="animate-spin" />}
                                Enregistrer
                              </button>
                            </div>
                          </motion.div>
                        ) : (
                          /* ── Liste catégories ── */
                          <motion.div key="list" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} transition={{ duration: 0.15 }}>
                            <button
                              type="button"
                              onClick={() => { set("categorie_id", ""); setCatPickerOpen(false); }}
                              className="w-full flex items-center gap-2 px-3 py-2.5 text-sm text-white/40 hover:bg-white/[0.05] transition-colors border-b border-white/[0.06]"
                            >
                              <span className="w-3 h-3 rounded-full bg-white/10 shrink-0" />
                              <span>Aucune catégorie</span>
                              {!form.categorie_id && <Check size={12} className="ml-auto text-orange-500" />}
                            </button>
                            {localCategories.map((cat) => (
                              <div key={cat.id} className="flex items-center gap-2 px-3 py-2.5 border-b border-white/[0.06] last:border-0 hover:bg-white/[0.04] transition-colors">
                                <button
                                  type="button"
                                  onClick={() => { set("categorie_id", cat.id); setCatPickerOpen(false); }}
                                  className="flex items-center gap-2 flex-1 text-sm text-white text-left"
                                >
                                  <span className="w-3 h-3 rounded-full shrink-0" style={{ background: cat.couleur }} />
                                  <span>{cat.nom}</span>
                                  {form.categorie_id === cat.id && <Check size={12} className="text-orange-500" />}
                                </button>
                                <button
                                  type="button"
                                  onClick={() => setCatForm({ id: cat.id, nom: cat.nom, couleur: cat.couleur })}
                                  className="text-white/25 hover:text-white/60 transition-colors p-1"
                                >
                                  <Pencil size={11} />
                                </button>
                              </div>
                            ))}
                            <button
                              type="button"
                              onClick={() => setCatForm({ nom: "", couleur: COLOR_PALETTE[0] })}
                              className="w-full flex items-center gap-2 px-3 py-2.5 text-sm text-orange-400 hover:bg-white/[0.05] transition-colors"
                            >
                              <Plus size={13} />
                              <span>Nouvelle catégorie</span>
                            </button>
                          </motion.div>
                        )}
                      </AnimatePresence>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
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
                      className="w-full bg-white/[0.05] border border-white/[0.1] text-white rounded-xl px-3 py-2 text-sm outline-none focus:border-orange-500/60 transition-colors cursor-pointer appearance-none"
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

                      <div className="space-y-1">
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
                        <div className="space-y-1">
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

                        <div className="space-y-1">
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
              {isEditMode && onDelete && budgetItem && (
                <button
                  type="button"
                  onClick={() => {
                    onDelete(budgetItem.id);
                    handleOpenChange(false);
                  }}
                  className="px-4 py-2.5 rounded-xl text-sm font-medium border border-red-500/30 bg-red-500/10 text-red-400 hover:bg-red-500/20 transition-all"
                >
                  Supprimer
                </button>
              )}
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
