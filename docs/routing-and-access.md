---
title: Routing and access
status: accepted
updated: 2026-11-03
related: [architecture.md, screens.md, ../../LuminaBox_BE/docs/product/overview.md]
---

# Routing and access

Roles come from the BE (`Role` claim): `User`, `Organization` (Organizer), `Manager`. The guard in the FE only hides screens; the BE enforces access.

## Route table
| Route | Role | Layout | Flow (BE docs) | Status |
|---|---|---|---|---|
| `/` | public | `AppLayout` | – | built |
| `/login`, `/register` | public | `AppLayout` | Flow 1 | built (login, register, OTP; forgot password not yet) |
| `/products`, `/products/:id` | public | `AppLayout` | Flow 8 | built (list with hover and pin filter, tag search, suggestions; detail; the GHN fee is shown at checkout only) |
| `/cake-sets` | public | `AppLayout` | Flow 8, 9 | built (list, add to cart; cakes are picked at checkout) |
| `/stalls`, `/stalls?stall=<id>` | public | `AppLayout`, full screen with a compact footer | Flow 4 | built (map, list, detail, rental timeline; submit waits for the registration API) |
| `/become-partner` | public | `AppLayout` | Flow 2 | stub |
| `/cart` | signed in | `AppLayout` | Flow 8 | built |
| `/checkout?items=<ids>` | signed in | `AppLayout` | Flow 9, 10 | built |
| `/orders`, `/orders/:id` | signed in | `AppLayout` | Flow 9, 11 | built |
| `/payment/result` | public | `AppLayout` | Flow 10 | built |
| `/vouchers` | signed in | `AppLayout` | Flow 6, 7 | built |
| `/help/ordering`, `/policies/returns`, `/policies/commission` | public | `AppLayout` | – | stub |
| `/account/addresses` | signed in | `AppLayout` | Flow 16 | built |
| `/store` | `Organization` | `StoreLayout` | – | stub |
| `/store/orders`, `/store/orders/:id` | `Organization` | `StoreLayout` | Flow 11 | built |
| `/store/products` | `Organization` | `StoreLayout` | Flow 5 | stub |
| `/store/boxes` | `Organization` | `StoreLayout` | Flow 5 | stub |
| `/store/pickup-addresses` | `Organization` | `StoreLayout` | Flow 16 | built |
| `/admin` | `Manager` | `AdminLayout` | – | stub |
| `/admin/catalog` | `Manager` | `AdminLayout` | Flow 5 (FR-5.1) | reference implementation (mock only) |
| `/admin/stalls` | `Manager` | `AdminLayout` | Flow 4 | stub |
| `/unauthorized`, `/forbidden`, `/server-error`, `*` | public | `AppLayout` | – | built |

Flow files: `LuminaBox_BE/docs/product/features/` (see [`screens.md`](./screens.md) for the endpoint each screen uses). Update this table in the same PR that adds or changes a route.

The background effect (`AmbientBackground`) lives in `AppLayout`, so public pages share one continuous background; `/store` and `/admin` do not show it.

Public pages other than the home page and `/login` are wrapped by `ContentLayout` (container with page gutters). `/store` and `/admin` pages get their container from `SideNavLayout`.

## Guards
`RequireRole` wraps a route group:
- no session → redirect to `/login` (the original path is kept in router state);
- signed in with the wrong role → the 403 page, no redirect;
- `roles` omitted → any signed-in user.

## Error pages
`errorElement` on the layout route renders `RouteErrorPage`, which maps the error status to a page:

| Status | Page |
|---|---|
| 0 (network failure) | `NetworkErrorPage` |
| 401 | `UnauthorizedPage` |
| 403 | `ForbiddenPage` |
| 404 and unknown routes | `NotFoundPage` |
| anything else | `ServerErrorPage` (the message is shown in dev builds only) |

All of them use the shared `ErrorPage` shell. The pages are also reachable directly at `/unauthorized`, `/forbidden`, `/server-error`. Inside a page, render `<StatusErrorPage error={error} />` to show the full-page version for a failed query.
