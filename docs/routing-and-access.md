---
title: Routing and access
status: accepted
updated: 2026-11-11
related: [architecture.md, screens.md, ../../localDocs/product/overview.md]
---

# Routing and access

Roles come from the BE (`Role` claim): `User`, `Organization` (Organizer), `Manager`. The guard in the FE only hides screens; the BE enforces access.

## Route table
| Route | Role | Layout | Flow (`localDocs`) | Status |
|---|---|---|---|---|
| `/` | public | `AppLayout` | – | built |
| `/login`, `/register`, `/forgot-password` | public | `AppLayout` | Flow 1 | built (login, register, OTP, forgot / reset password; `/forgot-password` also works signed in, from the profile page, and signs out after the reset) |
| `/products`, `/products/:id` | public | `AppLayout` | Flow 8 | built (list with hover and pin filter, tag search, suggestions; detail; the GHN fee is shown at checkout only) |
| `/cake-sets` | public | `AppLayout` | Flow 8, 9 | built (boxes sold on their own: list, add to cart) |
| `/stalls`, `/stalls?stall=<id>` | public | `AppLayout`, full screen with a compact footer | Flow 4 | built ("Điểm bán": open stalls on the map and the cakes sold at each; renting lives in `/become-partner/stalls`) |
| `/become-partner`, `?type=stall`, `?type=online`, `?tab=requests` | public; sending needs a login | `AppLayout` > `ContentLayout` | Flow 2 | built (choice, shop details, pickup address, my requests; FE-0006) |
| `/become-partner/stalls` | public, needs a draft with stalls | `AppLayout`, full screen with a compact footer | Flow 2, 4 | built (shared `RentalMap`) |
| `/become-partner/confirm` | signed in | `AppLayout` > `ContentLayout` | Flow 2 | built (summary, sends each request, retries failed ones) |
| `/cart` | signed in | `AppLayout` | Flow 8 | built |
| `/checkout?items=<ids>` | signed in | `AppLayout` | Flow 9, 10 | built |
| `/orders`, `/orders/:id` | signed in | `AppLayout` | Flow 9, 11 | built |
| `/payment/result` | public | `AppLayout` | Flow 10 | built |
| `/vouchers` | signed in | `AppLayout` | Flow 6, 7 | built |
| `/help/ordering`, `/policies/returns`, `/policies/commission` | public | `AppLayout` | – | stub |
| `/account/profile` | signed in | `AppLayout` | Flow 1, Flow 3, Flow 16 | built (personal info, default shipping address from the address book, password; shop profile for `Organization`) |
| `/account/addresses` | signed in | `AppLayout` | Flow 16 | built |
| `/store` | `Organization` | `StoreLayout` | – | built (overview: stats from orders, rentals, products, boxes) |
| `/store/orders`, `/store/orders/:id` | `Organization` | `StoreLayout` | Flow 11 | built |
| `/store/products` | `Organization` | `StoreLayout` | Flow 5 | built (images uploaded through `POST api/uploads`) |
| `/store/boxes` | `Organization` | `StoreLayout` | Flow 5 | built |
| `/store/stalls` | `Organization` | `StoreLayout` | Flow 4 | built |
| `/store/pickup-addresses` | `Organization` | `StoreLayout` | Flow 16 | built |
| `/admin` | `Manager` | `AdminLayout` | – | stub |
| `/admin/catalog`, `?tab=fillings` | `Manager` | `AdminLayout` | Flow 5 (FR-5.1) | built |
| `/admin/stalls` | `Manager` | `AdminLayout` | Flow 4 | built |
| `/unauthorized`, `/forbidden`, `/server-error`, `*` | public | `AppLayout` | – | built |

Flow files: `localDocs/product/features/` (see [`screens.md`](./screens.md) for the endpoint each screen uses). Update this table in the same PR that adds or changes a route.

The background effect (`AmbientBackground`) lives in `AppLayout`, so public pages share one continuous background; `/store` and `/admin` do not show it.

Public pages other than the home page and `/login` are wrapped by `ContentLayout` (container with page gutters). `/store` and `/admin` pages get their container from `SideNavLayout`.

## Guards
`RequireRole` wraps a route group:
- no session → redirect to `/login` (the original path is kept in router state);
- signed in with the wrong role → the 403 page, no redirect;
- `roles` omitted → any signed-in user.

## After login
`pathAfterLogin` (`src/features/auth/homePath.ts`) picks where `/login` sends a signed-in user:
- `Manager` → `/admin`; `Organization` → `/store`. The saved `from` path is kept only when it is inside that area.
- `User` → the saved `from` path, otherwise `/`.

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
