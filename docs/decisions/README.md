---
title: Frontend decision records
status: accepted
updated: 2026-11-11
related: [template.md, ../../../localDocs/decisions/README.md]
---

# Frontend decision records

Only decisions that affect the frontend alone belong here. Decisions that touch the API, data model or business rules are shared and live in `localDocs/decisions/`.

Format: [MADR](https://adr.github.io/madr/). File name `FE-NNNN-kebab-title.md`, numbered separately from the BE records. Accepted records are never edited: write a new one and mark the old one superseded.

| # | Decision | Status |
|---|---|---|
| [FE-0001](./FE-0001-isolated-mock-layer.md) | Mock layer isolated in `src/mocks` | Accepted |
| [FE-0002](./FE-0002-docs-live-in-backend-repo.md) | Shared docs live in the BE repo | Superseded by FE-0007 |
| [FE-0003](./FE-0003-vietmap-raster-tiles.md) | MapLibre with VietMap raster tiles | Accepted |
| [FE-0004](./FE-0004-shared-address-fields.md) | One shared address input with VietMap suggestions | Accepted |
| [FE-0005](./FE-0005-shared-autocomplete.md) | One shared autocomplete for address and search inputs | Accepted |
| [FE-0006](./FE-0006-partner-registration-wizard.md) | Partner registration as a three-step wizard with a session draft | Accepted, pickup fields partly superseded by FE-0008 |
| [FE-0007](./FE-0007-shared-docs-in-localdocs.md) | Shared docs live in `localDocs/`; `LuminaBox.BE/docs` is not edited | Accepted |
| [FE-0008](./FE-0008-contact-fields-per-feature.md) | Contact name and phone belong to each feature; `AddressFields` is the only shared address component | Accepted |
