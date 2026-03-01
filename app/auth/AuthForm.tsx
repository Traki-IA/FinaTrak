"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import { toast } from "sonner";
import { Loader2, Mail, Lock, Eye, EyeOff } from "lucide-react";
import { signIn, signUp } from "./actions";

// ── Animations ──────────────────────────────────────────────────────────────

const FADE_UP = {
  hidden: { opacity: 0, y: 16 },
  visible: { opacity: 1, y: 0 },
};

const STAGGER_CONTAINER = {
  hidden: {},
  visible: { transition: { staggerChildren: 0.08 } },
};

// ── Composant ───────────────────────────────────────────────────────────────

type TMode = "login" | "signup";

export default function AuthForm() {
  const [mode, setMode] = useState<TMode>("login");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);

  function validate(): boolean {
    const next: Record<string, string> = {};
    if (!email.trim()) next.email = "L'email est requis";
    if (!password.trim()) next.password = "Le mot de passe est requis";
    else if (password.length < 6)
      next.password = "Au moins 6 caractères";
    setErrors(next);
    return Object.keys(next).length === 0;
  }

  function switchMode() {
    setMode((m) => (m === "login" ? "signup" : "login"));
    setErrors({});
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!validate()) return;

    setIsSubmitting(true);
    const action = mode === "login" ? signIn : signUp;
    const result = await action({ email, password });
    setIsSubmitting(false);

    if ("error" in result) {
      toast.error(result.error);
      return;
    }

    if (result.message) {
      toast.success(result.message);
    }
  }

  const isLogin = mode === "login";

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-[#0a0a0f] px-4">
      <motion.div
        variants={STAGGER_CONTAINER}
        initial="hidden"
        animate="visible"
        className="w-full max-w-sm"
      >
        {/* Logo */}
        <motion.div variants={FADE_UP} className="text-center mb-8">
          <h1 className="text-3xl font-bold text-white tracking-tight">
            Fina<span className="text-orange-500">Trak</span>
          </h1>
          <p className="text-white/40 text-sm mt-2">
            Suivi financier personnel
          </p>
        </motion.div>

        {/* Card */}
        <motion.div
          variants={FADE_UP}
          className="bg-white/[0.03] border border-white/[0.06] rounded-2xl p-6"
        >
          {/* Onglets */}
          <div className="flex mb-6 bg-white/[0.04] rounded-xl p-1">
            <button
              type="button"
              onClick={() => { setMode("login"); setErrors({}); }}
              className={`flex-1 py-2 text-sm font-medium rounded-lg transition-all ${
                isLogin
                  ? "bg-orange-500 text-white shadow-lg shadow-orange-500/20"
                  : "text-white/50 hover:text-white/70"
              }`}
            >
              Connexion
            </button>
            <button
              type="button"
              onClick={() => { setMode("signup"); setErrors({}); }}
              className={`flex-1 py-2 text-sm font-medium rounded-lg transition-all ${
                !isLogin
                  ? "bg-orange-500 text-white shadow-lg shadow-orange-500/20"
                  : "text-white/50 hover:text-white/70"
              }`}
            >
              Inscription
            </button>
          </div>

          {/* Formulaire */}
          <form onSubmit={handleSubmit} className="space-y-4">
            {/* Email */}
            <div className="space-y-1.5">
              <label className="text-sm text-white/60 font-medium">Email</label>
              <div className="relative">
                <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-white/30" />
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="votre@email.com"
                  className="w-full bg-white/[0.05] border border-white/[0.1] text-white rounded-xl pl-10 pr-4 py-2.5 text-sm outline-none focus:border-orange-500/60 transition-colors placeholder:text-white/20"
                />
              </div>
              {errors.email && (
                <p className="text-red-400 text-xs">{errors.email}</p>
              )}
            </div>

            {/* Mot de passe */}
            <div className="space-y-1.5">
              <label className="text-sm text-white/60 font-medium">
                Mot de passe
              </label>
              <div className="relative">
                <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-white/30" />
                <input
                  type={showPassword ? "text" : "password"}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  className="w-full bg-white/[0.05] border border-white/[0.1] text-white rounded-xl pl-10 pr-10 py-2.5 text-sm outline-none focus:border-orange-500/60 transition-colors placeholder:text-white/20"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword((s) => !s)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-white/30 hover:text-white/60 transition-colors"
                >
                  {showPassword ? (
                    <EyeOff className="w-4 h-4" />
                  ) : (
                    <Eye className="w-4 h-4" />
                  )}
                </button>
              </div>
              {errors.password && (
                <p className="text-red-400 text-xs">{errors.password}</p>
              )}
            </div>

            {/* Bouton submit */}
            <button
              type="submit"
              disabled={isSubmitting}
              className="w-full bg-orange-500 hover:bg-orange-600 disabled:opacity-50 disabled:cursor-not-allowed text-white font-medium py-2.5 rounded-xl text-sm transition-colors flex items-center justify-center gap-2 mt-2"
            >
              {isSubmitting ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : null}
              {isLogin ? "Se connecter" : "Créer un compte"}
            </button>
          </form>
        </motion.div>

        {/* Lien switch mode */}
        <motion.p
          variants={FADE_UP}
          className="text-center mt-6 text-sm text-white/40"
        >
          {isLogin ? "Pas encore de compte ?" : "Déjà un compte ?"}{" "}
          <button
            type="button"
            onClick={switchMode}
            className="text-orange-500 hover:text-orange-400 font-medium transition-colors"
          >
            {isLogin ? "S'inscrire" : "Se connecter"}
          </button>
        </motion.p>
      </motion.div>
    </div>
  );
}
