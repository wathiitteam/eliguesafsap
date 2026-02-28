## Quartier FC

Plateforme de tournois et championnats eFootball (Konami) pour un groupe d’amis du quartier.

### Stack

- **Frontend** : Next.js 14 (App Router), TypeScript, Tailwind CSS, composants style shadcn/ui
- **Backend/DB** : Supabase (PostgreSQL, Auth, Realtime, Storage)
- **Notifications** : Supabase Realtime + Web Push API (PWA)
- **Déploiement** : Vercel (frontend) + Supabase (backend)

### Installation

1. Installer les dépendances :

```bash
npm install
```

2. Copier le fichier d’exemple d’environnement :

```bash
cp .env.example .env.local
```

3. Renseigner dans `.env.local` :

- `NEXT_PUBLIC_SUPABASE_URL`
- `NEXT_PUBLIC_SUPABASE_ANON_KEY`
- `SUPABASE_SERVICE_ROLE_KEY`
- `NEXT_PUBLIC_SITE_URL`
- `VAPID_PUBLIC_KEY` / `VAPID_PRIVATE_KEY`

4. Créer le schéma Supabase :

- Aller dans **SQL Editor** sur Supabase
- Coller le contenu de `supabase/schema.sql`
- Exécuter le script

5. Lancer l’app en local :

```bash
npm run dev
```

Puis ouvrir `http://localhost:3000`.

### Déploiement

- **Frontend** : connecter le repo à Vercel, définir les variables d’environnement (`Settings` → `Environment Variables`).
- **Supabase** : déployer le script `supabase/schema.sql` sur le projet de prod, configurer les clés (anon + service role) côté Vercel.
# eliguesafsap
