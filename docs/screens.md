---
title: Screens and the endpoints they use
status: accepted
updated: 2026-11-11
related: [routing-and-access.md, ../../localDocs/product/features/README.md]
---

# Screens and the endpoints they use

This page only maps a screen to its flow and the endpoints it needs. Request / response fields, rules and errors are defined once, in `localDocs/product/features/`, and are not repeated here.

| Screen (route) | BE flow file | Endpoints (names as in the flow file) |
|---|---|---|
| Login (`/login`) | `identity.md` | `api/auth/login`, `register`, `verify-otp`, `refresh-token`, `logout` |
| Forgot password (`/forgot-password`) | `identity.md` | `api/auth/forgot-password`, `api/auth/reset-password` |
| My profile (`/account/profile`) | `identity.md`, `organizer.md` | `GET`, `PUT api/users/me`, `PUT api/users/me/password`; `GET`, `PUT api/organizers/me` (Organization only); `GET api/addresses/me?type=Shipping`, `POST api/addresses` (address book, not `User.Address`) |
| Product list and detail (`/products`, `?stallId=&stall=`) | `catalog.md`, `cart.md` (Flow 8) | `GET api/products`, `GET api/products/{id}`, `GET api/cake-categories`, `GET api/fillings`, `POST api/carts/items/product` (also used by buy now, which then opens `/checkout` with that line) |
| Cake sets (`/cake-sets`) | `cart.md` (Flow 8, 9) | `GET api/box-items`, `POST api/carts/items/box` (also used by buy now) |
| Cart (`/cart`) | `cart.md` | `api/carts/me`, `api/carts/items/...` |
| Checkout (`/checkout`) | Flow 9, 10 | `api/carts/me`, `api/addresses/me`, `api/vouchers/my`, `api/shipping/fee-estimate`, `POST api/orders/from-cart`, `POST api/payments/checkout` |
| My orders (`/orders`) | Flow 9, 11 | `GET api/orders/me`, `GET api/orders/{id}`, `PUT api/orders/{id}/cancel`, `POST api/payments/checkout` |
| Store overview (`/store`) | `organizer.md`, Flow 11 | `GET api/users/me` (`OrganizerBrandName`, `OrganizerStatus`), `GET api/orders/organizer/me` (all pages, counted on the client), `GET api/stall-rentals/me`, `GET api/products/me`, `GET api/box-items/me` (total count only) |
| Store orders (`/store/orders`) | Flow 11 | `GET api/orders/organizer/me`, `GET api/orders/{id}`, `PUT api/orders/{id}/confirm`, `reject`, `cancel`, `ship` (creates the GHN waybill; the detail shows `GhnOrderCode`, `GhnStatus`), `mark-delivered` |
| AI assistant (floating widget on every page, signed in) | `integrations/ai-chat.md` | hub `/hubs/ai-chat` `StreamChat`; `GET`, `POST api/ai-chat/rooms`, `PUT`, `DELETE api/ai-chat/rooms/{id}`, `GET api/ai-chat/rooms/{id}/messages`, `POST api/ai-chat/rooms/{id}/messages/{messageId}/rollback` |
| Points of sale (`/stalls`) | `stall-rental.md` (Flow 4), `catalog.md` | `GET api/stalls`, `GET api/products?stallId=` (cakes sold at the picked stall) |
| Become a partner (`/become-partner`, `/become-partner/stalls`, `/become-partner/confirm`) | `organizer.md` (Flow 2) | `POST api/organizer-registrations`, `GET api/organizer-registrations/me`, `PUT api/organizer-registrations/{id}/confirm`, `PUT api/organizer-registrations/{id}/cancel`, `POST api/organizer-registrations/additional-stalls`, `POST api/organizer-registrations/additional-online`, `GET api/stalls`, `POST api/addresses` (pickup, after the online request) |
| Partner registrations management (`/admin/registrations`) | `organizer.md` (Flow 2) | `GET api/organizer-registrations`, `GET api/organizer-registrations/{id}`, `PUT api/organizer-registrations/{id}/approve`, `PUT api/organizer-registrations/{id}/reject` |
| Vouchers (`/vouchers`) | `voucher.md` | `GET api/vouchers/available`, `POST api/vouchers/{id}/claim`, `GET api/vouchers/my`, `DELETE api/vouchers/my/{id}` |
| My products (`/store/products`) | `catalog.md` (Flow 5) | `api/products/me`, `api/products`, `api/products/{id}/items`, `api/product-items/{id}` (+ `images`, `price-tiers`, `stocks`), `api/products/{id}/status`; stock rows come from `GET api/stalls/me`; images via `POST api/uploads` |
| Combo boxes (`/store/boxes`) | `catalog.md` (Flow 5) | `api/box-items/me`, `api/box-items`, `api/box-items/{id}` (+ `status`, `images`, `price-tiers`, `stocks`); stock rows come from `GET api/stalls/me`; images via `POST api/uploads` |
| Cake categories and fillings (`/admin/catalog`, `?tab=fillings`) | `catalog.md` (FR-5.1) | `GET`, `POST api/cake-categories`, `PUT`, `DELETE api/cake-categories/{id}`; the same for `api/fillings` |
| Address book (`/account/addresses`) | `address.md` (Flow 16) | `api/addresses/me`, `api/addresses`, `api/addresses/{id}`, `.../default`, `api/provinces`, `api/provinces/{id}/districts`, `api/districts/{id}/wards` |
| Pickup addresses (`/store/pickup-addresses`) | `address.md` (Flow 16) | same address endpoints, `Type = Pickup` (Organizer only) |
| Stalls (`/admin/stalls`) | `stall-rental.md` (Flow 4) | `GET`, `POST api/stalls`, `PUT`, `DELETE api/stalls/{id}`, `GET api/stalls/{id}/rentals`, `PUT api/stall-rentals/{id}/terminate`, location endpoints (address picker) |
| My stalls (`/store/stalls`) | `stall-rental.md` (Flow 4) | `GET api/stall-rentals/me`, `GET api/stalls` (address and price of each rented stall) |

Rules:
- Add a row when a screen is added; remove it when the screen goes.
- If a flow file and this table disagree, the flow file is right: fix this table.
- A screen that needs an endpoint the flow does not list is a `localDocs/` change first, then FE.
