export type LookupKind = "category" | "filling";

export interface Lookup {
  id: string;
  name: string;
  description: string | null;
}

export interface LookupPayload {
  name: string;
  description?: string;
}

export type Category = Lookup;
export type CategoryPayload = LookupPayload;

export const LOOKUP_LABEL: Record<LookupKind, string> = { category: "loại bánh", filling: "nhân" };
