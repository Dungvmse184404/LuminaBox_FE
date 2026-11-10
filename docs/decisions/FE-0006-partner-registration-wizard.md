---
title: "FE-0006: Partner registration as a three-step wizard with a session draft"
status: accepted
date: 2026-11-09
related: [FE-0004-shared-address-fields.md, ../screens.md, ../routing-and-access.md]
---

# FE-0006: Partner registration as a three-step wizard with a session draft

- **Status:** Accepted
- **Date:** 2026-11-09
- **Supersedes / Superseded by:** –

## Context
Picking stalls to rent existed twice: the map with a rental timeline on `/stalls`, and a dropdown plus a modal on `/become-partner`. A seller can rent several stalls, each for its own dates, sell online, or both. The map needs the full screen, while the other steps sit in the normal content layout. `AppLayout` remounts `<main>` on every path change, so React state does not survive moving between steps or a detour to the login page.

## Decision
- `/become-partner` holds the choice (stall, online or both). Picking one opens the shop details and, for online, an optional pickup address in the same card.
- With stalls picked, the next step is `/become-partner/stalls`, a full-screen route with `RentalMap` (map, list and rental dock) from `features/stalls`. `/stalls` becomes "Điểm bán" for buyers: the same map and list in a browse mode, showing the cakes sold at each stall, with no rental dock.
- `/become-partner/confirm` shows a summary and sends the requests one by one, reporting each one, so a failed request can be sent again without repeating the ones that went through.
- The draft lives in `features/partner/draft.ts`: a small store saved in `sessionStorage`, read with `useSyncExternalStore`.
- The rental dock has no shared schedule any more: every stall keeps its own dates, at least 7 days (BR-28), and a new stall starts on the free dates nearest the full moon. Dates already rented (`bookings` on each stall) are shaded and block the next step. "Link" copies the first stall's dates to the others; the two timeline ends are edited in place at the ends of the month labels. The stall list greys the moon icon when the full-moon day is taken.

## Consequences
- The draft survives a refresh, the login detour and moving between steps, and is cleared after the requests are sent.
- A new partner sends one registration per stall, because the API takes one stall per first registration. An organizer sends one `additional-stalls` request per date range.
- The full-moon day is not required; the API checks overlaps when a manager approves and rejects rentals shorter than 7 days.
- The pickup address uses `ContactAddressFields` (contact name, phone, `AddressFields` from FE-0004 and the map picker), the same component as the address book modal.

## Alternatives considered
- A route layout holding the state in React context: lost on every step because of the remount in `AppLayout`.
- Keeping the map only on `/stalls` and the form only on `/become-partner`: two places to pick stalls, which is what this replaces.
