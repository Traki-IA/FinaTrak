# TASKS — FinaTrak

## En cours
_(aucune)_

## Identifiées / Backlog
- [ ] Harmoniser les modales des autres pages (Transaction, Budget, Objectifs) avec le design system
- [ ] Valider l'harmonisation du CompteModal sur mobile (screenshot)
- [ ] Ajouter migration `sort_order` sur table `categories` (colonne existe en DB mais non versionnée)
- [ ] Activer `npm run gen:types` après `supabase link --project-ref <ID>`
- [ ] Ajouter tests automatisés sur les Server Actions critiques
- [ ] Ajouter monitoring d'erreurs (Sentry ou équivalent)

## Complétées

### 2026-04-04
- [x] Augmenter la taille du header (LogoHeader) pour renforcer la hiérarchie visuelle
- [x] Augmenter la taille des boutons du rightSlot (Upload, Plus)
- [x] Ajouter le collapse par carte mois dans la liste des transactions
- [x] Refonte de la barre d'actions : barre unifiée `[🔍] [Tout|Revenus|Dépenses] [📅]`
- [x] Harmoniser les presets de période avec le nouveau design system (fond plein orange)
- [x] Harmoniser le CompteModal avec les variables CSS du design system
- [x] Harmoniser le bouton crayon du dropdown comptes
