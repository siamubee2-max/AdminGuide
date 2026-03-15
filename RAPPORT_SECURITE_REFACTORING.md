# AdminGuide (MonAdmin) — Rapport de sécurité et refactoring

**Date** : 15 mars 2026  
**Commit** : `4d79748` — `feat: security audit fixes + architecture refactoring`

---

## 1. Corrections de sécurité critiques

### 1.1 Clés API retirées de `eas.json`

Les clés suivantes étaient exposées en clair dans `mobile/eas.json` et ont été supprimées :

| Clé exposée | Service | Risque |
|---|---|---|
| `EXPO_PUBLIC_VIBECODE_ANTHROPIC_API_KEY` | Anthropic Claude | Utilisation frauduleuse, facturation |
| `EXPO_PUBLIC_VIBECODE_OPENAI_API_KEY` | OpenAI | Utilisation frauduleuse, facturation |
| `EXPO_PUBLIC_VIBECODE_ELEVENLABS_API_KEY` | ElevenLabs | Utilisation frauduleuse |
| `EXPO_PUBLIC_VIBECODE_GOOGLE_API_KEY` | Google AI | Utilisation frauduleuse |
| `EXPO_PUBLIC_VIBECODE_REVENUECAT_APPLE_KEY` | RevenueCat | Manipulation abonnements |
| `EXPO_PUBLIC_VIBECODE_REVENUECAT_TEST_KEY` | RevenueCat | Manipulation abonnements |

### 1.2 Actions manuelles requises (URGENT)

> **Ces clés sont toujours visibles dans l'historique Git.** Elles doivent être révoquées immédiatement depuis les dashboards respectifs.

1. **Anthropic** : Révoquer la clé `sk-ant-api03-...` sur [console.anthropic.com](https://console.anthropic.com)
2. **OpenAI** : Révoquer la clé `sk-proj-...` sur [platform.openai.com](https://platform.openai.com)
3. **ElevenLabs** : Révoquer la clé sur [elevenlabs.io](https://elevenlabs.io)
4. **Google AI** : Révoquer la clé sur [console.cloud.google.com](https://console.cloud.google.com)
5. **RevenueCat** : Révoquer les clés `appl_...` et `test_...` sur [app.revenuecat.com](https://app.revenuecat.com)
6. **GitHub PAT** : Le commit `70f1daf` contient un token GitHub PAT dans son message — le révoquer sur [github.com/settings/tokens](https://github.com/settings/tokens)

### 1.3 Nouveau modèle de sécurité

**Avant** : Les clés API étaient envoyées au client mobile via `EXPO_PUBLIC_*` et les appels AI se faisaient directement depuis l'app.

**Après** : Toutes les clés API sont stockées côté serveur uniquement. Le mobile communique avec le backend via des endpoints proxy sécurisés.

```
Mobile App  →  Backend Proxy  →  API externe (Anthropic, OpenAI, etc.)
   (pas de clé)    (clé serveur)     (authentifié)
```

---

## 2. Architecture backend améliorée

### 2.1 Nouveaux fichiers créés

| Fichier | Description |
|---|---|
| `backend/src/routes/ai.ts` | Proxy AI : analyse de documents, speech-to-text, text-to-speech |
| `backend/src/middleware/auth.ts` | Middleware d'authentification admin + rate limiting |
| `backend/src/lib/supabase.ts` | Client Supabase avec fallback en mémoire |
| `backend/supabase_schema.sql` | Schéma SQL pour b2b_leads, newsletter_subscribers, ai_cache |
| `backend/.env.example` | Template des variables d'environnement requises |
| `.gitignore` | Protection globale contre les fuites de secrets |

### 2.2 Endpoints protégés

| Endpoint | Protection |
|---|---|
| `POST /api/b2b/contact` | Rate limit (5 req/h) |
| `POST /api/newsletter/subscribe` | Rate limit (10 req/h) |
| `POST /api/ai/*` | Rate limit (20 req/min) |
| `GET /api/b2b/leads` | Admin API Key (Bearer token) |
| `GET /api/newsletter/subscribers` | Admin API Key (Bearer token) |
| `GET /api/newsletter/stats` | Admin API Key (Bearer token) |

---

## 3. Refactoring du code mobile

### 3.1 Extraction de composants (`reglages.tsx`)

Le fichier `reglages.tsx` a été réduit de **1 432 lignes** à **~760 lignes** en extrayant :

| Composant | Fichier | Lignes |
|---|---|---|
| `ProfilSection` | `components/settings/ProfilSection.tsx` | 84 |
| `FamilleSection` | `components/settings/FamilleSection.tsx` | 211 |
| `InputField` | `components/settings/shared.tsx` | 54 |
| `ToggleRow` | `components/settings/shared.tsx` | 48 |

### 3.2 Service AI refactorisé (`ai-service.ts`)

Le fichier a été réduit de **~1 500 lignes** à **583 lignes** en :
- Supprimant tous les appels API directs (Anthropic, OpenAI, ElevenLabs)
- Remplaçant par des appels au backend proxy
- Conservant la logique locale (détection d'échéances, commandes vocales, templates)

---

## 4. Intégration Supabase

### 4.1 Backend (persistance serveur)

Les routes `newsletter` et `b2b` utilisent Supabase avec fallback automatique en mémoire si Supabase n'est pas configuré.

### 4.2 Mobile (sync client)

Le module `supabase-sync.ts` synchronise :
- Documents scannés
- Historique des actions
- Membres de la famille
- Documents partagés
- Paramètres utilisateur

---

## 5. Variables d'environnement requises

### Backend (`backend/.env`)

```env
ANTHROPIC_API_KEY=sk-ant-api03-...
OPENAI_API_KEY=sk-proj-...
ELEVENLABS_API_KEY=...
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_SERVICE_ROLE_KEY=eyJ...
ADMIN_API_KEY=your-secure-admin-api-key
JWT_SECRET=your-random-secret-min-32-chars
PORT=3000
```

### Mobile (`mobile/.env`)

```env
EXPO_PUBLIC_VIBECODE_BACKEND_URL=https://your-backend-url.run
EXPO_PUBLIC_BACKEND_URL=https://your-backend-url.run
EXPO_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
EXPO_PUBLIC_SUPABASE_ANON_KEY=eyJ...
```

---

## 6. Prochaines étapes recommandées

1. **Révoquer toutes les clés exposées** (voir section 1.2)
2. **Exécuter les schémas SQL** dans Supabase SQL Editor
3. **Configurer les variables d'environnement** sur le serveur de production
4. **Tester le déploiement** backend sur Replit/VibecodeRun
5. **Créer un build EAS** pour iOS/Android
6. **Envisager un nettoyage de l'historique Git** (BFG Repo-Cleaner) pour supprimer définitivement les clés de l'historique
