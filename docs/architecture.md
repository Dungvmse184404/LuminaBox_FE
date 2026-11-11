---
title: Frontend architecture
status: accepted
updated: 2026-11-10
related: [conventions.md, routing-and-access.md, mock-layer.md, ../../localDocs/api/conventions.md]
---

# Frontend architecture (`LuminaBox_FE`)

Shared docs (product, data model, API, decisions) live in `../localDocs/`: see [`README.md`](./README.md#shared-docs).

## Stack
React 19 · TypeScript (strict) · Vite · **Tailwind CSS v4** (`@tailwindcss/vite`) · react-router-dom v7 · TanStack Query · react-hook-form + zod · lucide-react · **pnpm**.

| Script | Purpose |
|---|---|
| `pnpm dev` | dev server on `http://localhost:5173` |
| `pnpm build` | `tsc -b && vite build` |
| `pnpm type-check` | `tsc -b` |

Alias `@/` → `src/`.

## Environment
All variables are read in `src/lib/env.ts` only. Copy `.env.example` to `.env` (git-ignored).

| Variable | Purpose |
|---|---|
| `VITE_API_BASE_URL` | BE base URL, default `http://localhost:5187/api` |
| `VITE_USE_MOCK` | `true` = requests are answered by `src/mocks`, no BE needed |
| `VITE_SUPABASE_URL`, `VITE_SUPABASE_BUCKET` | public image bucket (read-only URLs) |
| `VITE_VIETMAP_API_KEY`, `VITE_VIETMAP_TILEMAP_KEY` | map and geocoding; restrict both keys by domain |

Never put a Supabase key in the FE. Uploads go through the BE (BE ADR-0015).

## Structure
| Path | Role |
|---|---|
| `src/app/` | `App.tsx` (providers), `router.tsx` (route table) |
| `src/lib/api.ts` | `request<T>()`: unwraps `ApiResult`, throws `ApiError(message, status, code)`, refreshes the token on 401 (concurrent 401s share one refresh), maps network failures to `ApiError` status `0` |
| `src/lib/` | `env`, `errors` (status / message from any error), `storage` (public image URLs), `cn` |
| `src/types/api.ts` | `Paged<T>` and `ListParams`, the single definition of every list contract |
| `src/features/<module>/` | `api/` (only place that calls `request()`), `hooks/` (TanStack Query), `components/`, `pages/`, `types.ts` |
| `src/features/auth/` | `AuthContext`, `RequireRole`, role types, shared password / phone / OTP rules (`validation.ts`) |
| `src/features/account/` | Profile page: personal info, change password, organizer shop profile |
| `src/features/uploads/` | `POST api/uploads` client and `ImageUploadButton` (type and size checked before upload) |
| `src/features/store/` | Organizer overview (`/store`): reads other modules' endpoints and computes the stats on the client until the BE has a stats endpoint |
| `src/features/home/` | home page: feature tiles (role-aware), category shortcuts, partner call-to-action, about. The hero carousel is not built yet: it will be driven by events (see BE `status/open-items.md`). Featured stalls and products are added when their APIs exist; a section renders only when it has data |
| `src/components/ui/` | `Button`, `Input` / `Textarea` / `Select`, `Modal`, `Card`, `StatusBadge`, `Pager`, `SearchInput`, `Toast`, skeleton / empty / error states, `StorageImage` |
| `src/components/layout/` | `AppLayout`, `ContentLayout`, `StoreLayout` (Organizer), `AdminLayout` (Manager), `Header` (top bar, logo + search + actions, navigation, category menu), `HeaderSearch`, `AccountMenu`, `EffectSettingsMenu`, `Footer`, `BackToTop`, `Container`, `PageHeader` |
| `src/components/ambient/` | `AmbientBackground`: clouds and ASCII fluid, see [`styling.md`](./styling.md#background-effects) |
| `src/lib/appearance.ts`, `src/lib/asciiFluid.ts` | effect settings store and the fluid solver |
| `src/components/feedback/ErrorPage.tsx` | shared shell of every error page |
| `src/pages/` | route pages that belong to no feature; `pages/errors/` holds the error pages |
| `src/mocks/` | optional mock layer, see [`mock-layer.md`](./mock-layer.md) |

A feature owner works inside `src/features/<module>/` and adds its routes to `router.tsx`. Shared code (`components/ui`, `lib`) changes only through a PR that says so.

## Data flow
```
page / component ──▶ hook (features/<m>/hooks)  ──▶ api module (features/<m>/api) ──▶ request() ──▶ BE
        ▲                    TanStack Query                                              │
        └────────────────────────── ApiResult unwrapped, ApiError on failure ◀──────────┘
```

## To verify
- `Paged<T>` field names must match the BE `Pagination<T>` JSON once the BE exists.
- FE `CurrentUser` fields must match the BE `UserResponse`.
