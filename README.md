# LuminaBox_FE

Web frontend of **LuminaBox**, a multi-stall marketplace for mooncakes. Sellers run single-cake and combo-box shops, buyers fill one cart from several shops and check out once, and the platform earns stall rent plus a commission on online orders. Built for the PRN232 course.

> **Status: early development.** The application shell, design system, routing, error pages and the home page are in place. Most feature screens are stubs waiting for their backend flows. See [Status](#status).

## What the platform does

| Role | What they can do |
|---|---|
| **Guest** | Browse products, combo boxes, stalls and reviews |
| **User** | Build a cart across shops, pay by COD or VNPay, apply vouchers, track orders, leave reviews, manage an address book, apply to become an Organizer |
| **Organizer** | Sell online or from a rented stall: manage products and variants (crust × filling × egg count × weight), wholesale price tiers, per-stall stock, combo boxes, vouchers and orders |
| **Manager** | Approve Organizer applications, manage stalls and rentals, issue platform vouchers, settle commission, moderate reviews |

Domain highlights: products are grouped into variants with their own images and prices, stock is tracked per stall (or in an online stock), a multi-shop cart is split into one order per Organizer under a single payment, and shipping fees are estimated through the GHN fee API. The full specification lives in the backend repository (see [Documentation](#documentation)).

## Status

| Area | State |
|---|---|
| App shell: header, footer, role-aware navigation, layouts for guests, Organizers (`/store`) and Managers (`/admin`) | Built |
| Design system: tokens, UI kit (buttons, fields, modals, badges, pager, toasts, skeletons), background effects, ornaments | Built |
| Routing, role guards, error pages (401, 403, 404, 500, offline) | Built |
| Home page: feature tiles, category shortcuts, partner call-to-action, about | Built |
| Reference feature: cake categories (list, search, pagination, create form) | Built, mock data |
| Hero carousel on the home page | Waiting for the event design |
| Auth, catalog and product management, addresses, cart, checkout, orders, vouchers, feedback | Stubs |

## Tech stack

React 19 · TypeScript (strict) · Vite · Tailwind CSS v4 · React Router 7 · TanStack Query · React Hook Form + Zod · lucide-react · pnpm

## Getting started

Requirements: Node.js and [pnpm](https://pnpm.io).

```bash
pnpm install
cp .env.example .env
pnpm dev
```

The dev server runs on `http://localhost:5173`.

With `VITE_USE_MOCK=true` (the default in `.env.example`) every request is answered in the browser, so no backend is needed, and a **Mock** switcher in the bottom-left corner signs you in as a User, an Organizer, a Manager or a guest. Set it to `false` to call the real API.

### Environment variables

| Variable | Purpose |
|---|---|
| `VITE_API_BASE_URL` | Backend base URL (default `http://localhost:5187/api`) |
| `VITE_USE_MOCK` | `true` to use the in-browser mock layer |
| `VITE_SUPABASE_URL`, `VITE_SUPABASE_BUCKET` | Public image bucket (read-only URLs) |
| `VITE_VIETMAP_API_KEY`, `VITE_VIETMAP_TILEMAP_KEY` | Map and geocoding keys; restrict them by domain |

`.env` is git-ignored; only `.env.example` is committed. Never put a Supabase key in the frontend: uploads go through the backend.

### Scripts

| Command | Purpose |
|---|---|
| `pnpm dev` | Start the dev server |
| `pnpm build` | Type-check and build for production |
| `pnpm type-check` | Type-check only |
| `pnpm preview` | Serve the production build locally |

## Project structure

```
src/
  app/            providers and the route table
  components/     shared UI kit, layouts, error page shell, ornaments, background effects
  features/       one folder per module: api/, hooks/, components/, pages/, types.ts
  lib/            request() client, env, storage URLs, helpers
  mocks/          optional, removable mock backend
  pages/          route pages that belong to no feature (login, placeholders, error pages)
  types/          shared API types
docs/             frontend documentation and design sketches
```

Data flows one way: component → hook → `features/<module>/api` → `request()`. Components never call the network directly.

## Conventions

- Identifiers, file names and routes are English (routes are kebab-case); text shown to users is Vietnamese.
- No code comments unless a mistake would be dangerous.
- Colors, shadows and radii come from design tokens, never hard-coded.

Details: [`docs/conventions.md`](./docs/conventions.md).

## Documentation

**Frontend docs** in [`docs/`](./docs/README.md): architecture, conventions, routing and access, screen-to-endpoint map, styling, mock layer, and frontend decision records.

**Product, data model, API and shared decisions** live in `localDocs/`, next to this repository. `LuminaBox.BE/docs` is not edited.

```
PRN232_LuminaBox/
  localDocs/      shared docs (product, API, data model, seed, decisions)
  LuminaBox.BE/   backend
  LuminaBox_FE/   this repository
```

Start with `../localDocs/README.md`. Branch, commit and pull request rules are in `../localDocs/CONTRIBUTING.md`.

## Related

- Shared docs: `../localDocs`
- Backend: `../LuminaBox.BE`
