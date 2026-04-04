// ⚠️ Fichier auto-généré — NE PAS MODIFIER MANUELLEMENT
// Généré par : npm run gen:types
//
// Prérequis (une seule fois) :
//   npx supabase login
//   npx supabase link --project-ref <PROJECT_ID>
//   (PROJECT_ID = identifiant dans l'URL Supabase, ex: xyzabcdef)
//
// Ensuite, à chaque changement de schéma DB :
//   npm run gen:types

export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[];

export type Database = {
  public: {
    Tables: Record<string, never>;
  };
};
