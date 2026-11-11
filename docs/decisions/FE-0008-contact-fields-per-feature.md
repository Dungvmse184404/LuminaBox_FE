---
title: "FE-0008: Contact name and phone belong to each feature"
status: accepted
date: 2026-11-11
related: [FE-0004-shared-address-fields.md, FE-0006-partner-registration-wizard.md]
---

# FE-0008: Contact name and phone belong to each feature

- **Status:** Accepted
- **Date:** 2026-11-11
- **Supersedes / Superseded by:** Partly supersedes FE-0006 (the pickup address no longer uses `ContactAddressFields`)

## Context
`ContactAddressFields` bundled a contact name, a phone number and `AddressFields` into one component. The address book, the partner pickup address and the profile page all used it, so every place had to show the same two contact inputs with the same labels, even where they make no sense (the profile already knows the user's name and phone).

## Decision
- The only shared address component is `AddressFields` (FE-0004): province, district, ward, street and the map picker.
- `ContactAddressFields` is removed. Each feature owns its contact data, labels and validation:
  - Address book (`AddressFormModal`): "Tên người nhận" / "Tên liên hệ lấy hàng" and a phone input.
  - Partner registration (`PickupAddressFields` in `features/partner`): pickup contact and phone; the draft keeps the same `{ contactName, phone, address }` shape, so drafts already in session storage still load.
  - Profile (`DefaultAddressSection`): no contact inputs; the receiver is the signed-in user (`fullName`, `phone`), and a phone input appears only when the profile has none.
- Phone numbers are checked with `PHONE_PATTERN` from `features/auth/validation.ts`.

## Consequences
- A new screen that needs an address renders `AddressFields` and adds only the fields it really needs.
- The contact inputs are no longer identical everywhere; their wording follows the screen.

## Alternatives considered
- Keep `ContactAddressFields` with props to hide the contact inputs – the component keeps growing options for each caller.
