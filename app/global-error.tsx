"use client";

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <html lang="fr">
      <body className="bg-[#0a0a0f] text-white min-h-dvh flex items-center justify-center px-4">
        <div className="text-center max-w-md space-y-4">
          <h1 className="text-xl font-bold">
            Fina<span className="text-orange-500">Trak</span>
          </h1>
          <p className="text-white/60 text-sm">
            Une erreur inattendue est survenue.
          </p>
          <button
            onClick={reset}
            className="px-6 py-2.5 rounded-xl bg-orange-500 hover:bg-orange-400 text-white font-semibold text-sm transition-colors"
          >
            Réessayer
          </button>
        </div>
      </body>
    </html>
  );
}
