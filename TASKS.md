# TASKS — FinaTrak

## En cours
_(aucune)_

## Identifiées / Backlog
- [x] Harmoniser les modales des autres pages (Transaction, Budget, Objectifs) avec le design system
- [ ] Valider l'harmonisation du CompteModal sur mobile (screenshot)
- [ ] Ajouter migration `sort_order` sur table `categories` (colonne existe en DB mais non versionnée)
- [ ] Activer `npm run gen:types` après `supabase link --project-ref <ID>`
- [ ] Ajouter tests automatisés sur les Server Actions critiques
- [ ] Ajouter monitoring d'erreurs (Sentry ou équivalent)

## Complétées

### 2026-04-05
- [x] Fix build Vercel — re-export interdit dans `"use server"` (`parametres/actions.ts`)

### 2026-04-04 (session 2)
- [x] Corriger `precommit-check.sh` (strict mode, regex .env, JSON escaping)
- [x] Créer `lib/categories.ts` — source unique de vérité pour CRUD catégories
- [x] Sécuriser `switchCompte` — ownership check avant écriture du cookie (CRITIQUE)
- [x] Valider date avec regex `YYYY-MM-DD` dans tous les schémas Zod
- [x] Extraire helper `applyObjectifProgress` (déduplication + bug silencieux corrigé)
- [x] Valider `categorie_id` UUID + ownership dans tous les schémas concernés
- [x] Normaliser `updateSoldeInitial` vers `TActionResult` standard
- [x] Plafonner `updateObjectifMontant` à `montant_cible` via `Math.min()`
- [x] Ownership check sur `objectif_id` et `categorie_id` dans `insertBudgetItem`
- [x] Valider `categorie_id` dans `bulkInsertTransactions` (ownership)
- [x] `.single()` → `.maybeSingle()` dans `applyObjectifProgress`
- [x] `UpdateBudgetItemSchema.categorie_id` — ajout `.uuid()` manquant

### 2026-04-04
- [x] Augmenter la taille du header (LogoHeader) pour renforcer la hiérarchie visuelle
- [x] Augmenter la taille des boutons du rightSlot (Upload, Plus)
- [x] Ajouter le collapse par carte mois dans la liste des transactions
- [x] Refonte de la barre d'actions : barre unifiée `[🔍] [Tout|Revenus|Dépenses] [📅]`
- [x] Harmoniser les presets de période avec le nouveau design system (fond plein orange)
- [x] Harmoniser le CompteModal avec les variables CSS du design system
- [x] Harmoniser le bouton crayon du dropdown comptes
