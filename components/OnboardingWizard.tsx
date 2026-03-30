"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import { Loader2, ArrowRight, Check, Sparkles, Plus, Trash2 } from "lucide-react";
import { toast } from "@/lib/toast";
import { insertCompte } from "@/app/(main)/comptes/actions";
import { CompteIcon, ICON_MAP } from "@/components/compte-icons";

// ── Constants ───────────────────────────────────────────────────────────────

const COULEURS = [
  "#6366f1", "#f59e0b", "#10b981", "#ef4444", "#3b82f6",
  "#8b5cf6", "#ec4899", "#14b8a6", "#f97316", "#06b6d4",
];

const ICONES = Object.keys(ICON_MAP);

const SLIDE_VARIANTS = {
  enter: (direction: number) => ({
    x: direction > 0 ? 300 : -300,
    opacity: 0,
  }),
  center: {
    x: 0,
    opacity: 1,
  },
  exit: (direction: number) => ({
    x: direction > 0 ? -300 : 300,
    opacity: 0,
  }),
};

const INITIAL_FORM = {
  nom: "",
  icone: "landmark",
  couleur: "#6366f1",
};

// ── Types ───────────────────────────────────────────────────────────────────

type TPendingCompte = {
  nom: string;
  icone: string;
  couleur: string;
  solde_initial: string;
};

// ── Helpers ─────────────────────────────────────────────────────────────────

const formatEur = (value: string) =>
  new Intl.NumberFormat("fr-FR", { style: "currency", currency: "EUR" }).format(
    parseFloat(value) || 0,
  );

// ── Wizard ──────────────────────────────────────────────────────────────────

export default function OnboardingWizard() {
  const router = useRouter();
  const [step, setStep] = useState(0);
  const [direction, setDirection] = useState(1);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Liste des comptes en attente de création
  const [comptes, setComptes] = useState<TPendingCompte[]>([]);

  // Formulaire courant (step 1)
  const [form, setForm] = useState(INITIAL_FORM);
  const [nomError, setNomError] = useState("");

  function addCompte() {
    if (!form.nom.trim()) {
      setNomError("Le nom est requis");
      return;
    }
    setNomError("");
    setComptes((prev) => [
      ...prev,
      { ...form, nom: form.nom.trim(), solde_initial: "0" },
    ]);
    // Réinitialiser le formulaire avec la prochaine couleur disponible
    const usedColors = [...comptes.map((c) => c.couleur), form.couleur];
    const nextColor = COULEURS.find((c) => !usedColors.includes(c)) ?? COULEURS[0];
    setForm({ nom: "", icone: "landmark", couleur: nextColor });
  }

  function removeCompte(index: number) {
    setComptes((prev) => prev.filter((_, i) => i !== index));
  }

  function goNext() {
    if (step === 0 && comptes.length === 0) {
      setNomError("Ajoutez au moins un compte");
      return;
    }
    setDirection(1);
    setStep((s) => s + 1);
  }

  function goBack() {
    setDirection(-1);
    setStep((s) => s - 1);
  }

  function updateSolde(index: number, value: string) {
    setComptes((prev) =>
      prev.map((c, i) => (i === index ? { ...c, solde_initial: value } : c)),
    );
  }

  async function handleCreate() {
    setIsSubmitting(true);

    let firstCompteId: string | null = null;

    for (const compte of comptes) {
      const result = await insertCompte({
        nom: compte.nom,
        couleur: compte.couleur,
        icone: compte.icone,
        solde_initial: parseFloat(compte.solde_initial) || 0,
      });

      if ("error" in result) {
        toast.error(`Erreur pour "${compte.nom}" : ${result.error}`);
        setIsSubmitting(false);
        return;
      }

      if (!firstCompteId) firstCompteId = result.id;
    }

    toast.success(
      comptes.length === 1 ? "Compte créé !" : `${comptes.length} comptes créés !`,
    );
    router.push(firstCompteId ? `/dashboard?compte=${firstCompteId}` : "/dashboard");
  }

  return (
    <div className="min-h-dvh flex flex-col items-center justify-center px-4 py-8 bg-background">
      {/* Logo */}
      <div className="mb-8">
        <span className="text-white font-bold text-2xl tracking-tight">
          Fina<span className="text-orange-500">Trak</span>
        </span>
      </div>

      {/* Step indicator */}
      <div className="flex items-center gap-2 mb-8">
        {[0, 1, 2].map((i) => (
          <div
            key={i}
            className={`h-1.5 rounded-full transition-all duration-300 ${
              i === step
                ? "w-8 bg-orange-500"
                : i < step
                  ? "w-4 bg-orange-500/40"
                  : "w-4 bg-white/10"
            }`}
          />
        ))}
      </div>

      {/* Wizard card */}
      <div className="w-full max-w-md bg-[#12121f] border border-white/10 rounded-2xl p-6 overflow-hidden relative">
        <AnimatePresence mode="wait" custom={direction}>
          {step === 0 && (
            <motion.div
              key="step-0"
              custom={direction}
              variants={SLIDE_VARIANTS}
              initial="enter"
              animate="center"
              exit="exit"
              transition={{ duration: 0.3, ease: "easeInOut" }}
            >
              <StepAccounts
                form={form}
                setForm={setForm}
                nomError={nomError}
                setNomError={setNomError}
                comptes={comptes}
                onAdd={addCompte}
                onRemove={removeCompte}
                onNext={goNext}
              />
            </motion.div>
          )}

          {step === 1 && (
            <motion.div
              key="step-1"
              custom={direction}
              variants={SLIDE_VARIANTS}
              initial="enter"
              animate="center"
              exit="exit"
              transition={{ duration: 0.3, ease: "easeInOut" }}
            >
              <StepBalances
                comptes={comptes}
                onUpdateSolde={updateSolde}
                onNext={goNext}
                onBack={goBack}
                onSkip={goNext}
              />
            </motion.div>
          )}

          {step === 2 && (
            <motion.div
              key="step-2"
              custom={direction}
              variants={SLIDE_VARIANTS}
              initial="enter"
              animate="center"
              exit="exit"
              transition={{ duration: 0.3, ease: "easeInOut" }}
            >
              <StepConfirm
                comptes={comptes}
                isSubmitting={isSubmitting}
                onBack={goBack}
                onCreate={handleCreate}
              />
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}

// ── Step 1: Multi-account creation ──────────────────────────────────────────

function StepAccounts({
  form,
  setForm,
  nomError,
  setNomError,
  comptes,
  onAdd,
  onRemove,
  onNext,
}: {
  form: typeof INITIAL_FORM;
  setForm: React.Dispatch<React.SetStateAction<typeof INITIAL_FORM>>;
  nomError: string;
  setNomError: (v: string) => void;
  comptes: TPendingCompte[];
  onAdd: () => void;
  onRemove: (index: number) => void;
  onNext: () => void;
}) {
  function set<K extends keyof typeof INITIAL_FORM>(key: K, value: string) {
    setForm((prev) => ({ ...prev, [key]: value }));
    if (key === "nom" && nomError) setNomError("");
  }

  return (
    <div className="space-y-5">
      <div>
        <h2 className="text-lg font-bold text-white">Créez vos comptes</h2>
        <p className="text-sm text-white/40 mt-1">
          Ajoutez un ou plusieurs comptes pour commencer.
        </p>
      </div>

      {/* Liste des comptes déjà ajoutés */}
      {comptes.length > 0 && (
        <div className="space-y-2">
          <AnimatePresence mode="popLayout">
            {comptes.map((compte, index) => (
              <motion.div
                key={`${compte.nom}-${index}`}
                layout
                initial={{ opacity: 0, y: -8 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, x: -100 }}
                transition={{ duration: 0.2 }}
                className="flex items-center gap-3 bg-white/[0.04] border border-white/[0.08] rounded-xl px-3 py-2.5"
              >
                <span
                  className="flex items-center justify-center w-8 h-8 rounded-lg flex-shrink-0"
                  style={{ backgroundColor: `${compte.couleur}20`, color: compte.couleur }}
                >
                  <CompteIcon icone={compte.icone} size={15} strokeWidth={2} />
                </span>
                <span className="text-white text-sm font-medium truncate flex-1">
                  {compte.nom}
                </span>
                <div
                  className="w-2.5 h-2.5 rounded-full flex-shrink-0"
                  style={{ backgroundColor: compte.couleur }}
                />
                <button
                  type="button"
                  onClick={() => onRemove(index)}
                  className="text-white/20 hover:text-red-400 transition-colors flex-shrink-0 p-1"
                >
                  <Trash2 size={14} />
                </button>
              </motion.div>
            ))}
          </AnimatePresence>
        </div>
      )}

      {/* Formulaire d'ajout */}
      <div className="space-y-4 bg-white/[0.02] border border-white/[0.06] rounded-xl p-4">
        {/* Nom */}
        <div>
          <label className="block text-xs text-white/40 uppercase tracking-widest mb-1.5">
            Nom du compte
          </label>
          <input
            type="text"
            value={form.nom}
            onChange={(e) => set("nom", e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter") {
                e.preventDefault();
                onAdd();
              }
            }}
            className="w-full bg-white/[0.06] border border-white/10 rounded-xl px-4 py-2.5 text-white text-sm outline-none focus:border-orange-500/50 transition-colors"
            placeholder="Ex: Compte courant"
            autoFocus
          />
          {nomError && comptes.length === 0 && (
            <p className="text-red-400 text-xs mt-1">{nomError}</p>
          )}
        </div>

        {/* Couleur */}
        <div>
          <label className="block text-xs text-white/40 uppercase tracking-widest mb-1.5">
            Couleur
          </label>
          <div className="flex gap-1.5 flex-wrap">
            {COULEURS.map((c) => (
              <button
                key={c}
                type="button"
                onClick={() => set("couleur", c)}
                className={`w-7 h-7 rounded-lg transition-all ${
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
          <label className="block text-xs text-white/40 uppercase tracking-widest mb-1.5">
            Icône
          </label>
          <div className="flex gap-1.5 flex-wrap">
            {ICONES.map((iconKey) => (
              <button
                key={iconKey}
                type="button"
                onClick={() => set("icone", iconKey)}
                className={`flex items-center justify-center w-9 h-9 rounded-xl transition-all ${
                  form.icone === iconKey
                    ? "bg-white/15 text-white ring-1 ring-white/30"
                    : "bg-white/[0.04] text-white/40 hover:text-white/70 hover:bg-white/[0.08]"
                }`}
              >
                <CompteIcon icone={iconKey} size={16} />
              </button>
            ))}
          </div>
        </div>

        {/* Bouton Ajouter */}
        <button
          type="button"
          onClick={onAdd}
          className="w-full flex items-center justify-center gap-2 py-2.5 rounded-xl border border-dashed border-white/15 text-white/50 hover:text-white hover:border-orange-500/40 hover:bg-white/[0.03] text-sm transition-all"
        >
          <Plus size={16} />
          Ajouter ce compte
        </button>
      </div>

      {/* Continuer */}
      <button
        type="button"
        onClick={onNext}
        disabled={comptes.length === 0}
        className="w-full flex items-center justify-center gap-2 py-3 rounded-xl bg-orange-500 hover:bg-orange-400 text-white font-semibold text-sm transition-colors disabled:opacity-30 disabled:cursor-not-allowed"
      >
        Continuer
        <ArrowRight size={16} />
      </button>
    </div>
  );
}

// ── Step 2: Balances per account ────────────────────────────────────────────

function StepBalances({
  comptes,
  onUpdateSolde,
  onNext,
  onBack,
  onSkip,
}: {
  comptes: TPendingCompte[];
  onUpdateSolde: (index: number, value: string) => void;
  onNext: () => void;
  onBack: () => void;
  onSkip: () => void;
}) {
  return (
    <div className="space-y-5">
      <div>
        <h2 className="text-lg font-bold text-white">Soldes initiaux</h2>
        <p className="text-sm text-white/40 mt-1">
          {comptes.length === 1
            ? "Quel est le solde actuel de votre compte ?"
            : "Renseignez le solde actuel de chaque compte."}
        </p>
      </div>

      <div className="space-y-3">
        {comptes.map((compte, index) => (
          <div
            key={`${compte.nom}-${index}`}
            className="flex items-center gap-3 bg-white/[0.04] border border-white/[0.08] rounded-xl px-3 py-3"
          >
            <span
              className="flex items-center justify-center w-9 h-9 rounded-lg flex-shrink-0"
              style={{ backgroundColor: `${compte.couleur}20`, color: compte.couleur }}
            >
              <CompteIcon icone={compte.icone} size={16} strokeWidth={2} />
            </span>
            <span className="text-white text-sm font-medium truncate flex-1 min-w-0">
              {compte.nom}
            </span>
            <div className="flex items-center gap-1 flex-shrink-0">
              <input
                type="number"
                step="0.01"
                value={compte.solde_initial}
                onChange={(e) => onUpdateSolde(index, e.target.value)}
                className="w-24 bg-white/[0.06] border border-white/10 rounded-lg px-2 py-1.5 text-white text-sm text-right outline-none focus:border-orange-500/50 transition-colors [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                placeholder="0.00"
              />
              <span className="text-white/30 text-xs">€</span>
            </div>
          </div>
        ))}
      </div>

      <div className="flex flex-col gap-3 pt-2">
        <button
          type="button"
          onClick={onNext}
          className="w-full flex items-center justify-center gap-2 py-3 rounded-xl bg-orange-500 hover:bg-orange-400 text-white font-semibold text-sm transition-colors"
        >
          Continuer
          <ArrowRight size={16} />
        </button>
        <button
          type="button"
          onClick={onSkip}
          className="w-full py-2.5 rounded-xl text-white/40 hover:text-white/60 text-sm transition-colors"
        >
          Je définirai plus tard
        </button>
      </div>

      <button
        type="button"
        onClick={onBack}
        className="text-white/30 hover:text-white/60 text-sm transition-colors"
      >
        ← Retour
      </button>
    </div>
  );
}

// ── Step 3: Confirmation ────────────────────────────────────────────────────

function StepConfirm({
  comptes,
  isSubmitting,
  onBack,
  onCreate,
}: {
  comptes: TPendingCompte[];
  isSubmitting: boolean;
  onBack: () => void;
  onCreate: () => void;
}) {
  return (
    <div className="space-y-6">
      <div className="text-center">
        <Sparkles size={24} className="text-orange-400 mx-auto mb-3" />
        <h2 className="text-lg font-bold text-white">Tout est prêt !</h2>
        <p className="text-sm text-white/40 mt-1">
          {comptes.length === 1
            ? "Voici un récapitulatif de votre compte."
            : `Voici vos ${comptes.length} comptes.`}
        </p>
      </div>

      {/* Accounts list */}
      <div className="space-y-2">
        {comptes.map((compte, index) => (
          <div
            key={`${compte.nom}-${index}`}
            className="bg-white/[0.04] border border-white/[0.08] rounded-xl p-4 flex items-center gap-3"
          >
            <span
              className="flex items-center justify-center w-10 h-10 rounded-xl flex-shrink-0"
              style={{ backgroundColor: `${compte.couleur}20`, color: compte.couleur }}
            >
              <CompteIcon icone={compte.icone} size={20} strokeWidth={2} />
            </span>
            <div className="flex-1 min-w-0">
              <p className="text-white font-semibold text-sm truncate">{compte.nom}</p>
              <p className="text-white/40 text-xs">{formatEur(compte.solde_initial)}</p>
            </div>
            <div
              className="w-2.5 h-2.5 rounded-full flex-shrink-0"
              style={{ backgroundColor: compte.couleur }}
            />
          </div>
        ))}
      </div>

      <div className="flex flex-col gap-3">
        <button
          type="button"
          onClick={onCreate}
          disabled={isSubmitting}
          className="w-full flex items-center justify-center gap-2 py-3 rounded-xl bg-orange-500 hover:bg-orange-400 text-white font-semibold text-sm transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {isSubmitting ? (
            <Loader2 size={16} className="animate-spin" />
          ) : (
            <>
              <Check size={16} />
              Accéder à mon dashboard
            </>
          )}
        </button>
        <button
          type="button"
          onClick={onBack}
          disabled={isSubmitting}
          className="text-white/30 hover:text-white/60 text-sm transition-colors disabled:opacity-50"
        >
          ← Retour
        </button>
      </div>
    </div>
  );
}
