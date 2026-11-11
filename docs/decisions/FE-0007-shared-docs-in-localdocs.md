---
title: "FE-0007: Shared docs live in localDocs"
status: accepted
date: 2026-11-10
related: [FE-0002-docs-live-in-backend-repo.md, ../../AGENTS.md, ../../../localDocs/README.md]
---

# FE-0007: Shared docs live in localDocs

- **Status:** Accepted
- **Date:** 2026-11-10
- **Supersedes:** [FE-0002](./FE-0002-docs-live-in-backend-repo.md)

## Context
FE-0002 pointed the frontend at `../LuminaBox_BE/docs/`. In the working setup the BE repo is cloned as `LuminaBox.BE`, and its `docs/` folder (`API-by-Feature.md`, `Requirements.md`, …) is not the set the team keeps up to date. The maintained product, API, data model, seed and decision docs are in `localDocs/`, the folder beside both repos.

## Decision
`localDocs/` is the only shared docs folder. Agents and developers read shared docs there and write changes to schema, API, enums, business rules, seed data and shared decisions there. `LuminaBox.BE/docs` is not edited. `LuminaBox_FE/docs` still documents only the frontend and links to `localDocs/` instead of copying it.

## Consequences
- Links from FE docs to shared docs use the sibling path `../localDocs/...` (`../../localDocs/...` from inside `docs/`).
- A contract change made while working on the FE (for example a new field on `GET api/users/me`) is recorded in `localDocs/product/features/<context>.md`; a delegated choice also goes in `localDocs/status/issue-log.md`.
- `localDocs/` is not a git repository, so its changes are not reviewed through a PR.

## Alternatives considered
- Keep FE-0002 (`LuminaBox.BE/docs`) – those files are not the maintained set.
- Update both folders – guaranteed drift.
