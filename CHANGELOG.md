# CHANGELOG — FinaTrak

## 2026-04-04 — Audit qualité + corrections senior

### Corrigé
- ESLint : 2 erreurs + 16 warnings supprimés (variables inutilisées, dead code, disable comments)
- CRUD catégories dupliqué → consolidé dans `lib/categories.ts` (source unique de vérité)
- `catch` vides → `console.error` / `console.warn` ajoutés (`middleware.ts`, `parametres/actions.ts`)
- `revalidatePath` standardisé sur `("/", "layout")` dans tous les fichiers actions
- CSS hardcodé dans `layout.tsx` → variables `--bg-toast`, `--border-subtle` dans `globals.css`
- Commentaire `middleware.ts` : décision de dégradation gracieuse documentée avec pourquoi

### Ajouté
- `lib/categories.ts` — Server Actions partagées pour upsert/delete catégories
- Script `npm run gen:types` — auto-génération des types TypeScript depuis le schéma Supabase
- `supabase` CLI installée comme dev dependency

### Dette identifiée
- Colonne `sort_order` sur `categories` utilisée dans le code mais absente des migrations

---

## 2026-04-04

### Ajouté
- Collapse par carte mois dans la liste des transactions (clic sur le header JANVIER)
- Barre d'actions unifiée sur la page Transactions : `[🔍] [Tout|Revenus|Dépenses] [📅]`
- Recherche masquée par défaut, s'ouvre au tap sur l'icône loupe

### Modifié
- Header (LogoHeader) : taille augmentée (`py-2.5`, `text-[17px] font-semibold`, icône `30×30px`)
- Boutons rightSlot (Upload, Plus) : passés de `28×28px` à `32×32px`
- Presets de période : nouveau style fond plein orange (`bg-[var(--orange)] text-white`)
- CompteModal : migration des couleurs hardcodées vers les variables CSS du design system
- Bouton crayon dropdown comptes : harmonisé avec le design system (`bg-[var(--bg3)]`)

### Pattern établi
- État actif : `bg-[var(--orange)] text-white rounded-[10px]`
- État inactif : `bg-[var(--bg3)] text-[var(--text2)] rounded-[10px]`
