# LuminaBox frontend documentation

Entry point for the **frontend-only** docs. AI agents: start at [`../AGENTS.md`](../AGENTS.md).
Product, data model, API and shared decisions are documented once, in the BE repo (see [Backend docs](#backend-docs)).

## Map
| Page | Answers |
|---|---|
| [`architecture.md`](./architecture.md) | Stack, environment variables, folder structure, data flow |
| [`conventions.md`](./conventions.md) | Language, comments, code style, forms, lists, git |
| [`routing-and-access.md`](./routing-and-access.md) | Route table, role guards, error pages |
| [`screens.md`](./screens.md) | Screen ↔ BE flow ↔ endpoints |
| [`styling.md`](./styling.md) | Design tokens, utilities, animation rules |
| [`mock-layer.md`](./mock-layer.md) | Working without a BE, and how to remove the mocks |
| [`design/color-sketch.html`](./design/color-sketch.html) | Color palette sketch (open in a browser) |
| [`decisions/`](./decisions/) | Frontend-only ADRs (`FE-NNNN`) |
| [`guides/local-development.md`](./guides/local-development.md) | Run the frontend locally |

## Backend docs
Both repos are cloned side by side, so BE docs are at `../LuminaBox_BE/docs/` (from the repo root). GitHub URL: to be filled once the BE repo is published.

| Need | BE doc |
|---|---|
| What a feature must do | `docs/product/features/<context>.md`, `docs/product/business-rules.md` |
| Status values and lifecycles | `docs/product/enums.md` |
| Tables and relationships | `docs/architecture/data-model.md`, `docs/architecture/data-model-schema.txt` |
| API envelope, errors, pagination | `docs/api/conventions.md` |
| GHN / VNPay / Supabase | `docs/architecture/integrations/` |
| Why the system is designed this way | `docs/decisions/` |
| Branches, commits, PR checklist | `docs/CONTRIBUTING.md` |

## Source of truth
| Fact | Lives in |
|---|---|
| Business behaviour, data, API | BE repo |
| Frontend structure, routes, styling, mocks | this folder |

## Maintaining the docs
- **Frontmatter** on every page: `title`, `status` (`draft` / `accepted` / `deprecated`), `updated`, `related`.
- Do not copy enums, rules, DTOs or endpoint contracts from the BE docs; link to them.
- Same PR rule: a change to routes, structure, tokens or the mock layer updates the matching page here.
- Keep pages ≲ 300 lines.
