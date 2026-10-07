# Nsokoze

Réservation en ligne pour salons de coiffure et de beauté au Burundi.
MVP gratuit : agenda salon + page publique de réservation partageable sur WhatsApp.

("Nsokoze" ≈ « coiffe-moi » en kirundi — nom de travail, renomme comme tu veux.)

## Stack

- **Supabase** : PostgreSQL + Auth + RPC + Realtime + Storage (pas de backend à héberger)
- **React (Vite)** : PWA, un seul front pour les clientes et les salons
- Hébergement front : Netlify (recommandé : aperçus de liens via Edge Function) ou Vercel

## Mise en route

### 1. Supabase

1. Crée un projet sur [supabase.com](https://supabase.com) (free tier).
2. SQL Editor → New query → exécute **dans l'ordre** chaque fichier de
   `supabase/migrations/` (`001_init.sql` → `011_comptes_rdv_avis.sql`).
   `008`/`009` (articles d'exemple) sont facultatives.
3. Authentication → Providers → Email : **désactive "Confirm email"** pour le MVP
   (sinon chaque salon devra cliquer un lien de confirmation).
4. Authentication → URL Configuration :
   - **Site URL** : l'URL de production (ex. `https://nsokoze.bi`) ;
   - **Redirect URLs** : ajoute `https://<ton-domaine>/mot-de-passe` et
     `http://localhost:5173/mot-de-passe` (lien « mot de passe oublié »).
5. Settings → API : note l'URL du projet et la clé `anon` / publishable.

### 2. Te rendre administrateur (blog + KPI)

Crée ton compte sur le site, puis dans le SQL Editor :

```sql
insert into admins (user_id)
select id from auth.users where email = 'ton-email@exemple.com';
```

Tu accèdes alors à `/admin/blog` et `/admin/kpi`.

### 3. Front

```bash
npm install
cp .env.example .env   # puis remplis les deux valeurs
npm run dev
```

Avant la mise en ligne, complète les coordonnées et l'éditeur du site dans
`src/lib/config.js` (affichés sur « À propos » et les pages légales), et fais
relire les textes de `src/pages/Legal.jsx`.

### 4. Parcours de test

1. `http://localhost:5173/pro` → crée un compte (email + mot de passe).
2. Renseigne le salon (nom, téléphone, quartier) → ta page est créée.
3. Onglet **Services & horaires** : ajoute 2-3 services et les horaires de la semaine.
4. Dans une fenêtre privée, ouvre le lien public `http://localhost:5173/s/<ton-slug>`
   → crée un compte client et réserve un créneau.
5. L'agenda du salon affiche le RDV **en direct** (bandeau « Nouveau rendez-vous »).
6. Côté cliente, « Mon compte » liste le RDV, permet de l'annuler (jusqu'à 2 h avant)
   puis, une fois passé, de laisser un avis — visible sur la page du salon.

## Scripts

| Commande | Rôle |
|---|---|
| `npm run dev` | serveur de développement |
| `npm run build` | build de production + `dist/sitemap.xml` et `dist/robots.txt` |
| `npm run lint` | ESLint |
| `npm test` | tests unitaires (Vitest) : calcul des créneaux, fuseau horaire |
| `node scripts/icones.mjs` | régénère icônes PWA et image de partage (`npm i --no-save sharp` d'abord) |

## Architecture — points clés

- **Réservation = RPC uniquement.** `book_appointment` (SECURITY DEFINER) valide
  service, horaires et conflits dans une transaction. Appelée par une cliente, elle
  lit le nom/téléphone dans **son profil** (jamais ceux envoyés par le navigateur),
  rattache le RDV à son compte (`appointments.user_id`) et plafonne les RDV à venir
  (3 par salon, 10 au total). Appelée par le gérant, elle crée un RDV `manual`.
- **Anti double-réservation** : contrainte d'exclusion GiST `no_overlap` sur
  `tstzrange(starts_at, ends_at)` — même en cas de course, Postgres tranche.
- **Vie privée** : créneaux occupés via la vue `occupied_slots` (heures seulement),
  avis via la vue `avis_publics` (prénom seulement).
- **Avis** : uniquement via `laisser_avis`, pour un RDV passé de la cliente, un seul par RDV.
- **Fuseau** : tout est calculé en `Africa/Bujumbura`, côté SQL **et** côté front
  (`src/lib/temps.js`) — une cliente de la diaspora voit les mêmes heures que le salon.
- **Temps réel** : l'agenda pro s'abonne aux changements de `appointments`
  (filtrés par RLS) ; alertes navigateur activables.
- **SEO / partage** : titre et balises Open Graph par page (`useMeta`) ; pour les
  robots WhatsApp/Facebook, `netlify/edge-functions/apercu.js` réécrit le HTML de
  `/s/:slug` et `/blog/:slug` (nom, description, photo).
- **PWA** : `public/sw.js` (réseau d'abord pour les pages, cache pour `/assets`,
  jamais de cache pour les données Supabase).
- **Styles** : `src/styles.css` importe les feuilles de `src/styles/` par zone.

## Limites connues du MVP (volontaires)

- Un salon = un agenda (pas de multi-employés) → première feature payante logique.
- Rappels : bouton « Rappel WhatsApp » pré-rempli dans l'agenda pour les RDV du jour
  et du lendemain. Les rappels **automatiques** par SMS restent à brancher
  (Edge Function planifiée + agrégateur SMS local).
- Le numéro de téléphone du profil n'est pas vérifié (pas d'OTP SMS).
- Pas de paiement/acompte → brancher Lumicash plus tard.
- `.env.example` fourni ; ne commite jamais ton `.env`.

## Déploiement

**Netlify** (recommandé) : relie le dépôt ; `netlify.toml` configure le build,
la redirection SPA, les en-têtes de cache et l'Edge Function d'aperçu.
Variables d'environnement : `VITE_SUPABASE_URL`, `VITE_SUPABASE_ANON_KEY`
(et `SITE_URL` si le domaine n'est pas celui fourni par Netlify).

**Vercel** : `vercel.json` gère la redirection SPA et les en-têtes ; l'Edge
Function d'aperçu est spécifique à Netlify (sur Vercel, les liens partagés
afficheront l'aperçu générique du site).
