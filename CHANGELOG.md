# CHANGELOG — FinaTrak

## 2026-04-05 — Harmonisation design system modales + migration sort_order

### Modifié
- `TransactionModal`, `BudgetModal`, `ObjectifModal` : toutes les couleurs hardcodées remplacées par les variables CSS du design system (`var(--bg2)`, `var(--text)`, `var(--border)`, `var(--orange)`, etc.)
- Boutons inline Modifier/Supprimer : bordure + fond ajustés pour s'aligner sur le style des boutons de modales (`rounded-[10px]`)

### Ajouté
- Migration `supabase/migrations/010_sort_order.sql` : colonne `sort_order` (avec `IF NOT EXISTS`) sur `categories`, `objectifs`, `budget_items`

---

## 2026-04-05 — Fix build Vercel

### Corrigé
- `parametres/actions.ts` : suppression du re-export `export { deleteCategorie }` — interdit dans `"use server"`
- `CategoryList.tsx` : importe désormais `deleteCategorie` directement depuis `@/lib/categories`

---

## 2026-04-04 — Audit qualité itératif (passes 1–8) — Server Actions production-ready

### Sécurité
- `switchCompte` : ownership check avant écriture du cookie actif (CRITIQUE)
- `insertBudgetItem` : ownership check sur `objectif_id` et `categorie_id` existants
- `bulkInsertTransactions` : validation ownership des `categorie_id`
- `applyObjectifProgress` : `.single()` → `.maybeSingle()` (crash si objectif introuvable)

### Validation Zod
- Regex `YYYY-MM-DD` sur tous les champs `date` et `date_fin`
- `categorie_id: z.string().uuid()` dans tous les schémas (transactions, budget insert + update)
- `updateObjectifMontant` : plafonnement à `montant_cible` via `Math.min()`
- `updateSoldeInitial` : type de retour normalisé vers `{ success: true } | { error: string }`
- `updateCategoryByDescription` : retourne `{ affected: number }` + commentaire bulk

### Consolidation
- Création `lib/categories.ts` — source unique de vérité (supprime duplication parametres ↔ transactions)
- Extraction helper `applyObjectifProgress` dans transactions/actions.ts (−30 lignes dupliquées, corrige `.update()` non vérifié)
- Suppression re-export mort `{ upsertCategorie, deleteCategorie }` de transactions/actions.ts

### Robustesse
- `revalidatePath("/", "layout")` harmonisé dans tous les fichiers actions
- `insertCompte` : `if (error || !data)` au lieu de `if (error)` seul
- `middleware.ts` : `catch {}` → `catch (err) { console.warn(...) }`

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
