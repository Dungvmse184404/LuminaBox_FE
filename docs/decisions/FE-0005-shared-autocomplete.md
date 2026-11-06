---
title: "FE-0005: One shared autocomplete for address and search inputs"
status: accepted
date: 2026-11-06
related: [FE-0004-shared-address-fields.md]
---

# FE-0005: One shared autocomplete for address and search inputs

- **Status:** Accepted
- **Date:** 2026-11-06

## Context
Search bars had no suggestions, while address fields already showed the rest of a name inline. Search needs the same behaviour, but a search bar must keep what the user typed instead of forcing a choice.

## Decision
`components/ui/Autocomplete` holds the matching, inline completion and list. `AddressAutocomplete` only adds address rules (unit prefixes). `SearchInput` takes `suggestions` to turn it on.

Passing `onSubmit` switches to search mode:
- Enter searches the typed text. It picks a suggestion only after the user moved to it with the arrow keys.
- Tab and the right arrow accept the inline completion and keep the focus in the input.
- The list opens only after the user types.

## Consequences
- A form field that holds a picked value must not pass `onSubmit`.
- Suggestions match text without accents, but BE `search` is accent sensitive, so typed text without accents can return no results until the BE changes.
- Product suggestions come from the first 50 products.

## Alternatives considered
- A separate search component: it would duplicate the keyboard and inline completion logic.
- Asking the BE on every keystroke: more requests, not needed at the current catalog size.
