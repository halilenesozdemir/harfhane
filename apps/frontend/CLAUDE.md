# Frontend — apps/frontend

Frontend-specific context. Extends root CLAUDE.md.

---

## Quick Reference

| Command | Description |
| ------- | ----------- |
| `pnpm --filter @harfhane/frontend run dev` | Start dev server (proxy to :8787) |
| `pnpm --filter @harfhane/frontend run build` | Production build |
| `pnpm --filter @harfhane/frontend run typecheck` | TypeScript check |

---

## Stack

React 19, Vite 7, TypeScript 5 (strict), Tailwind CSS 3, TanStack Query v5, Lucide React

---

## Key Files

| Path | Purpose |
| ---- | ------- |
| `src/lib/api.ts` | API client — uses `VITE_API_URL`, falls back to `/api` |
| `src/lib/auth-api.ts` | Auth-specific API calls |
| `src/lib/admin-api.ts` | Admin-specific API calls |
| `src/types/index.ts` | All frontend types + re-exports from `@harfhane/shared` |
| `src/hooks/` | Custom hooks (`use*.ts` naming) |
| `src/utils/gameLogic.ts` | Game logic + `normalizeChar` / `normalizeWord` for Turkish chars |
| `src/context/AuthContext.tsx` | Auth state (token, user) |
| `src/context/ThemeContext.tsx` | Theme state (light/dark/system) |
| `vite.config.ts` | Proxy: `/api` → `http://localhost:8787` |

---

## Critical Rules

- No emojis anywhere in UI code or user-facing text — use Lucide React icons.
- Every `<button>`, `<a>`, and `onClick` element must have `cursor-pointer` class.
- No hardcoded hex colors — use only Tailwind tokens or CSS variables.
- `VITE_API_URL` env var sets the API base URL. Never hardcode the URL in source.
- TypeScript strict mode is enforced — no `any`, no `@ts-ignore`.
- All user-facing text must use correct Turkish characters: ç, ş, ğ, ı, ö, ü, İ, Ş, Ç, Ğ, Ö, Ü.

---

## Component Patterns

- Declare components with `function` keyword, not `const` arrow functions.
- Props interface must be named `ComponentNameProps`.
- All types live in `src/types/index.ts` (frontend-local) or `packages/shared/src/` (shared with backend).
- Import shared types via `src/types/index.ts`, not directly from `@harfhane/shared`.

---

## Environment Variables

| Variable | Required | Description |
| -------- | -------- | ----------- |
| `VITE_API_URL` | Production only | API base URL (e.g. `https://api.harfhane.app/api`) |

In dev, the Vite proxy in `vite.config.ts` routes `/api` → `localhost:8787` — no env var needed.

---

## Common Gotchas

- **Turkish char normalization**: `"i".toUpperCase()` returns `"I"` (wrong). Always use `normalizeChar()` or `normalizeWord()` from `src/utils/gameLogic.ts` for any Turkish string uppercasing.
- **Shared types**: Import via `src/types/index.ts` (which re-exports from `@harfhane/shared`), not directly from the package.
- **PWA**: `vite-plugin-pwa` is configured in `vite.config.ts`. SW registration is handled in `src/utils/registerSW.ts`.
- **Routing**: React Router v6 — routes defined in `src/App.tsx`.
- **Admin routes**: Components under `src/components/admin/` — protected by auth check in `AuthContext`.
