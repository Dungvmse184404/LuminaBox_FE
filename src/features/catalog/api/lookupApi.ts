import { request } from "@/lib/api";
import type { ListParams, Paged } from "@/types/api";
import type { Lookup, LookupKind, LookupPayload } from "../types";

const PATH: Record<LookupKind, string> = { category: "/cake-categories", filling: "/fillings" };

export const lookupApi = {
  list: async (kind: LookupKind, params: ListParams) => {
    const { data } = await request<Paged<Lookup>>(PATH[kind], { query: { ...params } });
    return data!;
  },

  create: async (kind: LookupKind, payload: LookupPayload) => {
    const { data } = await request<Lookup>(PATH[kind], { method: "POST", body: payload, auth: true });
    return data!;
  },

  update: async (kind: LookupKind, id: string, payload: LookupPayload) => {
    const { data } = await request<Lookup>(`${PATH[kind]}/${id}`, { method: "PUT", body: payload, auth: true });
    return data!;
  },

  remove: async (kind: LookupKind, id: string) => {
    await request(`${PATH[kind]}/${id}`, { method: "DELETE", auth: true });
  },
};
