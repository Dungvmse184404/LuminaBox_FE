---
title: Local development (frontend)
status: accepted
updated: 2026-11-03
related: [../architecture.md, ../mock-layer.md, ../../../localDocs/guides/local-development.md]
---

# Local development (frontend)

```bash
pnpm install
cp .env.example .env
pnpm dev
```

- Needs Node and pnpm. The dev server runs on `http://localhost:5173`.
- `.env` is git-ignored. `VITE_API_BASE_URL` defaults to `http://localhost:5187/api`.
- No BE yet? Keep `VITE_USE_MOCK=true`: requests are answered by `src/mocks` and a **Mock** switcher (bottom-left) signs in as any role. Set it to `false` to call the real BE. See [`../mock-layer.md`](../mock-layer.md).
- The BE must allow the FE origin (`http://localhost:5173`) in `Cors:AllowedOrigins`; its setup is in the BE guide linked above.
- Before pushing: `pnpm type-check` (and `pnpm build` for larger changes).
