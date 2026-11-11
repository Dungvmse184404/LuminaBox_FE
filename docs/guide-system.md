---
title: On-screen guides
status: proposed
updated: 2026-11-11
related: [architecture.md, ../../localDocs/architecture/integrations/ai-chat.md]
---

# On-screen guides (`src/features/guide/`)

The AI assistant (or a `?guide=<id>` link) can lead the user to a screen. The AI only picks a **guide id**; the FE knows where it is.

## Flow (mode "jump", built)
1. `runGuide("add_address")` from `useGuide()`, or the URL `/?guide=add_address`.
2. `guides.ts` maps the id to a target node; `navigationMap.ts` gives its page and roles.
3. Wrong role → nothing happens. Other page → `navigate(node.page)` (the `guide` query param is dropped).
4. `highlight.ts` waits up to 4 s for `[data-guide="<node id>"]`, scrolls it to the centre and sets `data-guide-active` (pulsing ring, static outline under reduced motion).
5. The highlight ends on any pointer down (the click still goes through) or after 10 s.

## Navigation map
Every node is one element carrying `data-guide="<id>"`.

| Field | Meaning |
|---|---|
| `page` | Route pattern where the element is rendered; `null` = header (every page), `/store/*` = every store page |
| `opens` | Route reached by clicking it (links) |
| `next` | Nodes the user can click after clicking this one (menu items, the opened page's targets) |
| `roles` | Only these roles see the element; checked before running a guide |
| `autoClick` | Safe to click for the user in a future "walk" mode (navigation only, never submit / delete / logout) |

Profile area today: `account-menu` → `account-menu-profile` → `profile-personal-info`, `profile-address-add`, `profile-address-manage` → `address-book-add`, `profile-shop-profile` (Organization), `profile-change-password`; `account-menu-addresses` → `address-book-add`; `account-menu-store` (Organization) → `store-nav-pickup-addresses` → `pickup-address-add`.

## Add a guide
1. Put `data-guide="<node-id>"` on the element (kebab-case, stable; never reuse an id for another element).
2. Add the node to `navigationMap.ts` and, if users should be led there, a guide id in `guides.ts`.
3. Add the same guide id with a description to `GuideCatalog` in `LuminaBox.AiService` (see `localDocs/architecture/integrations/ai-chat.md`).

## Not built yet
Planned in [`localDocs/architecture/integrations/ai-guide-plan.md`](../../localDocs/architecture/integrations/ai-guide-plan.md): node kinds (only `nav` is auto-clicked), walk mode with a 3 s countdown and cancel on any outside click, search params (`/products?q=`), a Playwright crawler that generates the map per role, and an overrides file to exclude nodes from the AI.
