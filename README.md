# Nsokoze

Réservation en ligne pour salons de coiffure et de beauté au Burundi.
MVP gratuit : agenda salon + page publique de réservation partageable sur WhatsApp.

("Nsokoze" ≈ « coiffe-moi » en kirundi — nom de travail, renomme comme tu veux.)

## Stack

- **Supabase** : PostgreSQL + Auth + RPC (pas de backend à héberger)
- **React (Vite)** : PWA, un seul front pour les clientes et les salons
- Hébergement front : Vercel ou Netlify (gratuit)

## Mise en route

### 1. Supabase

1. Crée un projet sur [supabase.com](https://supabase.com) (free tier).
2. SQL Editor → New query → colle le contenu de `supabase/migrations/001_init.sql` → Run.
3. Authentication → Providers → Email : **désactive "Confirm email"** pour le MVP
   (sinon chaque salon devra cliquer un lien de confirmation).
4. Settings → API : note l'URL du projet et la clé `anon`.

### 2. Front

```bash
npm install
cp .env.example .env   # puis remplis les deux valeurs
npm run dev
```

### 3. Parcours de test

1. `http://localhost:5173/pro` → crée un compte (email + mot de passe).
2. Renseigne le salon (nom, téléphone, quartier) → ta page est créée.
3. Onglet **Services & horaires** : ajoute 2-3 services et les horaires de la semaine.
4. Ouvre le lien public `http://localhost:5173/s/<ton-slug>` (affiché dans l'agenda)
   → réserve un créneau comme une cliente.
5. Retour sur l'agenda : le RDV apparaît, tu peux le marquer terminé / annulé / absent.

## Architecture — points clés

- **Réservation publique = RPC uniquement.** La fonction `book_appointment`
  (SECURITY DEFINER) valide service, horaires et conflits dans une transaction.
  Aucune insertion directe possible depuis le client anonyme (RLS).
- **Anti double-réservation** : contrainte d'exclusion GiST `no_overlap` sur
  `tstzrange(starts_at, ends_at)` — même en cas de course, Postgres tranche.
- **Vie privée** : les créneaux occupés sont exposés via la vue `occupied_slots`
  (heures uniquement, jamais les noms/téléphones).
- **RDV manuels** : le salon enregistre aussi les RDV pris par téléphone,
  via la même RPC (mêmes vérifications), marqués `source = 'manual'`.
- **Fuseau** : les vérifications d'horaires se font en `Africa/Bujumbura` côté SQL.

## Limites connues du MVP (volontaires)

- Un salon = un agenda (pas de multi-employés) → première feature payante logique.
- Pas de rappels SMS → deuxième source de revenus, à ajouter via Edge Function
  + un agrégateur SMS local.
- Pas de paiement/acompte → brancher Lumicash plus tard (tu as déjà un stub côté
  DoctoBurundi).
- `.env.example` fourni ; ne commite jamais ton `.env`.

## Déploiement

```bash
npm run build
```

Déploie `dist/` sur Vercel/Netlify. Ajoute les deux variables d'environnement
dans les settings du projet. Configure une redirection SPA
(`/* → /index.html`) — fichier `vercel.json` déjà inclus.
