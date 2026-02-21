# Copilot Instructions for MonAdmin

## Project Overview

**MonAdmin** is an AI-powered administrative assistant for seniors. Users scan their postal mail (letters, bills, administrative notices) with their phone camera; the app analyses the document with AI and explains it in plain language, with text-to-speech support, urgency indicators, and family-sharing features.

The repository contains two sub-projects:

| Directory | Purpose | Runtime |
|-----------|---------|---------|
| `mobile/` | Expo / React Native mobile app | Bun |
| `backend/` | REST API | Bun + Hono |

---

## Mobile App (`mobile/`)

### Stack

- **Expo SDK 53**, React Native 0.76, **Bun** (not npm or yarn)
- **React Query** (`@tanstack/react-query`) for server/async state
- **Zustand** for local state
- **NativeWind** + Tailwind v3 for styling
- **react-native-reanimated v3** for animations (preferred over `Animated`)
- **react-native-gesture-handler** for gestures
- **lucide-react-native** for icons
- **Supabase** (`@supabase/supabase-js`) for cloud persistence
- **RevenueCat** (`react-native-purchases`) for premium subscriptions
- **Expo Router** (file-based routing under `src/app/`)

### Project Structure

```
mobile/src/
├── app/
│   ├── (tabs)/
│   │   ├── _layout.tsx     # Tab navigation
│   │   ├── index.tsx       # Home screen
│   │   ├── scanner.tsx     # Document scanner
│   │   └── documents.tsx   # Document list
│   ├── resultat.tsx        # Analysis result
│   ├── vocal.tsx           # Voice mode
│   ├── premium.tsx         # Premium subscription
│   ├── confidentialite.tsx # Privacy policy
│   ├── cgu.tsx             # Terms of service
│   ├── faq.tsx             # FAQ
│   └── _layout.tsx         # Root layout
├── components/             # Reusable UI components
└── lib/
    ├── state/              # Zustand stores
    │   ├── document-store.ts
    │   ├── history-store.ts
    │   ├── family-store.ts
    │   └── settings-store.ts
    ├── services/           # Business logic
    │   ├── ai-service.ts
    │   ├── supabase-sync.ts
    │   ├── offline-service.ts
    │   └── notification-service.ts
    ├── supabaseClient.ts
    ├── revenuecatClient.ts
    └── types.ts
```

### Key Conventions

- **Package manager**: always use `bun`, never `npm` or `yarn`
- **TypeScript strict mode** — include all required properties; use `useState<Type[]>([])` not `useState([])`
- **Styling**: NativeWind classNames via `className` prop; use `cn()` from `src/lib/cn.ts` for conditional/merged classNames. `CameraView`, `LinearGradient`, and `Animated` components do **not** support `className` — use `style` prop.
- **Navigation**: Expo Router file-based. Only ONE route can map to `/`. Never delete `RootLayoutNav` from `src/app/_layout.tsx`.
- **State**: React Query for server/async state (always use object API: `useQuery({ queryKey, queryFn })`). Zustand for local state — always use a selector that returns a primitive.
- **Safe Area**: import from `react-native-safe-area-context`, not from `react-native`.
- **Gestures/interactions**: use `Pressable` over `TouchableOpacity`; use custom modals, not `Alert.alert()`.
- **Do not install new packages** unless they are `@expo-google-fonts/*` or pure-JS utilities (lodash, dayjs, etc.).
- **Forbidden files** (do not edit): `patches/`, `babel.config.js`, `metro.config.js`, `app.json`, `tsconfig.json`, `nativewind-env.d.ts`

### Supabase Tables

| Table | Content |
|-------|---------|
| `documents` | Scanned and analysed documents |
| `history_actions` | User action history |
| `family_members` | Family members / carers |
| `shared_documents` | Documents shared with family |
| `settings` | User settings (JSON) |

Required environment variables: `EXPO_PUBLIC_SUPABASE_URL`, `EXPO_PUBLIC_SUPABASE_ANON_KEY`

### Document Categories & Urgency

Categories: **Santé** (health), **Énergie** (energy), **Pension** (retirement), **Banque** (banking)

Urgency levels: 🟢 Low (keep), 🟠 This week (action needed), 🔴 Urgent (immediate action)

### Running the Mobile App

```bash
cd mobile
bun install
bun run start        # Expo dev server (port 8081)
bun run lint         # ESLint
bun run typecheck    # TypeScript check
```

---

## Backend API (`backend/`)

### Stack

- **Bun** runtime, **Hono** web framework, **Zod** validation

### Project Structure

```
backend/src/
├── index.ts        # App entry, middleware, route mounting
└── routes/         # Route modules
```

### Key Conventions

- All endpoints **must** be prefixed with `/api/`
- Create route files in `src/routes/` and mount them in `src/index.ts`
- Use `@hono/zod-validator` + `zod` for request validation
- After `bun add <package>`, commit the updated `package.json` and `bun.lock` immediately

### Running the Backend

```bash
cd backend
bun install
bun run dev          # Hot-reload dev server
bun run typecheck    # TypeScript check
```

---

## Design Principles

The app targets **seniors** — design must be accessible:

- Large, readable text (Nunito font)
- Large touch targets (min 72 px height)
- High-contrast colours
- No complex gestures
- Coloured urgency indicators (green / orange / red)

---

## Language

The app UI and AI analysis are **multilingual**: French (default), English, Spanish. When adding user-facing strings, add translations for all three languages.
