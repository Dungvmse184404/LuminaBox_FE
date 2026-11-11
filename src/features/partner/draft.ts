import { useSyncExternalStore } from "react";
import { EMPTY_ADDRESS, type AddressValue } from "@/features/address/components/AddressFields";
import type { PlanSnapshot } from "@/features/stalls/hooks/useRentalPlan";

export type SellKind = "stall" | "online";

export interface PickupValue {
  contactName: string;
  phone: string;
  address: AddressValue;
}

export const EMPTY_PICKUP: PickupValue = { contactName: "", phone: "", address: EMPTY_ADDRESS };

const isPickupEmpty = (value: PickupValue) =>
  !value.contactName.trim() && !value.phone.trim() && !value.address.wardId && !value.address.addressLine.trim();

export interface PartnerDraft {
  kinds: SellKind[];
  brandName: string;
  contactPhone: string;
  businessInfo: string;
  pickup: PickupValue;
  rental: PlanSnapshot | null;
}

const KEY = "luminabox.partner-draft";

export const EMPTY_DRAFT: PartnerDraft = {
  kinds: [],
  brandName: "",
  contactPhone: "",
  businessInfo: "",
  pickup: EMPTY_PICKUP,
  rental: null,
};

function load(): PartnerDraft {
  try {
    const raw = sessionStorage.getItem(KEY);
    return raw ? { ...EMPTY_DRAFT, ...(JSON.parse(raw) as Partial<PartnerDraft>) } : EMPTY_DRAFT;
  } catch {
    return EMPTY_DRAFT;
  }
}

let draft = load();
const listeners = new Set<() => void>();

function persist(next: PartnerDraft) {
  try {
    sessionStorage.setItem(KEY, JSON.stringify(next));
    return true;
  } catch {
    return false;
  }
}

function save(next: PartnerDraft) {
  draft = next;
  persist(next);
  listeners.forEach((listener) => listener());
}

export const updateDraft = (patch: Partial<PartnerDraft>) => save({ ...draft, ...patch });

export const clearDraft = () => save(EMPTY_DRAFT);

const subscribe = (listener: () => void) => {
  listeners.add(listener);
  return () => listeners.delete(listener);
};

export const usePartnerDraft = () => useSyncExternalStore(subscribe, () => draft);

export const hasPickup = (value: PartnerDraft) => !isPickupEmpty(value.pickup);
