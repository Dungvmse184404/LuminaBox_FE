---
title: Frontend decision records
status: accepted
updated: 2026-11-03
related: [template.md, ../../../LuminaBox_BE/docs/decisions/README.md]
---

# Frontend decision records

Only decisions that affect the frontend alone belong here. Decisions that touch the API, data model or business rules are shared and live in `LuminaBox_BE/docs/decisions/`.

Format: [MADR](https://adr.github.io/madr/). File name `FE-NNNN-kebab-title.md`, numbered separately from the BE records. Accepted records are never edited: write a new one and mark the old one superseded.

| # | Decision | Status |
|---|---|---|
| [FE-0001](./FE-0001-isolated-mock-layer.md) | Mock layer isolated in `src/mocks` | Accepted |
| [FE-0002](./FE-0002-docs-live-in-backend-repo.md) | Shared docs live in the BE repo | Accepted |
| [FE-0003](./FE-0003-vietmap-raster-tiles.md) | MapLibre with VietMap raster tiles | Accepted |
