---
title: Frontend conventions
status: accepted
updated: 2026-11-03
related: [architecture.md, ../AGENTS.md, ../../LuminaBox_BE/docs/CONTRIBUTING.md]
---

# Frontend conventions

## Language
- **Everything in code is English:** identifiers, file names, routes, enum values, test names. Routes are kebab-case (`/store/pickup-addresses`).
- Only text shown to the user is Vietnamese.

## UI text
- **No usage instructions on screen** unless the user asks for them: no "click here to…", keyboard tips or notes that explain how a control works.
- Labels, validation errors, status text and the reason a field is locked are fine. Never show the same rule twice at once.

## Comments
- **No comments in code.** Name things so they read well.
- Write a comment only where a mistake would be dangerous (security, data loss). Example: `RequireRole` is a UI guard and never a security boundary.

## Code style
- Function components, named exports, PascalCase component files, camelCase for the rest.
- Strict TypeScript, no `any`. Types shared by a feature live in `features/<module>/types.ts`.
- Components never call `fetch` or `request()`. Flow: component → hook in `hooks/` → `api/` module → `request()`.
- Query keys live next to the hooks that use them.
- Colors, shadows and radii come from tokens (see [`styling.md`](./styling.md)); do not hard-code them.

## Forms
Zod schema + react-hook-form + a mutation hook + a toast on the result. Reference implementation: `features/catalog/components/CategoryFormModal.tsx`.

## Lists
Filters in state → query hook → loading / error / empty / data states → `Pager`. Reset to page 1 when a filter changes. Reference implementation: `features/catalog/pages/AdminCatalogPage.tsx`.

## Git
Branches, commits and the PR checklist follow the shared [`CONTRIBUTING.md`](../../LuminaBox_BE/docs/CONTRIBUTING.md). A PR that depends on a BE change links the BE PR instead of copying contract details into FE docs.
