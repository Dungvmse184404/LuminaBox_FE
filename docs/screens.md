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
| Product list and detail (`/products`) | `catalog.md`, `cart.md` (Flow 8) | `GET api/products`, `GET api/products/{id}` |
| Cake sets (`/cake-sets`) | `cart.md` (Flow 8, 9) | `GET api/products`, `GET api/box-items`, `GET api/box-items/{id}/available-products` |
| Cart (`/cart`) | `cart.md` | `api/carts/me`, `api/carts/items/...` |
| Public stalls (`/stalls`) | `stall-rental.md` (Flow 4), `organizer.md` (Flow 2) | `GET api/stalls`, `GET api/stalls/{id}` |
| Become a partner (`/become-partner`) | `organizer.md` (Flow 2) | `api/organizer-registrations` |
| Vouchers (`/vouchers`) | `voucher.md` | `GET api/vouchers/available` |
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
