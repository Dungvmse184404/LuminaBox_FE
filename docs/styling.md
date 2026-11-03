---
title: Styling
status: accepted
updated: 2026-11-03
related: [architecture.md, conventions.md]
---

# Styling

Tailwind CSS v4. Tokens live in `src/index.css` under `@theme` and become utilities (`bg-cream`, `text-ink-soft`, `border-line`, `rounded-card`, `shadow-pop`...).

| Group | Tokens |
|---|---|
| Surface | `cream` (page background, warm `#f3e4d3`), `cream-dark`, `card` (milky white `#fbf5ea` for cards, inputs, menus; there is no pure white) |
| Brand | `primary` (red, buttons), `primary-dark` (garnet `#7d2a2d`: headings, gradients, fluid ink), `primary-soft` (text on red) |
| Chrome (header and footer) | `chrome` `#7d2a2d`, `chrome-light` `#8c3336` (bottom of the header gradient), `chrome-deep` `#341618` (darkest tile) |
| Accent | `gold` `#f2c744` (bright: lines and ornaments on red, active nav underline), `gold-deep` `#c49a1c` (gold on light surfaces, e.g. fluid ink) |
| Text and lines | `ink`, `ink-soft`, `ink-muted`, `line` |
| Status | `success`, `warning`, `danger`, `info` |
| Font | `font-sans` (Inter), `font-serif` (Merriweather, headings) |
| Shape / depth | `rounded-card`, `shadow-primary`, `shadow-card`, `shadow-pop`, `max-w-(--page-max)` |
| Easing | `--ease-soft` |

## Density
- Root font size is `15px`, so every `rem`-based size is slightly smaller than the browser default: more of the page fits on screen without scrolling.
- Content width is `--page-max: 76rem` (1140 px). On wider screens the free side margins are where the fluid effect runs.
- Header rows are `h-8` (top bar), `h-14` (logo, search, actions) and `h-10` (navigation); the footer uses `py-8`.
- To tune the density change `font-size` on `html` or `--page-max`; do not scale individual components.

## Header and footer
The header and the footer use `chrome` (the header fades to `chrome-light` at the bottom). A thin `gold` line (`lb-hairline`) closes the header and opens the footer, and the footer casts a soft shadow upward so the red bars blend into the page. Text on them is `primary-soft` (white on hover or active), the top bar is a darker overlay, the active navigation item has a `gold` underline, and menus open as milky `card` panels. The search field stays milky white on the red bar.

## Base layer
Focus ring on `:focus-visible`, text selection color, pointer cursor on enabled buttons, responsive media, no link underline, `scrollbar-gutter: stable`.

## Utilities and classes
| Name | Use |
|---|---|
| `lb-card` | milky surface with border, radius and card shadow |
| `lb-card-hover` | lift and highlight on hover |
| `lb-scrollbar` | thin themed scrollbar |
| `lb-page-enter` | page transition (enter only, so there is no empty frame) |
| `lb-fade-in` | simple fade for menus and overlays |
| `lb-skeleton` | shimmer for loading placeholders |
| `lb-flash` | short glow to draw attention to a just-picked item |
| `lb-ambient`, `lb-cloud-1..6`, `lb-rail`, `lb-rail-blur`, `lb-rail-tint`, `lb-clouds-paused` | background layer of `AmbientBackground` (clouds and the content rail) |

Every animation is disabled under `prefers-reduced-motion`.

## Background effects
`components/ambient/AmbientBackground.tsx` draws drifting clouds (CSS) and an ASCII fluid on a canvas (`lib/asciiFluid.ts`). The fluid runs in the free margins beside the content rail (`--page-max`) and is skipped under the rail. It is only active with a fine pointer (mouse) and without `prefers-reduced-motion`. Click in a margin to start or stop the cursor trail.

- Mounted once in `AppLayout`, so it stays alive (same canvas) while the route changes. It is not rendered under `/store` and `/admin`, where dense tables need a plain background (`PLAIN_SECTIONS` in `AppLayout`).
- The header **Hiệu ứng** menu switches between the presets *Đầy đủ* and *Rút gọn* (fluid off). Settings are stored in `localStorage` (`luminabox.effects`) by `lib/appearance.ts`; the other knobs (fps, drift, rail mode, cloud mode, rail surface) exist there but have no UI.
- The ink color comes from `--color-primary-dark` and `--color-gold`; change the tokens, not the component.

## Palette sketch
`design/color-sketch.html` compares several palettes on the same layout (current red, softened garnet, milk with red accent, terracotta, burgundy, midnight blue, jade). Open it in a browser or through the dev server at `/docs/design/color-sketch.html`. It is a sketch only. The chosen palette is **B, softened garnet**; its values are the tokens above. Another palette is adopted by changing the tokens in `index.css`.

## Ornaments
Traditional corner ornament traced from the reference artwork: two interlocking gold lines (the outer and the inner frame line) that weave into a square knot at the corner, then run off along both edges. It is one SVG in `components/ornament/CornerOrnament.tsx` (two `<path>` elements, 120 × 120 viewBox, `currentColor`). The lines are not cut off: a radial mask fades them out toward the far end of each edge. `CornerFrame` places it in any `relative` container and mirrors it per corner (`tl`, `tr`, `bl`, `br`); use only the corners that are empty.

| Where | Corners | Size |
|---|---|---|
| Partner section (home) | top right | `card` |
| Footer | bottom left, bottom right | `edge` |

Nowhere else: the header and the tiles stay plain.

- `edge` ornaments sit in the free side space outside the content (`--lb-corner-size`, at most `8rem`). The size shrinks to zero as the window narrows, so they disappear on small screens instead of overlapping content.
- `card` ornaments are fixed at `size-20`; place them only where no text is underneath.
- They are decoration only: `aria-hidden` and `pointer-events-none`.

## Rules
- Do not hard-code colors, shadows or radii in components; add a token to `@theme` instead.
- Do not use `white` or `bg-white`; use `card` so surfaces stay milky.
- Reuse `components/ui` before writing new markup for buttons, fields, modals, badges, pagers.
- Mobile first: layouts must work at 375 px; `Container` gives the page gutters.
