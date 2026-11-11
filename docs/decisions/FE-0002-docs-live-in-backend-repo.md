---
title: "FE-0002: Shared docs live in the BE repo"
status: superseded
date: 2026-11-03
related: [../README.md]
---

# FE-0002: Shared docs live in the BE repo

- **Status:** Superseded by [FE-0007](./FE-0007-shared-docs-in-localdocs.md)
- **Date:** 2026-11-03

## Context
Product rules, the data model, API conventions and ADRs describe the whole system. Keeping them in the FE repo, or copies in both, makes them drift and puts the ERD far from the code that is generated from it.

## Decision
`LuminaBox_BE/docs` is the single source of truth for product, architecture (data model, integrations), API and shared decisions, plus the ERD and its tools. `LuminaBox_FE/docs` documents only the frontend (architecture, conventions, routing, styling, mock layer, screen-to-endpoint map, FE-only decisions) and links to the BE docs instead of copying them.

## Consequences
- A change to schema, API, enums or business rules updates the BE docs in the BE PR; the FE PR links to it.
- Links from FE to BE use the sibling-clone path `../LuminaBox_BE/docs/...` (both repos cloned side by side).
- An agent working in the FE repo must also read the sibling BE docs.

## Alternatives considered
- Docs in the FE repo – far from the ERD and the code it drives.
- Full copy in both repos – guaranteed drift.
- Git submodule – extra tooling for the whole team.
