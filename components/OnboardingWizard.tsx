"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import { Loader2, ArrowRight, Check, Sparkles } from "lucide-react";
import { toast } from "sonner";
import { insertCompte } from "@/app/(main)/comptes/actions";
import { CompteIcon, ICON_MAP } from "@/components/AccountSwitcher";

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

export default function OnboardingWizard() {
  const router = useRouter();
  const [step, setStep] = useState(0);
  const [direction, setDirection] = useState(1);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const [nom, setNom] = useState("");
  const [icone, setIcone] = useState("landmark");
  const [couleur, setCouleur] = useState("#6366f1");
  const [soldeInitial, setSoldeInitial] = useState("0");
  const [nomError, setNomError] = useState("");

  function goNext() {
    if (step === 0) {
      if (!nom.trim()) {
        setNomError("Le nom est requis");
        return;
      }
      setNomError("");
    }
    setDirection(1);
    setStep((s) => s + 1);
  }

  function goBack() {
    setDirection(-1);
    setStep((s) => s - 1);
  }

  async function handleCreate() {
    setIsSubmitting(true);

    const result = await insertCompte({
      nom: nom.trim(),
      couleur,
      icone,
      solde_initial: parseFloat(soldeInitial) || 0,
    });

    if ("error" in result) {
      toast.error(result.error);
      setIsSubmitting(false);
      return;
    }

    toast.success("Compte créé !");
    router.push("/dashboard");
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
      <div className="w-full max-w-md bg-[#12121f] border border-white/10 rounded-2xl p-6 overflow-hidden relative min-h-[380px]">
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
              <StepAccount
                nom={nom}
                setNom={(v) => { setNom(v); if (nomError) setNomError(""); }}
                nomError={nomError}
                icone={icone}
                setIcone={setIcone}
                couleur={couleur}
                setCouleur={setCouleur}
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
              <StepBalance
                soldeInitial={soldeInitial}
                setSoldeInitial={setSoldeInitial}
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
                nom={nom}
                couleur={couleur}
                icone={icone}
                soldeInitial={soldeInitial}
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

// ── Step 1: Account name, icon, color ───────────────────────────────────────

function StepAccount({
  nom,
  setNom,
  nomError,
  icone,
  setIcone,
  couleur,
  setCouleur,
  onNext,
}: {
  nom: string;
  setNom: (v: string) => void;
  nomError: string;
  icone: string;
  setIcone: (v: string) => void;
  couleur: string;
  setCouleur: (v: string) => void;
  onNext: () => void;
}) {
  return (
    <div className="space-y-5">
      <div>
        <h2 className="text-lg font-bold text-white">Créez votre premier compte</h2>
        <p className="text-sm text-white/40 mt-1">
          Donnez-lui un nom, une icône et une couleur.
        </p>
      </div>

      {/* Nom */}
      <div>
        <label className="block text-xs text-white/40 uppercase tracking-widest mb-2">
          Nom du compte
        </label>
        <input
          type="text"
          value={nom}
          onChange={(e) => setNom(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && onNext()}
          className="w-full bg-white/[0.06] border border-white/10 rounded-xl px-4 py-3 text-white outline-none focus:border-orange-500/50 transition-colors"
          placeholder="Ex: Compte courant"
          autoFocus
        />
        {nomError && <p className="text-red-400 text-xs mt-1">{nomError}</p>}
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
              onClick={() => setCouleur(c)}
              className={`w-8 h-8 rounded-lg transition-all ${
                couleur === c
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
              onClick={() => setIcone(iconKey)}
              className={`flex items-center justify-center w-10 h-10 rounded-xl transition-all ${
                icone === iconKey
                  ? "bg-white/15 text-white ring-1 ring-white/30"
                  : "bg-white/[0.04] text-white/40 hover:text-white/70 hover:bg-white/[0.08]"
              }`}
            >
              <CompteIcon icone={iconKey} size={18} />
            </button>
          ))}
        </div>
      </div>

      {/* Next */}
      <button
        type="button"
        onClick={onNext}
        className="w-full flex items-center justify-center gap-2 py-3 rounded-xl bg-orange-500 hover:bg-orange-400 text-white font-semibold text-sm transition-colors"
      >
        Continuer
        <ArrowRight size={16} />
      </button>
    </div>
  );
}

// ── Step 2: Initial balance ─────────────────────────────────────────────────

function StepBalance({
  soldeInitial,
  setSoldeInitial,
  onNext,
  onBack,
  onSkip,
}: {
  soldeInitial: string;
  setSoldeInitial: (v: string) => void;
  onNext: () => void;
  onBack: () => void;
  onSkip: () => void;
}) {
  return (
    <div className="space-y-5">
      <div>
        <h2 className="text-lg font-bold text-white">Solde initial</h2>
        <p className="text-sm text-white/40 mt-1">
          Quel est le solde actuel de ce compte ?
        </p>
      </div>

      <div>
        <label className="block text-xs text-white/40 uppercase tracking-widest mb-2">
          Montant (€)
        </label>
        <input
          type="number"
          step="0.01"
          value={soldeInitial}
          onChange={(e) => setSoldeInitial(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && onNext()}
          className="w-full bg-white/[0.06] border border-white/10 rounded-xl px-4 py-3 text-white outline-none focus:border-orange-500/50 transition-colors text-2xl font-semibold text-center [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
          placeholder="0.00"
          autoFocus
        />
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
  nom,
  couleur,
  icone,
  soldeInitial,
  isSubmitting,
  onBack,
  onCreate,
}: {
  nom: string;
  couleur: string;
  icone: string;
  soldeInitial: string;
  isSubmitting: boolean;
  onBack: () => void;
  onCreate: () => void;
}) {
  const montant = parseFloat(soldeInitial) || 0;
  const formatted = new Intl.NumberFormat("fr-FR", {
    style: "currency",
    currency: "EUR",
  }).format(montant);

  return (
    <div className="space-y-6">
      <div className="text-center">
        <Sparkles size={24} className="text-orange-400 mx-auto mb-3" />
        <h2 className="text-lg font-bold text-white">Tout est prêt !</h2>
        <p className="text-sm text-white/40 mt-1">
          Voici un récapitulatif de votre compte.
        </p>
      </div>

      {/* Preview card */}
      <div className="bg-white/[0.04] border border-white/[0.08] rounded-xl p-5 flex items-center gap-4">
        <span
          className="flex items-center justify-center w-12 h-12 rounded-xl flex-shrink-0"
          style={{ backgroundColor: `${couleur}20`, color: couleur }}
        >
          <CompteIcon icone={icone} size={22} strokeWidth={2} />
        </span>
        <div className="flex-1 min-w-0">
          <p className="text-white font-semibold truncate">{nom}</p>
          <p className="text-white/40 text-sm">{formatted}</p>
        </div>
        <div
          className="w-3 h-3 rounded-full flex-shrink-0"
          style={{ backgroundColor: couleur }}
        />
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
