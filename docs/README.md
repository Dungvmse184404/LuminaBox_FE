# LuminaBox frontend documentation

Entry point for the **frontend-only** docs. AI agents: start at [`../AGENTS.md`](../AGENTS.md).
Product, data model, API and shared decisions are documented once, in `../localDocs/` (see [Shared docs](#shared-docs)). Never edit `LuminaBox.BE/docs` ([FE-0007](./decisions/FE-0007-shared-docs-in-localdocs.md)).

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

## Shared docs
Shared docs are in `localDocs/`, the folder beside both repos (`../localDocs/` from the repo root). It is the only shared docs folder: read and update shared docs there, never in `LuminaBox.BE/docs`.

| Need | `localDocs/` page |
|---|---|
| What a feature must do | `product/features/<context>.md`, `product/business-rules.md` |
| Status values and lifecycles | `product/enums.md` |
| Tables and relationships | `architecture/data-model.md`, `architecture/data-model-schema.txt` |
| API envelope, errors, pagination | `api/conventions.md` |
| GHN / VNPay / Supabase | `architecture/integrations/` |
| Seed accounts and demo data | `seed/README.md` |
| Why the system is designed this way | `decisions/`, `status/issue-log.md` |
| Branches, commits, PR checklist | `CONTRIBUTING.md` |

## Source of truth
| Fact | Lives in |
|---|---|
| Business behaviour, data, API | `../localDocs/` |
| Frontend structure, routes, styling, mocks | this folder |

## Maintaining the docs
- **Frontmatter** on every page: `title`, `status` (`draft` / `accepted` / `deprecated`), `updated`, `related`.
- Do not copy enums, rules, DTOs or endpoint contracts from `localDocs/`; link to them.
- Same PR rule: a change to routes, structure, tokens or the mock layer updates the matching page here.
- Keep pages ≲ 300 lines.
