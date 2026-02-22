# FinaTrak

Application de suivi financier personnel construite avec Next.js, Supabase et Recharts.

## Stack technique

- **Framework** : Next.js 16 (App Router) + TypeScript
- **Styling** : Tailwind CSS v4
- **Base de données** : Supabase (PostgreSQL)
- **Graphiques** : Recharts

## Fonctionnalités

- `/dashboard` — Vue d'ensemble des finances
- `/transactions` — Gestion des transactions
- `/objectifs` — Suivi des objectifs financiers
- `/bilan` — Bilan mensuel / annuel

## Installation

```bash
# Cloner le repo
git clone https://github.com/Traki-IA/FinaTrak.git
cd FinaTrak

# Installer les dépendances
npm install

# Configurer les variables d'environnement
cp .env.example .env.local
# → Renseigner NEXT_PUBLIC_SUPABASE_URL, NEXT_PUBLIC_SUPABASE_ANON_KEY, SUPABASE_SERVICE_ROLE_KEY

# Lancer le serveur de développement
npm run dev
```

## Structure du projet

```
/app
  /dashboard        → Page tableau de bord
  /transactions     → Page transactions
  /objectifs        → Page objectifs
  /bilan            → Page bilan
/components         → Composants réutilisables
/lib
  supabase.ts       → Client Supabase
/types              → Types TypeScript partagés
```
