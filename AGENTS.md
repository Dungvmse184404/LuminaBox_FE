# AGENTS.md – rules for AI coding agents (LuminaBox_FE)

Entry point for any AI agent (Claude Code, Codex, local models). Keep this file short; details live in `docs/`.
This repo documents the **frontend only**. Product, data model, API and shared decisions live in the BE repo, cloned beside this one: `../LuminaBox_BE/docs/`.

## Communication
- The user writes in **Vietnamese**: answer in Vietnamese, **short, bulleted, bold key terms**.
- **Do not guess.** Missing context or ambiguous request → ask specific questions. No invented facts.

## Before changing anything
1. **Scan the codebase first** (`.codegraph` when present; otherwise search the code).
2. **Read the relevant docs** using the routing table below, including the BE flow file for the feature.
3. **Analyse impact** on routes, role guards, shared UI (`components/ui`) and the BE contract.

## Where to look
| Task | Read |
|---|---|
| What a feature must do | `../LuminaBox_BE/docs/product/features/<context>.md` + `business-rules.md` |
| Status values / lifecycles | `../LuminaBox_BE/docs/product/enums.md` |
| API envelope, errors, pagination | `../LuminaBox_BE/docs/api/conventions.md` |
| Structure, env, data flow | `docs/architecture.md` |
| Naming, comments, forms, lists | `docs/conventions.md` |
| Routes, guards, error pages | `docs/routing-and-access.md` |
| Which endpoints a screen uses | `docs/screens.md` |
| Colors, tokens, animation | `docs/styling.md` |
| Mock layer | `docs/mock-layer.md` |
| Why the frontend is built this way | `docs/decisions/` |
| Branch, commit and PR rules | `../LuminaBox_BE/docs/CONTRIBUTING.md` |
| Run locally | `docs/guides/local-development.md` |

## Keeping docs in sync (mandatory)
- Change to routes, structure, tokens or the mock layer → update the matching page in `docs/` in the **same PR**.
- Change to schema, API, enums or business rules → that is a **BE docs change** (BE PR); the FE PR links to it. Never copy contract details into FE docs.
- A frontend-only decision with lasting impact → add `docs/decisions/FE-NNNN-*.md` (`template.md`). Never edit an accepted record; supersede it.

## Conventions (summary – see `docs/conventions.md`)
- Code, identifiers, file names and routes **100% English** (routes kebab-case); text shown to the user is Vietnamese.
- **No code comments** unless a mistake would be dangerous (security, data loss). Prefer clear names.
- Call the BE only through `src/features/<module>/api/*.ts` (`request()`); never `fetch` inside components.
- Colors, shadows and radii come from tokens in `src/index.css`; do not hard-code them.
- Secrets never in source; `.env` is git-ignored, commit only `.env.example`. Never put a Supabase key in the FE.
