---
title: Mock layer
status: accepted
updated: 2026-11-03
related: [architecture.md, decisions/FE-0001-isolated-mock-layer.md]
---

# Mock layer (optional, removable)

Lets the FE be built before the BE exists. With `VITE_USE_MOCK=true`, `request()` hands every call to `src/mocks/server.ts`, which matches routes registered in `src/mocks/handlers/<module>.ts`. Responses have the same shape as the BE (`ApiResult`, `Paged<T>`, `ApiError`).

A floating **Mock** switcher (bottom-left) signs in as `User`, `Organization`, `Manager` or guest.

## Add a handler
```ts
mock("GET", "/cake-categories/:id", ({ params }) => findCategory(params.id));
```
- Throw `mockError(409, "message")` to simulate a business error.
- Use `paginate()` and `listParams()` for lists.
- Import the new handler file in `src/mocks/handlers/index.ts`.
- Mirror the real contract from the BE flow docs; do not invent fields.

## Remove the mocks completely
1. Delete the `src/mocks/` folder.
2. `src/app/App.tsx`: delete the `DevTools` lazy import, the `{DevTools && ...}` block, and the now unused `lazy`, `Suspense`, `env` imports.
3. `src/lib/api.ts`: delete the `if (env.useMock) { ... }` block in `request()`.
4. `src/lib/env.ts`: delete the `useMock` line.
5. `.env.example`: delete the `VITE_USE_MOCK` lines.

`pnpm type-check` must pass afterwards. Nothing else references the mocks, and they are loaded only by dynamic import, so a production build never ships them.
