---
title: "FE-0004: One shared address input with VietMap suggestions"
status: accepted
date: 2026-11-04
related: [FE-0003-vietmap-raster-tiles.md]
---

# FE-0004: One shared address input with VietMap suggestions

- **Status:** Accepted
- **Date:** 2026-11-04

## Context
Registration, the shipping address book and seller pickup addresses all need an address, and stall creation will need one too. A free text box cannot give the `WardId` that the API and GHN require, and separate selects are slow to fill.

## Decision
Every address form uses `AddressFields` from `features/address`. It is a controlled component that holds province, district, ward, street and coordinates, and shows the map unless `withMap` is false.

- Province, district and ward use `AddressAutocomplete` over our own catalog. It shows the rest of the name inline. Enter, Tab or the right arrow accepts, and focus moves to the next field. Search ignores accents and accepts initials such as `hcm`.
- The street field asks VietMap `autocomplete/v3`. Picking a result fills the area and the pin.
- Picking a province, district or ward flies the map there through VietMap `search/v3`.
- `AddressMap` follows the FengDesk picker on MapLibre: place search, fullscreen, zoom buttons, my location, coordinate chip and a pulsing pin.
- A map click, pin drag or map search uses VietMap `reverse/v3` to fill the area and street. Names are matched to our catalog in `findLocation`.
- `AddressMap` is lazy loaded, so MapLibre only loads with a form that shows it.
- Registration saves the address after OTP, as the first default `Address` row. It sends `User.Address` empty.

## Consequences
- Without `VITE_VIETMAP_API_KEY` the catalog fields and the map still work, but street suggestions and map autofill do not.
- The VietMap key is visible in the browser, as the tile key already is. Restrict it by domain before production.
- VietMap can return an area the catalog does not match. The form then keeps what it matched and asks the user to pick the rest.

## Alternatives considered
- Plain selects, as in FengDesk: simple, but slower and no search.
- A backend proxy for VietMap: hides the key, but adds an API for something the browser can call directly.
