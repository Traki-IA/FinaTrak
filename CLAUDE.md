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

## Standards de développement

### Clean Code
- Fonctions courtes avec une seule responsabilité
- Nommage explicite et descriptif (pas d'abréviations)
- Pas de code dupliqué (principe DRY)
- Commentaires uniquement pour expliquer le "pourquoi", pas le "quoi"
- Séparation claire entre logique métier et présentation

### Sécurité
- Toutes les requêtes Supabase se font côté serveur (Server Components ou API Routes)
- Jamais de clés sensibles exposées côté client
- Validation des données entrantes avec Zod
- Row Level Security (RLS) activé sur toutes les tables Supabase
- Pas de SQL dynamique construit depuis des inputs utilisateur

### Standards senior
- TypeScript strict, zéro usage de `any`
- Gestion explicite des erreurs sur chaque appel async
- Composants réutilisables et découplés
- Chaque fonction doit être testable indépendamment

### Bibliothèques UI
- **shadcn/ui** — tous les composants de base (boutons, cartes, modales, formulaires)
- **Framer Motion** — animations et transitions
- **Recharts** — tous les graphiques
- **Lucide React** — icônes

### Principes UX
- Animations fluides sur les interactions (hover, click, chargement)
- Skeleton loaders pendant les chargements (jamais de page blanche)
- Transitions de page avec Framer Motion
- Feedback visuel immédiat sur chaque action utilisateur
- Design responsive mobile-first
- Mode sombre par défaut

### Performance
- Utiliser les Server Components Next.js au maximum
- Lazy loading sur les composants lourds
- Optimisation des images avec `next/image`

## Règles importantes

### Règles absolues
- Ne jamais inventer de règles métier, contraintes ou comportements qui ne sont pas explicitement définis dans ce fichier ou dans le code existant
- Si une règle n'est pas documentée ici, elle n'existe pas
- En cas de doute sur une règle métier, poser la question avant de coder
- Toujours lire le code existant avant de supposer un comportement

## Variables d'environnement

Voir `.env.example` pour la liste complète.
Ne jamais committer de fichier `.env.local` ou `.env`.

## Commandes utiles

```bash
npm run dev      # Serveur de développement
npm run build    # Build de production
npm run lint     # Linter ESLint
```
