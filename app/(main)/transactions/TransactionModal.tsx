"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { toast } from "@/lib/toast";
import * as Dialog from "@radix-ui/react-dialog";
import { X, Loader2, Pencil, Plus, ArrowLeft, Check } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { insertTransaction, updateTransaction, upsertCategorie, deleteCategorie, updateCategoryByDescription } from "./actions";
import { insertObjectif } from "@/app/(main)/objectifs/actions";
import { useCompte } from "@/lib/compte-context";
import { CompteIcon } from "@/components/compte-icons";
import type { TCategorie, TObjectif, TBudgetItem, TTransactionWithCategorie } from "@/types";

const COLOR_PALETTE = [
  "#ef4444", "#f97316", "#eab308", "#22c55e",
  "#14b8a6", "#3b82f6", "#8b5cf6", "#ec4899",
  "#f43f5e", "#06b6d4", "#84cc16", "#6b7280",
];

interface ITransactionModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  categories: TCategorie[];
  objectifs: TObjectif[];
  budgetItems: TBudgetItem[];
  transaction?: TTransactionWithCategorie;
  compteId: string;
}

const INITIAL_FORM = {
  montant: "",
  type: "depense" as "revenu" | "depense" | "virement",
  categorie_id: "",
  description: "",
  date: new Date().toISOString().split("T")[0],
  objectif_id: "",
  budget_item_id: "",
  destination_compte_id: "",
};

export default function TransactionModal({
  open,
  onOpenChange,
  categories,
  objectifs,
  budgetItems,
  transaction,
  compteId,
}: ITransactionModalProps) {
  const router = useRouter();
  const { comptes } = useCompte();
  const otherComptes = comptes.filter((c) => c.id !== compteId);
  const isEditMode = Boolean(transaction);

  // Local categories state (for optimistic updates)
  const [localCategories, setLocalCategories] = useState<TCategorie[]>(categories);
  const [catPickerOpen, setCatPickerOpen] = useState(false);
  const [catForm, setCatForm] = useState<{ id?: string; nom: string; couleur: string } | null>(null);
  const [catSaving, setCatSaving] = useState(false);

  // Local objectifs state
  const [localObjectifs, setLocalObjectifs] = useState<TObjectif[]>(objectifs);
  const [showNewObjForm, setShowNewObjForm] = useState(false);
  const [newObjForm, setNewObjForm] = useState({ nom: "", montant_cible: "", periode: "ponctuel" as "mensuel" | "annuel" | "ponctuel" });
  const [objSaving, setObjSaving] = useState(false);

  function buildForm(t: TTransactionWithCategorie) {
    // Détecter les virements par le préfixe de description
    const isVirementSortant = t.description?.startsWith("Virement →");
    const isVirementEntrant = t.description?.startsWith("Virement ←");
    const isVirement = isVirementSortant || isVirementEntrant;

    // Tenter de matcher le compte destination depuis la description "Virement → NomCompte · ..."
    let destinationCompteId = "";
    if (isVirementSortant && t.description) {
      const match = t.description.match(/^Virement → (.+?)(?:\s·|$)/);
      if (match) {
        const nomCompte = match[1].trim();
        const found = comptes.find((c) => c.nom === nomCompte);
        if (found) destinationCompteId = found.id;
      }
    }

    return {
      montant: t.montant.toString(),
      type: isVirement ? ("virement" as const) : (t.type as "revenu" | "depense"),
      categorie_id: t.categorie_id ?? "",
      description: t.description ?? "",
      date: t.date,
      objectif_id: "",
      budget_item_id: t.budget_item_id ?? "",
      destination_compte_id: destinationCompteId,
    };
  }

  const [form, setForm] = useState(() =>
    transaction ? buildForm(transaction) : INITIAL_FORM
  );
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [applyToAll, setApplyToAll] = useState(false);

  // Sync form à chaque ouverture du modal
  useEffect(() => {
    if (open) {
      setForm(transaction ? buildForm(transaction) : INITIAL_FORM);
      setErrors({});
      setApplyToAll(false);
      setShowNewObjForm(false);
      setNewObjForm({ nom: "", montant_cible: "", periode: "ponctuel" });
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, transaction?.id]);

  function set<K extends keyof typeof INITIAL_FORM>(
    key: K,
    value: (typeof INITIAL_FORM)[K]
  ) {
    setForm((prev) => ({ ...prev, [key]: value }));
    if (errors[key]) setErrors((prev) => ({ ...prev, [key]: "" }));
  }

  function handleOpenChange(nextOpen: boolean) {
    onOpenChange(nextOpen);
  }

  function validate(): boolean {
    const next: Record<string, string> = {};

    const montant = parseFloat(form.montant);
    if (!form.montant || isNaN(montant) || montant <= 0)
      next.montant = "Montant invalide (doit être > 0)";
    if (!form.date) next.date = "La date est requise";
    if (form.type === "virement" && !form.destination_compte_id)
      next.destination_compte_id = "Sélectionnez un compte destination";

    setErrors(next);
    return Object.keys(next).length === 0;
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

  async function handleNewObjectifSave() {
    const nom = newObjForm.nom.trim();
    const montant_cible = parseFloat(newObjForm.montant_cible);
    if (!nom) { toast.error("Le nom de l'objectif est requis"); return; }
    if (!newObjForm.montant_cible || isNaN(montant_cible) || montant_cible <= 0) { toast.error("Le montant cible doit être supérieur à 0"); return; }

    setObjSaving(true);
    const result = await insertObjectif({
      nom,
      montant_cible,
      montant_actuel: 0,
      periode: newObjForm.periode,
      date_fin: null,
      compte_id: compteId,
    });
    setObjSaving(false);

    if ("error" in result) { toast.error(result.error); return; }
    setLocalObjectifs((prev) => [...prev, result.objectif]);
    set("objectif_id", result.objectif.id);
    setShowNewObjForm(false);
    setNewObjForm({ nom: "", montant_cible: "", periode: "ponctuel" });
    toast.success(`Objectif « ${result.objectif.nom} » créé`);
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!validate()) return;

    setIsSubmitting(true);

    if (isEditMode && transaction) {
      if (form.type === "virement") {
        // Modifier la transaction existante en dépense sortante + créer le revenu entrant
        const destinationCompte = comptes.find((c) => c.id === form.destination_compte_id);
        const sourceCompte = comptes.find((c) => c.id === compteId);
        const montant = parseFloat(form.montant);

        const resultUpdate = await updateTransaction({
          id: transaction.id,
          montant,
          type: "depense",
          categorie_id: form.categorie_id || null,
          description: `Virement → ${destinationCompte?.nom ?? "Autre compte"}${form.description ? ` · ${form.description}` : ""}`,
          date: form.date,
        });

        if ("error" in resultUpdate) {
          setIsSubmitting(false);
          toast.error(resultUpdate.error);
          return;
        }

        const resultIn = await insertTransaction({
          montant,
          type: "revenu",
          categorie_id: form.categorie_id || null,
          description: `Virement ← ${sourceCompte?.nom ?? "Autre compte"}${form.description ? ` · ${form.description}` : ""}`,
          date: form.date,
          compte_id: form.destination_compte_id,
          objectif_id: null,
          budget_item_id: null,
        });

        setIsSubmitting(false);

        if ("error" in resultIn) {
          toast.error(resultIn.error);
          return;
        }

        toast.success(`Virement de ${montant.toFixed(2)} € vers ${destinationCompte?.nom ?? "Autre compte"}`);
      } else {
        const result = await updateTransaction({
          id: transaction.id,
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
          const objectif = localObjectifs.find((o) => o.id === form.objectif_id);
          toast.success(`Transaction modifiée · Progression de « ${objectif?.nom} » mise à jour`);
        } else {
          toast.success("Transaction modifiée !");
        }

        if (applyToAll && form.description.trim()) {
          const bulkResult = await updateCategoryByDescription(form.description.trim(), form.categorie_id || null);
          if ("error" in bulkResult) {
            toast.error(bulkResult.error);
          } else {
            toast.success(`Catégorie appliquée à toutes les transactions « ${form.description.trim()} »`);
          }
        }
      }

      onOpenChange(false);
      router.refresh();
      return;
    } else if (form.type === "virement") {
      // Virement : créer 2 transactions (dépense source + revenu destination)
      const destinationCompte = comptes.find((c) => c.id === form.destination_compte_id);
      const sourceCompte = comptes.find((c) => c.id === compteId);
      const montant = parseFloat(form.montant);

      // Transaction sortante (dépense sur compte source)
      const resultOut = await insertTransaction({
        montant,
        type: "depense",
        categorie_id: form.categorie_id || null,
        description: `Virement → ${destinationCompte?.nom ?? "Autre compte"}${form.description ? ` · ${form.description}` : ""}`,
        date: form.date,
        compte_id: compteId,
        objectif_id: null,
        budget_item_id: null,
      });

      if ("error" in resultOut) {
        setIsSubmitting(false);
        toast.error(resultOut.error);
        return;
      }

      // Transaction entrante (revenu sur compte destination)
      const resultIn = await insertTransaction({
        montant,
        type: "revenu",
        categorie_id: form.categorie_id || null,
        description: `Virement ← ${sourceCompte?.nom ?? "Autre compte"}${form.description ? ` · ${form.description}` : ""}`,
        date: form.date,
        compte_id: form.destination_compte_id,
        objectif_id: null,
        budget_item_id: null,
      });

      setIsSubmitting(false);

      if ("error" in resultIn) {
        toast.error(resultIn.error);
        return;
      }

      toast.success(`Virement de ${montant.toFixed(2)} € vers ${destinationCompte?.nom ?? "Autre compte"}`);
    } else {
      const result = await insertTransaction({
        montant: parseFloat(form.montant),
        type: form.type as "revenu" | "depense",
        categorie_id: form.categorie_id || null,
        description: form.description || null,
        date: form.date,
        compte_id: compteId,
        objectif_id: form.objectif_id || null,
        budget_item_id: form.budget_item_id || null,
      });

      setIsSubmitting(false);

      if ("error" in result) {
        toast.error(result.error);
        return;
      }

      if (result.objectifUpdated) {
        const objectif = localObjectifs.find((o) => o.id === form.objectif_id);
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
    <Dialog.Root open={open} onOpenChange={handleOpenChange}>
      <Dialog.Portal>
        {/* Overlay */}
        <Dialog.Overlay className="fixed inset-0 bg-black/60 backdrop-blur-sm z-40 data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0" />

        {/* Content */}
        <Dialog.Content className="fixed z-50 bg-[#0f0f1a] border-white/[0.1] shadow-2xl focus:outline-none data-[state=open]:animate-in data-[state=closed]:animate-out inset-x-0 bottom-0 border-t rounded-t-2xl px-5 pt-4 pb-8 max-h-[92dvh] overflow-y-auto data-[state=closed]:slide-out-to-bottom data-[state=open]:slide-in-from-bottom sm:inset-auto sm:left-1/2 sm:top-1/2 sm:-translate-x-1/2 sm:-translate-y-1/2 sm:w-full sm:max-w-md sm:border sm:rounded-2xl sm:pb-5 sm:max-h-[90dvh] sm:data-[state=closed]:fade-out-0 sm:data-[state=open]:fade-in-0 sm:data-[state=closed]:zoom-out-95 sm:data-[state=open]:zoom-in-95">
          {/* Header */}
          <div className="flex items-center justify-between mb-4">
            <Dialog.Title className="text-base font-semibold text-white">
              {isEditMode ? "Modifier la transaction" : "Nouvelle transaction"}
            </Dialog.Title>
            <Dialog.Close className="text-white/40 hover:text-white transition-colors rounded-lg p-1 hover:bg-white/[0.06]">
              <X size={18} />
            </Dialog.Close>
          </div>

          <form onSubmit={handleSubmit} className="space-y-3">
            {/* Montant */}
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

            {/* Type */}
            <div className="space-y-1">
              <label className="text-sm text-white/60 font-medium">Type</label>
              <div className="flex gap-2">
                {(["depense", "revenu", "virement"] as const).map((t) => (
                  <button
                    key={t}
                    type="button"
                    onClick={() => {
                      set("type", t);
                      if (t !== "virement") {
                        set("destination_compte_id", "");
                      } else if (otherComptes.length === 1) {
                        // Auto-sélectionner le seul compte disponible
                        set("destination_compte_id", otherComptes[0].id);
                      }
                    }}
                    className={`flex-1 py-2.5 rounded-xl text-sm font-medium transition-all border ${
                      form.type === t
                        ? t === "revenu"
                          ? "bg-emerald-500/15 border-emerald-500/40 text-emerald-400"
                          : t === "virement"
                          ? "bg-blue-500/15 border-blue-500/40 text-blue-400"
                          : "bg-red-500/15 border-red-500/40 text-red-400"
                        : "bg-white/[0.04] border-white/[0.08] text-white/40 hover:text-white/70"
                    }`}
                  >
                    {t === "revenu" ? "Revenu" : t === "virement" ? "Virement" : "Dépense"}
                  </button>
                ))}
              </div>
            </div>

            {/* Compte destination — virement uniquement */}
            {form.type === "virement" && (
              <div className="space-y-1">
                <label className="text-sm text-white/60 font-medium">
                  Vers quel compte ?
                </label>
                {otherComptes.length === 0 ? (
                  <p className="text-sm text-white/30 italic">Aucun autre compte disponible</p>
                ) : (
                  <div className="space-y-1">
                    {otherComptes.map((compte) => (
                      <button
                        key={compte.id}
                        type="button"
                        onClick={() => set("destination_compte_id", compte.id)}
                        className={`w-full flex items-center gap-2.5 px-3 py-2.5 rounded-xl text-sm transition-all border ${
                          form.destination_compte_id === compte.id
                            ? "bg-blue-500/15 border-blue-500/40 text-blue-400"
                            : "bg-white/[0.04] border-white/[0.08] text-white/60 hover:text-white hover:border-white/20"
                        }`}
                      >
                        <span
                          className="flex items-center justify-center w-6 h-6 rounded-md flex-shrink-0"
                          style={{ backgroundColor: `${compte.couleur}20`, color: compte.couleur }}
                        >
                          <CompteIcon icone={compte.icone} size={13} strokeWidth={2} />
                        </span>
                        <span className="truncate">{compte.nom}</span>
                        {form.destination_compte_id === compte.id && (
                          <Check size={14} className="ml-auto text-blue-400 flex-shrink-0" />
                        )}
                      </button>
                    ))}
                  </div>
                )}
                {errors.destination_compte_id && (
                  <p className="text-red-400 text-xs">{errors.destination_compte_id}</p>
                )}
              </div>
            )}

            {/* Catégorie */}
            <div className="space-y-1">
              <label className="text-sm text-white/60 font-medium">Catégorie</label>

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
                            {/* Header form */}
                            <div className="flex items-center gap-2">
                              <button type="button" onClick={() => setCatForm(null)} className="text-white/40 hover:text-white transition-colors">
                                <ArrowLeft size={14} />
                              </button>
                              <span className="text-sm font-medium text-white">{catForm.id ? "Modifier" : "Nouvelle catégorie"}</span>
                            </div>
                            {/* Nom */}
                            <input
                              type="text"
                              placeholder="Nom de la catégorie"
                              value={catForm.nom}
                              onChange={(e) => setCatForm((f) => f ? { ...f, nom: e.target.value } : f)}
                              className="w-full bg-white/[0.05] border border-white/[0.1] text-white placeholder:text-white/25 rounded-lg px-3 py-2 text-sm outline-none focus:border-orange-500/60"
                            />
                            {/* Palette couleurs */}
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
                                {/* Custom color picker */}
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
                            {/* Actions */}
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
                            {/* Aucune */}
                            <button
                              type="button"
                              onClick={() => { set("categorie_id", ""); setCatPickerOpen(false); }}
                              className="w-full flex items-center gap-2 px-3 py-2.5 text-sm text-white/40 hover:bg-white/[0.05] transition-colors border-b border-white/[0.06]"
                            >
                              <span className="w-3 h-3 rounded-full bg-white/10 shrink-0" />
                              <span>Aucune catégorie</span>
                              {!form.categorie_id && <Check size={12} className="ml-auto text-orange-500" />}
                            </button>
                            {/* Liste */}
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
                            {/* Nouvelle */}
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

            {/* Appliquer à tous — edit mode uniquement */}
            {isEditMode && form.description.trim() && form.categorie_id && (
              <label className="flex items-center gap-2.5 cursor-pointer group py-0.5">
                <div
                  role="checkbox"
                  aria-checked={applyToAll}
                  onClick={() => setApplyToAll((v) => !v)}
                  className={`w-4 h-4 rounded flex items-center justify-center border transition-all flex-shrink-0 ${
                    applyToAll
                      ? "bg-orange-500 border-orange-500"
                      : "bg-white/[0.05] border-white/[0.15] group-hover:border-white/30"
                  }`}
                >
                  {applyToAll && <Check size={10} className="text-white" />}
                </div>
                <span className="text-sm text-white/60 group-hover:text-white/80 transition-colors select-none">
                  Appliquer à toutes les transactions avec ce libellé
                </span>
              </label>
            )}

            {/* Description */}
            <div className="space-y-1">
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
                className="w-full bg-white/[0.05] border border-white/[0.1] text-white placeholder:text-white/25 rounded-xl px-3 py-2 text-sm outline-none focus:border-orange-500/60 transition-colors"
              />
            </div>

            {/* Date */}
            <div className="space-y-1">
              <label className="text-sm text-white/60 font-medium">Date</label>
              <input
                type="date"
                value={form.date}
                onChange={(e) => set("date", e.target.value)}
                className="w-full bg-white/[0.05] border border-white/[0.1] text-white rounded-xl px-3 py-2 text-sm outline-none focus:border-orange-500/60 transition-colors cursor-pointer"
                style={{ colorScheme: "dark" }}
              />
              {errors.date && (
                <p className="text-red-400 text-xs">{errors.date}</p>
              )}
            </div>

            {/* Objectif lié */}
            <div className="space-y-1">
                <label className="text-sm text-white/60 font-medium">
                  Lier à un objectif{" "}
                  <span className="text-white/30 font-normal">(optionnel)</span>
                </label>

                {localObjectifs.length > 0 && (
                  <select
                    value={form.objectif_id}
                    onChange={(e) => {
                      set("objectif_id", e.target.value);
                      set("budget_item_id", "");
                    }}
                    className="w-full bg-white/[0.05] border border-white/[0.1] text-white rounded-xl px-3 py-2 text-sm outline-none focus:border-orange-500/60 transition-colors cursor-pointer appearance-none"
                    style={{ colorScheme: "dark" }}
                  >
                    <option value="" className="bg-[#0f0f1a]">
                      Aucun objectif
                    </option>
                    {localObjectifs.map((obj) => {
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
                )}

                {/* Bouton + Nouvel objectif */}
                {!showNewObjForm && (
                  <button
                    type="button"
                    onClick={() => setShowNewObjForm(true)}
                    className="flex items-center gap-1.5 text-xs text-orange-400/80 hover:text-orange-400 transition-colors mt-1"
                  >
                    <Plus size={12} />
                    Nouvel objectif
                  </button>
                )}

                {/* Mini-formulaire inline */}
                <AnimatePresence>
                  {showNewObjForm && (
                    <motion.div
                      initial={{ opacity: 0, height: 0 }}
                      animate={{ opacity: 1, height: "auto" }}
                      exit={{ opacity: 0, height: 0 }}
                      transition={{ duration: 0.18 }}
                      className="overflow-hidden"
                    >
                      <div className="rounded-xl border border-white/[0.1] bg-white/[0.03] p-3 space-y-2.5 mt-1">
                        <div className="flex items-center gap-2">
                          <button type="button" onClick={() => setShowNewObjForm(false)} className="text-white/40 hover:text-white transition-colors">
                            <ArrowLeft size={14} />
                          </button>
                          <span className="text-sm font-medium text-white">Nouvel objectif</span>
                        </div>
                        <input
                          type="text"
                          placeholder="Nom de l'objectif"
                          value={newObjForm.nom}
                          onChange={(e) => setNewObjForm((f) => ({ ...f, nom: e.target.value }))}
                          className="w-full bg-white/[0.05] border border-white/[0.1] text-white placeholder:text-white/25 rounded-lg px-3 py-2 text-sm outline-none focus:border-orange-500/60"
                        />
                        <input
                          type="number"
                          placeholder="Montant cible (€)"
                          value={newObjForm.montant_cible}
                          min={0}
                          step="0.01"
                          onChange={(e) => setNewObjForm((f) => ({ ...f, montant_cible: e.target.value }))}
                          className="w-full bg-white/[0.05] border border-white/[0.1] text-white placeholder:text-white/25 rounded-lg px-3 py-2 text-sm outline-none focus:border-orange-500/60"
                        />
                        <select
                          value={newObjForm.periode}
                          onChange={(e) => setNewObjForm((f) => ({ ...f, periode: e.target.value as "mensuel" | "annuel" | "ponctuel" }))}
                          className="w-full bg-white/[0.05] border border-white/[0.1] text-white rounded-lg px-3 py-2 text-sm outline-none focus:border-orange-500/60 cursor-pointer appearance-none"
                          style={{ colorScheme: "dark" }}
                        >
                          <option value="ponctuel" className="bg-[#0f0f1a]">Ponctuel</option>
                          <option value="mensuel" className="bg-[#0f0f1a]">Mensuel</option>
                          <option value="annuel" className="bg-[#0f0f1a]">Annuel</option>
                        </select>
                        <div className="flex gap-2 pt-0.5">
                          <button
                            type="button"
                            onClick={() => setShowNewObjForm(false)}
                            className="flex-1 py-2 rounded-lg text-sm text-white/50 hover:text-white bg-white/[0.05] hover:bg-white/[0.08] transition-colors"
                          >
                            Annuler
                          </button>
                          <button
                            type="button"
                            onClick={handleNewObjectifSave}
                            disabled={objSaving}
                            className="flex-1 py-2 rounded-lg text-sm text-white font-medium bg-orange-500/80 hover:bg-orange-500 transition-colors flex items-center justify-center gap-1.5 disabled:opacity-60"
                          >
                            {objSaving ? <Loader2 size={13} className="animate-spin" /> : <Check size={13} />}
                            Créer
                          </button>
                        </div>
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>

                {/* Sélecteur de ligne de budget — conditionnel */}
                {form.objectif_id &&
                  (() => {
                    const linkedBudgetItems = budgetItems.filter(
                      (bi) => bi.objectif_id === form.objectif_id
                    );
                    if (linkedBudgetItems.length === 0) return null;
                    return (
                      <div className="space-y-1">
                        <label className="text-sm text-white/60 font-medium">
                          Ligne de budget{" "}
                          <span className="text-white/30 font-normal">
                            (optionnel)
                          </span>
                        </label>
                        <select
                          value={form.budget_item_id}
                          onChange={(e) => set("budget_item_id", e.target.value)}
                          className="w-full bg-white/[0.05] border border-white/[0.1] text-white rounded-xl px-3 py-2 text-sm outline-none focus:border-orange-500/60 transition-colors cursor-pointer appearance-none"
                          style={{ colorScheme: "dark" }}
                        >
                          <option value="" className="bg-[#0f0f1a]">
                            Aucune ligne
                          </option>
                          {linkedBudgetItems.map((bi) => (
                            <option
                              key={bi.id}
                              value={bi.id}
                              className="bg-[#0f0f1a]"
                            >
                              {bi.nom} ({new Intl.NumberFormat("fr-FR", {
                                style: "currency",
                                currency: "EUR",
                              }).format(bi.montant)})
                            </option>
                          ))}
                        </select>
                      </div>
                    );
                  })()}

                {/* Aperçu de la progression si un objectif est sélectionné */}
                {form.objectif_id &&
                  (() => {
                    const obj = localObjectifs.find((o) => o.id === form.objectif_id);
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
                      <div className="bg-white/[0.03] border border-white/[0.07] rounded-xl px-3 py-2.5 text-xs space-y-1">
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
                  ? isEditMode
                    ? "Modification…"
                    : "Ajout en cours…"
                  : isEditMode
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
