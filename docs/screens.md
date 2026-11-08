---
title: Screens and the endpoints they use
status: accepted
updated: 2026-11-03
related: [routing-and-access.md, ../../LuminaBox_BE/docs/product/features/README.md]
---

# Screens and the endpoints they use

This page only maps a screen to the BE flow and endpoints it needs. Request / response fields, rules and errors are defined once, in the BE docs (`LuminaBox_BE/docs/product/features/`), and are not repeated here.

| Screen (route) | BE flow file | Endpoints (names as in the flow file) |
|---|---|---|
| Login (`/login`) | `identity.md` | `api/auth/login`, `register`, `verify-otp`, `refresh-token`, `logout` |
| Product list and detail (`/products`) | `catalog.md`, `cart.md` (Flow 8) | `GET api/products`, `GET api/products/{id}`, `GET api/cake-categories`, `GET api/fillings`, `POST api/carts/items/product` (also used by buy now, which then opens `/checkout` with that line) |
| Cake sets (`/cake-sets`) | `cart.md` (Flow 8, 9) | `GET api/box-items`, `POST api/carts/items/box` (also used by buy now) |
| Cart (`/cart`) | `cart.md` | `api/carts/me`, `api/carts/items/...` |
| Checkout (`/checkout`) | Flow 9, 10 | `api/carts/me`, `api/addresses/me`, `api/vouchers/my`, `api/shipping/fee-estimate`, `POST api/orders/from-cart`, `POST api/payments/checkout` |
| My orders (`/orders`) | Flow 9, 11 | `GET api/orders/me`, `GET api/orders/{id}`, `PUT api/orders/{id}/cancel`, `POST api/payments/checkout` |
| Store orders (`/store/orders`) | Flow 11 | `GET api/orders/organizer/me`, `GET api/orders/{id}`, `PUT api/orders/{id}/confirm`, `reject`, `cancel`, `ship`, `mark-delivered` |
| Public stalls (`/stalls`) | `stall-rental.md` (Flow 4), `organizer.md` (Flow 2) | `GET api/stalls`, `GET api/stalls/{id}` |
| Become a partner (`/become-partner`) | `organizer.md` (Flow 2) | `POST api/organizer-registrations`, `GET api/organizer-registrations/me`, `PUT api/organizer-registrations/{id}/confirm`, `PUT api/organizer-registrations/{id}/cancel`, `POST api/organizer-registrations/additional-stalls`, `POST api/organizer-registrations/additional-online` |
| Partner registrations management (`/admin/registrations`) | `organizer.md` (Flow 2) | `GET api/organizer-registrations`, `GET api/organizer-registrations/{id}`, `PUT api/organizer-registrations/{id}/approve`, `PUT api/organizer-registrations/{id}/reject` |
| Vouchers (`/vouchers`) | `voucher.md` | `GET api/vouchers/available`, `POST api/vouchers/{id}/claim`, `GET api/vouchers/my`, `DELETE api/vouchers/my/{id}` |
| My products (`/store/products`) | `catalog.md` (Flow 5) | `api/products/me`, `api/products`, `api/products/{id}/items`, `api/product-items/{id}` (+ `images`, `price-tiers`, `stocks`), `api/products/{id}/status` |
| Combo boxes (`/store/boxes`) | `catalog.md` (Flow 5) | `api/box-items/me`, `api/box-items`, `api/box-items/{id}` (+ `status`, `price-tiers`) |
| Cake categories and fillings (`/admin/catalog`) | `catalog.md` (FR-5.1) | `api/cake-categories`, `api/fillings` |
| Address book (`/account/addresses`) | `address.md` (Flow 16) | `api/addresses/me`, `api/addresses`, `api/addresses/{id}`, `.../default`, `api/provinces`, `api/provinces/{id}/districts`, `api/districts/{id}/wards` |
| Pickup addresses (`/store/pickup-addresses`) | `address.md` (Flow 16) | same address endpoints, `Type = Pickup` (Organizer only) |
| Stalls (`/admin/stalls`) | `stall-rental.md` (Flow 4) | `api/stalls`, `api/stalls/{id}`, `api/stalls/{id}/rentals` |

Rules:
- Add a row when a screen is added; remove it when the screen goes.
- If a flow file and this table disagree, the flow file is right: fix this table.
- A screen that needs an endpoint the flow does not list is a BE docs change first (BE PR), then FE.
