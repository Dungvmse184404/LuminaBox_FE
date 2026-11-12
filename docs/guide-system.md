---
title: On-screen guides
status: proposed
updated: 2026-11-11
related: [architecture.md, ../../localDocs/architecture/integrations/ai-chat.md]
---

# On-screen guides (`src/features/guide/`)

The AI assistant (or a `?guide=<id>` link) can lead the user to a screen. The AI only picks a **guide id**; the FE knows where it is.

## Flow
1. `runGuide("add_address")` from `useGuide()`, or the URL `/?guide=add_address`. With parameters: `runGuide("search_products", { params: { query: "bánh nướng" } })` or `/?guide=search_products&guide_query=bánh nướng`.
2. `guides.ts` reads the guide from `guide-overrides.json` and maps it to a target node; `navigationMap.ts` gives its page and roles. Excluded target or wrong role → nothing happens.
3. Guide with URL parameters (`urlParams`) → always **jump** to `page?<query>` (e.g. `/products?q=bánh nướng`; the page fills its search box from the URL).
4. Otherwise screen ≥ `--lb-guide-walk-min-width` (= Tailwind `--breakpoint-lg`, 64rem) → **walk** (below); smaller screens, or no path → **jump**.

Timings and sizes (find timeout 4 s, highlight 10 s, idle 30 s, ring gap, …) live in `guideConfig.ts`.

### Jump
- Other page → `navigate(node.page)` (the `guide` and `guide_*` query params are dropped).
- `highlight.ts` waits up to 4 s for `[data-guide="<node id>"]`, scrolls it to the centre and marks it.
- The highlight ends on any pointer down (the click still goes through) or after 10 s.

### Highlight look
- `markGuideElement` sets `data-guide-active` and draws a **gold ripple ring** (`.lb-guide-ring`) as an overlay in `body` that follows the element (so `overflow: hidden` parents cannot clip it), with the element's corner radius + 4 px.
- Colour = `--lb-guide-color` (default `--color-gold`, like the stall map pins); the ring pulses outward every 1.2 s, static under reduced motion.

### Walk (desktop)
- `paths.ts` finds the shortest path (BFS over `next`) from a node rendered on the current page to the target. Start nodes are nodes of this page that are not revealed by another node in place (menu items start hidden behind `account-menu`). Only `nav` and `opener` nodes are passed through; excluded nodes and nodes outside the user's role are skipped.
- `walk.ts` highlights each step. A `nav` step shows a countdown badge (`lb-guide-countdown`) and is clicked for the user when it ends; other kinds wait for the user's click. The target is highlighted like in jump mode, never clicked.
- Countdown = **Hướng dẫn tự chuyển bước** in the effect settings menu (`guideCountdown` in `lib/appearance.ts`, 0 / 2 / 3 / 5 / 8 s, default 3). 0 or reduced motion → no auto-click, the user clicks each step.
- Cancel the whole walk: pointer down outside the highlighted element, any key except Tab / Shift (Enter / Space on the element are allowed), a new guide, or 30 s without action.
- A step whose element does not appear within 4 s (e.g. "Quản lý địa chỉ" exists only when the user has an address) → fall back to jump.

## Navigation map
Every node is one element carrying `data-guide="<id>"`.

| Field | Meaning |
|---|---|
| `page` | Route pattern where the element is rendered; `null` = inside `data-guide-scope="global"` (header, footer), `/store/*` = inside `data-guide-scope="/store/*"` (the store side nav) |
| `opens` | Route reached by clicking it (links) |
| `next` | Nodes the user can click after clicking this one (menu items, the opened page's targets) |
| `roles` | Only these roles see the element; checked before running a guide |
| `kind` | `nav` (links, menus, tabs), `opener` (opens a form / modal: Thêm, Sửa, Đổi mật khẩu), `action` (Lưu, Gửi), `danger` (Xóa, Hủy, Thanh toán, Đăng xuất), `input`, `section` (a form card). Only `nav` may ever be auto-clicked (`canAutoClick`); only `nav` / `opener` can be steps of a walk |

### Where the map comes from
`NAV_NODES` = `navigationMap.generated.json` (crawler, below) + `MANUAL_NODES` in `navigationMap.ts` (empty today; an escape hatch for nodes no mock scenario can show; they are linked into the `next` of every node that opens their page) + overrides. `locate.ts` is shared by the crawler and the runner, so ids are computed the same way in both; nodes without `data-guide` are found at run time by role + accessible name + page scope.

## Overrides (`guide-overrides.json`)
The only hand-written part besides `MANUAL_NODES`; kept when the map is regenerated.

```json
{
  "exclude": ["address-book-add", "profile-*"],
  "kinds": { "profile-address-manage": "opener" },
  "guides": {
    "add_address": { "target": "address-book-add", "label": "Sổ địa chỉ", "description": "Add, edit or choose a default delivery address" },
    "search_products": { "target": "products-search", "label": "Sản phẩm", "description": "Find cakes…", "params": { "query": { "urlKey": "q", "description": "…" } } }
  }
}
```

- `exclude`: node ids, `*` matches anything. An excluded node stays in the map but a guide targeting it never runs, it is not sent to the AI, and it never auto-clicks. Use it to stop the AI from sending users somewhere without removing the button.
- `kinds`: change a node's kind (e.g. make a `nav` node highlight-only).
- `guides`: what the AI can offer. `target` = node id; `label` (Vietnamese page name) and `description` (English, for the model); `params` map a parameter to the URL query key the page reads. No roles here: they come from the target node.

## Guides offered to the AI
`useAvailableGuides()` returns `{ id, label, description, params }` for every guide whose target exists, is not excluded and fits the user's role. The chat client sends it as `guides` in every request; the AI service has no list of its own and offers only those (see `localDocs/architecture/integrations/ai-chat.md`).

## Add a guide
1. Optional but recommended for important targets: `data-guide="<node-id>"` on the element (kebab-case, stable), so renaming its text does not break the guide. Without it the id is `<page>#<role>:<slug of the text>`.
2. `pnpm guide:crawl --check` to refresh the map; copy the target id from `navigationMap.generated.json`.
3. Add the guide to `guides` in `guide-overrides.json`. Nothing to change in the AI service.
4. `pnpm guide:crawl --check` again: every guide must be `OK` (exit code 1 when a target is missing).

## Crawler (`pnpm guide:crawl`)
`scripts/guide-crawl.mjs` draws the map from the real UI, for the **whole app**, and writes `src/features/guide/navigationMap.generated.json` (committed; review its diff in the PR). About 2 min.

- Starts Vite in mock mode on port 5181 and a headless Chromium (1280 px, reduced motion; requests to other hosts are blocked, map tiles get an empty image).
- One pass per role (`User`, `Organization`, `Manager`) through the mock switcher (`[data-mock-role]`). Guests are skipped: the AI chat needs a login.
- Then one pass per role and **mock scenario** (`MOCK_SCENARIOS` in `src/mocks/scenario.ts`), only on that scenario's `routes`. Example: `no-addresses` shows "Thêm địa chỉ" on the profile, the default data shows "Quản lý địa chỉ"; both end up in the map.
- Waits for a **ready signal** instead of fixed delays: no pending mock request (`pendingMockRequests()`), no `.lb-skeleton` and no `[aria-busy="true"]` for two polls of 100 ms (max 5 s).
- Pages: every static route of the router (`listGuideRoutes()`, routes with `handle.guide === false` excluded) + every internal link found. Paths are mapped to patterns with `matchRoutes` on the real route table (`/products/<id>` → `/products/:id`, visited once). A page that renders `[data-error-page]` or redirects is not crawled; redirects are listed as `INFO` (e.g. `/become-partner/confirm` needs the earlier steps).
- Every role tries every route: when access differs from the route's `handle.roles` (403 where the handle allows it, or the page opens where it should not), `--check` warns.
- Element ids, names, kinds and page scope come from `src/features/guide/locate.ts` (imported into the page), the same code the runner uses. Elements inside `[data-guide-ignore]` (the mock switcher) are skipped.
- Per page it **reads** links (`href`), buttons, tabs, radios, inputs and `[data-guide]` elements. It **clicks only** menu / dropdown / tab triggers (`aria-haspopup`, `aria-expanded`, `role=tab`), records what appears as their `next`, then restores the page. Nothing is submitted; links are never clicked. Each global trigger is explored once per role.
- Ids: `data-guide` when present, otherwise `<page or "global">#<role>:<slug of the name>` (e.g. `/admin/catalog#button:xoa-banh-chay`); links to an id route collapse to one node `<page>#link:/products/:id`.
- Names: `data-guide-label` → `aria-label` → for inputs the `<label>`, then the placeholder → the text. Elements whose text holds a count or a long card body declare `data-guide-label` (header icon links, home tiles, partner cards, tab buttons, stall filter chips, countdown radios).
- `page`: the nearest `data-guide-scope` (`global` → `null`; `Header`, `Footer` and `SideNavLayout` declare it, side navs get `guideScope` from `StoreLayout` / `AdminLayout`), else the route pattern. `roles` is omitted when all three roles saw the node.
- Kind (declared, not guessed from the text): `data-guide-kind` wins — `Button` sets `danger` for its `danger`, `dangerOutline`, `dangerGhost` variants, and other dangerous controls declare it themselves (ghost delete icons, the logout item); link → `nav`; menu / tab trigger → `nav`; submit or radio → `action`; input / combobox → `input`; `[data-guide]` card → `section` (or `input` when it holds one input); other buttons → `opener` (never auto-clicked).
- A name that **starts** with Xóa / Hủy / Thanh toán / Đăng xuất but is not declared `danger` is only reported by `--check`.
- Limits: elements that depend on data appear only in a mock scenario that has that state — add a scenario (and its mock data) rather than a manual node. Triggers without `aria-expanded` / `aria-haspopup` are not explored — add the attribute (done for "Danh mục").
- `pnpm guide:crawl --check` also lists every guide with the roles taken from its target (`OK` / `MANUAL` / `BROKEN`) and exits with code 1 when a guide target is missing. Warnings (no failure): guide targets without `data-guide`, `exclude` / `kinds` entries that match no node, danger-looking names not declared `danger`, names guessed from long text, names containing numbers (a count would change the id), route access that differs from `handle.roles`; plus `MANUAL_NODES` the crawler now finds. Today: 155 nodes, 7 / 7 guides `OK`, no warning.

## Not built yet
Optional CI job that runs `pnpm guide:crawl --check` on each PR (see [`localDocs/architecture/integrations/ai-guide-plan.md`](../../localDocs/architecture/integrations/ai-guide-plan.md)).
