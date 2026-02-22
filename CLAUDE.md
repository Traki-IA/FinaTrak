# CLAUDE.md — Conventions FinaTrak

Ce fichier définit les conventions et règles de développement pour le projet FinaTrak.

## Stack & outils

- **Next.js 16** — App Router uniquement (pas de `pages/`)
- **TypeScript** — strict mode activé
- **Tailwind CSS v4** — utilitaires uniquement, pas de CSS custom sauf dans `globals.css`
- **Supabase** — client initialisé dans `/lib/supabase.ts`
- **Recharts** — pour tous les graphiques

## Conventions de code

### Composants
- Un composant par fichier
- Noms en PascalCase : `TransactionCard.tsx`
- Placer les composants réutilisables dans `/components`
- Les composants spécifiques à une route restent dans leur dossier `/app/[route]/`

### Fichiers & dossiers
- Routes Next.js : `/app/[nom-route]/page.tsx`
- Composants server par défaut ; ajouter `"use client"` uniquement si nécessaire
- Types partagés dans `/types/index.ts`
- Fonctions utilitaires dans `/lib/`

### Nommage
- Variables et fonctions : camelCase
- Types et interfaces : PascalCase, préfixe `T` pour les types (`TTransaction`), `I` pour les interfaces
- Constantes globales : UPPER_SNAKE_CASE

### Supabase
- Toujours utiliser le client exporté depuis `/lib/supabase.ts`
- Ne jamais exposer `SUPABASE_SERVICE_ROLE_KEY` côté client
- Requêtes dans des fonctions dédiées (pas inline dans les composants)

### Git
- Messages de commit en anglais, format : `type: description`
  - Types : `feat`, `fix`, `refactor`, `style`, `docs`, `chore`, `test`
  - Exemple : `feat: add transaction list component`
- Une fonctionnalité = une branche = une PR

## Variables d'environnement

Voir `.env.example` pour la liste complète.
Ne jamais committer de fichier `.env.local` ou `.env`.

## Commandes utiles

```bash
npm run dev      # Serveur de développement
npm run build    # Build de production
npm run lint     # Linter ESLint
```
