# AGENTS.md – rules for AI coding agents (LuminaBox_FE)

Entry point for any AI agent (Claude Code, Codex, local models). Keep this file short; details live in `docs/`.
This repo documents the **frontend only**. Product, data model, API, seed data and shared decisions live in **`../localDocs/`** (the folder beside this repo). It is the only shared docs folder we work with: read and update shared docs there, and **never edit `LuminaBox.BE/docs`** (see `docs/decisions/FE-0007-shared-docs-in-localdocs.md`).

## Communication
- The user writes in **Vietnamese**: answer in Vietnamese, **short, bulleted, bold key terms**.
- **Do not guess.** Missing context or ambiguous request → ask specific questions. No invented facts.

## Before changing anything
1. **Scan the codebase first** (`.codegraph` when present; otherwise search the code).
2. **Read the relevant docs** using the routing table below, including the flow file in `../localDocs/product/features/` for the feature.
3. **Analyse impact** on routes, role guards, shared UI (`components/ui`) and the BE contract.

## Where to look
| Task | Read |
|---|---|
| What a feature must do | `../localDocs/product/features/<context>.md` + `../localDocs/product/business-rules.md` |
| Status values / lifecycles | `../localDocs/product/enums.md` |
| API envelope, errors, pagination | `../localDocs/api/conventions.md` |
| Data model, integrations (GHN, VNPay, Supabase storage) | `../localDocs/architecture/` |
| Seed accounts and demo data | `../localDocs/seed/README.md` |
| Shared decisions, open issues | `../localDocs/decisions/`, `../localDocs/status/issue-log.md` |
| Structure, env, data flow | `docs/architecture.md` |
| Naming, comments, forms, lists | `docs/conventions.md` |
| Routes, guards, error pages | `docs/routing-and-access.md` |
| Which endpoints a screen uses | `docs/screens.md` |
| Colors, tokens, animation | `docs/styling.md` |
| Mock layer | `docs/mock-layer.md` |
| Why the frontend is built this way | `docs/decisions/` |
| Branch, commit and PR rules | `../localDocs/CONTRIBUTING.md` |
| Run locally | `docs/guides/local-development.md` |

## Keeping docs in sync (mandatory)
- Change to routes, structure, tokens or the mock layer → update the matching page in `docs/` in the **same PR**.
- Change to schema, API, enums or business rules → update **`../localDocs/`** (the flow file in `product/features/`, `enums.md`, `business-rules.md`, `api/` or `architecture/`; log a delegated choice in `status/issue-log.md`). Never edit `LuminaBox.BE/docs`, and never copy contract details into FE docs.
- A frontend-only decision with lasting impact → add `docs/decisions/FE-NNNN-*.md` (`template.md`). Never edit an accepted record; supersede it.

## Conventions (summary – see `docs/conventions.md`)
- Code, identifiers, file names and routes **100% English** (routes kebab-case); text shown to the user is Vietnamese.
- **No usage instructions on screen** (how-to notes, keyboard tips) unless the user asks for them. See `docs/conventions.md`.
- **No code comments** unless a mistake would be dangerous (security, data loss). Prefer clear names.
- Call the BE only through `src/features/<module>/api/*.ts` (`request()`); never `fetch` inside components.
- Colors, shadows and radii come from tokens in `src/index.css`; do not hard-code them.
- Secrets never in source; `.env` is git-ignored, commit only `.env.example`. Never put a Supabase key in the FE.
