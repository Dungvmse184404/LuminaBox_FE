---
title: "FE-0001: Mock layer isolated in src/mocks"
status: accepted
date: 2026-11-03
related: [../mock-layer.md]
---

# FE-0001: Mock layer isolated in `src/mocks`

- **Status:** Accepted
- **Date:** 2026-11-03

## Context
The BE does not exist yet, but screens must be built and demonstrated. Mock code scattered through features would be hard to remove later and could leak into production.

## Decision
All mock code lives under `src/mocks/` (server, per-module handlers, a dev role switcher). `request()` delegates to it only when `VITE_USE_MOCK=true`, through a dynamic import. Handlers mirror the BE contract from the shared docs. Features contain no mock code.

## Consequences
- Removal is deleting one folder plus four small edits (listed in `mock-layer.md`).
- A production build never includes the mocks.
- Handlers must be kept in step with the BE contract while the mock is in use.

## Alternatives considered
- Mock data inside each feature – spreads mock code everywhere, hard to remove.
- A separate mock server (json-server, MSW) – an extra dependency and process for a small need.
